"""Customer Payments repository — track debt payments and balance history."""
from app.database.connection import get_connection
from app.utils.helpers import now_str, rows_to_list, row_to_dict


def list_payments(customer_id: int, offset: int = 0, limit: int = 50) -> tuple[list[dict], int]:
    conn = get_connection()
    total = conn.execute(
        "SELECT COUNT(*) as cnt FROM customer_payments WHERE customer_id = ?", (customer_id,)
    ).fetchone()["cnt"]
    rows = conn.execute(
        "SELECT * FROM customer_payments WHERE customer_id = ? ORDER BY id DESC LIMIT ? OFFSET ?",
        (customer_id, limit, offset),
    ).fetchall()
    return rows_to_list(rows), total


def create_payment(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute(
        """INSERT INTO customer_payments (customer_id, amount, date, type, note, recorded_by)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (data["customer_id"], data["amount"], data.get("date", now_str()),
         data.get("type", "debt_payment"), data.get("note", ""), data.get("recorded_by", "")),
    )
    # ACCT-07: Update customer balance based on payment type
    p_type = data.get("type", "debt_payment")
    if p_type == "debt_payment":
        conn.execute(
            "UPDATE customers SET balance = balance - ?, updated_at = ? WHERE id = ?",
            (data["amount"], now_str(), data["customer_id"]),
        )
    elif p_type == "wallet_topup":
        conn.execute(
            "UPDATE customers SET wallet_balance = wallet_balance + ?, updated_at = ? WHERE id = ?",
            (data["amount"], now_str(), data["customer_id"]),
        )
    elif p_type == "refund":
        conn.execute(
            "UPDATE customers SET balance = balance + ?, updated_at = ? WHERE id = ?",
            (data["amount"], now_str(), data["customer_id"]),
        )
    
    conn.commit()
    return cursor.lastrowid


def get_balance_summary(customer_id: int) -> dict:
    conn = get_connection()
    customer = conn.execute(
        "SELECT name, balance, total_purchases, credit_limit, wallet_balance FROM customers WHERE id = ?",
        (customer_id,),
    ).fetchone()
    if not customer:
        return {}
    total_paid = conn.execute(
        "SELECT COALESCE(SUM(amount), 0) as total FROM customer_payments WHERE customer_id = ?",
        (customer_id,),
    ).fetchone()["total"]
    d = row_to_dict(customer)
    d["total_payments"] = round(total_paid, 2)
    d["available_credit"] = round(d.get("credit_limit", 0) - d.get("balance", 0), 2)
    return d
