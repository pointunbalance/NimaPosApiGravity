from pydantic import BaseModel, Field
from typing import Optional

class CreditClearingCreate(BaseModel):
    invoice_id: int
    return_id: int
    amount: float
    notes: Optional[str] = None

class CreditClearingOut(BaseModel):
    id: int
    invoice_id: int
    return_id: int
    amount: float
    date: str
    notes: Optional[str]
