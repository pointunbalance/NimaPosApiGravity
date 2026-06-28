"""JWT authentication middleware — FastAPI dependency."""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.utils.security import decode_token
import jwt

security_scheme = HTTPBearer()

ROLE_ALIASES = {
    "admin": {"admin", "manager", "owner"},
}


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)) -> dict:
    """Decode JWT and return payload. Raises 401 if invalid/expired."""
    try:
        payload = decode_token(credentials.credentials)
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def require_role(allowed_roles: list[str]):
    """Factory for role-based access control dependency."""
    def role_checker(user: dict = Depends(get_current_user)):
        user_role = user.get("role")
        effective_roles = ROLE_ALIASES.get(user_role, {user_role})
        if not effective_roles.intersection(allowed_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user_role}' not authorized. Required: {allowed_roles}",
            )
        return user
    return role_checker


def require_permission(module: str, min_level: int):
    """Factory for granular module-based permission control."""
    from app.repositories import permission_repo
    def permission_checker(user: dict = Depends(get_current_user)):
        if not permission_repo.has_permission(user.get("user_id"), module, min_level):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions for module '{module}'. Level {min_level} required.",
            )
        return user
    return permission_checker


# Convenience shortcuts
require_owner = require_role(["owner"])
require_manager = require_role(["manager", "owner"])
require_any = require_role(["cashier", "manager", "owner", "admin"])
