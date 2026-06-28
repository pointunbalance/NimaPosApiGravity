"""Master Data router for Brands, Origins, Locations, and Manufacturers."""
from fastapi import APIRouter, Depends, HTTPException
from app.models.common import ApiResponse
from app.repositories import brand_repo, origin_repo, location_repo, manufacturer_repo
from app.middleware.auth_middleware import get_current_user, require_role

router = APIRouter(prefix="/master-data", tags=["Inventory"])

# --- Brands ---
@router.get("/brands", response_model=ApiResponse, summary="List all product brands")
def list_brands(user: dict = Depends(get_current_user)):
    return ApiResponse(ok=True, data=brand_repo.get_all())

@router.post("/brands", response_model=ApiResponse, summary="Create a new brand")
def create_brand(name: str, description: str = "", user: dict = Depends(require_role(["manager", "owner"]))):
    brand_id = brand_repo.create(name, description)
    return ApiResponse(ok=True, data=brand_repo.get_by_id(brand_id))

@router.delete("/brands/{brand_id}", response_model=ApiResponse, summary="Delete a brand")
def delete_brand(brand_id: int, user: dict = Depends(require_role(["owner"]))):
    brand_repo.delete(brand_id)
    return ApiResponse(ok=True, data={"message": "Brand deleted"})

# --- Origins ---
@router.get("/origins", response_model=ApiResponse, summary="List all product origins")
def list_origins(user: dict = Depends(get_current_user)):
    return ApiResponse(ok=True, data=origin_repo.get_all())

@router.post("/origins", response_model=ApiResponse, summary="Create a new origin")
def create_origin(name: str, user: dict = Depends(require_role(["manager", "owner"]))):
    origin_id = origin_repo.create(name)
    return ApiResponse(ok=True, data={"id": origin_id, "name": name})

# --- Locations ---
@router.get("/locations", response_model=ApiResponse, summary="List storage locations")
def list_locations(warehouse_id: int = None, user: dict = Depends(get_current_user)):
    return ApiResponse(ok=True, data=location_repo.get_all(warehouse_id))

@router.post("/locations", response_model=ApiResponse, summary="Create a storage location")
def create_location(name: str, warehouse_id: int = None, user: dict = Depends(require_role(["manager", "owner"]))):
    loc_id = location_repo.create(name, warehouse_id)
    return ApiResponse(ok=True, data={"id": loc_id, "name": name, "warehouse_id": warehouse_id})

# --- Manufacturers ---
@router.get("/manufacturers", response_model=ApiResponse, summary="List manufacturers")
def list_manufacturers(user: dict = Depends(get_current_user)):
    return ApiResponse(ok=True, data=manufacturer_repo.get_all())
