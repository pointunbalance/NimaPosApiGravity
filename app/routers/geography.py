from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.models.common import ApiResponse
from app.models.geography import Governorate, City, SalesZone
from app.repositories import geography_repo
from app.middleware.auth_middleware import get_current_user, require_role

router = APIRouter(prefix="/geography", tags=["[Phase 31] Localization & Geography"])

@router.get("/governorates", response_model=ApiResponse[List[Governorate]], summary="List all governorates")
def list_governorates(user: dict = Depends(get_current_user)):
    return ApiResponse(ok=True, data=geography_repo.get_governorates())

@router.post("/governorates", response_model=ApiResponse[int], summary="Create a new governorate")
def create_governorate(gov: Governorate, user: dict = Depends(require_role(["manager", "owner"]))):
    gid = geography_repo.create_governorate(gov.model_dump())
    return ApiResponse(ok=True, data=gid)

@router.get("/cities", response_model=ApiResponse[List[City]], summary="List cities within a governorate")
def list_cities(governorate_id: int = None, user: dict = Depends(get_current_user)):
    return ApiResponse(ok=True, data=geography_repo.get_cities(governorate_id))

@router.post("/cities", response_model=ApiResponse[int], summary="Create a new city")
def create_city(city: City, user: dict = Depends(require_role(["manager", "owner"]))):
    cid = geography_repo.create_city(city.model_dump())
    return ApiResponse(ok=True, data=cid)

@router.get("/zones", response_model=ApiResponse[List[SalesZone]], summary="List sales zones within a city")
def list_zones(city_id: int = None, user: dict = Depends(get_current_user)):
    return ApiResponse(ok=True, data=geography_repo.get_zones(city_id))

@router.post("/zones", response_model=ApiResponse[int], summary="Create a new sales zone")
def create_zone(zone: SalesZone, user: dict = Depends(require_role(["manager", "owner"]))):
    zid = geography_repo.create_zone(zone.model_dump())
    return ApiResponse(ok=True, data=zid)
