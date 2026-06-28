import sqlite3
import os

db_path = 'data/pos_api.db'
if not os.path.exists(db_path):
    print("DB does not exist.")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT sql FROM sqlite_master WHERE name='product_batches'")
    row = cursor.fetchone()
    if row:
        print(row[0])
    else:
        print("Table product_batches not found.")
    conn.close()
