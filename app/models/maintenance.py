from pydantic import BaseModel, ConfigDict
from typing import Optional, List

class MaintenanceOrderBase(BaseModel):
    order_number: Optional[str] = None
    customer_name: str
    customer_phone: Optional[str] = None
    device_type: str
    device_brand: Optional[str] = None
    device_model: Optional[str] = None
    serial_number: Optional[str] = None
    problem_description: str
    diagnosis: Optional[str] = None
    status: str = "received"
    priority: str = "normal"
    estimated_cost: float = 0
    final_cost: float = 0
    paid_amount: float = 0
    parts_used_json: str = "[]"
    technician: Optional[str] = None
    warranty_days: int = 0
    notes: Optional[str] = None
    branch_id: int = 1

class MaintenanceOrderCreate(MaintenanceOrderBase):
    pass

class MaintenanceOrderUpdate(BaseModel):
    diagnosis: Optional[str] = None
    status: Optional[str] = None
    final_cost: Optional[float] = None
    paid_amount: Optional[float] = None
    parts_used_json: Optional[str] = None
    technician: Optional[str] = None
    completed_at: Optional[str] = None
    delivered_at: Optional[str] = None
    notes: Optional[str] = None

class MaintenanceOrder(MaintenanceOrderBase):
    id: int
    received_at: str
    completed_at: Optional[str] = None
    delivered_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# ── Extension Models ──

class MaintenanceStatusLog(BaseModel):
    id: int
    order_id: int
    old_status: Optional[str]
    new_status: Optional[str]
    notes: Optional[str]
    changed_by: Optional[str]
    changed_at: str

    model_config = ConfigDict(from_attributes=True)

class MaintenanceImage(BaseModel):
    id: int
    order_id: int
    kind: str
    original_name: Optional[str]
    stored_path: str
    created_at: str

    model_config = ConfigDict(from_attributes=True)

class DeviceModelCatalog(BaseModel):
    id: Optional[int] = None
    device_type: str
    model: str
    brand: Optional[str] = ""
    notes: Optional[str] = None
    active: int = 1

    model_config = ConfigDict(from_attributes=True)

class MaintenanceInvoiceVersion(BaseModel):
    id: int
    order_id: int
    version: int
    reason: Optional[str]
    payload_json: str
    created_by: Optional[str]
    created_at: str

    model_config = ConfigDict(from_attributes=True)
