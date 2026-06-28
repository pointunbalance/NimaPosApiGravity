"""Expense schemas."""
from pydantic import BaseModel
from typing import Optional


class ExpenseCreate(BaseModel):
    title: str
    amount: float
    category: str = "other"
    date: str
    notes: Optional[str] = ""
    payment_method: Optional[str] = "cash"
    attachment: Optional[str] = ""


class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    date: Optional[str] = None
    notes: Optional[str] = None
    payment_method: Optional[str] = None
    attachment: Optional[str] = None
