from fastapi import APIRouter, Depends, HTTPException
from app.models.branch_transfer import BranchTransferCreate, BranchTransferUpdate
from app.repositories import branch_transfer_repo
from app.middleware.auth_middleware import require_role
from typing import List, Optional

router = APIRouter(prefix="/branch-transfers", tags=["Inventory"])

@router.post("/", dependencies=[Depends(require_role(["owner", "admin"]))], summary="Request stock transfer between branches")
def request_transfer(data: BranchTransferCreate):
    return {"id": branch_transfer_repo.create_transfer(data)}

@router.get("/", dependencies=[Depends(require_role(["owner", "admin"]))], summary="List available branch transfer requests")
def list_transfers(warehouse_id: Optional[int] = None):
    return branch_transfer_repo.list_transfers(warehouse_id)

@router.get("/{id}", dependencies=[Depends(require_role(["owner", "admin"]))], summary="Get specific branch transfer details")
def get_details(id: int):
    res = branch_transfer_repo.get_transfer_details(id)
    if not res: raise HTTPException(status_code=404, detail="Transfer not found")
    return res

@router.put("/{id}/process", dependencies=[Depends(require_role(["owner", "admin"]))], summary="Process (approve/reject/ship) a branch transfer")
def process(id: int, updates: BranchTransferUpdate):
    if not branch_transfer_repo.process_transfer(id, updates):
        raise HTTPException(status_code=400, detail="Processing failed")
    return {"message": f"Transfer marked as {updates.status}"}
