from app.database.connection import get_connection
from app.utils.helpers import row_to_dict, rows_to_list

def get_all(type_filter: str = None):
    conn = get_connection()
    query = "SELECT * FROM return_reasons WHERE is_active = 1"
    params = []
    if type_filter:
        query += " AND (type = ? OR type = 'both')"
        params.append(type_filter)
    rows = conn.execute(query, params).fetchall()
    return rows_to_list(rows)

def create(reason_text: str, type_val: str = 'both'):
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO return_reasons (reason_text, type) VALUES (?, ?)",
        (reason_text, type_val)
    )
    conn.commit()
    return cursor.lastrowid

def delete(reason_id: int):
    conn = get_connection()
    conn.execute("UPDATE return_reasons SET is_active = 0 WHERE id = ?", (reason_id,))
    conn.commit()
