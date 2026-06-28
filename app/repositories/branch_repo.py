"""Branch repository."""
from app.database.connection import get_connection
from app.utils.helpers import row_to_dict, rows_to_list, now_str


def get_all():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM branches WHERE is_active = 1 ORDER BY code").fetchall()
    return rows_to_list(rows)


def get_by_id(branch_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM branches WHERE id = ?", (branch_id,)).fetchone()
    return row_to_dict(row) if row else None


def create(code: str, name: str) -> int:
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO branches (code, name, created_at) VALUES (?, ?, ?)",
        (code, name, now_str()),
    )
    conn.commit()
    return cursor.lastrowid


def update(branch_id: int, data: dict):
    conn = get_connection()
    fields, values = [], []
    for key in ("name", "is_active"):
        if key in data and data[key] is not None:
            fields.append(f"{key} = ?")
            val = data[key]
            if key == "is_active":
                val = 1 if val else 0
            values.append(val)
    if not fields:
        return
    values.append(branch_id)
    conn.execute(f"UPDATE branches SET {', '.join(fields)} WHERE id = ?", values)
    conn.commit()
