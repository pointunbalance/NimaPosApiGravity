"""Advanced routers — Warehouses, Batches, Serials, Tables, Loyalty, Promotions, Installments, Rentals, Studio."""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from app.models.common import ApiResponse
from app.models.warehouse import WarehouseCreate, WarehouseUpdate, BatchCreate, SerialCreate, SerialUpdate, TableCreate, TableUpdate
from app.models.loyalty import (
    LoyaltyTransactionCreate, PromotionCreate, PromotionUpdate, 
    InstallmentPlanCreate, InstallmentPaymentCreate, 
    LoyaltyTierCreate, LoyaltyTierUpdate, LoyaltySettingsUpdate
)
from app.models.rental import RentalCreate, RentalUpdate
from app.models.studio import CameraCreate, CameraUpdate, BookingCreate, BookingUpdate
from app.models.team import TeamMemberCreate, TeamMemberUpdate
from app.models.portfolio import PortfolioCreate, PortfolioUpdate
from app.repositories import advanced_repo
from app.middleware.auth_middleware import get_current_user, require_role
from app.utils.helpers import paginate, pagination_meta

router = APIRouter(tags=["Advanced"])

# ═══════ WAREHOUSES ═══════
@router.get("/warehouses", response_model=ApiResponse, summary="List warehouses", tags=["Advanced"])
def list_wh(user: dict = Depends(get_current_user)):
    return ApiResponse(ok=True, data=advanced_repo.list_warehouses())

@router.post("/warehouses", response_model=ApiResponse, summary="Create warehouse", tags=["Advanced"])
def create_wh(payload: WarehouseCreate, user: dict = Depends(require_role(["owner"]))):
    w_id = advanced_repo.create_warehouse(payload.model_dump())
    return ApiResponse(ok=True, data=advanced_repo.get_warehouse(w_id))

@router.put("/warehouses/{w_id}", response_model=ApiResponse, summary="Update warehouse", tags=["Advanced"])
def update_wh(w_id: int, payload: WarehouseUpdate, user: dict = Depends(require_role(["owner"]))):
    if not advanced_repo.get_warehouse(w_id): raise HTTPException(404, "Warehouse not found")
    advanced_repo.update_warehouse(w_id, payload.model_dump(exclude_unset=True))
    return ApiResponse(ok=True, data=advanced_repo.get_warehouse(w_id))

@router.get("/warehouses/{w_id}/inventory", response_model=ApiResponse, summary="Warehouse inventory", tags=["Advanced"])
def wh_inventory(w_id: int, user: dict = Depends(get_current_user)):
    return ApiResponse(ok=True, data=advanced_repo.get_warehouse_inventory(w_id))

# ═══════ BATCHES ═══════
@router.get("/batches", response_model=ApiResponse, summary="List batches", tags=["Batches & Serials"])
def list_batches(product_id: int = None, warehouse_id: int = None, page: int = Query(1, ge=1), limit: int = Query(50, ge=1, le=200), user: dict = Depends(get_current_user)):
    offset, limit, page = paginate(page, limit)
    items, total = advanced_repo.list_batches(product_id, warehouse_id, offset, limit)
    return ApiResponse(ok=True, data={"items": items, "pagination": pagination_meta(total, page, limit)})

@router.get("/batches/expiring", response_model=ApiResponse, summary="Expiring batches", tags=["Batches & Serials"])
def expiring(days: int = 30, user: dict = Depends(get_current_user)):
    return ApiResponse(ok=True, data=advanced_repo.expiring_batches(days))

@router.post("/batches", response_model=ApiResponse, summary="Create batch", tags=["Batches & Serials"])
def create_batch(payload: BatchCreate, user: dict = Depends(require_role(["manager", "owner"]))):
    b_id = advanced_repo.create_batch(payload.model_dump())
    return ApiResponse(ok=True, data={"id": b_id})

# ═══════ SERIALS ═══════
@router.get("/serials", response_model=ApiResponse, summary="List serials", tags=["Batches & Serials"])
def list_serials(product_id: int = None, status: str = None, page: int = Query(1, ge=1), limit: int = Query(50, ge=1, le=200), user: dict = Depends(get_current_user)):
    offset, limit, page = paginate(page, limit)
    items, total = advanced_repo.list_serials(product_id, status, offset, limit)
    return ApiResponse(ok=True, data={"items": items, "pagination": pagination_meta(total, page, limit)})

@router.post("/serials", response_model=ApiResponse, summary="Add serial", tags=["Batches & Serials"])
def add_serial(payload: SerialCreate, user: dict = Depends(require_role(["manager", "owner"]))):
    s_id = advanced_repo.create_serial(payload.model_dump())
    return ApiResponse(ok=True, data={"id": s_id})

@router.put("/serials/{s_id}", response_model=ApiResponse, summary="Update serial status", tags=["Batches & Serials"])
def update_serial(s_id: int, payload: SerialUpdate, user: dict = Depends(require_role(["manager", "owner"]))):
    advanced_repo.update_serial_status(s_id, payload.status, payload.order_id)
    return ApiResponse(ok=True, data={"message": "Serial updated"})

# ═══════ DINING TABLES ═══════
@router.get("/tables", response_model=ApiResponse, summary="List tables", tags=["Advanced"])
def list_tbl(user: dict = Depends(get_current_user)):
    return ApiResponse(ok=True, data=advanced_repo.list_tables())

@router.post("/tables", response_model=ApiResponse, summary="Create table", tags=["Advanced"])
def create_tbl(payload: TableCreate, user: dict = Depends(require_role(["manager", "owner"]))):
    t_id = advanced_repo.create_table(payload.model_dump())
    return ApiResponse(ok=True, data=advanced_repo.get_table(t_id))

@router.put("/tables/{t_id}", response_model=ApiResponse, summary="Update table", tags=["Advanced"])
def update_tbl(t_id: int, payload: TableUpdate, user: dict = Depends(require_role(["manager", "owner"]))):
    if not advanced_repo.get_table(t_id): raise HTTPException(404, "Table not found")
    advanced_repo.update_table(t_id, payload.model_dump(exclude_unset=True))
    return ApiResponse(ok=True, data=advanced_repo.get_table(t_id))

@router.delete("/tables/{t_id}", response_model=ApiResponse, summary="Delete table", tags=["Advanced"])
def delete_tbl(t_id: int, user: dict = Depends(require_role(["owner"]))):
    if not advanced_repo.get_table(t_id): raise HTTPException(404, "Table not found")
    advanced_repo.delete_table(t_id)
    return ApiResponse(ok=True, data={"message": "Table deleted"})

# ═══════ LOYALTY ═══════
@router.post("/loyalty", response_model=ApiResponse, summary="Add loyalty transaction", tags=["Loyalty"])
def add_loyalty(payload: LoyaltyTransactionCreate, user: dict = Depends(require_role(["cashier", "manager", "owner"]))):
    tx_id = advanced_repo.add_loyalty_tx(payload.model_dump())
    return ApiResponse(ok=True, data={"id": tx_id})

@router.get("/loyalty/{customer_id}", response_model=ApiResponse, summary="Loyalty history", tags=["Loyalty"])
def loyalty_history(customer_id: int, page: int = Query(1, ge=1), limit: int = Query(50, ge=1, le=200), user: dict = Depends(get_current_user)):
    offset, limit, page = paginate(page, limit)
    items, total = advanced_repo.list_loyalty_tx(customer_id, offset, limit)
    return ApiResponse(ok=True, data={"items": items, "pagination": pagination_meta(total, page, limit)})

@router.post("/loyalty/bulk-points", response_model=ApiResponse, summary="Adjust points for multiple customers", tags=["Loyalty"])
def bulk_loyalty_points(customer_ids: List[int], points: float, reason: str = "Marketing Campaign", user: dict = Depends(require_role(["manager", "owner"]))):
    """Adds or subtracts points for a list of customers."""
    from app.repositories import customer_repo
    processed = 0
    for cid in customer_ids:
        if customer_repo.get_by_id(cid):
            advanced_repo.add_loyalty_tx({"customer_id": cid, "points": points, "type": "bonus", "note": reason})
            processed += 1
    return ApiResponse(ok=True, data={"processed": processed, "message": f"Processed {processed} customers"})

# ═══════ PROMOTIONS ═══════
@router.get("/promotions", response_model=ApiResponse, summary="List promotions", tags=["Promotions"])
def list_promos(active_only: bool = False, user: dict = Depends(get_current_user)):
    return ApiResponse(ok=True, data=advanced_repo.list_promotions(active_only))

@router.get("/promotions/code/{code}", response_model=ApiResponse, summary="Get promo by code", tags=["Promotions"])
def promo_by_code(code: str, user: dict = Depends(get_current_user)):
    p = advanced_repo.get_promotion_by_code(code)
    if not p: raise HTTPException(404, "Promotion not found")
    return ApiResponse(ok=True, data=p)

@router.post("/promotions", response_model=ApiResponse, summary="Create promotion", tags=["Promotions"])
def create_promo(payload: PromotionCreate, user: dict = Depends(require_role(["manager", "owner"]))):
    p_id = advanced_repo.create_promotion(payload.model_dump())
    return ApiResponse(ok=True, data=advanced_repo.get_promotion(p_id))

@router.put("/promotions/{p_id}", response_model=ApiResponse, summary="Update promotion", tags=["Promotions"])
def update_promo(p_id: int, payload: PromotionUpdate, user: dict = Depends(require_role(["manager", "owner"]))):
    if not advanced_repo.get_promotion(p_id): raise HTTPException(404, "Promotion not found")
    advanced_repo.update_promotion(p_id, payload.model_dump(exclude_unset=True))
    return ApiResponse(ok=True, data=advanced_repo.get_promotion(p_id))

# ═══════ INSTALLMENTS ═══════
@router.get("/installments", response_model=ApiResponse, summary="List plans", tags=["Installments"])
def list_plans(customer_id: int = None, status: str = None, page: int = Query(1, ge=1), limit: int = Query(50, ge=1, le=200), user: dict = Depends(require_role(["manager", "owner"]))):
    offset, limit, page = paginate(page, limit)
    items, total = advanced_repo.list_plans(customer_id, status, offset, limit)
    return ApiResponse(ok=True, data={"items": items, "pagination": pagination_meta(total, page, limit)})

@router.get("/installments/{plan_id}", response_model=ApiResponse, summary="Get plan", tags=["Installments"])
def get_plan(plan_id: int, user: dict = Depends(get_current_user)):
    plan = advanced_repo.get_plan(plan_id)
    if not plan: raise HTTPException(404, "Plan not found")
    plan["payments"] = advanced_repo.list_plan_payments(plan_id)
    return ApiResponse(ok=True, data=plan)

@router.post("/installments", response_model=ApiResponse, summary="Create plan", tags=["Installments"])
def create_plan(payload: InstallmentPlanCreate, user: dict = Depends(require_role(["manager", "owner"]))):
    plan_id = advanced_repo.create_plan(payload.model_dump())
    return ApiResponse(ok=True, data=advanced_repo.get_plan(plan_id))

@router.post("/installments/{plan_id}/pay", response_model=ApiResponse, summary="Pay installment", tags=["Installments"])
def pay_installment(plan_id: int, payload: InstallmentPaymentCreate, user: dict = Depends(require_role(["cashier", "manager", "owner"]))):
    plan = advanced_repo.get_plan(plan_id)
    if not plan: raise HTTPException(404, "Plan not found")
    if plan["status"] == "completed": raise HTTPException(400, "Plan already completed")
    pay_id = advanced_repo.create_installment_payment(payload.model_dump())
    return ApiResponse(ok=True, data={"id": pay_id})

# ═══════ RENTALS ═══════
@router.get("/rentals", response_model=ApiResponse, summary="List rentals", tags=["Rentals"])
def list_rentals(status: str = None, customer_id: int = None, page: int = Query(1, ge=1), limit: int = Query(50, ge=1, le=200), user: dict = Depends(get_current_user)):
    offset, limit, page = paginate(page, limit)
    items, total = advanced_repo.list_rentals(status, customer_id, offset, limit)
    return ApiResponse(ok=True, data={"items": items, "pagination": pagination_meta(total, page, limit)})

@router.get("/rentals/{r_id}", response_model=ApiResponse, summary="Get rental", tags=["Rentals"])
def get_rental(r_id: int, user: dict = Depends(get_current_user)):
    r = advanced_repo.get_rental(r_id)
    if not r: raise HTTPException(404, "Rental not found")
    return ApiResponse(ok=True, data=r)

@router.post("/rentals", response_model=ApiResponse, summary="Create rental", tags=["Rentals"])
def create_rental(payload: RentalCreate, user: dict = Depends(require_role(["cashier", "manager", "owner"]))):
    r_id = advanced_repo.create_rental(payload.model_dump())
    return ApiResponse(ok=True, data=advanced_repo.get_rental(r_id))

@router.put("/rentals/{r_id}", response_model=ApiResponse, summary="Update rental", tags=["Rentals"])
def update_rental(r_id: int, payload: RentalUpdate, user: dict = Depends(require_role(["manager", "owner"]))):
    if not advanced_repo.get_rental(r_id): raise HTTPException(404, "Rental not found")
    advanced_repo.update_rental(r_id, payload.model_dump(exclude_unset=True))
    return ApiResponse(ok=True, data=advanced_repo.get_rental(r_id))

# ═══════ STUDIO ═══════
@router.get("/studio/cameras", response_model=ApiResponse, summary="List cameras", tags=["Studio Pro (New 🚀)"])
def list_cams(user: dict = Depends(get_current_user)):
    return ApiResponse(ok=True, data=advanced_repo.list_cameras())

@router.post("/studio/cameras", response_model=ApiResponse, summary="Create camera", tags=["Studio Pro (New 🚀)"])
def create_cam(payload: CameraCreate, user: dict = Depends(require_role(["manager", "owner"]))):
    c_id = advanced_repo.create_camera(payload.model_dump())
    return ApiResponse(ok=True, data=advanced_repo.get_camera(c_id))

@router.put("/studio/cameras/{c_id}", response_model=ApiResponse, summary="Update camera", tags=["Studio Pro (New 🚀)"])
def update_cam(c_id: int, payload: CameraUpdate, user: dict = Depends(require_role(["manager", "owner"]))):
    if not advanced_repo.get_camera(c_id): raise HTTPException(404, "Camera not found")
    advanced_repo.update_camera(c_id, payload.model_dump(exclude_unset=True))
    return ApiResponse(ok=True, data=advanced_repo.get_camera(c_id))

@router.get("/studio/bookings", response_model=ApiResponse, summary="List bookings", tags=["Studio Pro (New 🚀)"])
def list_book(camera_id: int = None, date: str = None, status: str = None, page: int = Query(1, ge=1), limit: int = Query(50, ge=1, le=200), user: dict = Depends(get_current_user)):
    offset, limit, page = paginate(page, limit)
    items, total = advanced_repo.list_bookings(camera_id, date, status, offset, limit)
    return ApiResponse(ok=True, data={"items": items, "pagination": pagination_meta(total, page, limit)})

@router.post("/studio/bookings", response_model=ApiResponse, summary="Create booking", tags=["Studio Pro (New 🚀)"])
def create_book(payload: BookingCreate, user: dict = Depends(require_role(["cashier", "manager", "owner"]))):
    b_id = advanced_repo.create_booking(payload.model_dump())
    return ApiResponse(ok=True, data={"id": b_id})

@router.put("/studio/bookings/{b_id}", response_model=ApiResponse, summary="Update booking", tags=["Studio Pro (New 🚀)"])
def update_book(b_id: int, payload: BookingUpdate, user: dict = Depends(require_role(["manager", "owner"]))):
    advanced_repo.update_booking(b_id, payload.model_dump(exclude_unset=True))
    return ApiResponse(ok=True, data={"message": "Booking updated"})

@router.get("/studio/bookings/check-conflict", response_model=ApiResponse, summary="Check booking conflict", tags=["Studio Pro (New 🚀)"])
def check_conflict(camera_id: int, date: str, start_time: str, duration: int, current_id: int = None, user: dict = Depends(get_current_user)):
    conflict = advanced_repo.check_booking_conflict(camera_id, date, start_time, duration, current_id)
    return ApiResponse(ok=True, data={"has_conflict": conflict})

# ══════════════ STUDIO TEAM ══════════════
@router.get("/studio/team", response_model=ApiResponse, summary="List team members", tags=["Studio Team"])
def list_team(status: str = None, user: dict = Depends(get_current_user)):
    return ApiResponse(ok=True, data=advanced_repo.list_team_members(status))

@router.post("/studio/team", response_model=ApiResponse, summary="Create team member", tags=["Studio Team"])
def create_team(payload: TeamMemberCreate, user: dict = Depends(require_role(["owner", "manager"]))):
    m_id = advanced_repo.create_team_member(payload.model_dump())
    return ApiResponse(ok=True, data=advanced_repo.get_team_member(m_id))

@router.put("/studio/team/{m_id}", response_model=ApiResponse, summary="Update team member", tags=["Studio Team"])
def update_team(m_id: int, payload: TeamMemberUpdate, user: dict = Depends(require_role(["owner", "manager"]))):
    advanced_repo.update_team_member(m_id, payload.model_dump(exclude_unset=True))
    return ApiResponse(ok=True, data=advanced_repo.get_team_member(m_id))

# ══════════════ STUDIO PORTFOLIO ══════════════
@router.get("/studio/portfolio", response_model=ApiResponse, summary="List portfolio items", tags=["Studio Portfolio"])
def list_port(category: str = None, user: dict = Depends(get_current_user)):
    return ApiResponse(ok=True, data=advanced_repo.list_portfolio(category))

@router.post("/studio/portfolio", response_model=ApiResponse, summary="Create portfolio item", tags=["Studio Portfolio"])
def create_port(payload: PortfolioCreate, user: dict = Depends(require_role(["manager", "owner"]))):
    p_id = advanced_repo.create_portfolio_item(payload.model_dump())
    return ApiResponse(ok=True, data={"id": p_id})

@router.delete("/studio/portfolio/{p_id}", response_model=ApiResponse, summary="Delete portfolio item", tags=["Studio Portfolio"])
def delete_port(p_id: int, user: dict = Depends(require_role(["manager", "owner"]))):
    advanced_repo.delete_portfolio_item(p_id)
    return ApiResponse(ok=True, data={"message": "Portfolio item deleted"})

@router.get("/studio/stats", response_model=ApiResponse, summary="Get studio dashboard stats", tags=["Studio Pro (New 🚀)"])
def get_studio_stats(user: dict = Depends(get_current_user)):
    return ApiResponse(ok=True, data=advanced_repo.calculate_studio_stats())

@router.get("/studio/settings", response_model=ApiResponse, summary="Get studio specific settings", tags=["Studio Pro (New 🚀)"])
def get_studio_settings():
    return ApiResponse(ok=True, data=advanced_repo.get_studio_settings())

@router.put("/studio/settings", response_model=ApiResponse, summary="Update studio settings", tags=["Studio Pro (New 🚀)"])
def update_studio_settings(payload: dict, user: dict = Depends(require_role(["owner"]))):
    advanced_repo.update_studio_settings(payload)
    return ApiResponse(ok=True, data={"message": "Studio settings updated"})


# --- LOYALTY TIERS ---
@router.get("/loyalty/tiers", response_model=ApiResponse, summary="List loyalty tiers", tags=["Loyalty"])
def list_loyalty_tiers(user: dict = Depends(require_role(["owner", "manager"]))):
    return ApiResponse(ok=True, data=advanced_repo.list_loyalty_tiers())

@router.post("/loyalty/tiers", response_model=ApiResponse, summary="Create loyalty tier", tags=["Loyalty"])
def create_loyalty_tier(payload: LoyaltyTierCreate, user: dict = Depends(require_role(["owner"]))):
    tier_id = advanced_repo.create_loyalty_tier(payload.model_dump())
    return ApiResponse(ok=True, data={"id": tier_id})

@router.put("/loyalty/tiers/{tier_id}", response_model=ApiResponse, summary="Update loyalty tier", tags=["Loyalty"])
def update_loyalty_tier(tier_id: int, payload: LoyaltyTierUpdate, user: dict = Depends(require_role(["owner"]))):
    advanced_repo.update_loyalty_tier(tier_id, payload.model_dump(exclude_unset=True))
    return ApiResponse(ok=True, data={"message": "Tier updated"})

@router.delete("/loyalty/tiers/{tier_id}", response_model=ApiResponse, summary="Delete loyalty tier", tags=["Loyalty"])
def delete_loyalty_tier(tier_id: int, user: dict = Depends(require_role(["owner"]))):
    advanced_repo.delete_loyalty_tier(tier_id)
    return ApiResponse(ok=True, data={"message": "Tier deleted"})

# --- LOYALTY SETTINGS ---
@router.get("/loyalty/settings", response_model=ApiResponse, summary="Get loyalty settings", tags=["Loyalty"])
def get_loyalty_settings():
    return ApiResponse(ok=True, data=advanced_repo.get_loyalty_settings())

@router.put("/loyalty/settings", response_model=ApiResponse, summary="Update loyalty settings", tags=["Loyalty"])
def update_loyalty_settings(payload: LoyaltySettingsUpdate, user: dict = Depends(require_role(["owner"]))):
    advanced_repo.update_loyalty_settings(payload.model_dump())
    return ApiResponse(ok=True, data={"message": "Loyalty settings updated"})
