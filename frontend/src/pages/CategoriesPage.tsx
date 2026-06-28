import { FormEvent, useMemo, useState } from "react";

import { createCategory, getCategories, updateCategory, type CategoryRow } from "../app/api/categories";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialCreateForm = { name: "", color: "#c56a28", icon: "", description: "", default_margin_pct: "20" };
const initialEditForm = { id: 0, name: "", color: "#c56a28", icon: "", description: "", default_margin_pct: "20" };

export function CategoriesPage() {
  const { session } = useAuth();
  const { locale, messages } = useI18n();
  const copy = messages.categories;
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";
  const [refreshKey, setRefreshKey] = useState(0);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { data, loading, error } = useAsyncValue(session ? () => getCategories(session.token) : null, [session?.token, refreshKey]);
  const selected = useMemo(() => data?.find((item) => item.id === editForm.id) ?? null, [data, editForm.id]);

  const startEdit = (category: CategoryRow) => {
    setEditForm({
      id: category.id,
      name: category.name,
      color: category.color || "#c56a28",
      icon: category.icon || "",
      description: category.description || "",
      default_margin_pct: String(category.default_margin_pct ?? 20)
    });
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createCategory(session.token, {
        ...createForm,
        default_margin_pct: Number(createForm.default_margin_pct) || 0
      });
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
      const updated = await updateCategory(session.token, editForm.id, {
        name: editForm.name,
        color: editForm.color,
        icon: editForm.icon,
        description: editForm.description,
        default_margin_pct: Number(editForm.default_margin_pct) || 0
      });
      setRefreshKey((value) => value + 1);
      setMessage(`${copy.updatedMessagePrefix} ${updated.name}.`);
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
              <label><span>{copy.fields.name}</span><input value={createForm.name} onChange={(event) => setCreateForm((value) => ({ ...value, name: event.target.value }))} /></label>
              <label><span>{copy.fields.color}</span><input type="color" value={createForm.color} onChange={(event) => setCreateForm((value) => ({ ...value, color: event.target.value }))} /></label>
              <label><span>{copy.fields.icon}</span><input value={createForm.icon} onChange={(event) => setCreateForm((value) => ({ ...value, icon: event.target.value }))} /></label>
              <label><span>{copy.fields.margin}</span><input inputMode="decimal" value={createForm.default_margin_pct} onChange={(event) => setCreateForm((value) => ({ ...value, default_margin_pct: event.target.value }))} /></label>
              <label className="form-field-span-2"><span>{copy.fields.description}</span><input value={createForm.description} onChange={(event) => setCreateForm((value) => ({ ...value, description: event.target.value }))} /></label>
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
              <label><span>{copy.fields.color}</span><input disabled={!selected} type="color" value={editForm.color} onChange={(event) => setEditForm((value) => ({ ...value, color: event.target.value }))} /></label>
              <label><span>{copy.fields.icon}</span><input disabled={!selected} value={editForm.icon} onChange={(event) => setEditForm((value) => ({ ...value, icon: event.target.value }))} /></label>
              <label><span>{copy.fields.margin}</span><input disabled={!selected} inputMode="decimal" value={editForm.default_margin_pct} onChange={(event) => setEditForm((value) => ({ ...value, default_margin_pct: event.target.value }))} /></label>
              <label className="form-field-span-2"><span>{copy.fields.description}</span><input disabled={!selected} value={editForm.description} onChange={(event) => setEditForm((value) => ({ ...value, description: event.target.value }))} /></label>
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
              <thead><tr><th>{copy.table.id}</th><th>{copy.table.name}</th><th>{copy.table.color}</th><th>{copy.table.margin}</th><th>{copy.table.description}</th><th>{copy.table.action}</th></tr></thead>
              <tbody>
                {data?.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td><span className="compact-color-chip" style={{ backgroundColor: item.color || "#c56a28" }} /></td>
                    <td>{(item.default_margin_pct ?? 0).toLocaleString(numberLocale)} %</td>
                    <td>{item.description || copy.table.emptyValue}</td>
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
