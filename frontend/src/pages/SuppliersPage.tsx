import { FormEvent, useMemo, useState } from "react";

import { createSupplier, getSuppliers, updateSupplier, type SupplierRow } from "../app/api/suppliers";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialCreateForm = { code: "", name: "", phone: "" };
const initialEditForm = { id: 0, name: "", phone: "", email: "" };

export function SuppliersPage() {
  const { session } = useAuth();
  const { messages } = useI18n();
  const copy = messages.suppliers;
  const [refreshKey, setRefreshKey] = useState(0);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { data, loading, error } = useAsyncValue(session ? () => getSuppliers(session.token) : null, [session?.token, refreshKey]);
  const selected = useMemo(() => data?.items.find((item) => item.id === editForm.id) ?? null, [data?.items, editForm.id]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createSupplier(session.token, createForm);
      setCreateForm(initialCreateForm);
      setRefreshKey((value) => value + 1);
      setMessage(`${copy.createdMessagePrefix} ${created.name}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !editForm.id) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const updated = await updateSupplier(session.token, editForm.id, {
        name: editForm.name,
        phone: editForm.phone,
        email: editForm.email
      });
      setRefreshKey((value) => value + 1);
      setMessage(`${copy.updatedMessagePrefix} ${updated.name}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const startEdit = (supplier: SupplierRow) => {
    setEditForm({
      id: supplier.id,
      name: supplier.name,
      phone: supplier.phone || "",
      email: supplier.email || ""
    });
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
              <label><span>{copy.fields.code}</span><input value={createForm.code} onChange={(event) => setCreateForm((value) => ({ ...value, code: event.target.value }))} /></label>
              <label><span>{copy.fields.name}</span><input value={createForm.name} onChange={(event) => setCreateForm((value) => ({ ...value, name: event.target.value }))} /></label>
              <label><span>{copy.fields.phone}</span><input value={createForm.phone} onChange={(event) => setCreateForm((value) => ({ ...value, phone: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit">{copy.createSubmit}</button>
          </form>
        </article>
        <article className="surface-panel">
          <span className="eyebrow">{copy.editEyebrow}</span>
          <h3>{selected ? `${copy.editTitlePrefix} ${selected.name}` : copy.editTitleIdle}</h3>
          <form className="auth-form" onSubmit={handleEdit}>
            <div className="form-grid">
              <label><span>{copy.fields.name}</span><input disabled={!selected} value={editForm.name} onChange={(event) => setEditForm((value) => ({ ...value, name: event.target.value }))} /></label>
              <label><span>{copy.fields.phone}</span><input disabled={!selected} value={editForm.phone} onChange={(event) => setEditForm((value) => ({ ...value, phone: event.target.value }))} /></label>
              <label><span>{copy.fields.email}</span><input disabled={!selected} value={editForm.email} onChange={(event) => setEditForm((value) => ({ ...value, email: event.target.value }))} /></label>
            </div>
            <button className="primary-button" disabled={!selected} type="submit">{copy.updateSubmit}</button>
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
              <thead><tr><th>{copy.table.code}</th><th>{copy.table.name}</th><th>{copy.table.phone}</th><th>{copy.table.email}</th><th>{copy.table.action}</th></tr></thead>
              <tbody>
                {data?.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.code || `${copy.codeFallbackPrefix}${item.id}`}</td>
                    <td>{item.name}</td>
                    <td>{item.phone || copy.table.emptyValue}</td>
                    <td>{item.email || copy.table.emptyValue}</td>
                    <td><button className="secondary-button compact-pill" onClick={() => startEdit(item)} type="button">{copy.editAction}</button></td>
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
