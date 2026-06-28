import { FormEvent, useState } from "react";

import { closeFiscalYear, createFiscalYear, getFiscalYears, runFiscalClosing } from "../app/api/accounting";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const today = new Date().toISOString().slice(0, 10);
const currentYear = new Date().getFullYear();
const initialFiscalYearForm = {
  name: `FY ${currentYear}`,
  startDate: `${currentYear}-01-01`,
  endDate: `${currentYear}-12-31`
};

export function FiscalClosingPage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [fiscalYearForm, setFiscalYearForm] = useState(initialFiscalYearForm);
  const [closingDate, setClosingDate] = useState(today);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: fiscalYears, loading, error } = useAsyncValue(
    session ? () => getFiscalYears(session.token) : null,
    [session?.token, refreshKey]
  );

  const handleCreateFiscalYear = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createFiscalYear(session.token, {
        name: fiscalYearForm.name,
        start_date: fiscalYearForm.startDate,
        end_date: fiscalYearForm.endDate
      });
      setFiscalYearForm(initialFiscalYearForm);
      setRefreshKey((value) => value + 1);
      setMessage(`تم إنشاء السنة المالية ${created.name}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleCloseYear = async (fiscalYearId: number, fiscalYearName: string) => {
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await closeFiscalYear(session.token, fiscalYearId);
      setRefreshKey((value) => value + 1);
      setMessage(`تم إغلاق السنة المالية ${fiscalYearName}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleRunClosing = async () => {
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const result = await runFiscalClosing(session.token, closingDate);
      setRefreshKey((value) => value + 1);
      setMessage(result.message || `تم تنفيذ الإقفال حتى ${closingDate}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="الإقفال المالي" subtitle="إدارة السنوات المالية وتنفيذ إقفال نهاية الفترة من نفس الواجهة." />

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Fiscal Years</span>
          <h3>إضافة سنة مالية</h3>
          <form className="auth-form" onSubmit={handleCreateFiscalYear}>
            <div className="form-grid">
              <label>
                <span>الاسم</span>
                <input value={fiscalYearForm.name} onChange={(event) => setFiscalYearForm((value) => ({ ...value, name: event.target.value }))} />
              </label>
              <label>
                <span>من</span>
                <input type="date" value={fiscalYearForm.startDate} onChange={(event) => setFiscalYearForm((value) => ({ ...value, startDate: event.target.value }))} />
              </label>
              <label>
                <span>إلى</span>
                <input type="date" value={fiscalYearForm.endDate} onChange={(event) => setFiscalYearForm((value) => ({ ...value, endDate: event.target.value }))} />
              </label>
            </div>
            <button className="primary-button" type="submit" disabled={!fiscalYearForm.name || !fiscalYearForm.startDate || !fiscalYearForm.endDate}>
              إنشاء السنة المالية
            </button>
          </form>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Period Close</span>
          <h3>تشغيل إقفال نهاية الفترة</h3>
          <div className="form-grid">
            <label>
              <span>حتى تاريخ</span>
              <input type="date" value={closingDate} onChange={(event) => setClosingDate(event.target.value)} />
            </label>
          </div>
          <div className="inline-actions">
            <button className="secondary-button compact-pill" type="button" onClick={handleRunClosing}>
              تنفيذ الإقفال
            </button>
          </div>
          <p>يقوم هذا الإجراء بتصفير حسابات الإيرادات والمصروفات وتحويل الأثر إلى حقوق الملكية.</p>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>
      </section>

      <section className="surface-panel">
        {loading ? (
          <QueryFeedback title="جارٍ تحميل السنوات المالية" message="نقرأ قائمة الفترات المتاحة من النظام." />
        ) : error ? (
          <QueryFeedback title="فشل تحميل السنوات المالية" message={error} tone="error" />
        ) : (
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>الاسم</th>
                  <th>من</th>
                  <th>إلى</th>
                  <th>الحالة</th>
                  <th>تاريخ الإغلاق</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {(fiscalYears ?? []).map((item) => {
                  const isClosed = item.status === "closed";
                  return (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.name}</td>
                      <td>{item.start_date}</td>
                      <td>{item.end_date}</td>
                      <td>{item.status || "open"}</td>
                      <td>{item.closed_at || "-"}</td>
                      <td>
                        <button
                          className="secondary-button compact-pill"
                          type="button"
                          disabled={isClosed}
                          onClick={() => handleCloseYear(item.id, item.name)}
                        >
                          {isClosed ? "مغلقة" : "إغلاق السنة"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
