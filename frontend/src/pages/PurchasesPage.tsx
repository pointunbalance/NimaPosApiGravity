import { FormEvent, useMemo, useState } from "react";

import { getPurchasesBySupplier, createPurchase } from "../app/api/purchases";
import { getSuppliers } from "../app/api/suppliers";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

export function PurchasesPage() {
  const { session } = useAuth();
  const { locale, messages } = useI18n();
  const copy = messages.purchases;
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";
  const [refreshKey, setRefreshKey] = useState(0);
  const [supplierId, setSupplierId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { data: suppliers } = useAsyncValue(session ? () => getSuppliers(session.token) : null, [session?.token]);
  const { data, loading, error } = useAsyncValue(
    session && supplierId ? () => getPurchasesBySupplier(session.token, Number(supplierId)) : null,
    [session?.token, supplierId, refreshKey]
  );
  const selectedSupplier = useMemo(() => suppliers?.items.find((item) => String(item.id) === supplierId), [suppliers?.items, supplierId]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !supplierId) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createPurchase(session.token, {
        supplier_id: Number(supplierId),
        supplier_name: selectedSupplier?.name || "",
        date: new Date().toISOString().slice(0, 10),
        subtotal: Number(totalAmount) || 0,
        total_amount: Number(totalAmount) || 0,
        invoice_number: invoiceNumber,
        notes
      });
      setRefreshKey((value) => value + 1);
      setInvoiceNumber("");
      setTotalAmount("");
      setNotes("");
      setMessage(`${copy.createdMessagePrefix} ${created.id}.`);
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
              <label>
                <span>{copy.fields.supplier}</span>
                <select value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>
                  <option value="">{copy.selectSupplier}</option>
                  {(suppliers?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label><span>{copy.fields.invoiceNumber}</span><input value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} /></label>
              <label><span>{copy.fields.totalAmount}</span><input inputMode="decimal" value={totalAmount} onChange={(event) => setTotalAmount(event.target.value)} /></label>
              <label><span>{copy.fields.notes}</span><input value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
            </div>
            <button className="primary-button" disabled={!supplierId || !totalAmount} type="submit">{copy.createSubmit}</button>
          </form>
          {message ? <QueryFeedback title={copy.successTitle} message={message} /> : null}
          {errorMessage ? <QueryFeedback title={copy.errorTitle} message={errorMessage} tone="error" /> : null}
        </article>
        <article className="surface-panel">
          <span className="eyebrow">{copy.contextEyebrow}</span>
          <h3>{selectedSupplier?.name || copy.contextTitleIdle}</h3>
          <p>{copy.contextBody}</p>
        </article>
      </section>
      <section className="surface-panel">
        {!supplierId ? (
          <QueryFeedback title={copy.emptySupplierTitle} message={copy.emptySupplierMessage} />
        ) : loading ? (
          <QueryFeedback title={copy.loadingTitle} message={copy.loadingMessage} />
        ) : error ? (
          <QueryFeedback title={copy.loadErrorTitle} message={error} tone="error" />
        ) : (
          <div className="table-shell">
            <table>
              <thead><tr><th>{copy.table.id}</th><th>{copy.table.date}</th><th>{copy.table.invoiceNumber}</th><th>{copy.table.totalAmount}</th><th>{copy.table.status}</th></tr></thead>
              <tbody>
                {data?.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.date || copy.table.emptyValue}</td>
                    <td>{item.invoice_number || copy.table.emptyValue}</td>
                    <td>{(item.total_amount ?? 0).toLocaleString(numberLocale)} {copy.table.currencySuffix}</td>
                    <td>{item.is_void ? copy.voided : copy.active}</td>
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
