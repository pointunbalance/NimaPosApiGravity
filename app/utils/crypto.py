import hmac
import hashlib
import base64
import json
from datetime import datetime
from app.config import JWT_SECRET as SECRET_KEY

def sign_payload(payload: dict) -> str:
    """
    Signs a dictionary payload using HMAC-SHA256 and returns a Base64 encoded string.
    Format: B64(Signature + "." + JSON_Payload)
    """
    json_data = json.dumps(payload, sort_keys=True)
    signature = hmac.new(
        SECRET_KEY.encode(),
        json_data.encode(),
        hashlib.sha256
    ).hexdigest()
    
    combined = f"{signature}.{json_data}"
    return base64.b64encode(combined.encode()).decode()

def verify_activation_key(key: str, hardware_id: str) -> dict:
    """
    Verifies an activation key against the current hardware fingerprint.
    Returns the payload if valid, otherwise raises an exception.
    """
    try:
        decoded = base64.b64decode(key.encode()).decode()
        signature, json_data = decoded.split(".", 1)
        
        # Verify Signature
        expected_signature = hmac.new(
            SECRET_KEY.encode(),
            json_data.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(signature, expected_signature):
            raise ValueError("Invalid activation key signature.")
            
        payload = json.loads(json_data)
        
        # Verify Hardware ID
        if payload.get("hardware_id") != hardware_id:
            raise ValueError("Activation key does not match this hardware.")
            
        # Verify Expiration
        exp_date_str = payload.get("expires_at")
        if exp_date_str:
            exp_date = datetime.fromisoformat(exp_date_str)
            if datetime.now() > exp_date:
                raise ValueError("Activation key has expired.")
                
        return payload
        
    except Exception as e:
        raise ValueError(f"Activation verification failed: {str(e)}")
