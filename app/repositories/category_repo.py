"""Category repository."""
from app.database.connection import get_connection
from app.utils.helpers import row_to_dict, rows_to_list


def get_all():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM categories ORDER BY name").fetchall()
    return rows_to_list(rows)

def get_by_id(cat_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM categories WHERE id = ?", (cat_id,)).fetchone()
    return row_to_dict(row) if row else None

def create(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO categories (name, color, icon, description, default_margin_pct) VALUES (?, ?, ?, ?, ?)",
        (data["name"], data.get("color", ""), data.get("icon", ""), data.get("description", ""), data.get("default_margin_pct", 20.0)),
    )
    conn.commit()
    return cursor.lastrowid

def update(cat_id: int, data: dict):
    conn = get_connection()
    fields, values = [], []
    for k in ("name", "color", "icon", "description", "default_margin_pct"):
        if k in data and data[k] is not None:
            fields.append(f"{k} = ?"); values.append(data[k])
    if not fields: return
    values.append(cat_id)
    conn.execute(f"UPDATE categories SET {', '.join(fields)} WHERE id = ?", values)
    conn.commit()

def delete(cat_id: int):
    conn = get_connection()
    conn.execute("DELETE FROM categories WHERE id = ?", (cat_id,))
    conn.commit()
