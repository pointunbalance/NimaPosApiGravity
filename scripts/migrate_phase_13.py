"""Migration script for Phase 13: Safes, Transfers, and Bonus Quantities."""
import os
import sys

# Add parent dir to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import get_connection

def migrate():
    conn = get_connection()
    cursor = conn.cursor()
    
    print("Starting Phase 13 Migration...")
    
    # 1. Create safes table
    cursor.execute("""CREATE TABLE IF NOT EXISTS safes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        balance REAL NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        branch_id INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""")
    print("- Safes table verified.")

    # 2. Create safe_transfers table
    cursor.execute("""CREATE TABLE IF NOT EXISTS safe_transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_safe_id INTEGER NOT NULL,
        to_safe_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        transferor_id INTEGER,
        receiver_id INTEGER,
        notes TEXT DEFAULT '',
        transfer_date TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(from_safe_id) REFERENCES safes(id),
        FOREIGN KEY(to_safe_id) REFERENCES safes(id),
        FOREIGN KEY(transferor_id) REFERENCES users(id),
        FOREIGN KEY(receiver_id) REFERENCES users(id)
    )""")
    print("- Safe Transfers table verified.")

    # 3. Add bonus_qty to invoice_items
    try:
        cursor.execute("ALTER TABLE invoice_items ADD COLUMN bonus_qty REAL NOT NULL DEFAULT 0")
        print("- Added bonus_qty to invoice_items.")
    except:
        print("- bonus_qty already exists in invoice_items.")

    # 4. Add bonus_qty to purchase_order_items
    try:
        cursor.execute("ALTER TABLE purchase_order_items ADD COLUMN bonus_qty REAL NOT NULL DEFAULT 0")
        print("- Added bonus_qty to purchase_order_items.")
    except:
        print("- bonus_qty already exists in purchase_order_items.")

    # 5. Add total_purchases to suppliers
    try:
        cursor.execute("ALTER TABLE suppliers ADD COLUMN total_purchases REAL NOT NULL DEFAULT 0")
        print("- Added total_purchases to suppliers.")
    except:
        print("- total_purchases already exists in suppliers.")

    # 6. Add total_purchases to customers
    try:
        cursor.execute("ALTER TABLE customers ADD COLUMN total_purchases REAL NOT NULL DEFAULT 0")
        print("- Added total_purchases to customers.")
    except:
        print("- total_purchases already exists in customers.")

    # 7. Seed default safe if empty
    cursor.execute("SELECT COUNT(*) FROM safes")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO safes (id, name, balance, is_active) VALUES (1, 'Main Safe', 0, 1)")
        print("- Seeded default safe.")

    conn.commit()
    print("Phase 13 Migration Completed Successfully!")

if __name__ == "__main__":
    migrate()
