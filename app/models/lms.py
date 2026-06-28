from pydantic import BaseModel
from typing import Optional, List

class LMSArticleCreate(BaseModel):
    title: str
    category: str = "SOP"
    content_markdown: str
    author_id: Optional[int] = None

class LMSArticleUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    content_markdown: Optional[str] = None

class TrainingLogCreate(BaseModel):
    user_id: int
    article_id: int
    score: Optional[int] = None

class ArticleRead(BaseModel):
    id: int
    title: str
    category: str
    content_markdown: str
    author_id: Optional[int]
    created_at: str
    updated_at: str
