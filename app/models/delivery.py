from pydantic import BaseModel, ConfigDict
from typing import Optional

class DeliveryAssignmentBase(BaseModel):
    invoice_id: int
    driver_id: Optional[int] = None
    driver_name: Optional[str] = ""
    customer_name: str = ""
    customer_phone: Optional[str] = ""
    delivery_address: str = ""
    status: str = "pending"
    delivery_fee: float = 0
    collected_amount: float = 0
    is_settled: int = 0
    notes: Optional[str] = None
    branch_id: int = 1

class DeliveryAssignmentCreate(DeliveryAssignmentBase):
    pass

class DeliveryAssignmentUpdate(BaseModel):
    driver_id: Optional[int] = None
    driver_name: Optional[str] = None
    status: Optional[str] = None
    collected_amount: Optional[float] = None
    is_settled: Optional[int] = None
    picked_at: Optional[str] = None
    delivered_at: Optional[str] = None
    notes: Optional[str] = None

class DeliveryAssignment(DeliveryAssignmentBase):
    id: int
    assigned_at: str
    picked_at: Optional[str] = None
    delivered_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
