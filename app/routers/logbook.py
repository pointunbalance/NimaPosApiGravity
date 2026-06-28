"""Logbook / Activity Logs router."""
from fastapi import APIRouter, Depends, HTTPException
from app.models.logbook import LogCreate
from app.repositories import log_repo
from app.middleware.auth_middleware import get_current_user
from app.utils.helpers import paginate, pagination_meta

router = APIRouter(tags=["System & Settings"])


@router.post("/logs", summary="Create a new activity or financial log")
def create_log(body: LogCreate, user=Depends(get_current_user)):
    log_id = log_repo.create_log(
        log_type=body.type, action=body.action, details=body.details or "",
        user_name=body.user_name, amount=body.amount,
        reference_id=body.reference_id, status=body.status,
    )
    return {"ok": True, "data": {"id": log_id}}


@router.get("/logs", summary="List and filter activity logs")
def list_logs(
    type: str = None,
    status: str = None,
    user_name: str = None,
    date_from: str = None,
    date_to: str = None,
    search: str = None,
    page: int = 1,
    limit: int = 100,
    user=Depends(get_current_user),
):
    offset, limit, page = paginate(page, limit)
    rows, total = log_repo.list_logs(
        log_type=type, status=status, user_name=user_name,
        date_from=date_from, date_to=date_to, search=search,
        offset=offset, limit=limit,
    )
    return {"ok": True, "data": rows, "meta": pagination_meta(total, page, limit)}


@router.get("/logs/stats", summary="Get log statistics (e.g., total income vs expense)")
def log_stats(user=Depends(get_current_user)):
    return {"ok": True, "data": log_repo.get_log_stats()}


@router.get("/logs/{log_id}", summary="Get specific log details")
def get_log(log_id: int, user=Depends(get_current_user)):
    log = log_repo.get_log_by_id(log_id)
    if not log:
        raise HTTPException(404, "Log not found")
    return {"ok": True, "data": log}
