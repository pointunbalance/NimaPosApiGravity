from app.database.connection import get_connection
from app.utils.hardware import get_hardware_fingerprint
from app.utils.crypto import verify_activation_key
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def get_activation_status():
    """Returns the current activation status and hardware ID."""
    hardware_id = get_hardware_fingerprint()
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM system_activation LIMIT 1")
    row = cursor.fetchone()
    
    if not row:
        return {"is_active": False, "hardware_id": hardware_id}
        
    res = dict(row)
    # Re-verify if it's still valid
    try:
        if res["is_active"]:
            verify_activation_key(res["license_key"], hardware_id)
            return {
                "is_active": True, 
                "hardware_id": hardware_id,
                "activated_at": res["activated_at"],
                "expires_at": res["expires_at"]
            }
    except Exception as e:
        logger.warning(f"Activation re-verification failed: {e}")
        # Auto-deactivate if verification fails
        cursor.execute("UPDATE system_activation SET is_active = 0 WHERE id = ?", (res["id"],))
        conn.commit()
        
    return {"is_active": False, "hardware_id": hardware_id}

def activate_system(license_key: str):
    """Verifies a license key and activates the system."""
    hardware_id = get_hardware_fingerprint()
    payload = verify_activation_key(license_key, hardware_id)
    
    conn = get_connection()
    cursor = conn.cursor()
    
    # Clear old records
    cursor.execute("DELETE FROM system_activation")
    
    # Insert new activation
    cursor.execute("""
        INSERT INTO system_activation (hardware_id, license_key, activated_at, expires_at, is_active)
        VALUES (?, ?, ?, ?, 1)
    """, (hardware_id, license_key, datetime.now().isoformat(), payload.get("expires_at"),))
    
    conn.commit()
    return True
