import sqlite3
import os

DB_PATH = "e:/NimaTechVibeCoding/NimaPosApiGravity/data/pos_api.db"

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("Adding multi-level pricing to products...")
    try:
        cursor.execute("ALTER TABLE products ADD COLUMN price_wholesale REAL DEFAULT 0.0")
        cursor.execute("ALTER TABLE products ADD COLUMN price_half_wholesale REAL DEFAULT 0.0")
        cursor.execute("ALTER TABLE products ADD COLUMN price_other REAL DEFAULT 0.0")
        cursor.execute("ALTER TABLE products ADD COLUMN is_bundle INTEGER DEFAULT 0")
        cursor.execute("ALTER TABLE products ADD COLUMN reorder_level INTEGER DEFAULT 5")
    except sqlite3.OperationalError as e:
        print(f"Skipping product columns: {e}")

    print("Creating return_reasons table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS return_reasons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reason_text TEXT NOT NULL,
            type TEXT DEFAULT 'both', -- 'customer', 'supplier', 'both'
            is_active INTEGER DEFAULT 1
        )
    """)

    print("Creating supplier_returns tables...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS supplier_returns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            supplier_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            total_amount REAL DEFAULT 0.0,
            reason_id INTEGER,
            notes TEXT,
            status TEXT DEFAULT 'completed',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS supplier_return_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            return_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            qty INTEGER NOT NULL,
            unit_cost REAL NOT NULL,
            line_total REAL NOT NULL,
            FOREIGN KEY (return_id) REFERENCES supplier_returns (id)
        )
    """)

    print("Creating product_bundles table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS product_bundles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bundle_product_id INTEGER NOT NULL,
            component_product_id INTEGER NOT NULL,
            qty INTEGER NOT NULL,
            FOREIGN KEY (bundle_product_id) REFERENCES products (id),
            FOREIGN KEY (component_product_id) REFERENCES products (id)
        )
    """)

    # Seed default return reasons
    cursor.execute("SELECT COUNT(*) FROM return_reasons")
    if cursor.fetchone()[0] == 0:
        reasons = [
            ('Expired', 'both'),
            ('Damaged', 'both'),
            ('Inaccurate Item', 'both'),
            ('Customer Request', 'customer'),
            ('Overstock', 'supplier')
        ]
        cursor.executemany("INSERT INTO return_reasons (reason_text, type) VALUES (?, ?)", reasons)

    conn.commit()
    conn.close()
    print("Migration successful.")

if __name__ == "__main__":
    migrate()
