import { FormEvent, useState } from "react";

import { createLog, getLogs, getLogStats } from "../app/api/logbook";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialForm = {
  type: "activity",
  action: "",
  details: "",
  amount: "",
  referenceId: "",
  status: "open"
};

type LogbookPageProps = {
  title?: string;
  subtitle?: string;
  defaultType?: string;
};

export function LogbookPage({
  title = "سجل العمليات",
  subtitle = "تتبع الحركات التشغيلية والمالية مع فلاتر سريعة وإضافة قيود يدوية.",
  defaultType = ""
}: LogbookPageProps) {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(defaultType);
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState({ ...initialForm, type: defaultType || initialForm.type });
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: logsResponse, loading, error } = useAsyncValue(
    session ? () => getLogs(session.token, { search, type: typeFilter || undefined, status: statusFilter || undefined }) : null,
    [session?.token, refreshKey, search, typeFilter, statusFilter]
  );
  const { data: statsResponse } = useAsyncValue(session ? () => getLogStats(session.token) : null, [session?.token, refreshKey]);

  const logs = logsResponse?.data ?? [];
  const stats = statsResponse?.data;

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createLog(session.token, {
        type: form.type,
        action: form.action,
        details: form.details,
        user_name: session.user.username,
        amount: Number(form.amount) || undefined,
        reference_id: Number(form.referenceId) || undefined,
        status: form.status
      });
      setForm({ ...initialForm, type: defaultType || initialForm.type });
      setRefreshKey((value) => value + 1);
      setMessage(`تم إنشاء قيد جديد برقم ${created.data.id}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title={title} subtitle={subtitle} />

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">السجلات</span><strong>{logs.length}</strong><p>عدد السجلات المحملة حاليًا.</p></article>
        <article className="stat-card"><span className="eyebrow">إجمالي الداخل</span><strong>{(stats?.income_total ?? 0).toLocaleString("ar-EG")} ج.م</strong><p>من ملخص السجل العام.</p></article>
        <article className="stat-card"><span className="eyebrow">إجمالي الخارج</span><strong>{(stats?.expense_total ?? 0).toLocaleString("ar-EG")} ج.م</strong><p>من ملخص السجل العام.</p></article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Filters</span>
          <h3>تصفية السجل</h3>
          <div className="form-grid">
            <label><span>بحث</span><input value={search} onChange={(e) => setSearch(e.target.value)} /></label>
            <label><span>النوع</span><select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option value="">الكل</option><option value="activity">activity</option><option value="financial">financial</option><option value="audit">audit</option></select></label>
            <label><span>الحالة</span><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">الكل</option><option value="open">open</option><option value="success">success</option><option value="failed">failed</option></select></label>
          </div>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Quick Entry</span>
          <h3>إضافة قيد يدوي</h3>
          <form className="auth-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <label><span>النوع</span><select value={form.type} onChange={(e) => setForm((v) => ({ ...v, type: e.target.value }))}><option value="activity">activity</option><option value="financial">financial</option><option value="audit">audit</option></select></label>
              <label><span>الإجراء</span><input value={form.action} onChange={(e) => setForm((v) => ({ ...v, action: e.target.value }))} /></label>
              <label><span>الحالة</span><select value={form.status} onChange={(e) => setForm((v) => ({ ...v, status: e.target.value }))}><option value="open">open</option><option value="success">success</option><option value="failed">failed</option></select></label>
              <label><span>المبلغ</span><input inputMode="decimal" value={form.amount} onChange={(e) => setForm((v) => ({ ...v, amount: e.target.value }))} /></label>
              <label><span>مرجع</span><input inputMode="numeric" value={form.referenceId} onChange={(e) => setForm((v) => ({ ...v, referenceId: e.target.value }))} /></label>
              <label className="form-field-span-2"><span>التفاصيل</span><input value={form.details} onChange={(e) => setForm((v) => ({ ...v, details: e.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!form.action}>إضافة القيد</button>
          </form>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>
      </section>

      <section className="surface-panel">
        {loading ? (
          <QueryFeedback title="جارٍ تحميل السجل" message="نقرأ أحدث العمليات من قاعدة البيانات." />
        ) : error ? (
          <QueryFeedback title="فشل تحميل السجل" message={error} tone="error" />
        ) : (
          <div className="table-shell">
            <table>
              <thead><tr><th>#</th><th>النوع</th><th>الإجراء</th><th>المستخدم</th><th>الحالة</th><th>المبلغ</th><th>الوقت</th><th>التفاصيل</th></tr></thead>
              <tbody>
                {logs.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.type || "-"}</td>
                    <td>{item.action}</td>
                    <td>{item.user_name || "-"}</td>
                    <td>{item.status || "-"}</td>
                    <td>{item.amount ? `${item.amount.toLocaleString("ar-EG")} ج.م` : "-"}</td>
                    <td>{item.created_at || "-"}</td>
                    <td>{item.details || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
