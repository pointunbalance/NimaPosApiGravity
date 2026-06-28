import { apiRequest } from "./client";

export type DeliveryAssignmentRow = {
  id: number;
  invoice_id: number;
  driver_id?: number | null;
  driver_name?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  delivery_address?: string | null;
  status: string;
  delivery_fee?: number;
  collected_amount?: number;
  is_settled?: number;
  notes?: string | null;
  branch_id?: number;
  assigned_at?: string;
  picked_at?: string | null;
  delivered_at?: string | null;
};

export type DeliveryCreatePayload = {
  invoice_id: number;
  driver_id?: number;
  driver_name?: string;
  customer_name: string;
  customer_phone?: string;
  delivery_address: string;
  delivery_fee?: number;
  collected_amount?: number;
  notes?: string;
  branch_id?: number;
};

export type DeliveryUpdatePayload = {
  driver_id?: number;
  driver_name?: string;
  status?: string;
  collected_amount?: number;
  is_settled?: number;
  picked_at?: string;
  delivered_at?: string;
  notes?: string;
};

export function getDeliveries(token: string, status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiRequest<DeliveryAssignmentRow[]>(`/delivery/${query}`, { token });
}

export function createDelivery(token: string, payload: DeliveryCreatePayload) {
  return apiRequest<{ id: number }>("/delivery/", {
    method: "POST",
    token,
    body: payload
  });
}

export function getDelivery(token: string, id: number) {
  return apiRequest<DeliveryAssignmentRow>(`/delivery/${id}`, { token });
}

export function updateDelivery(token: string, id: number, payload: DeliveryUpdatePayload) {
  return apiRequest<{ message: string }>(`/delivery/${id}`, {
    method: "PUT",
    token,
    body: payload
  });
}
