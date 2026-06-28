import { apiRequest } from "./client";

export type PriceSuggestionRow = {
  product_id?: number;
  product_name?: string;
  sku?: string;
  category_id?: number | null;
  current_price?: number;
  suggested_price?: number;
  current_cost?: number;
  current_margin_pct?: number;
  suggested_margin_pct?: number;
  reason?: string;
};

export function getPriceSuggestions(token: string) {
  return apiRequest<PriceSuggestionRow[]>("/price-advisory/suggestions", { token });
}

export function getOptimizationSuggestions(token: string) {
  return apiRequest<PriceSuggestionRow[]>("/price-advisory/optimization", { token });
}

export function applyPriceSuggestions(token: string, suggestions: PriceSuggestionRow[]) {
  return apiRequest<{ message: string }>("/price-advisory/apply", {
    method: "POST",
    token,
    body: suggestions
  });
}

export function createPricingRule(
  token: string,
  payload: {
    category_id?: number;
    min_cost?: number;
    max_cost?: number;
    target_margin_pct: number;
    notes?: string;
  }
) {
  return apiRequest<{ id: number }>("/price-advisory/rules", {
    method: "POST",
    token,
    body: payload
  });
}
