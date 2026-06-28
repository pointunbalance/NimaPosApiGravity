import { FormEvent, useState } from "react";

import { createBranch, getBranches, updateBranch, type BranchRow } from "../app/api/branches";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialCreateForm = { code: "", name: "" };
const initialEditForm = { id: 0, name: "", isActive: "true" };

export function BranchesPage() {
  const { session } = useAuth();
  const { messages } = useI18n();
  const copy = messages.branches;
  const [refreshKey, setRefreshKey] = useState(0);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, loading, error } = useAsyncValue(session ? () => getBranches(session.token) : null, [session?.token, refreshKey]);
  const selected = data?.find((item) => item.id === editForm.id) ?? null;

  const startEdit = (branch: BranchRow) => {
    setEditForm({
      id: branch.id,
      name: branch.name,
      isActive: String(branch.is_active ?? true)
    });
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createBranch(session.token, { code: createForm.code, name: createForm.name });
      setCreateForm(initialCreateForm);
      setRefreshKey((value) => value + 1);
      setMessage(`${copy.createdMessagePrefix} ${created.name}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !selected) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await updateBranch(session.token, selected.id, {
        name: editForm.name,
        is_active: editForm.isActive === "true"
      });
      setRefreshKey((value) => value + 1);
      setMessage(`${copy.updatedMessagePrefix} ${selected.code}.`);
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
              <label><span>{copy.fields.code}</span><input value={createForm.code} onChange={(event) => setCreateForm((value) => ({ ...value, code: event.target.value }))} /></label>
              <label><span>{copy.fields.name}</span><input value={createForm.name} onChange={(event) => setCreateForm((value) => ({ ...value, name: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!createForm.code || !createForm.name}>{copy.createSubmit}</button>
          </form>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">{copy.editEyebrow}</span>
          <h3>{selected ? `${copy.editTitlePrefix} ${selected.code}` : copy.editTitleIdle}</h3>
          <form className="auth-form" onSubmit={handleUpdate}>
            <div className="form-grid">
              <label><span>{copy.fields.name}</span><input disabled={!selected} value={editForm.name} onChange={(event) => setEditForm((value) => ({ ...value, name: event.target.value }))} /></label>
              <label><span>{copy.fields.status}</span><select disabled={!selected} value={editForm.isActive} onChange={(event) => setEditForm((value) => ({ ...value, isActive: event.target.value }))}><option value="true">{copy.active}</option><option value="false">{copy.inactive}</option></select></label>
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
              <thead><tr><th>{copy.table.id}</th><th>{copy.table.code}</th><th>{copy.table.name}</th><th>{copy.table.status}</th><th>{copy.table.action}</th></tr></thead>
              <tbody>
                {(data ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.code}</td>
                    <td>{item.name}</td>
                    <td>{item.is_active ? copy.active : copy.inactive}</td>
                    <td><button className="secondary-button compact-pill" type="button" onClick={() => startEdit(item)}>{copy.editAction}</button></td>
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
