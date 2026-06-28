import { FormEvent, useMemo, useState } from "react";

import { createReservation, createTable, getReservations, getTables } from "../app/api/hospitality";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialTableForm = {
  tableNo: "",
  capacity: "2",
  zone: "",
  status: "available"
};

const initialReservationForm = {
  tableId: "",
  customerName: "",
  customerPhone: "",
  partySize: "2",
  startAt: "",
  endAt: "",
  status: "reserved",
  notes: ""
};

export function TablesPage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [tableForm, setTableForm] = useState(initialTableForm);
  const [reservationForm, setReservationForm] = useState(initialReservationForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: tables, loading: tablesLoading, error: tablesError } = useAsyncValue(
    session ? () => getTables(session.token, session.branchId) : null,
    [session?.token, session?.branchId, refreshKey]
  );
  const { data: reservations, loading: reservationsLoading, error: reservationsError } = useAsyncValue(
    session ? () => getReservations(session.token, session.branchId) : null,
    [session?.token, session?.branchId, refreshKey]
  );

  const availableCount = useMemo(
    () => (tables ?? []).filter((item) => item.status === "available").length,
    [tables]
  );

  const handleCreateTable = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createTable(session.token, {
        table_no: tableForm.tableNo,
        capacity: Number(tableForm.capacity || 2),
        zone: tableForm.zone,
        status: tableForm.status,
        is_active: 1
      }, session.branchId);
      setTableForm(initialTableForm);
      setRefreshKey((value) => value + 1);
      setMessage(`تم إنشاء الطاولة ${created.table_no}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleCreateReservation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await createReservation(session.token, {
        table_id: Number(reservationForm.tableId),
        customer_name: reservationForm.customerName,
        customer_phone: reservationForm.customerPhone,
        party_size: Number(reservationForm.partySize || 1),
        start_at: reservationForm.startAt,
        end_at: reservationForm.endAt,
        status: reservationForm.status,
        notes: reservationForm.notes
      }, session.branchId);
      setReservationForm(initialReservationForm);
      setRefreshKey((value) => value + 1);
      setMessage("تم تسجيل الحجز على الطاولة المحددة.");
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="الطاولات" subtitle="إدارة الطاولات والحجوزات والضيافة للفروع التي تعمل بنمط الخدمة داخل الموقع." />

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">Tables</span><strong>{(tables?.length ?? 0).toLocaleString("ar-EG")}</strong><p>عدد الطاولات المعرفة في الفرع الحالي.</p></article>
        <article className="stat-card"><span className="eyebrow">Available</span><strong>{availableCount.toLocaleString("ar-EG")}</strong><p>الطاولات الجاهزة للاستقبال الآن.</p></article>
        <article className="stat-card"><span className="eyebrow">Reservations</span><strong>{(reservations?.length ?? 0).toLocaleString("ar-EG")}</strong><p>إجمالي الحجوزات المسجلة في الفرع.</p></article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Table Setup</span>
          <h3>إضافة طاولة</h3>
          <form className="auth-form" onSubmit={handleCreateTable}>
            <div className="form-grid">
              <label><span>رقم الطاولة</span><input value={tableForm.tableNo} onChange={(event) => setTableForm((value) => ({ ...value, tableNo: event.target.value }))} /></label>
              <label><span>السعة</span><input type="number" min="1" value={tableForm.capacity} onChange={(event) => setTableForm((value) => ({ ...value, capacity: event.target.value }))} /></label>
              <label><span>المنطقة</span><input value={tableForm.zone} onChange={(event) => setTableForm((value) => ({ ...value, zone: event.target.value }))} /></label>
              <label><span>الحالة</span><select value={tableForm.status} onChange={(event) => setTableForm((value) => ({ ...value, status: event.target.value }))}><option value="available">available</option><option value="occupied">occupied</option><option value="reserved">reserved</option></select></label>
            </div>
            <button className="primary-button" type="submit" disabled={!tableForm.tableNo}>إنشاء الطاولة</button>
          </form>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Reservation</span>
          <h3>إضافة حجز</h3>
          <form className="auth-form" onSubmit={handleCreateReservation}>
            <div className="form-grid">
              <label>
                <span>الطاولة</span>
                <select value={reservationForm.tableId} onChange={(event) => setReservationForm((value) => ({ ...value, tableId: event.target.value }))}>
                  <option value="">اختر الطاولة</option>
                  {(tables ?? []).map((item) => <option key={item.id} value={item.id}>{item.table_no}</option>)}
                </select>
              </label>
              <label><span>اسم العميل</span><input value={reservationForm.customerName} onChange={(event) => setReservationForm((value) => ({ ...value, customerName: event.target.value }))} /></label>
              <label><span>الهاتف</span><input value={reservationForm.customerPhone} onChange={(event) => setReservationForm((value) => ({ ...value, customerPhone: event.target.value }))} /></label>
              <label><span>عدد الأفراد</span><input type="number" min="1" value={reservationForm.partySize} onChange={(event) => setReservationForm((value) => ({ ...value, partySize: event.target.value }))} /></label>
              <label><span>من</span><input type="datetime-local" value={reservationForm.startAt} onChange={(event) => setReservationForm((value) => ({ ...value, startAt: event.target.value }))} /></label>
              <label><span>إلى</span><input type="datetime-local" value={reservationForm.endAt} onChange={(event) => setReservationForm((value) => ({ ...value, endAt: event.target.value }))} /></label>
              <label><span>الحالة</span><select value={reservationForm.status} onChange={(event) => setReservationForm((value) => ({ ...value, status: event.target.value }))}><option value="reserved">reserved</option><option value="confirmed">confirmed</option><option value="cancelled">cancelled</option></select></label>
              <label><span>ملاحظات</span><input value={reservationForm.notes} onChange={(event) => setReservationForm((value) => ({ ...value, notes: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!reservationForm.tableId || !reservationForm.customerName || !reservationForm.startAt || !reservationForm.endAt}>تسجيل الحجز</button>
          </form>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          {tablesLoading ? (
            <QueryFeedback title="جارٍ تحميل الطاولات" message="نقرأ توزيع الطاولات في الفرع الحالي." />
          ) : tablesError ? (
            <QueryFeedback title="فشل تحميل الطاولات" message={tablesError} tone="error" />
          ) : (
            <div className="table-shell">
              <table>
                <thead><tr><th>الطاولة</th><th>السعة</th><th>المنطقة</th><th>الحالة</th></tr></thead>
                <tbody>
                  {(tables ?? []).map((item) => (
                    <tr key={item.id ?? item.table_no}>
                      <td>{item.table_no}</td>
                      <td>{item.capacity}</td>
                      <td>{item.zone || "-"}</td>
                      <td>{item.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="surface-panel">
          {reservationsLoading ? (
            <QueryFeedback title="جارٍ تحميل الحجوزات" message="نقرأ الحجوزات الحالية على الطاولات." />
          ) : reservationsError ? (
            <QueryFeedback title="فشل تحميل الحجوزات" message={reservationsError} tone="error" />
          ) : (
            <div className="table-shell">
              <table>
                <thead><tr><th>العميل</th><th>الطاولة</th><th>الأفراد</th><th>الفترة</th><th>الحالة</th></tr></thead>
                <tbody>
                  {(reservations ?? []).map((item, index) => (
                    <tr key={`${item.id ?? index}-${index}`}>
                      <td>{item.customer_name}</td>
                      <td>{tables?.find((table) => table.id === item.table_id)?.table_no ?? item.table_id}</td>
                      <td>{item.party_size}</td>
                      <td>{item.start_at} / {item.end_at}</td>
                      <td>{item.status}</td>
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
