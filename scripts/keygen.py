import sys
import os
from datetime import datetime, timedelta

# Add parent dir to path to import app utils
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from app.utils.hardware import get_hardware_fingerprint
    from app.utils.crypto import sign_payload
except ImportError:
    # If run from project root
    from app.utils.hardware import get_hardware_fingerprint
    from app.utils.crypto import sign_payload

def generate_key(days=365):
    hfp = get_hardware_fingerprint()
    exp_date = (datetime.now() + timedelta(days=days)).isoformat()
    
    payload = {
        "hardware_id": hfp,
        "expires_at": exp_date,
        "issued_at": datetime.now().isoformat()
    }
    
    key = sign_payload(payload)
    print(f"Hardware ID: {hfp}")
    print(f"Expiry Date: {exp_date}")
    print(f"Activation Key:\n{key}")

if __name__ == "__main__":
    generate_key()
