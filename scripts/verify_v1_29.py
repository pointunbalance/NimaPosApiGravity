"""
Verify Script Phase 21: Customers CRM Financial Controls
"""
import requests
import sys
import time
import sqlite3

BASE_URL = "http://localhost:8000/api/v1"
DB_PATH = "data/pos_api.db"

def get_token():
    try:
        login_res = requests.post(f"{BASE_URL}/auth/login", json={"pin": "1234"})
        login_res.raise_for_status()
        return login_res.json()["data"]["token"]
    except Exception as e:
        print(f"FAILED to get token: {e}")
        sys.exit(1)
        print(f"FAILED to get token: {e}")
        sys.exit(1)

TOKEN = get_token()
HEADERS = {"Authorization": f"Bearer {TOKEN}"}

def print_step(msg):
    print(f"\n{'='*40}")
    print(f" {msg} ")
    print(f"{'='*40}")

def run():
    print_step("INIT: Verifying Database Reachability & Tokens")
    # Clean up test accounts
    conn = sqlite3.connect(DB_PATH, timeout=20)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=5000")
    conn.execute("DELETE FROM customers WHERE code LIKE 'TEST-CRM-%'")
    conn.commit()

    print_step("TEST 1: Customer Creation With Financials")
    ts = int(time.time())
    
    payload = {
        "code": f"TEST-CRM-{ts}",
        "name": f"Test Financial CRM {ts}",
        "balance": 5000.50,
        "wallet_balance": 150.00,
        "credit_limit": 10000.00
    }
    
    r = requests.post(f"{BASE_URL}/customers", json=payload, headers=HEADERS)
    if r.status_code != 200:
        print(f"FAILED: Expected 200 on creation, got {r.status_code}. Output: {r.text}")
        sys.exit(1)
        
    created = r.json().get("data", {})
    cust_id = created.get("id")
    print(f"[OK] Created Customer ID {cust_id}")
    
    if created.get("balance") != 5000.50 or created.get("wallet_balance") != 150.00 or created.get("credit_limit") != 10000.00:
        print(f"FAILED: Returned model structure did not match inserted properties. Output: {created}")
        sys.exit(1)
        
    print("[OK] Financial models accurately mirrored payload creation data.")
    
    print_step("TEST 2: Customer Update With Financials")
    
    update_payload = {
        "wallet_balance": 350.50,
        "credit_limit": 15000.00
    }
    
    r2 = requests.put(f"{BASE_URL}/customers/{cust_id}", json=update_payload, headers=HEADERS)
    if r2.status_code != 200:
        print(f"FAILED: Expected 200 on update, got {r2.status_code}. Output: {r2.text}")
        sys.exit(1)
        
    updated = r2.json().get("data", {})
    if updated.get("wallet_balance") != 350.50 or updated.get("credit_limit") != 15000.00:
        print(f"FAILED: Returned model structure did not update correctly. Output: {updated}")
        sys.exit(1)
        
    if updated.get("balance") != 5000.50:
         print(f"FAILED: Previous attributes not retained correctly during partial update. Output: {updated}")
         sys.exit(1)
         
    print("[OK] Financial attributes successfully accepted standard dict update without destroying sibling data.")

    print_step("TEST 3: Direct SQLite Validation")
    cur = conn.cursor()
    row = cur.execute("SELECT balance, wallet_balance, credit_limit FROM customers WHERE id = ?", (cust_id,)).fetchone()
    
    if not row or row[0] != 5000.50 or row[1] != 350.50 or row[2] != 15000.00:
        print(f"FAILED: SQLite Database assertions mismatched the returned APIs! Output: {row}")
        sys.exit(1)
        
    print("[OK] Native SQLite database successfully registered the schema binding payloads.")
    
    print("\n>>> ALL PHASE 21 PARITY TESTS PASSED! <<<")

if __name__ == "__main__":
    run()
