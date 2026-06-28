import { apiRequest } from "./client";
import type { PaginatedItems } from "./products";

export type StockAdjustmentRow = {
  id: number;
  product_id: number;
  product_name?: string;
  type: string;
  quantity: number;
  reason: string;
  date: string;
  notes?: string;
  warehouse_id?: number | null;
  warehouse_name?: string;
};

export type CreateStockAdjustmentPayload = {
  product_id: number;
  product_name: string;
  type: string;
  quantity: number;
  reason: string;
  date: string;
  notes?: string;
  warehouse_id?: number;
  warehouse_name?: string;
};

export type StockAdjustmentResult = {
  id: number;
  product_id: number;
  delta: number;
};

export function getStockAdjustments(token: string) {
  return apiRequest<PaginatedItems<StockAdjustmentRow>>("/stock-adjustments?limit=12", { token });
}

export function createStockAdjustment(token: string, payload: CreateStockAdjustmentPayload) {
  return apiRequest<StockAdjustmentResult>("/stock-adjustments", {
    method: "POST",
    token,
    body: payload
  });
}
