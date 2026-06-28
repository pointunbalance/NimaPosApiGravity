import requests
import json
import time

time.sleep(5)
BASE_URL = "http://localhost:8000/api/v1"

def get_token():
    # Login with PIN (Default owner: 1234)
    resp = requests.post(f"{BASE_URL}/auth/login", json={"pin": "1234", "branch_id": 1})
    if resp.status_code != 200:
        print(f"Login failed: {resp.status_code}, {resp.text}")
        exit(1)
    return resp.json()["data"]["token"]

def test_phase_14():
    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n--- Testing Phase 14: Parity & Precision ---")

    import random
    suffix = str(random.randint(1000, 9999))

    # 1. Product with Bilingual Name & Tiered Pricing
    print(f"\n1. Creating Product with suffix {suffix}...")
    p_data = {
        "sku": f"PH14-TEST-{suffix}",
        "name": "صنف تجريبي 14",
        "name_en": "Phase 14 Test Item",
        "price": 100,
        "price_wholesale": 80,
        "price_half_wholesale": 90,
        "price_other": 95,
        "cost_price": 50,
        "stock_qty": 100,
        "category": "Test",
        "is_important": True
    }
    resp = requests.post(f"{BASE_URL}/products", json=p_data, headers=headers)
    if resp.status_code not in (200, 201):
        print(f"Product creation failed: {resp.status_code}, {resp.text}")
        exit(1)
    product = resp.json()["data"]
    p_id = product["id"]
    print(f"Result: {resp.status_code}, Name EN: {product.get('name_en')}, Wholesale: {product.get('price_wholesale')}")

    # 2. Customer with Bilingual Name
    print("\n2. Creating Customer...")
    c_data = {
        "code": f"C-PH14-{suffix}",
        "name": "عميل تجريبي 14",
        "name_en": "Phase 14 Customer",
        "phone": "0123456789"
    }
    resp = requests.post(f"{BASE_URL}/customers", json=c_data, headers=headers)
    if resp.status_code not in (200, 201):
        print(f"Customer creation failed: {resp.status_code}, {resp.text}")
        exit(1)
    customer = resp.json()["data"]
    c_id = customer["id"]
    print(f"Result: {resp.status_code}, Name EN: {customer.get('name_en')}")

    # 3. Invoice & Profitability
    print("\n3. Testing Invoice Profitability...")
    inv_data = {
        "customer_id": c_id,
        "items": [
            {
                "product_id": p_id,
                "qty": 2,
                "unit_price": 100,
                "item_discount_type": "none",
                "item_discount_value": 0
            }
        ],
        "paid_amount": 200,
        "payment_method": "cash",
        "cart_discount_type": "none",
        "cart_discount_value": 0
    }
    resp = requests.post(f"{BASE_URL}/invoices/checkout", json=inv_data, headers=headers)
    if resp.status_code not in (200, 201):
        print(f"Checkout failed: {resp.status_code}, {resp.text}")
        exit(1)
    inv_id = resp.json()["data"]["invoice_id"]
    print(f"Checkout Result: {resp.status_code}, Invoice ID: {inv_id}")

    # Check profitability
    resp = requests.get(f"{BASE_URL}/invoices/{inv_id}/profitability", headers=headers)
    if resp.status_code != 200:
        print(f"Profitability check failed: {resp.status_code}, {resp.text}")
        exit(1)
    profit = resp.json()["data"]
    print(f"Profitability Result: Net Profit: {profit['net_profit']} (Expected: 100)")

    # 4. Safe Summary
    print("\n4. Testing Safe Daily Summary...")
    import datetime
    today = datetime.date.today().isoformat()
    resp = requests.get(f"{BASE_URL}/safes/1/summary?date={today}", headers=headers)
    if resp.status_code != 200:
        print(f"Safe summary failed: {resp.status_code}, {resp.text}")
        # exit(1) # Don't exit here, might be no data yet
    else:
        summary = resp.json()["data"]
        print(f"Daily Summary Result: Receipts (Sales): {summary['receipts']['sales']}, Net Flow: {summary['net_flow']}")

    # 5. Bulk Migrate
    print("\n5. Testing Bulk Migrate...")
    migrate_data = {"category": "Modern Category"}
    resp = requests.post(f"{BASE_URL}/products/bulk-migrate", json={"product_ids": [p_id], "payload": migrate_data}, headers=headers)
    print(f"Bulk Migrate Result: {resp.status_code}")
    
    # Final cleanup (optional)
    # requests.delete(f"{BASE_URL}/products/{p_id}", headers=headers)

if __name__ == "__main__":
    try:
        test_phase_14()
    except Exception as e:
        print(f"Error during verification: {e}")
