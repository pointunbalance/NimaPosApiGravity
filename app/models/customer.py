"""Customer schemas."""
from pydantic import BaseModel, Field
from typing import Optional


class CustomerCreate(BaseModel):
    code: str = Field(..., description="Unique customer code")
    name: str = Field(..., description="Customer name")
    name_en: Optional[str] = ""
    phone: str = ""
    email: str = ""
    address: str = ""
    notes: str = ""
    balance: float = 0.0
    wallet_balance: float = 0.0
    credit_limit: float = 0.0


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    name_en: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None
    balance: Optional[float] = None
    wallet_balance: Optional[float] = None
    credit_limit: Optional[float] = None


class CustomerOut(BaseModel):
    id: int
    code: str
    name: str
    name_en: Optional[str] = ""
    phone: str = ""
    email: str = ""
    address: str = ""
    notes: str = ""
    is_active: bool = True
    total_spent: float = 0.0
    total_purchases: float = 0.0
    balance: float = 0.0
    wallet_balance: float = 0.0
    credit_limit: float = 0.0
    loyalty_points: int = 0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
