"""Categories router."""
from fastapi import APIRouter, Depends, HTTPException
from app.models.category import CategoryCreate, CategoryUpdate
from app.models.common import ApiResponse
from app.repositories import category_repo
from app.middleware.auth_middleware import get_current_user, require_role

router = APIRouter(prefix="/categories", tags=["Inventory"])

@router.get("", response_model=ApiResponse, summary="List categories")
def list_categories(user: dict = Depends(get_current_user)):
    return ApiResponse(ok=True, data=category_repo.get_all())

@router.get("/{cat_id}", response_model=ApiResponse, summary="Get category")
def get_category(cat_id: int, user: dict = Depends(get_current_user)):
    c = category_repo.get_by_id(cat_id)
    if not c: raise HTTPException(404, "Category not found")
    return ApiResponse(ok=True, data=c)

@router.post("", response_model=ApiResponse, summary="Create category")
def create_category(payload: CategoryCreate, user: dict = Depends(require_role(["manager", "owner"]))):
    cat_id = category_repo.create(payload.model_dump())
    return ApiResponse(ok=True, data=category_repo.get_by_id(cat_id))

@router.put("/{cat_id}", response_model=ApiResponse, summary="Update category")
def update_category(cat_id: int, payload: CategoryUpdate, user: dict = Depends(require_role(["manager", "owner"]))):
    if not category_repo.get_by_id(cat_id): raise HTTPException(404, "Category not found")
    category_repo.update(cat_id, payload.model_dump(exclude_unset=True))
    return ApiResponse(ok=True, data=category_repo.get_by_id(cat_id))

@router.delete("/{cat_id}", response_model=ApiResponse, summary="Delete category")
def delete_category(cat_id: int, user: dict = Depends(require_role(["owner"]))):
    if not category_repo.get_by_id(cat_id): raise HTTPException(404, "Category not found")
    category_repo.delete(cat_id)
    return ApiResponse(ok=True, data={"message": "Category deleted"})
