from app.database.connection import get_connection
from app.models.maintenance import (
    MaintenanceOrderCreate, 
    MaintenanceOrderUpdate,
    DeviceModelCatalog
)
from typing import Optional, List
from datetime import datetime
import json

def create_maintenance_order(data: MaintenanceOrderCreate):
    conn = get_connection()
    cursor = conn.cursor()
    num = f"MTN-{datetime.now().strftime('%y%m%d%H%M%S')}"
    cursor.execute("""
        INSERT INTO maintenance_orders (order_number, customer_name, customer_phone, device_type, device_brand, device_model, serial_number, problem_description, status, priority, estimated_cost, branch_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (num, data.customer_name, data.customer_phone, data.device_type, data.device_brand, data.device_model, data.serial_number, data.problem_description, data.status, data.priority, data.estimated_cost, data.branch_id))
    order_id = cursor.lastrowid
    
    # ── Initial Status Log ──
    cursor.execute("""
        INSERT INTO maintenance_status_logs (order_id, old_status, new_status, notes, changed_by)
        VALUES (?, ?, ?, ?, ?)
    """, (order_id, None, data.status, "Order Created", "system"))
    
    conn.commit()
    return order_id

def get_maintenance_order(order_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM maintenance_orders WHERE id = ?", (order_id,))
    row = cursor.fetchone()
    return dict(row) if row else None

def update_maintenance_order(order_id: int, data: MaintenanceOrderUpdate, changed_by: str = "system"):
    conn = get_connection()
    cursor = conn.cursor()
    
    # Get old status for logging
    cursor.execute("SELECT status FROM maintenance_orders WHERE id = ?", (order_id,))
    old_row = cursor.fetchone()
    old_status = old_row["status"] if old_row else None

    fields = []
    values = []
    if data.diagnosis is not None: fields.append("diagnosis = ?"); values.append(data.diagnosis)
    if data.status is not None: fields.append("status = ?"); values.append(data.status)
    if data.final_cost is not None: fields.append("final_cost = ?"); values.append(data.final_cost)
    if data.paid_amount is not None: fields.append("paid_amount = ?"); values.append(data.paid_amount)
    if data.parts_used_json is not None: fields.append("parts_used_json = ?"); values.append(data.parts_used_json)
    if data.technician is not None: fields.append("technician = ?"); values.append(data.technician)
    if data.completed_at is not None: fields.append("completed_at = ?"); values.append(data.completed_at)
    if data.delivered_at is not None: fields.append("delivered_at = ?"); values.append(data.delivered_at)
    if data.notes is not None: fields.append("notes = ?"); values.append(data.notes)
    
    if not fields: return False
    
    values.append(order_id)
    cursor.execute(f"UPDATE maintenance_orders SET {', '.join(fields)} WHERE id = ?", tuple(values))
    
    # ── Status History Log ──
    if data.status and data.status != old_status:
        cursor.execute("""
            INSERT INTO maintenance_status_logs (order_id, old_status, new_status, notes, changed_by)
            VALUES (?, ?, ?, ?, ?)
        """, (order_id, old_status, data.status, data.notes or "Status updated", changed_by))
        
    conn.commit()
    return cursor.rowcount > 0

def list_maintenance_orders(status: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM maintenance_orders"
    params = []
    if status:
        query += " WHERE status = ?"
        params.append(status)
    query += " ORDER BY received_at DESC"
    cursor.execute(query, tuple(params))
    return [dict(row) for row in cursor.fetchall()]

# ── Status History ──

def get_status_history(order_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM maintenance_status_logs WHERE order_id = ? ORDER BY changed_at DESC", (order_id,))
    return [dict(row) for row in cursor.fetchall()]

# ── Image Management ──

def add_maintenance_image(order_id: int, kind: str, original_name: str, stored_path: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO maintenance_images (order_id, kind, original_name, stored_path)
        VALUES (?, ?, ?, ?)
    """, (order_id, kind, original_name, stored_path))
    conn.commit()
    return cursor.lastrowid

def list_maintenance_images(order_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM maintenance_images WHERE order_id = ?", (order_id,))
    return [dict(row) for row in cursor.fetchall()]

# ── Device Catalog ──

def list_device_models(device_type: Optional[str] = None, active_only: bool = True):
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM device_models_catalog WHERE 1=1"
    params = []
    if device_type:
        query += " AND device_type = ?"
        params.append(device_type)
    if active_only:
        query += " AND active = 1"
    query += " ORDER BY brand, model"
    cursor.execute(query, tuple(params))
    return [dict(row) for row in cursor.fetchall()]

def create_device_model(data: DeviceModelCatalog):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO device_models_catalog (device_type, model, brand, notes, active)
        VALUES (?, ?, ?, ?, ?)
    """, (data.device_type, data.model, data.brand, data.notes, data.active))
    conn.commit()
    return cursor.lastrowid

# ── Invoice Versioning ──

def create_invoice_version(order_id: int, payload_json: str, created_by: str, reason: str = None):
    conn = get_connection()
    cursor = conn.cursor()
    
    # Get next version number
    cursor.execute("SELECT COALESCE(MAX(version), 0) + 1 FROM maintenance_invoice_versions WHERE order_id = ?", (order_id,))
    version = cursor.fetchone()[0]
    
    cursor.execute("""
        INSERT INTO maintenance_invoice_versions (order_id, version, reason, payload_json, created_by)
        VALUES (?, ?, ?, ?, ?)
    """, (order_id, version, reason, payload_json, created_by))
    conn.commit()
    return version

def list_invoice_versions(order_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM maintenance_invoice_versions WHERE order_id = ? ORDER BY version DESC", (order_id,))
    return [dict(row) for row in cursor.fetchall()]
