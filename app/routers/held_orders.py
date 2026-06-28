"""Held Orders router — save, restore, and manage held carts."""
from fastapi import APIRouter, Depends, HTTPException
from app.models.common import ApiResponse
from app.repositories import held_order_repo
from app.middleware.auth_middleware import get_current_user, require_role
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/held-orders", tags=["Invoices / Sales"])


class HeldOrderCreate(BaseModel):
    items: list[dict]
    customer_id: Optional[int] = None
    note: Optional[str] = ""


@router.get("", response_model=ApiResponse, summary="List all held orders")
def list_held(customer_id: int = None, user: dict = Depends(get_current_user)):
    data = held_order_repo.list_held(customer_id)
    return ApiResponse(ok=True, data={"items": data, "count": len(data)})


@router.get("/count", response_model=ApiResponse, summary="Get held orders count")
def held_count(user: dict = Depends(get_current_user)):
    return ApiResponse(ok=True, data={"count": held_order_repo.count()})


@router.get("/{held_id}", response_model=ApiResponse, summary="Get a held order")
def get_held(held_id: int, user: dict = Depends(get_current_user)):
    order = held_order_repo.get_by_id(held_id)
    if not order:
        raise HTTPException(status_code=404, detail="Held order not found")
    return ApiResponse(ok=True, data=order)


@router.post("", response_model=ApiResponse, summary="Hold a cart for later")
def create_held(payload: HeldOrderCreate, user: dict = Depends(get_current_user)):
    held_id = held_order_repo.create(payload.model_dump())
    return ApiResponse(ok=True, data=held_order_repo.get_by_id(held_id))


@router.delete("/{held_id}", response_model=ApiResponse, summary="Delete a held order (after restoring)")
def delete_held(held_id: int, user: dict = Depends(get_current_user)):
    if not held_order_repo.get_by_id(held_id):
        raise HTTPException(status_code=404, detail="Held order not found")
    held_order_repo.delete(held_id)
    return ApiResponse(ok=True, data={"message": "Held order removed"})
