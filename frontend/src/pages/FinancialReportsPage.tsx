import { useState } from "react";

import { getBalanceSheet, getCashFlow, getIncomeStatement, getTrialBalance } from "../app/api/accounting";
import { useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const today = new Date().toISOString().slice(0, 10);
const monthStart = `${today.slice(0, 8)}01`;

export function FinancialReportsPage() {
  const { session } = useAuth();
  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);

  const { data: trialBalance, loading, error } = useAsyncValue(session ? () => getTrialBalance(session.token) : null, [session?.token]);
  const { data: incomeStatement } = useAsyncValue(session ? () => getIncomeStatement(session.token, dateFrom, dateTo) : null, [session?.token, dateFrom, dateTo]);
  const { data: balanceSheet } = useAsyncValue(session ? () => getBalanceSheet(session.token) : null, [session?.token]);
  const { data: cashFlow } = useAsyncValue(session ? () => getCashFlow(session.token, dateFrom, dateTo) : null, [session?.token, dateFrom, dateTo]);

  return (
    <div className="page-stack">
      <PageHeader title="التقارير المالية" subtitle="مراجعة Trial Balance وIncome Statement وBalance Sheet وCash Flow." />

      <section className="surface-panel">
        <div className="form-grid">
          <label><span>من</span><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></label>
          <label><span>إلى</span><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></label>
        </div>
      </section>

      {loading ? (
        <QueryFeedback title="جارٍ تحميل التقارير" message="نقرأ القوائم المالية الحالية." />
      ) : error ? (
        <QueryFeedback title="فشل تحميل التقارير" message={error} tone="error" />
      ) : (
        <>
          <section className="stats-grid">
            <article className="stat-card"><span className="eyebrow">الإيرادات</span><strong>{(incomeStatement?.revenue ?? 0).toLocaleString("ar-EG")} ج.م</strong><p>ضمن الفترة المحددة.</p></article>
            <article className="stat-card"><span className="eyebrow">المصروفات</span><strong>{(incomeStatement?.expenses ?? 0).toLocaleString("ar-EG")} ج.م</strong><p>ضمن الفترة المحددة.</p></article>
            <article className="stat-card"><span className="eyebrow">صافي الربح</span><strong>{(incomeStatement?.net_profit ?? 0).toLocaleString("ar-EG")} ج.م</strong><p>نتيجة قائمة الدخل.</p></article>
          </section>

          <section className="settings-layout">
            <article className="surface-panel">
              <span className="eyebrow">Balance Sheet</span>
              <div className="detail-grid">
                <div className="feedback-panel"><strong>الأصول</strong><p>{(balanceSheet?.assets ?? 0).toLocaleString("ar-EG")} ج.م</p></div>
                <div className="feedback-panel"><strong>الالتزامات</strong><p>{(balanceSheet?.liabilities ?? 0).toLocaleString("ar-EG")} ج.م</p></div>
                <div className="feedback-panel"><strong>حقوق الملكية</strong><p>{(balanceSheet?.equity ?? 0).toLocaleString("ar-EG")} ج.م</p></div>
              </div>
            </article>

            <article className="surface-panel">
              <span className="eyebrow">Cash Flow</span>
              <div className="table-shell">
                <table>
                  <thead><tr><th>القسم</th><th>البيان</th><th>القيمة</th></tr></thead>
                  <tbody>
                    {(cashFlow ?? []).map((item, index) => (
                      <tr key={`${item.section}-${index}`}>
                        <td>{item.section || "-"}</td>
                        <td>{item.label || "-"}</td>
                        <td>{(item.amount ?? 0).toLocaleString("ar-EG")} ج.م</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </section>

          <section className="surface-panel">
            <span className="eyebrow">Trial Balance</span>
            <div className="table-shell">
              <table>
                <thead><tr><th>الكود/الاسم</th><th>مدين</th><th>دائن</th></tr></thead>
                <tbody>
                  {(trialBalance ?? []).map((item, index) => (
                    <tr key={`${item.code}-${index}`}>
                      <td>{[item.code, item.name].filter(Boolean).join(" - ")}</td>
                      <td>{(item.debit ?? 0).toLocaleString("ar-EG")} ج.م</td>
                      <td>{(item.credit ?? 0).toLocaleString("ar-EG")} ج.م</td>
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
