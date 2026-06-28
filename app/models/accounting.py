"""Accounting schemas — Accounts, JournalEntries, Checks, Assets, CostCenters, FiscalYears."""
from pydantic import BaseModel
from typing import Optional


# ── Account ──
class AccountCreate(BaseModel):
    code: str
    name: str
    type: str  # asset, liability, equity, revenue, expense
    description: Optional[str] = ""

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

# ── Journal Entry ──
class JournalEntryLineCreate(BaseModel):
    account_id: int
    account_name: str = ""
    debit: float = 0
    credit: float = 0
    description: Optional[str] = ""
    cost_center_id: Optional[int] = None

class JournalEntryCreate(BaseModel):
    date: str
    reference: Optional[str] = ""
    description: str
    lines: list[JournalEntryLineCreate]
    status: str = "draft"
    currency_id: Optional[int] = 1
    exchange_rate: Optional[float] = 1.0
    created_by: Optional[str] = ""

class JournalEntryUpdate(BaseModel):
    status: Optional[str] = None
    description: Optional[str] = None

# ── Bank Check ──
class CheckCreate(BaseModel):
    number: str
    amount: float
    bank_name: str
    issue_date: str
    due_date: str
    type: str = "receivable"
    payee_name: str = ""
    payee_id: Optional[int] = None
    notes: Optional[str] = ""
    image: Optional[str] = ""

class CheckUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

# ── Cost Center ──
class CostCenterCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = ""
    budget: Optional[float] = None

class CostCenterUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    budget: Optional[float] = None

# ── Fixed Asset ──
class AssetCreate(BaseModel):
    name: str
    cost: float
    value: float
    salvage_value: float = 0
    purchase_date: str
    life_in_years: int = 5
    note: Optional[str] = ""
    category: Optional[str] = ""
    serial_number: Optional[str] = ""
    location: Optional[str] = ""
    status: str = "Active"
    maintenance_interval_days: int = 0

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    value: Optional[float] = None
    note: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    last_maintenance_date: Optional[str] = None
    maintenance_interval_days: Optional[int] = None

class AssetMovementRequest(BaseModel):
    to_location: str
    authorized_by: Optional[str] = ""
    reason: Optional[str] = ""

class AssetMaintenanceLogCreate(BaseModel):
    maintenance_date: str
    maintenance_type: str # Routine, Repair, Overhaul
    cost: float = 0
    performed_by: Optional[str] = ""
    details: Optional[str] = ""
    next_due_date: Optional[str] = None

# ── Fiscal Year ──
class FiscalYearCreate(BaseModel):
    name: str
    start_date: str
    end_date: str

class FiscalYearClose(BaseModel):
    pass  # Just triggers close

# ── Bank Reconciliation ──
class ReconciliationCreate(BaseModel):
    account_id: int
    statement_date: str
    statement_balance: float
    reconciled_entry_ids_json: str = "[]"

class ReconciliationUpdate(BaseModel):
    status: Optional[str] = None
    reconciled_entry_ids_json: Optional[str] = None
    statement_balance: Optional[float] = None

# ── Budget (Phase 9) ──
class BudgetCreate(BaseModel):
    account_id: int
    cost_center_id: Optional[int] = None
    period_type: str = "monthly"
    fiscal_year_id: int
    planned_amount: float

# ── Currency (Phase 9) ──

# ── Currency (Phase 9) ──
class CurrencyCreate(BaseModel):
    code: str
    name: str
    symbol: Optional[str] = ""
    exchange_rate: float = 1.0
    is_base: bool = False
    is_active: bool = True

class CurrencyUpdate(BaseModel):
    name: Optional[str] = None
    symbol: Optional[str] = None
    exchange_rate: Optional[float] = None
    is_base: Optional[bool] = None
    is_active: Optional[bool] = None

class CurrencyExchangeRequest(BaseModel):
    from_account_id: int
    to_account_id: int
    from_currency_id: int
    to_currency_id: int
    from_amount: float
    to_amount: float
    exchange_rate: float
    date: Optional[str] = None
    reference: Optional[str] = ""
    notes: Optional[str] = ""
