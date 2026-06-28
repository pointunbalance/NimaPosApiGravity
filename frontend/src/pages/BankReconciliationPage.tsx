import { FormEvent, useState } from "react";

import { createReconciliation, getAccounts, getJournalEntries, getReconciliations, matchReconciliation, updateReconciliation } from "../app/api/accounting";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const today = new Date().toISOString().slice(0, 10);
const initialForm = { accountId: "", statementDate: today, statementBalance: "" };

export function BankReconciliationPage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [entryId, setEntryId] = useState("");
  const [status, setStatus] = useState("open");
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: reconciliations, loading, error } = useAsyncValue(session ? () => getReconciliations(session.token) : null, [session?.token, refreshKey]);
  const { data: accounts } = useAsyncValue(session ? () => getAccounts(session.token, "asset") : null, [session?.token]);
  const { data: entries } = useAsyncValue(session ? () => getJournalEntries(session.token) : null, [session?.token]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createReconciliation(session.token, {
        account_id: Number(form.accountId) || 0,
        statement_date: form.statementDate,
        statement_balance: Number(form.statementBalance) || 0,
        reconciled_entry_ids_json: "[]"
      });
      setForm(initialForm);
      setSelectedId(created.id);
      setRefreshKey((value) => value + 1);
      setMessage(`تم إنشاء تسوية بنكية رقم ${created.id}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleUpdateStatus = async () => {
    if (!session || !selectedId) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await updateReconciliation(session.token, selectedId, { status });
      setRefreshKey((value) => value + 1);
      setMessage(`تم تحديث حالة التسوية رقم ${selectedId}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleMatch = async () => {
    if (!session || !selectedId || !entryId) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await matchReconciliation(session.token, selectedId, Number(entryId));
      setRefreshKey((value) => value + 1);
      setMessage(`تمت مطابقة القيد ${entryId} مع التسوية ${selectedId}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="التسوية البنكية" subtitle="إنشاء التسويات البنكية ومطابقة قيود اليومية معها." />

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">New Reconciliation</span>
          <h3>إضافة تسوية</h3>
          <form className="auth-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <label>
                <span>الحساب</span>
                <select value={form.accountId} onChange={(e) => setForm((v) => ({ ...v, accountId: e.target.value }))}>
                  <option value="">اختر الحساب</option>
                  {(accounts ?? []).map((item) => <option key={item.id} value={item.id}>{item.code} - {item.name}</option>)}
                </select>
              </label>
              <label><span>تاريخ الكشف</span><input type="date" value={form.statementDate} onChange={(e) => setForm((v) => ({ ...v, statementDate: e.target.value }))} /></label>
              <label><span>رصيد الكشف</span><input inputMode="decimal" value={form.statementBalance} onChange={(e) => setForm((v) => ({ ...v, statementBalance: e.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!form.accountId || !form.statementBalance}>إنشاء التسوية</button>
          </form>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Actions</span>
          <h3>{selectedId ? `التسوية #${selectedId}` : "اختر تسوية من الجدول"}</h3>
          <div className="form-grid">
            <label><span>الحالة</span><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="open">open</option><option value="matched">matched</option><option value="closed">closed</option></select></label>
            <label><span>قيد للمطابقة</span><select value={entryId} onChange={(e) => setEntryId(e.target.value)}><option value="">اختر القيد</option>{(entries?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.id} - {item.description}</option>)}</select></label>
          </div>
          <div className="inline-actions">
            <button className="secondary-button compact-pill" type="button" disabled={!selectedId} onClick={handleUpdateStatus}>تحديث الحالة</button>
            <button className="secondary-button compact-pill" type="button" disabled={!selectedId || !entryId} onClick={handleMatch}>مطابقة القيد</button>
          </div>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>
      </section>

      <section className="surface-panel">
        {loading ? (
          <QueryFeedback title="جارٍ تحميل التسويات" message="نقرأ سجل التسويات البنكية." />
        ) : error ? (
          <QueryFeedback title="فشل تحميل التسويات" message={error} tone="error" />
        ) : (
          <div className="table-shell">
            <table>
              <thead><tr><th>#</th><th>الحساب</th><th>التاريخ</th><th>رصيد الكشف</th><th>الحالة</th><th>إجراء</th></tr></thead>
              <tbody>
                {(reconciliations ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.account_id}</td>
                    <td>{item.statement_date}</td>
                    <td>{item.statement_balance.toLocaleString("ar-EG")} ج.م</td>
                    <td>{item.status || "-"}</td>
                    <td><button className="secondary-button compact-pill" type="button" onClick={() => setSelectedId(item.id)}>فتح</button></td>
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
