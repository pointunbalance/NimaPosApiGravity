from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
from app.models.lms import LMSArticleCreate, LMSArticleUpdate, TrainingLogCreate
from app.models.common import ApiResponse
from app.repositories import lms_repo
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/lms", tags=["LMS & Internal Wiki"])

@router.post("/articles", response_model=ApiResponse)
def create_article(article: LMSArticleCreate, current_user=Depends(get_current_user)):
    article_id = lms_repo.create_article(article)
    return ApiResponse(ok=True, data={"id": article_id, "message": "Article created"})

@router.get("/articles", response_model=ApiResponse)
def get_articles(category: Optional[str] = Query(None), current_user=Depends(get_current_user)):
    articles = lms_repo.get_articles(category)
    return ApiResponse(ok=True, data=articles)

@router.get("/articles/{article_id}", response_model=ApiResponse)
def get_article(article_id: int, current_user=Depends(get_current_user)):
    article = lms_repo.get_article(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return ApiResponse(ok=True, data=article)

@router.post("/complete", response_model=ApiResponse)
def log_completion(log: TrainingLogCreate, current_user=Depends(get_current_user)):
    return ApiResponse(ok=True, data={"message": "Training completion recorded"})

@router.get("/my-training", response_model=ApiResponse)
def get_my_training(current_user=Depends(get_current_user)):
    summary = lms_repo.get_employee_training_summary(current_user["id"])
    return ApiResponse(ok=True, data=summary)
