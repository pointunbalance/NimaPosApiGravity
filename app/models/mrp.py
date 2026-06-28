from pydantic import BaseModel
from typing import Optional, List

class MRPPlanCreate(BaseModel):
    product_id: int
    projected_demand: float
    planned_production_qty: float = 0
    planned_purchase_qty: float = 0
    plan_date: str
    status: str = "draft"

class SafetyStockRuleCreate(BaseModel):
    product_id: int
    min_qty: float
    lead_time_days: int = 1
    auto_po: bool = False

class SafetyStockRuleUpdate(BaseModel):
    min_qty: Optional[float] = None
    lead_time_days: Optional[int] = None
    auto_po: Optional[bool] = None

class DemandForecast(BaseModel):
    product_id: int
    product_name: str
    current_stock: float
    projected_demand: float
    shortage: float
    recommended_action: str
