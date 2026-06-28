import { FormEvent, useMemo, useState } from "react";

import { createWarehouse, getWarehouseInventory, getWarehouses } from "../app/api/advanced";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialForm = {
  name: "",
  address: "",
  isMain: "false"
};

export function WarehousePage() {
  const { session } = useAuth();
  const { locale, messages } = useI18n();
  const copy = messages.warehouse;
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: warehouses, loading, error } = useAsyncValue(session ? () => getWarehouses(session.token) : null, [session?.token, refreshKey]);
  const { data: inventory, loading: inventoryLoading, error: inventoryError } = useAsyncValue(
    session && selectedWarehouseId ? () => getWarehouseInventory(session.token, Number(selectedWarehouseId)) : null,
    [session?.token, selectedWarehouseId, refreshKey]
  );

  const inventoryTotals = useMemo(
    () => ({
      lines: inventory?.length ?? 0,
      quantity: (inventory ?? []).reduce((sum, item) => sum + (item.quantity ?? 0), 0)
    }),
    [inventory]
  );

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createWarehouse(session.token, {
        name: form.name,
        address: form.address,
        is_main: form.isMain === "true"
      });
      setForm(initialForm);
      setSelectedWarehouseId(String(created.id));
      setRefreshKey((value) => value + 1);
      setMessage(`${copy.createdMessagePrefix} ${created.name}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title={copy.title} subtitle={copy.subtitle} />

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">{copy.cards.warehouses}</span><strong>{(warehouses?.length ?? 0).toLocaleString(numberLocale)}</strong><p>{copy.cards.warehousesNote}</p></article>
        <article className="stat-card"><span className="eyebrow">{copy.cards.inventoryLines}</span><strong>{inventoryTotals.lines.toLocaleString(numberLocale)}</strong><p>{copy.cards.inventoryLinesNote}</p></article>
        <article className="stat-card"><span className="eyebrow">{copy.cards.stockQuantity}</span><strong>{inventoryTotals.quantity.toLocaleString(numberLocale)}</strong><p>{copy.cards.stockQuantityNote}</p></article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">{copy.createEyebrow}</span>
          <h3>{copy.createTitle}</h3>
          <form className="auth-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <label><span>{copy.fields.name}</span><input value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} /></label>
              <label><span>{copy.fields.address}</span><input value={form.address} onChange={(event) => setForm((value) => ({ ...value, address: event.target.value }))} /></label>
              <label><span>{copy.fields.isMain}</span><select value={form.isMain} onChange={(event) => setForm((value) => ({ ...value, isMain: event.target.value }))}><option value="false">{copy.mainNo}</option><option value="true">{copy.mainYes}</option></select></label>
            </div>
            <button className="primary-button" type="submit" disabled={!form.name}>{copy.createSubmit}</button>
          </form>
          {message ? <QueryFeedback title={copy.successTitle} message={message} /> : null}
          {errorMessage ? <QueryFeedback title={copy.errorTitle} message={errorMessage} tone="error" /> : null}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">{copy.inventoryEyebrow}</span>
          <h3>{copy.inventoryTitle}</h3>
          <div className="form-grid">
            <label>
              <span>{copy.fields.warehouse}</span>
              <select value={selectedWarehouseId} onChange={(event) => setSelectedWarehouseId(event.target.value)}>
                <option value="">{copy.selectWarehouse}</option>
                {(warehouses ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
          </div>
          <p>{copy.inventoryBody}</p>
        </article>
      </section>

      <section className="surface-panel">
        {loading ? (
          <QueryFeedback title={copy.loadingWarehousesTitle} message={copy.loadingWarehousesMessage} />
        ) : error ? (
          <QueryFeedback title={copy.loadWarehousesErrorTitle} message={error} tone="error" />
        ) : inventoryLoading ? (
          <QueryFeedback title={copy.loadingInventoryTitle} message={copy.loadingInventoryMessage} />
        ) : inventoryError ? (
          <QueryFeedback title={copy.loadInventoryErrorTitle} message={inventoryError} tone="error" />
        ) : (
          <div className="table-shell">
            <table>
              <thead><tr><th>{copy.table.id}</th><th>{copy.table.product}</th><th>{copy.table.sku}</th><th>{copy.table.quantity}</th></tr></thead>
              <tbody>
                {(inventory ?? []).map((item, index) => (
                  <tr key={`${item.product_id}-${index}`}>
                    <td>{item.product_id}</td>
                    <td>{item.product_name || copy.table.emptyValue}</td>
                    <td>{item.sku || copy.table.emptyValue}</td>
                    <td>{(item.quantity ?? 0).toLocaleString(numberLocale)}</td>
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
