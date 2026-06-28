import { apiRawRequest } from "./client";

export type TableResourceRow = {
  id?: number;
  table_no: string;
  capacity: number;
  zone?: string | null;
  status: string;
  is_active: number;
};

export type TableReservationRow = {
  id?: number;
  table_id: number;
  customer_name: string;
  customer_phone?: string | null;
  party_size: number;
  start_at: string;
  end_at: string;
  status: string;
  notes?: string | null;
};

export type KitchenTicketItemRow = {
  id?: number;
  ticket_id?: number;
  product_id?: number | null;
  item_name: string;
  qty: number;
  status: string;
  notes?: string | null;
};

export type KitchenTicketRow = {
  id?: number;
  ticket_no: string;
  branch_id: number;
  source_type: string;
  source_ref?: string | null;
  customer_name?: string | null;
  priority: string;
  status: string;
  items: KitchenTicketItemRow[];
};

export function getTables(token: string, branchId = 1) {
  return apiRawRequest<TableResourceRow[]>(`/hospitality/tables?branch_id=${branchId}`, { token });
}

export function createTable(
  token: string,
  payload: {
    table_no: string;
    capacity?: number;
    zone?: string;
    status?: string;
    is_active?: number;
  },
  branchId = 1
) {
  return apiRawRequest<TableResourceRow>(`/hospitality/tables?branch_id=${branchId}`, {
    method: "POST",
    token,
    body: payload
  });
}

export function getReservations(token: string, branchId = 1) {
  return apiRawRequest<TableReservationRow[]>(`/hospitality/reservations?branch_id=${branchId}`, { token });
}

export function createReservation(
  token: string,
  payload: {
    table_id: number;
    customer_name: string;
    customer_phone?: string;
    party_size?: number;
    start_at: string;
    end_at: string;
    status?: string;
    notes?: string;
  },
  branchId = 1
) {
  return apiRawRequest<TableReservationRow>(`/hospitality/reservations?branch_id=${branchId}`, {
    method: "POST",
    token,
    body: payload
  });
}

export function getKitchenTickets(token: string, branchId = 1, status?: string) {
  const query = status
    ? `?branch_id=${branchId}&status=${encodeURIComponent(status)}`
    : `?branch_id=${branchId}`;
  return apiRawRequest<KitchenTicketRow[]>(`/hospitality/kitchen/tickets${query}`, { token });
}

export function createKitchenTicket(
  token: string,
  payload: {
    ticket_no: string;
    branch_id?: number;
    source_type?: string;
    source_ref?: string;
    customer_name?: string;
    priority?: string;
    status?: string;
    items: Array<{
      product_id?: number;
      item_name: string;
      qty: number;
      status?: string;
      notes?: string;
    }>;
  }
) {
  return apiRawRequest<KitchenTicketRow>(`/hospitality/kitchen/tickets`, {
    method: "POST",
    token,
    body: payload
  });
}

export function updateKitchenTicketStatus(token: string, ticketId: number, status: string) {
  return apiRawRequest<{ status: string }>(
    `/hospitality/kitchen/tickets/${ticketId}/status?status=${encodeURIComponent(status)}`,
    { method: "PATCH", token }
  );
}

export function updateKitchenItemStatus(token: string, itemId: number, status: string) {
  return apiRawRequest<{ status: string }>(
    `/hospitality/kitchen/items/${itemId}/status?status=${encodeURIComponent(status)}`,
    { method: "PATCH", token }
  );
}
