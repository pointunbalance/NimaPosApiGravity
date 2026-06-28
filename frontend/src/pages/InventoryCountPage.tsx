import { FormEvent, useMemo, useState } from "react";

import { createInventoryCount, finalizeInventoryCount, getInventoryCount, getInventoryCounts } from "../app/api/inventoryCounts";
import { getProducts, type ProductRow } from "../app/api/products";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

type DraftCountItem = {
  product_id: number;
  product_name: string;
  system_qty: number;
  actual_qty: string;
  unit_cost: string;
  notes: string;
};

const emptyDraft = {
  title: "",
  notes: "",
  selectedProductId: "",
  actualQty: "",
  unitCost: "",
  itemNotes: ""
};

export function InventoryCountPage() {
  const { session } = useAuth();
  const { locale, messages } = useI18n();
  const copy = messages.inventoryCount;
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";
  const [refreshKey, setRefreshKey] = useState(0);
  const [draft, setDraft] = useState(emptyDraft);
  const [draftItems, setDraftItems] = useState<DraftCountItem[]>([]);
  const [selectedCountId, setSelectedCountId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: products } = useAsyncValue(session ? () => getProducts(session.token) : null, [session?.token]);
  const { data: counts, loading, error } = useAsyncValue(session ? () => getInventoryCounts(session.token) : null, [session?.token, refreshKey]);
  const { data: countDetails } = useAsyncValue(
    session && selectedCountId ? () => getInventoryCount(session.token, selectedCountId) : null,
    [session?.token, selectedCountId, refreshKey]
  );

  const selectedProduct = useMemo(
    () => products?.items.find((item) => String(item.id) === draft.selectedProductId) ?? null,
    [products?.items, draft.selectedProductId]
  );

  const addDraftItem = () => {
    if (!selectedProduct || !draft.actualQty) return;
    const nextItem: DraftCountItem = {
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      system_qty: selectedProduct.stock_qty ?? 0,
      actual_qty: draft.actualQty,
      unit_cost: draft.unitCost || "0",
      notes: draft.itemNotes
    };
    setDraftItems((items) => [...items, nextItem]);
    setDraft((value) => ({ ...value, selectedProductId: "", actualQty: "", unitCost: "", itemNotes: "" }));
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !draft.title || draftItems.length === 0) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createInventoryCount(session.token, {
        title: draft.title,
        warehouse_id: 1,
        status: "draft",
        counted_by: session.user.username,
        notes: draft.notes,
        items: draftItems.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          system_qty: item.system_qty,
          actual_qty: Number(item.actual_qty) || 0,
          unit_cost: Number(item.unit_cost) || 0,
          notes: item.notes
        }))
      });
      setDraft(emptyDraft);
      setDraftItems([]);
      setSelectedCountId(created.id);
      setRefreshKey((value) => value + 1);
      setMessage(`${copy.createdMessagePrefix} ${created.id}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleFinalize = async () => {
    if (!session || !selectedCountId) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const result = await finalizeInventoryCount(session.token, selectedCountId, session.user.username);
      setRefreshKey((value) => value + 1);
      setMessage(result.message);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const removeDraftItem = (productId: number) => {
    setDraftItems((items) => items.filter((item) => item.product_id !== productId));
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
              <label><span>{copy.fields.title}</span><input value={draft.title} onChange={(event) => setDraft((value) => ({ ...value, title: event.target.value }))} /></label>
              <label>
                <span>{copy.fields.product}</span>
                <select value={draft.selectedProductId} onChange={(event) => setDraft((value) => ({ ...value, selectedProductId: event.target.value }))}>
                  <option value="">{copy.selectProduct}</option>
                  {(products?.items ?? []).map((item: ProductRow) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </label>
              <label><span>{copy.fields.actualQty}</span><input inputMode="decimal" value={draft.actualQty} onChange={(event) => setDraft((value) => ({ ...value, actualQty: event.target.value }))} /></label>
              <label><span>{copy.fields.unitCost}</span><input inputMode="decimal" value={draft.unitCost} onChange={(event) => setDraft((value) => ({ ...value, unitCost: event.target.value }))} /></label>
              <label className="form-field-span-2"><span>{copy.fields.countNotes}</span><input value={draft.notes} onChange={(event) => setDraft((value) => ({ ...value, notes: event.target.value }))} /></label>
              <label className="form-field-span-2"><span>{copy.fields.itemNotes}</span><input value={draft.itemNotes} onChange={(event) => setDraft((value) => ({ ...value, itemNotes: event.target.value }))} /></label>
            </div>
            <div className="inline-actions">
              <button className="secondary-button compact-pill" onClick={addDraftItem} type="button" disabled={!selectedProduct || !draft.actualQty}>{copy.addLine}</button>
              <button className="primary-button" type="submit" disabled={!draft.title || draftItems.length === 0}>{copy.createSubmit}</button>
            </div>
          </form>
          {draftItems.length ? (
            <div className="table-shell">
              <table>
                <thead><tr><th>{copy.table.product}</th><th>{copy.table.systemQty}</th><th>{copy.table.actualQty}</th><th>{copy.table.unitCost}</th><th>{copy.table.action}</th></tr></thead>
                <tbody>
                  {draftItems.map((item) => (
                    <tr key={item.product_id}>
                      <td>{item.product_name}</td>
                      <td>{item.system_qty}</td>
                      <td>{item.actual_qty}</td>
                      <td>{item.unit_cost}</td>
                      <td><button className="secondary-button compact-pill" type="button" onClick={() => removeDraftItem(item.product_id)}>{copy.removeAction}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </article>
        <article className="surface-panel">
          <span className="eyebrow">{copy.detailsEyebrow}</span>
          <h3>{countDetails ? `${copy.detailsTitlePrefix} ${countDetails.title}` : copy.detailsTitleIdle}</h3>
          {countDetails ? (
            <>
              <p>{copy.labels.currentStatus}: <strong>{countDetails.status}</strong></p>
              <p>{copy.labels.totalProducts}: <strong>{countDetails.total_products ?? countDetails.items?.length ?? 0}</strong></p>
              <p>{copy.labels.variances}: <strong>{(countDetails.total_variance_value ?? 0).toLocaleString(numberLocale)} {copy.sessionsTable.currencySuffix}</strong></p>
              <button className="primary-button" disabled={countDetails.status !== "draft"} onClick={handleFinalize} type="button">{copy.finalizeSubmit}</button>
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
              <thead><tr><th>{copy.sessionsTable.id}</th><th>{copy.sessionsTable.title}</th><th>{copy.sessionsTable.status}</th><th>{copy.sessionsTable.products}</th><th>{copy.sessionsTable.variances}</th><th>{copy.sessionsTable.action}</th></tr></thead>
              <tbody>
                {(counts ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.title}</td>
                    <td>{item.status}</td>
                    <td>{item.total_products ?? 0}</td>
                    <td>{(item.total_variance_value ?? 0).toLocaleString(numberLocale)} {copy.sessionsTable.currencySuffix}</td>
                    <td><button className="secondary-button compact-pill" onClick={() => setSelectedCountId(item.id)} type="button">{copy.openAction}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {countDetails?.items?.length ? (
        <section className="surface-panel">
          <div className="table-shell">
            <table>
              <thead><tr><th>{copy.itemsTable.product}</th><th>{copy.itemsTable.systemQty}</th><th>{copy.itemsTable.actualQty}</th><th>{copy.itemsTable.variance}</th><th>{copy.itemsTable.value}</th></tr></thead>
              <tbody>
                {countDetails.items.map((item) => (
                  <tr key={`${item.count_id}-${item.product_id}`}>
                    <td>{item.product_name || item.product_id}</td>
                    <td>{item.system_qty}</td>
                    <td>{item.actual_qty}</td>
                    <td>{item.variance ?? (item.actual_qty - item.system_qty)}</td>
                    <td>{(item.variance_value ?? 0).toLocaleString(numberLocale)} {copy.itemsTable.currencySuffix}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
