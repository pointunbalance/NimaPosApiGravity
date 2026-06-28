import { apiRawRequest } from "./client";

export type InventoryCountItemRow = {
  id?: number;
  count_id?: number;
  product_id: number;
  product_name?: string;
  system_qty: number;
  actual_qty: number;
  variance?: number;
  unit_cost: number;
  variance_value?: number;
  notes?: string | null;
};

export type InventoryCountRow = {
  id: number;
  title: string;
  warehouse_id: number;
  status: string;
  counted_by: string;
  approved_by?: string | null;
  notes?: string | null;
  total_products?: number;
  matched?: number;
  surplus?: number;
  deficit?: number;
  total_variance_value?: number;
  started_at?: string;
  completed_at?: string | null;
  items?: InventoryCountItemRow[];
};

export type CreateInventoryCountPayload = {
  title: string;
  warehouse_id: number;
  status: string;
  counted_by: string;
  notes?: string;
  items: InventoryCountItemRow[];
};

export function getInventoryCounts(token: string) {
  return apiRawRequest<InventoryCountRow[]>("/inventory-count/", { token });
}

export function getInventoryCount(token: string, id: number) {
  return apiRawRequest<InventoryCountRow>(`/inventory-count/${id}`, { token });
}

export function createInventoryCount(token: string, payload: CreateInventoryCountPayload) {
  return apiRawRequest<{ id: number }>("/inventory-count/", {
    method: "POST",
    token,
    body: payload
  });
}

export function finalizeInventoryCount(token: string, id: number, approvedBy: string) {
  return apiRawRequest<{ message: string }>(
    `/inventory-count/${id}/finalize?approved_by=${encodeURIComponent(approvedBy)}`,
    { method: "POST", token }
  );
}
