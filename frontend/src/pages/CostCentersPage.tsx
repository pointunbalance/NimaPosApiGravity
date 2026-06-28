import { FormEvent, useState } from "react";

import { createCostCenter, getCostCenters } from "../app/api/accounting";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialForm = { name: "", code: "", description: "", budget: "" };

export function CostCentersPage() {
  const { session } = useAuth();
  const { locale, messages } = useI18n();
  const copy = messages.costCenters;
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, loading, error } = useAsyncValue(session ? () => getCostCenters(session.token) : null, [session?.token, refreshKey]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createCostCenter(session.token, {
        name: form.name,
        code: form.code,
        description: form.description,
        budget: Number(form.budget) || undefined
      });
      setForm(initialForm);
      setRefreshKey((value) => value + 1);
      setMessage(`${copy.createdMessagePrefix} ${created.code}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title={copy.title} subtitle={copy.subtitle} />

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">{copy.newEyebrow}</span>
          <h3>{copy.newTitle}</h3>
          <form className="auth-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <label><span>{copy.fields.name}</span><input value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} /></label>
              <label><span>{copy.fields.code}</span><input value={form.code} onChange={(event) => setForm((value) => ({ ...value, code: event.target.value }))} /></label>
              <label><span>{copy.fields.budget}</span><input inputMode="decimal" value={form.budget} onChange={(event) => setForm((value) => ({ ...value, budget: event.target.value }))} /></label>
              <label className="form-field-span-2"><span>{copy.fields.description}</span><input value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!form.name || !form.code}>{copy.createSubmit}</button>
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
              <thead><tr><th>{copy.table.id}</th><th>{copy.table.code}</th><th>{copy.table.name}</th><th>{copy.table.budget}</th><th>{copy.table.description}</th></tr></thead>
              <tbody>
                {(data ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.code}</td>
                    <td>{item.name}</td>
                    <td>{(item.budget ?? 0).toLocaleString(numberLocale)} {copy.table.currencySuffix}</td>
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
