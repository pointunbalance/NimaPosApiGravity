import { apiRawRequest } from "./client";

export type NotificationRow = {
  id?: number;
  customer_id?: number | null;
  channel: string;
  recipient: string;
  subject?: string | null;
  content: string;
  status: string;
  sent_at?: string | null;
  error_message?: string | null;
};

export function getNotifications(token: string, status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiRawRequest<NotificationRow[]>(`/notifications/${query}`, { token });
}

export function sendNotification(
  token: string,
  payload: { customer_id?: number; channel: string; recipient: string; subject?: string; content: string }
) {
  return apiRawRequest<NotificationRow>("/notifications/send", {
    method: "POST",
    token,
    body: payload
  });
}

export function updateNotificationStatus(token: string, notifId: number, status: string, error?: string) {
  const query = error
    ? `?status=${encodeURIComponent(status)}&error=${encodeURIComponent(error)}`
    : `?status=${encodeURIComponent(status)}`;
  return apiRawRequest<{ status: string }>(`/notifications/${notifId}/status${query}`, {
    method: "PATCH",
    token
  });
}
