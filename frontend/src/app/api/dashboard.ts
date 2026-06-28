import { apiRequest } from "./client";

export type DashboardKpis = {
  today_sales: number;
  today_invoices: number;
  today_returns: number;
  today_net: number;
  today_expenses: number;
  today_cogs: number;
  today_profit: number;
  low_stock_count: number;
  active_products: number;
  active_customers: number;
  pending_orders: number;
  pending_maintenance: number;
  overdue_installments: number;
  held_orders_count: number;
  payment_split: Array<{ payment_method: string; cnt: number; total: number }>;
  top_products_today: Array<{ name: string; total_qty: number; total_revenue: number }>;
};

export function getDashboardKpis(token: string) {
  return apiRequest<DashboardKpis>("/dashboard/kpis", { token });
}
