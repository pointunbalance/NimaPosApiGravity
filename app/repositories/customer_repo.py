"""Customer repository."""
from app.database.connection import get_connection
from app.utils.helpers import row_to_dict, rows_to_list, now_str


def get_all_active(search: str = None, offset: int = 0, limit: int = 50):
    conn = get_connection()
    base = "SELECT * FROM customers WHERE is_active = 1"
    params = []
    if search:
        base += " AND (name LIKE ? OR phone LIKE ? OR code LIKE ?)"
        q = f"%{search}%"
        params.extend([q, q, q])
    count_sql = base.replace("SELECT *", "SELECT COUNT(*)")
    total = conn.execute(count_sql, params).fetchone()[0]
    base += " ORDER BY name LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    rows = conn.execute(base, params).fetchall()
    return rows_to_list(rows), total


def get_by_id(customer_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM customers WHERE id = ?", (customer_id,)).fetchone()
    return row_to_dict(row) if row else None


def create(data: dict) -> int:
    conn = get_connection()
    now = now_str()
    cursor = conn.execute(
        "INSERT INTO customers (code, name, name_en, phone, email, address, notes, balance, wallet_balance, credit_limit, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (data["code"], data["name"], data.get("name_en", ""), data.get("phone", ""), data.get("email", ""),
         data.get("address", ""), data.get("notes", ""), data.get("balance", 0.0), data.get("wallet_balance", 0.0), data.get("credit_limit", 0.0), now, now),
    )
    conn.commit()
    return cursor.lastrowid


def update(customer_id: int, data: dict):
    conn = get_connection()
    fields, values = [], []
    for key in ("name", "name_en", "phone", "email", "address", "notes", "is_active", "balance", "wallet_balance", "credit_limit"):
        if key in data and data[key] is not None:
            fields.append(f"{key} = ?")
            val = data[key]
            if key == "is_active":
                val = 1 if data[key] else 0
            values.append(val)
    if not fields:
        return
    fields.append("updated_at = ?")
    values.append(now_str())
    values.append(customer_id)
    conn.execute(f"UPDATE customers SET {', '.join(fields)} WHERE id = ?", values)
    conn.commit()


def soft_delete(customer_id: int):
    conn = get_connection()
    conn.execute("UPDATE customers SET is_active = 0, updated_at = ? WHERE id = ?",
                 (now_str(), customer_id))
    conn.commit()


def count_active():
    conn = get_connection()
    return conn.execute("SELECT COUNT(*) FROM customers WHERE is_active = 1").fetchone()[0]


def get_invoices(customer_id: int, offset: int = 0, limit: int = 50):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM invoices WHERE customer_id = ? ORDER BY id DESC LIMIT ? OFFSET ?",
        (customer_id, limit, offset),
    ).fetchall()
    total = conn.execute(
        "SELECT COUNT(*) FROM invoices WHERE customer_id = ?", (customer_id,)
    ).fetchone()[0]
    return rows_to_list(rows), total


def set_opening_balance(customer_id: int, balance: float):
    """Set the customer's balance manually (Opening Balance)."""
    conn = get_connection()
    conn.execute(
        "UPDATE customers SET balance = ?, updated_at = ? WHERE id = ?",
        (balance, now_str(), customer_id)
    )
    conn.commit()
def update_balance(customer_id: int, delta: float, conn=None):
    """Increase or decrease customer debt balance."""
    if conn is None:
        conn = get_connection()
        must_commit = True
    else:
        must_commit = False
    conn.execute(
        "UPDATE customers SET balance = balance + ?, updated_at = ? WHERE id = ?",
        (delta, now_str(), customer_id)
    )
    if must_commit:
        conn.commit()


def update_wallet(customer_id: int, delta: float, conn=None):
    """Increase or decrease customer wallet balance."""
    if conn is None:
        conn = get_connection()
        must_commit = True
    else:
        must_commit = False
    conn.execute(
        "UPDATE customers SET wallet_balance = wallet_balance + ?, updated_at = ? WHERE id = ?",
        (delta, now_str(), customer_id)
    )
    if must_commit:
        conn.commit()


def update_total_purchases(customer_id: int, delta: float, conn=None):
    """Update cumulative purchase total."""
    if conn is None:
        conn = get_connection()
        must_commit = True
    else:
        must_commit = False
    conn.execute(
        "UPDATE customers SET total_purchases = total_purchases + ?, updated_at = ? WHERE id = ?",
        (delta, now_str(), customer_id)
    )
    if must_commit:
        conn.commit()


def get_returns(customer_id: int, offset: int = 0, limit: int = 50):
    """Get all returns for a specific customer."""
    conn = get_connection()
    rows = conn.execute(
        """SELECT r.*, i.payment_method as original_payment_method
           FROM returns r
           LEFT JOIN invoices i ON i.id = r.original_invoice_id
           WHERE r.customer_id = ?
           ORDER BY r.id DESC LIMIT ? OFFSET ?""",
        (customer_id, limit, offset),
    ).fetchall()
    total = conn.execute(
        "SELECT COUNT(*) FROM returns WHERE customer_id = ?", (customer_id,)
    ).fetchone()[0]
    return rows_to_list(rows), total


def get_wallet_history(customer_id: int, offset: int = 0, limit: int = 50):
    """Get wallet transaction history from customer_payments and invoices using UNION for consistent pagination."""
    conn = get_connection()
    # Use UNION to get both topups and purchases in a single sorted query
    query = """
        SELECT id, date, amount, 'topup' as txn_type, note
        FROM customer_payments 
        WHERE customer_id = ? AND type = 'wallet_topup'
        UNION ALL
        SELECT id, created_at as date, net_total as amount, 'purchase' as txn_type, 'Wallet purchase' as note
        FROM invoices 
        WHERE customer_id = ? AND payment_method = 'wallet' AND is_void = 0
        ORDER BY date DESC LIMIT ? OFFSET ?
    """
    rows = conn.execute(query, (customer_id, customer_id, limit, offset)).fetchall()
    return rows_to_list(rows)


def export_all():
    """Export all active customers for CSV/Excel download."""
    conn = get_connection()
    rows = conn.execute(
        "SELECT id, code, name, name_en, phone, email, address, balance, wallet_balance, credit_limit, total_purchases "
        "FROM customers WHERE is_active = 1 ORDER BY name"
    ).fetchall()
    return rows_to_list(rows)
