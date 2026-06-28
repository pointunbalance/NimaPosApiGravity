from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional
from pydantic import BaseModel
from app.database.connection import get_connection
import json
import logging
import hashlib
import hmac
from app.middleware.auth_middleware import require_role

router = APIRouter(prefix="/online", tags=["Online Commerce Engine"])
logger = logging.getLogger(__name__)

# --- Models ---
class OnlineChannel(BaseModel):
    id: Optional[int] = None
    key: str
    name: str
    is_active: int = 1
    settings_json: str = "{}"

class OnlineOrder(BaseModel):
    id: Optional[int] = None
    order_no: str
    external_ref: Optional[str] = None
    channel_id: int
    customer_id: Optional[int] = None
    branch_id: int = 1
    status: str = "pending"
    payment_status: str = "pending"
    fulfillment_status: str = "unfulfilled"
    total: float = 0
    shipping_address: Optional[str] = None

# --- Channel Endpoints ---

@router.get("/channels", response_model=List[OnlineChannel])
def list_channels():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM online_channels")
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]

@router.post("/channels", response_model=OnlineChannel)
def create_channel(channel: OnlineChannel):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO online_channels (key, name, is_active, settings_json)
            VALUES (?, ?, ?, ?)
        """, (channel.key, channel.name, channel.is_active, channel.settings_json))
        conn.commit()
        channel.id = cursor.lastrowid
        return channel
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# --- Order Endpoints ---

@router.get("/orders", response_model=List[OnlineOrder])
def list_orders(channel_id: Optional[int] = None, status: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM online_orders WHERE 1=1"
    params = []
    if channel_id:
        query += " AND channel_id = ?"
        params.append(channel_id)
    if status:
        query += " AND status = ?"
        params.append(status)
    
    cursor.execute(query, tuple(params))
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]

# --- Webhook Engine ---

def verify_hmac(body: bytes, secret: str, signature: str):
    if not secret or not signature:
        return False
    expected = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)

@router.post("/webhooks/{source}")
async def handle_webhook(source: str, request: Request, dedupe_key: Optional[str] = None):
    # Retrieve webhook secret for the source (channel)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT settings_json FROM online_channels WHERE key = ?", (source,))
    channel = cursor.fetchone()
    secret = None
    if channel:
        settings = json.loads(channel['settings_json'])
        secret = settings.get("webhook_secret")
    
    payload = await request.body()
    signature = request.headers.get("X-Nima-Signature")
    
    if secret and not verify_hmac(payload, secret, signature):
        raise HTTPException(status_code=401, detail="Invalid signature")
    
    payload_str = payload.decode("utf-8")
    
    if not dedupe_key:
        dedupe_key = hashlib.md5(payload).hexdigest()

    try:
        cursor.execute("""
            INSERT INTO webhook_events (source, dedupe_key, payload, status)
            VALUES (?, ?, ?, 'pending')
        """, (source, dedupe_key, payload_str))
        conn.commit()
        return {"status": "accepted", "event_id": cursor.lastrowid}
    except Exception as e:
        if "UNIQUE" in str(e):
            return {"status": "ignored", "reason": "duplicate"}
        raise HTTPException(status_code=400, detail=str(e))

# --- Dead Letter Queue (DLQ) ---

@router.get("/dlq", dependencies=[Depends(require_role(["owner", "admin"]))])
def list_dlq(status: str = "pending"):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM integration_dead_letters WHERE status = ?", (status,))
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]

@router.post("/dlq/{dlq_id}/retry", dependencies=[Depends(require_role(["owner", "admin"]))])
async def retry_dlq_event(dlq_id: int):
    # Simulated retry logic - in a real system, this would trigger an outbound HTTP POST
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM integration_dead_letters WHERE id = ?", (dlq_id,))
    event = cursor.fetchone()
    if not event:
        raise HTTPException(status_code=404, detail="DLQ event not found")
    
    # Simulate success for this porting phase
    cursor.execute("""
        UPDATE integration_dead_letters 
        SET status = 'resolved', attempts = attempts + 1, resolved_at = CURRENT_TIMESTAMP 
        WHERE id = ?
    """, (dlq_id,))
    conn.commit()
    return {"message": "Retry successful", "dlq_id": dlq_id}
