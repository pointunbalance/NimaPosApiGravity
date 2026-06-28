"""Accounting router — Accounts, Journal Entries, General Ledger, Checks, Assets, Cost Centers, Fiscal Years, Reports."""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from app.models.accounting import (AccountCreate, AccountUpdate, JournalEntryCreate, JournalEntryUpdate,
    CheckCreate, CheckUpdate, CostCenterCreate, CostCenterUpdate, AssetCreate, AssetUpdate,
    AssetMovementRequest, AssetMaintenanceLogCreate,
    FiscalYearCreate, FiscalYearClose, ReconciliationCreate, ReconciliationUpdate, CurrencyCreate, CurrencyUpdate,
    CurrencyExchangeRequest, BudgetCreate)
from app.models.common import ApiResponse
from app.repositories import accounting_repo, currency_repo
from app.middleware.auth_middleware import require_role, get_current_user
from app.utils.helpers import paginate, pagination_meta

router = APIRouter(prefix="/accounting", tags=["Accounting / GL"])

# ═══════ CURRENCIES (Phase 9) ═══════
@router.get("/currencies", response_model=ApiResponse, summary="List currencies")
def list_currencies(active_only: bool = False, user: dict = Depends(require_role(["manager", "owner"]))):
    return ApiResponse(ok=True, data=currency_repo.get_all(1 if active_only else None))

@router.post("/currencies", response_model=ApiResponse, summary="Create currency")
def create_currency(payload: CurrencyCreate, user: dict = Depends(require_role(["owner"]))):
    c_id = currency_repo.create(payload.model_dump())
    return ApiResponse(ok=True, data=currency_repo.get_by_id(c_id))

@router.put("/currencies/{c_id}", response_model=ApiResponse, summary="Update currency")
def update_currency(c_id: int, payload: CurrencyUpdate, user: dict = Depends(require_role(["owner"]))):
    currency_repo.update(c_id, payload.model_dump(exclude_unset=True))
    return ApiResponse(ok=True, data=currency_repo.get_by_id(c_id))

@router.get("/currencies/convert", response_model=ApiResponse, summary="Utility for currency conversion")
def convert_currency(amount: float = Query(...), from_id: int = Query(...), to_id: int = Query(...)):
    """Calculates conversion amount based on current rates."""
    result = currency_repo.convert(amount, from_id, to_id)
    return ApiResponse(ok=True, data={"result": round(result, 2)})

@router.post("/currencies/exchange", response_model=ApiResponse, summary="Process manual currency exchange")
def process_exchange(payload: CurrencyExchangeRequest, user: dict = Depends(require_role(["owner"]))):
    """Creates a journal entry for manual currency swap."""
    entry_id = accounting_repo.create_currency_exchange(payload.model_dump())
    return ApiResponse(ok=True, data={"entry_id": entry_id, "message": "Currency exchange processed"})

# ═══════ ACCOUNTS ═══════
@router.get("/accounts", response_model=ApiResponse, summary="Chart of Accounts")
def list_accounts(type: str = None, user: dict = Depends(require_role(["manager", "owner"]))):
    return ApiResponse(ok=True, data=accounting_repo.list_accounts(type))

@router.post("/accounts", response_model=ApiResponse, summary="Create account")
def create_account(payload: AccountCreate, user: dict = Depends(require_role(["owner"]))):
    a_id = accounting_repo.create_account(payload.model_dump())
    return ApiResponse(ok=True, data=accounting_repo.get_account(a_id))

@router.put("/accounts/{a_id}", response_model=ApiResponse, summary="Update account")
def update_account(a_id: int, payload: AccountUpdate, user: dict = Depends(require_role(["owner"]))):
    if not accounting_repo.get_account(a_id): raise HTTPException(404, "Account not found")
    accounting_repo.update_account(a_id, payload.model_dump(exclude_unset=True))
    return ApiResponse(ok=True, data=accounting_repo.get_account(a_id))

# ═══════ JOURNAL ENTRIES ═══════
@router.get("/journal-entries", response_model=ApiResponse, summary="List journal entries")
def list_entries(date_from: str = None, date_to: str = None, status: str = None, page: int = Query(1, ge=1), limit: int = Query(50, ge=1, le=200), user: dict = Depends(require_role(["manager", "owner"]))):
    offset, limit, page = paginate(page, limit)
    items, total = accounting_repo.list_entries(date_from, date_to, status, offset, limit)
    return ApiResponse(ok=True, data={"items": items, "pagination": pagination_meta(total, page, limit)})

@router.get("/journal-entries/{e_id}", response_model=ApiResponse, summary="Get journal entry")
def get_entry(e_id: int, user: dict = Depends(require_role(["manager", "owner"]))):
    entry = accounting_repo.get_entry(e_id)
    if not entry: raise HTTPException(404, "Entry not found")
    return ApiResponse(ok=True, data=entry)

@router.post("/journal-entries", response_model=ApiResponse, summary="Create journal entry")
def create_entry(payload: JournalEntryCreate, user: dict = Depends(require_role(["manager", "owner"]))):
    total_debit = sum(l.debit for l in payload.lines)
    total_credit = sum(l.credit for l in payload.lines)
    if abs(total_debit - total_credit) > 0.01:
        raise HTTPException(400, f"Debits ({total_debit}) must equal credits ({total_credit})")
    data = payload.model_dump()
    data["total_amount"] = total_debit
    e_id = accounting_repo.create_entry(data)
    return ApiResponse(ok=True, data=accounting_repo.get_entry(e_id))

@router.post("/journal-entries/{e_id}/post", response_model=ApiResponse, summary="Post entry")
def post_entry(e_id: int, user: dict = Depends(require_role(["owner"]))):
    entry = accounting_repo.get_entry(e_id)
    if not entry: raise HTTPException(404, "Entry not found")
    if entry["status"] == "posted": raise HTTPException(400, "Already posted")
    accounting_repo.post_entry(e_id)
    return ApiResponse(ok=True, data={"message": "Entry posted"})

@router.post("/journal-entries/{e_id}/reverse", response_model=ApiResponse, summary="Reverse/Void an entry")
def reverse_entry(e_id: int, user: dict = Depends(require_role(["owner"]))):
    """Creates a contra-entry to nullify the effects of the original one."""
    new_id = accounting_repo.reverse_entry(e_id, user.get("id", 0))
    if not new_id: raise HTTPException(404, "Original entry not found")
    return ApiResponse(ok=True, data={"id": new_id, "message": "Reversal entry created and posted"})

# ═══════ GENERAL LEDGER ═══════
@router.get("/general-ledger/{account_id}", response_model=ApiResponse, summary="General Ledger")
def ledger(account_id: int, date_from: str = None, date_to: str = None, user: dict = Depends(require_role(["manager", "owner"]))):
    account = accounting_repo.get_account(account_id)
    if not account: raise HTTPException(404, "Account not found")
    lines = accounting_repo.general_ledger(account_id, date_from, date_to)
    return ApiResponse(ok=True, data={"account": account, "entries": lines})

# ═══════ BANK CHECKS ═══════
@router.get("/checks", response_model=ApiResponse, summary="List checks")
def list_checks(type: str = None, status: str = None, page: int = Query(1, ge=1), limit: int = Query(50, ge=1, le=200), user: dict = Depends(require_role(["manager", "owner"]))):
    offset, limit, page = paginate(page, limit)
    items, total = accounting_repo.list_checks(type, status, offset, limit)
    return ApiResponse(ok=True, data={"items": items, "pagination": pagination_meta(total, page, limit)})

@router.post("/checks", response_model=ApiResponse, summary="Create check")
def create_check(payload: CheckCreate, user: dict = Depends(require_role(["manager", "owner"]))):
    c_id = accounting_repo.create_check(payload.model_dump())
    return ApiResponse(ok=True, data={"id": c_id})

@router.put("/checks/{c_id}/status", response_model=ApiResponse, summary="Update check status")
def update_check(c_id: int, payload: CheckUpdate, user: dict = Depends(require_role(["manager", "owner"]))):
    accounting_repo.update_check_status(c_id, payload.status, payload.notes)
    return ApiResponse(ok=True, data={"message": "Check updated"})

# ═══════ COST CENTERS ═══════
@router.get("/cost-centers", response_model=ApiResponse, summary="List cost centers")
def list_cc(user: dict = Depends(require_role(["manager", "owner"]))):
    return ApiResponse(ok=True, data=accounting_repo.list_cost_centers())

@router.post("/cost-centers", response_model=ApiResponse, summary="Create cost center")
def create_cc(payload: CostCenterCreate, user: dict = Depends(require_role(["owner"]))):
    cc_id = accounting_repo.create_cost_center(payload.model_dump())
    return ApiResponse(ok=True, data=accounting_repo.get_cost_center(cc_id))

@router.put("/cost-centers/{cc_id}", response_model=ApiResponse, summary="Update cost center")
def update_cc(cc_id: int, payload: CostCenterUpdate, user: dict = Depends(require_role(["owner"]))):
    if not accounting_repo.get_cost_center(cc_id): raise HTTPException(404, "Cost center not found")
    accounting_repo.update_cost_center(cc_id, payload.model_dump(exclude_unset=True))
    return ApiResponse(ok=True, data=accounting_repo.get_cost_center(cc_id))

# ═══════ BUDGETS (Phase 9) ═══════
@router.get("/budgets", response_model=ApiResponse, summary="List budgets")
def list_budgets(cost_center_id: Optional[int] = None, user: dict = Depends(require_role(["manager", "owner"]))):
    return ApiResponse(ok=True, data=accounting_repo.get_budgets(cost_center_id))

@router.post("/budgets", response_model=ApiResponse, summary="Create budget")
def create_budget(payload: BudgetCreate, user: dict = Depends(require_role(["owner"]))):
    b_id = accounting_repo.create_budget(payload.model_dump())
    return ApiResponse(ok=True, data={"id": b_id})

@router.get("/cost-centers/{cc_id}/variance", response_model=ApiResponse, summary="Budget Variance Report")
def budget_variance(cc_id: int, date_from: str = Query(...), date_to: str = Query(...), user: dict = Depends(require_role(["manager", "owner"]))):
    return ApiResponse(ok=True, data=accounting_repo.get_budget_variance(cc_id, date_from, date_to))

# ═══════ FIXED ASSETS ═══════
@router.get("/assets", response_model=ApiResponse, summary="List fixed assets")
def list_assets(user: dict = Depends(require_role(["manager", "owner"]))):
    return ApiResponse(ok=True, data=accounting_repo.list_assets())

@router.post("/assets", response_model=ApiResponse, summary="Create fixed asset")
def create_asset(payload: AssetCreate, user: dict = Depends(require_role(["owner"]))):
    a_id = accounting_repo.create_asset(payload.model_dump())
    return ApiResponse(ok=True, data=accounting_repo.get_asset(a_id))

@router.put("/assets/{a_id}", response_model=ApiResponse, summary="Update asset")
def update_asset(a_id: int, payload: AssetUpdate, user: dict = Depends(require_role(["owner"]))):
    if not accounting_repo.get_asset(a_id): raise HTTPException(404, "Asset not found")
    accounting_repo.update_asset(a_id, payload.model_dump(exclude_unset=True))
    return ApiResponse(ok=True, data=accounting_repo.get_asset(a_id))

@router.post("/assets/{a_id}/depreciate", response_model=ApiResponse, summary="Depreciate asset")
def depreciate(a_id: int, amount: float = Query(...), user: dict = Depends(require_role(["owner"]))):
    asset = accounting_repo.get_asset(a_id)
    if not asset: raise HTTPException(404, "Asset not found")
    accounting_repo.depreciate_asset(a_id, amount)
    return ApiResponse(ok=True, data=accounting_repo.get_asset(a_id))

# ═══════ FISCAL YEARS ═══════
@router.get("/fiscal-years", response_model=ApiResponse, summary="List fiscal years")
def list_fy(user: dict = Depends(require_role(["owner"]))):
    return ApiResponse(ok=True, data=accounting_repo.list_fiscal_years())

@router.post("/fiscal-years", response_model=ApiResponse, summary="Create fiscal year")
def create_fy(payload: FiscalYearCreate, user: dict = Depends(require_role(["owner"]))):
    fy_id = accounting_repo.create_fiscal_year(payload.model_dump())
    return ApiResponse(ok=True, data=accounting_repo.get_fiscal_year(fy_id))

@router.post("/fiscal-years/{fy_id}/close", response_model=ApiResponse, summary="Close fiscal year")
def close_fy(fy_id: int, user: dict = Depends(require_role(["owner"]))):
    fy = accounting_repo.get_fiscal_year(fy_id)
    if not fy: raise HTTPException(404, "Fiscal year not found")
    if fy["status"] == "closed": raise HTTPException(400, "Already closed")
    accounting_repo.close_fiscal_year(fy_id)
    return ApiResponse(ok=True, data={"message": "Fiscal year closed"})

@router.post("/fiscal-closing", response_model=ApiResponse, summary="Run Period-End Financial Closing")
def fiscal_closing(date_to: str = Query(...), user: dict = Depends(get_current_user)):
    """Automated zeroing of revenue/expense accounts and transfer to equity."""
    result = accounting_repo.run_period_end_closing(date_to, user["id"])
    return ApiResponse(ok=True, data=result)

# ═══════ BANK RECONCILIATIONS ═══════
@router.get("/reconciliations", response_model=ApiResponse, summary="List reconciliations")
def list_recon(account_id: int = None, user: dict = Depends(require_role(["manager", "owner"]))):
    return ApiResponse(ok=True, data=accounting_repo.list_reconciliations(account_id))

@router.post("/reconciliations", response_model=ApiResponse, summary="Create reconciliation")
def create_recon(payload: ReconciliationCreate, user: dict = Depends(require_role(["owner"]))):
    r_id = accounting_repo.create_reconciliation(payload.model_dump())
    return ApiResponse(ok=True, data={"id": r_id})

@router.put("/reconciliations/{r_id}", response_model=ApiResponse, summary="Update reconciliation")
def update_recon(r_id: int, payload: ReconciliationUpdate, user: dict = Depends(require_role(["owner"]))):
    accounting_repo.update_reconciliation(r_id, payload.model_dump(exclude_unset=True))
    return ApiResponse(ok=True, data={"message": "Reconciliation updated"})

@router.post("/reconciliations/{r_id}/match", response_model=ApiResponse, summary="Match transaction to reconciliation")
def match_recon(r_id: int, entry_id: int = Query(...), user: dict = Depends(require_role(["owner"]))):
    ok = accounting_repo.add_to_reconciliation(r_id, entry_id)
    if not ok: raise HTTPException(404, "Reconciliation not found")
    return ApiResponse(ok=True, data={"message": "Transaction matched"})

@router.post("/vat-closing", response_model=ApiResponse, summary="Run VAT Settlement & Closing")
def vat_closing(date_from: str = Query(...), date_to: str = Query(...), user: dict = Depends(require_role(["owner"]))):
    """Automated settlement of VAT Input vs Output."""
    result = accounting_repo.run_vat_closing(date_from, date_to, user["id"])
    return ApiResponse(ok=True, data=result)

@router.post("/depreciate", response_model=ApiResponse, summary="Run monthly depreciation")
def run_depreciation(user: dict = Depends(require_role(["owner"]))):
    """Trigger monthly depreciation for all fixed assets."""
    from app.logic.depreciation_service import run_monthly_depreciation
    results = run_monthly_depreciation()
    return ApiResponse(ok=True, data={"processed_assets": results})

# ═══════ FINANCIAL REPORTS ═══════
@router.get("/reports/trial-balance", response_model=ApiResponse, summary="Trial Balance")
def trial_balance(user: dict = Depends(require_role(["manager", "owner"]))):
    return ApiResponse(ok=True, data=accounting_repo.trial_balance())

@router.get("/reports/income-statement", response_model=ApiResponse, summary="Income Statement")
def income_statement(date_from: str = Query(...), date_to: str = Query(...), user: dict = Depends(require_role(["manager", "owner"]))):
    return ApiResponse(ok=True, data=accounting_repo.income_statement(date_from, date_to))

@router.get("/reports/balance-sheet", response_model=ApiResponse, summary="Balance Sheet")
def balance_sheet(user: dict = Depends(require_role(["manager", "owner"]))):
    return ApiResponse(ok=True, data=accounting_repo.balance_sheet())

@router.get("/reports/cash-flow", response_model=ApiResponse, summary="Cash Flow Statement")
def cash_flow(date_from: str = Query(...), date_to: str = Query(...), user: dict = Depends(require_role(["manager", "owner"]))):
    """Cash Flow Statement (Simplified Direct Method)."""
    data = accounting_repo.get_cash_flow(date_from, date_to)
    return ApiResponse(ok=True, data=data)

# ═══════ AGING REPORTS ═══════
@router.get("/reports/aging/receivables", response_model=ApiResponse, summary="Receivables Aging")
def aging_receivables(user: dict = Depends(require_role(["manager", "owner"]))):
    """Aging report for customer receivables (0-30, 31-60, 61-90, 90+ days)."""
    from app.repositories import accounting_repo
    data = accounting_repo.get_receivables_aging()
    return ApiResponse(ok=True, data=data)

@router.get("/reports/aging/payables", response_model=ApiResponse, summary="Payables Aging")
def aging_payables(user: dict = Depends(require_role(["manager", "owner"]))):
    """Aging report for supplier payables."""
    from app.repositories import accounting_repo
    data = accounting_repo.get_payables_aging()
    return ApiResponse(ok=True, data=data)

# ═══════ TAX REPORT ═══════
@router.get("/reports/tax", response_model=ApiResponse, summary="Tax Report")
def tax_report(date_from: str = Query(...), date_to: str = Query(...), user: dict = Depends(require_role(["manager", "owner"]))):
    """Tax summary: sales tax collected, purchase tax paid, net liability."""
    from app.repositories import accounting_repo
    data = accounting_repo.get_tax_report(date_from, date_to)
    return ApiResponse(ok=True, data=data)

# ═══════ ADVANCED FINANCIAL REPORTS ═══════
@router.get("/profit-loss", response_model=ApiResponse, summary="Get Profit & Loss")
def get_profit_loss(start_date: str, end_date: str, user: dict = Depends(require_role(["owner", "manager"]))):
    from app.repositories.financial_repo import get_profit_loss as get_pl
    return ApiResponse(ok=True, data=get_pl(start_date, end_date))

@router.get("/financial-snapshot", response_model=ApiResponse, summary="Get full enterprise financial snapshot")
def get_financial_snapshot(user: dict = Depends(require_role(["owner", "manager"]))):
    from app.repositories.financial_repo import get_financial_snapshot as get_fs
    return ApiResponse(ok=True, data=get_fs())
