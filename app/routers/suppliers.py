"""Suppliers router."""
from fastapi import APIRouter, Depends, HTTPException, Query
from app.models.supplier import SupplierCreate, SupplierUpdate
from app.models.common import ApiResponse
from app.repositories import supplier_repo
from app.middleware.auth_middleware import get_current_user, require_role
from app.utils.helpers import paginate, pagination_meta

router = APIRouter(prefix="/suppliers", tags=["Purchases & Suppliers"])


@router.get("", response_model=ApiResponse, summary="List suppliers")
def list_suppliers(
    search: str = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    user: dict = Depends(get_current_user),
):
    offset, limit, page = paginate(page, limit)
    items, total = supplier_repo.get_all_active(search=search, offset=offset, limit=limit)
    return ApiResponse(ok=True, data={"items": items, "pagination": pagination_meta(total, page, limit)})


@router.get("/{supplier_id}", response_model=ApiResponse, summary="Get supplier")
def get_supplier(supplier_id: int, user: dict = Depends(get_current_user)):
    s = supplier_repo.get_by_id(supplier_id)
    if not s:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return ApiResponse(ok=True, data=s)


@router.post("", response_model=ApiResponse, summary="Create supplier")
def create_supplier(payload: SupplierCreate, user: dict = Depends(require_role(["manager", "owner"]))):
    supplier_id = supplier_repo.create(payload.model_dump())
    return ApiResponse(ok=True, data=supplier_repo.get_by_id(supplier_id))


@router.put("/{supplier_id}", response_model=ApiResponse, summary="Update supplier")
def update_supplier(supplier_id: int, payload: SupplierUpdate, user: dict = Depends(require_role(["manager", "owner"]))):
    if not supplier_repo.get_by_id(supplier_id):
        raise HTTPException(status_code=404, detail="Supplier not found")
    supplier_repo.update(supplier_id, payload.model_dump(exclude_unset=True))
    return ApiResponse(ok=True, data=supplier_repo.get_by_id(supplier_id))


@router.get("/{supplier_id}/purchases", response_model=ApiResponse, summary="Supplier purchases")
def supplier_purchases(supplier_id: int, page: int = Query(1, ge=1), limit: int = Query(50, ge=1, le=200), user: dict = Depends(require_role(["manager", "owner"]))):
    from app.repositories import purchase_repo
    offset, limit, page = paginate(page, limit)
    items, total = purchase_repo.get_all(supplier_id=supplier_id, offset=offset, limit=limit)
    return ApiResponse(ok=True, data={"items": items, "pagination": pagination_meta(total, page, limit)})


@router.get("/{supplier_id}/returns", response_model=ApiResponse, summary="Supplier returns")
def supplier_returns(supplier_id: int, page: int = Query(1, ge=1), limit: int = Query(50, ge=1, le=200), user: dict = Depends(require_role(["manager", "owner"]))):
    from app.repositories import supplier_return_repo
    offset, limit, page = paginate(page, limit)
    items, total = supplier_return_repo.get_list(supplier_id=supplier_id, offset=offset, limit=limit)
    return ApiResponse(ok=True, data={"items": items, "pagination": pagination_meta(total, page, limit)})


@router.get("/{supplier_id}/balance-summary", response_model=ApiResponse, summary="Supplier financial summary")
def supplier_balance(supplier_id: int, user: dict = Depends(require_role(["manager", "owner"]))):
    s = supplier_repo.get_by_id(supplier_id)
    if not s:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return ApiResponse(ok=True, data={
        "supplier_id": supplier_id,
        "name": s.get("name"),
        "balance": s.get("balance", 0),
        "total_purchases": s.get("total_purchases", 0),
    })


@router.post("/{supplier_id}/opening-balance", response_model=ApiResponse, summary="Set supplier opening balance")
def set_supplier_opening_balance(supplier_id: int, balance: float = Query(...), user: dict = Depends(require_role(["owner"]))):
    if not supplier_repo.get_by_id(supplier_id):
        raise HTTPException(status_code=404, detail="Supplier not found")
    supplier_repo.set_opening_balance(supplier_id, balance)
    return ApiResponse(ok=True, data=supplier_repo.get_by_id(supplier_id))


@router.delete("/{supplier_id}", response_model=ApiResponse, summary="Delete supplier")
def delete_supplier(supplier_id: int, user: dict = Depends(require_role(["owner"]))):
    if not supplier_repo.get_by_id(supplier_id):
        raise HTTPException(status_code=404, detail="Supplier not found")
    supplier_repo.soft_delete(supplier_id)
    return ApiResponse(ok=True, data={"message": "Supplier deleted"})
