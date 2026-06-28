import { FormEvent, useMemo, useState } from "react";

import { createReturn, getEligibleReturnItems, getReturns } from "../app/api/returns";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

export function ReturnsPage() {
  const { session } = useAuth();
  const { locale, messages } = useI18n();
  const copy = messages.returns;
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";
  const [refreshKey, setRefreshKey] = useState(0);
  const [invoiceId, setInvoiceId] = useState("");
  const [refundMethod, setRefundMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, loading, error } = useAsyncValue(
    session ? () => getReturns(session.token) : null,
    [session?.token, refreshKey]
  );
  const { data: eligible, loading: eligibleLoading, error: eligibleError } = useAsyncValue(
    session && invoiceId.trim() ? () => getEligibleReturnItems(session.token, Number(invoiceId)) : null,
    [session?.token, invoiceId]
  );

  const estimatedRefund = useMemo(
    () =>
      (eligible ?? []).reduce((sum, item) => {
        const qty = Number(selectedItems[item.product_id] || 0);
        return sum + item.unit_price * qty;
      }, 0),
    [eligible, selectedItems]
  );

  const handleQtyChange = (productId: number, qty: string) => {
    setSelectedItems((value) => ({ ...value, [productId]: qty }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !invoiceId.trim()) return;

    const items =
      eligible
        ?.map((item) => ({
          product_id: item.product_id,
          qty: Number(selectedItems[item.product_id] || 0)
        }))
        .filter((item) => item.qty > 0) ?? [];

    if (items.length === 0) {
      setActionError(copy.noItemsError);
      return;
    }

    setSubmitting(true);
    setActionMessage(null);
    setActionError(null);

    try {
      const result = await createReturn(session.token, {
        invoice_id: Number(invoiceId),
        items,
        refund_method: refundMethod,
        notes
      });
      setRefreshKey((value) => value + 1);
      setSelectedItems({});
      setNotes("");
      setActionMessage(
        `${copy.successMessagePrefix} ${result.return_id} ${copy.successMessageMiddle} ${result.refund_amount.toLocaleString(numberLocale)} ${copy.table.currencySuffix}.`
      );
    } catch (caught) {
      setActionError(getReadableAuthError(caught));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title={copy.title} subtitle={copy.subtitle} />

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">{copy.createEyebrow}</span>
          <h3>{copy.createTitle}</h3>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                <span>{copy.fields.invoiceId}</span>
                <input
                  inputMode="numeric"
                  onChange={(event) => setInvoiceId(event.target.value)}
                  placeholder={copy.invoicePlaceholder}
                  value={invoiceId}
                />
              </label>

              <label>
                <span>{copy.fields.refundMethod}</span>
                <select onChange={(event) => setRefundMethod(event.target.value)} value={refundMethod}>
                  <option value="cash">{copy.refundMethods.cash}</option>
                  <option value="card">{copy.refundMethods.card}</option>
                  <option value="wallet">{copy.refundMethods.wallet}</option>
                </select>
              </label>
            </div>

            <label>
              <span>{copy.fields.notes}</span>
              <input onChange={(event) => setNotes(event.target.value)} placeholder={copy.notesPlaceholder} value={notes} />
            </label>

            {eligibleLoading ? (
              <QueryFeedback title={copy.loadingEligibleTitle} message={copy.loadingEligibleMessage} />
            ) : eligibleError ? (
              <QueryFeedback title={copy.eligibleErrorTitle} message={eligibleError} tone="error" />
            ) : eligible && eligible.length > 0 ? (
              <div className="table-shell">
                <table>
                  <thead>
                    <tr>
                      <th>{copy.table.item}</th>
                      <th>{copy.table.available}</th>
                      <th>{copy.table.price}</th>
                      <th>{copy.table.returnQty}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eligible.map((item) => (
                      <tr key={item.product_id}>
                        <td>{item.name}</td>
                        <td>{item.available_qty}</td>
                        <td>{item.unit_price.toLocaleString(numberLocale)} {copy.table.currencySuffix}</td>
                        <td>
                          <input
                            className="inline-input"
                            inputMode="numeric"
                            max={item.available_qty}
                            min="0"
                            onChange={(event) => handleQtyChange(item.product_id, event.target.value)}
                            value={selectedItems[item.product_id] || ""}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : invoiceId.trim() ? (
              <QueryFeedback title={copy.noEligibleTitle} message={copy.noEligibleMessage} />
            ) : null}

            <div className="totals-block">
              <div><span>{copy.estimatedRefund}</span><strong>{estimatedRefund.toLocaleString(numberLocale)} {copy.table.currencySuffix}</strong></div>
            </div>

            <button className="primary-button" disabled={submitting || !invoiceId.trim()} type="submit">
              {submitting ? copy.submitPending : copy.submit}
            </button>
          </form>

          {actionMessage ? <QueryFeedback title={copy.successTitle} message={actionMessage} /> : null}
          {actionError ? <QueryFeedback title={copy.errorTitle} message={actionError} tone="error" /> : null}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">{copy.logEyebrow}</span>
          <h3>{copy.logTitle}</h3>
          {loading ? (
            <QueryFeedback title={copy.loadingTitle} message={copy.loadingMessage} />
          ) : error ? (
            <QueryFeedback title={copy.loadErrorTitle} message={error} tone="error" />
          ) : (
            <div className="order-list">
              {data?.items.map((item) => {
                const refundMethodLabel = copy.refundMethods[(item.refund_method as keyof typeof copy.refundMethods) || "cash"] || item.refund_method || copy.refundMethods.cash;
                return (
                  <article className="order-row" key={item.id}>
                    <div>
                      <span className="eyebrow">{copy.returnPrefix}{item.id}</span>
                      <h3>{copy.originalInvoicePrefix}{item.original_invoice_id}</h3>
                      <p>{item.created_at || copy.noRecordedTime}</p>
                    </div>
                    <div>
                      <strong>{(item.refund_amount ?? 0).toLocaleString(numberLocale)} {copy.table.currencySuffix}</strong>
                      <p>{item.notes || copy.noNotes}</p>
                    </div>
                    <span className="status-tag">{refundMethodLabel}</span>
                  </article>
                );
              })}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
