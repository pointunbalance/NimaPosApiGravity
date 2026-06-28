import sqlite3
import os

# Hardcoded path for safety in script execution context
DB_PATH = r"e:\NimaTechVibeCoding\NimaPosApiGravity\data\pos_api.db"

def migrate_phase_15():
    print("Starting Phase 15 Migration (Absolute Parity)...")
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Create Services table
    print("- Ensuring services table exists...")
    cursor.execute("""CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        name_en TEXT DEFAULT '',
        price REAL NOT NULL DEFAULT 0,
        category TEXT DEFAULT 'labor',
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""")

    # 2. Add safe_id to expenses if not already (redundancy check)
    try:
        cursor.execute("ALTER TABLE expenses ADD COLUMN safe_id INTEGER DEFAULT 1")
        print("- Added safe_id to expenses.")
    except sqlite3.OperationalError:
        print("- safe_id already exists in expenses.")

    conn.commit()
    conn.close()
    print("Phase 15 Migration Completed Successfully!")

if __name__ == "__main__":
    migrate_phase_15()
