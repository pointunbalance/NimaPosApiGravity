import { FormEvent, useMemo, useState } from "react";

import { createCustomerPayment, getCustomerPayments } from "../app/api/customerPayments";
import { getCustomers } from "../app/api/customers";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

export function CustomerPaymentsPage() {
  const { session } = useAuth();
  const { locale, messages } = useI18n();
  const copy = messages.customerPayments;
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";
  const [refreshKey, setRefreshKey] = useState(0);
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("debt_payment");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: customers } = useAsyncValue(session ? () => getCustomers(session.token) : null, [session?.token, refreshKey]);
  const { data, loading, error } = useAsyncValue(session && customerId ? () => getCustomerPayments(session.token, Number(customerId)) : null, [session?.token, customerId, refreshKey]);

  const selectedCustomer = useMemo(() => customers?.items.find((item) => String(item.id) === customerId) ?? null, [customers?.items, customerId]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !customerId) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createCustomerPayment(session.token, {
        customer_id: Number(customerId),
        amount: Number(amount) || 0,
        type,
        note,
        recorded_by: session.user.username
      });
      setAmount("");
      setNote("");
      setRefreshKey((value) => value + 1);
      setMessage(created.message ?? copy.successTitle);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title={copy.title} subtitle={copy.subtitle} />
      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">{copy.formEyebrow}</span>
          <h3>{copy.formTitle}</h3>
          <form className="auth-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <label>
                <span>{copy.fields.customer}</span>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  <option value="">{copy.selectCustomer}</option>
                  {(customers?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label><span>{copy.fields.currentBalance}</span><input disabled value={selectedCustomer ? `${(selectedCustomer.balance ?? 0).toLocaleString(numberLocale)}` : copy.cashValue} /></label>
              <label><span>{copy.fields.amount}</span><input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
              <label><span>{copy.fields.type}</span><select value={type} onChange={(e) => setType(e.target.value)}><option value="debt_payment">debt_payment</option><option value="wallet_topup">wallet_topup</option></select></label>
              <label className="form-field-span-2"><span>{copy.fields.note}</span><input value={note} onChange={(e) => setNote(e.target.value)} /></label>
            </div>
            <button className="primary-button" disabled={!customerId || !amount} type="submit">{copy.submit}</button>
          </form>
          {message ? <QueryFeedback title={copy.successTitle} message={message} /> : null}
          {errorMessage ? <QueryFeedback title={copy.errorTitle} message={errorMessage} tone="error" /> : null}
        </article>
      </section>
      <section className="surface-panel">
        {!customerId ? (
          <QueryFeedback title={copy.emptyTitle} message={copy.emptyMessage} />
        ) : loading ? (
          <QueryFeedback title={copy.loadingTitle} message={copy.loadingMessage} />
        ) : error ? (
          <QueryFeedback title={copy.loadErrorTitle} message={error} tone="error" />
        ) : (
          <div className="table-shell">
            <table>
              <thead><tr><th>{copy.table.id}</th><th>{copy.table.date}</th><th>{copy.table.type}</th><th>{copy.table.amount}</th><th>{copy.table.note}</th></tr></thead>
              <tbody>
                {data?.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.date || "-"}</td>
                    <td>{item.type}</td>
                    <td>{item.amount.toLocaleString(numberLocale)}</td>
                    <td>{item.note || "-"}</td>
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
