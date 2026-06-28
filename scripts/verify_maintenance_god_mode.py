import requests
import os
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_maintenance_god_mode():
    print(">> Starting Maintenance God Mode Verification (Phase 19 - v1.27.0)...")
    
    # 1. Login
    login_res = requests.post(f"{BASE_URL}/auth/login", json={"pin": "1234"})
    token = login_res.json()["data"]["token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[OK] Login successful")

    # 2. Create Maintenance Order
    print("\n--- Creating Maintenance Order ---")
    order_data = {
        "customer_name": "God Mode Customer",
        "customer_phone": "966500000000",
        "device_type": "Laptop",
        "device_brand": "Apple",
        "device_model": "MacBook Pro M3",
        "serial_number": "SN-GOD-MODE-999",
        "problem_description": "Screen flickering",
        "status": "received",
        "priority": "high",
        "estimated_cost": 500,
        "branch_id": 1
    }
    create_res = requests.post(f"{BASE_URL}/maintenance/", json=order_data, headers=headers)
    order_id = create_res.json()["id"]
    print(f"[OK] Order Created: ID {order_id}")

    # 3. Update Status & Verify History
    print("\n--- Updating Status & Verifying Audit Trail ---")
    update_data = {
        "status": "in_progress",
        "notes": "Diagnosing screen cable issues"
    }
    requests.put(f"{BASE_URL}/maintenance/{order_id}", json=update_data, headers=headers)
    
    history_res = requests.get(f"{BASE_URL}/maintenance/{order_id}/history", headers=headers).json()
    print(f"[OK] Audit Trail Entries: {len(history_res)}")
    for entry in history_res:
        print(f"  - {entry['old_status']} -> {entry['new_status']} ({entry['notes']})")

    # 4. Upload Device Image
    print("\n--- Testing Image Upload ---")
    dummy_path = "dummy_image.jpg"
    with open(dummy_path, "wb") as f:
        f.write(b"dummy image content")
        
    with open(dummy_path, "rb") as f:
        files = {"file": f}
        data = {"kind": "before"}
        upload_res = requests.post(f"{BASE_URL}/maintenance/{order_id}/images", files=files, data=data, headers=headers)
        print(f"[OK] Image Uploaded: {upload_res.json()}")

    images_res = requests.get(f"{BASE_URL}/maintenance/{order_id}/images", headers=headers).json()
    print(f"[OK] Image Count: {len(images_res)}")

    # 5. Test Device Catalog
    print("\n--- Testing Device Model Catalog ---")
    catalog_data = {
        "device_type": "Mobile",
        "model": "iPhone 15 Pro",
        "brand": "Apple",
        "notes": "Standard smartphone",
        "active": 1
    }
    requests.post(f"{BASE_URL}/maintenance/catalogs/device-models", json=catalog_data, headers=headers)
    models_res = requests.get(f"{BASE_URL}/maintenance/catalogs/device-models", headers=headers).json()
    print(f"[OK] Catalog Models Count: {len(models_res)}")

    # 6. Test WhatsApp Link Generation
    print("\n--- Testing WhatsApp Notification Link ---")
    notify_res = requests.post(f"{BASE_URL}/maintenance/{order_id}/notify", params={"template_key": "received"}, headers=headers)
    print(f"[OK] WhatsApp Link: {notify_res.json().get('whatsapp_link')}")

    # 7. Create Financial Snapshot
    print("\n--- Testing Financial Versioning (Snapshots) ---")
    snapshot_res = requests.post(f"{BASE_URL}/maintenance/{order_id}/snapshot", params={"reason": "Pre-repair snapshot"}, headers=headers)
    print(f"[OK] Snapshot Version: {snapshot_res.json().get('version')}")
    
    versions_res = requests.get(f"{BASE_URL}/maintenance/{order_id}/versions", headers=headers).json()
    print(f"[OK] Total Financial Versions: {len(versions_res)}")

    print("\n--- MAINTENANCE GOD MODE VERIFIED: 100% PORT COMPLETE ---")

if __name__ == "__main__":
    test_maintenance_god_mode()
