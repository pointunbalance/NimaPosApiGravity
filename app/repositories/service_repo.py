"""Repository for managing non-inventory services (Shipping, Install, etc.)."""
from app.database.connection import get_connection
from app.utils.helpers import row_to_dict, rows_to_list, now_str

def create(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO services (name, name_en, price, category, is_active) VALUES (?, ?, ?, ?, ?)",
        (data["name"], data.get("name_en", ""), data["price"], data.get("category", "labor"), data.get("is_active", 1))
    )
    conn.commit()
    return cursor.lastrowid

def get_all():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM services WHERE is_active = 1").fetchall()
    return rows_to_list(rows)

def get_by_id(service_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM services WHERE id = ?", (service_id,)).fetchone()
    return row_to_dict(row) if row else None

def update(service_id: int, data: dict):
    conn = get_connection()
    fields = []
    params = []
    for k, v in data.items():
        fields.append(f"{k} = ?")
        params.append(v)
    params.append(service_id)
    conn.execute(f"UPDATE services SET {', '.join(fields)} WHERE id = ?", params)
    conn.commit()

def delete(service_id: int):
    conn = get_connection()
    conn.execute("UPDATE services SET is_active = 0 WHERE id = ?", (service_id,))
    conn.commit()
