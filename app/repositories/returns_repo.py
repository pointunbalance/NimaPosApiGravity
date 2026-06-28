"""Returns repository."""
from app.database.connection import get_connection
from app.utils.helpers import row_to_dict, rows_to_list, now_str


def create_return(data: dict, conn=None) -> int:
    if conn is None:
        conn = get_connection()
        must_commit = True
    else:
        must_commit = False
    
    try:
        if must_commit:
            conn.execute("BEGIN TRANSACTION")

        cursor = conn.execute(
            """INSERT INTO returns (created_at, original_invoice_id, customer_id,
            user_id, refund_method, refund_amount, notes, branch_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (now_str(), data["original_invoice_id"], data.get("customer_id"),
            data["user_id"], data.get("refund_method", "cash"),
            data["refund_amount"], data.get("notes", ""), data.get("branch_id", 1)),
        )
        return_id = cursor.lastrowid
        
        # 1. Update Invoice Refunded Amount
        conn.execute(
            "UPDATE invoices SET refunded_amount = refunded_amount + ? WHERE id = ?",
            (data["refund_amount"], data["original_invoice_id"])
        )

        for item in data["items"]:
            # 2. Insert Return Items
            conn.execute(
                """INSERT INTO return_items (return_id, product_id, qty, unit_price, line_total)
                VALUES (?, ?, ?, ?, ?)""",
                (return_id, item["product_id"], item["qty"],
                item["unit_price"], item["line_total"]),
            )
            
            # 3. Restore Stock
            conn.execute(
                "UPDATE products SET stock_qty = stock_qty + ?, updated_at = ? WHERE id = ?",
                (item["qty"], now_str(), item["product_id"])
            )
            
            # 4. Log Stock Movement
            conn.execute(
                """INSERT INTO stock_movements (created_at, product_id, movement_type, qty_delta, reference_type, reference_id, notes, branch_id)
                VALUES (?, ?, 'return', ?, 'return', ?, ?, ?)""",
                (now_str(), item["product_id"], item["qty"], return_id, 
                f"Return Ref: {return_id} for Invoice: {data['original_invoice_id']}", data.get("branch_id", 1))
            )

        # 5. Automated Ledger Entries (BUG-10)
        if data["refund_amount"] > 0:
            def _get_acct(name, t):
                row = conn.execute("SELECT id FROM accounts WHERE name = ?", (name,)).fetchone()
                if row: return row[0]
                import hashlib
                c = f"A-{hashlib.md5(name.encode()).hexdigest()[:6].upper()}"
                return conn.execute("INSERT INTO accounts (code, name, type) VALUES (?, ?, ?)", (c, name, t)).lastrowid

            revenue_id = _get_acct("إيرادات المبيعات", "revenue")
            
            asset_name = "صندوق الكاش"
            method = data.get("refund_method", "cash")
            if method == "card": asset_name = "البنك"
            elif method == "credit" and data.get("customer_id"):
                c_name = conn.execute("SELECT name FROM customers WHERE id = ?", (data["customer_id"],)).fetchone()[0]
                asset_name = f"ذمم مدينة: {c_name}"
            elif method == "wallet" and data.get("customer_id"):
                c_name = conn.execute("SELECT name FROM customers WHERE id = ?", (data["customer_id"],)).fetchone()[0]
                asset_name = f"محفظة عملاء: {c_name}"
            
            asset_type = "asset" if method in ["cash", "card", "credit"] else "liability"
            asset_id = _get_acct(asset_name, asset_type)
            
            entry_id = conn.execute(
                "INSERT INTO journal_entries (date, reference, description, total_amount, status) VALUES (?, ?, ?, ?, ?)",
                (now_str().split(" ")[0], f"RET-{return_id}", f"مرتجع مبيعات رقم {return_id}", data["refund_amount"], "posted")
            ).lastrowid
            
            # Debit (Revenue Reduction)
            conn.execute(
                "INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit) VALUES (?, ?, ?, ?)",
                (entry_id, revenue_id, data["refund_amount"], 0)
            )
            conn.execute("UPDATE accounts SET balance = balance + ? WHERE id = ?", (data["refund_amount"], revenue_id))
            
            # Credit (Asset Reduction / Bank / Cash)
            conn.execute(
                "INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit) VALUES (?, ?, ?, ?)",
                (entry_id, asset_id, 0, data["refund_amount"])
            )
            conn.execute("UPDATE accounts SET balance = balance - ? WHERE id = ?", (data["refund_amount"], asset_id))

        if must_commit:
            conn.execute("COMMIT")
        return return_id
    except Exception as e:
        if must_commit:
            conn.execute("ROLLBACK")
        raise e


def get_by_id(return_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM returns WHERE id = ?", (return_id,)).fetchone()
    return row_to_dict(row) if row else None


def get_items(return_id: int):
    conn = get_connection()
    rows = conn.execute(
        """SELECT ri.*, p.name as product_name
           FROM return_items ri
           LEFT JOIN products p ON p.id = ri.product_id
           WHERE ri.return_id = ?""",
        (return_id,),
    ).fetchall()
    return rows_to_list(rows)


def get_list(date_from: str = None, date_to: str = None, customer_id: int = None, offset: int = 0, limit: int = 50):
    conn = get_connection()
    base = "SELECT * FROM returns WHERE 1=1"
    params = []
    if date_from:
        base += " AND date(created_at) >= ?"
        params.append(date_from)
    if date_to:
        base += " AND date(created_at) <= ?"
        params.append(date_to)
    if customer_id:
        base += " AND customer_id = ?"
        params.append(customer_id)
    count_sql = base.replace("SELECT *", "SELECT COUNT(*)")
    total = conn.execute(count_sql, params).fetchone()[0]
    base += " ORDER BY id DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    rows = conn.execute(base, params).fetchall()
    return rows_to_list(rows), total


def get_eligible_items(invoice_id: int):
    conn = get_connection()
    rows = conn.execute(
        """SELECT
            ii.product_id, p.sku, p.name,
            ii.qty as sold_qty, ii.unit_price, ii.net_line_total,
            COALESCE((SELECT SUM(ri.qty) FROM return_items ri
                      JOIN returns r ON r.id = ri.return_id
                      WHERE r.original_invoice_id = ii.invoice_id
                      AND ri.product_id = ii.product_id), 0) as already_returned
        FROM invoice_items ii
        JOIN products p ON p.id = ii.product_id
        WHERE ii.invoice_id = ?""",
        (invoice_id,),
    ).fetchall()
    return rows_to_list(rows)


def get_today_returns_amount(today: str):
    conn = get_connection()
    row = conn.execute(
        "SELECT COALESCE(SUM(refund_amount), 0) as total FROM returns WHERE date(created_at) = ?",
        (today,),
    ).fetchone()
    return row[0] if row else 0


def get_summary(date_from: str = None, date_to: str = None) -> dict:
    """Quick summary of returns for a date range."""
    conn = get_connection()
    where, params = ["1=1"], []
    if date_from: where.append("date(created_at) >= ?"); params.append(date_from)
    if date_to: where.append("date(created_at) <= ?"); params.append(date_to)
    wc = " AND ".join(where)
    row = conn.execute(
        f"SELECT COUNT(*) as cnt, COALESCE(SUM(refund_amount), 0) as total FROM returns WHERE {wc}", params
    ).fetchone()
    return {"count": row["cnt"], "total_refunded": round(row["total"], 2)}
