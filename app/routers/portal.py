from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.models.support import SupportTicketCreate, SupportTicketOut, TicketMessageCreate
from app.models.common import ApiResponse
from app.repositories import support_repo
from app.middleware.auth_middleware import get_current_user, require_role

router = APIRouter(prefix="/portal", tags=["[Phase 29] Customer Self-Service"])

@router.get("/summary/{customer_id}", response_model=ApiResponse[dict])
def get_dashboard(customer_id: int, user: dict = Depends(get_current_user)):
    """Public portal summary for a specific customer."""
    summary = support_repo.get_customer_portal_summary(customer_id)
    if not summary:
        raise HTTPException(status_code=404, detail="Customer not found")
    return ApiResponse(ok=True, data=summary)

@router.get("/tickets", response_model=ApiResponse[List[dict]])
def list_tickets(customer_id: Optional[int] = None, status: Optional[str] = None, user: dict = Depends(get_current_user)):
    return ApiResponse(ok=True, data=support_repo.list_tickets(customer_id, status))

@router.post("/tickets", response_model=ApiResponse[int])
def open_ticket(ticket: SupportTicketCreate, user: dict = Depends(get_current_user)):
    t_id = support_repo.create_ticket(ticket.model_dump())
    return ApiResponse(ok=True, data=t_id)

@router.get("/tickets/{ticket_id}", response_model=ApiResponse[dict])
def view_ticket(ticket_id: int, user: dict = Depends(get_current_user)):
    ticket = support_repo.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ApiResponse(ok=True, data=ticket)

@router.post("/tickets/messages", response_model=ApiResponse[int])
def add_message(msg: TicketMessageCreate, user: dict = Depends(get_current_user)):
    m_id = support_repo.add_ticket_message(msg.model_dump())
    return ApiResponse(ok=True, data=m_id)

@router.patch("/tickets/{ticket_id}/status", response_model=ApiResponse[bool])
def update_status(ticket_id: int, status: str, user: dict = Depends(require_role(["owner", "manager", "support"]))):
    support_repo.update_ticket_status(ticket_id, status)
    return ApiResponse(ok=True, data=True)
