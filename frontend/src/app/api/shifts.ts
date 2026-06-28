import { apiRequest } from "./client";
import type { PaginatedItems } from "./products";

export type ShiftRow = {
  id: number;
  start_time?: string;
  end_time?: string | null;
  start_cash: number;
  actual_cash?: number | null;
  expected_cash?: number | null;
  difference?: number | null;
  status: string;
  notes?: string | null;
  user_id?: number;
  username?: string | null;
  branch_id?: number;
};

export type OpenShiftPayload = {
  start_cash: number;
  user_id?: number;
  branch_id: number;
};

export type CloseShiftPayload = {
  actual_cash: number;
  notes?: string;
};

export function getShifts(token: string, status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}&limit=12` : "?limit=12";
  return apiRequest<PaginatedItems<ShiftRow>>(`/shifts${query}`, { token });
}

export function getCurrentShift(token: string, branchId = 1) {
  return apiRequest<ShiftRow | null>(`/shifts/current?branch_id=${branchId}`, { token });
}

export function openShift(token: string, payload: OpenShiftPayload) {
  return apiRequest<ShiftRow>("/shifts/open", {
    method: "POST",
    token,
    body: payload
  });
}

export function closeShift(token: string, shiftId: number, payload: CloseShiftPayload) {
  return apiRequest<ShiftRow>(`/shifts/${shiftId}/close`, {
    method: "POST",
    token,
    body: payload
  });
}
