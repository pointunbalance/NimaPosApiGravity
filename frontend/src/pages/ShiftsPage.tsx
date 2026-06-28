import { FormEvent, useState } from "react";

import { closeShift, getCurrentShift, getShifts, openShift } from "../app/api/shifts";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

export function ShiftsPage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [startCash, setStartCash] = useState("");
  const [actualCash, setActualCash] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: current } = useAsyncValue(session ? () => getCurrentShift(session.token) : null, [session?.token, refreshKey]);
  const { data, loading, error } = useAsyncValue(session ? () => getShifts(session.token) : null, [session?.token, refreshKey]);

  const handleOpen = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await openShift(session.token, { start_cash: Number(startCash) || 0, branch_id: 1 });
      setStartCash("");
      setRefreshKey((value) => value + 1);
      setMessage(`تم فتح الوردية رقم ${created.id} بنجاح.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleClose = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !current?.id) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const closed = await closeShift(session.token, current.id, {
        actual_cash: Number(actualCash) || 0,
        notes: closeNotes
      });
      setActualCash("");
      setCloseNotes("");
      setRefreshKey((value) => value + 1);
      setMessage(`تم إغلاق الوردية رقم ${closed.id} بفارق ${Number(closed.difference ?? 0).toLocaleString("ar-EG")} ج.م.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="الورديات" subtitle="واجهة تشغيلية لفتح الوردية النقدية، مراقبة الحالة الحالية، وإغلاقها مع مطابقة النقدية." />
      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">Current Shift</span><strong>{current ? `#${current.id}` : "-"}</strong><p>{current ? current.status : "لا توجد وردية مفتوحة"}</p></article>
        <article className="stat-card"><span className="eyebrow">Expected Cash</span><strong>{Number(current?.expected_cash ?? 0).toLocaleString("ar-EG")} ج.م</strong><p>القيمة المتوقعة للصندوق حسب النظام.</p></article>
        <article className="stat-card"><span className="eyebrow">Opened By</span><strong>{current?.username || current?.user_id || "-"}</strong><p>المستخدم المرتبط بالوردية الحالية.</p></article>
      </section>
      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Open Shift</span>
          <h3>فتح وردية جديدة</h3>
          <form className="auth-form" onSubmit={handleOpen}>
            <label><span>الرصيد الافتتاحي</span><input inputMode="decimal" value={startCash} onChange={(e) => setStartCash(e.target.value)} /></label>
            <button className="primary-button" disabled={Boolean(current)} type="submit">فتح الوردية</button>
          </form>
        </article>
        <article className="surface-panel">
          <span className="eyebrow">Close Shift</span>
          <h3>{current ? `إغلاق الوردية #${current.id}` : "لا توجد وردية مفتوحة"}</h3>
          <form className="auth-form" onSubmit={handleClose}>
            <label><span>النقدية الفعلية</span><input disabled={!current} inputMode="decimal" value={actualCash} onChange={(e) => setActualCash(e.target.value)} /></label>
            <label><span>ملاحظات الإغلاق</span><input disabled={!current} value={closeNotes} onChange={(e) => setCloseNotes(e.target.value)} /></label>
            <button className="primary-button" disabled={!current || !actualCash} type="submit">إغلاق الوردية</button>
          </form>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>
      </section>
      <section className="surface-panel">
        {loading ? (
          <QueryFeedback title="جارٍ تحميل الورديات" message="نقرأ سجل الورديات الأخيرة." />
        ) : error ? (
          <QueryFeedback title="فشل تحميل الورديات" message={error} tone="error" />
        ) : (
          <div className="table-shell">
            <table>
              <thead><tr><th>#</th><th>الحالة</th><th>الافتتاح</th><th>الإغلاق</th><th>المتوقع</th><th>الفعلي</th><th>الفارق</th></tr></thead>
              <tbody>
                {data?.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.status}</td>
                    <td>{item.start_time || "-"}</td>
                    <td>{item.end_time || "-"}</td>
                    <td>{Number(item.expected_cash ?? 0).toLocaleString("ar-EG")} ج.م</td>
                    <td>{Number(item.actual_cash ?? 0).toLocaleString("ar-EG")} ج.م</td>
                    <td>{Number(item.difference ?? 0).toLocaleString("ar-EG")} ج.م</td>
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
