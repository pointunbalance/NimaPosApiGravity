"""Product Locations repository."""
from app.database.connection import get_connection
from app.utils.helpers import rows_to_list, row_to_dict

def get_all(warehouse_id: int = None):
    conn = get_connection()
    sql = "SELECT * FROM product_locations"
    params = []
    if warehouse_id:
        sql += " WHERE warehouse_id = ?"
        params.append(warehouse_id)
    sql += " ORDER BY name"
    rows = conn.execute(sql, params).fetchall()
    return rows_to_list(rows)

def create(name: str, warehouse_id: int = None):
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO product_locations (name, warehouse_id) VALUES (?, ?)",
        (name, warehouse_id)
    )
    conn.commit()
    return cursor.lastrowid

def delete(location_id: int):
    conn = get_connection()
    conn.execute("DELETE FROM product_locations WHERE id = ?", (location_id,))
    conn.commit()
