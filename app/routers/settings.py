"""Settings router."""
from fastapi import APIRouter, Depends, HTTPException

from app.config import API_VERSION, BUILD_DATE, JWT_EXPIRY_HOURS
from app.database.connection import get_connection
from app.middleware.auth_middleware import require_role, get_current_user
from app.models.common import ApiResponse
from app.models.settings import SettingUpdate
from app.repositories import settings_repo

router = APIRouter(prefix="/settings", tags=["System & Settings"])


@router.get("", response_model=ApiResponse, summary="Get all settings")
def get_all(user: dict = Depends(require_role(["manager", "owner"]))):
    items = settings_repo.get_all()
    return ApiResponse(ok=True, data=items)


@router.get("/runtime", response_model=ApiResponse, summary="Get runtime settings")
def get_runtime_settings(user: dict = Depends(get_current_user)):
    return ApiResponse(
        ok=True,
        data={
            "currency": settings_repo.get("currency", "SAR"),
            "printer_width": settings_repo.get("printer_width", "80mm"),
            "enable_qr": settings_repo.get("enable_qr", "0"),
            "jwt_expiry_hours": JWT_EXPIRY_HOURS,
            "api_version": API_VERSION,
            "build_date": BUILD_DATE,
        },
    )


@router.get("/health", response_model=ApiResponse, summary="Get settings subsystem health")
def get_settings_health(user: dict = Depends(get_current_user)):
    try:
        conn = get_connection()
        conn.execute("SELECT 1 FROM app_settings LIMIT 1").fetchone()
        return ApiResponse(
            ok=True,
            data={
                "status": "healthy",
                "repository": "connected",
                "settings_table": "available",
            },
        )
    except Exception as exc:
        return ApiResponse(
            ok=False,
            error={
                "message": "Settings subsystem unhealthy",
                "detail": str(exc),
            },
        )


@router.get("/{key}", response_model=ApiResponse, summary="Get setting by key")
def get_setting(key: str, user: dict = Depends(get_current_user)):
    value = settings_repo.get(key)
    if value is None:
        raise HTTPException(status_code=404, detail=f"Setting '{key}' not found")
    return ApiResponse(ok=True, data={"key": key, "value": value})


@router.put("/{key}", response_model=ApiResponse, summary="Update setting")
def update_setting(key: str, payload: SettingUpdate, user: dict = Depends(require_role(["owner"]))):
    settings_repo.upsert(key, payload.value)
    return ApiResponse(ok=True, data={"key": key, "value": payload.value})


@router.post("/bulk", response_model=ApiResponse, summary="Bulk update settings")
def bulk_update(payload: dict, user: dict = Depends(require_role(["owner"]))):
    for key, value in payload.items():
        settings_repo.upsert(key, value)
    return ApiResponse(ok=True, data={"message": f"Updated {len(payload)} settings"})
