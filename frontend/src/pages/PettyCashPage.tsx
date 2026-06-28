import { FormEvent, useMemo, useState } from "react";

import { createSafe, getSafeSummary, getSafes, getSafeTransfers, transferBetweenSafes, type SafeRow } from "../app/api/safes";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const today = new Date().toISOString().slice(0, 10);
const initialSafeForm = { name: "", balance: "", branchId: "1" };
const initialTransferForm = { fromSafeId: "", toSafeId: "", amount: "", notes: "" };

export function PettyCashPage() {
  const { session } = useAuth();
  const { locale, messages } = useI18n();
  const copy = messages.pettyCash;
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";
  const [refreshKey, setRefreshKey] = useState(0);
  const [safeForm, setSafeForm] = useState(initialSafeForm);
  const [transferForm, setTransferForm] = useState(initialTransferForm);
  const [selectedSafeId, setSelectedSafeId] = useState("");
  const [summaryDate, setSummaryDate] = useState(today);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: safes, loading, error } = useAsyncValue(session ? () => getSafes(session.token) : null, [session?.token, refreshKey]);
  const { data: transfers } = useAsyncValue(session ? () => getSafeTransfers(session.token, selectedSafeId ? Number(selectedSafeId) : undefined) : null, [session?.token, selectedSafeId, refreshKey]);
  const { data: safeSummary } = useAsyncValue(
    session && selectedSafeId ? () => getSafeSummary(session.token, Number(selectedSafeId), summaryDate) : null,
    [session?.token, selectedSafeId, summaryDate, refreshKey]
  );

  const totalBalance = useMemo(() => (safes ?? []).reduce((sum, item) => sum + (item.balance ?? 0), 0), [safes]);

  const selectSafe = (safe: SafeRow) => {
    setSelectedSafeId(String(safe.id));
  };

  const handleCreateSafe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createSafe(session.token, {
        name: safeForm.name,
        balance: Number(safeForm.balance) || 0,
        branch_id: Number(safeForm.branchId) || 1,
        is_active: 1
      });
      setSafeForm(initialSafeForm);
      setRefreshKey((value) => value + 1);
      setSelectedSafeId(String(created.id));
      setMessage(`${copy.createdSafePrefix} ${created.name}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleTransfer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const result = await transferBetweenSafes(session.token, {
        from_safe_id: Number(transferForm.fromSafeId),
        to_safe_id: Number(transferForm.toSafeId),
        amount: Number(transferForm.amount) || 0,
        notes: transferForm.notes
      });
      setTransferForm(initialTransferForm);
      setRefreshKey((value) => value + 1);
      setMessage(`${copy.createdTransferPrefix} ${result.transfer_id}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title={copy.title} subtitle={copy.subtitle} />

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">{copy.cards.safes}</span><strong>{(safes?.length ?? 0).toLocaleString(numberLocale)}</strong><p>{copy.cards.safesNote}</p></article>
        <article className="stat-card"><span className="eyebrow">{copy.cards.totalBalance}</span><strong>{totalBalance.toLocaleString(numberLocale)} {copy.table.currencySuffix}</strong><p>{copy.cards.totalBalanceNote}</p></article>
        <article className="stat-card"><span className="eyebrow">{copy.cards.netDailyFlow}</span><strong>{(safeSummary?.net_flow ?? 0).toLocaleString(numberLocale)} {copy.table.currencySuffix}</strong><p>{copy.cards.netDailyFlowNote}</p></article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">{copy.createEyebrow}</span>
          <h3>{copy.createTitle}</h3>
          <form className="auth-form" onSubmit={handleCreateSafe}>
            <div className="form-grid">
              <label><span>{copy.fields.name}</span><input value={safeForm.name} onChange={(event) => setSafeForm((value) => ({ ...value, name: event.target.value }))} /></label>
              <label><span>{copy.fields.openingBalance}</span><input inputMode="decimal" value={safeForm.balance} onChange={(event) => setSafeForm((value) => ({ ...value, balance: event.target.value }))} /></label>
              <label><span>{copy.fields.branch}</span><input inputMode="numeric" value={safeForm.branchId} onChange={(event) => setSafeForm((value) => ({ ...value, branchId: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!safeForm.name}>{copy.createSubmit}</button>
          </form>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">{copy.transferEyebrow}</span>
          <h3>{copy.transferTitle}</h3>
          <form className="auth-form" onSubmit={handleTransfer}>
            <div className="form-grid">
              <label><span>{copy.fields.from}</span><select value={transferForm.fromSafeId} onChange={(event) => setTransferForm((value) => ({ ...value, fromSafeId: event.target.value }))}><option value="">{copy.selectSafe}</option>{(safes ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label><span>{copy.fields.to}</span><select value={transferForm.toSafeId} onChange={(event) => setTransferForm((value) => ({ ...value, toSafeId: event.target.value }))}><option value="">{copy.selectSafe}</option>{(safes ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label><span>{copy.fields.amount}</span><input inputMode="decimal" value={transferForm.amount} onChange={(event) => setTransferForm((value) => ({ ...value, amount: event.target.value }))} /></label>
              <label className="form-field-span-2"><span>{copy.fields.notes}</span><input value={transferForm.notes} onChange={(event) => setTransferForm((value) => ({ ...value, notes: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!transferForm.fromSafeId || !transferForm.toSafeId || !transferForm.amount}>{copy.transferSubmit}</button>
          </form>
          {message ? <QueryFeedback title={copy.successTitle} message={message} /> : null}
          {errorMessage ? <QueryFeedback title={copy.errorTitle} message={errorMessage} tone="error" /> : null}
        </article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">{copy.summaryEyebrow}</span>
          <div className="form-grid">
            <label><span>{copy.fields.safe}</span><select value={selectedSafeId} onChange={(event) => setSelectedSafeId(event.target.value)}><option value="">{copy.selectSafe}</option>{(safes ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label><span>{copy.fields.date}</span><input type="date" value={summaryDate} onChange={(event) => setSummaryDate(event.target.value)} /></label>
          </div>
          {safeSummary ? (
            <div className="detail-grid">
              <div className="feedback-panel"><strong>{copy.receiptsTotal}</strong><p>{(safeSummary.receipts.total ?? 0).toLocaleString(numberLocale)} {copy.table.currencySuffix}</p></div>
              <div className="feedback-panel"><strong>{copy.paymentsTotal}</strong><p>{(safeSummary.payments.total ?? 0).toLocaleString(numberLocale)} {copy.table.currencySuffix}</p></div>
              <div className="feedback-panel"><strong>{copy.netToday}</strong><p>{(safeSummary.net_flow ?? 0).toLocaleString(numberLocale)} {copy.table.currencySuffix}</p></div>
            </div>
          ) : (
            <p>{copy.emptySummaryMessage}</p>
          )}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">{copy.safesEyebrow}</span>
          {loading ? (
            <QueryFeedback title={copy.loadingSafesTitle} message={copy.loadingSafesMessage} />
          ) : error ? (
            <QueryFeedback title={copy.loadSafesErrorTitle} message={error} tone="error" />
          ) : (
            <div className="table-shell">
              <table>
                <thead><tr><th>{copy.table.id}</th><th>{copy.table.name}</th><th>{copy.table.branch}</th><th>{copy.table.balance}</th><th>{copy.table.active}</th><th>{copy.table.action}</th></tr></thead>
                <tbody>
                  {(safes ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.name}</td>
                      <td>{item.branch_id ?? copy.table.emptyValue}</td>
                      <td>{(item.balance ?? 0).toLocaleString(numberLocale)} {copy.table.currencySuffix}</td>
                      <td>{item.is_active ? copy.table.yes : copy.table.no}</td>
                      <td><button className="secondary-button compact-pill" type="button" onClick={() => selectSafe(item)}>{copy.openAction}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>

      <section className="surface-panel">
        <span className="eyebrow">{copy.transfersEyebrow}</span>
        <div className="table-shell">
          <table>
            <thead><tr><th>{copy.table.id}</th><th>{copy.table.from}</th><th>{copy.table.to}</th><th>{copy.table.amount}</th><th>{copy.table.date}</th><th>{copy.table.notes}</th></tr></thead>
            <tbody>
              {(transfers ?? []).map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.from_safe_id}</td>
                  <td>{item.to_safe_id}</td>
                  <td>{(item.amount ?? 0).toLocaleString(numberLocale)} {copy.table.currencySuffix}</td>
                  <td>{item.transfer_date || copy.table.emptyValue}</td>
                  <td>{item.notes || copy.table.emptyValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
