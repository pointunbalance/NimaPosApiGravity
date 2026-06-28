import { apiRequest } from "./client";

export type CapitalSummaryResponse = {
  initial_capital: number;
  total_revenue: number;
  total_expenses: number;
  estimated_cash: number;
  total_inventory: number;
  warehouse_assets: Array<{ warehouse_id?: number; warehouse_name?: string; value?: number }>;
  total_liabilities: number;
  customer_receivables: number;
  total_fixed_assets: number;
  current_assets: number;
  total_assets: number;
  net_worth: number;
  working_capital: number;
  net_profit: number;
  roi: number;
};

export type CapitalCashFlowRow = {
  date: string;
  income: number;
  expense: number;
  net: number;
};

export type SupplierDebtRow = {
  id: number;
  name: string;
  phone?: string | null;
  balance: number;
};

export function getCapitalSummary(token: string) {
  return apiRequest<CapitalSummaryResponse>("/capital/summary", { token });
}

export function updateInitialCapital(token: string, amount: number) {
  return apiRequest<{ initial_capital: number }>("/capital", {
    method: "PUT",
    token,
    body: { amount }
  });
}

export function getCapitalCashFlow(token: string, days = 14) {
  return apiRequest<CapitalCashFlowRow[]>(`/capital/cash-flow?days=${encodeURIComponent(String(days))}`, { token });
}

export function getSupplierDebts(token: string) {
  return apiRequest<SupplierDebtRow[]>("/capital/supplier-debts", { token });
}
