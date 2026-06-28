import { useState } from "react";

import { getTaxReport } from "../app/api/accounting";
import { useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const today = new Date().toISOString().slice(0, 10);
const monthStart = `${today.slice(0, 8)}01`;

export function TaxReportsPage() {
  const { session } = useAuth();
  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);

  const { data, loading, error } = useAsyncValue(
    session ? () => getTaxReport(session.token, dateFrom, dateTo) : null,
    [session?.token, dateFrom, dateTo]
  );

  return (
    <div className="page-stack">
      <PageHeader title="الضرائب" subtitle="ملخص ضريبة القيمة المضافة والالتزامات الضريبية ضمن فترة محددة." />

      <section className="surface-panel">
        <div className="form-grid">
          <label><span>من</span><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></label>
          <label><span>إلى</span><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></label>
        </div>
      </section>

      {loading ? (
        <QueryFeedback title="جارٍ تحميل تقرير الضرائب" message="نقرأ ملخص الضرائب للفترة المحددة." />
      ) : error ? (
        <QueryFeedback title="فشل تحميل تقرير الضرائب" message={error} tone="error" />
      ) : data ? (
        <>
          <section className="stats-grid">
            <article className="stat-card"><span className="eyebrow">ضريبة المبيعات</span><strong>{(data.sales_tax ?? 0).toLocaleString("ar-EG")} ج.م</strong><p>المحصلة على المبيعات.</p></article>
            <article className="stat-card"><span className="eyebrow">ضريبة المشتريات</span><strong>{(data.purchase_tax ?? 0).toLocaleString("ar-EG")} ج.م</strong><p>القابلة للخصم.</p></article>
            <article className="stat-card"><span className="eyebrow">صافي الضريبة</span><strong>{(data.net_tax ?? 0).toLocaleString("ar-EG")} ج.م</strong><p>الالتزام أو الرصيد الصافي.</p></article>
          </section>

          <section className="surface-panel">
            <div className="table-shell">
              <table>
                <thead><tr><th>البيان</th><th>القيمة</th></tr></thead>
                <tbody>
                  {(data.items ?? []).map((item, index) => (
                    <tr key={`${item.label}-${index}`}>
                      <td>{item.label || "-"}</td>
                      <td>{(item.amount ?? 0).toLocaleString("ar-EG")} ج.م</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
