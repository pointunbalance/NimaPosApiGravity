import { apiRequest } from "./client";

export type QCPendingRow = {
  product_id?: number;
  product_name?: string;
  batch_id?: number | null;
  batch_number?: string | null;
  purchase_id?: number | null;
  status?: string;
};

export type QCInspectionRow = {
  id: number;
  product_id?: number;
  product_name?: string;
  batch_id?: number | null;
  inspection_date?: string | null;
  status: string;
  score?: number;
  notes?: string | null;
};

export type QCDefectRow = {
  defect_type: string;
  quantity: number;
  description?: string | null;
};

export function getPendingInspections(token: string) {
  return apiRequest<QCPendingRow[]>("/qc/pending", { token });
}

export function getInspectionHistory(token: string, productId?: number) {
  const query = productId ? `?product_id=${productId}` : "";
  return apiRequest<QCInspectionRow[]>(`/qc/history${query}`, { token });
}

export function getInspectionDefects(token: string, inspectionId: number) {
  return apiRequest<QCDefectRow[]>(`/qc/inspections/${inspectionId}/defects`, { token });
}

export function createInspection(
  token: string,
  payload: {
    purchase_id?: number;
    product_id: number;
    batch_id?: number;
    inspector_id?: number;
    inspection_date?: string;
    status: string;
    score?: number;
    notes?: string;
    defects?: QCDefectRow[];
  }
) {
  return apiRequest<{ inspection_id: number; message: string }>("/qc/inspect", {
    method: "POST",
    token,
    body: payload
  });
}

export function createQcRule(
  token: string,
  payload: {
    category_id?: number;
    product_id?: number;
    min_score_required: number;
    is_mandatory: boolean;
  }
) {
  return apiRequest<{ message: string }>("/qc/rules", {
    method: "POST",
    token,
    body: payload
  });
}
