from fastapi import APIRouter, Depends, Query
from typing import List
from app.models.treasury import TreasuryForecastCreate, BankStatementImportCreate, CashFlowPoint
from app.models.common import ApiResponse
from app.repositories import treasury_repo
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/treasury", tags=["Treasury & Liquidity"])

@router.get("/projection", response_model=ApiResponse)
def get_cash_flow_projection(days: int = Query(30), current_user=Depends(get_current_user)):
    projection = treasury_repo.get_cash_flow_projection(days)
    return ApiResponse(ok=True, data=projection)

@router.post("/forecasts", response_model=ApiResponse)
def create_manual_forecast(forecast: TreasuryForecastCreate, current_user=Depends(get_current_user)):
    forecast_id = treasury_repo.create_manual_forecast(forecast)
    return ApiResponse(ok=True, data={"id": forecast_id, "message": "Manual treasury forecast added"})

@router.post("/bank-imports", response_model=ApiResponse)
def log_bank_import(data: BankStatementImportCreate, current_user=Depends(get_current_user)):
    import_id = treasury_repo.log_bank_import(data)
    return ApiResponse(ok=True, data={"id": import_id, "message": "Bank statement import logged"})
