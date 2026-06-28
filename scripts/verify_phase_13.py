"""Verification script for Phase 13 features."""
import os
import sys
import json

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import get_connection
from app.repositories import safe_repo, purchase_repo, product_repo

def setup_test_data():
    conn = get_connection()
    # 1. Ensure a supplier exists
    conn.execute(
        "INSERT OR IGNORE INTO suppliers (id, code, name, is_active) VALUES (1, 'SUP-TEST', 'Test Supplier', 1)"
    )
    # 2. Ensure users exist for transfer log
    conn.execute(
        "INSERT OR IGNORE INTO users (id, username, role) VALUES (1, 'admin', 'owner')"
    )
    conn.execute(
        "INSERT OR IGNORE INTO users (id, username, role) VALUES (2, 'manager', 'manager')"
    )
    conn.commit()

def test_safe_management():
    print("\n--- Testing Safe Management ---")
    setup_test_data()
    safes = safe_repo.list_safes()
    print(f"Total Safes: {len(safes)}")
    
    # Create a new safe
    new_safe_id = safe_repo.create_safe({"name": "Secondary Safe", "balance": 1000})
    print(f"Created Safe ID: {new_safe_id}")
    
    # Transfer
    try:
        transfer_id = safe_repo.transfer_funds({
            "from_safe_id": new_safe_id,
            "to_safe_id": 1,
            "amount": 500,
            "transferor_id": 1,
            "receiver_id": 2,
            "notes": "Internal transfer test"
        })
        print(f"Transfer successful! Transfer ID: {transfer_id}")
        
        # Check balances
        safe1 = safe_repo.get_safe(1)
        safe2 = safe_repo.get_safe(new_safe_id)
        print(f"Safe 1 Balance: {safe1['balance']}")
        print(f"Safe 2 Balance: {safe2['balance']}")
    except Exception as e:
        print(f"Transfer failed: {e}")

def test_bonus_and_auto_price():
    print("\n--- Testing Bonus & Auto-Price Logic ---")
    conn = get_connection()
    setup_test_data()
    
    # Clean up old test product if any
    conn.execute("DELETE FROM products WHERE sku = 'TEST-P13'")
    
    # Create a dummy product
    p_id = conn.execute(
        "INSERT INTO products (sku, name, price, cost_price, stock_qty) VALUES (?, ?, ?, ?, ?)",
        ("TEST-P13", "Phase 13 Test Product", 100, 50, 0)
    ).lastrowid
    conn.commit()
    
    print(f"Initial Product - Cost: 50, Stock: 0")
    
    # Create a purchase with bonus
    # Qty 10 @ 50 each + 10 Bonus = 20 Total Qty. 
    # Net Cost should be (10 * 50) / 20 = 25.
    items = [{
        "product_id": p_id,
        "quantity": 10,
        "bonus_qty": 10,
        "cost_price": 50,
        "new_price": 120 # Auto update price
    }]
    
    purchase_data = {
        "supplier_id": 1,
        "date": "2026-02-28",
        "items_json": json.dumps(items),
        "total_amount": 500,
        "update_sale_prices": True
    }
    
    p_id_res = purchase_repo.create(purchase_data)
    print(f"Created Purchase ID: {p_id_res}")
    
    # Verify product updates
    row = conn.execute("SELECT * FROM products WHERE id = ?", (p_id,)).fetchone()
    print(f"Final Product - Cost: {row['cost_price']}, Price: {row['price']}, Stock: {row['stock_qty']}")
    
    if row['cost_price'] == 25 and row['stock_qty'] == 20 and row['price'] == 120:
        print("✅ Bonus and Auto-Price logic PASSED!")
    else:
        print("❌ Logic FAILED!")

if __name__ == "__main__":
    test_safe_management()
    test_bonus_and_auto_price()

if __name__ == "__main__":
    test_safe_management()
    test_bonus_and_auto_price()
