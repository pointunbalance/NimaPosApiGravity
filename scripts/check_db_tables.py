import sqlite3
import os
import sys

# Add project root to path
sys.path.append(os.getcwd())

from app.config import DB_PATH

def check_db():
    print(f"Checking DB: {DB_PATH}")
    if not os.path.exists(DB_PATH):
        print("DB File does not exist!")
        return
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    tables = ["governorates", "cities", "sales_zones"]
    for table in tables:
        cursor.execute(f"SELECT count(*) FROM sqlite_master WHERE type='table' AND name='{table}'")
        exists = cursor.fetchone()[0]
        print(f"Table '{table}' exists: {'YES' if exists else 'NO'}")
        
        if exists:
            cursor.execute(f"SELECT count(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"  Row count: {count}")

if __name__ == "__main__":
    check_db()
