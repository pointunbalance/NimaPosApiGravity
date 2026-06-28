import { FormEvent, useMemo, useState } from "react";

import { createPurchaseOrder, convertPurchaseOrder, getPurchaseOrder, getPurchaseOrders } from "../app/api/purchaseOrders";
import { getProducts } from "../app/api/products";
import { getSuppliers } from "../app/api/suppliers";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

type DraftPoItem = {
  product_id: number;
  product_name: string;
  ordered_qty: string;
  unit_price: string;
};

export function PurchaseOrdersPage() {
  const { session } = useAuth();
  const { locale, messages } = useI18n();
  const copy = messages.purchaseOrders;
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";
  const [refreshKey, setRefreshKey] = useState(0);
  const [supplierId, setSupplierId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [orderedQty, setOrderedQty] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [draftItems, setDraftItems] = useState<DraftPoItem[]>([]);
  const [selectedPoId, setSelectedPoId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: suppliers } = useAsyncValue(session ? () => getSuppliers(session.token) : null, [session?.token]);
  const { data: products } = useAsyncValue(session ? () => getProducts(session.token) : null, [session?.token]);
  const { data: orders, loading, error } = useAsyncValue(session ? () => getPurchaseOrders(session.token) : null, [session?.token, refreshKey]);
  const { data: details } = useAsyncValue(
    session && selectedPoId ? () => getPurchaseOrder(session.token, selectedPoId) : null,
    [session?.token, selectedPoId, refreshKey]
  );

  const selectedSupplier = useMemo(
    () => suppliers?.items.find((item) => String(item.id) === supplierId) ?? null,
    [suppliers?.items, supplierId]
  );
  const selectedProduct = useMemo(
    () => products?.items.find((item) => String(item.id) === selectedProductId) ?? null,
    [products?.items, selectedProductId]
  );

  const addDraftItem = () => {
    if (!selectedProduct || !orderedQty || !unitPrice) return;
    setDraftItems((items) => [
      ...items,
      {
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        ordered_qty: orderedQty,
        unit_price: unitPrice
      }
    ]);
    setSelectedProductId("");
    setOrderedQty("");
    setUnitPrice("");
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !selectedSupplier || draftItems.length === 0) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createPurchaseOrder(session.token, {
        supplier_id: selectedSupplier.id,
        supplier_name: selectedSupplier.name,
        expected_date: expectedDate || undefined,
        notes,
        created_by: session.user.username,
        items: draftItems.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          ordered_qty: Number(item.ordered_qty) || 0,
          unit_price: Number(item.unit_price) || 0
        }))
      });
      setSupplierId("");
      setExpectedDate("");
      setNotes("");
      setDraftItems([]);
      setSelectedPoId(created.id);
      setRefreshKey((value) => value + 1);
      setMessage(`${copy.createdMessagePrefix} ${created.id}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleConvert = async () => {
    if (!session || !selectedPoId) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const result = await convertPurchaseOrder(session.token, selectedPoId);
      setRefreshKey((value) => value + 1);
      setMessage(`${copy.convertedMessagePrefix} ${result.purchase_id}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title={copy.title} subtitle={copy.subtitle} />
      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">{copy.builderEyebrow}</span>
          <h3>{copy.builderTitle}</h3>
          <form className="auth-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <label>
                <span>{copy.fields.supplier}</span>
                <select value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>
                  <option value="">{copy.selectSupplier}</option>
                  {(suppliers?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label><span>{copy.fields.expectedDate}</span><input type="date" value={expectedDate} onChange={(event) => setExpectedDate(event.target.value)} /></label>
              <label className="form-field-span-2"><span>{copy.fields.notes}</span><input value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
              <label>
                <span>{copy.fields.product}</span>
                <select value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)}>
                  <option value="">{copy.selectProduct}</option>
                  {(products?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label><span>{copy.fields.quantity}</span><input inputMode="decimal" value={orderedQty} onChange={(event) => setOrderedQty(event.target.value)} /></label>
              <label><span>{copy.fields.unitPrice}</span><input inputMode="decimal" value={unitPrice} onChange={(event) => setUnitPrice(event.target.value)} /></label>
            </div>
            <div className="inline-actions">
              <button className="secondary-button compact-pill" type="button" onClick={addDraftItem} disabled={!selectedProduct || !orderedQty || !unitPrice}>{copy.addLine}</button>
              <button className="primary-button" type="submit" disabled={!selectedSupplier || draftItems.length === 0}>{copy.createSubmit}</button>
            </div>
          </form>
          {draftItems.length ? (
            <div className="table-shell">
              <table>
                <thead><tr><th>{copy.table.product}</th><th>{copy.table.quantity}</th><th>{copy.table.unitPrice}</th><th>{copy.table.total}</th></tr></thead>
                <tbody>
                  {draftItems.map((item, index) => (
                    <tr key={`${item.product_id}-${index}`}>
                      <td>{item.product_name}</td>
                      <td>{item.ordered_qty}</td>
                      <td>{item.unit_price}</td>
                      <td>{((Number(item.ordered_qty) || 0) * (Number(item.unit_price) || 0)).toLocaleString(numberLocale)} {copy.table.currencySuffix}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </article>
        <article className="surface-panel">
          <span className="eyebrow">{copy.detailsEyebrow}</span>
          <h3>{details?.po_number || copy.detailsTitleIdle}</h3>
          {details ? (
            <>
              <p>{copy.labels.supplier}: <strong>{details.supplier_name || details.supplier_id}</strong></p>
              <p>{copy.labels.status}: <strong>{details.status}</strong></p>
              <p>{copy.labels.total}: <strong>{(details.total_amount ?? 0).toLocaleString(numberLocale)} {copy.table.currencySuffix}</strong></p>
              <button className="primary-button" type="button" disabled={details.status === "completed"} onClick={handleConvert}>{copy.convertSubmit}</button>
            </>
          ) : (
            <p>{copy.emptyDetailsMessage}</p>
          )}
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
              <thead><tr><th>{copy.table.id}</th><th>{copy.table.reference}</th><th>{copy.table.supplier}</th><th>{copy.table.status}</th><th>{copy.table.total}</th><th>{copy.table.action}</th></tr></thead>
              <tbody>
                {(orders ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.po_number || copy.table.emptyValue}</td>
                    <td>{item.supplier_name || item.supplier_id}</td>
                    <td>{item.status}</td>
                    <td>{(item.total_amount ?? 0).toLocaleString(numberLocale)} {copy.table.currencySuffix}</td>
                    <td><button className="secondary-button compact-pill" type="button" onClick={() => setSelectedPoId(item.id)}>{copy.openAction}</button></td>
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
