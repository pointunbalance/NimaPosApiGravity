import { apiRawRequest } from "./client";

export type BranchTransferItemRow = {
  id?: number;
  transfer_id?: number;
  product_id: number;
  product_name?: string;
  requested_qty: number;
  sent_qty?: number;
  received_qty?: number;
  unit_cost: number;
};

export type BranchTransferRow = {
  id: number;
  reference?: string;
  from_warehouse_id: number;
  to_warehouse_id: number;
  status: string;
  requested_by: string;
  approved_by?: string | null;
  notes?: string | null;
  total_items?: number;
  total_qty?: number;
  created_at?: string;
  completed_at?: string | null;
  items?: BranchTransferItemRow[];
};

export type CreateBranchTransferPayload = {
  from_warehouse_id: number;
  to_warehouse_id: number;
  requested_by: string;
  notes?: string;
  items: BranchTransferItemRow[];
};

export type ProcessTransferPayload = {
  status: "sent" | "completed";
  approved_by?: string;
  sent_qty_updates?: Array<{ item_id: number; sent_qty: number }>;
  received_qty_updates?: Array<{ item_id: number; received_qty: number }>;
};

export function getBranchTransfers(token: string, warehouseId?: number) {
  const query = warehouseId ? `?warehouse_id=${warehouseId}` : "";
  return apiRawRequest<BranchTransferRow[]>(`/branch-transfers/${query}`, { token });
}

export function getBranchTransfer(token: string, id: number) {
  return apiRawRequest<BranchTransferRow>(`/branch-transfers/${id}`, { token });
}

export function createBranchTransfer(token: string, payload: CreateBranchTransferPayload) {
  return apiRawRequest<{ id: number }>("/branch-transfers/", {
    method: "POST",
    token,
    body: {
      status: "pending",
      ...payload
    }
  });
}

export function processBranchTransfer(token: string, id: number, payload: ProcessTransferPayload) {
  return apiRawRequest<{ message: string }>(`/branch-transfers/${id}/process`, {
    method: "PUT",
    token,
    body: payload
  });
}
