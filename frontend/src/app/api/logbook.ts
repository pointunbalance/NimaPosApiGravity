import { apiRawRequest } from "./client";

export type LogRow = {
  id: number;
  type?: string | null;
  action: string;
  details?: string | null;
  user_name?: string | null;
  amount?: number | null;
  reference_id?: number | null;
  status?: string | null;
  created_at?: string | null;
};

export type LogStats = {
  total_logs?: number;
  income_total?: number;
  expense_total?: number;
  by_type?: Array<{ type: string; count: number }>;
};

export function getLogs(
  token: string,
  filters?: { type?: string; status?: string; search?: string; page?: number; limit?: number }
) {
  const params = new URLSearchParams();
  if (filters?.type) params.set("type", filters.type);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.limit) params.set("limit", String(filters.limit));
  const query = params.toString();
  return apiRawRequest<{ ok: boolean; data: LogRow[]; meta?: unknown }>(`/logs${query ? `?${query}` : ""}`, { token });
}

export function createLog(
  token: string,
  payload: { type: string; action: string; details?: string; user_name?: string; amount?: number; reference_id?: number; status?: string }
) {
  return apiRawRequest<{ ok: boolean; data: { id: number } }>("/logs", {
    method: "POST",
    token,
    body: payload
  });
}

export function getLogStats(token: string) {
  return apiRawRequest<{ ok: boolean; data: LogStats }>("/logs/stats", { token });
}
