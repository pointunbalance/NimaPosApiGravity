"""Export router — CSV export for products, invoices, customers."""
import csv
import io
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from app.repositories import product_repo, customer_repo, invoice_repo
from app.middleware.auth_middleware import require_role

router = APIRouter(prefix="/export", tags=["System & Settings"])


def _csv_response(rows: list[dict], filename: str):
    if not rows:
        return StreamingResponse(io.StringIO(""), media_type="text/csv",
                                 headers={"Content-Disposition": f"attachment; filename={filename}"})
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)
    output.seek(0)
    return StreamingResponse(output, media_type="text/csv",
                             headers={"Content-Disposition": f"attachment; filename={filename}"})


@router.get("/products", summary="Export products CSV")
def export_products(user: dict = Depends(require_role(["manager", "owner"]))):
    items, _ = product_repo.get_all_active(limit=10000)
    return _csv_response(items, "products.csv")


@router.get("/customers", summary="Export customers CSV")
def export_customers(user: dict = Depends(require_role(["manager", "owner"]))):
    items, _ = customer_repo.get_all_active(limit=10000)
    return _csv_response(items, "customers.csv")


@router.get("/invoices", summary="Export invoices CSV")
def export_invoices(
    date_from: str = Query(None), date_to: str = Query(None),
    user: dict = Depends(require_role(["manager", "owner"])),
):
    items, _ = invoice_repo.get_list(date_from, date_to, limit=10000)
    return _csv_response(items, "invoices.csv")
