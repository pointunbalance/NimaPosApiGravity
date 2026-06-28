import sqlite3
import os

DB_PATH = "e:/NimaTechVibeCoding/NimaPosApiGravity/data/pos_api.db"

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("Creating geographic master tables...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS governorates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            governorate_id INTEGER NOT NULL,
            FOREIGN KEY (governorate_id) REFERENCES governorates(id),
            UNIQUE(name, governorate_id)
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sales_zones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            city_id INTEGER NOT NULL,
            FOREIGN KEY (city_id) REFERENCES cities(id),
            UNIQUE(name, city_id)
        )
    """)

    print("Adding opening_balance and geography_ids to customers/suppliers...")
    try:
        cursor.execute("ALTER TABLE customers ADD COLUMN opening_balance REAL DEFAULT 0.0")
        cursor.execute("ALTER TABLE customers ADD COLUMN city_id INTEGER")
        cursor.execute("ALTER TABLE customers ADD COLUMN zone_id INTEGER")
        
        cursor.execute("ALTER TABLE suppliers ADD COLUMN opening_balance REAL DEFAULT 0.0")
        cursor.execute("ALTER TABLE suppliers ADD COLUMN city_id INTEGER")
    except sqlite3.OperationalError:
        pass # Already exists

    print("Creating financial voucher tables (Accounting Logic)...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS financial_vouchers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL, -- 'discount_earned', 'discount_allowed', 'opening_balance'
            entity_type TEXT NOT NULL, -- 'customer', 'supplier'
            entity_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            notes TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Seed some governorates for testing
    cursor.execute("SELECT COUNT(*) FROM governorates")
    if cursor.fetchone()[0] == 0:
        govs = [('Cairo',), ('Giza',), ('Alexandria',), ('Dakahlia',), ('Sharqia',)]
        cursor.executemany("INSERT INTO governorates (name) VALUES (?)", govs)

    conn.commit()
    conn.close()
    print("Migration Phase 9 successful.")

if __name__ == "__main__":
    migrate()
