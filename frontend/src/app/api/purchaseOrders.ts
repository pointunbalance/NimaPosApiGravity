import { apiRawRequest, apiRequest } from "./client";

export type PurchaseOrderItemRow = {
  id?: number;
  po_id?: number;
  product_id: number;
  product_name?: string;
  ordered_qty: number;
  received_qty?: number;
  unit_price: number;
  line_total?: number;
};

export type PurchaseOrderRow = {
  id: number;
  po_number?: string;
  supplier_id: number;
  supplier_name?: string;
  status: string;
  expected_date?: string | null;
  notes?: string | null;
  created_by: string;
  total_items?: number;
  subtotal?: number;
  total_amount?: number;
  received_date?: string | null;
  purchase_id?: number | null;
  approved_by?: string | null;
  created_at?: string;
  items?: PurchaseOrderItemRow[];
};

export type CreatePurchaseOrderPayload = {
  supplier_id: number;
  supplier_name?: string;
  expected_date?: string;
  notes?: string;
  created_by: string;
  items: PurchaseOrderItemRow[];
};

export function getPurchaseOrders(token: string, supplierId?: number) {
  const query = supplierId ? `?supplier_id=${supplierId}` : "";
  return apiRawRequest<PurchaseOrderRow[]>(`/purchase-orders/${query}`, { token });
}

export function getPurchaseOrder(token: string, id: number) {
  return apiRawRequest<PurchaseOrderRow>(`/purchase-orders/${id}`, { token });
}

export function createPurchaseOrder(token: string, payload: CreatePurchaseOrderPayload) {
  return apiRawRequest<{ id: number }>("/purchase-orders/", {
    method: "POST",
    token,
    body: {
      status: "draft",
      ...payload
    }
  });
}

export function convertPurchaseOrder(token: string, id: number) {
  return apiRequest<{ purchase_id: number }>(`/purchase-orders/${id}/convert`, {
    method: "POST",
    token
  });
}
