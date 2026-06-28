"""Purchases router."""
from fastapi import APIRouter, Depends, HTTPException, Query
from app.models.purchase import PurchaseCreate, PurchaseUpdate
from app.models.common import ApiResponse
from app.repositories import purchase_repo
from app.middleware.auth_middleware import get_current_user, require_role
from app.utils.helpers import paginate, pagination_meta

router = APIRouter(prefix="/purchases", tags=["Purchases & Suppliers"])

@router.get("/summary/totals", response_model=ApiResponse, summary="Purchase summary")
def purchase_summary(date_from: str = None, date_to: str = None, user: dict = Depends(require_role(["manager", "owner"]))):
    data = purchase_repo.get_summary(date_from, date_to)
    return ApiResponse(ok=True, data=data)


@router.get("/{p_id}", response_model=ApiResponse, summary="Get purchase")
def get_purchase(p_id: int, user: dict = Depends(require_role(["manager", "owner"]))):
    p = purchase_repo.get_by_id(p_id)
    if not p: raise HTTPException(404, "Purchase not found")
    return ApiResponse(ok=True, data=p)

@router.post("", response_model=ApiResponse, summary="Create purchase")
def create_purchase(payload: PurchaseCreate, user: dict = Depends(require_role(["manager", "owner"]))):
    from app.repositories import supplier_repo
    if not supplier_repo.get_by_id(payload.supplier_id):
        raise HTTPException(status_code=404, detail="Supplier not found")
    p_id = purchase_repo.create(payload.model_dump())
    return ApiResponse(ok=True, data=purchase_repo.get_by_id(p_id))

@router.put("/{p_id}", response_model=ApiResponse, summary="Update purchase")
def update_purchase(p_id: int, payload: PurchaseUpdate, user: dict = Depends(require_role(["manager", "owner"]))):
    if not purchase_repo.get_by_id(p_id): raise HTTPException(404, "Purchase not found")
    purchase_repo.update(p_id, payload.model_dump(exclude_unset=True))
    return ApiResponse(ok=True, data=purchase_repo.get_by_id(p_id))

@router.delete("/{p_id}", response_model=ApiResponse, summary="Delete purchase")
def delete_purchase(p_id: int, user: dict = Depends(require_role(["owner"]))):
    if not purchase_repo.get_by_id(p_id): raise HTTPException(404, "Purchase not found")
    purchase_repo.delete(p_id)
    return ApiResponse(ok=True, data={"message": "Purchase deleted"})


@router.get("/{p_id}/items", response_model=ApiResponse, summary="Get purchase items")
def purchase_items(p_id: int, user: dict = Depends(require_role(["manager", "owner"]))):
    if not purchase_repo.get_by_id(p_id): raise HTTPException(404, "Purchase not found")
    items = purchase_repo.get_items(p_id)
    return ApiResponse(ok=True, data=items)


@router.post("/{p_id}/void", response_model=ApiResponse, summary="Void a purchase")
def void_purchase(p_id: int, user: dict = Depends(require_role(["owner"]))):
    p = purchase_repo.get_by_id(p_id)
    if not p: raise HTTPException(404, "Purchase not found")
    result = purchase_repo.void_purchase(p_id)
    if not result:
        raise HTTPException(400, "Purchase already voided")
    return ApiResponse(ok=True, data={"message": f"Purchase #{p_id} voided successfully"})
