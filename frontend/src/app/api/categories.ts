import { apiRequest } from "./client";

export type CategoryRow = {
  id: number;
  name: string;
  color?: string;
  icon?: string;
  description?: string;
  default_margin_pct?: number;
};

export type CreateCategoryPayload = {
  name: string;
  color?: string;
  icon?: string;
  description?: string;
  default_margin_pct?: number;
};

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;

export function getCategories(token: string) {
  return apiRequest<CategoryRow[]>("/categories", { token });
}

export function createCategory(token: string, payload: CreateCategoryPayload) {
  return apiRequest<CategoryRow>("/categories", {
    method: "POST",
    token,
    body: payload
  });
}

export function updateCategory(token: string, categoryId: number, payload: UpdateCategoryPayload) {
  return apiRequest<CategoryRow>(`/categories/${categoryId}`, {
    method: "PUT",
    token,
    body: payload
  });
}
