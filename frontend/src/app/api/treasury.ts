import { apiRequest } from "./client";

export type TreasuryProjectionRow = {
  date: string;
  inflow: number;
  outflow: number;
  net: number;
  cumulative_net: number;
};

export function getTreasuryProjection(token: string, days = 30) {
  return apiRequest<TreasuryProjectionRow[]>(`/treasury/projection?days=${encodeURIComponent(String(days))}`, { token });
}

export function createTreasuryForecast(
  token: string,
  payload: {
    forecast_date: string;
    estimated_inflow?: number;
    estimated_outflow?: number;
    notes?: string;
  }
) {
  return apiRequest<{ id: number; message: string }>("/treasury/forecasts", {
    method: "POST",
    token,
    body: payload
  });
}

export function logBankImport(
  token: string,
  payload: {
    account_id: number;
    filename: string;
  }
) {
  return apiRequest<{ id: number; message: string }>("/treasury/bank-imports", {
    method: "POST",
    token,
    body: payload
  });
}
