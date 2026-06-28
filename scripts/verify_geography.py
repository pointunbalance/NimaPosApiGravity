import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

from app.database.connection import get_connection
from app.database.schema.tables import _create_tables
from app.database.schema.seeds import _seed_geography

def verify_geography():
    conn = get_connection()
    cursor = conn.cursor()
    
    print("--- Initializing Schema ---")
    _create_tables(cursor)
    conn.commit()
    
    print("--- Running Geography Seed ---")
    _seed_geography(cursor)
    conn.commit()
    
    print("\n--- Verifying Governorates ---")
    cursor.execute("SELECT COUNT(*) FROM governorates")
    gov_count = cursor.fetchone()[0]
    print(f"Governorates count: {gov_count} (Expected: 27)")
    
    print("\n--- Listing first 5 Governorates ---")
    cursor.execute("SELECT id, name, name_en FROM governorates LIMIT 5")
    for row in cursor.fetchall():
        print(f"ID: {row[0]} | Name: {row[1]} | EN: {row[2]}")
        
    print("\n--- Verifying Cities ---")
    cursor.execute("SELECT COUNT(*) FROM cities")
    city_count = cursor.fetchone()[0]
    print(f"Cities count: {city_count}")

if __name__ == "__main__":
    # Ensure current directory is project root
    verify_geography()
