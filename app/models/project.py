from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

# ── Projects ──
class ProjectBase(BaseModel):
    name: str
    customer_id: Optional[int] = None
    description: Optional[str] = ""
    budget: float = 0.0
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: str = "planning"  # planning, in_progress, completed, on_hold

class ProjectCreate(ProjectBase):
    pass

class ProjectOut(ProjectBase):
    id: int
    created_at: str
    model_config = ConfigDict(from_attributes=True)

# ── WBS Tasks ──
class WBSTaskCreate(BaseModel):
    name: str
    allocated_budget: float = 0.0
    estimated_hours: float = 0.0
    status: str = "pending"

class WBSTaskOut(WBSTaskCreate):
    id: int
    project_id: int
    model_config = ConfigDict(from_attributes=True)

# ── Timesheets (Labor Cost) ──
class TimesheetLogCreate(BaseModel):
    task_id: Optional[int] = None
    employee_id: Optional[int] = None
    date: str
    hours_worked: float
    hourly_rate: float
    note: Optional[str] = ""

class TimesheetLogOut(TimesheetLogCreate):
    id: int
    project_id: int
    total_cost: float
    model_config = ConfigDict(from_attributes=True)

# ── Materials (Material Cost) ──
class MaterialConsumptionCreate(BaseModel):
    task_id: Optional[int] = None
    product_id: int
    quantity: float
    note: Optional[str] = ""

class MaterialConsumptionOut(MaterialConsumptionCreate):
    id: int
    project_id: int
    unit_cost: float
    total_cost: float
    date_consumed: str
    model_config = ConfigDict(from_attributes=True)

# ── Costing Summary Report ──
class CostingSummaryOut(BaseModel):
    project_id: int
    project_name: str
    total_budget: float
    total_labor_cost: float
    total_material_cost: float
    total_actual_cost: float
    remaining_budget: float
    profit_margin_percentage: float
