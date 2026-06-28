import { useEffect, useMemo, useRef } from "react";
import { Link, useParams } from "react-router-dom";

import { getOrderPrintData } from "../app/api/orders";
import { useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { QueryFeedback } from "../components/QueryFeedback";

export function InvoicePrintPage() {
  const { invoiceId } = useParams();
  const { session } = useAuth();
  const printedRef = useRef(false);
  const parsedInvoiceId = Number(invoiceId);

  const { data, loading, error } = useAsyncValue(
    session && Number.isFinite(parsedInvoiceId) ? () => getOrderPrintData(session.token, parsedInvoiceId) : null,
    [session?.token, parsedInvoiceId]
  );

  const previewMeta = useMemo(
    () => ({
      width: data?.print_settings?.printer_width || "80mm",
      receiptHeader: data?.print_settings?.receipt_header?.trim() || "ترويسة الإيصال",
      receiptFooter: data?.print_settings?.receipt_footer?.trim() || "تذييل الإيصال",
      invoiceFooter: data?.print_settings?.invoice_footer?.trim() || "",
      qrEnabled: data?.print_settings?.enable_qr === "1",
      autoPrintEnabled: data?.print_settings?.auto_print === "1"
    }),
    [data]
  );
  const isA4Layout = previewMeta.width === "A4";
  const lineItems = useMemo(
    () =>
      data?.items?.map((item) => ({
        ...item,
        lineTotal: Number(item.net_line_total ?? (item.qty * item.unit_price))
      })) ?? [],
    [data]
  );

  useEffect(() => {
    if (!data || printedRef.current) return;
    printedRef.current = true;
    const timer = window.setTimeout(() => window.print(), 250);
    return () => window.clearTimeout(timer);
  }, [data]);

  return (
    <main className="invoice-print-page">
      <section className="invoice-print-page__container">
        <div className="inline-actions invoice-print-page__actions">
          <Link className="secondary-button compact-pill" to="/orders">
            الرجوع للطلبات
          </Link>
          <button className="primary-button" type="button" onClick={() => window.print()}>
            طباعة الآن
          </button>
        </div>

        {loading ? (
          <QueryFeedback title="جارٍ تجهيز صفحة الطباعة" message="نقرأ بيانات الفاتورة وإعدادات الطباعة." />
        ) : error ? (
          <QueryFeedback title="تعذر تحميل بيانات الطباعة" message={error} tone="error" />
        ) : data ? (
          <article className="invoice-print-page__card">
            {isA4Layout ? (
              <div className="invoice-a4-sheet">
                <header className="invoice-a4-header">
                  <div>
                    <p className="eyebrow">Invoice</p>
                    <h1>{data.store?.name || "My Store"}</h1>
                    <p>{previewMeta.receiptHeader}</p>
                  </div>
                  <div className="invoice-a4-meta">
                    <strong>INV-{data.id}</strong>
                    <span>{data.created_at || "-"}</span>
                    <span>{data.store?.vat_number ? `VAT: ${data.store.vat_number}` : "VAT: -"}</span>
                    <span>{data.store?.phone || "TEL: -"}</span>
                  </div>
                </header>

                <section className="invoice-a4-grid">
                  <div className="invoice-a4-box">
                    <strong>بيانات المتجر</strong>
                    <p>{data.store?.address || "لا يوجد عنوان محفوظ"}</p>
                  </div>
                  <div className="invoice-a4-box">
                    <strong>بيانات العميل</strong>
                    <p>{data.customer_name || "عميل نقدي"}</p>
                    <p>{data.customer_phone || "-"}</p>
                    <p>{data.customer_address || "-"}</p>
                  </div>
                </section>

                <table className="invoice-a4-table">
                  <thead>
                    <tr>
                      <th>الصنف</th>
                      <th>الكمية</th>
                      <th>السعر</th>
                      <th>الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.product_name || `#${item.product_id}`}</td>
                        <td>{item.qty}</td>
                        <td>{Number(item.unit_price ?? 0).toFixed(2)} EGP</td>
                        <td>{item.lineTotal.toFixed(2)} EGP</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <section className="invoice-a4-totals">
                  <div><span>Subtotal</span><strong>{Number(data.subtotal ?? 0).toFixed(2)} EGP</strong></div>
                  <div><span>Tax</span><strong>{Number(data.tax ?? 0).toFixed(2)} EGP</strong></div>
                  <div><span>Total</span><strong>{Number(data.total ?? 0).toFixed(2)} EGP</strong></div>
                  <div><span>Paid</span><strong>{Number(data.paid_amount ?? 0).toFixed(2)} EGP</strong></div>
                  <div><span>Change</span><strong>{Number(data.change_due ?? 0).toFixed(2)} EGP</strong></div>
                </section>

                <footer className="invoice-a4-footer">
                  <p>{previewMeta.invoiceFooter || previewMeta.receiptFooter}</p>
                  <p>{previewMeta.qrEnabled ? "QR enabled for this invoice." : "QR not enabled for this invoice."}</p>
                </footer>
              </div>
            ) : (
              <div
                className={`receipt-preview-sheet ${
                  previewMeta.width === "58mm"
                    ? "receipt-preview-sheet--58mm"
                    : "receipt-preview-sheet--80mm"
                }`}
              >
                {[
                  previewMeta.receiptHeader,
                  "------------------------------",
                  data.store?.name || "My Store",
                  data.store?.vat_number ? `VAT: ${data.store.vat_number}` : null,
                  data.store?.phone ? `TEL: ${data.store.phone}` : null,
                  data.store?.address || null,
                  `INV: ${data.id}`,
                  data.created_at ? `DATE: ${data.created_at}` : null,
                  "------------------------------",
                  ...lineItems.map(
                    (item) =>
                      `${(item.product_name || `#${item.product_id}`).slice(0, 18).padEnd(18, " ")} ${item.qty} x ${Number(
                        item.unit_price || 0
                      ).toFixed(2)}`
                  ),
                  "------------------------------",
                  `SUBTOTAL: ${Number(data.subtotal ?? 0).toFixed(2)} EGP`,
                  `TAX: ${Number(data.tax ?? 0).toFixed(2)} EGP`,
                  `TOTAL: ${Number(data.total ?? 0).toFixed(2)} EGP`,
                  `PAID: ${Number(data.paid_amount ?? 0).toFixed(2)} EGP`,
                  `CHANGE: ${Number(data.change_due ?? 0).toFixed(2)} EGP`,
                  data.customer_name ? `CUSTOMER: ${data.customer_name}` : null,
                  previewMeta.qrEnabled ? "QR: ENABLED" : "QR: DISABLED",
                  previewMeta.autoPrintEnabled ? `AUTO PRINT: ON (${previewMeta.width})` : `AUTO PRINT: OFF (${previewMeta.width})`,
                  previewMeta.invoiceFooter || null,
                  previewMeta.receiptFooter
                ]
                  .filter((line): line is string => Boolean(line))
                  .join("\n")}
              </div>
            )}
          </article>
        ) : (
          <QueryFeedback title="لا توجد فاتورة صالحة" message="تحقق من رقم الفاتورة ثم أعد المحاولة." tone="error" />
        )}
      </section>
    </main>
  );
}
