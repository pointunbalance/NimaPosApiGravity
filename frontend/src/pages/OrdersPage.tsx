import { FormEvent, useMemo, useState } from "react";
import { Ban, Eye, Printer } from "lucide-react";

import { getOrderDetails, getOrderPrintData, getOrders, voidOrder } from "../app/api/orders";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

export function OrdersPage() {
  const { session } = useAuth();
  const { locale, messages } = useI18n();
  const copy = messages.orders;
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [voidSubmitting, setVoidSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, loading, error } = useAsyncValue(
    session ? () => getOrders(session.token) : null,
    [session?.token, refreshKey]
  );
  const { data: details, loading: detailsLoading, error: detailsError } = useAsyncValue(
    session && selectedInvoiceId ? () => getOrderDetails(session.token, selectedInvoiceId) : null,
    [session?.token, selectedInvoiceId, refreshKey]
  );
  const { data: printData, loading: printLoading, error: printError } = useAsyncValue(
    session && selectedInvoiceId ? () => getOrderPrintData(session.token, selectedInvoiceId) : null,
    [session?.token, selectedInvoiceId, refreshKey]
  );

  const selectedLabel = useMemo(
    () => (selectedInvoiceId ? `INV-${selectedInvoiceId}` : copy.chooseInvoice),
    [copy.chooseInvoice, selectedInvoiceId]
  );

  const handleVoid = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !selectedInvoiceId || !voidReason.trim()) return;

    setVoidSubmitting(true);
    setActionMessage(null);
    setActionError(null);

    try {
      await voidOrder(session.token, selectedInvoiceId, voidReason.trim());
      setVoidReason("");
      setRefreshKey((value) => value + 1);
      setActionMessage(copy.voidSuccess);
    } catch (caught) {
      setActionError(getReadableAuthError(caught));
    } finally {
      setVoidSubmitting(false);
    }
  };

  const handlePrint = () => {
    if (!selectedInvoiceId) return;
    window.open(`/orders/${selectedInvoiceId}/print`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="page-stack">
      <PageHeader title={copy.title} subtitle={copy.subtitle} />

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">{copy.invoicesEyebrow}</span>
          {loading ? (
            <QueryFeedback title={copy.invoicesLoadingTitle} message={copy.invoicesLoadingMessage} />
          ) : error ? (
            <QueryFeedback title={copy.invoicesErrorTitle} message={error} tone="error" />
          ) : (
            <div className="order-list">
              {data?.items.map((order) => (
                <article className="order-row" key={order.id}>
                  <div>
                    <span className="eyebrow">INV-{order.id}</span>
                    <h3>{order.customer_name || copy.cashCustomer}</h3>
                    <p>{order.created_at || copy.noRecordedTime}</p>
                  </div>
                  <strong>{(order.net_total ?? 0).toLocaleString(numberLocale)}</strong>
                  <div className="order-actions">
                    <span className="status-tag">{order.is_void ? copy.voided : order.payment_method || copy.active}</span>
                    <button className="secondary-button compact-pill" onClick={() => setSelectedInvoiceId(order.id)} type="button">
                      <Eye size={14} />
                      {copy.view}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">{copy.detailEyebrow}</span>
          <h3>{selectedLabel}</h3>
          {detailsLoading ? (
            <QueryFeedback title={copy.detailLoadingTitle} message={copy.detailLoadingMessage} />
          ) : detailsError ? (
            <QueryFeedback title={copy.detailErrorTitle} message={detailsError} tone="error" />
          ) : details ? (
            <>
              <div className="detail-grid">
                <div className="feedback-panel">
                  <strong>{copy.detailLabels.customer}</strong>
                  <p>{details.customer_name || copy.cashCustomer}</p>
                </div>
                <div className="feedback-panel">
                  <strong>{copy.detailLabels.payment}</strong>
                  <p>{details.payment_method || copy.unspecified}</p>
                </div>
                <div className="feedback-panel">
                  <strong>{copy.detailLabels.net}</strong>
                  <p>{(details.net_total ?? 0).toLocaleString(numberLocale)}</p>
                </div>
                <div className="feedback-panel">
                  <strong>{copy.detailLabels.status}</strong>
                  <p>{details.is_void ? `${copy.voided}: ${details.void_reason || copy.noReason}` : copy.active}</p>
                </div>
                <div className="feedback-panel">
                  <strong>{copy.detailLabels.createdAt}</strong>
                  <p>{details.created_at || "-"}</p>
                </div>
                <div className="feedback-panel">
                  <strong>{copy.detailLabels.paid}</strong>
                  <p>{(details.paid_amount ?? 0).toLocaleString(numberLocale)}</p>
                </div>
                <div className="feedback-panel">
                  <strong>{copy.detailLabels.total}</strong>
                  <p>{(details.total ?? 0).toLocaleString(numberLocale)}</p>
                </div>
                <div className="feedback-panel">
                  <strong>{copy.detailLabels.change}</strong>
                  <p>{(details.change_due ?? 0).toLocaleString(numberLocale)}</p>
                </div>
              </div>

              <div className="table-shell">
                <table>
                  <thead>
                    <tr>
                      <th>{copy.itemTable.item}</th>
                      <th>{copy.itemTable.qty}</th>
                      <th>{copy.itemTable.price}</th>
                      <th>{copy.itemTable.net}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.items?.map((item) => (
                      <tr key={item.id}>
                        <td>{item.product_name || `#${item.product_id}`}</td>
                        <td>{item.qty}</td>
                        <td>{item.unit_price.toLocaleString(numberLocale)}</td>
                        <td>{(item.net_line_total ?? 0).toLocaleString(numberLocale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <article className="surface-panel" style={{ padding: 0, border: "none", background: "transparent" }}>
                <div className="inline-actions" style={{ marginBottom: "0.75rem" }}>
                  <span className="eyebrow">{copy.printPreviewEyebrow}</span>
                  <button className="secondary-button compact-pill" onClick={handlePrint} type="button">
                    <Printer size={14} />
                    {copy.printPage}
                  </button>
                </div>
                {printLoading ? (
                  <QueryFeedback title={copy.previewLoadingTitle} message={copy.previewLoadingMessage} />
                ) : printError ? (
                  <QueryFeedback title={copy.previewErrorTitle} message={printError} tone="error" />
                ) : printData ? (
                  <div className="feedback-panel">
                    <strong>INV-{printData.id}</strong>
                    <p>{printData.created_at || "-"}</p>
                  </div>
                ) : null}
              </article>

              {!details.is_void ? (
                <form className="auth-form" onSubmit={handleVoid}>
                  <label>
                    <span>{copy.voidReasonLabel}</span>
                    <input
                      onChange={(event) => setVoidReason(event.target.value)}
                      placeholder={copy.voidReasonPlaceholder}
                      value={voidReason}
                    />
                  </label>
                  <button className="primary-button danger-button" disabled={voidSubmitting || !voidReason.trim()} type="submit">
                    <Ban size={14} />
                    {voidSubmitting ? copy.voidSubmitting : copy.voidSubmit}
                  </button>
                </form>
              ) : null}

              {actionMessage ? <QueryFeedback title={copy.successTitle} message={actionMessage} /> : null}
              {actionError ? <QueryFeedback title={copy.failureTitle} message={actionError} tone="error" /> : null}
            </>
          ) : (
            <QueryFeedback title={copy.emptySelectionTitle} message={copy.emptySelectionMessage} />
          )}
        </article>
      </section>
    </div>
  );
}
