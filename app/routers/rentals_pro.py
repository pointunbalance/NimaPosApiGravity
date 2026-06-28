from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from app.database.connection import get_connection
from datetime import datetime
import logging

router = APIRouter(prefix="/rentals-pro", tags=["Rentals Pro"])
logger = logging.getLogger(__name__)

# --- Models ---
class RentalProBooking(BaseModel):
    id: Optional[int] = None
    rental_no: str
    customer_id: Optional[int] = None
    customer_name: str
    branch_id: int = 1
    product_id: int
    status: str = "active"
    pickup_at: str
    due_at: str
    returned_at: Optional[str] = None
    rental_fee: float = 0
    deposit_amount: float = 0
    penalty_amount: float = 0
    paid_amount: float = 0
    notes: Optional[str] = None

# --- Endpoints ---

@router.get("/bookings", response_model=List[RentalProBooking])
def list_rentals(branch_id: int = 1, status: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM rental_bookings WHERE branch_id = ?"
    params = [branch_id]
    if status:
        query += " AND status = ?"
        params.append(status)
    
    cursor.execute(query, tuple(params))
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]

@router.post("/bookings", response_model=RentalProBooking)
def create_rental(booking: RentalProBooking):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO rental_bookings (rental_no, customer_id, customer_name, branch_id, product_id, status, pickup_at, due_at, rental_fee, deposit_amount, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (booking.rental_no, booking.customer_id, booking.customer_name, booking.branch_id, booking.product_id, booking.status, booking.pickup_at, booking.due_at, booking.rental_fee, booking.deposit_amount, booking.notes))
        conn.commit()
        booking.id = cursor.lastrowid
        return booking
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/bookings/{booking_id}/return")
def return_rental(booking_id: int, penalty: float = 0, notes: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
        UPDATE rental_bookings 
        SET status = 'returned', returned_at = ?, penalty_amount = ?, notes = COALESCE(notes, '') || ?
        WHERE id = ?
    """, (now, penalty, f"\nReturn Note: {notes}" if notes else "", booking_id))
    
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    conn.commit()
    return {"status": "success", "returned_at": now}

@router.get("/overdue", response_model=List[RentalProBooking])
def list_overdue(branch_id: int = 1):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
        SELECT * FROM rental_bookings 
        WHERE branch_id = ? AND status = 'active' AND due_at < ?
    """, (branch_id, now))
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]
