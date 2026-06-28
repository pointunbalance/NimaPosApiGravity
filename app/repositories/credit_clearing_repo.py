from app.database.connection import get_connection
from app.utils.helpers import row_to_dict, rows_to_list, now_str

def create_clearing(data: dict) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # 1. Insert Clearing Record
        cursor.execute("""
            INSERT INTO credit_clearing (invoice_id, return_id, amount, date, notes)
            VALUES (?, ?, ?, ?, ?)
        """, (data["invoice_id"], data["return_id"], data["amount"], now_str(), data.get("notes")))
        clearing_id = cursor.lastrowid

        # 2. Update Invoice Paid Amount
        cursor.execute(
            "UPDATE invoices SET paid_amount = paid_amount + ? WHERE id = ?",
            (data["amount"], data["invoice_id"])
        )

        # LOGIC-09: Update Customer Balance (reduce debt)
        cursor.execute(
            "UPDATE customers SET balance = balance - ?, updated_at = ? "
            "WHERE id = (SELECT customer_id FROM invoices WHERE id = ?)",
            (data["amount"], now_str(), data["invoice_id"])
        )

        conn.commit()
        return clearing_id
    except Exception as e:
        conn.rollback()
        raise e

def get_by_invoice(invoice_id: int):
    conn = get_connection()
    rows = conn.execute("SELECT * FROM credit_clearing WHERE invoice_id = ?", (invoice_id,)).fetchall()
    return rows_to_list(rows)

def get_by_return(return_id: int):
    conn = get_connection()
    rows = conn.execute("SELECT * FROM credit_clearing WHERE return_id = ?", (return_id,)).fetchall()
    return rows_to_list(rows)
