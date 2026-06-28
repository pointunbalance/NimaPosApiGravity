"""Pydantic models for Payroll processing."""
from pydantic import BaseModel
from typing import Optional


class PayrollProcess(BaseModel):
    """Process salary for a user in a specific month."""
    user_id: int
    month: str  # YYYY-MM
    base_salary: float
    days_worked: int = 30
    bonus: float = 0
    deductions: float = 0
    payment_method: str = "cash"  # cash | bank
    notes: Optional[str] = ""


class PayrollFilter(BaseModel):
    month: Optional[str] = None  # YYYY-MM
    user_id: Optional[int] = None
    status: Optional[str] = None
