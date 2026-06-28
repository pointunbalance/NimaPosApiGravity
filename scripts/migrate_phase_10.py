import sqlite3
import os

DB_PATH = "e:/NimaTechVibeCoding/NimaPosApiGravity/data/pos_api.db"

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("Creating permissions table (module-based granular control)...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS permissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            module TEXT NOT NULL, -- 'products', 'invoices', 'reports', 'settings', etc.
            level INTEGER DEFAULT 0, -- 0:None, 1:View, 2:Add, 3:Add+Edit, 4:Manage, 5:Full
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id, module)
        )
    """)

    print("Creating credit_clearing table (Clearing Sales with Returns)...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS credit_clearing (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_id INTEGER NOT NULL,
            return_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            notes TEXT,
            FOREIGN KEY (invoice_id) REFERENCES invoices(id),
            FOREIGN KEY (return_id) REFERENCES returns(id)
        )
    """)

    print("Adding security settings to global settings...")
    try:
        # Check if settings table has security keys
        cursor.execute("SELECT key FROM settings WHERE key = 'max_invoice_edit_days'")
        if not cursor.fetchone():
            cursor.execute("INSERT INTO settings (key, value, description) VALUES (?, ?, ?)",
                          ('max_invoice_edit_days', '7', 'Maximum days allowed to edit or void an invoice'))
        
        cursor.execute("SELECT key FROM settings WHERE key = 'lock_price_changes'")
        if not cursor.fetchone():
            cursor.execute("INSERT INTO settings (key, value, description) VALUES (?, ?, ?)",
                          ('lock_price_changes', '1', 'Prevent price changes in checkout without Level 5 permission'))
    except sqlite3.OperationalError:
        pass

    conn.commit()
    conn.close()
    print("Migration Phase 10 successful.")

if __name__ == "__main__":
    migrate()
