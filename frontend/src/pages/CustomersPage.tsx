import { FormEvent, useMemo, useState } from "react";
import { Pencil } from "lucide-react";

import { createCustomer, getCustomers, updateCustomer, type CustomerRow } from "../app/api/customers";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialCreateForm = { code: "", name: "", phone: "" };
const initialEditForm = { id: 0, name: "", phone: "", balance: "" };

export function CustomersPage() {
  const { session } = useAuth();
  const { locale, messages } = useI18n();
  const copy = messages.customers;
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";
  const [refreshKey, setRefreshKey] = useState(0);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { data, loading, error } = useAsyncValue(session ? () => getCustomers(session.token) : null, [session?.token, refreshKey]);

  const selectedCustomer = useMemo(() => data?.items.find((item) => item.id === editForm.id) ?? null, [data?.items, editForm.id]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setCreateSubmitting(true);
    setSubmitError(null);
    setSubmitMessage(null);
    try {
      await createCustomer(session.token, createForm);
      setCreateForm(initialCreateForm);
      setRefreshKey((value) => value + 1);
      setSubmitMessage(copy.createdMessage);
    } catch (caught) {
      setSubmitError(getReadableAuthError(caught));
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !editForm.id) return;
    setEditSubmitting(true);
    setSubmitError(null);
    setSubmitMessage(null);
    try {
      await updateCustomer(session.token, editForm.id, {
        name: editForm.name,
        phone: editForm.phone,
        balance: Number(editForm.balance) || 0
      });
      setRefreshKey((value) => value + 1);
      setSubmitMessage(copy.updatedMessage);
    } catch (caught) {
      setSubmitError(getReadableAuthError(caught));
    } finally {
      setEditSubmitting(false);
    }
  };

  const startEdit = (item: CustomerRow) => {
    setEditForm({ id: item.id, name: item.name, phone: item.phone || "", balance: String(item.balance ?? 0) });
    setSubmitError(null);
    setSubmitMessage(null);
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
              <label><span>{copy.fields.code}</span><input onChange={(event) => setCreateForm((value) => ({ ...value, code: event.target.value }))} placeholder={copy.placeholders.code} value={createForm.code} /></label>
              <label><span>{copy.fields.name}</span><input onChange={(event) => setCreateForm((value) => ({ ...value, name: event.target.value }))} placeholder={copy.placeholders.name} value={createForm.name} /></label>
              <label><span>{copy.fields.phone}</span><input onChange={(event) => setCreateForm((value) => ({ ...value, phone: event.target.value }))} placeholder={copy.placeholders.phone} value={createForm.phone} /></label>
            </div>
            <button className="primary-button" disabled={createSubmitting || !createForm.code || !createForm.name} type="submit">
              {createSubmitting ? copy.createPending : copy.createSubmit}
            </button>
          </form>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">{copy.editEyebrow}</span>
          <h3>{selectedCustomer ? `${copy.editAction} ${selectedCustomer.name}` : copy.editTitleIdle}</h3>
          <form className="auth-form" onSubmit={handleEdit}>
            <div className="form-grid">
              <label><span>{copy.fields.name}</span><input disabled={!selectedCustomer} onChange={(event) => setEditForm((value) => ({ ...value, name: event.target.value }))} value={editForm.name} /></label>
              <label><span>{copy.fields.phone}</span><input disabled={!selectedCustomer} onChange={(event) => setEditForm((value) => ({ ...value, phone: event.target.value }))} value={editForm.phone} /></label>
              <label><span>{copy.fields.balance}</span><input disabled={!selectedCustomer} inputMode="decimal" onChange={(event) => setEditForm((value) => ({ ...value, balance: event.target.value }))} value={editForm.balance} /></label>
            </div>
            <button className="primary-button" disabled={editSubmitting || !selectedCustomer} type="submit">
              {editSubmitting ? copy.editPending : copy.editSubmit}
            </button>
          </form>
          {submitMessage ? <QueryFeedback title={copy.successTitle} message={submitMessage} /> : null}
          {submitError ? <QueryFeedback title={copy.errorTitle} message={submitError} tone="error" /> : null}
        </article>
      </section>

      <section className="surface-panel">
        {loading ? (
          <QueryFeedback title={copy.loadingTitle} message={copy.loadingMessage} />
        ) : error ? (
          <QueryFeedback title={copy.loadErrorTitle} message={error} tone="error" />
        ) : (
          <section className="customer-grid customer-grid-tight">
            {data?.items.map((customer) => (
              <article className="customer-card" key={customer.id}>
                <span className="eyebrow">{customer.tier || copy.customerTierFallback}</span>
                <h3>{customer.name}</h3>
                <p>{copy.phonePrefix}: {customer.phone || copy.phoneMissing}</p>
                <p>{copy.balancePrefix}: {(customer.balance ?? 0).toLocaleString(numberLocale)}</p>
                <strong>{(customer.total_purchases ?? 0).toLocaleString(numberLocale)} {copy.purchasesSuffix}</strong>
                <button className="secondary-button compact-pill" onClick={() => startEdit(customer)} type="button">
                  <Pencil size={14} />
                  {copy.editAction}
                </button>
              </article>
            ))}
          </section>
        )}
      </section>
    </div>
  );
}
