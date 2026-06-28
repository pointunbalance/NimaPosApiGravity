import sqlite3
import os

DB_PATH = r"e:\NimaTechVibeCoding\NimaPosApiGravity\data\pos_api.db"

def migrate_phase_16():
    print("Starting Phase 16 Migration (Diamond Parity)...")
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Create Cheques table
    print("- Creating cheques table...")
    cursor.execute("""CREATE TABLE IF NOT EXISTS cheques (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        cheque_number TEXT NOT NULL,
        bank_name TEXT,
        amount REAL NOT NULL,
        due_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        customer_id INTEGER,
        supplier_id INTEGER,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(customer_id) REFERENCES customers(id),
        FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
    )""")

    # 2. Add calibration fields to label_templates
    print("- Updating label_templates fields...")
    columns = [
        ("horizontal_offset", "REAL DEFAULT 0"),
        ("vertical_offset", "REAL DEFAULT 0"),
        ("column_count", "INTEGER DEFAULT 1")
    ]
    for col_name, col_def in columns:
        try:
            cursor.execute(f"ALTER TABLE label_templates ADD COLUMN {col_name} {col_def}")
        except sqlite3.OperationalError:
            pass # Already exists

    # 3. Seed new settings
    print("- Seeding new app settings...")
    settings = [
        ("costing_method", "weighted_average"),
        ("auto_backup_on_close", "0")
    ]
    for k, v in settings:
        cursor.execute("INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)", (k, v))

    conn.commit()
    conn.close()
    print("Phase 16 Migration Completed Successfully!")

if __name__ == "__main__":
    migrate_phase_16()
