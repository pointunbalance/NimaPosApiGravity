import { FormEvent, useMemo, useState } from "react";

import { createExpense, getExpenseCategories, getExpenses, getExpenseSummary, updateExpense, type ExpenseRow } from "../app/api/expenses";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const today = new Date().toISOString().slice(0, 10);
const initialCreateForm = { title: "", amount: "", category: "other", date: today, notes: "", payment_method: "cash" };
const initialEditForm = { id: 0, title: "", amount: "", category: "other", date: today, notes: "", payment_method: "cash" };

export function ExpensesPage() {
  const { session } = useAuth();
  const { locale, messages } = useI18n();
  const copy = messages.expenses;
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";
  const [refreshKey, setRefreshKey] = useState(0);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, loading, error } = useAsyncValue(session ? () => getExpenses(session.token) : null, [session?.token, refreshKey]);
  const { data: categories } = useAsyncValue(session ? () => getExpenseCategories(session.token) : null, [session?.token, refreshKey]);
  const { data: summary } = useAsyncValue(session ? () => getExpenseSummary(session.token) : null, [session?.token, refreshKey]);
  const selected = useMemo(() => data?.items.find((item) => item.id === editForm.id) ?? null, [data?.items, editForm.id]);

  const startEdit = (expense: ExpenseRow) => {
    setEditForm({
      id: expense.id,
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category,
      date: expense.date,
      notes: expense.notes || "",
      payment_method: expense.payment_method || "cash"
    });
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createExpense(session.token, {
        title: createForm.title,
        amount: Number(createForm.amount) || 0,
        category: createForm.category,
        date: createForm.date,
        notes: createForm.notes,
        payment_method: createForm.payment_method
      });
      setCreateForm(initialCreateForm);
      setRefreshKey((value) => value + 1);
      setMessage(`${copy.createdMessagePrefix} ${created.title}.`);
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
      const updated = await updateExpense(session.token, editForm.id, {
        title: editForm.title,
        amount: Number(editForm.amount) || 0,
        category: editForm.category,
        date: editForm.date,
        notes: editForm.notes,
        payment_method: editForm.payment_method
      });
      setRefreshKey((value) => value + 1);
      setMessage(`${copy.updatedMessagePrefix} ${updated.title}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title={copy.title} subtitle={copy.subtitle} />
      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">{copy.cards.totalExpenses}</span><strong>{(summary?.total ?? 0).toLocaleString(numberLocale)} {copy.table.currencySuffix}</strong><p>{copy.cards.totalExpensesNote}</p></article>
        <article className="stat-card"><span className="eyebrow">{copy.cards.entries}</span><strong>{summary?.count ?? 0}</strong><p>{copy.cards.entriesNote}</p></article>
        <article className="stat-card"><span className="eyebrow">{copy.cards.topCategory}</span><strong>{summary?.by_category?.[0]?.category || copy.table.emptyValue}</strong><p>{copy.cards.topCategoryNote}</p></article>
      </section>
      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">{copy.createEyebrow}</span>
          <h3>{copy.createTitle}</h3>
          <form className="auth-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <label><span>{copy.fields.title}</span><input value={createForm.title} onChange={(event) => setCreateForm((value) => ({ ...value, title: event.target.value }))} /></label>
              <label><span>{copy.fields.amount}</span><input inputMode="decimal" value={createForm.amount} onChange={(event) => setCreateForm((value) => ({ ...value, amount: event.target.value }))} /></label>
              <label>
                <span>{copy.fields.category}</span>
                <select value={createForm.category} onChange={(event) => setCreateForm((value) => ({ ...value, category: event.target.value }))}>
                  <option value="other">{copy.otherCategory}</option>
                  {(categories ?? []).map((item) => <option key={item.category} value={item.category}>{item.category}</option>)}
                </select>
              </label>
              <label><span>{copy.fields.date}</span><input type="date" value={createForm.date} onChange={(event) => setCreateForm((value) => ({ ...value, date: event.target.value }))} /></label>
              <label><span>{copy.fields.paymentMethod}</span><select value={createForm.payment_method} onChange={(event) => setCreateForm((value) => ({ ...value, payment_method: event.target.value }))}><option value="cash">{copy.paymentMethods.cash}</option><option value="card">{copy.paymentMethods.card}</option><option value="bank">{copy.paymentMethods.bank}</option></select></label>
              <label className="form-field-span-2"><span>{copy.fields.notes}</span><input value={createForm.notes} onChange={(event) => setCreateForm((value) => ({ ...value, notes: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit">{copy.createSubmit}</button>
          </form>
        </article>
        <article className="surface-panel">
          <span className="eyebrow">{copy.editEyebrow}</span>
          <h3>{selected ? `${copy.editTitlePrefix} ${selected.title}` : copy.editTitleIdle}</h3>
          <form className="auth-form" onSubmit={handleEdit}>
            <div className="form-grid">
              <label><span>{copy.fields.title}</span><input disabled={!selected} value={editForm.title} onChange={(event) => setEditForm((value) => ({ ...value, title: event.target.value }))} /></label>
              <label><span>{copy.fields.amount}</span><input disabled={!selected} inputMode="decimal" value={editForm.amount} onChange={(event) => setEditForm((value) => ({ ...value, amount: event.target.value }))} /></label>
              <label><span>{copy.fields.category}</span><input disabled={!selected} value={editForm.category} onChange={(event) => setEditForm((value) => ({ ...value, category: event.target.value }))} /></label>
              <label><span>{copy.fields.date}</span><input disabled={!selected} type="date" value={editForm.date} onChange={(event) => setEditForm((value) => ({ ...value, date: event.target.value }))} /></label>
              <label><span>{copy.fields.paymentMethod}</span><select disabled={!selected} value={editForm.payment_method} onChange={(event) => setEditForm((value) => ({ ...value, payment_method: event.target.value }))}><option value="cash">{copy.paymentMethods.cash}</option><option value="card">{copy.paymentMethods.card}</option><option value="bank">{copy.paymentMethods.bank}</option></select></label>
              <label className="form-field-span-2"><span>{copy.fields.notes}</span><input disabled={!selected} value={editForm.notes} onChange={(event) => setEditForm((value) => ({ ...value, notes: event.target.value }))} /></label>
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
              <thead><tr><th>{copy.table.id}</th><th>{copy.table.title}</th><th>{copy.table.category}</th><th>{copy.table.date}</th><th>{copy.table.payment}</th><th>{copy.table.amount}</th><th>{copy.table.action}</th></tr></thead>
              <tbody>
                {data?.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.title}</td>
                    <td>{item.category}</td>
                    <td>{item.date}</td>
                    <td>{item.payment_method || copy.table.emptyValue}</td>
                    <td>{item.amount.toLocaleString(numberLocale)} {copy.table.currencySuffix}</td>
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
