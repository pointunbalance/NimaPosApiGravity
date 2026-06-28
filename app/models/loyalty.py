"""Loyalty, Promotion, Installment schemas."""
from pydantic import BaseModel
from typing import Optional


# ── Loyalty Transaction ──
class LoyaltyTransactionCreate(BaseModel):
    customer_id: int
    points: int
    type: str  # earn, redeem, manual_add, manual_deduct, welcome, refund
    order_id: Optional[int] = None
    note: Optional[str] = ""

# ── Promotion ──
class PromotionCreate(BaseModel):
    name: str
    code: Optional[str] = ""
    description: Optional[str] = ""
    type: str = "percentage"
    value: float = 0
    buy_quantity: Optional[int] = None
    get_quantity: Optional[int] = None
    target: str = "order"
    target_ids_json: Optional[str] = "[]"
    min_order_value: Optional[float] = None
    start_date: str
    end_date: Optional[str] = None
    usage_limit: Optional[int] = None
    is_active: bool = True

class PromotionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    value: Optional[float] = None
    end_date: Optional[str] = None
    usage_limit: Optional[int] = None
    is_active: Optional[bool] = None

# ── Installment Plan ──
class InstallmentPlanCreate(BaseModel):
    customer_id: int
    order_id: Optional[int] = None
    principal_amount: float
    total_amount: float
    down_payment: float = 0
    installment_count: int
    installment_amount: float
    start_date: str
    notes: Optional[str] = ""
    interest_type: str = "none"
    interest_rate: float = 0
    total_interest_amount: float = 0
    late_fee_enabled: bool = False
    late_fee_type: str = "fixed"
    late_fee_amount: float = 0
    grace_period_days: int = 0

class InstallmentPaymentCreate(BaseModel):
    plan_id: int
    customer_id: int
    amount: float
    principal_part: float = 0
    interest_part: float = 0
    due_date: str
    notes: Optional[str] = ""

# ── Loyalty Tiers ──
class LoyaltyTierCreate(BaseModel):
    name: str
    min_points: int
    multiplier: float = 1.0
    color: Optional[str] = "#3b82f6"

class LoyaltyTierUpdate(BaseModel):
    name: Optional[str] = None
    min_points: Optional[int] = None
    multiplier: Optional[float] = None
    color: Optional[str] = None

# ── Loyalty Settings ──
class LoyaltySettingsUpdate(BaseModel):
    enabled: bool
    points_per_currency: float
    currency_per_point: float
    min_points_to_redeem: int
    welcome_bonus: int = 0
    enable_tiers: bool = False
