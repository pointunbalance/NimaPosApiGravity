import { apiRequest } from "./client";

export type SupportTicketRow = {
  id: number;
  customer_id: number;
  invoice_id?: number | null;
  subject: string;
  description: string;
  priority: string;
  category: string;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  messages?: SupportTicketMessageRow[];
};

export type SupportTicketMessageRow = {
  id: number;
  ticket_id: number;
  sender_type: string;
  sender_id: number;
  message: string;
  created_at?: string | null;
};

export function getSupportTickets(token: string, customerId?: number, status?: string) {
  const params = new URLSearchParams();
  if (customerId) params.set("customer_id", String(customerId));
  if (status) params.set("status", status);
  const query = params.toString();
  return apiRequest<SupportTicketRow[]>(`/portal/tickets${query ? `?${query}` : ""}`, { token });
}

export function createSupportTicket(
  token: string,
  payload: {
    customer_id: number;
    invoice_id?: number;
    subject: string;
    description: string;
    priority?: string;
    category?: string;
  }
) {
  return apiRequest<number>("/portal/tickets", {
    method: "POST",
    token,
    body: payload
  });
}

export function getSupportTicket(token: string, ticketId: number) {
  return apiRequest<SupportTicketRow>(`/portal/tickets/${ticketId}`, { token });
}

export function createSupportTicketMessage(
  token: string,
  payload: {
    ticket_id: number;
    sender_type: string;
    sender_id: number;
    message: string;
  }
) {
  return apiRequest<number>("/portal/tickets/messages", {
    method: "POST",
    token,
    body: payload
  });
}

export function updateSupportTicketStatus(token: string, ticketId: number, status: string) {
  return apiRequest<boolean>(`/portal/tickets/${ticketId}/status?status=${encodeURIComponent(status)}`, {
    method: "PATCH",
    token
  });
}
