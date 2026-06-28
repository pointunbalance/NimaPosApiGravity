import { FormEvent, useMemo, useState } from "react";

import { getAccounts } from "../app/api/accounting";
import { createTreasuryForecast, getTreasuryProjection, logBankImport } from "../app/api/treasury";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const today = new Date().toISOString().slice(0, 10);
const initialForecastForm = {
  forecastDate: today,
  estimatedInflow: "",
  estimatedOutflow: "",
  notes: ""
};
const initialImportForm = {
  accountId: "",
  filename: ""
};

export function TreasuryPage() {
  const { session } = useAuth();
  const { locale, messages } = useI18n();
  const copy = messages.treasury;
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";
  const [refreshKey, setRefreshKey] = useState(0);
  const [days, setDays] = useState("30");
  const [forecastForm, setForecastForm] = useState(initialForecastForm);
  const [importForm, setImportForm] = useState(initialImportForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const projectionDays = Number(days) || 30;
  const { data: projection, loading, error } = useAsyncValue(
    session ? () => getTreasuryProjection(session.token, projectionDays) : null,
    [session?.token, refreshKey, projectionDays]
  );
  const { data: accounts } = useAsyncValue(session ? () => getAccounts(session.token, "asset") : null, [session?.token]);

  const totals = useMemo(() => {
    return (projection ?? []).reduce(
      (accumulator, item) => ({
        inflow: accumulator.inflow + (item.inflow ?? 0),
        outflow: accumulator.outflow + (item.outflow ?? 0),
        net: accumulator.net + (item.net ?? 0)
      }),
      { inflow: 0, outflow: 0, net: 0 }
    );
  }, [projection]);

  const handleCreateForecast = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createTreasuryForecast(session.token, {
        forecast_date: forecastForm.forecastDate,
        estimated_inflow: Number(forecastForm.estimatedInflow) || 0,
        estimated_outflow: Number(forecastForm.estimatedOutflow) || 0,
        notes: forecastForm.notes
      });
      setForecastForm(initialForecastForm);
      setRefreshKey((value) => value + 1);
      setMessage(`${copy.createdForecastPrefix} ${created.id}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleLogImport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await logBankImport(session.token, {
        account_id: Number(importForm.accountId),
        filename: importForm.filename
      });
      setImportForm(initialImportForm);
      setMessage(`${copy.createdImportPrefix} ${created.id}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title={copy.title} subtitle={copy.subtitle} />

      <section className="surface-panel">
        <div className="form-grid">
          <label>
            <span>{copy.horizonLabel}</span>
            <select value={days} onChange={(event) => setDays(event.target.value)}>
              <option value="7">7</option>
              <option value="14">14</option>
              <option value="30">30</option>
              <option value="60">60</option>
            </select>
          </label>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">{copy.cards.inflow}</span><strong>{totals.inflow.toLocaleString(numberLocale)} {copy.table.currencySuffix}</strong><p>{copy.cards.inflowNote}</p></article>
        <article className="stat-card"><span className="eyebrow">{copy.cards.outflow}</span><strong>{totals.outflow.toLocaleString(numberLocale)} {copy.table.currencySuffix}</strong><p>{copy.cards.outflowNote}</p></article>
        <article className="stat-card"><span className="eyebrow">{copy.cards.net}</span><strong>{totals.net.toLocaleString(numberLocale)} {copy.table.currencySuffix}</strong><p>{copy.cards.netNote}</p></article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">{copy.forecastEyebrow}</span>
          <h3>{copy.forecastTitle}</h3>
          <form className="auth-form" onSubmit={handleCreateForecast}>
            <div className="form-grid">
              <label><span>{copy.fields.forecastDate}</span><input type="date" value={forecastForm.forecastDate} onChange={(event) => setForecastForm((value) => ({ ...value, forecastDate: event.target.value }))} /></label>
              <label><span>{copy.fields.estimatedInflow}</span><input inputMode="decimal" value={forecastForm.estimatedInflow} onChange={(event) => setForecastForm((value) => ({ ...value, estimatedInflow: event.target.value }))} /></label>
              <label><span>{copy.fields.estimatedOutflow}</span><input inputMode="decimal" value={forecastForm.estimatedOutflow} onChange={(event) => setForecastForm((value) => ({ ...value, estimatedOutflow: event.target.value }))} /></label>
              <label className="form-field-span-2"><span>{copy.fields.notes}</span><input value={forecastForm.notes} onChange={(event) => setForecastForm((value) => ({ ...value, notes: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!forecastForm.forecastDate}>{copy.saveForecast}</button>
          </form>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">{copy.importEyebrow}</span>
          <h3>{copy.importTitle}</h3>
          <form className="auth-form" onSubmit={handleLogImport}>
            <div className="form-grid">
              <label>
                <span>{copy.fields.account}</span>
                <select value={importForm.accountId} onChange={(event) => setImportForm((value) => ({ ...value, accountId: event.target.value }))}>
                  <option value="">{copy.selectAccount}</option>
                  {(accounts ?? []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} - {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label><span>{copy.fields.filename}</span><input value={importForm.filename} onChange={(event) => setImportForm((value) => ({ ...value, filename: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!importForm.accountId || !importForm.filename}>{copy.logImport}</button>
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
              <thead><tr><th>{copy.table.date}</th><th>{copy.table.inflow}</th><th>{copy.table.outflow}</th><th>{copy.table.net}</th><th>{copy.table.cumulativeNet}</th></tr></thead>
              <tbody>
                {(projection ?? []).map((item) => (
                  <tr key={item.date}>
                    <td>{item.date}</td>
                    <td>{(item.inflow ?? 0).toLocaleString(numberLocale)} {copy.table.currencySuffix}</td>
                    <td>{(item.outflow ?? 0).toLocaleString(numberLocale)} {copy.table.currencySuffix}</td>
                    <td>{(item.net ?? 0).toLocaleString(numberLocale)} {copy.table.currencySuffix}</td>
                    <td>{(item.cumulative_net ?? 0).toLocaleString(numberLocale)} {copy.table.currencySuffix}</td>
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
