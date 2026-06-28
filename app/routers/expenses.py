"""Expenses router."""
from fastapi import APIRouter, Depends, HTTPException, Query
from app.models.expense import ExpenseCreate, ExpenseUpdate
from app.models.common import ApiResponse
from app.repositories import expense_repo
from app.middleware.auth_middleware import get_current_user, require_role
from app.utils.helpers import paginate, pagination_meta

router = APIRouter(prefix="/expenses", tags=["Expenses"])

@router.get("", response_model=ApiResponse, summary="List expenses")
def list_expenses(
    date_from: str = None,
    date_to: str = None,
    category: str = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    user: dict = Depends(get_current_user)
):
    offset, limit, page = paginate(page, limit)
    items, total = expense_repo.get_all(date_from, date_to, category, offset, limit)
    return ApiResponse(ok=True, data={"items": items, "pagination": pagination_meta(total, page, limit)})

@router.get("/categories/list", response_model=ApiResponse, summary="List expense categories")
def expense_categories(user: dict = Depends(require_role(["manager", "owner"]))):
    data = expense_repo.list_categories()
    return ApiResponse(ok=True, data=data)


@router.get("/summary/totals", response_model=ApiResponse, summary="Expense summary by category")
def expense_summary(date_from: str = None, date_to: str = None, user: dict = Depends(require_role(["manager", "owner"]))):
    data = expense_repo.get_summary(date_from, date_to)
    return ApiResponse(ok=True, data=data)


@router.get("/{e_id}", response_model=ApiResponse, summary="Get expense")
def get_expense(e_id: int, user: dict = Depends(require_role(["manager", "owner"]))):
    e = expense_repo.get_by_id(e_id)
    if not e: raise HTTPException(404, "Expense not found")
    return ApiResponse(ok=True, data=e)

@router.post("", response_model=ApiResponse, summary="Create expense")
def create_expense(payload: ExpenseCreate, user: dict = Depends(require_role(["manager", "owner"]))):
    e_id = expense_repo.create(payload.model_dump())
    return ApiResponse(ok=True, data=expense_repo.get_by_id(e_id))

@router.put("/{e_id}", response_model=ApiResponse, summary="Update expense")
def update_expense(e_id: int, payload: ExpenseUpdate, user: dict = Depends(require_role(["manager", "owner"]))):
    if not expense_repo.get_by_id(e_id): raise HTTPException(404, "Expense not found")
    expense_repo.update(e_id, payload.model_dump(exclude_unset=True))
    return ApiResponse(ok=True, data=expense_repo.get_by_id(e_id))

@router.delete("/{e_id}", response_model=ApiResponse, summary="Delete expense")
def delete_expense(e_id: int, user: dict = Depends(require_role(["owner"]))):
    if not expense_repo.get_by_id(e_id): raise HTTPException(404, "Expense not found")
    expense_repo.delete(e_id)
    return ApiResponse(ok=True, data={"message": "Expense deleted"})

