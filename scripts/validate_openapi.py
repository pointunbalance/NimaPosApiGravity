import httpx
import json

try:
    r = httpx.get("http://localhost:8000/openapi.json")
    r.raise_for_status()
    data = r.json()
    print(f"Keys: {list(data.keys())}")
    print(f"Paths count: {len(data['paths'])}")
    if "/api/v1/system/activate" in data["paths"]:
        print("FOUND activate in paths")
    else:
        print("NOT FOUND activate in paths")
except Exception as e:
    print(f"FAILED: {e}")
