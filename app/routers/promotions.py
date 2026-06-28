from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from app.models.promotions import PromotionRuleCreate, PromotionRuleOut, WalletTopup, GiftCardCreate, GiftCardRedeem, WalletTransactionOut
from app.models.common import ApiResponse
from app.repositories import promotions_repo
from app.middleware.auth_middleware import get_current_user, require_role

router = APIRouter(prefix="/promotions", tags=["[Phase 26] Promotions & Wallets"])

# ── Promotions ──
@router.post("/rules", response_model=ApiResponse[int])
def create_rule(rule: PromotionRuleCreate, user: dict = Depends(require_role(["owner", "manager"]))):
    rule_id = promotions_repo.create_promotion_rule(rule)
    return ApiResponse(ok=True, data=rule_id)

@router.get("/rules/active", response_model=ApiResponse[List[dict]])
def get_active_rules(user: dict = Depends(get_current_user)):
    return ApiResponse(ok=True, data=promotions_repo.get_active_promotions())

# ── Wallets ──
@router.get("/wallet/{customer_id}", response_model=ApiResponse[dict])
def get_balance(customer_id: int, user: dict = Depends(get_current_user)):
    balance = promotions_repo.get_wallet_balance(customer_id)
    return ApiResponse(ok=True, data={"customer_id": customer_id, "balance": balance})

@router.post("/wallet/topup", response_model=ApiResponse[bool])
def wallet_topup(payload: WalletTopup, user: dict = Depends(require_role(["owner", "manager", "cashier"]))):
    promotions_repo.adjust_wallet_balance(payload.customer_id, payload.amount, "topup", "cash", payload.notes)
    return ApiResponse(ok=True, data=True)

# ── Gift Cards ──
@router.post("/gift-cards", response_model=ApiResponse[int])
def create_card(card: GiftCardCreate, user: dict = Depends(require_role(["owner", "manager"]))):
    card_id = promotions_repo.create_gift_card(card)
    return ApiResponse(ok=True, data=card_id)

@router.post("/gift-cards/redeem", response_model=ApiResponse[float])
def redeem_card(payload: GiftCardRedeem, user: dict = Depends(require_role(["cashier", "manager", "owner"]))):
    try:
        amount = promotions_repo.redeem_gift_card(payload.customer_id, payload.code)
        return ApiResponse(ok=True, data=amount)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
