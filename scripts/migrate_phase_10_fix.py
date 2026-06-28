import sqlite3
import os

DB_PATH = "e:/NimaTechVibeCoding/NimaPosApiGravity/data/pos_api.db"

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("Ensuring permissions table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS permissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            module TEXT NOT NULL,
            level INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id, module)
        )
    """)

    print("Ensuring credit_clearing table...")
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

    print("Adding security settings to app_settings...")
    try:
        # Check if app_settings table has security keys
        cursor.execute("SELECT key FROM app_settings WHERE key = 'max_invoice_edit_days'")
        if not cursor.fetchone():
            cursor.execute("INSERT INTO app_settings (key, value) VALUES (?, ?)",
                          ('max_invoice_edit_days', '7'))
        
        cursor.execute("SELECT key FROM app_settings WHERE key = 'lock_price_changes'")
        if not cursor.fetchone():
            cursor.execute("INSERT INTO app_settings (key, value) VALUES (?, ?)",
                          ('lock_price_changes', '1'))
        
        # Also let's check if 'settings' table was accidentally created and delete it if empty
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='settings'")
        if cursor.fetchone():
             cursor.execute("DROP TABLE settings")
             print("Dropped accidentally created 'settings' table.")
             
    except sqlite3.OperationalError as e:
        print(f"Error touching settings: {e}")

    conn.commit()
    conn.close()
    print("Migration Phase 10 (Fixed) successful.")

if __name__ == "__main__":
    migrate()
