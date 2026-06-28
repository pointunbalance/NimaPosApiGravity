from app.database.connection import get_connection
from app.utils.helpers import rows_to_list, row_to_dict

# --- Governorates ---
def get_governorates():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM governorates ORDER BY name").fetchall()
    return rows_to_list(rows)

def create_governorate(name: str):
    conn = get_connection()
    cursor = conn.execute("INSERT INTO governorates (name) VALUES (?)", (name,))
    conn.commit()
    return cursor.lastrowid

# --- Cities ---
def get_cities(governorate_id: int = None):
    conn = get_connection()
    sql = "SELECT * FROM cities"
    params = []
    if governorate_id:
        sql += " WHERE governorate_id = ?"
        params.append(governorate_id)
    sql += " ORDER BY name"
    rows = conn.execute(sql, params).fetchall()
    return rows_to_list(rows)

def create_city(name: str, governorate_id: int):
    conn = get_connection()
    cursor = conn.execute("INSERT INTO cities (name, governorate_id) VALUES (?, ?)", (name, governorate_id))
    conn.commit()
    return cursor.lastrowid

# --- Zones ---
def get_zones(city_id: int = None):
    conn = get_connection()
    sql = "SELECT * FROM sales_zones"
    params = []
    if city_id:
        sql += " WHERE city_id = ?"
        params.append(city_id)
    sql += " ORDER BY name"
    rows = conn.execute(sql, params).fetchall()
    return rows_to_list(rows)

def create_zone(name: str, city_id: int):
    conn = get_connection()
    cursor = conn.execute("INSERT INTO sales_zones (name, city_id) VALUES (?, ?)", (name, city_id))
    conn.commit()
    return cursor.lastrowid
