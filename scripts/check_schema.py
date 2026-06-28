import sqlite3
import os

db_path = 'data/pos_api.db'
if not os.path.exists(db_path):
    print("DB does not exist.")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(product_batches)")
    columns = cursor.fetchall()
    print("Columns in product_batches:")
    for col in columns:
        print(col)
    conn.close()
