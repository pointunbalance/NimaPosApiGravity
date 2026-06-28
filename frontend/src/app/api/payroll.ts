import { apiRawRequest } from "./client";

export type PayrollRow = {
  id: number;
  user_id: number;
  user_name?: string | null;
  month: string;
  base_salary: number;
  days_worked: number;
  bonus?: number;
  deductions?: number;
  net_salary?: number;
  payment_method?: string | null;
  notes?: string | null;
  created_at?: string;
};

export type PayrollProcessPayload = {
  user_id: number;
  month: string;
  base_salary: number;
  days_worked: number;
  bonus?: number;
  deductions?: number;
  payment_method?: string;
  notes?: string;
};

export type PayrollSummary = {
  total_records?: number;
  total_base_salary?: number;
  total_bonus?: number;
  total_deductions?: number;
  total_net_salary?: number;
};

export function getPayroll(token: string, month?: string) {
  const query = month ? `?month=${encodeURIComponent(month)}` : "";
  return apiRawRequest<{ ok: boolean; data: PayrollRow[]; meta?: unknown }>(`/payroll${query}`, { token });
}

export function processPayroll(token: string, payload: PayrollProcessPayload) {
  return apiRawRequest<{ ok: boolean; data: PayrollRow }>("/payroll/process", {
    method: "POST",
    token,
    body: payload
  });
}

export function getPayrollSummary(token: string, month: string) {
  return apiRawRequest<{ ok: boolean; data: PayrollSummary }>(`/payroll/summary/${month}`, { token });
}
