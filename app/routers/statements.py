from fastapi import APIRouter, Depends, HTTPException, Query
from app.models.statement import StatementOfAccountOut
from app.models.common import ApiResponse
from app.repositories import statement_repo
from app.middleware.auth_middleware import get_current_user, require_role

router = APIRouter(prefix="/statements", tags=["Accounting / Statements"])

@router.get("/{entity_type}/{entity_id}", response_model=ApiResponse)
def get_statement(
    entity_type: str, 
    entity_id: int,
    date_from: str = Query(None),
    date_to: str = Query(None),
    user: dict = Depends(get_current_user)
):
    """Get a unified statement of account for a customer or supplier."""
    if entity_type not in ["customer", "supplier"]:
        raise HTTPException(status_code=400, detail="Invalid entity type. Use 'customer' or 'supplier'.")
        
    statement = statement_repo.get_entity_statement(entity_id, entity_type, date_from, date_to)
    if not statement:
        raise HTTPException(status_code=404, detail=f"{entity_type.capitalize()} not found")
        
    return ApiResponse(ok=True, data=statement)
