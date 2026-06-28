import { apiRequest } from "./client";
import type { PaginatedItems } from "./products";

export type ReturnRow = {
  id: number;
  original_invoice_id: number;
  customer_id?: number | null;
  refund_method?: string;
  refund_amount?: number;
  created_at?: string;
  notes?: string;
};

export type EligibleReturnItem = {
  product_id: number;
  sku: string;
  name: string;
  sold_qty: number;
  already_returned: number;
  available_qty: number;
  unit_price: number;
};

export type CreateReturnPayload = {
  invoice_id: number;
  items: Array<{
    product_id: number;
    qty: number;
  }>;
  refund_method: string;
  notes?: string;
};

export type CreateReturnResult = {
  success: boolean;
  return_id: number;
  refund_amount: number;
};

export function getReturns(token: string) {
  return apiRequest<PaginatedItems<ReturnRow>>("/returns?limit=12", { token });
}

export function getEligibleReturnItems(token: string, invoiceId: number) {
  return apiRequest<EligibleReturnItem[]>(`/returns/invoice/${invoiceId}/eligible`, { token });
}

export function createReturn(token: string, payload: CreateReturnPayload) {
  return apiRequest<CreateReturnResult>("/returns", {
    method: "POST",
    token,
    body: payload
  });
}
