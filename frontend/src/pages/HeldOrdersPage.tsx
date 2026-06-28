import { FormEvent, useMemo, useState } from "react";

import { createHeldOrder, deleteHeldOrder, getHeldOrders } from "../app/api/heldOrders";
import { getCustomers } from "../app/api/customers";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

export function HeldOrdersPage() {
  const { session } = useAuth();
  const { messages } = useI18n();
  const copy = messages.heldOrders;
  const [refreshKey, setRefreshKey] = useState(0);
  const [customerId, setCustomerId] = useState("");
  const [itemsJson, setItemsJson] = useState("[]");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, loading, error } = useAsyncValue(session ? () => getHeldOrders(session.token) : null, [session?.token, refreshKey]);
  const { data: customers } = useAsyncValue(session ? () => getCustomers(session.token) : null, [session?.token]);
  const selectedCustomer = useMemo(() => customers?.items.find((item) => String(item.id) === customerId) ?? null, [customers?.items, customerId]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await createHeldOrder(session.token, {
        items_json: itemsJson,
        customer_id: customerId ? Number(customerId) : null,
        note
      });
      setItemsJson("[]");
      setNote("");
      setCustomerId("");
      setRefreshKey((value) => value + 1);
      setMessage(copy.createdMessage);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleDelete = async (heldOrderId: number) => {
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const result = await deleteHeldOrder(session.token, heldOrderId);
      setRefreshKey((value) => value + 1);
      setMessage(result.message);
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
                  <option value="">{copy.noCustomer}</option>
                  {(customers?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label><span>{copy.fields.selectedCustomer}</span><input disabled value={selectedCustomer?.name || copy.cashOrder} /></label>
              <label className="form-field-span-2"><span>{copy.fields.itemsJson}</span><input value={itemsJson} onChange={(e) => setItemsJson(e.target.value)} /></label>
              <label className="form-field-span-2"><span>{copy.fields.note}</span><input value={note} onChange={(e) => setNote(e.target.value)} /></label>
            </div>
            <button className="primary-button" type="submit">{copy.submit}</button>
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
              <thead><tr><th>{copy.table.id}</th><th>{copy.table.date}</th><th>{copy.table.customer}</th><th>{copy.table.note}</th><th>{copy.table.items}</th><th>{copy.table.action}</th></tr></thead>
              <tbody>
                {(data ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.date || "-"}</td>
                    <td>{item.customer_id || "-"}</td>
                    <td>{item.note || "-"}</td>
                    <td><code>{item.items_json || "[]"}</code></td>
                    <td><button className="secondary-button compact-pill" type="button" onClick={() => handleDelete(item.id)}>{copy.deleteAction}</button></td>
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
