import { apiRequest } from "./client";
import type { PaginatedItems } from "./products";

export type QuotationRow = {
  id: number;
  customer_name: string;
  status?: string;
  total_amount?: number;
  expiry_date?: string;
  notes?: string;
};

export type CreateQuotationPayload = {
  customer_name: string;
  total_amount: number;
  expiry_date?: string;
  notes?: string;
};

export function getQuotations(token: string) {
  return apiRequest<PaginatedItems<QuotationRow>>("/quotations?limit=12", { token });
}

export function createQuotation(token: string, payload: CreateQuotationPayload, createdBy: string) {
  return apiRequest<QuotationRow>("/quotations", {
    method: "POST",
    token,
    body: {
      customer_id: null,
      items_json: "[]",
      subtotal: payload.total_amount,
      discount_amount: 0,
      tax_amount: 0,
      created_by: createdBy,
      ...payload
    }
  });
}
