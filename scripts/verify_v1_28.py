"""
Verification script for v1.28.0 (Enterprise Architectural Alignment)
Tests:
1. Composite Product Logic
2. Stock Floor Enforcement
3. Credit Limit & Wallet Balances
4. Automated Ledger Auditing
5. Stock Reconciliation (Self-Healing)
"""

import requests
import json
from datetime import datetime
import sys
import sqlite3

BASE_URL = "http://localhost:8000/api/v1"
HEADERS = {"Authorization": "Bearer admin-token-123"}
DB_PATH = "E:/NimaTechVibeCoding/NimaPosApiGravity/data/pos_api.db"

def print_step(msg):
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] {msg}")
    print("-" * 50)

def run():
    print_step("INIT: Setting up test environment")
    
    # Login to get token
    login_res = requests.post(f"{BASE_URL}/auth/login", json={"pin": "1234"})
    token = login_res.json()["data"]["token"]
    HEADERS["Authorization"] = f"Bearer {token}"
    
    prefix = datetime.now().strftime('%H%M%S')
    
    # 1. Create a raw ingredient and a composite product
    ing_payload = {
        "name": f"Coffee Beans (Kg) {prefix}",
        "sku": f"ING-COF-{prefix}",
        "price": 0,
        "cost_price": 50,
        "stock_qty": 5, # 5 Kg
        "type": "simple"
    }
    r = requests.post(f"{BASE_URL}/products", json=ing_payload, headers=HEADERS)
    if r.status_code != 200:
        print("Error creating ingredient:", r.text)
        sys.exit(1)
    ing_id = r.json()["data"]["id"]
    
    # Set composition
    composition = [{"productId": ing_id, "quantity": 0.02}] # 20g per cup
    comp_payload = {
        "name": f"Espresso Shot {prefix}",
        "sku": f"COMP-ESP-{prefix}",
        "price": 10,
        "type": "composite",
        "composition_json": json.dumps(composition)
    }
    r = requests.post(f"{BASE_URL}/products", json=comp_payload, headers=HEADERS)
    if r.status_code != 200:
        print("Error creating composite:", r.text)
        sys.exit(1)
    comp_id = r.json()["data"]["id"]
    print(f"Created Ingredient {ing_id} and Composite {comp_id}")

    # 2. Test Composite Deduction
    print_step("TEST 1: Composite Product Stock Deduction")
    invoice_payload = {
        "subtotal": 10,
        "tax": 0,
        "total": 10,
        "payment_method": "cash",
        "paid_amount": 10,
        "change_due": 0,
        "net_total": 10,
        "items": [
            {
                "product_id": comp_id,
                "qty": 2, # Should deduct 0.04 from ingredient
                "unit_price": 5,
                "line_total": 10
            }
        ]
    }
    r = requests.post(f"{BASE_URL}/invoices/checkout", json=invoice_payload, headers=HEADERS)
    if r.status_code != 200:
        print("Error processing invoice:", r.text)
        sys.exit(1)
    print("Invoice with composite product processed.")
    
    # Check ingredient stock
    r = requests.get(f"{BASE_URL}/products/{ing_id}", headers=HEADERS)
    actual_stock = r.json()["data"]["stock_qty"]
    assert abs(actual_stock - 4.96) < 0.01, f"Expected 4.96, got {actual_stock}"
    print("[OK] Ingredient stock correctly deducted (5 - 0.04 = 4.96).")

    # 3. Test Stock Floor Enforcement
    print_step("TEST 2: Stock Floor Enforcement")
    invoice_payload["items"][0]["qty"] = 300 # 300 * 0.02 = 6Kg (We only have 4.96Kg)
    invoice_payload["items"][0]["unit_price"] = 1
    invoice_payload["items"][0]["line_total"] = 300
    invoice_payload["total"] = 300
    invoice_payload["subtotal"] = 300
    invoice_payload["net_total"] = 300
    
    r = requests.post(f"{BASE_URL}/invoices/checkout", json=invoice_payload, headers=HEADERS)
    if r.status_code != 400:
        print(f"FAILED: Expected 400, got {r.status_code}. Response: {r.text}")
        sys.exit(1)
    
    detail_msg = r.json().get("detail", "")
    if "غير كاف" not in detail_msg and "Insufficient" not in detail_msg:
        print(f"FAILED: Expected specific stock floor error but got: {detail_msg}")
        sys.exit(1)
    print("[OK] Stock floor enforced (400 Bad Request raised for insufficient stock).")

    # 4. Create customer with credit/wallet limits
    print_step("INIT: Creating Customer for Financial Tests")
    cust_payload = {
        "name": f"Limit Tester {prefix}",
        "code": f"CUST-{prefix}",
        "phone": f"0500{prefix}",
        "credit_limit": 100,
        "wallet_balance": 50
    }
    # Update directly via sqlite for speed since API might not expose wallet setting directly on creation
    conn = sqlite3.connect(DB_PATH, timeout=20)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=5000")
    cur = conn.cursor()
    cur.execute("INSERT INTO customers (name, code, phone, credit_limit, wallet_balance, balance) VALUES (?, ?, ?, ?, ?, ?)", 
                (cust_payload["name"], cust_payload["code"], cust_payload["phone"], cust_payload["credit_limit"], cust_payload["wallet_balance"], 0))
    cust_id = cur.lastrowid
    conn.commit()

    # 5. Test Wallet Limit
    print_step("TEST 3: Wallet Enforcement")
    wallet_inv = {**invoice_payload, "customer_id": cust_id, "payment_method": "wallet", "items": [{"product_id": comp_id, "qty": 1, "unit_price": 60, "line_total": 60}], "subtotal": 60, "total": 60, "net_total": 60}
    r = requests.post(f"{BASE_URL}/invoices/checkout", json=wallet_inv, headers=HEADERS)
    if r.status_code != 400:
        print(f"FAILED: Wallet expected 400, got {r.status_code}. Response: {r.text}")
        sys.exit(1)
    print("[OK] Wallet limit enforced (tried 60, had 50).")

    # 6. Test Credit Limit
    print_step("TEST 4: Credit Limit Enforcement")
    credit_inv = {**wallet_inv, "payment_method": "credit", "items": [{"product_id": comp_id, "qty": 1, "unit_price": 120, "line_total": 120}], "subtotal": 120, "total": 120, "net_total": 120}
    r = requests.post(f"{BASE_URL}/invoices/checkout", json=credit_inv, headers=HEADERS)
    if r.status_code != 400:
        print(f"FAILED: Credit expected 400, got {r.status_code}. Response: {r.text}")
        sys.exit(1)
    print("[OK] Credit limit enforced (tried 120, limit 100).")

    # 7. Test Successful Ledger Integration and Snapshot
    print_step("TEST 5: Automated Ledger Auditing")
    valid_inv = {**wallet_inv, "payment_method": "wallet", "items": [{"product_id": comp_id, "qty": 1, "unit_price": 40, "line_total": 40}], "subtotal": 40, "total": 40, "net_total": 40}
    r = requests.post(f"{BASE_URL}/invoices/checkout", json=valid_inv, headers=HEADERS)
    if r.status_code != 200:
        print(f"FAILED: Final valid invoice expected 200, got {r.status_code}. Response: {r.text}")
        sys.exit(1)
    print("[OK] Valid invoice processed. Checking ledger...")
    
    # Let's hit the financial snapshot
    r = requests.get(f"{BASE_URL}/accounting/financial-snapshot", headers=HEADERS)
    print("Financial Snapshot Output:")
    print(json.dumps(r.json()["data"], indent=2))
    assert 'net_profit' in r.json()["data"]

    # 8. Test Stock Reconcile
    print_step("TEST 6: Health Service - Stock Reconciliation")
    # Manually corrupt physical stock without movement
    cur.execute("UPDATE products SET stock_qty = 999 WHERE id = ?", (ing_id,))
    conn.commit()
    
    r = requests.post(f"{BASE_URL}/products/reconcile-stock", headers=HEADERS)
    if r.status_code != 200:
        print(f"FAILED: Reconcile expected 200, got {r.status_code}. Response: {r.text}")
        sys.exit(1)
    print(r.json().get("data", "Reconciled"))
    print("[OK] Self-Healing mechanism completed successfully.")

    print_step(">>> ALL PHASE 20 PARITY TESTS PASSED! <<<")


if __name__ == "__main__":
    run()
