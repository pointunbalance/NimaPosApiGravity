import { FormEvent, useMemo, useState } from "react";

import { getWarehouses } from "../app/api/advanced";
import { createWorkCenter, getWorkCenters } from "../app/api/masterData";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialForm = {
  name: "",
  warehouseId: ""
};

export function WorkCentersPage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: warehouses } = useAsyncValue(session ? () => getWarehouses(session.token) : null, [session?.token]);
  const { data: centers, loading, error } = useAsyncValue(
    session ? () => getWorkCenters(session.token, selectedWarehouseId ? Number(selectedWarehouseId) : undefined) : null,
    [session?.token, selectedWarehouseId, refreshKey]
  );

  const mappedCenters = useMemo(
    () =>
      (centers ?? []).map((item) => ({
        ...item,
        warehouseName: warehouses?.find((warehouse) => warehouse.id === item.warehouse_id)?.name || "غير مرتبط"
      })),
    [centers, warehouses]
  );

  const linkedCount = mappedCenters.filter((item) => item.warehouse_id).length;

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createWorkCenter(session.token, {
        name: form.name,
        warehouse_id: form.warehouseId ? Number(form.warehouseId) : undefined
      });
      setForm(initialForm);
      setRefreshKey((value) => value + 1);
      setMessage(`تم إنشاء مركز العمل ${created.name}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="مراكز العمل" subtitle="إدارة مواقع وخطوط العمل التشغيلية وربطها بالمستودعات المتاحة من خلال بيانات النظام الفعلية." />

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">Centers</span><strong>{mappedCenters.length.toLocaleString("ar-EG")}</strong><p>عدد مراكز العمل في التصفية الحالية.</p></article>
        <article className="stat-card"><span className="eyebrow">Linked</span><strong>{linkedCount.toLocaleString("ar-EG")}</strong><p>مراكز مرتبطة مباشرة بمستودعات محددة.</p></article>
        <article className="stat-card"><span className="eyebrow">Warehouses</span><strong>{(warehouses?.length ?? 0).toLocaleString("ar-EG")}</strong><p>المستودعات المتاحة للربط مع مراكز العمل.</p></article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Create Center</span>
          <h3>إضافة مركز عمل</h3>
          <form className="auth-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <label><span>اسم المركز</span><input value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} placeholder="مثال: خط التعبئة" /></label>
              <label><span>المستودع المرتبط</span><select value={form.warehouseId} onChange={(event) => setForm((value) => ({ ...value, warehouseId: event.target.value }))}><option value="">بدون ربط</option>{(warehouses ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            </div>
            <button className="primary-button" type="submit" disabled={!form.name}>إنشاء مركز العمل</button>
          </form>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Filter</span>
          <h3>تصفية حسب المستودع</h3>
          <div className="form-grid">
            <label><span>المستودع</span><select value={selectedWarehouseId} onChange={(event) => setSelectedWarehouseId(event.target.value)}><option value="">كل المستودعات</option>{(warehouses ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          </div>
          <p className="muted-text">يُستخدم هذا المسار الآن لعرض مواقع/مراكز التشغيل المخزنة في `master-data locations` لأنها أقرب تمثيل حقيقي متاح في الخلفية لمفهوم work centers.</p>
        </article>
      </section>

      <section className="surface-panel">
        {loading ? (
          <QueryFeedback title="جارٍ تحميل مراكز العمل" message="نقرأ مراكز العمل الحالية من الخلفية." />
        ) : error ? (
          <QueryFeedback title="فشل تحميل مراكز العمل" message={error} tone="error" />
        ) : (
          <div className="table-shell">
            <table>
              <thead><tr><th>#</th><th>اسم المركز</th><th>المستودع</th><th>نوع الربط</th></tr></thead>
              <tbody>
                {mappedCenters.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.warehouseName}</td>
                    <td>{item.warehouse_id ? "مرتبط" : "عام"}</td>
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
