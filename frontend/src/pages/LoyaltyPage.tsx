import { FormEvent, useMemo, useState } from "react";

import { getCustomers } from "../app/api/customers";
import { addLoyaltyTransaction, bulkLoyaltyPoints, getLoyaltyHistory, getLoyaltySettings, getLoyaltyTiers } from "../app/api/advanced";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialForm = { customerId: "", points: "", type: "bonus", note: "" };

export function LoyaltyPage() {
  const { session } = useAuth();
  const { locale, messages } = useI18n();
  const copy = messages.loyalty;
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: customers } = useAsyncValue(session ? () => getCustomers(session.token) : null, [session?.token]);
  const { data: tiers } = useAsyncValue(session ? () => getLoyaltyTiers(session.token) : null, [session?.token, refreshKey]);
  const { data: settings } = useAsyncValue(session ? () => getLoyaltySettings(session.token) : null, [session?.token, refreshKey]);
  const { data: history, loading, error } = useAsyncValue(
    session && selectedCustomerId ? () => getLoyaltyHistory(session.token, Number(selectedCustomerId)) : null,
    [session?.token, selectedCustomerId, refreshKey]
  );

  const selectedCustomer = useMemo(
    () => customers?.items.find((item) => item.id === Number(selectedCustomerId)) ?? null,
    [customers, selectedCustomerId]
  );
  const balance = useMemo(() => (history?.items ?? []).reduce((sum, item) => sum + Number(item.points ?? 0), 0), [history]);

  const handleAddPoints = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await addLoyaltyTransaction(session.token, {
        customer_id: Number(form.customerId),
        points: Number(form.points || 0),
        type: form.type,
        note: form.note || undefined
      });
      setForm(initialForm);
      setSelectedCustomerId(form.customerId);
      setRefreshKey((value) => value + 1);
      setMessage(copy.addedMessage);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleBulkWelcome = async () => {
    if (!session || !customers?.items.length) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const result = await bulkLoyaltyPoints(session.token, {
        customer_ids: customers.items.slice(0, 5).map((item) => item.id),
        points: Number(settings?.welcome_bonus ?? 10),
        reason: "Welcome bonus batch"
      });
      setRefreshKey((value) => value + 1);
      setMessage(result.message || copy.bulkDefaultMessage);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title={copy.title} subtitle={copy.subtitle} />
      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">{copy.cards.customers}</span><strong>{(customers?.items.length ?? 0).toLocaleString(numberLocale)}</strong><p>{copy.cards.customersNote}</p></article>
        <article className="stat-card"><span className="eyebrow">{copy.cards.tiers}</span><strong>{(tiers?.length ?? 0).toLocaleString(numberLocale)}</strong><p>{copy.cards.tiersNote}</p></article>
        <article className="stat-card"><span className="eyebrow">{copy.cards.balance}</span><strong>{balance.toLocaleString(numberLocale)}</strong><p>{copy.cards.balanceNote}</p></article>
      </section>
      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">{copy.entryEyebrow}</span>
          <h3>{copy.entryTitle}</h3>
          <form className="auth-form" onSubmit={handleAddPoints}>
            <div className="form-grid">
              <label><span>{copy.fields.customer}</span><select value={form.customerId} onChange={(event) => setForm((value) => ({ ...value, customerId: event.target.value }))}><option value="">{copy.selectCustomer}</option>{(customers?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label><span>{copy.fields.points}</span><input type="number" value={form.points} onChange={(event) => setForm((value) => ({ ...value, points: event.target.value }))} /></label>
              <label><span>{copy.fields.type}</span><select value={form.type} onChange={(event) => setForm((value) => ({ ...value, type: event.target.value }))}><option value="bonus">{copy.types.bonus}</option><option value="earn">{copy.types.earn}</option><option value="redeem">{copy.types.redeem}</option><option value="manual_deduct">{copy.types.manual_deduct}</option></select></label>
              <label><span>{copy.fields.note}</span><input value={form.note} onChange={(event) => setForm((value) => ({ ...value, note: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!form.customerId || !form.points}>{copy.addTransaction}</button>
          </form>
          <button type="button" className="secondary-button" onClick={handleBulkWelcome}>{copy.bulkWelcome}</button>
          {message ? <QueryFeedback title={copy.successTitle} message={message} /> : null}
          {errorMessage ? <QueryFeedback title={copy.errorTitle} message={errorMessage} tone="error" /> : null}
        </article>
        <article className="surface-panel">
          <span className="eyebrow">{copy.settingsEyebrow}</span>
          <div className="table-shell">
            <table>
              <thead><tr><th>{copy.settingsTable.enabled}</th><th>{copy.settingsTable.pointsPerCurrency}</th><th>{copy.settingsTable.currencyPerPoint}</th><th>{copy.settingsTable.minRedeem}</th><th>{copy.settingsTable.welcomeBonus}</th></tr></thead>
              <tbody>
                <tr>
                  <td>{settings?.enabled ? copy.settingsTable.yes : copy.settingsTable.no}</td>
                  <td>{Number(settings?.points_per_currency ?? 0).toLocaleString(numberLocale)}</td>
                  <td>{Number(settings?.currency_per_point ?? 0).toLocaleString(numberLocale)}</td>
                  <td>{Number(settings?.min_points_to_redeem ?? 0).toLocaleString(numberLocale)}</td>
                  <td>{Number(settings?.welcome_bonus ?? 0).toLocaleString(numberLocale)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>
      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">{copy.tiersEyebrow}</span>
          <div className="table-shell">
            <table>
              <thead><tr><th>{copy.tiersTable.tier}</th><th>{copy.tiersTable.minPoints}</th><th>{copy.tiersTable.multiplier}</th><th>{copy.tiersTable.color}</th></tr></thead>
              <tbody>
                {(tiers ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.min_points}</td>
                    <td>{item.multiplier}</td>
                    <td>{item.color || copy.tiersTable.emptyValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
        <article className="surface-panel">
          <span className="eyebrow">{copy.historyEyebrow}</span>
          <div className="form-grid">
            <label><span>{copy.fields.customer}</span><select value={selectedCustomerId} onChange={(event) => setSelectedCustomerId(event.target.value)}><option value="">{copy.selectCustomer}</option>{(customers?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          </div>
          {selectedCustomer ? <p className="muted-text">{copy.historyCustomerPrefix} {selectedCustomer.name}</p> : null}
          {loading ? <QueryFeedback title={copy.loadingHistoryTitle} message={copy.loadingHistoryMessage} /> : error ? <QueryFeedback title={copy.loadHistoryErrorTitle} message={error} tone="error" /> : (
            <div className="table-shell">
              <table>
                <thead><tr><th>{copy.historyTable.type}</th><th>{copy.historyTable.points}</th><th>{copy.historyTable.reference}</th><th>{copy.historyTable.note}</th><th>{copy.historyTable.time}</th></tr></thead>
                <tbody>
                  {(history?.items ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>{copy.types[item.type as keyof typeof copy.types] || item.type}</td>
                      <td>{item.points}</td>
                      <td>{item.order_id || copy.historyTable.emptyValue}</td>
                      <td>{item.note || copy.historyTable.emptyValue}</td>
                      <td>{item.created_at || copy.historyTable.emptyValue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
