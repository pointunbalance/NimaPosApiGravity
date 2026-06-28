from fastapi import APIRouter, Depends, HTTPException
from app.models.inventory_count import InventoryCountCreate, InventoryCountUpdate
from app.repositories import inventory_count_repo
from app.middleware.auth_middleware import require_role
from typing import List, Optional

router = APIRouter(prefix="/inventory-count", tags=["Inventory"])

@router.post("/", dependencies=[Depends(require_role(["owner", "admin"]))], summary="Start a new physical inventory count")
def create_count(data: InventoryCountCreate):
    return {"id": inventory_count_repo.create_inventory_count(data)}

@router.get("/", dependencies=[Depends(require_role(["owner", "admin"]))], summary="List inventory count sessions")
def list_counts(warehouse_id: Optional[int] = None):
    return inventory_count_repo.list_inventory_counts(warehouse_id)

@router.get("/{id}", dependencies=[Depends(require_role(["owner", "admin"]))], summary="Get detailed inventory count session")
def get_count(id: int):
    res = inventory_count_repo.get_inventory_count(id)
    if not res: raise HTTPException(status_code=404, detail="Count not found")
    return res

@router.post("/{id}/finalize", dependencies=[Depends(require_role(["owner"]))], summary="Finalize count and apply stock discrepancies")
def finalize(id: int, approved_by: str):
    if not inventory_count_repo.finalize_inventory_count(id, approved_by):
        raise HTTPException(status_code=400, detail="Could not finalize count")
    return {"message": "Inventory count finalized and stock adjusted"}
