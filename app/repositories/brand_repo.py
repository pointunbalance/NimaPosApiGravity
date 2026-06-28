"""Product Brands repository."""
from app.database.connection import get_connection
from app.utils.helpers import rows_to_list, row_to_dict

def get_all():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM product_brands ORDER BY name").fetchall()
    return rows_to_list(rows)

def get_by_id(brand_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM product_brands WHERE id = ?", (brand_id,)).fetchone()
    return row_to_dict(row) if row else None

def create(name: str, description: str = ""):
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO product_brands (name, description) VALUES (?, ?)",
        (name, description)
    )
    conn.commit()
    return cursor.lastrowid

def update(brand_id: int, name: str, description: str = None):
    conn = get_connection()
    fields = ["name = ?"]
    params = [name]
    if description is not None:
        fields.append("description = ?")
        params.append(description)
    params.append(brand_id)
    conn.execute(f"UPDATE product_brands SET {', '.join(fields)} WHERE id = ?", params)
    conn.commit()

def delete(brand_id: int):
    conn = get_connection()
    conn.execute("DELETE FROM product_brands WHERE id = ?", (brand_id,))
    conn.commit()
