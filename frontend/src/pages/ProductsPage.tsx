import { FormEvent, useMemo, useState } from "react";
import { Pencil, Plus } from "lucide-react";

import { createProduct, getProducts, updateProduct, type ProductRow } from "../app/api/products";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialCreateForm = {
  sku: "",
  name: "",
  category: "",
  price: "",
  stock_qty: ""
};

const initialEditForm = {
  id: 0,
  name: "",
  category: "",
  price: "",
  stock_qty: ""
};

export function ProductsPage() {
  const { session } = useAuth();
  const { locale, messages } = useI18n();
  const copy = messages.products;
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";
  const [refreshKey, setRefreshKey] = useState(0);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { data, loading, error } = useAsyncValue(
    session ? () => getProducts(session.token) : null,
    [session?.token, refreshKey]
  );

  const selectedProduct = useMemo(
    () => data?.items.find((item) => item.id === editForm.id) ?? null,
    [data?.items, editForm.id]
  );

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;

    setCreateSubmitting(true);
    setSubmitError(null);
    setSubmitMessage(null);

    try {
      await createProduct(session.token, {
        sku: createForm.sku,
        name: createForm.name,
        category: createForm.category,
        price: Number(createForm.price) || 0,
        stock_qty: Number(createForm.stock_qty) || 0
      });
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
      await updateProduct(session.token, editForm.id, {
        name: editForm.name,
        category: editForm.category,
        price: Number(editForm.price) || 0,
        stock_qty: Number(editForm.stock_qty) || 0
      });
      setRefreshKey((value) => value + 1);
      setSubmitMessage(copy.updatedMessage);
    } catch (caught) {
      setSubmitError(getReadableAuthError(caught));
    } finally {
      setEditSubmitting(false);
    }
  };

  const startEdit = (item: ProductRow) => {
    setEditForm({
      id: item.id,
      name: item.name,
      category: item.category || "",
      price: String(item.price ?? 0),
      stock_qty: String(item.stock_qty ?? 0)
    });
    setSubmitError(null);
    setSubmitMessage(null);
  };

  return (
    <div className="page-stack">
      <PageHeader
        title={copy.title}
        subtitle={copy.subtitle}
        actions={
          <button className="primary-button" type="button">
            <Plus size={16} />
            {copy.manageCatalog}
          </button>
        }
      />

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">{copy.createEyebrow}</span>
          <h3>{copy.createTitle}</h3>
          <form className="auth-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <label>
                <span>{copy.fields.sku}</span>
                <input
                  onChange={(event) => setCreateForm((value) => ({ ...value, sku: event.target.value }))}
                  placeholder={copy.placeholders.sku}
                  value={createForm.sku}
                />
              </label>
              <label>
                <span>{copy.fields.name}</span>
                <input
                  onChange={(event) => setCreateForm((value) => ({ ...value, name: event.target.value }))}
                  placeholder={copy.placeholders.name}
                  value={createForm.name}
                />
              </label>
              <label>
                <span>{copy.fields.category}</span>
                <input
                  onChange={(event) => setCreateForm((value) => ({ ...value, category: event.target.value }))}
                  placeholder={copy.placeholders.category}
                  value={createForm.category}
                />
              </label>
              <label>
                <span>{copy.fields.price}</span>
                <input
                  inputMode="decimal"
                  onChange={(event) => setCreateForm((value) => ({ ...value, price: event.target.value }))}
                  placeholder={copy.placeholders.price}
                  value={createForm.price}
                />
              </label>
              <label>
                <span>{copy.fields.stock}</span>
                <input
                  inputMode="numeric"
                  onChange={(event) => setCreateForm((value) => ({ ...value, stock_qty: event.target.value }))}
                  placeholder={copy.placeholders.stock}
                  value={createForm.stock_qty}
                />
              </label>
            </div>
            <button className="primary-button" disabled={createSubmitting || !createForm.sku || !createForm.name} type="submit">
              {createSubmitting ? copy.savePending : copy.createSubmit}
            </button>
          </form>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">{copy.editEyebrow}</span>
          <h3>{selectedProduct ? `${copy.table.edit} ${selectedProduct.name}` : copy.editTitleIdle}</h3>
          <form className="auth-form" onSubmit={handleEdit}>
            <div className="form-grid">
              <label>
                <span>{copy.fields.name}</span>
                <input
                  disabled={!selectedProduct}
                  onChange={(event) => setEditForm((value) => ({ ...value, name: event.target.value }))}
                  value={editForm.name}
                />
              </label>
              <label>
                <span>{copy.fields.category}</span>
                <input
                  disabled={!selectedProduct}
                  onChange={(event) => setEditForm((value) => ({ ...value, category: event.target.value }))}
                  value={editForm.category}
                />
              </label>
              <label>
                <span>{copy.fields.price}</span>
                <input
                  disabled={!selectedProduct}
                  inputMode="decimal"
                  onChange={(event) => setEditForm((value) => ({ ...value, price: event.target.value }))}
                  value={editForm.price}
                />
              </label>
              <label>
                <span>{copy.fields.stock}</span>
                <input
                  disabled={!selectedProduct}
                  inputMode="numeric"
                  onChange={(event) => setEditForm((value) => ({ ...value, stock_qty: event.target.value }))}
                  value={editForm.stock_qty}
                />
              </label>
            </div>
            <button className="primary-button" disabled={editSubmitting || !selectedProduct} type="submit">
              {editSubmitting ? copy.updatePending : copy.updateSubmit}
            </button>
          </form>
          {submitMessage ? <QueryFeedback title={copy.successTitle} message={submitMessage} /> : null}
          {submitError ? <QueryFeedback title={copy.failureTitle} message={submitError} tone="error" /> : null}
        </article>
      </section>

      <section className="surface-panel">
        <div className="table-toolbar">
          <span className="eyebrow">{copy.catalogEyebrow}</span>
          <p>{data ? `${data.pagination.total.toLocaleString(numberLocale)} ${copy.activeProducts}` : copy.catalogFallback}</p>
        </div>
        {loading ? (
          <QueryFeedback title={copy.loadingTitle} message={copy.loadingMessage} />
        ) : error ? (
          <QueryFeedback title={copy.errorTitle} message={error} tone="error" />
        ) : (
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>{copy.table.code}</th>
                  <th>{copy.table.product}</th>
                  <th>{copy.table.category}</th>
                  <th>{copy.table.price}</th>
                  <th>{copy.table.stock}</th>
                  <th>{copy.table.status}</th>
                  <th>{copy.table.action}</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.sku || `PRD-${item.id}`}</td>
                    <td>{item.name}</td>
                    <td>{item.category || copy.table.uncategorized}</td>
                    <td>{(item.price ?? 0).toLocaleString(numberLocale)}</td>
                    <td>{item.stock_qty ?? 0}</td>
                    <td>{item.is_active === false ? copy.table.inactive : copy.table.active}</td>
                    <td>
                      <button className="secondary-button compact-pill" onClick={() => startEdit(item)} type="button">
                        <Pencil size={14} />
                        {copy.table.edit}
                      </button>
                    </td>
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
