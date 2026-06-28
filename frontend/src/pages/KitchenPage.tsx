import { FormEvent, useMemo, useState } from "react";

import {
  createKitchenTicket,
  getKitchenTickets,
  updateKitchenItemStatus,
  updateKitchenTicketStatus
} from "../app/api/hospitality";
import { getProducts } from "../app/api/products";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialForm = {
  ticketNo: "",
  sourceType: "dine_in",
  sourceRef: "",
  customerName: "",
  priority: "normal",
  itemName: "",
  productId: "",
  qty: "1",
  notes: ""
};

export function KitchenPage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: tickets, loading, error } = useAsyncValue(
    session ? () => getKitchenTickets(session.token, session.branchId, statusFilter || undefined) : null,
    [session?.token, session?.branchId, statusFilter, refreshKey]
  );
  const { data: products } = useAsyncValue(session ? () => getProducts(session.token) : null, [session?.token]);

  const queueCount = useMemo(
    () => (tickets ?? []).filter((item) => item.status === "queued").length,
    [tickets]
  );
  const readyCount = useMemo(
    () => (tickets ?? []).filter((item) => item.status === "ready").length,
    [tickets]
  );

  const handleCreateTicket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createKitchenTicket(session.token, {
        ticket_no: form.ticketNo,
        branch_id: session.branchId,
        source_type: form.sourceType,
        source_ref: form.sourceRef || undefined,
        customer_name: form.customerName || undefined,
        priority: form.priority,
        status: "queued",
        items: [
          {
            product_id: form.productId ? Number(form.productId) : undefined,
            item_name: form.itemName,
            qty: Number(form.qty || 1),
            status: "queued",
            notes: form.notes || undefined
          }
        ]
      });
      setForm(initialForm);
      setRefreshKey((value) => value + 1);
      setMessage(`تم إنشاء تذكرة المطبخ ${created.ticket_no}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleTicketStatus = async (ticketId: number | undefined, status: string) => {
    if (!session || !ticketId) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await updateKitchenTicketStatus(session.token, ticketId, status);
      setRefreshKey((value) => value + 1);
      setMessage(`تم تحديث حالة التذكرة إلى ${status}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleFirstItemDone = async (itemId: number | undefined) => {
    if (!session || !itemId) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await updateKitchenItemStatus(session.token, itemId, "done");
      setRefreshKey((value) => value + 1);
      setMessage("تم تعليم أول عنصر في التذكرة كمكتمل.");
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="المطبخ" subtitle="تشغيل تذاكر التحضير ومتابعة حالة الطلبات وعناصرها من شاشة واحدة مناسبة لبيئات الضيافة." />

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">Tickets</span><strong>{(tickets?.length ?? 0).toLocaleString("ar-EG")}</strong><p>عدد تذاكر المطبخ الحالية في الفرع.</p></article>
        <article className="stat-card"><span className="eyebrow">Queued</span><strong>{queueCount.toLocaleString("ar-EG")}</strong><p>التذاكر التي ما زالت بانتظار التحضير.</p></article>
        <article className="stat-card"><span className="eyebrow">Ready</span><strong>{readyCount.toLocaleString("ar-EG")}</strong><p>التذاكر الجاهزة للتسليم أو التقديم.</p></article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Ticket Intake</span>
          <h3>إنشاء تذكرة مطبخ</h3>
          <form className="auth-form" onSubmit={handleCreateTicket}>
            <div className="form-grid">
              <label><span>رقم التذكرة</span><input value={form.ticketNo} onChange={(event) => setForm((value) => ({ ...value, ticketNo: event.target.value }))} /></label>
              <label><span>نوع المصدر</span><select value={form.sourceType} onChange={(event) => setForm((value) => ({ ...value, sourceType: event.target.value }))}><option value="dine_in">dine_in</option><option value="delivery">delivery</option><option value="takeaway">takeaway</option></select></label>
              <label><span>مرجع المصدر</span><input value={form.sourceRef} onChange={(event) => setForm((value) => ({ ...value, sourceRef: event.target.value }))} /></label>
              <label><span>اسم العميل</span><input value={form.customerName} onChange={(event) => setForm((value) => ({ ...value, customerName: event.target.value }))} /></label>
              <label><span>الأولوية</span><select value={form.priority} onChange={(event) => setForm((value) => ({ ...value, priority: event.target.value }))}><option value="normal">normal</option><option value="rush">rush</option><option value="vip">vip</option></select></label>
              <label><span>الصنف</span><input value={form.itemName} onChange={(event) => setForm((value) => ({ ...value, itemName: event.target.value }))} /></label>
              <label>
                <span>المنتج</span>
                <select value={form.productId} onChange={(event) => setForm((value) => ({ ...value, productId: event.target.value }))}>
                  <option value="">بدون ربط مباشر</option>
                  {(products?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label><span>الكمية</span><input type="number" min="1" value={form.qty} onChange={(event) => setForm((value) => ({ ...value, qty: event.target.value }))} /></label>
              <label><span>ملاحظات</span><input value={form.notes} onChange={(event) => setForm((value) => ({ ...value, notes: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!form.ticketNo || !form.itemName}>إنشاء التذكرة</button>
          </form>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Queue Filter</span>
          <h3>فلترة صف المطبخ</h3>
          <div className="form-grid">
            <label>
              <span>الحالة</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">الكل</option>
                <option value="queued">queued</option>
                <option value="preparing">preparing</option>
                <option value="ready">ready</option>
                <option value="served">served</option>
              </select>
            </label>
          </div>
          <p className="muted-text">يمكنك عرض الصف بالكامل أو التركيز على مرحلة تشغيل محددة داخل المطبخ.</p>
        </article>
      </section>

      <section className="surface-panel">
        {loading ? (
          <QueryFeedback title="جارٍ تحميل تذاكر المطبخ" message="نقرأ التذاكر الحالية وحالة عناصر التحضير." />
        ) : error ? (
          <QueryFeedback title="فشل تحميل تذاكر المطبخ" message={error} tone="error" />
        ) : (
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>التذكرة</th>
                  <th>المصدر</th>
                  <th>العميل</th>
                  <th>الأولوية</th>
                  <th>الحالة</th>
                  <th>العناصر</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {(tickets ?? []).map((ticket, index) => {
                  const firstOpenItem = ticket.items.find((item) => item.status !== "done");
                  return (
                    <tr key={`${ticket.id ?? index}-${index}`}>
                      <td>{ticket.ticket_no}</td>
                      <td>{ticket.source_type}{ticket.source_ref ? ` / ${ticket.source_ref}` : ""}</td>
                      <td>{ticket.customer_name || "-"}</td>
                      <td>{ticket.priority}</td>
                      <td>{ticket.status}</td>
                      <td>{ticket.items.map((item) => `${item.item_name} x${item.qty} [${item.status}]`).join(" ، ")}</td>
                      <td>
                        <div className="inline-actions">
                          <button type="button" className="secondary-button" onClick={() => handleTicketStatus(ticket.id, "preparing")}>Preparing</button>
                          <button type="button" className="secondary-button" onClick={() => handleTicketStatus(ticket.id, "ready")}>Ready</button>
                          <button type="button" className="secondary-button" onClick={() => handleFirstItemDone(firstOpenItem?.id)}>First Item Done</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
