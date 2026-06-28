from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.models.maintenance import (
    MaintenanceOrderCreate, 
    MaintenanceOrderUpdate,
    DeviceModelCatalog
)
from app.repositories import maintenance_repo
from app.middleware.auth_middleware import require_role
from app.utils import whatsapp_utils
from typing import List, Optional
import os
import uuid
import json

router = APIRouter(prefix="/maintenance", tags=["System & Settings"])

UPLOAD_DIR = "static/maintenance_images"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", dependencies=[Depends(require_role(["owner", "admin"]))], summary="Create a new maintenance or repair order")
def create_order(data: MaintenanceOrderCreate):
    return {"id": maintenance_repo.create_maintenance_order(data)}

@router.put("/{id}", dependencies=[Depends(require_role(["owner", "admin"]))], summary="Update maintenance order status and details")
def update_order(id: int, data: MaintenanceOrderUpdate, current_user: dict = Depends(require_role(["owner", "admin"]))):
    username = current_user.get("username", "system")
    if not maintenance_repo.update_maintenance_order(id, data, changed_by=username):
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Maintenance order updated"}

@router.get("/", dependencies=[Depends(require_role(["owner", "admin"]))], summary="List maintenance orders")
def list_orders(status: str = None):
    return maintenance_repo.list_maintenance_orders(status)

@router.get("/{id}", dependencies=[Depends(require_role(["owner", "admin"]))])
def get_order(id: int):
    order = maintenance_repo.get_maintenance_order(id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.get("/{id}/history", dependencies=[Depends(require_role(["owner", "admin", "staff"]))])
def get_order_history(id: int):
    return maintenance_repo.get_status_history(id)

@router.post("/{id}/images", dependencies=[Depends(require_role(["owner", "admin", "staff"]))])
async def upload_image(id: int, kind: str = Form(...), file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1]
    filename = f"{id}_{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    with open(filepath, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
        
    image_id = maintenance_repo.add_maintenance_image(id, kind, file.filename, filepath)
    return {"id": image_id, "path": filepath}

@router.get("/{id}/images", dependencies=[Depends(require_role(["owner", "admin", "staff"]))])
def list_images(id: int):
    return maintenance_repo.list_maintenance_images(id)

@router.get("/catalogs/device-models", dependencies=[Depends(require_role(["owner", "admin", "staff"]))])
def list_device_models(device_type: str = None):
    return maintenance_repo.list_device_models(device_type)

@router.post("/catalogs/device-models", dependencies=[Depends(require_role(["owner", "admin"]))])
def create_device_model(data: DeviceModelCatalog):
    return {"id": maintenance_repo.create_device_model(data)}

@router.post("/{id}/notify", dependencies=[Depends(require_role(["owner", "admin", "staff"]))])
def send_notification(id: int, template_key: str):
    order = maintenance_repo.get_maintenance_order(id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    phone = whatsapp_utils.normalize_phone_number(order["customer_phone"])
    if not phone:
        raise HTTPException(status_code=400, detail="Customer phone is missing or invalid")
        
    message = whatsapp_utils.build_whatsapp_message(template_key, order)
    link = whatsapp_utils.generate_whatsapp_link(phone, message)
    
    # In a real enterprise API, we would call the WhatsApp Business API here.
    # For this implementation, we return the generated link for the frontend to open.
    return {"message": "Notification generated", "whatsapp_link": link}

@router.post("/{id}/snapshot", dependencies=[Depends(require_role(["owner", "admin"]))])
def create_financial_snapshot(id: int, reason: str = None, current_user: dict = Depends(require_role(["owner", "admin"]))):
    order = maintenance_repo.get_maintenance_order(id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    payload = json.dumps(order)
    username = current_user.get("username", "system")
    version = maintenance_repo.create_invoice_version(id, payload, username, reason)
    return {"version": version}

@router.get("/{id}/versions", dependencies=[Depends(require_role(["owner", "admin"]))])
def list_financial_versions(id: int):
    return maintenance_repo.list_invoice_versions(id)
