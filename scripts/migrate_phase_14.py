"""Migration script for Phase 14: Tiered Pricing, Bilingual Support, and Advanced Flags."""
import sqlite3
import os

DB_PATH = os.path.join(os.getcwd(), "data", "pos_api.db")

def migrate_phase_14():
    print("Starting Phase 14 Migration...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Update Products table
    cols_to_add_products = [
        ("name_en", "TEXT DEFAULT ''"),
        ("price_wholesale", "REAL NOT NULL DEFAULT 0"),
        ("price_half_wholesale", "REAL NOT NULL DEFAULT 0"),
        ("price_other", "REAL NOT NULL DEFAULT 0"),
        ("is_important", "INTEGER NOT NULL DEFAULT 0"),
        ("is_shortage", "INTEGER NOT NULL DEFAULT 0")
    ]
    for col, col_def in cols_to_add_products:
        try:
            cursor.execute(f"ALTER TABLE products ADD COLUMN {col} {col_def}")
            print(f"- Added {col} to products.")
        except sqlite3.OperationalError:
            print(f"- {col} already exists in products.")

    # 2. Update Customers table
    try:
        cursor.execute("ALTER TABLE customers ADD COLUMN name_en TEXT DEFAULT ''")
        print("- Added name_en to customers.")
    except sqlite3.OperationalError:
        print("- name_en already exists in customers.")

    # 3. Update Suppliers table
    try:
        cursor.execute("ALTER TABLE suppliers ADD COLUMN name_en TEXT DEFAULT ''")
        print("- Added name_en to suppliers.")
    except sqlite3.OperationalError:
        print("- name_en already exists in suppliers.")

    # 4. Update Expenses table
    try:
        cursor.execute("ALTER TABLE expenses ADD COLUMN safe_id INTEGER DEFAULT 1")
        print("- Added safe_id to expenses.")
    except sqlite3.OperationalError:
        print("- safe_id already exists in expenses.")

    conn.commit()
    conn.close()
    print("Phase 14 Migration Completed Successfully!")

if __name__ == "__main__":
    migrate_phase_14()
