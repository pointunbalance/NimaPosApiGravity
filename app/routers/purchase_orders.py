from fastapi import APIRouter, Depends, HTTPException
from app.models.purchase_order import PurchaseOrderCreate, PurchaseOrderUpdate
from app.models.common import ApiResponse
from app.repositories import purchase_order_repo
from app.middleware.auth_middleware import require_role
from typing import List, Optional

router = APIRouter(prefix="/purchase-orders", tags=["Purchases & Suppliers"])

@router.post("/", response_model=ApiResponse, dependencies=[Depends(require_role(["owner", "admin"]))], summary="Create a new comprehensive Purchase Order")
def create_po(data: PurchaseOrderCreate):
    return ApiResponse(ok=True, data={"id": purchase_order_repo.create_purchase_order(data)})

@router.get("/", response_model=ApiResponse, dependencies=[Depends(require_role(["owner", "admin"]))], summary="List Purchase Orders")
def list_pos(supplier_id: int = None):
    return ApiResponse(ok=True, data=purchase_order_repo.list_purchase_orders(supplier_id))

@router.get("/{id}", response_model=ApiResponse, dependencies=[Depends(require_role(["owner", "admin"]))], summary="Get comprehensive Purchase Order details")
def get_po(id: int):
    res = purchase_order_repo.get_po_details(id)
    if not res: raise HTTPException(status_code=404, detail="Purchase Order not found")
    return ApiResponse(ok=True, data=res)

@router.post("/{po_id}/convert", response_model=ApiResponse, summary="Convert PO to Purchase", tags=["Purchases & Suppliers"])
def convert_po(po_id: int, user: dict = Depends(require_role(["manager", "owner"]))):
    purchase_id = purchase_order_repo.convert_to_purchase(po_id)
    if not purchase_id:
        raise HTTPException(status_code=400, detail="PO not found or already completed")
    return ApiResponse(ok=True, data={"purchase_id": purchase_id})
