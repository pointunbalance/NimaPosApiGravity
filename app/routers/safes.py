"""Safes router."""
from fastapi import APIRouter, Depends, HTTPException, Query
from app.models.common import ApiResponse
from app.repositories import safe_repo
from app.middleware.auth_middleware import get_current_user, require_role
from pydantic import BaseModel, Field
from typing import Optional

router = APIRouter(prefix="/safes", tags=["Internal Accounts / Safes"])

class SafeCreate(BaseModel):
    name: str
    balance: float = 0
    is_active: int = 1
    branch_id: int = 1

class SafeUpdate(BaseModel):
    name: Optional[str] = None
    balance: Optional[float] = None
    is_active: Optional[int] = None
    branch_id: Optional[int] = None

class TransferCreate(BaseModel):
    from_safe_id: int
    to_safe_id: int
    amount: float = Field(gt=0)
    transferor_id: Optional[int] = None
    receiver_id: Optional[int] = None
    notes: Optional[str] = ""

@router.get("", response_model=ApiResponse, summary="List all safes")
def list_safes(branch_id: Optional[int] = None, user: dict = Depends(get_current_user)):
    data = safe_repo.list_safes(branch_id)
    return ApiResponse(ok=True, data=data)

@router.post("", response_model=ApiResponse, summary="Create a new safe")
def create_safe(payload: SafeCreate, user: dict = Depends(require_role(["owner", "admin"]))):
    safe_id = safe_repo.create_safe(payload.model_dump())
    return ApiResponse(ok=True, data=safe_repo.get_safe(safe_id))

@router.post("/transfer", response_model=ApiResponse, summary="Transfer funds between safes")
def transfer_funds(payload: TransferCreate, user: dict = Depends(require_role(["manager", "owner"]))):
    try:
        transfer_id = safe_repo.transfer_funds(payload.model_dump())
        return ApiResponse(ok=True, data={"transfer_id": transfer_id})
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/transfers", response_model=ApiResponse, summary="List fund transfers")
def list_transfers(safe_id: Optional[int] = None, limit: int = Query(50), user: dict = Depends(get_current_user)):
    data = safe_repo.get_transfers(safe_id, limit)
    return ApiResponse(ok=True, data=data)
@router.get("/{safe_id}/summary", response_model=ApiResponse, summary="Get daily safe summary", tags=["Internal Accounts / Safes"])
def get_safe_summary(safe_id: int, date: str = Query(..., description="Date in YYYY-MM-DD format"), user: dict = Depends(require_role(["manager", "owner"]))):
    summary = safe_repo.get_safe_daily_summary(safe_id, date)
    return ApiResponse(ok=True, data=summary)


@router.get("/{safe_id}", response_model=ApiResponse, summary="Get safe details")
def get_safe(safe_id: int, user: dict = Depends(get_current_user)):
    s = safe_repo.get_safe(safe_id)
    if not s:
        raise HTTPException(status_code=404, detail="Safe not found")
    return ApiResponse(ok=True, data=s)


@router.put("/{safe_id}", response_model=ApiResponse, summary="Update safe")
def update_safe(safe_id: int, payload: SafeUpdate, user: dict = Depends(require_role(["owner"]))):
    s = safe_repo.get_safe(safe_id)
    if not s:
        raise HTTPException(status_code=404, detail="Safe not found")
    safe_repo.update_safe(safe_id, payload.model_dump())
    return ApiResponse(ok=True, data=safe_repo.get_safe(safe_id))


@router.delete("/{safe_id}", response_model=ApiResponse, summary="Delete safe (soft)")
def delete_safe(safe_id: int, user: dict = Depends(require_role(["owner"]))):
    s = safe_repo.get_safe(safe_id)
    if not s:
        raise HTTPException(status_code=404, detail="Safe not found")
    safe_repo.deactivate_safe(safe_id)
    return ApiResponse(ok=True, data={"message": "Safe deactivated"})
