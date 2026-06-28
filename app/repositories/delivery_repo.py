from app.database.connection import get_connection
from app.models.delivery import DeliveryAssignmentCreate, DeliveryAssignmentUpdate
from typing import Optional

def assign_delivery(data: DeliveryAssignmentCreate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO delivery_assignments (invoice_id, driver_id, driver_name, customer_name, customer_phone, delivery_address, delivery_fee, branch_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (data.invoice_id, data.driver_id, data.driver_name, data.customer_name, data.customer_phone, data.delivery_address, data.delivery_fee, data.branch_id))
    conn.commit()
    return cursor.lastrowid

def update_delivery_status(assignment_id: int, data: DeliveryAssignmentUpdate):
    conn = get_connection()
    cursor = conn.cursor()
    fields = []
    values = []
    if data.status: fields.append("status = ?"); values.append(data.status)
    if data.collected_amount: fields.append("collected_amount = ?"); values.append(data.collected_amount)
    if data.is_settled is not None: fields.append("is_settled = ?"); values.append(data.is_settled)
    if data.picked_at: fields.append("picked_at = ?"); values.append(data.picked_at)
    if data.delivered_at: fields.append("delivered_at = ?"); values.append(data.delivered_at)
    
    if not fields: return False
    values.append(assignment_id)
    cursor.execute(f"UPDATE delivery_assignments SET {', '.join(fields)} WHERE id = ?", tuple(values))
    conn.commit()
    return cursor.rowcount > 0

def list_deliveries(driver_id: Optional[int] = None, status: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM delivery_assignments WHERE 1=1"
    params = []
    if driver_id:
        query += " AND driver_id = ?"
        params.append(driver_id)
    if status:
        query += " AND status = ?"
        params.append(status)
    query += " ORDER BY assigned_at DESC"
    cursor.execute(query, tuple(params))
    return [dict(row) for row in cursor.fetchall()]


def get_delivery(assignment_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM delivery_assignments WHERE id = ?", (assignment_id,)).fetchone()
    return dict(row) if row else None


def delete_delivery(assignment_id: int):
    conn = get_connection()
    cursor = conn.execute("DELETE FROM delivery_assignments WHERE id = ?", (assignment_id,))
    conn.commit()
    return cursor.rowcount > 0
