import { useMemo, useState } from "react";

import {
  getHourlySales,
  getInventoryValuation,
  getProfitMetrics,
  getSalesByCategory,
  getSalesByPaymentMethod,
  getSalesByUser,
  getSalesSummary,
  getTopProducts,
  getTradingSummary
} from "../app/api/reports";
import { useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function BiDashboardsPage() {
  const { session } = useAuth();
  const [dateFrom, setDateFrom] = useState(todayDate());
  const [dateTo, setDateTo] = useState(todayDate());
  const params = useMemo(() => ({ date_from: dateFrom, date_to: dateTo }), [dateFrom, dateTo]);

  const { data: summary, loading, error } = useAsyncValue(session ? () => getSalesSummary(session.token, params) : null, [session?.token, dateFrom, dateTo]);
  const { data: topProducts } = useAsyncValue(session ? () => getTopProducts(session.token, params) : null, [session?.token, dateFrom, dateTo]);
  const { data: profit } = useAsyncValue(session ? () => getProfitMetrics(session.token, params) : null, [session?.token, dateFrom, dateTo]);
  const { data: categories } = useAsyncValue(session ? () => getSalesByCategory(session.token, params) : null, [session?.token, dateFrom, dateTo]);
  const { data: trading } = useAsyncValue(session ? () => getTradingSummary(session.token, params) : null, [session?.token, dateFrom, dateTo]);
  const { data: byUser } = useAsyncValue(session ? () => getSalesByUser(session.token, params) : null, [session?.token, dateFrom, dateTo]);
  const { data: byPayment } = useAsyncValue(session ? () => getSalesByPaymentMethod(session.token, params) : null, [session?.token, dateFrom, dateTo]);
  const { data: hourly } = useAsyncValue(session ? () => getHourlySales(session.token, params) : null, [session?.token, dateFrom, dateTo]);
  const { data: inventoryValuation } = useAsyncValue(session ? () => getInventoryValuation(session.token) : null, [session?.token]);

  return (
    <div className="page-stack">
      <PageHeader title="لوحات BI" subtitle="لوحة تنفيذية سريعة تجمع مؤشرات المبيعات والربحية والقنوات والمخزون في نطاق زمني واحد." />
      <section className="surface-panel">
        <div className="form-grid">
          <label><span>من</span><input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label>
          <label><span>إلى</span><input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">Net Sales</span><strong>{Number(summary?.net_sales ?? 0).toLocaleString("ar-EG")}</strong><p>صافي المبيعات في النطاق المحدد.</p></article>
        <article className="stat-card"><span className="eyebrow">Gross Profit</span><strong>{Number(profit?.gross_profit ?? 0).toLocaleString("ar-EG")}</strong><p>الربح الإجمالي المحسوب من الإيراد وتكلفة البضاعة.</p></article>
        <article className="stat-card"><span className="eyebrow">Trading Profit</span><strong>{Number(trading?.net_trading_profit ?? 0).toLocaleString("ar-EG")}</strong><p>صافي الربح التجاري للنطاق الحالي.</p></article>
      </section>

      {loading ? <QueryFeedback title="جارٍ تحميل مؤشرات BI" message="نقرأ الملخص التنفيذي ونبني اللوحات التابعة له." /> : error ? <QueryFeedback title="فشل تحميل مؤشرات BI" message={error} tone="error" /> : (
        <>
          <section className="settings-layout">
            <article className="surface-panel">
              <div className="table-shell">
                <table>
                  <thead><tr><th>الفواتير</th><th>الإجمالي</th><th>الضريبة</th><th>المرتجعات</th><th>متوسط التذكرة</th></tr></thead>
                  <tbody><tr><td>{Number(summary?.invoices_count ?? 0).toLocaleString("ar-EG")}</td><td>{Number(summary?.gross_sales ?? 0).toLocaleString("ar-EG")}</td><td>{Number(summary?.tax_sum ?? 0).toLocaleString("ar-EG")}</td><td>{Number(summary?.returns_amount ?? 0).toLocaleString("ar-EG")}</td><td>{Number(summary?.avg_ticket ?? 0).toLocaleString("ar-EG")}</td></tr></tbody>
                </table>
              </div>
            </article>
            <article className="surface-panel">
              <div className="table-shell">
                <table>
                  <thead><tr><th>المبيعات</th><th>المرتجعات</th><th>المشتريات</th><th>المصروفات</th></tr></thead>
                  <tbody><tr><td>{Number(trading?.revenue?.sales ?? 0).toLocaleString("ar-EG")}</td><td>{Number(trading?.revenue?.returns ?? 0).toLocaleString("ar-EG")}</td><td>{Number(trading?.costs?.purchases ?? 0).toLocaleString("ar-EG")}</td><td>{Number(trading?.costs?.expenses ?? 0).toLocaleString("ar-EG")}</td></tr></tbody>
                </table>
              </div>
            </article>
          </section>

          <section className="settings-layout">
            <article className="surface-panel">
              <span className="eyebrow">Top Products</span>
              <div className="table-shell">
                <table>
                  <thead><tr><th>المنتج</th><th>الكمية</th><th>الإيراد</th></tr></thead>
                  <tbody>{(topProducts ?? []).map((item, index) => <tr key={`${item.id ?? index}-${index}`}><td>{item.name}</td><td>{Number(item.total_qty ?? 0).toLocaleString("ar-EG")}</td><td>{Number(item.total_revenue ?? 0).toLocaleString("ar-EG")}</td></tr>)}</tbody>
                </table>
              </div>
            </article>
            <article className="surface-panel">
              <span className="eyebrow">By Category</span>
              <div className="table-shell">
                <table>
                  <thead><tr><th>الفئة</th><th>الكمية</th><th>المبيعات</th></tr></thead>
                  <tbody>{(categories ?? []).map((item, index) => <tr key={`${item.category_name ?? index}-${index}`}><td>{item.category_name || "-"}</td><td>{Number(item.total_qty ?? 0).toLocaleString("ar-EG")}</td><td>{Number(item.total_sales ?? 0).toLocaleString("ar-EG")}</td></tr>)}</tbody>
                </table>
              </div>
            </article>
          </section>

          <section className="settings-layout">
            <article className="surface-panel">
              <span className="eyebrow">By User</span>
              <div className="table-shell">
                <table>
                  <thead><tr><th>المستخدم</th><th>الفواتير</th><th>الإجمالي</th></tr></thead>
                  <tbody>{(byUser ?? []).map((item, index) => <tr key={`${item.username ?? index}-${index}`}><td>{item.username || "-"}</td><td>{Number(item.invoice_count ?? 0).toLocaleString("ar-EG")}</td><td>{Number(item.total_sales ?? 0).toLocaleString("ar-EG")}</td></tr>)}</tbody>
                </table>
              </div>
            </article>
            <article className="surface-panel">
              <span className="eyebrow">Payment Mix</span>
              <div className="table-shell">
                <table>
                  <thead><tr><th>طريقة الدفع</th><th>العدد</th><th>الإجمالي</th></tr></thead>
                  <tbody>{(byPayment ?? []).map((item, index) => <tr key={`${item.payment_method ?? index}-${index}`}><td>{item.payment_method || "-"}</td><td>{Number(item.cnt ?? 0).toLocaleString("ar-EG")}</td><td>{Number(item.total ?? 0).toLocaleString("ar-EG")}</td></tr>)}</tbody>
                </table>
              </div>
            </article>
          </section>

          <section className="settings-layout">
            <article className="surface-panel">
              <span className="eyebrow">Hourly Sales</span>
              <div className="table-shell">
                <table>
                  <thead><tr><th>الساعة</th><th>العدد</th><th>الإجمالي</th></tr></thead>
                  <tbody>{(hourly ?? []).map((item, index) => <tr key={`${item.hour ?? index}-${index}`}><td>{item.hour ?? "-"}</td><td>{Number(item.cnt ?? 0).toLocaleString("ar-EG")}</td><td>{Number(item.total ?? 0).toLocaleString("ar-EG")}</td></tr>)}</tbody>
                </table>
              </div>
            </article>
            <article className="surface-panel">
              <span className="eyebrow">Inventory Valuation</span>
              <p className="muted-text">إجمالي قيمة المخزون: {Number(inventoryValuation?.total_valuation ?? 0).toLocaleString("ar-EG")}</p>
              <div className="table-shell">
                <table>
                  <thead><tr><th>المنتج</th><th>الكمية</th><th>التكلفة</th><th>القيمة</th></tr></thead>
                  <tbody>{(inventoryValuation?.items ?? []).slice(0, 10).map((item) => <tr key={item.id}><td>{item.name}</td><td>{Number(item.stock_qty ?? 0).toLocaleString("ar-EG")}</td><td>{Number(item.cost_price ?? 0).toLocaleString("ar-EG")}</td><td>{Number(item.value ?? 0).toLocaleString("ar-EG")}</td></tr>)}</tbody>
                </table>
              </div>
            </article>
          </section>
        </>
      )}
    </div>
  );
}
