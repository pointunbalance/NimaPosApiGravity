import { FormEvent, useState } from "react";

import { createCheck, getChecks, updateCheckStatus } from "../app/api/accounting";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const today = new Date().toISOString().slice(0, 10);
const initialForm = { number: "", amount: "", bankName: "", issueDate: today, dueDate: today, type: "receivable", payeeName: "", notes: "" };

export function ChecksPage() {
  const { session } = useAuth();
  const { locale, messages } = useI18n();
  const copy = messages.checks;
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, loading, error } = useAsyncValue(session ? () => getChecks(session.token) : null, [session?.token, refreshKey]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createCheck(session.token, {
        number: form.number,
        amount: Number(form.amount) || 0,
        bank_name: form.bankName,
        issue_date: form.issueDate,
        due_date: form.dueDate,
        type: form.type,
        payee_name: form.payeeName,
        notes: form.notes
      });
      setForm(initialForm);
      setRefreshKey((value) => value + 1);
      setMessage(`${copy.createdMessagePrefix} ${created.id}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleStatus = async (checkId: number, status: string) => {
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await updateCheckStatus(session.token, checkId, { status });
      setRefreshKey((value) => value + 1);
      setMessage(`${copy.updatedStatusPrefix} ${checkId} ${copy.updatedStatusConnector} ${status}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title={copy.title} subtitle={copy.subtitle} />

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">{copy.createEyebrow}</span>
          <h3>{copy.createTitle}</h3>
          <form className="auth-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <label><span>{copy.fields.number}</span><input value={form.number} onChange={(event) => setForm((value) => ({ ...value, number: event.target.value }))} /></label>
              <label><span>{copy.fields.amount}</span><input inputMode="decimal" value={form.amount} onChange={(event) => setForm((value) => ({ ...value, amount: event.target.value }))} /></label>
              <label><span>{copy.fields.bank}</span><input value={form.bankName} onChange={(event) => setForm((value) => ({ ...value, bankName: event.target.value }))} /></label>
              <label><span>{copy.fields.type}</span><select value={form.type} onChange={(event) => setForm((value) => ({ ...value, type: event.target.value }))}><option value="receivable">{copy.typeOptions.receivable}</option><option value="payable">{copy.typeOptions.payable}</option></select></label>
              <label><span>{copy.fields.issueDate}</span><input type="date" value={form.issueDate} onChange={(event) => setForm((value) => ({ ...value, issueDate: event.target.value }))} /></label>
              <label><span>{copy.fields.dueDate}</span><input type="date" value={form.dueDate} onChange={(event) => setForm((value) => ({ ...value, dueDate: event.target.value }))} /></label>
              <label><span>{copy.fields.payee}</span><input value={form.payeeName} onChange={(event) => setForm((value) => ({ ...value, payeeName: event.target.value }))} /></label>
              <label className="form-field-span-2"><span>{copy.fields.notes}</span><input value={form.notes} onChange={(event) => setForm((value) => ({ ...value, notes: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!form.number || !form.amount || !form.bankName}>{copy.createSubmit}</button>
          </form>
          {message ? <QueryFeedback title={copy.successTitle} message={message} /> : null}
          {errorMessage ? <QueryFeedback title={copy.errorTitle} message={errorMessage} tone="error" /> : null}
        </article>
      </section>

      <section className="surface-panel">
        {loading ? (
          <QueryFeedback title={copy.loadingTitle} message={copy.loadingMessage} />
        ) : error ? (
          <QueryFeedback title={copy.loadErrorTitle} message={error} tone="error" />
        ) : (
          <div className="table-shell">
            <table>
              <thead><tr><th>{copy.table.id}</th><th>{copy.table.number}</th><th>{copy.table.bank}</th><th>{copy.table.amount}</th><th>{copy.table.type}</th><th>{copy.table.dueDate}</th><th>{copy.table.status}</th><th>{copy.table.actions}</th></tr></thead>
              <tbody>
                {(data?.items ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.number}</td>
                    <td>{item.bank_name}</td>
                    <td>{item.amount.toLocaleString(numberLocale)} {copy.table.currencySuffix}</td>
                    <td>{item.type}</td>
                    <td>{item.due_date}</td>
                    <td>{item.status || copy.table.emptyValue}</td>
                    <td>
                      <button className="secondary-button compact-pill" type="button" onClick={() => handleStatus(item.id, "collected")}>{copy.actions.collected}</button>
                      <button className="secondary-button compact-pill" type="button" onClick={() => handleStatus(item.id, "bounced")}>{copy.actions.bounced}</button>
                    </td>
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
