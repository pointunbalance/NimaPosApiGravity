import { FormEvent, useState } from "react";

import { createStockAdjustment, getStockAdjustments } from "../app/api/stockAdjustments";
import { getProducts } from "../app/api/products";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const today = new Date().toISOString().slice(0, 10);

export function StockAdjustmentsPage() {
  const { session } = useAuth();
  const { locale, messages } = useI18n();
  const copy = messages.stockAdjustments;
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";
  const [refreshKey, setRefreshKey] = useState(0);
  const [productId, setProductId] = useState("");
  const [type, setType] = useState("increase");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("correction");
  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: products } = useAsyncValue(session ? () => getProducts(session.token) : null, [session?.token]);
  const { data, loading, error } = useAsyncValue(session ? () => getStockAdjustments(session.token) : null, [session?.token, refreshKey]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !productId || !quantity) return;
    const product = products?.items.find((item) => String(item.id) === productId);
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createStockAdjustment(session.token, {
        product_id: Number(productId),
        product_name: product?.name || "",
        type,
        quantity: Number(quantity) || 0,
        reason,
        date,
        notes,
        warehouse_id: 1,
        warehouse_name: "Main"
      });
      setQuantity("");
      setNotes("");
      setRefreshKey((value) => value + 1);
      setMessage(`${copy.createdMessagePrefix} ${created.id} ${copy.createdMessageMiddle} ${created.delta.toLocaleString(numberLocale)} ${copy.createdMessageSuffix}`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title={copy.title} subtitle={copy.subtitle} />
      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">{copy.entryEyebrow}</span>
          <h3>{copy.entryTitle}</h3>
          <form className="auth-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <label>
                <span>{copy.fields.product}</span>
                <select value={productId} onChange={(event) => setProductId(event.target.value)}>
                  <option value="">{copy.selectProduct}</option>
                  {(products?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label><span>{copy.fields.type}</span><select value={type} onChange={(event) => setType(event.target.value)}><option value="increase">increase</option><option value="decrease">decrease</option></select></label>
              <label><span>{copy.fields.quantity}</span><input inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
              <label><span>{copy.fields.reason}</span><input value={reason} onChange={(event) => setReason(event.target.value)} /></label>
              <label><span>{copy.fields.date}</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
              <label className="form-field-span-2"><span>{copy.fields.notes}</span><input value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
            </div>
            <button className="primary-button" disabled={!productId || !quantity} type="submit">{copy.executeSubmit}</button>
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
              <thead><tr><th>{copy.table.id}</th><th>{copy.table.product}</th><th>{copy.table.type}</th><th>{copy.table.quantity}</th><th>{copy.table.reason}</th><th>{copy.table.date}</th></tr></thead>
              <tbody>
                {data?.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.product_name || item.product_id}</td>
                    <td>{item.type}</td>
                    <td>{item.quantity}</td>
                    <td>{item.reason}</td>
                    <td>{item.date}</td>
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
