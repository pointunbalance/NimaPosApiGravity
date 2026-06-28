import { FormEvent, useMemo, useState } from "react";

import { getCustomers } from "../app/api/customers";
import { getProducts } from "../app/api/products";
import {
  createRentalBooking,
  getOverdueRentals,
  getRentalBookings,
  returnRentalBooking
} from "../app/api/rentals";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialForm = {
  rentalNo: "",
  customerId: "",
  customerName: "",
  productId: "",
  pickupAt: "",
  dueAt: "",
  rentalFee: "",
  depositAmount: "",
  notes: ""
};

export function RentalsPage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: customers } = useAsyncValue(session ? () => getCustomers(session.token) : null, [session?.token]);
  const { data: products } = useAsyncValue(session ? () => getProducts(session.token) : null, [session?.token]);
  const { data: bookings, loading, error } = useAsyncValue(
    session ? () => getRentalBookings(session.token, session.branchId, statusFilter || undefined) : null,
    [session?.token, session?.branchId, statusFilter, refreshKey]
  );
  const { data: overdue } = useAsyncValue(
    session ? () => getOverdueRentals(session.token, session.branchId) : null,
    [session?.token, session?.branchId, refreshKey]
  );

  const activeCount = useMemo(
    () => (bookings ?? []).filter((item) => item.status === "active").length,
    [bookings]
  );

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const customerName =
        form.customerName ||
        customers?.items.find((item) => item.id === Number(form.customerId))?.name ||
        "";
      await createRentalBooking(session.token, {
        rental_no: form.rentalNo,
        customer_id: form.customerId ? Number(form.customerId) : undefined,
        customer_name: customerName,
        branch_id: session.branchId,
        product_id: Number(form.productId),
        pickup_at: form.pickupAt,
        due_at: form.dueAt,
        rental_fee: Number(form.rentalFee || 0),
        deposit_amount: Number(form.depositAmount || 0),
        notes: form.notes || undefined
      });
      setForm(initialForm);
      setRefreshKey((value) => value + 1);
      setMessage("تم تسجيل عملية تأجير جديدة بنجاح.");
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleReturn = async (bookingId: number | undefined) => {
    if (!session || !bookingId) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await returnRentalBooking(session.token, bookingId, 0);
      setRefreshKey((value) => value + 1);
      setMessage("تم إغلاق عملية التأجير وإرجاع الأصل.");
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="التأجير" subtitle="إدارة الحجوزات الدورية للأصول أو المنتجات مع تتبع الاستلام والاستحقاق وحالات التأخير." />

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">Bookings</span><strong>{(bookings?.length ?? 0).toLocaleString("ar-EG")}</strong><p>إجمالي عمليات التأجير في الفرع الحالي.</p></article>
        <article className="stat-card"><span className="eyebrow">Active</span><strong>{activeCount.toLocaleString("ar-EG")}</strong><p>التأجيرات النشطة التي ما زالت لدى العملاء.</p></article>
        <article className="stat-card"><span className="eyebrow">Overdue</span><strong>{(overdue?.length ?? 0).toLocaleString("ar-EG")}</strong><p>التأجيرات التي تجاوزت تاريخ الاستحقاق.</p></article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">New Rental</span>
          <h3>تسجيل عملية تأجير</h3>
          <form className="auth-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <label><span>رقم التأجير</span><input value={form.rentalNo} onChange={(event) => setForm((value) => ({ ...value, rentalNo: event.target.value }))} /></label>
              <label>
                <span>العميل</span>
                <select value={form.customerId} onChange={(event) => setForm((value) => ({ ...value, customerId: event.target.value }))}>
                  <option value="">اختر عميلًا</option>
                  {(customers?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label><span>اسم العميل اليدوي</span><input value={form.customerName} onChange={(event) => setForm((value) => ({ ...value, customerName: event.target.value }))} /></label>
              <label>
                <span>المنتج</span>
                <select value={form.productId} onChange={(event) => setForm((value) => ({ ...value, productId: event.target.value }))}>
                  <option value="">اختر منتجًا</option>
                  {(products?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label><span>الاستلام</span><input type="datetime-local" value={form.pickupAt} onChange={(event) => setForm((value) => ({ ...value, pickupAt: event.target.value }))} /></label>
              <label><span>الاستحقاق</span><input type="datetime-local" value={form.dueAt} onChange={(event) => setForm((value) => ({ ...value, dueAt: event.target.value }))} /></label>
              <label><span>رسوم التأجير</span><input type="number" min="0" step="0.01" value={form.rentalFee} onChange={(event) => setForm((value) => ({ ...value, rentalFee: event.target.value }))} /></label>
              <label><span>التأمين</span><input type="number" min="0" step="0.01" value={form.depositAmount} onChange={(event) => setForm((value) => ({ ...value, depositAmount: event.target.value }))} /></label>
              <label><span>ملاحظات</span><input value={form.notes} onChange={(event) => setForm((value) => ({ ...value, notes: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!form.rentalNo || !form.productId || !form.pickupAt || !form.dueAt}>تسجيل التأجير</button>
          </form>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Filters</span>
          <h3>تصفية التأجيرات</h3>
          <div className="form-grid">
            <label>
              <span>الحالة</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">كل الحالات</option>
                <option value="active">active</option>
                <option value="returned">returned</option>
              </select>
            </label>
          </div>
          <p className="muted-text">يمكنك مراقبة التأجيرات النشطة فقط أو مراجعة السجل الكامل بما فيه التأجيرات المغلقة.</p>
        </article>
      </section>

      <section className="surface-panel">
        {loading ? (
          <QueryFeedback title="جارٍ تحميل التأجيرات" message="نقرأ التأجيرات الحالية وتواريخ الاستلام والاستحقاق." />
        ) : error ? (
          <QueryFeedback title="فشل تحميل التأجيرات" message={error} tone="error" />
        ) : (
          <div className="table-shell">
            <table>
              <thead><tr><th>الرقم</th><th>العميل</th><th>المنتج</th><th>الاستلام</th><th>الاستحقاق</th><th>الحالة</th><th>إجراء</th></tr></thead>
              <tbody>
                {(bookings ?? []).map((item) => (
                  <tr key={item.id ?? item.rental_no}>
                    <td>{item.rental_no}</td>
                    <td>{item.customer_name}</td>
                    <td>{products?.items.find((product) => product.id === item.product_id)?.name ?? item.product_id}</td>
                    <td>{item.pickup_at}</td>
                    <td>{item.due_at}</td>
                    <td>{item.status}</td>
                    <td>
                      <button type="button" className="secondary-button" disabled={item.status === "returned"} onClick={() => handleReturn(item.id)}>
                        إرجاع
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
