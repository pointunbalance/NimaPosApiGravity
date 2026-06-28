"""Product Manufacturers repository."""
from app.database.connection import get_connection
from app.utils.helpers import rows_to_list, row_to_dict

def get_all():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM product_manufacturers ORDER BY name").fetchall()
    return rows_to_list(rows)

def create(name: str, website: str = ""):
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO product_manufacturers (name, website) VALUES (?, ?)",
        (name, website)
    )
    conn.commit()
    return cursor.lastrowid

def delete(man_id: int):
    conn = get_connection()
    conn.execute("DELETE FROM product_manufacturers WHERE id = ?", (man_id,))
    conn.commit()
