import { FormEvent, useState } from "react";

import { createMaintenanceOrder, getMaintenanceHistory, getMaintenanceOrder, getMaintenanceOrders, updateMaintenanceOrder } from "../app/api/maintenance";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialCreateForm = {
  customerName: "",
  customerPhone: "",
  deviceType: "phone",
  deviceBrand: "",
  deviceModel: "",
  serialNumber: "",
  problemDescription: "",
  priority: "normal",
  estimatedCost: "",
  notes: ""
};

const initialUpdateForm = {
  diagnosis: "",
  status: "received",
  finalCost: "",
  paidAmount: "",
  technician: "",
  notes: ""
};

export function MaintenancePage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [updateForm, setUpdateForm] = useState(initialUpdateForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: orders, loading, error } = useAsyncValue(
    session ? () => getMaintenanceOrders(session.token) : null,
    [session?.token, refreshKey]
  );
  const { data: details } = useAsyncValue(
    session && selectedId ? () => getMaintenanceOrder(session.token, selectedId) : null,
    [session?.token, selectedId, refreshKey]
  );
  const { data: history } = useAsyncValue(
    session && selectedId ? () => getMaintenanceHistory(session.token, selectedId) : null,
    [session?.token, selectedId, refreshKey]
  );

  const startEdit = (id: number) => {
    setSelectedId(id);
    const row = orders?.find((item) => item.id === id);
    if (row) {
      setUpdateForm({
        diagnosis: row.diagnosis || "",
        status: row.status || "received",
        finalCost: String(row.final_cost ?? ""),
        paidAmount: String(row.paid_amount ?? ""),
        technician: row.technician || "",
        notes: row.notes || ""
      });
    }
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createMaintenanceOrder(session.token, {
        customer_name: createForm.customerName,
        customer_phone: createForm.customerPhone,
        device_type: createForm.deviceType,
        device_brand: createForm.deviceBrand,
        device_model: createForm.deviceModel,
        serial_number: createForm.serialNumber,
        problem_description: createForm.problemDescription,
        priority: createForm.priority,
        estimated_cost: Number(createForm.estimatedCost) || 0,
        notes: createForm.notes,
        branch_id: 1
      });
      setCreateForm(initialCreateForm);
      setSelectedId(created.id);
      setRefreshKey((value) => value + 1);
      setMessage(`تم إنشاء أمر صيانة جديد برقم ${created.id}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !selectedId) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await updateMaintenanceOrder(session.token, selectedId, {
        diagnosis: updateForm.diagnosis,
        status: updateForm.status,
        final_cost: Number(updateForm.finalCost) || 0,
        paid_amount: Number(updateForm.paidAmount) || 0,
        technician: updateForm.technician,
        notes: updateForm.notes
      });
      setRefreshKey((value) => value + 1);
      setMessage(`تم تحديث أمر الصيانة رقم ${selectedId}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="أوامر الصيانة" subtitle="تسجيل أجهزة العملاء ومتابعة الحالة والتكلفة وسجل التغييرات." />

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">New Order</span>
          <h3>استلام جهاز جديد</h3>
          <form className="auth-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <label><span>العميل</span><input value={createForm.customerName} onChange={(e) => setCreateForm((v) => ({ ...v, customerName: e.target.value }))} /></label>
              <label><span>الهاتف</span><input value={createForm.customerPhone} onChange={(e) => setCreateForm((v) => ({ ...v, customerPhone: e.target.value }))} /></label>
              <label><span>نوع الجهاز</span><input value={createForm.deviceType} onChange={(e) => setCreateForm((v) => ({ ...v, deviceType: e.target.value }))} /></label>
              <label><span>الماركة</span><input value={createForm.deviceBrand} onChange={(e) => setCreateForm((v) => ({ ...v, deviceBrand: e.target.value }))} /></label>
              <label><span>الموديل</span><input value={createForm.deviceModel} onChange={(e) => setCreateForm((v) => ({ ...v, deviceModel: e.target.value }))} /></label>
              <label><span>السيريال</span><input value={createForm.serialNumber} onChange={(e) => setCreateForm((v) => ({ ...v, serialNumber: e.target.value }))} /></label>
              <label><span>الأولوية</span><select value={createForm.priority} onChange={(e) => setCreateForm((v) => ({ ...v, priority: e.target.value }))}><option value="low">low</option><option value="normal">normal</option><option value="high">high</option></select></label>
              <label><span>تكلفة تقديرية</span><input inputMode="decimal" value={createForm.estimatedCost} onChange={(e) => setCreateForm((v) => ({ ...v, estimatedCost: e.target.value }))} /></label>
              <label className="form-field-span-2"><span>وصف العطل</span><input value={createForm.problemDescription} onChange={(e) => setCreateForm((v) => ({ ...v, problemDescription: e.target.value }))} /></label>
              <label className="form-field-span-2"><span>ملاحظات</span><input value={createForm.notes} onChange={(e) => setCreateForm((v) => ({ ...v, notes: e.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!createForm.customerName || !createForm.problemDescription}>تسجيل أمر الصيانة</button>
          </form>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Order Detail</span>
          <h3>{details?.order_number || (selectedId ? `أمر #${selectedId}` : "اختر أمرًا من الجدول")}</h3>
          {details ? (
            <>
              <p>الجهاز: <strong>{[details.device_type, details.device_brand, details.device_model].filter(Boolean).join(" / ")}</strong></p>
              <p>العميل: <strong>{details.customer_name}</strong></p>
              <form className="auth-form" onSubmit={handleUpdate}>
                <div className="form-grid">
                  <label><span>التشخيص</span><input value={updateForm.diagnosis} onChange={(e) => setUpdateForm((v) => ({ ...v, diagnosis: e.target.value }))} /></label>
                  <label><span>الحالة</span><select value={updateForm.status} onChange={(e) => setUpdateForm((v) => ({ ...v, status: e.target.value }))}><option value="received">received</option><option value="diagnosed">diagnosed</option><option value="in_progress">in_progress</option><option value="completed">completed</option><option value="delivered">delivered</option></select></label>
                  <label><span>التكلفة النهائية</span><input inputMode="decimal" value={updateForm.finalCost} onChange={(e) => setUpdateForm((v) => ({ ...v, finalCost: e.target.value }))} /></label>
                  <label><span>المدفوع</span><input inputMode="decimal" value={updateForm.paidAmount} onChange={(e) => setUpdateForm((v) => ({ ...v, paidAmount: e.target.value }))} /></label>
                  <label><span>الفني</span><input value={updateForm.technician} onChange={(e) => setUpdateForm((v) => ({ ...v, technician: e.target.value }))} /></label>
                  <label className="form-field-span-2"><span>ملاحظات</span><input value={updateForm.notes} onChange={(e) => setUpdateForm((v) => ({ ...v, notes: e.target.value }))} /></label>
                </div>
                <button className="primary-button" type="submit">حفظ التحديث</button>
              </form>
              <div className="detail-grid">
                <div className="feedback-panel"><strong>المدفوع</strong><p>{(details.paid_amount ?? 0).toLocaleString("ar-EG")} ج.م</p></div>
                <div className="feedback-panel"><strong>المتبقي</strong><p>{((details.final_cost ?? 0) - (details.paid_amount ?? 0)).toLocaleString("ar-EG")} ج.م</p></div>
              </div>
            </>
          ) : (
            <QueryFeedback title="لا توجد عملية محددة" message="اختر أمر صيانة من الجدول لعرض الحالة وسجل المتابعة." />
          )}
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>
      </section>

      {selectedId ? (
        <section className="surface-panel">
          <span className="eyebrow">History</span>
          <h3>سجل الحالة</h3>
          {history && history.length > 0 ? (
            <div className="order-list">
              {history.map((item) => (
                <article className="order-row" key={item.id}>
                  <div>
                    <strong>{item.old_status || "new"} → {item.new_status || "-"}</strong>
                    <p>{item.changed_at}</p>
                  </div>
                  <div>
                    <strong>{item.changed_by || "system"}</strong>
                    <p>{item.notes || "بدون ملاحظات"}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <QueryFeedback title="لا يوجد سجل تغييرات" message="سيظهر هنا أي انتقال في حالة الطلب أو ملاحظات مرتبطة به." />
          )}
        </section>
      ) : null}

      <section className="surface-panel">
        {loading ? (
          <QueryFeedback title="جارٍ تحميل أوامر الصيانة" message="نقرأ طلبات العملاء المفتوحة والمكتملة." />
        ) : error ? (
          <QueryFeedback title="فشل تحميل أوامر الصيانة" message={error} tone="error" />
        ) : (
          <div className="table-shell">
            <table>
              <thead><tr><th>#</th><th>العميل</th><th>الجهاز</th><th>الحالة</th><th>الأولوية</th><th>الإجراء</th></tr></thead>
              <tbody>
                {(orders ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.customer_name}</td>
                    <td>{[item.device_type, item.device_brand, item.device_model].filter(Boolean).join(" / ")}</td>
                    <td>{item.status}</td>
                    <td>{item.priority}</td>
                    <td><button className="secondary-button compact-pill" type="button" onClick={() => startEdit(item.id)}>فتح</button></td>
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
