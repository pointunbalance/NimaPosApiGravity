"""Auth router — Login, Logout, Me."""
import logging
from fastapi import APIRouter, HTTPException, Depends
from app.models.auth import LoginRequest, LoginResponse, UserOut, TokenPayload
from app.models.common import ApiResponse
from app.repositories import user_repo, session_repo
from app.utils.security import verify_pin, create_token
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/auth", tags=["System & Settings"])
logger = logging.getLogger(__name__)


@router.post("/login", response_model=ApiResponse[dict], summary="Login with PIN")
def login(payload: LoginRequest):
    """Authenticate using PIN and receive a JWT token."""
    users = user_repo.find_by_pin_hash()
    matched_user = None
    for u in users:
        if u.get("pin_hash") and u.get("pin_salt"):
            if verify_pin(payload.pin, u["pin_hash"], u["pin_salt"]):
                matched_user = u
                break
    if not matched_user:
        raise HTTPException(status_code=401, detail="Invalid PIN")

    try:
        token, expires_in = create_token(
            matched_user["id"], matched_user["username"],
            matched_user["role"], payload.branch_id,
        )
    except Exception as e:
        logger.error("Token creation failed for user %s: %s", matched_user["username"], str(e))
        raise HTTPException(status_code=500, detail="Authentication failed")

    # Create session
    session_repo.create_session(matched_user["id"], matched_user["role"], payload.branch_id)

    return ApiResponse(ok=True, data=LoginResponse(
        success=True,
        token=token,
        expires_in=expires_in,
        user=UserOut(
            id=matched_user["id"],
            username=matched_user["username"],
            role=matched_user["role"],
        ),
    ).model_dump())


@router.post("/logout", response_model=ApiResponse[dict], summary="Logout current user")
def logout(user: dict = Depends(get_current_user)):
    """Close the active session for current user."""
    session = session_repo.get_active_session(user["user_id"])
    if session:
        session_repo.close_session(session["id"])
    return ApiResponse(ok=True, data={"message": "Logged out"})


@router.get("/me", response_model=ApiResponse[dict], summary="Get current user info")
def me(user: dict = Depends(get_current_user)):
    """Return the current authenticated user's info from token."""
    return ApiResponse(ok=True, data={
        "user_id": user["user_id"],
        "username": user["username"],
        "role": user["role"],
        "branch_id": user["branch_id"],
    })
