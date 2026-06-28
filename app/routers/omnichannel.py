from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.models.omnichannel import PlatformMappingCreate, ProductSyncStatus
from app.models.common import ApiResponse
from app.repositories import omnichannel_repo
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/omnichannel", tags=["Omnichannel Commerce"])

@router.post("/mappings", response_model=ApiResponse)
def create_mapping(mapping: PlatformMappingCreate, current_user=Depends(get_current_user)):
    mapping_id = omnichannel_repo.create_mapping(mapping)
    return ApiResponse(ok=True, data={"id": mapping_id, "message": "Platform mapping created"})

@router.get("/status", response_model=ApiResponse)
def get_sync_status(current_user=Depends(get_current_user)):
    status = omnichannel_repo.get_mapping_status()
    return ApiResponse(ok=True, data=status)

@router.post("/trigger-sync/{product_id}", response_model=ApiResponse)
def trigger_product_sync(product_id: int, current_user=Depends(get_current_user)):
    return ApiResponse(ok=True, data={"message": "Synchronization triggered for product"})

@router.post("/trigger-full-sync", response_model=ApiResponse)
def trigger_full_sync(current_user=Depends(get_current_user)):
    return ApiResponse(ok=True, data={"message": "Full omnichannel synchronization initiated"})
