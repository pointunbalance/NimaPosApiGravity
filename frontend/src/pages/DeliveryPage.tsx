import { FormEvent, useMemo, useState } from "react";

import { createDelivery, getDeliveries, getDelivery, updateDelivery } from "../app/api/delivery";
import { getUsers } from "../app/api/users";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialCreateForm = {
  invoiceId: "",
  driverId: "",
  customerName: "",
  customerPhone: "",
  deliveryAddress: "",
  deliveryFee: "",
  collectedAmount: "",
  notes: ""
};

const initialUpdateForm = {
  status: "pending",
  collectedAmount: "",
  isSettled: "0",
  notes: ""
};

export function DeliveryPage() {
  const { session } = useAuth();
  const { locale, messages } = useI18n();
  const copy = messages.delivery;
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [updateForm, setUpdateForm] = useState(initialUpdateForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: deliveries, loading, error } = useAsyncValue(
    session ? () => getDeliveries(session.token) : null,
    [session?.token, refreshKey]
  );
  const { data: users } = useAsyncValue(session ? () => getUsers(session.token) : null, [session?.token]);
  const { data: details } = useAsyncValue(
    session && selectedId ? () => getDelivery(session.token, selectedId) : null,
    [session?.token, selectedId, refreshKey]
  );

  const drivers = useMemo(
    () => users?.items.filter((user) => ["cashier", "manager", "admin", "owner"].includes(user.role)) ?? [],
    [users?.items]
  );

  const selectedDriver = useMemo(
    () => drivers.find((driver) => String(driver.id) === createForm.driverId) ?? null,
    [drivers, createForm.driverId]
  );

  const startEdit = (id: number) => {
    setSelectedId(id);
    const row = deliveries?.find((item) => item.id === id);
    if (row) {
      setUpdateForm({
        status: row.status || "pending",
        collectedAmount: String(row.collected_amount ?? ""),
        isSettled: String(row.is_settled ?? 0),
        notes: row.notes || ""
      });
    }
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createDelivery(session.token, {
        invoice_id: Number(createForm.invoiceId) || 0,
        driver_id: selectedDriver?.id,
        driver_name: selectedDriver?.full_name || selectedDriver?.username || "",
        customer_name: createForm.customerName,
        customer_phone: createForm.customerPhone,
        delivery_address: createForm.deliveryAddress,
        delivery_fee: Number(createForm.deliveryFee) || 0,
        collected_amount: Number(createForm.collectedAmount) || 0,
        notes: createForm.notes,
        branch_id: 1
      });
      setCreateForm(initialCreateForm);
      setSelectedId(created.id);
      setRefreshKey((value) => value + 1);
      setMessage(`${copy.createdMessagePrefix} ${created.id}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !selectedId) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await updateDelivery(session.token, selectedId, {
        status: updateForm.status,
        collected_amount: Number(updateForm.collectedAmount) || 0,
        is_settled: Number(updateForm.isSettled) || 0,
        delivered_at: updateForm.status === "delivered" ? new Date().toISOString() : undefined,
        notes: updateForm.notes
      });
      setRefreshKey((value) => value + 1);
      setMessage(`${copy.updatedMessagePrefix} ${selectedId}.`);
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
              <label><span>{copy.fields.invoiceId}</span><input inputMode="numeric" value={createForm.invoiceId} onChange={(e) => setCreateForm((v) => ({ ...v, invoiceId: e.target.value }))} /></label>
              <label>
                <span>{copy.fields.driver}</span>
                <select value={createForm.driverId} onChange={(e) => setCreateForm((v) => ({ ...v, driverId: e.target.value }))}>
                  <option value="">{copy.selectDriver}</option>
                  {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.full_name || driver.username}</option>)}
                </select>
              </label>
              <label><span>{copy.fields.customer}</span><input value={createForm.customerName} onChange={(e) => setCreateForm((v) => ({ ...v, customerName: e.target.value }))} /></label>
              <label><span>{copy.fields.phone}</span><input value={createForm.customerPhone} onChange={(e) => setCreateForm((v) => ({ ...v, customerPhone: e.target.value }))} /></label>
              <label className="form-field-span-2"><span>{copy.fields.address}</span><input value={createForm.deliveryAddress} onChange={(e) => setCreateForm((v) => ({ ...v, deliveryAddress: e.target.value }))} /></label>
              <label><span>{copy.fields.deliveryFee}</span><input inputMode="decimal" value={createForm.deliveryFee} onChange={(e) => setCreateForm((v) => ({ ...v, deliveryFee: e.target.value }))} /></label>
              <label><span>{copy.fields.collectedAmount}</span><input inputMode="decimal" value={createForm.collectedAmount} onChange={(e) => setCreateForm((v) => ({ ...v, collectedAmount: e.target.value }))} /></label>
              <label className="form-field-span-2"><span>{copy.fields.notes}</span><input value={createForm.notes} onChange={(e) => setCreateForm((v) => ({ ...v, notes: e.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!createForm.invoiceId || !createForm.customerName || !createForm.deliveryAddress}>{copy.createSubmit}</button>
          </form>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">{copy.statusEyebrow}</span>
          <h3>{details ? `${copy.statusTitlePrefix} ${details.id}` : copy.statusTitleIdle}</h3>
          {details ? (
            <>
              <p>{copy.labels.customer}: <strong>{details.customer_name || "-"}</strong></p>
              <p>{copy.labels.driver}: <strong>{details.driver_name || "-"}</strong></p>
              <p>{copy.labels.address}: <strong>{details.delivery_address || "-"}</strong></p>
              <form className="auth-form" onSubmit={handleUpdate}>
                <div className="form-grid">
                  <label>
                    <span>{copy.fields.status}</span>
                    <select value={updateForm.status} onChange={(e) => setUpdateForm((v) => ({ ...v, status: e.target.value }))}>
                      <option value="pending">{copy.statusOptions.pending}</option>
                      <option value="picked">{copy.statusOptions.picked}</option>
                      <option value="delivered">{copy.statusOptions.delivered}</option>
                      <option value="failed">{copy.statusOptions.failed}</option>
                    </select>
                  </label>
                  <label><span>{copy.fields.collectedAmount}</span><input inputMode="decimal" value={updateForm.collectedAmount} onChange={(e) => setUpdateForm((v) => ({ ...v, collectedAmount: e.target.value }))} /></label>
                  <label>
                    <span>{copy.fields.isSettled}</span>
                    <select value={updateForm.isSettled} onChange={(e) => setUpdateForm((v) => ({ ...v, isSettled: e.target.value }))}>
                      <option value="0">{copy.settledOptions.no}</option>
                      <option value="1">{copy.settledOptions.yes}</option>
                    </select>
                  </label>
                  <label className="form-field-span-2"><span>{copy.fields.notes}</span><input value={updateForm.notes} onChange={(e) => setUpdateForm((v) => ({ ...v, notes: e.target.value }))} /></label>
                </div>
                <button className="primary-button" type="submit">{copy.updateSubmit}</button>
              </form>
            </>
          ) : (
            <QueryFeedback title={copy.emptySelectionTitle} message={copy.emptySelectionMessage} />
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
              <thead><tr><th>{copy.table.id}</th><th>{copy.table.invoice}</th><th>{copy.table.customer}</th><th>{copy.table.driver}</th><th>{copy.table.status}</th><th>{copy.table.collected}</th><th>{copy.table.action}</th></tr></thead>
              <tbody>
                {(deliveries ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.invoice_id}</td>
                    <td>{item.customer_name || "-"}</td>
                    <td>{item.driver_name || "-"}</td>
                    <td>{copy.statusOptions[item.status as keyof typeof copy.statusOptions] || item.status}</td>
                    <td>{(item.collected_amount ?? 0).toLocaleString(numberLocale)} {copy.table.currencySuffix}</td>
                    <td><button className="secondary-button compact-pill" type="button" onClick={() => startEdit(item.id)}>{copy.table.open}</button></td>
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
