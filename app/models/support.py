from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class SupportTicketCreate(BaseModel):
    customer_id: int
    invoice_id: Optional[int] = None
    subject: str
    description: str
    priority: str = "normal" # low, normal, high, urgent
    category: str = "complaint" # complaint, inquiry, refund_request

class SupportTicketOut(SupportTicketCreate):
    id: int
    status: str
    created_at: str
    updated_at: str

class TicketMessageCreate(BaseModel):
    ticket_id: int
    sender_type: str # customer, staff
    sender_id: int
    message: str

class TicketMessageOut(TicketMessageCreate):
    id: int
    created_at: str
