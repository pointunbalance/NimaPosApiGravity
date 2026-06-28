from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from app.database.connection import get_connection
from app.models.common import ApiResponse
from app.middleware.auth_middleware import get_current_user, require_role
import logging
from datetime import datetime

router = APIRouter(prefix="/notifications", tags=["Unified Notification Engine"])
logger = logging.getLogger(__name__)

# --- Models ---
class Notification(BaseModel):
    id: Optional[int] = None
    customer_id: Optional[int] = None
    channel: str # sms, whatsapp, email
    recipient: str
    subject: Optional[str] = None
    content: str
    status: str = "pending"
    sent_at: Optional[str] = None
    error_message: Optional[str] = None

# --- Endpoints ---

@router.get("/", response_model=ApiResponse)
def list_notifications(
    channel: Optional[str] = None,
    status: Optional[str] = None,
    user: dict = Depends(require_role(["manager", "owner", "admin"])),
):
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM notifications WHERE 1=1"
    params = []
    if channel:
        query += " AND channel = ?"
        params.append(channel)
    if status:
        query += " AND status = ?"
        params.append(status)
    
    cursor.execute(query, tuple(params))
    cols = [d[0] for d in cursor.description]
    return ApiResponse(ok=True, data=[dict(zip(cols, row)) for row in cursor.fetchall()])

@router.post("/send", response_model=ApiResponse)
def send_notification(notif: Notification, user: dict = Depends(get_current_user)):
    """
    Queue a notification for sending. 
    In a real system, this would trigger a background task (e.g. Celery).
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO notifications (customer_id, channel, recipient, subject, content, status)
            VALUES (?, ?, ?, ?, ?, 'pending')
        """, (notif.customer_id, notif.channel, notif.recipient, notif.subject, notif.content))
        conn.commit()
        notif.id = cursor.lastrowid
        
        # Simulate immediate 'sent' for demo purposes if it's a simple system
        # update_notification_status(notif.id, "sent")
        
        return ApiResponse(ok=True, data=notif.model_dump())
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{notif_id}/status", response_model=ApiResponse)
def update_notification_status(
    notif_id: int,
    status: str,
    error: Optional[str] = None,
    user: dict = Depends(require_role(["manager", "owner", "admin"])),
):
    conn = get_connection()
    cursor = conn.cursor()
    sent_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S") if status == "sent" else None
    cursor.execute("""
        UPDATE notifications 
        SET status = ?, sent_at = ?, error_message = ?
        WHERE id = ?
    """, (status, sent_at, error, notif_id))
    conn.commit()
    return ApiResponse(ok=True, data={"status": "success", "id": notif_id})
