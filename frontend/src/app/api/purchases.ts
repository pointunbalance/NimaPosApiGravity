import { apiRequest } from "./client";
import type { PaginatedItems } from "./products";

export type PurchaseRow = {
  id: number;
  supplier_id: number;
  supplier_name?: string;
  date?: string;
  total_amount?: number;
  invoice_number?: string;
  notes?: string;
  is_void?: boolean | number;
};

export type CreatePurchasePayload = {
  supplier_id: number;
  supplier_name?: string;
  date: string;
  subtotal: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount: number;
  invoice_number?: string;
  notes?: string;
};

export function getPurchases(token: string) {
  return apiRequest<PaginatedItems<PurchaseRow>>("/suppliers/1/purchases?limit=12", { token });
}

export function getPurchasesBySupplier(token: string, supplierId: number) {
  return apiRequest<PaginatedItems<PurchaseRow>>(`/suppliers/${supplierId}/purchases?limit=12`, { token });
}

export function createPurchase(token: string, payload: CreatePurchasePayload) {
  return apiRequest<PurchaseRow>("/purchases", {
    method: "POST",
    token,
    body: {
      items_json: "[]",
      attachment: "",
      update_sale_prices: false,
      currency_id: 1,
      exchange_rate: 1,
      ...payload
    }
  });
}
