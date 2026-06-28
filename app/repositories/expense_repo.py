"""Expense repository."""
from app.database.connection import get_connection
from app.utils.helpers import row_to_dict, rows_to_list


def get_all(date_from: str = None, date_to: str = None, category: str = None, offset: int = 0, limit: int = 50):
    conn = get_connection()
    base = "SELECT * FROM expenses WHERE 1=1"; params = []
    if date_from: base += " AND date >= ?"; params.append(date_from)
    if date_to: base += " AND date <= ?"; params.append(date_to)
    if category: base += " AND category = ?"; params.append(category)
    count_sql = base.replace("SELECT *", "SELECT COUNT(*)"); total = conn.execute(count_sql, params).fetchone()[0]
    base += " ORDER BY date DESC, id DESC LIMIT ? OFFSET ?"; params.extend([limit, offset])
    return rows_to_list(conn.execute(base, params).fetchall()), total

def get_by_id(e_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM expenses WHERE id = ?", (e_id,)).fetchone()
    return row_to_dict(row) if row else None

def create(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO expenses (title, amount, category, date, notes, payment_method, attachment) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (data["title"], data["amount"], data.get("category", "other"), data["date"],
         data.get("notes", ""), data.get("payment_method", "cash"), data.get("attachment", "")),
    )
    conn.commit(); return cursor.lastrowid

def update(e_id: int, data: dict):
    conn = get_connection()
    fields, values = [], []
    for k in ("title", "amount", "category", "date", "notes", "payment_method", "attachment"):
        if k in data and data[k] is not None: fields.append(f"{k} = ?"); values.append(data[k])
    if not fields: return
    values.append(e_id)
    conn.execute(f"UPDATE expenses SET {', '.join(fields)} WHERE id = ?", values)
    conn.commit()

def delete(e_id: int):
    conn = get_connection()
    conn.execute("DELETE FROM expenses WHERE id = ?", (e_id,))
    conn.commit()

def total_by_range(date_from: str, date_to: str):
    conn = get_connection()
    return conn.execute("SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE date BETWEEN ? AND ?", (date_from, date_to)).fetchone()[0]


def list_categories():
    """Get distinct expense categories with counts."""
    conn = get_connection()
    rows = conn.execute(
        "SELECT category, COUNT(*) as count, COALESCE(SUM(amount), 0) as total "
        "FROM expenses GROUP BY category ORDER BY total DESC"
    ).fetchall()
    return rows_to_list(rows)


def get_summary(date_from: str = None, date_to: str = None) -> dict:
    """Expense summary broken down by category for a date range."""
    conn = get_connection()
    where, params = ["1=1"], []
    if date_from: where.append("date >= ?"); params.append(date_from)
    if date_to: where.append("date <= ?"); params.append(date_to)
    wc = " AND ".join(where)
    
    totals = conn.execute(
        f"SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total FROM expenses WHERE {wc}", params
    ).fetchone()
    
    by_category = conn.execute(
        f"SELECT category, COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total "
        f"FROM expenses WHERE {wc} GROUP BY category ORDER BY total DESC", params
    ).fetchall()
    
    return {
        "count": totals["cnt"],
        "total": round(totals["total"], 2),
        "by_category": rows_to_list(by_category)
    }
