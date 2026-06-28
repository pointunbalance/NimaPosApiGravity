"""Supplier repository."""
from app.database.connection import get_connection
from app.utils.helpers import row_to_dict, rows_to_list, now_str


def get_all_active(search: str = None, offset: int = 0, limit: int = 50):
    conn = get_connection()
    base = "SELECT * FROM suppliers WHERE is_active = 1"
    params = []
    if search:
        base += " AND (name LIKE ? OR code LIKE ? OR phone LIKE ?)"
        q = f"%{search}%"
        params.extend([q, q, q])
    count_sql = base.replace("SELECT *", "SELECT COUNT(*)")
    total = conn.execute(count_sql, params).fetchone()[0]
    base += " ORDER BY name LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    rows = conn.execute(base, params).fetchall()
    return rows_to_list(rows), total


def get_by_id(supplier_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM suppliers WHERE id = ?", (supplier_id,)).fetchone()
    return row_to_dict(row) if row else None


def create(data: dict) -> int:
    conn = get_connection()
    now = now_str()
    cursor = conn.execute(
        "INSERT INTO suppliers (code, name, name_en, phone, email, tax_id, address, notes, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (data["code"], data["name"], data.get("name_en", ""), data.get("phone", ""), data.get("email", ""),
         data.get("tax_id", ""), data.get("address", ""), data.get("notes", ""), now, now),
    )
    conn.commit()
    return cursor.lastrowid


def update(supplier_id: int, data: dict):
    conn = get_connection()
    fields, values = [], []
    for key in ("name", "name_en", "phone", "email", "tax_id", "address", "notes", "is_active"):
        if key in data and data[key] is not None:
            fields.append(f"{key} = ?")
            val = data[key]
            if key == "is_active":
                val = 1 if val else 0
            values.append(val)
    if not fields:
        return
    fields.append("updated_at = ?")
    values.append(now_str())
    values.append(supplier_id)
    conn.execute(f"UPDATE suppliers SET {', '.join(fields)} WHERE id = ?", values)
    conn.commit()


def soft_delete(supplier_id: int):
    conn = get_connection()
    conn.execute("UPDATE suppliers SET is_active = 0, updated_at = ? WHERE id = ?",
                 (now_str(), supplier_id))
    conn.commit()


def set_opening_balance(supplier_id: int, balance: float):
    """Set the supplier's balance manually (Opening Balance)."""
    conn = get_connection()
    conn.execute(
        "UPDATE suppliers SET balance = ?, updated_at = ? WHERE id = ?",
        (balance, now_str(), supplier_id)
    )
    conn.commit()
