import { FormEvent, useState } from "react";

import { createAccount, getAccounts } from "../app/api/accounting";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialForm = { code: "", name: "", type: "asset", description: "" };

export function ChartOfAccountsPage() {
  const { session } = useAuth();
  const { messages } = useI18n();
  const copy = messages.chartOfAccounts;
  const [refreshKey, setRefreshKey] = useState(0);
  const [typeFilter, setTypeFilter] = useState("");
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, loading, error } = useAsyncValue(
    session ? () => getAccounts(session.token, typeFilter || undefined) : null,
    [session?.token, refreshKey, typeFilter]
  );

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createAccount(session.token, form);
      setForm(initialForm);
      setRefreshKey((value) => value + 1);
      setMessage(`${copy.createdMessagePrefix} ${created.code} - ${created.name}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title={copy.title} subtitle={copy.subtitle} />

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">{copy.filterEyebrow}</span>
          <h3>{copy.filterTitle}</h3>
          <div className="form-grid">
            <label>
              <span>{copy.fields.type}</span>
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                <option value="">{copy.allTypes}</option>
                <option value="asset">{copy.accountTypes.asset}</option>
                <option value="liability">{copy.accountTypes.liability}</option>
                <option value="equity">{copy.accountTypes.equity}</option>
                <option value="revenue">{copy.accountTypes.revenue}</option>
                <option value="expense">{copy.accountTypes.expense}</option>
              </select>
            </label>
          </div>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">{copy.newEyebrow}</span>
          <h3>{copy.newTitle}</h3>
          <form className="auth-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <label><span>{copy.fields.code}</span><input value={form.code} onChange={(event) => setForm((value) => ({ ...value, code: event.target.value }))} /></label>
              <label><span>{copy.fields.name}</span><input value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} /></label>
              <label>
                <span>{copy.fields.type}</span>
                <select value={form.type} onChange={(event) => setForm((value) => ({ ...value, type: event.target.value }))}>
                  <option value="asset">{copy.accountTypes.asset}</option>
                  <option value="liability">{copy.accountTypes.liability}</option>
                  <option value="equity">{copy.accountTypes.equity}</option>
                  <option value="revenue">{copy.accountTypes.revenue}</option>
                  <option value="expense">{copy.accountTypes.expense}</option>
                </select>
              </label>
              <label className="form-field-span-2"><span>{copy.fields.description}</span><input value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!form.code || !form.name}>{copy.createSubmit}</button>
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
              <thead><tr><th>{copy.table.id}</th><th>{copy.table.code}</th><th>{copy.table.name}</th><th>{copy.table.type}</th><th>{copy.table.description}</th></tr></thead>
              <tbody>
                {(data ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.code}</td>
                    <td>{item.name}</td>
                    <td>{item.type}</td>
                    <td>{item.description || copy.table.emptyValue}</td>
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
