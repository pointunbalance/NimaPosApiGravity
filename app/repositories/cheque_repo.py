"""Repository for managing financial cheques (أوراق القبض والدفع)."""
from app.database.connection import get_connection
from app.utils.helpers import row_to_dict, rows_to_list, now_str

def create_cheque(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute(
        """INSERT INTO cheques (type, cheque_number, bank_name, amount, due_date, status, 
           customer_id, supplier_id, notes, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (data["type"], data["cheque_number"], data.get("bank_name"), data["amount"],
         data["due_date"], data.get("status", "pending"), 
         data.get("customer_id"), data.get("supplier_id"), data.get("notes"), now_str())
    )
    conn.commit()
    return cursor.lastrowid

def get_cheque(cheque_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM cheques WHERE id = ?", (cheque_id,)).fetchone()
    return row_to_dict(row) if row else None

def update_cheque(cheque_id: int, data: dict):
    conn = get_connection()
    fields = []
    params = []
    for k, v in data.items():
        fields.append(f"{k} = ?")
        params.append(v)
    fields.append("updated_at = ?")
    params.extend([now_str(), cheque_id])
    conn.execute(f"UPDATE cheques SET {', '.join(fields)} WHERE id = ?", params)
    conn.commit()

def list_cheques(cheque_type: str = None, status: str = None, limit: int = 50):
    conn = get_connection()
    sql = "SELECT * FROM cheques WHERE 1=1"
    params = []
    if cheque_type:
        sql += " AND type = ?"
        params.append(cheque_type)
    if status:
        sql += " AND status = ?"
        params.append(status)
    sql += " ORDER BY due_date ASC LIMIT ?"
    params.append(limit)
    return rows_to_list(conn.execute(sql, params).fetchall())

def get_overdue():
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM cheques WHERE status = 'pending' AND due_date < date('now') ORDER BY due_date"
    ).fetchall()
    return rows_to_list(rows)
