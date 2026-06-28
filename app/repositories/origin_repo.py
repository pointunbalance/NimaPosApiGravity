"""Product Origins repository."""
from app.database.connection import get_connection
from app.utils.helpers import rows_to_list, row_to_dict

def get_all():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM product_origins ORDER BY name").fetchall()
    return rows_to_list(rows)

def create(name: str):
    conn = get_connection()
    cursor = conn.execute("INSERT INTO product_origins (name) VALUES (?)", (name,))
    conn.commit()
    return cursor.lastrowid

def delete(origin_id: int):
    conn = get_connection()
    conn.execute("DELETE FROM product_origins WHERE id = ?", (origin_id,))
    conn.commit()
