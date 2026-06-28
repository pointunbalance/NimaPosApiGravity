import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def setup_test_data():
    print(">> Setting up test data for God Mode...")
    
    # 1. Login
    login_res = requests.post(f"{BASE_URL}/auth/login", json={"pin": "1234"})
    token = login_res.json()["data"]["token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Get a product
    prod_res = requests.get(f"{BASE_URL}/products", headers=headers).json()
    p_items = prod_res["data"]["items"] if "items" in prod_res["data"] else []
    
    if not p_items:
        print("[!] No products found.")
        return
    
    # 3. Create a test invoice
    payload = {
        "items": [
            {
                "product_id": p_items[0]["id"],
                "qty": 5,
                "unit_price": 50.0,
                "item_discount_type": "none",
                "item_discount_value": 0.0
            }
        ],
        "payment_method": "cash",
        "paid_amount": 300.0,
        "cart_discount_type": "none",
        "cart_discount_value": 0.0,
        "customer_id": 1
    }
    
    res = requests.post(f"{BASE_URL}/invoices/checkout", json=payload, headers=headers)
    if res.status_code == 200:
        print(f"[OK] Test Invoice Created: {res.json()['data']['invoice_id']}")
    else:
        print(f"[ERR] Failed to create test invoice: {res.text}")

if __name__ == "__main__":
    setup_test_data()
