from fastapi import APIRouter, Depends, HTTPException, Query
from app.models.supplier_return import SupplierReturnCreate, SupplierReturnOut
from app.models.common import ApiResponse
from app.repositories import supplier_return_repo, supplier_repo
from app.middleware.auth_middleware import get_current_user, require_role
from app.utils.helpers import paginate, pagination_meta

router = APIRouter(prefix="/supplier-returns", tags=["Purchases & Suppliers"])

@router.post("", response_model=ApiResponse, summary="Create a new supplier return record")
def create_supplier_return(
    payload: SupplierReturnCreate,
    user: dict = Depends(require_role(["manager", "owner"]))
):
    if not supplier_repo.get_by_id(payload.supplier_id):
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    return_id = supplier_return_repo.create_return(payload.model_dump(exclude={"items"}), [i.model_dump() for i in payload.items])
    return ApiResponse(ok=True, data={"return_id": return_id})

@router.get("", response_model=ApiResponse, summary="List supplier returns")
def list_supplier_returns(
    supplier_id: int = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    user: dict = Depends(get_current_user)
):
    offset, limit, page = paginate(page, limit)
    items, total = supplier_return_repo.get_list(supplier_id, offset, limit)
    return ApiResponse(ok=True, data={
        "items": items,
        "pagination": pagination_meta(total, page, limit)
    })

@router.get("/reasons", response_model=ApiResponse, summary="Get master data for return reasons")
def get_return_reasons(user: dict = Depends(get_current_user)):
    reasons = supplier_return_repo.get_reasons()
    return ApiResponse(ok=True, data=reasons)

@router.get("/{return_id}", response_model=ApiResponse, summary="Get supplier return details")
def get_supplier_return(return_id: int, user: dict = Depends(get_current_user)):
    res = supplier_return_repo.get_by_id(return_id)
    if not res:
        raise HTTPException(status_code=404, detail="Return record not found")
    return ApiResponse(ok=True, data=res)
