import { FormEvent, useMemo, useState } from "react";

import { createBranchTransfer, getBranchTransfer, getBranchTransfers, processBranchTransfer } from "../app/api/branchTransfers";
import { getProducts } from "../app/api/products";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

type DraftTransferItem = {
  product_id: number;
  product_name: string;
  requested_qty: string;
  unit_cost: string;
};

export function BranchTransfersPage() {
  const { session } = useAuth();
  const { messages } = useI18n();
  const copy = messages.branchTransfers;
  const [refreshKey, setRefreshKey] = useState(0);
  const [fromWarehouseId, setFromWarehouseId] = useState("1");
  const [toWarehouseId, setToWarehouseId] = useState("2");
  const [notes, setNotes] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [requestedQty, setRequestedQty] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [draftItems, setDraftItems] = useState<DraftTransferItem[]>([]);
  const [selectedTransferId, setSelectedTransferId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: products } = useAsyncValue(session ? () => getProducts(session.token) : null, [session?.token]);
  const { data: transfers, loading, error } = useAsyncValue(session ? () => getBranchTransfers(session.token) : null, [session?.token, refreshKey]);
  const { data: details } = useAsyncValue(
    session && selectedTransferId ? () => getBranchTransfer(session.token, selectedTransferId) : null,
    [session?.token, selectedTransferId, refreshKey]
  );

  const selectedProduct = useMemo(
    () => products?.items.find((item) => String(item.id) === selectedProductId) ?? null,
    [products?.items, selectedProductId]
  );

  const addDraftItem = () => {
    if (!selectedProduct || !requestedQty) return;
    setDraftItems((items) => [
      ...items,
      {
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        requested_qty: requestedQty,
        unit_cost: unitCost || "0"
      }
    ]);
    setSelectedProductId("");
    setRequestedQty("");
    setUnitCost("");
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || draftItems.length === 0) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createBranchTransfer(session.token, {
        from_warehouse_id: Number(fromWarehouseId),
        to_warehouse_id: Number(toWarehouseId),
        requested_by: session.user.username,
        notes,
        items: draftItems.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          requested_qty: Number(item.requested_qty) || 0,
          unit_cost: Number(item.unit_cost) || 0
        }))
      });
      setDraftItems([]);
      setNotes("");
      setSelectedTransferId(created.id);
      setRefreshKey((value) => value + 1);
      setMessage(`${copy.createdMessagePrefix} ${created.id}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleProcess = async (status: "sent" | "completed") => {
    if (!session || !details?.items?.length || !selectedTransferId) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const result = await processBranchTransfer(session.token, selectedTransferId, {
        status,
        approved_by: session.user.username,
        sent_qty_updates:
          status === "sent"
            ? details.items.map((item) => ({ item_id: item.id || 0, sent_qty: item.requested_qty }))
            : undefined,
        received_qty_updates:
          status === "completed"
            ? details.items.map((item) => ({ item_id: item.id || 0, received_qty: item.sent_qty || item.requested_qty }))
            : undefined
      });
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
          <span className="eyebrow">{copy.builderEyebrow}</span>
          <h3>{copy.builderTitle}</h3>
          <form className="auth-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <label><span>{copy.fields.fromWarehouse}</span><input inputMode="numeric" value={fromWarehouseId} onChange={(event) => setFromWarehouseId(event.target.value)} /></label>
              <label><span>{copy.fields.toWarehouse}</span><input inputMode="numeric" value={toWarehouseId} onChange={(event) => setToWarehouseId(event.target.value)} /></label>
              <label className="form-field-span-2"><span>{copy.fields.notes}</span><input value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
              <label>
                <span>{copy.fields.product}</span>
                <select value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)}>
                  <option value="">{copy.selectProduct}</option>
                  {(products?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label><span>{copy.fields.requestedQty}</span><input inputMode="decimal" value={requestedQty} onChange={(event) => setRequestedQty(event.target.value)} /></label>
              <label><span>{copy.fields.unitCost}</span><input inputMode="decimal" value={unitCost} onChange={(event) => setUnitCost(event.target.value)} /></label>
            </div>
            <div className="inline-actions">
              <button className="secondary-button compact-pill" type="button" onClick={addDraftItem} disabled={!selectedProduct || !requestedQty}>{copy.addLine}</button>
              <button className="primary-button" type="submit" disabled={draftItems.length === 0}>{copy.createSubmit}</button>
            </div>
          </form>
        </article>
        <article className="surface-panel">
          <span className="eyebrow">{copy.detailsEyebrow}</span>
          <h3>{details?.reference || copy.detailsTitleIdle}</h3>
          {details ? (
            <>
              <p>{copy.labels.status}: <strong>{details.status}</strong></p>
              <p>{copy.labels.fromToPrefix} <strong>{details.from_warehouse_id}</strong> {copy.fromToConnector} <strong>{details.to_warehouse_id}</strong></p>
              <div className="inline-actions">
                <button className="secondary-button compact-pill" type="button" disabled={details.status !== "pending"} onClick={() => handleProcess("sent")}>{copy.sendSubmit}</button>
                <button className="primary-button" type="button" disabled={details.status !== "sent"} onClick={() => handleProcess("completed")}>{copy.receiveSubmit}</button>
              </div>
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
              <thead><tr><th>{copy.table.id}</th><th>{copy.table.reference}</th><th>{copy.table.from}</th><th>{copy.table.to}</th><th>{copy.table.status}</th><th>{copy.table.action}</th></tr></thead>
              <tbody>
                {(transfers ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.reference || copy.table.emptyValue}</td>
                    <td>{item.from_warehouse_id}</td>
                    <td>{item.to_warehouse_id}</td>
                    <td>{item.status}</td>
                    <td><button className="secondary-button compact-pill" type="button" onClick={() => setSelectedTransferId(item.id)}>{copy.openAction}</button></td>
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
