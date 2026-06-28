import { apiRequest } from "./client";

export type LmsArticleRow = {
  id: number;
  title: string;
  category: string;
  content_markdown: string;
  author_id?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type TrainingLogRow = {
  id?: number;
  user_id?: number;
  article_id?: number;
  article_title?: string | null;
  category?: string | null;
  completed_at?: string | null;
  score?: number | null;
};

export function getLmsArticles(token: string, category?: string) {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  return apiRequest<LmsArticleRow[]>(`/lms/articles${query}`, { token });
}

export function getLmsArticle(token: string, articleId: number) {
  return apiRequest<LmsArticleRow>(`/lms/articles/${articleId}`, { token });
}

export function createLmsArticle(
  token: string,
  payload: {
    title: string;
    category: string;
    content_markdown: string;
    author_id?: number;
  }
) {
  return apiRequest<{ id: number; message: string }>(`/lms/articles`, {
    method: "POST",
    token,
    body: payload
  });
}

export function logTrainingCompletion(
  token: string,
  payload: {
    user_id: number;
    article_id: number;
    score?: number;
  }
) {
  return apiRequest<{ message: string }>(`/lms/complete`, {
    method: "POST",
    token,
    body: payload
  });
}

export function getMyTraining(token: string) {
  return apiRequest<TrainingLogRow[]>(`/lms/my-training`, { token });
}
