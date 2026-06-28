from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class PromotionRuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    rule_type: str = Field(..., description="bogo, cart_total, category_discount, fixed_discount")
    min_total_amount: float = 0
    min_qty: int = 1
    buy_product_id: Optional[int] = None
    get_product_id: Optional[int] = None
    discount_percent: float = 0
    discount_amount: float = 0
    is_active: bool = True
    priority: int = 0

class PromotionRuleOut(PromotionRuleCreate):
    id: int

class WalletTopup(BaseModel):
    customer_id: int
    amount: float
    notes: Optional[str] = None

class GiftCardCreate(BaseModel):
    code: str
    amount: float
    expiry_date: Optional[str] = None

class GiftCardRedeem(BaseModel):
    customer_id: int
    code: str

class WalletTransactionOut(BaseModel):
    id: int
    customer_id: int
    type: str
    amount: float
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    created_at: str
