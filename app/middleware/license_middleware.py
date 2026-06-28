from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.repositories import activation_repo
from app.config import API_PREFIX
import logging

logger = logging.getLogger(__name__)

class LicenseMiddleware(BaseHTTPMiddleware):
    """
    Enforces system activation. If the system is not activated, 
    blocks all requests except for activation and health endpoints.
    """
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        
        # 1. Bypass check for activation, health, and static docs
        allowed_paths = [
            f"{API_PREFIX}/system/health",
            f"{API_PREFIX}/system/version",
            f"{API_PREFIX}/system/activation-status",
            f"{API_PREFIX}/system/activate",
            "/docs",
            "/scalar",
            "/openapi.json",
            "/redoc"
        ]
        
        if any(path.startswith(p) for p in allowed_paths):
            return await call_next(request)
            
        # 2. Check Activation Status
        try:
            status = activation_repo.get_activation_status()
            if not status.get("is_active"):
                return JSONResponse(
                    status_code=403,
                    content={
                        "ok": False,
                        "error": {
                            "code": "LICENSE_REQUIRED",
                            "message": "System not activated. Please provide a valid license key.",
                            "hardware_id": status.get("hardware_id")
                        }
                    }
                )
        except Exception as e:
            logger.error(f"License check failed: {e}")
            return JSONResponse(
                status_code=500,
                content={"ok": False, "message": "Internal security check error."}
            )
            
        return await call_next(request)
