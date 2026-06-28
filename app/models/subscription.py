from pydantic import BaseModel
from typing import Optional, List

class SubscriptionPlanCreate(BaseModel):
    name: str
    price: float
    interval_months: int = 1
    is_active: bool = True

class SubscriptionPlanUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    interval_months: Optional[int] = None
    is_active: Optional[bool] = None

class SubscriptionCreate(BaseModel):
    customer_id: int
    plan_id: int
    start_date: Optional[str] = None
    notes: Optional[str] = ""

class SubscriptionUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    next_invoice_date: Optional[str] = None
