"""Z-Report repository."""
from app.database.connection import get_connection
from app.utils.helpers import row_to_dict, rows_to_list, now_str


def create_z_report(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute(
        """INSERT INTO z_reports (business_date, created_at, from_ts, to_ts,
           invoices_count, gross_sales, subtotal_sum, tax_sum, 
           returns_count, returns_total, expenses_count, expenses_total, 
           net_profit, notes, branch_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (data["business_date"], now_str(), data.get("from_ts", ""),
         data.get("to_ts", ""), data["invoices_count"], data["gross_sales"],
         data["subtotal_sum"], data["tax_sum"], 
         data.get("returns_count", 0), data.get("returns_total", 0),
         data.get("expenses_count", 0), data.get("expenses_total", 0),
         data.get("net_profit", 0), data.get("notes", ""),
         data.get("branch_id", 1)),
    )
    conn.commit()
    return cursor.lastrowid


def get_by_date(business_date: str):
    conn = get_connection()
    row = conn.execute("SELECT * FROM z_reports WHERE business_date = ?", (business_date,)).fetchone()
    return row_to_dict(row) if row else None


def get_list(offset: int = 0, limit: int = 50):
    conn = get_connection()
    total = conn.execute("SELECT COUNT(*) FROM z_reports").fetchone()[0]
    rows = conn.execute(
        "SELECT * FROM z_reports ORDER BY business_date DESC LIMIT ? OFFSET ?",
        (limit, offset),
    ).fetchall()
    return rows_to_list(rows), total
