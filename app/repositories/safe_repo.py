"""Repository for managing safes and internal fund transfers."""
from app.database.connection import get_connection
from app.utils.helpers import rows_to_list, row_to_dict, now_str

def list_safes(branch_id: int = None):
    conn = get_connection()
    sql = "SELECT * FROM safes"
    params = []
    if branch_id:
        sql += " WHERE branch_id = ?"
        params.append(branch_id)
    return rows_to_list(conn.execute(sql, params).fetchall())

def create_safe(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO safes (name, balance, is_active, branch_id) VALUES (?, ?, ?, ?)",
        (data["name"], data.get("balance", 0), data.get("is_active", 1), data.get("branch_id", 1))
    )
    conn.commit()
    return cursor.lastrowid

def get_safe(safe_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM safes WHERE id = ?", (safe_id,)).fetchone()
    return row_to_dict(row) if row else None


def update_safe(safe_id: int, data: dict):
    conn = get_connection()
    fields, values = [], []
    for k in ("name", "balance", "is_active", "branch_id"):
        if k in data and data[k] is not None:
            fields.append(f"{k} = ?"); values.append(data[k])
    if not fields: return
    fields.append("updated_at = ?"); values.append(now_str())
    values.append(safe_id)
    conn.execute(f"UPDATE safes SET {', '.join(fields)} WHERE id = ?", values)
    conn.commit()


def deactivate_safe(safe_id: int):
    conn = get_connection()
    conn.execute("UPDATE safes SET is_active = 0, updated_at = ? WHERE id = ?", (now_str(), safe_id))
    conn.commit()

def transfer_funds(data: dict) -> int:
    """
    Transfers funds between two safes.
    data keys: from_safe_id, to_safe_id, amount, transferor_id, receiver_id, notes
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # 1. Check source safe balance
        source = cursor.execute("SELECT balance FROM safes WHERE id = ?", (data["from_safe_id"],)).fetchone()
        if not source or source["balance"] < data["amount"]:
            raise ValueError("Insufficient balance in source safe")

        # 2. Update source safe
        cursor.execute(
            "UPDATE safes SET balance = balance - ?, updated_at = ? WHERE id = ?",
            (data["amount"], now_str(), data["from_safe_id"])
        )

        # 3. Update destination safe
        cursor.execute(
            "UPDATE safes SET balance = balance + ?, updated_at = ? WHERE id = ?",
            (data["amount"], now_str(), data["to_safe_id"])
        )

        # 4. Record transfer
        cursor.execute(
            """INSERT INTO safe_transfers (from_safe_id, to_safe_id, amount, transferor_id, receiver_id, notes)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (data["from_safe_id"], data["to_safe_id"], data["amount"],
             data.get("transferor_id"), data.get("receiver_id"), data.get("notes"))
        )
        transfer_id = cursor.lastrowid
        
        # 5. Log activity
        cursor.execute(
            "INSERT INTO activity_logs (type, action, details, amount, reference_id) VALUES (?, ?, ?, ?, ?)",
            ("financial", "safe_transfer", f"Transfer from safe {data['from_safe_id']} to {data['to_safe_id']}", 
             data["amount"], transfer_id)
        )

        conn.commit()
        return transfer_id
    except Exception as e:
        conn.rollback()
        raise e

def get_transfers(safe_id: int = None, limit: int = 50):
    conn = get_connection()
    sql = "SELECT * FROM safe_transfers"
    params = []
    if safe_id:
        sql += " WHERE from_safe_id = ? OR to_safe_id = ?"
        params.extend([safe_id, safe_id])
    sql += " ORDER BY transfer_date DESC LIMIT ?"
    params.append(limit)
    return rows_to_list(conn.execute(sql, params).fetchall())
def get_safe_daily_summary(safe_id: int, date_str: str):
    """
    Get aggregated financial summary for a safe on a specific date.
    Calculates receipts (Sales, Services) and payments (Purchases, Expenses).
    """
    conn = get_connection()
    
    # 1. Receipts from Invoices (Cash) - Simple join for this example
    invoices = conn.execute(
        "SELECT COALESCE(SUM(paid_amount), 0) FROM invoices WHERE date(created_at) = ? AND payment_method = 'cash' AND branch_id = (SELECT branch_id FROM safes WHERE id = ?)",
        (date_str, safe_id)
    ).fetchone()[0]
    
    # 2. Payments for Purchases (Cash)
    purchases = conn.execute(
        "SELECT COALESCE(SUM(total_amount), 0) FROM purchases WHERE date = ?",
        (date_str,)
    ).fetchone()[0]
    
    # 3. Returns
    # Customer Returns (Payment back to customer)
    returns_cust = conn.execute(
        "SELECT COALESCE(SUM(refund_amount), 0) FROM returns WHERE date(created_at) = ?",
        (date_str,)
    ).fetchone()[0]
    # Supplier Returns (Receipt back from supplier)
    returns_supp = conn.execute(
        "SELECT COALESCE(SUM(total_amount), 0) FROM supplier_returns WHERE date = ?",
        (date_str,)
    ).fetchone()[0]

    # 4. Expenses (Bug 06: remove non-existent safe_id column)
    expenses = conn.execute(
        "SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE date(date) = ?",
        (date_str,)
    ).fetchone()[0]
    
    # 5. Transfers (In and Out)
    transfers_in = conn.execute(
        "SELECT COALESCE(SUM(amount), 0) FROM safe_transfers WHERE to_safe_id = ? AND date(transfer_date) = ?",
        (safe_id, date_str)
    ).fetchone()[0]
    
    transfers_out = conn.execute(
        "SELECT COALESCE(SUM(amount), 0) FROM safe_transfers WHERE from_safe_id = ? AND date(transfer_date) = ?",
        (safe_id, date_str)
    ).fetchone()[0]
    
    receipts_total = invoices + transfers_in + returns_supp
    payments_total = purchases + expenses + transfers_out + returns_cust
    net_flow = receipts_total - payments_total
    
    return {
        "safe_id": safe_id,
        "date": date_str,
        "receipts": {
            "sales": invoices,
            "transfers_in": transfers_in,
            "supplier_returns": returns_supp,
            "total": receipts_total
        },
        "payments": {
            "purchases": purchases,
            "expenses": expenses,
            "transfers_out": transfers_out,
            "customer_returns": returns_cust,
            "total": payments_total
        },
        "net_flow": net_flow
    }
