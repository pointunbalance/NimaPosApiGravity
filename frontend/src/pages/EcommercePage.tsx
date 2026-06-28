import { FormEvent, useMemo, useState } from "react";

import { createOnlineChannel, getOnlineChannels, getOnlineOrders } from "../app/api/online";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialForm = {
  key: "",
  name: "",
  isActive: "1",
  settingsJson: "{}"
};

export function EcommercePage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [channelFilter, setChannelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: channels } = useAsyncValue(session ? () => getOnlineChannels(session.token) : null, [session?.token, refreshKey]);
  const { data: orders, loading, error } = useAsyncValue(
    session ? () => getOnlineOrders(session.token, channelFilter ? Number(channelFilter) : undefined, statusFilter || undefined) : null,
    [session?.token, channelFilter, statusFilter, refreshKey]
  );

  const orderTotals = useMemo(
    () => ({
      total: (orders ?? []).reduce((sum, item) => sum + (item.total ?? 0), 0),
      pending: (orders ?? []).filter((item) => item.status === "pending").length
    }),
    [orders]
  );

  const handleCreateChannel = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createOnlineChannel(session.token, {
        key: form.key,
        name: form.name,
        is_active: Number(form.isActive),
        settings_json: form.settingsJson
      });
      setForm(initialForm);
      setRefreshKey((value) => value + 1);
      setMessage(`تم إنشاء قناة ${created.name}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="طلبات المتجر" subtitle="القنوات الإلكترونية والطلبات القادمة منها مع عرض مفلتر حسب الحالة والقناة." />

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">Channels</span><strong>{(channels ?? []).length.toLocaleString("ar-EG")}</strong><p>عدد القنوات الإلكترونية المعرفة.</p></article>
        <article className="stat-card"><span className="eyebrow">Orders</span><strong>{(orders ?? []).length.toLocaleString("ar-EG")}</strong><p>عدد الطلبات في الفلتر الحالي.</p></article>
        <article className="stat-card"><span className="eyebrow">Net Total</span><strong>{orderTotals.total.toLocaleString("ar-EG")}</strong><p>إجمالي قيمة الطلبات الظاهرة.</p></article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Channel Setup</span>
          <h3>إضافة قناة</h3>
          <form className="auth-form" onSubmit={handleCreateChannel}>
            <div className="form-grid">
              <label><span>المفتاح</span><input value={form.key} onChange={(event) => setForm((value) => ({ ...value, key: event.target.value }))} /></label>
              <label><span>الاسم</span><input value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} /></label>
              <label><span>الحالة</span><select value={form.isActive} onChange={(event) => setForm((value) => ({ ...value, isActive: event.target.value }))}><option value="1">نشطة</option><option value="0">متوقفة</option></select></label>
              <label><span>الإعدادات JSON</span><input value={form.settingsJson} onChange={(event) => setForm((value) => ({ ...value, settingsJson: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!form.key || !form.name}>إنشاء القناة</button>
          </form>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Filters</span>
          <h3>تصفية الطلبات</h3>
          <div className="form-grid">
            <label>
              <span>القناة</span>
              <select value={channelFilter} onChange={(event) => setChannelFilter(event.target.value)}>
                <option value="">كل القنوات</option>
                {(channels ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label>
              <span>الحالة</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">كل الحالات</option>
                <option value="pending">pending</option>
                <option value="processing">processing</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
              </select>
            </label>
          </div>
          <p>استخدم الفلاتر لمراجعة الطلبات القادمة من قنوات البيع الإلكترونية.</p>
        </article>
      </section>

      <section className="surface-panel">
        {loading ? (
          <QueryFeedback title="جارٍ تحميل الطلبات" message="نقرأ طلبات التجارة الإلكترونية الحالية." />
        ) : error ? (
          <QueryFeedback title="فشل تحميل الطلبات" message={error} tone="error" />
        ) : (
          <div className="table-shell">
            <table>
              <thead><tr><th>#</th><th>رقم الطلب</th><th>القناة</th><th>الحالة</th><th>الدفع</th><th>التنفيذ</th><th>الإجمالي</th></tr></thead>
              <tbody>
                {(orders ?? []).map((item) => (
                  <tr key={`${item.order_no}-${item.id ?? item.external_ref ?? ""}`}>
                    <td>{item.id || "-"}</td>
                    <td>{item.order_no}</td>
                    <td>{channels?.find((channel) => channel.id === item.channel_id)?.name ?? item.channel_id}</td>
                    <td>{item.status}</td>
                    <td>{item.payment_status}</td>
                    <td>{item.fulfillment_status}</td>
                    <td>{Number(item.total ?? 0).toLocaleString("ar-EG")}</td>
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
