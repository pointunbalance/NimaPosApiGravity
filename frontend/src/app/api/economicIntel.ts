import { apiRequest } from "./client";

export type MarketSignalRow = {
  id?: number;
  signal_type: string;
  current_value: number;
  previous_value?: number | null;
  trend?: string | null;
  last_updated?: string | null;
};

export type ForecastRow = {
  product_id: number;
  sku?: string | null;
  name: string;
  trigger_signal: string;
  signal_change: number;
  current_price: number;
  suggested_price: number;
  diff_percentage: number;
  reason: string;
};

export function getMarketSignals(token: string) {
  return apiRequest<MarketSignalRow[]>("/economic-intel/signals", { token });
}

export function updateMarketSignal(token: string, signalType: string, value: number) {
  return apiRequest<{ message: string }>(
    `/economic-intel/signals?signal_type=${encodeURIComponent(signalType)}&value=${encodeURIComponent(String(value))}`,
    { method: "POST", token }
  );
}

export function getRiskForecast(token: string) {
  return apiRequest<ForecastRow[]>("/economic-intel/forecast", { token });
}

export function declareGlobalEvent(
  token: string,
  payload: {
    event_name: string;
    severity_score?: number;
    affected_categories?: string[];
  }
) {
  return apiRequest<{ id: number }>("/economic-intel/events", {
    method: "POST",
    token,
    body: payload
  });
}
