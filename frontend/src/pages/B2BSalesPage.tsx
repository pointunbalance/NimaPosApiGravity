import { FormEvent, useMemo, useState } from "react";

import { getCustomers } from "../app/api/customers";
import { getOrders } from "../app/api/orders";
import { createQuotation, getQuotations } from "../app/api/quotations";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialForm = {
  customerId: "",
  totalAmount: "",
  expiryDate: "",
  notes: ""
};

export function B2BSalesPage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: customers } = useAsyncValue(session ? () => getCustomers(session.token) : null, [session?.token]);
  const { data: quotations, loading: quotationsLoading, error: quotationsError } = useAsyncValue(
    session ? () => getQuotations(session.token) : null,
    [session?.token, refreshKey]
  );
  const { data: orders, loading: ordersLoading, error: ordersError } = useAsyncValue(
    session ? () => getOrders(session.token) : null,
    [session?.token, refreshKey]
  );

  const priorityCustomers = useMemo(
    () => [...(customers?.items ?? [])].sort((a, b) => Number(b.total_purchases ?? 0) - Number(a.total_purchases ?? 0)).slice(0, 8),
    [customers]
  );

  const handleCreateQuotation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);

    const customer = customers?.items.find((item) => item.id === Number(form.customerId));
    if (!customer) {
      setErrorMessage("اختر عميلًا قبل إنشاء عرض السعر.");
      return;
    }

    try {
      await createQuotation(
        session.token,
        {
          customer_name: customer.name,
          total_amount: Number(form.totalAmount || 0),
          expiry_date: form.expiryDate || undefined,
          notes: form.notes || undefined
        },
        session.user.username
      );
      setForm(initialForm);
      setRefreshKey((value) => value + 1);
      setMessage(`تم إنشاء عرض سعر جديد للعميل ${customer.name}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="مبيعات الجملة" subtitle="شاشة تشغيلية لمتابعة عملاء الجملة والعروض التجارية وأحدث الفواتير من نفس المسار." />

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">Customers</span><strong>{(customers?.items.length ?? 0).toLocaleString("ar-EG")}</strong><p>عملاء الجملة والحسابات التجارية المسجلة.</p></article>
        <article className="stat-card"><span className="eyebrow">Quotations</span><strong>{(quotations?.items.length ?? 0).toLocaleString("ar-EG")}</strong><p>عروض الأسعار النشطة في المسار التجاري.</p></article>
        <article className="stat-card"><span className="eyebrow">Invoices</span><strong>{(orders?.items.length ?? 0).toLocaleString("ar-EG")}</strong><p>آخر الفواتير الملتقطة من دورة البيع.</p></article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Trade Quote</span>
          <h3>إنشاء عرض سعر سريع</h3>
          <form className="auth-form" onSubmit={handleCreateQuotation}>
            <div className="form-grid">
              <label>
                <span>العميل</span>
                <select value={form.customerId} onChange={(event) => setForm((value) => ({ ...value, customerId: event.target.value }))}>
                  <option value="">اختر عميلًا</option>
                  {(customers?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label><span>القيمة</span><input type="number" min="0" step="0.01" value={form.totalAmount} onChange={(event) => setForm((value) => ({ ...value, totalAmount: event.target.value }))} /></label>
              <label><span>انتهاء العرض</span><input type="date" value={form.expiryDate} onChange={(event) => setForm((value) => ({ ...value, expiryDate: event.target.value }))} /></label>
              <label><span>ملاحظات</span><input value={form.notes} onChange={(event) => setForm((value) => ({ ...value, notes: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!form.customerId || !form.totalAmount}>إنشاء عرض السعر</button>
          </form>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Priority Accounts</span>
          <h3>أهم الحسابات التجارية</h3>
          <div className="table-shell">
            <table>
              <thead><tr><th>العميل</th><th>الهاتف</th><th>المشتريات</th><th>الرصيد</th></tr></thead>
              <tbody>
                {priorityCustomers.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.phone || "-"}</td>
                    <td>{Number(item.total_purchases ?? 0).toLocaleString("ar-EG")}</td>
                    <td>{Number(item.balance ?? 0).toLocaleString("ar-EG")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          {quotationsLoading ? (
            <QueryFeedback title="جارٍ تحميل العروض" message="نقرأ عروض الأسعار الحالية الخاصة بالحسابات التجارية." />
          ) : quotationsError ? (
            <QueryFeedback title="فشل تحميل العروض" message={quotationsError} tone="error" />
          ) : (
            <div className="table-shell">
              <table>
                <thead><tr><th>العميل</th><th>القيمة</th><th>الحالة</th><th>الانتهاء</th></tr></thead>
                <tbody>
                  {(quotations?.items ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.customer_name}</td>
                      <td>{Number(item.total_amount ?? 0).toLocaleString("ar-EG")}</td>
                      <td>{item.status || "-"}</td>
                      <td>{item.expiry_date || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="surface-panel">
          {ordersLoading ? (
            <QueryFeedback title="جارٍ تحميل الفواتير" message="نقرأ آخر فواتير البيع لتتبع التحول من عرض إلى تنفيذ." />
          ) : ordersError ? (
            <QueryFeedback title="فشل تحميل الفواتير" message={ordersError} tone="error" />
          ) : (
            <div className="table-shell">
              <table>
                <thead><tr><th>#</th><th>العميل</th><th>الإجمالي</th><th>الدفع</th><th>التاريخ</th></tr></thead>
                <tbody>
                  {(orders?.items ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.customer_name || "-"}</td>
                      <td>{Number(item.net_total ?? 0).toLocaleString("ar-EG")}</td>
                      <td>{item.payment_method || "-"}</td>
                      <td>{item.created_at || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
