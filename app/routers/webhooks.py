from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import List
from app.models.webhooks import WebhookEndpointCreate, WebhookEndpointOut, WebhookTestRequest
from app.models.common import ApiResponse
from app.repositories import webhook_repo
from app.middleware.auth_middleware import get_current_user, require_role

router = APIRouter(prefix="/webhooks", tags=["[Phase 30] Webhooks & Integration"])

@router.get("/endpoints", response_model=ApiResponse[List[dict]])
def list_endpoints(user: dict = Depends(require_role(["owner", "manager"]))):
    return ApiResponse(ok=True, data=webhook_repo.list_endpoints())

@router.post("/endpoints", response_model=ApiResponse[int])
def add_endpoint(ep: WebhookEndpointCreate, user: dict = Depends(require_role(["owner", "manager"]))):
    e_id = webhook_repo.create_endpoint(ep.model_dump())
    return ApiResponse(ok=True, data=e_id)

@router.post("/test", response_model=ApiResponse[dict])
def test_webhook(payload: WebhookTestRequest, background_tasks: BackgroundTasks, user: dict = Depends(require_role(["owner", "manager"]))):
    """Sends a mock 'ping' event to a specific URL."""
    background_tasks.add_task(webhook_repo.dispatch_event, payload.event, {"message": "Test Event from NimaPOS"})
    return ApiResponse(ok=True, data={"message": f"Test event '{payload.event}' queued for {payload.url}"})

@router.get("/logs", response_model=ApiResponse[List[dict]])
def view_logs(user: dict = Depends(require_role(["owner", "manager"]))):
    # This would normally have pagination/filters
    from app.database.connection import get_connection
    from app.utils.helpers import rows_to_list
    conn = get_connection()
    logs = conn.execute("SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 50").fetchall()
    return ApiResponse(ok=True, data=rows_to_list(logs))
