from fastapi import APIRouter, Depends, Query
from typing import List
from app.models.mrp import MRPPlanCreate, SafetyStockRuleCreate, DemandForecast
from app.models.common import ApiResponse
from app.repositories import mrp_repo
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/mrp", tags=["MRP & Forecasting"])

@router.post("/safety-rules", response_model=ApiResponse)
def create_safety_rule(rule: SafetyStockRuleCreate, current_user=Depends(get_current_user)):
    rule_id = mrp_repo.create_safety_rule(rule)
    return ApiResponse(ok=True, data={"id": rule_id, "message": "Safety stock rule established"})

@router.get("/safety-rules", response_model=ApiResponse)
def get_safety_rules(current_user=Depends(get_current_user)):
    rules = mrp_repo.get_safety_rules()
    return ApiResponse(ok=True, data=rules)

@router.get("/forecast", response_model=ApiResponse)
def get_demand_forecast(days: int = Query(30), current_user=Depends(get_current_user)):
    forecasts = mrp_repo.calculate_demand_forecast(days)
    return ApiResponse(ok=True, data=forecasts)

@router.get("/reorder-suggestions", response_model=ApiResponse)
def get_reorder_suggestions(current_user=Depends(get_current_user)):
    suggestions = mrp_repo.get_reorder_suggestions()
    return ApiResponse(ok=True, data=suggestions)

@router.post("/plans", response_model=ApiResponse)
def create_mrp_plan(plan: MRPPlanCreate, current_user=Depends(get_current_user)):
    plan_id = mrp_repo.create_mrp_plan(plan)
    return ApiResponse(ok=True, data={"id": plan_id, "message": "MRP plan created"})
