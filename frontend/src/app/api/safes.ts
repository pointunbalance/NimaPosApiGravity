import { apiRequest } from "./client";

export type SafeRow = {
  id: number;
  name: string;
  balance: number;
  is_active?: number;
  branch_id?: number;
  updated_at?: string | null;
};

export type SafeTransferRow = {
  id: number;
  from_safe_id: number;
  to_safe_id: number;
  amount: number;
  transferor_id?: number | null;
  receiver_id?: number | null;
  notes?: string | null;
  transfer_date?: string | null;
};

export type SafeSummaryResponse = {
  safe_id: number;
  date: string;
  receipts: {
    sales: number;
    transfers_in: number;
    supplier_returns: number;
    total: number;
  };
  payments: {
    purchases: number;
    expenses: number;
    transfers_out: number;
    customer_returns: number;
    total: number;
  };
  net_flow: number;
};

export function getSafes(token: string, branchId?: number) {
  const query = branchId ? `?branch_id=${encodeURIComponent(String(branchId))}` : "";
  return apiRequest<SafeRow[]>(`/safes${query}`, { token });
}

export function createSafe(
  token: string,
  payload: {
    name: string;
    balance?: number;
    is_active?: number;
    branch_id?: number;
  }
) {
  return apiRequest<SafeRow>("/safes", {
    method: "POST",
    token,
    body: payload
  });
}

export function transferBetweenSafes(
  token: string,
  payload: {
    from_safe_id: number;
    to_safe_id: number;
    amount: number;
    transferor_id?: number;
    receiver_id?: number;
    notes?: string;
  }
) {
  return apiRequest<{ transfer_id: number }>("/safes/transfer", {
    method: "POST",
    token,
    body: payload
  });
}

export function getSafeTransfers(token: string, safeId?: number, limit = 50) {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (safeId) params.set("safe_id", String(safeId));
  return apiRequest<SafeTransferRow[]>(`/safes/transfers?${params.toString()}`, { token });
}

export function getSafeSummary(token: string, safeId: number, date: string) {
  return apiRequest<SafeSummaryResponse>(`/safes/${safeId}/summary?date=${encodeURIComponent(date)}`, { token });
}
