import sqlite3
from app.config import DB_PATH

def patch_db():
    print(f"Patching database at {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    columns_to_add = [
        ("uuid", "TEXT"),
        ("invoice_hash", "TEXT"),
        ("previous_invoice_hash", "TEXT"),
        ("zatca_status", "TEXT DEFAULT 'pending'"),
        ("qr_code", "TEXT"),
        ("zatca_warnings", "TEXT")
    ]
    
    for col_name, col_type in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE invoices ADD COLUMN {col_name} {col_type}")
            print(f"Added column: {col_name}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print(f"Column already exists: {col_name}")
            else:
                print(f"Error adding {col_name}: {e}")
                
    conn.commit()
    conn.close()
    print("Database patching complete.")

if __name__ == "__main__":
    patch_db()
