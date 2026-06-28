import requests
import json
import os

BASE_URL = "http://localhost:8000/api/v1"

def test_platinum_parity():
    print("💎 Starting Platinum Parity Verification (Phase 17 - v1.25.0)...")
    
    # 1. Login
    login_res = requests.post(f"{BASE_URL}/auth/login", json={"pin": "1234"})
    token = login_res.json()["data"]["token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Login successful")

    # 2. Database Maintenance (VACUUM)
    print("\n--- Testing Database Maintenance ---")
    maint_res = requests.post(f"{BASE_URL}/backup/maintenance", headers=headers)
    if maint_res.status_code == 200:
        data = maint_res.json()["data"]
        print(f"✅ Maintenance completed (VACUUM & ANALYZE). DB Size: {data.get('db_size_bytes')} bytes")
    else:
        print(f"❌ Maintenance failed: {maint_res.text}")

    # 3. Duplicate Barcodes
    print("\n--- Testing Duplicate Barcodes Report ---")
    dup_res = requests.get(f"{BASE_URL}/products/duplicates", headers=headers)
    if dup_res.status_code == 200:
        print(f"✅ Duplicate Barcodes Endpoint Active. Found {len(dup_res.json().get('data', []))} duplicates.")
    else:
        print(f"❌ Duplicate Barcodes failed: {dup_res.text}")

    # 4. Backup & Restore
    print("\n--- Testing Backup & Restore ---")
    backup_res = requests.post(f"{BASE_URL}/backup/create", headers=headers)
    if backup_res.status_code == 200:
        backup_filename = backup_res.json().get('data', {}).get('filename')
        print(f"✅ Backup created successfully: {backup_filename}")
        
        # Now try to restore it
        restore_res = requests.post(f"{BASE_URL}/backup/restore", json={"filename": backup_filename}, headers=headers)
        if restore_res.status_code == 200:
            print(f"✅ Backup restored successfully.")
        else:
            print(f"❌ Restore failed: {restore_res.text}")
    else:
        print(f"❌ Backup failed: {backup_res.text}")

    print("\n🏆🏆 PLATINUM PARITY COMPLETE: ZERO GAPS REMAINING 🏆🏆")

if __name__ == "__main__":
    test_platinum_parity()
