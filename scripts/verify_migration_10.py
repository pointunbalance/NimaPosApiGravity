import sqlite3
DB_PATH = "e:/NimaTechVibeCoding/NimaPosApiGravity/data/pos_api.db"
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in cursor.fetchall()]
print(f"Tables: {tables}")

# Check settings table
if "app_settings" in tables:
    print("app_settings table exists.")
if "settings" in tables:
    print("settings table exists.")

# Check permissions
if "permissions" in tables:
    print("permissions table exists.")

conn.close()
