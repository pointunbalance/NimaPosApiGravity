import { apiRawRequest } from "./client";

export type MaintenanceOrderRow = {
  id: number;
  order_number?: string | null;
  customer_name: string;
  customer_phone?: string | null;
  device_type: string;
  device_brand?: string | null;
  device_model?: string | null;
  serial_number?: string | null;
  problem_description: string;
  diagnosis?: string | null;
  status: string;
  priority: string;
  estimated_cost?: number;
  final_cost?: number;
  paid_amount?: number;
  technician?: string | null;
  warranty_days?: number;
  notes?: string | null;
  received_at?: string;
  completed_at?: string | null;
  delivered_at?: string | null;
};

export type MaintenanceCreatePayload = {
  customer_name: string;
  customer_phone?: string;
  device_type: string;
  device_brand?: string;
  device_model?: string;
  serial_number?: string;
  problem_description: string;
  priority?: string;
  estimated_cost?: number;
  notes?: string;
  branch_id?: number;
};

export type MaintenanceUpdatePayload = {
  diagnosis?: string;
  status?: string;
  final_cost?: number;
  paid_amount?: number;
  technician?: string;
  notes?: string;
};

export type MaintenanceHistoryRow = {
  id: number;
  order_id: number;
  old_status?: string | null;
  new_status?: string | null;
  notes?: string | null;
  changed_by?: string | null;
  changed_at: string;
};

export function getMaintenanceOrders(token: string, status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiRawRequest<MaintenanceOrderRow[]>(`/maintenance/${query}`, { token });
}

export function createMaintenanceOrder(token: string, payload: MaintenanceCreatePayload) {
  return apiRawRequest<{ id: number }>("/maintenance/", {
    method: "POST",
    token,
    body: payload
  });
}

export function getMaintenanceOrder(token: string, id: number) {
  return apiRawRequest<MaintenanceOrderRow>(`/maintenance/${id}`, { token });
}

export function updateMaintenanceOrder(token: string, id: number, payload: MaintenanceUpdatePayload) {
  return apiRawRequest<{ message: string }>(`/maintenance/${id}`, {
    method: "PUT",
    token,
    body: payload
  });
}

export function getMaintenanceHistory(token: string, id: number) {
  return apiRawRequest<MaintenanceHistoryRow[]>(`/maintenance/${id}/history`, { token });
}
