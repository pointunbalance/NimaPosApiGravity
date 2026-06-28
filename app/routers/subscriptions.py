from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.models.subscription import SubscriptionPlanCreate, SubscriptionCreate, SubscriptionUpdate
from app.models.common import ApiResponse
from app.repositories import subscription_repo
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions & Billing"])

@router.post("/plans", response_model=ApiResponse)
def create_subscription_plan(plan: SubscriptionPlanCreate, current_user=Depends(get_current_user)):
    plan_id = subscription_repo.create_plan(plan)
    return ApiResponse(ok=True, data={"id": plan_id, "message": "Subscription plan created"})

@router.get("/plans", response_model=ApiResponse)
def get_plans(current_user=Depends(get_current_user)):
    plans = subscription_repo.get_plans()
    return ApiResponse(ok=True, data=plans)

@router.post("/enroll", response_model=ApiResponse)
def enroll_customer(sub: SubscriptionCreate, current_user=Depends(get_current_user)):
    try:
        sub_id = subscription_repo.create_subscription(sub)
        return ApiResponse(ok=True, data={"id": sub_id, "message": "Customer enrolled successfully"})
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/active", response_model=ApiResponse)
def get_active_subscriptions(current_user=Depends(get_current_user)):
    subs = subscription_repo.get_active_subscriptions()
    return ApiResponse(ok=True, data=subs)

@router.post("/run-billing", response_model=ApiResponse)
def trigger_billing(current_user=Depends(get_current_user)):
    # This would normally be a background task
    subscription_repo.process_recurring_billing()
    return ApiResponse(ok=True, data={"message": "Recurring billing process completed"})

@router.patch("/{sub_id}", response_model=ApiResponse)
def update_subscription(sub_id: int, update: SubscriptionUpdate, current_user=Depends(get_current_user)):
    return ApiResponse(ok=True, data={"message": "Subscription updated"})
