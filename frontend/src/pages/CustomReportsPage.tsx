import { useState } from "react";

import { getProfitMetrics, getSalesByCategory, getSalesHistory, getSalesSummary, getTopProducts } from "../app/api/reports";
import { useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const today = new Date().toISOString().slice(0, 10);
const monthStart = `${today.slice(0, 8)}01`;

export function CustomReportsPage() {
  const { session } = useAuth();
  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);

  const params = { date_from: dateFrom, date_to: dateTo };

  const { data: summary, loading, error } = useAsyncValue(
    session ? () => getSalesSummary(session.token, params) : null,
    [session?.token, dateFrom, dateTo]
  );
  const { data: topProducts } = useAsyncValue(session ? () => getTopProducts(session.token, params) : null, [session?.token, dateFrom, dateTo]);
  const { data: profit } = useAsyncValue(session ? () => getProfitMetrics(session.token, params) : null, [session?.token, dateFrom, dateTo]);
  const { data: byCategory } = useAsyncValue(session ? () => getSalesByCategory(session.token, params) : null, [session?.token, dateFrom, dateTo]);
  const { data: salesHistory } = useAsyncValue(session ? () => getSalesHistory(session.token, params) : null, [session?.token, dateFrom, dateTo]);

  return (
    <div className="page-stack">
      <PageHeader title="التقارير المخصصة" subtitle="فلاتر زمنية وتقارير تشغيلية ومالية مبنية على الـ API الفعلي." />

      <section className="surface-panel">
        <span className="eyebrow">Date Range</span>
        <div className="form-grid">
          <label><span>من</span><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></label>
          <label><span>إلى</span><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></label>
        </div>
      </section>

      {loading ? (
        <QueryFeedback title="جارٍ تجهيز التقارير" message="نقرأ الملخصات والحركات وفق الفترة المحددة." />
      ) : error ? (
        <QueryFeedback title="تعذر تحميل التقارير" message={error} tone="error" />
      ) : (
        <>
          <section className="stats-grid">
            <article className="stat-card"><span className="eyebrow">صافي المبيعات</span><strong>{(summary?.net_sales ?? 0).toLocaleString("ar-EG")} ج.م</strong><p>بعد خصم المرتجعات.</p></article>
            <article className="stat-card"><span className="eyebrow">متوسط الفاتورة</span><strong>{(summary?.avg_ticket ?? 0).toLocaleString("ar-EG")} ج.م</strong><p>للفترة المحددة.</p></article>
            <article className="stat-card"><span className="eyebrow">الربح الإجمالي</span><strong>{(profit?.gross_profit ?? 0).toLocaleString("ar-EG")} ج.م</strong><p>هامش {profit?.margin_pct ?? 0}%</p></article>
          </section>

          <section className="settings-layout">
            <article className="surface-panel">
              <span className="eyebrow">Top Products</span>
              <div className="table-shell">
                <table>
                  <thead><tr><th>المنتج</th><th>الكمية</th><th>الإيراد</th></tr></thead>
                  <tbody>
                    {(topProducts ?? []).map((item, index) => (
                      <tr key={`${item.name}-${index}`}>
                        <td>{item.name}</td>
                        <td>{item.total_qty ?? 0}</td>
                        <td>{(item.total_revenue ?? 0).toLocaleString("ar-EG")} ج.م</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="surface-panel">
              <span className="eyebrow">By Category</span>
              <div className="table-shell">
                <table>
                  <thead><tr><th>الفئة</th><th>الكمية</th><th>الإجمالي</th></tr></thead>
                  <tbody>
                    {(byCategory ?? []).map((item, index) => (
                      <tr key={`${item.category_name}-${index}`}>
                        <td>{item.category_name || "-"}</td>
                        <td>{item.total_qty ?? 0}</td>
                        <td>{(item.total_sales ?? 0).toLocaleString("ar-EG")} ج.م</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </section>

          <section className="surface-panel">
            <span className="eyebrow">Sales History</span>
            <div className="table-shell">
              <table>
                <thead><tr><th>#</th><th>الوقت</th><th>العميل</th><th>الدفع</th><th>الصافي</th></tr></thead>
                <tbody>
                  {(salesHistory?.items ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.created_at || "-"}</td>
                      <td>{item.customer_name || "عميل نقدي"}</td>
                      <td>{item.payment_method || "-"}</td>
                      <td>{(item.net_total ?? 0).toLocaleString("ar-EG")} ج.م</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
