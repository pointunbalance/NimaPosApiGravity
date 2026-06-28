"""Services router — CRUD for non-inventory items."""
from fastapi import APIRouter, Depends, HTTPException, Query
from app.models.common import ApiResponse
from app.repositories import service_repo
from app.middleware.auth_middleware import get_current_user, require_role

router = APIRouter(prefix="/services", tags=["Studio Pro (New 🚀)"])

@router.get("", response_model=ApiResponse, summary="List active services")
def list_services(user: dict = Depends(get_current_user)):
    return ApiResponse(ok=True, data=service_repo.get_all())

@router.post("", response_model=ApiResponse, summary="Create service")
def create_service(payload: dict, user: dict = Depends(require_role(["manager", "owner"]))):
    service_id = service_repo.create(payload)
    return ApiResponse(ok=True, data=service_repo.get_by_id(service_id))

@router.put("/{service_id}", response_model=ApiResponse, summary="Update service")
def update_service(service_id: int, payload: dict, user: dict = Depends(require_role(["manager", "owner"]))):
    service_repo.update(service_id, payload)
    return ApiResponse(ok=True, data=service_repo.get_by_id(service_id))

@router.delete("/{service_id}", response_model=ApiResponse, summary="Deactivate service")
def delete_service(service_id: int, user: dict = Depends(require_role(["owner"]))):
    service_repo.delete(service_id)
    return ApiResponse(ok=True, data={"message": "Service deactivated"})
