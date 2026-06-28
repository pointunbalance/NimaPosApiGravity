"""NimaPOS REST API — FastAPI application factory."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.openapi.utils import get_openapi

from app.config import API_PREFIX, APP_NAME, API_VERSION, BUILD_DATE, CORS_ORIGINS
from app.database.manager import initialize_db
from app.database.connection import get_connection, close_connection
from app.utils.ui_templates import get_swagger_ui_html, get_scalar_ui_html
from app.middleware.rate_limit_middleware import RateLimitMiddleware
from app.middleware.license_middleware import LicenseMiddleware

# --- Import all routers ---
from app.routers import (
    auth, products, invoices, customers, suppliers,
    inventory, returns, reports, dashboard, settings,
    users, branches, z_reports, export, backup,
    categories, quotations, expenses, purchases,
    extended, advanced, accounting,
    orders, payroll, logbook, capital, printing,
    attendance, inventory_count, branch_transfers, maintenance, recipes, delivery, purchase_orders,
    supplier_returns, return_reasons, geography, vouchers, permissions, credit_clearing, statements,
    master_data, safes, services, cheques,
    hospitality, rentals_pro, online, notifications, arap,
    held_orders, customer_payments, search, manufacturing, price_advisory, economic_intel, asset_lifecycle_pro, qc, fleet, crm,
    projects, hr, subscriptions, mrp, omnichannel, treasury, lms, promotions, hardware, portal, webhooks
)
from app.models.activation import ActivationRequest
from app.repositories import activation_repo

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

from app.utils.time_keeper import TimeKeeper
from app.database.backup_service import AutoBackupService

@asynccontextmanager
async def lifespan(application: FastAPI):
    """Application lifespan management."""
    logger.info("🚀 %s v%s starting...", APP_NAME, API_VERSION)
    initialize_db()
    
    # Initialize anti-tamper logic & start backups
    TimeKeeper.initialize(get_connection())
    AutoBackupService.start()
    
    logger.info("✅ Database & Background Services initialized.")
    yield
    
    # Graceful shutdown
    AutoBackupService.stop()
    close_connection()
    logger.info("🛑 %s shutdown complete.", APP_NAME)

from app.utils import strings

def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    application = FastAPI(
        title=strings.API_TITLE,
        description=strings.API_DESCRIPTION,
        version=API_VERSION,
        openapi_tags=strings.TAGS_METADATA,
        docs_url=None, 
        redoc_url="/redoc",
        lifespan=lifespan
    )

    @application.get("/docs", include_in_schema=False)
    async def custom_swagger_ui_html():
        return HTMLResponse(get_swagger_ui_html(application.title, "/openapi.json"))

    @application.get("/scalar", include_in_schema=False)
    async def scalar_docs():
        """Modern Scalar documentation with advanced search."""
        return HTMLResponse(get_scalar_ui_html(application.title, "/openapi.json"))

    # --- Middleware (executed in reverse order: last added = outermost) ---
    # CORS first (innermost, handles preflight)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
        allow_headers=["Authorization", "Content-Type"],
    )
    # Rate limiting second
    application.add_middleware(RateLimitMiddleware, limit=30, window=60)
    # License check outermost - reject unlicensed before any other processing
    application.add_middleware(LicenseMiddleware)

    @application.exception_handler(Exception)
    async def global_handler(request: Request, exc: Exception):
        logger.error("Unhandled error: %s", str(exc), exc_info=True)
        return JSONResponse(status_code=500, content={
            "error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred."},
        })

    # --- Mount Routers ---
    router_list = [
        auth, products, categories, invoices, quotations, customers, suppliers,
        inventory, returns, reports, dashboard, settings,
        users, branches, z_reports, export, backup,
        expenses, purchases, extended, advanced, accounting,
        orders, payroll, logbook, capital, printing,
        attendance, inventory_count, branch_transfers, maintenance, recipes, delivery, purchase_orders,
        supplier_returns, return_reasons, geography, vouchers, permissions, credit_clearing, statements,
        master_data, safes, services, hospitality, rentals_pro, online, notifications, arap,
        held_orders, customer_payments, search, cheques, manufacturing, price_advisory, economic_intel, asset_lifecycle_pro, qc, fleet, crm, projects, hr, subscriptions, mrp, omnichannel, treasury, lms, promotions, hardware, portal, webhooks
    ]
    for r in router_list:
        application.include_router(r.router, prefix=API_PREFIX)

    @application.get(f"{API_PREFIX}/system/health", tags=["System & Settings"], summary="Health check")
    def health():
        try:
            conn = get_connection()
            conn.execute("SELECT 1")
            return {"ok": True, "data": {"status": "healthy", "database": "connected"}}
        except Exception as e:
            logger.error("Health check failed: %s", str(e))
            return JSONResponse(status_code=503, content={"ok": False, "error": {"message": "Service unhealthy"}})

    @application.get(f"{API_PREFIX}/system/version", tags=["System & Settings"], summary="API version")
    def version():
        return {"ok": True, "data": {
            "app": APP_NAME, "version": API_VERSION, "build_date": BUILD_DATE,
        }}

    @application.get(f"{API_PREFIX}/system/activation-status", tags=["System & Settings"], summary="Check System Activation & Hardware ID")
    def get_activation_status():
        try:
            status = activation_repo.get_activation_status()
            return {"ok": True, "data": status}
        except Exception as e:
            logger.error(f"Activation check failed: {e}")
            return {"ok": False, "error": {"message": str(e)}}

    @application.post(f"{API_PREFIX}/system/activate", tags=["System & Settings"], summary="Submit Activation License Key")
    def activate_system_license(data: ActivationRequest):
        try:
            success = activation_repo.activate_system(data.license_key)
            if success:
                return {"ok": True, "data": {"message": "System activated successfully."}}
            return {"ok": False, "data": {"message": "Activation failed."}}
        except Exception as e:
            return {"ok": False, "error": {"message": str(e)}}

    logger.info("✅ All routers mounted under %s", API_PREFIX)
    return application

app = create_app()
