"""Products router — CRUD, Search, Barcode, Categories."""
from fastapi import APIRouter, Depends, HTTPException, Query
from app.models.product import ProductCreate, ProductUpdate, ProductOut
from app.models.common import ApiResponse
from app.repositories import product_repo
from app.middleware.auth_middleware import get_current_user, require_role
from app.utils.helpers import paginate, pagination_meta
from app.utils.barcode_utils import parse_scale_barcode
from app.config import LOW_STOCK_THRESHOLD

router = APIRouter(prefix="/products", tags=["Inventory"])


@router.get("", response_model=ApiResponse, summary="List products")
def list_products(
    search: str = None,
    category: str = None,
    brand_id: int = Query(None),
    origin_id: int = Query(None),
    location_id: int = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    user: dict = Depends(get_current_user),
):
    offset, limit, page = paginate(page, limit)
    items, total = product_repo.get_all_active(
        search=search, category=category, brand_id=brand_id, 
        origin_id=origin_id, location_id=location_id,
        offset=offset, limit=limit
    )
    return ApiResponse(ok=True, data={
        "items": items,
        "pagination": pagination_meta(total, page, limit),
    })


@router.get("/duplicates", response_model=ApiResponse, summary="Identify duplicate barcodes", tags=["Inventory"])
def find_duplicates(user: dict = Depends(require_role(["manager", "owner"]))):
    duplicates = product_repo.find_duplicate_barcodes()
    return ApiResponse(ok=True, data=duplicates)


@router.post("/bulk-update", response_model=ApiResponse, summary="Mass update products (Bulk)", tags=["Inventory"])
def bulk_update(
    product_ids: list[int],
    payload: dict, # Dynamic payload for bulk updates
    user: dict = Depends(require_role(["manager", "owner"])),
):
    if not product_ids:
        raise HTTPException(status_code=400, detail="No product IDs provided")
    if len(product_ids) > 500:
        raise HTTPException(status_code=400, detail="Too many products (max 500)")
    allowed_fields = {"category", "brand_id", "origin_id", "location_id", "is_active", "price", "cost_price"}
    invalid_fields = set(payload.keys()) - allowed_fields
    if invalid_fields:
        raise HTTPException(status_code=400, detail=f"Invalid fields: {', '.join(invalid_fields)}")
    try:
        product_repo.bulk_update(product_ids, payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bulk update failed: {str(e)}")
    return ApiResponse(ok=True, data={"message": f"Successfully updated {len(product_ids)} products"})


@router.get("/categories", response_model=ApiResponse, summary="List categories")
def list_categories(user: dict = Depends(get_current_user)):
    categories = product_repo.get_categories()
    return ApiResponse(ok=True, data=categories)


@router.get("/low-stock", response_model=ApiResponse, summary="Low stock products")
def low_stock(
    threshold: int = Query(LOW_STOCK_THRESHOLD, ge=1),
    limit: int = Query(50, ge=1, le=200),
    user: dict = Depends(get_current_user),
):
    items = product_repo.get_low_stock(threshold, limit)
    return ApiResponse(ok=True, data=items)


@router.get("/barcode/{barcode}", response_model=ApiResponse, summary="Lookup by barcode")
def by_barcode(barcode: str, user: dict = Depends(get_current_user)):
    product = product_repo.get_by_barcode(barcode)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ApiResponse(ok=True, data=product)


@router.get("/{product_id}", response_model=ApiResponse, summary="Get product by ID")
def get_product(product_id: int, user: dict = Depends(get_current_user)):
    product = product_repo.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ApiResponse(ok=True, data=product)


@router.post("", response_model=ApiResponse, summary="Create product")
def create_product(
    payload: ProductCreate,
    user: dict = Depends(require_role(["manager", "owner"])),
):
    existing = product_repo.get_by_sku(payload.sku)
    if existing:
        raise HTTPException(status_code=409, detail=f"SKU '{payload.sku}' already exists")
    product_id = product_repo.create(payload.model_dump())
    product = product_repo.get_by_id(product_id)
    return ApiResponse(ok=True, data=product)


@router.put("/{product_id}", response_model=ApiResponse, summary="Update product")
def update_product(
    product_id: int,
    payload: ProductUpdate,
    user: dict = Depends(require_role(["manager", "owner"])),
):
    existing = product_repo.get_by_id(product_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    product_repo.update(product_id, payload.model_dump(exclude_unset=True))
    return ApiResponse(ok=True, data=product_repo.get_by_id(product_id))


@router.delete("/{product_id}", response_model=ApiResponse, summary="Delete product (soft)")
def delete_product(
    product_id: int,
    user: dict = Depends(require_role(["owner"])),
):
    existing = product_repo.get_by_id(product_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    product_repo.soft_delete(product_id)
    return ApiResponse(ok=True, data={"message": "Product deleted"})


@router.post("/deactivate-zero-stock", response_model=ApiResponse,
             summary="Bulk deactivate all products with 0 or negative stock",
             tags=["Inventory"])
def deactivate_zero_stock(
    user: dict = Depends(require_role(["owner"])),
):
    count = product_repo.deactivate_zero_stock()
    return ApiResponse(ok=True, data={"message": f"Deactivated {count} zero-stock products", "count": count})


@router.post("/parse-scale-barcode", response_model=ApiResponse,
             summary="Parse a weighted barcode from a scale (extract product SKU + weight)",
             tags=["Inventory"])
def parse_barcode_scale(
    barcode: str = Query(..., description="The full barcode string from the scale"),
    prefix: str = Query("27", description="Scale barcode prefix (default: 27)"),
    user: dict = Depends(get_current_user),
):
    result = parse_scale_barcode(barcode, prefix)
    if not result:
        return ApiResponse(ok=False, error="Not a valid scale barcode")
    # Try to find the product by SKU
    product = product_repo.get_by_sku(result["sku"])
    if product:
        result["product"] = product
    return ApiResponse(ok=True, data=result)


@router.post("/bulk-migrate", response_model=ApiResponse, summary="Mass move products to new category/brand", tags=["Inventory"])
def bulk_migrate(
    product_ids: list[int],
    payload: dict, # e.g. {"new_category": "Electronics"}
    user: dict = Depends(require_role(["manager", "owner"])),
):
    if not product_ids:
        raise HTTPException(status_code=400, detail="No product IDs provided")
    if len(product_ids) > 500:
        raise HTTPException(status_code=400, detail="Too many products (max 500)")
    allowed_fields = {"new_category", "new_brand_id", "category", "brand_id"}
    invalid_fields = set(payload.keys()) - allowed_fields
    if invalid_fields:
        raise HTTPException(status_code=400, detail=f"Invalid fields: {', '.join(invalid_fields)}")
    try:
        product_repo.bulk_update(product_ids, payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bulk migration failed: {str(e)}")
    return ApiResponse(ok=True, data={"message": f"Successfully migrated {len(product_ids)} products"})


@router.get("/reports/stagnant", response_model=ApiResponse, summary="Find lagging products", tags=["Reports"])
def stagnant_report(days: int = Query(30, description="Days of inactivity"), user: dict = Depends(require_role(["manager", "owner"]))):
    data = product_repo.get_stagnant_products(days)
    return ApiResponse(ok=True, data=data)


@router.get("/{product_id}/ledger", response_model=ApiResponse, summary="Full movement history", tags=["Inventory"])
def product_ledger(product_id: int, user: dict = Depends(require_role(["manager", "owner"]))):
    data = product_repo.get_product_ledger(product_id)
    return ApiResponse(ok=True, data=data)


@router.post("/reconcile-stock", response_model=ApiResponse[dict], summary="Systematically reconcile stock", tags=["Inventory"])
def reconcile_stock(user: dict = Depends(require_role(["owner"]))):
    """Reconciles physical stock values with the stock movement ledger (Self-Healing)."""
    result = product_repo.reconcile_stock_consistency()
    # Fixed: Removed 'message' parameter which is not in ApiResponse model
    return ApiResponse(ok=True, data=result)
