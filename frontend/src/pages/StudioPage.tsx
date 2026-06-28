import { FormEvent, useMemo, useState } from "react";

import { createService, deactivateService, getServices, updateService, type ServiceRow } from "../app/api/services";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialCreateForm = {
  name: "",
  nameEn: "",
  price: "",
  category: "labor"
};

const initialEditForm = {
  id: 0,
  name: "",
  nameEn: "",
  price: "",
  category: "labor"
};

export function StudioPage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, loading, error } = useAsyncValue(session ? () => getServices(session.token) : null, [session?.token, refreshKey]);
  const selected = useMemo(() => data?.find((item) => item.id === editForm.id) ?? null, [data, editForm.id]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createService(session.token, {
        name: createForm.name,
        name_en: createForm.nameEn,
        price: Number(createForm.price || 0),
        category: createForm.category
      });
      setCreateForm(initialCreateForm);
      setRefreshKey((value) => value + 1);
      setMessage(`تم إنشاء الخدمة ${created.name}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !selected) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const updated = await updateService(session.token, selected.id, {
        name: editForm.name,
        name_en: editForm.nameEn,
        price: Number(editForm.price || 0),
        category: editForm.category
      });
      setRefreshKey((value) => value + 1);
      setMessage(`تم تحديث الخدمة ${updated.name}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleDeactivate = async (item: ServiceRow) => {
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await deactivateService(session.token, item.id);
      setRefreshKey((value) => value + 1);
      setMessage(`تم تعطيل الخدمة ${item.name}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const startEdit = (item: ServiceRow) => {
    setEditForm({
      id: item.id,
      name: item.name,
      nameEn: item.name_en || "",
      price: String(item.price ?? 0),
      category: item.category || "labor"
    });
  };

  return (
    <div className="page-stack">
      <PageHeader title="الاستوديو" subtitle="إدارة الخدمات غير المخزنية مثل التركيب والجلسات والخدمات التشغيلية داخل بيئات الخدمة." />

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">Services</span><strong>{(data?.length ?? 0).toLocaleString("ar-EG")}</strong><p>عدد الخدمات النشطة الحالية.</p></article>
        <article className="stat-card"><span className="eyebrow">Labor</span><strong>{((data ?? []).filter((item) => item.category === "labor").length).toLocaleString("ar-EG")}</strong><p>الخدمات المصنفة كخدمات عمل مباشرة.</p></article>
        <article className="stat-card"><span className="eyebrow">Selected</span><strong>{selected ? 1 : 0}</strong><p>تحرير مباشر للخدمة المحددة.</p></article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Service Create</span>
          <h3>إضافة خدمة</h3>
          <form className="auth-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <label><span>الاسم</span><input value={createForm.name} onChange={(event) => setCreateForm((value) => ({ ...value, name: event.target.value }))} /></label>
              <label><span>الاسم الإنجليزي</span><input value={createForm.nameEn} onChange={(event) => setCreateForm((value) => ({ ...value, nameEn: event.target.value }))} /></label>
              <label><span>السعر</span><input type="number" min="0" step="0.01" value={createForm.price} onChange={(event) => setCreateForm((value) => ({ ...value, price: event.target.value }))} /></label>
              <label><span>الفئة</span><select value={createForm.category} onChange={(event) => setCreateForm((value) => ({ ...value, category: event.target.value }))}><option value="labor">labor</option><option value="session">session</option><option value="delivery">delivery</option></select></label>
            </div>
            <button className="primary-button" type="submit" disabled={!createForm.name}>إنشاء الخدمة</button>
          </form>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Service Edit</span>
          <h3>{selected ? `تحديث ${selected.name}` : "اختر خدمة من الجدول"}</h3>
          <form className="auth-form" onSubmit={handleUpdate}>
            <div className="form-grid">
              <label><span>الاسم</span><input disabled={!selected} value={editForm.name} onChange={(event) => setEditForm((value) => ({ ...value, name: event.target.value }))} /></label>
              <label><span>الاسم الإنجليزي</span><input disabled={!selected} value={editForm.nameEn} onChange={(event) => setEditForm((value) => ({ ...value, nameEn: event.target.value }))} /></label>
              <label><span>السعر</span><input disabled={!selected} type="number" min="0" step="0.01" value={editForm.price} onChange={(event) => setEditForm((value) => ({ ...value, price: event.target.value }))} /></label>
              <label><span>الفئة</span><select disabled={!selected} value={editForm.category} onChange={(event) => setEditForm((value) => ({ ...value, category: event.target.value }))}><option value="labor">labor</option><option value="session">session</option><option value="delivery">delivery</option></select></label>
            </div>
            <button className="primary-button" disabled={!selected} type="submit">حفظ التعديلات</button>
          </form>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>
      </section>

      <section className="surface-panel">
        {loading ? (
          <QueryFeedback title="جارٍ تحميل الخدمات" message="نقرأ سجل الخدمات النشطة." />
        ) : error ? (
          <QueryFeedback title="فشل تحميل الخدمات" message={error} tone="error" />
        ) : (
          <div className="table-shell">
            <table>
              <thead><tr><th>#</th><th>الخدمة</th><th>الفئة</th><th>السعر</th><th>إجراءات</th></tr></thead>
              <tbody>
                {(data ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.category || "-"}</td>
                    <td>{Number(item.price ?? 0).toLocaleString("ar-EG")}</td>
                    <td>
                      <button className="secondary-button compact-pill" type="button" onClick={() => startEdit(item)}>تعديل</button>
                      <button className="secondary-button compact-pill" type="button" onClick={() => handleDeactivate(item)}>تعطيل</button>
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
