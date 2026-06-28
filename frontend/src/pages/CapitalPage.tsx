import { FormEvent, useState } from "react";

import { getCapitalCashFlow, getCapitalSummary, getSupplierDebts, updateInitialCapital } from "../app/api/capital";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

export function CapitalPage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [days, setDays] = useState("14");
  const [capitalAmount, setCapitalAmount] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: summary, loading, error } = useAsyncValue(session ? () => getCapitalSummary(session.token) : null, [session?.token, refreshKey]);
  const { data: cashFlow } = useAsyncValue(session ? () => getCapitalCashFlow(session.token, Number(days) || 14) : null, [session?.token, days, refreshKey]);
  const { data: supplierDebts } = useAsyncValue(session ? () => getSupplierDebts(session.token) : null, [session?.token, refreshKey]);

  const handleUpdateCapital = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const updated = await updateInitialCapital(session.token, Number(capitalAmount) || 0);
      setCapitalAmount("");
      setRefreshKey((value) => value + 1);
      setMessage(`تم تحديث رأس المال الافتتاحي إلى ${updated.initial_capital.toLocaleString("ar-EG")} ج.م.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="رأس المال" subtitle="لوحة مالية مختصرة لرأس المال، صافي الثروة، السيولة، والتزامات الموردين." />

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">Initial Capital</span><strong>{(summary?.initial_capital ?? 0).toLocaleString("ar-EG")} ج.م</strong><p>الرصيد الافتتاحي المعتمد في النظام.</p></article>
        <article className="stat-card"><span className="eyebrow">Net Worth</span><strong>{(summary?.net_worth ?? 0).toLocaleString("ar-EG")} ج.م</strong><p>إجمالي الأصول مطروحًا منه الالتزامات.</p></article>
        <article className="stat-card"><span className="eyebrow">Working Capital</span><strong>{(summary?.working_capital ?? 0).toLocaleString("ar-EG")} ج.م</strong><p>صافي رأس المال العامل الحالي.</p></article>
        <article className="stat-card"><span className="eyebrow">ROI</span><strong>{(summary?.roi ?? 0).toLocaleString("ar-EG")}%</strong><p>العائد على رأس المال الافتتاحي.</p></article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Capital Update</span>
          <h3>تحديث رأس المال الافتتاحي</h3>
          <form className="auth-form" onSubmit={handleUpdateCapital}>
            <div className="form-grid">
              <label><span>المبلغ</span><input inputMode="decimal" value={capitalAmount} onChange={(event) => setCapitalAmount(event.target.value)} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!capitalAmount}>حفظ التحديث</button>
          </form>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Position</span>
          <h3>المركز المالي المختصر</h3>
          <div className="detail-grid">
            <div className="feedback-panel"><strong>الإيرادات</strong><p>{(summary?.total_revenue ?? 0).toLocaleString("ar-EG")} ج.م</p></div>
            <div className="feedback-panel"><strong>المصروفات</strong><p>{(summary?.total_expenses ?? 0).toLocaleString("ar-EG")} ج.م</p></div>
            <div className="feedback-panel"><strong>النقد التقديري</strong><p>{(summary?.estimated_cash ?? 0).toLocaleString("ar-EG")} ج.م</p></div>
            <div className="feedback-panel"><strong>الأصول الثابتة</strong><p>{(summary?.total_fixed_assets ?? 0).toLocaleString("ar-EG")} ج.م</p></div>
          </div>
        </article>
      </section>

      <section className="surface-panel">
        <div className="form-grid">
          <label>
            <span>أيام اتجاه التدفق النقدي</span>
            <select value={days} onChange={(event) => setDays(event.target.value)}>
              <option value="7">7</option>
              <option value="14">14</option>
              <option value="30">30</option>
            </select>
          </label>
        </div>
      </section>

      {loading ? (
        <QueryFeedback title="جارٍ تحميل بيانات رأس المال" message="نقرأ ملخص المركز المالي من النظام." />
      ) : error ? (
        <QueryFeedback title="فشل تحميل بيانات رأس المال" message={error} tone="error" />
      ) : (
        <>
          <section className="settings-layout">
            <article className="surface-panel">
              <span className="eyebrow">Cash Flow Trend</span>
              <div className="table-shell">
                <table>
                  <thead><tr><th>التاريخ</th><th>دخل</th><th>مصروف</th><th>الصافي</th></tr></thead>
                  <tbody>
                    {(cashFlow ?? []).map((item) => (
                      <tr key={item.date}>
                        <td>{item.date}</td>
                        <td>{(item.income ?? 0).toLocaleString("ar-EG")} ج.م</td>
                        <td>{(item.expense ?? 0).toLocaleString("ar-EG")} ج.م</td>
                        <td>{(item.net ?? 0).toLocaleString("ar-EG")} ج.م</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="surface-panel">
              <span className="eyebrow">Supplier Debts</span>
              <div className="table-shell">
                <table>
                  <thead><tr><th>#</th><th>المورد</th><th>الهاتف</th><th>الرصيد</th></tr></thead>
                  <tbody>
                    {(supplierDebts ?? []).map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.name}</td>
                        <td>{item.phone || "-"}</td>
                        <td>{(item.balance ?? 0).toLocaleString("ar-EG")} ج.م</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </section>
        </>
      )}
    </div>
  );
}
