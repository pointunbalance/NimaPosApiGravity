from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from app.database.connection import get_connection
from app.middleware.auth_middleware import get_current_user
import logging

router = APIRouter(prefix="/hospitality", tags=["Hospitality / Kitchen"])
logger = logging.getLogger(__name__)

# --- Models ---
class TableResource(BaseModel):
    id: Optional[int] = None
    table_no: str
    capacity: int = 2
    zone: Optional[str] = None
    status: str = "available"
    is_active: int = 1

class TableReservation(BaseModel):
    id: Optional[int] = None
    table_id: int
    customer_name: str
    customer_phone: Optional[str] = None
    party_size: int = 1
    start_at: str
    end_at: str
    status: str = "reserved"
    notes: Optional[str] = None

class KitchenTicketItem(BaseModel):
    id: Optional[int] = None
    ticket_id: int
    product_id: Optional[int] = None
    item_name: str
    qty: float = 1.0
    status: str = "queued"
    notes: Optional[str] = None

class KitchenTicket(BaseModel):
    id: Optional[int] = None
    ticket_no: str
    branch_id: int = 1
    source_type: str = "manual"
    source_ref: Optional[str] = None
    customer_name: Optional[str] = None
    priority: str = "normal"
    status: str = "queued"
    items: List[KitchenTicketItem] = []

# --- Table Endpoints ---

@router.get("/tables", response_model=List[TableResource])
def list_tables(branch_id: int = 1, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM table_resources WHERE branch_id = ?", (branch_id,))
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]

@router.post("/tables", response_model=TableResource)
def create_table(table: TableResource, branch_id: int = 1, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO table_resources (branch_id, table_no, capacity, zone, status, is_active)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (branch_id, table.table_no, table.capacity, table.zone, table.status, table.is_active))
        conn.commit()
        table.id = cursor.lastrowid
        return table
    except Exception as e:
        conn.rollback()
        logger.error(f"Create table error: {str(e)}")
        raise HTTPException(status_code=400, detail="Failed to create table")

@router.get("/reservations", response_model=List[TableReservation])
def list_reservations(branch_id: int = 1, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM table_reservations WHERE branch_id = ?", (branch_id,))
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]

@router.post("/reservations", response_model=TableReservation)
def create_reservation(res: TableReservation, branch_id: int = 1, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO table_reservations (branch_id, table_id, customer_name, customer_phone, party_size, start_at, end_at, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (branch_id, res.table_id, res.customer_name, res.customer_phone, res.party_size, res.start_at, res.end_at, res.status, res.notes))
        conn.commit()
        res.id = cursor.lastrowid
        return res
    except Exception as e:
        conn.rollback()
        logger.error(f"Create reservation error: {str(e)}")
        raise HTTPException(status_code=400, detail="Failed to create reservation")

# --- KDS Endpoints ---

@router.get("/kitchen/tickets", response_model=List[KitchenTicket])
def list_kitchen_tickets(branch_id: int = 1, status: Optional[str] = None, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM kitchen_tickets WHERE branch_id = ?"
    params = [branch_id]
    if status:
        query += " AND status = ?"
        params.append(status)
    
    cursor.execute(query, tuple(params))
    ticket_rows = cursor.fetchall()
    cols = [d[0] for d in cursor.description]
    
    tickets = []
    for row in ticket_rows:
        t_dict = dict(zip(cols, row))
        # Fetch items
        cursor.execute("SELECT * FROM kitchen_ticket_items WHERE ticket_id = ?", (t_dict['id'],))
        i_cols = [d[0] for d in cursor.description]
        t_dict['items'] = [dict(zip(i_cols, i_row)) for i_row in cursor.fetchall()]
        tickets.append(t_dict)
    return tickets

@router.post("/kitchen/tickets", response_model=KitchenTicket)
def create_kitchen_ticket(ticket: KitchenTicket, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO kitchen_tickets (ticket_no, branch_id, source_type, source_ref, customer_name, priority, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (ticket.ticket_no, ticket.branch_id, ticket.source_type, ticket.source_ref, ticket.customer_name, ticket.priority, ticket.status))
        ticket_id = cursor.lastrowid
        
        for item in ticket.items:
            cursor.execute("""
                INSERT INTO kitchen_ticket_items (ticket_id, product_id, item_name, qty, status, notes)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (ticket_id, item.product_id, item.item_name, item.qty, item.status, item.notes))
        
        conn.commit()
        ticket.id = ticket_id
        return ticket
    except Exception as e:
        conn.rollback()
        logger.error(f"Create kitchen ticket error: {str(e)}")
        raise HTTPException(status_code=400, detail="Failed to create kitchen ticket")

@router.patch("/kitchen/tickets/{ticket_id}/status")
def update_ticket_status(ticket_id: int, status: str, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE kitchen_tickets SET status = ? WHERE id = ?", (status, ticket_id))
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    conn.commit()
    return {"status": "success"}

@router.patch("/kitchen/items/{item_id}/status")
def update_item_status(item_id: int, status: str, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE kitchen_ticket_items SET status = ? WHERE id = ?", (status, item_id))
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    conn.commit()
    return {"status": "success"}
