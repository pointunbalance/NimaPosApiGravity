import { apiRequest } from "./client";

export type DateRangeParams = {
  date_from: string;
  date_to: string;
};

export type SalesSummary = {
  invoices_count: number;
  gross_sales: number;
  subtotal_sum: number;
  tax_sum: number;
  returns_amount: number;
  net_sales: number;
  avg_ticket: number;
  daily_breakdown: Array<{ day?: string; date?: string; total?: number; invoice_count?: number }>;
};

export type TopProduct = {
  id?: number;
  name: string;
  sku?: string | null;
  total_qty?: number;
  total_revenue?: number;
};

export type ProfitMetrics = {
  revenue?: number;
  cogs?: number;
  gross_profit?: number;
  margin_pct?: number;
};

export type CategorySales = {
  category_name?: string | null;
  total_qty?: number;
  total_sales?: number;
};

export type SalesHistoryItem = {
  id: number;
  created_at?: string | null;
  customer_name?: string | null;
  payment_method?: string | null;
  net_total?: number;
};

export type TradingSummary = {
  revenue?: { sales?: number; returns?: number };
  costs?: { purchases?: number; expenses?: number };
  net_trading_profit?: number;
};

export type UserSalesRow = {
  username?: string;
  invoice_count?: number;
  total_sales?: number;
};

export type PaymentMethodSalesRow = {
  payment_method?: string;
  cnt?: number;
  total?: number;
};

export type InventoryValuationRow = {
  id: number;
  name: string;
  sku?: string | null;
  stock_qty?: number;
  cost_price?: number;
  value?: number;
};

export type HourlySalesRow = {
  hour?: number;
  cnt?: number;
  total?: number;
};

export function getSalesSummary(token: string, params: DateRangeParams) {
  return apiRequest<SalesSummary>(`/reports/sales-summary?date_from=${encodeURIComponent(params.date_from)}&date_to=${encodeURIComponent(params.date_to)}`, { token });
}

export function getTopProducts(token: string, params: DateRangeParams) {
  return apiRequest<TopProduct[]>(`/reports/top-products?date_from=${encodeURIComponent(params.date_from)}&date_to=${encodeURIComponent(params.date_to)}`, { token });
}

export function getProfitMetrics(token: string, params: DateRangeParams) {
  return apiRequest<ProfitMetrics>(`/reports/profit-metrics?date_from=${encodeURIComponent(params.date_from)}&date_to=${encodeURIComponent(params.date_to)}`, { token });
}

export function getSalesByCategory(token: string, params: DateRangeParams) {
  return apiRequest<CategorySales[]>(`/reports/sales-by-category?date_from=${encodeURIComponent(params.date_from)}&date_to=${encodeURIComponent(params.date_to)}`, { token });
}

export function getSalesHistory(token: string, params: DateRangeParams) {
  return apiRequest<{ items: SalesHistoryItem[]; pagination?: unknown }>(
    `/reports/sales-history?date_from=${encodeURIComponent(params.date_from)}&date_to=${encodeURIComponent(params.date_to)}`,
    { token }
  );
}

export function getTradingSummary(token: string, params: DateRangeParams) {
  return apiRequest<TradingSummary>(
    `/reports/trading-summary?date_from=${encodeURIComponent(params.date_from)}&date_to=${encodeURIComponent(params.date_to)}`,
    { token }
  );
}

export function getSalesByUser(token: string, params: DateRangeParams) {
  return apiRequest<UserSalesRow[]>(
    `/reports/sales-by-user?date_from=${encodeURIComponent(params.date_from)}&date_to=${encodeURIComponent(params.date_to)}`,
    { token }
  );
}

export function getSalesByPaymentMethod(token: string, params: DateRangeParams) {
  return apiRequest<PaymentMethodSalesRow[]>(
    `/reports/sales-by-payment-method?date_from=${encodeURIComponent(params.date_from)}&date_to=${encodeURIComponent(params.date_to)}`,
    { token }
  );
}

export function getInventoryValuation(token: string) {
  return apiRequest<{ items: InventoryValuationRow[]; total_valuation: number }>(`/reports/inventory-valuation`, { token });
}

export function getHourlySales(token: string, params: DateRangeParams) {
  return apiRequest<HourlySalesRow[]>(
    `/reports/hourly-sales?date_from=${encodeURIComponent(params.date_from)}&date_to=${encodeURIComponent(params.date_to)}`,
    { token }
  );
}
