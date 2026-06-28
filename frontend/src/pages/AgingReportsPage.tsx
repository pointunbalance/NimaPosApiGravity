import { useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { getPayablesAging, getReceivablesAging } from "../app/api/accounting";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

export function AgingReportsPage() {
  const { session } = useAuth();

  const { data: receivables, loading, error } = useAsyncValue(session ? () => getReceivablesAging(session.token) : null, [session?.token]);
  const { data: payables } = useAsyncValue(session ? () => getPayablesAging(session.token) : null, [session?.token]);

  return (
    <div className="page-stack">
      <PageHeader title="تقارير الأعمار" subtitle="متابعة أعمار الذمم المدينة والدائنة حسب الشرائح الزمنية." />

      {loading ? (
        <QueryFeedback title="جارٍ تحميل التقرير" message="نقرأ بيانات الأعمار للعملاء والموردين." />
      ) : error ? (
        <QueryFeedback title="فشل تحميل التقرير" message={error} tone="error" />
      ) : (
        <section className="settings-layout">
          <article className="surface-panel">
            <span className="eyebrow">Receivables</span>
            <div className="table-shell">
              <table>
                <thead><tr><th>الاسم</th><th>0-30</th><th>31-60</th><th>61-90</th><th>90+</th><th>الرصيد</th></tr></thead>
                <tbody>
                  {(receivables ?? []).map((item, index) => (
                    <tr key={`r-${index}`}>
                      <td>{item.name || item.code || "-"}</td>
                      <td>{(item.bucket_0_30 ?? 0).toLocaleString("ar-EG")} ج.م</td>
                      <td>{(item.bucket_31_60 ?? 0).toLocaleString("ar-EG")} ج.م</td>
                      <td>{(item.bucket_61_90 ?? 0).toLocaleString("ar-EG")} ج.م</td>
                      <td>{(item.bucket_90_plus ?? 0).toLocaleString("ar-EG")} ج.م</td>
                      <td>{(item.balance ?? 0).toLocaleString("ar-EG")} ج.م</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="surface-panel">
            <span className="eyebrow">Payables</span>
            <div className="table-shell">
              <table>
                <thead><tr><th>الاسم</th><th>0-30</th><th>31-60</th><th>61-90</th><th>90+</th><th>الرصيد</th></tr></thead>
                <tbody>
                  {(payables ?? []).map((item, index) => (
                    <tr key={`p-${index}`}>
                      <td>{item.name || item.code || "-"}</td>
                      <td>{(item.bucket_0_30 ?? 0).toLocaleString("ar-EG")} ج.م</td>
                      <td>{(item.bucket_31_60 ?? 0).toLocaleString("ar-EG")} ج.م</td>
                      <td>{(item.bucket_61_90 ?? 0).toLocaleString("ar-EG")} ج.م</td>
                      <td>{(item.bucket_90_plus ?? 0).toLocaleString("ar-EG")} ج.م</td>
                      <td>{(item.balance ?? 0).toLocaleString("ar-EG")} ج.م</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      )}
    </div>
  );
}
