import { FormEvent, useState } from "react";

import { createAsset, depreciateAsset, getAssets } from "../app/api/accounting";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const today = new Date().toISOString().slice(0, 10);
const initialForm = {
  name: "",
  cost: "",
  value: "",
  salvageValue: "",
  purchaseDate: today,
  lifeInYears: "5",
  category: "",
  serialNumber: "",
  location: "",
  note: ""
};

export function AssetsPage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [depreciationAmount, setDepreciationAmount] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, loading, error } = useAsyncValue(session ? () => getAssets(session.token) : null, [session?.token, refreshKey]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createAsset(session.token, {
        name: form.name,
        cost: Number(form.cost) || 0,
        value: Number(form.value) || 0,
        salvage_value: Number(form.salvageValue) || 0,
        purchase_date: form.purchaseDate,
        life_in_years: Number(form.lifeInYears) || 5,
        category: form.category,
        serial_number: form.serialNumber,
        location: form.location,
        note: form.note,
        status: "Active"
      });
      setForm(initialForm);
      setSelectedAssetId(created.id);
      setRefreshKey((value) => value + 1);
      setMessage(`تم إنشاء الأصل ${created.name}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleDepreciation = async () => {
    if (!session || !selectedAssetId || !depreciationAmount) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const updated = await depreciateAsset(session.token, selectedAssetId, Number(depreciationAmount) || 0);
      setRefreshKey((value) => value + 1);
      setMessage(`تم تسجيل إهلاك على الأصل ${updated.name}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="الأصول" subtitle="إدارة الأصول الثابتة وتسجيل الإهلاك الدوري على الأصول الحالية." />

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">New Asset</span>
          <h3>إضافة أصل ثابت</h3>
          <form className="auth-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <label><span>الاسم</span><input value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} /></label>
              <label><span>التكلفة</span><input inputMode="decimal" value={form.cost} onChange={(e) => setForm((v) => ({ ...v, cost: e.target.value }))} /></label>
              <label><span>القيمة الحالية</span><input inputMode="decimal" value={form.value} onChange={(e) => setForm((v) => ({ ...v, value: e.target.value }))} /></label>
              <label><span>القيمة التخريدية</span><input inputMode="decimal" value={form.salvageValue} onChange={(e) => setForm((v) => ({ ...v, salvageValue: e.target.value }))} /></label>
              <label><span>تاريخ الشراء</span><input type="date" value={form.purchaseDate} onChange={(e) => setForm((v) => ({ ...v, purchaseDate: e.target.value }))} /></label>
              <label><span>العمر بالسنوات</span><input inputMode="numeric" value={form.lifeInYears} onChange={(e) => setForm((v) => ({ ...v, lifeInYears: e.target.value }))} /></label>
              <label><span>الفئة</span><input value={form.category} onChange={(e) => setForm((v) => ({ ...v, category: e.target.value }))} /></label>
              <label><span>السيريال</span><input value={form.serialNumber} onChange={(e) => setForm((v) => ({ ...v, serialNumber: e.target.value }))} /></label>
              <label><span>الموقع</span><input value={form.location} onChange={(e) => setForm((v) => ({ ...v, location: e.target.value }))} /></label>
              <label className="form-field-span-2"><span>ملاحظات</span><input value={form.note} onChange={(e) => setForm((v) => ({ ...v, note: e.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!form.name || !form.cost || !form.value}>إنشاء الأصل</button>
          </form>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Depreciation</span>
          <h3>تسجيل إهلاك</h3>
          <div className="form-grid">
            <label>
              <span>الأصل</span>
              <select value={selectedAssetId ?? ""} onChange={(e) => setSelectedAssetId(e.target.value ? Number(e.target.value) : null)}>
                <option value="">اختر الأصل</option>
                {(data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label><span>قيمة الإهلاك</span><input inputMode="decimal" value={depreciationAmount} onChange={(e) => setDepreciationAmount(e.target.value)} /></label>
          </div>
          <div className="inline-actions">
            <button className="secondary-button compact-pill" type="button" onClick={handleDepreciation} disabled={!selectedAssetId || !depreciationAmount}>تسجيل الإهلاك</button>
          </div>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>
      </section>

      <section className="surface-panel">
        {loading ? (
          <QueryFeedback title="جارٍ تحميل الأصول" message="نقرأ سجل الأصول الثابتة." />
        ) : error ? (
          <QueryFeedback title="فشل تحميل الأصول" message={error} tone="error" />
        ) : (
          <div className="table-shell">
            <table>
              <thead><tr><th>#</th><th>الاسم</th><th>الفئة</th><th>القيمة</th><th>الموقع</th><th>الحالة</th></tr></thead>
              <tbody>
                {(data ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.category || "-"}</td>
                    <td>{(item.value ?? 0).toLocaleString("ar-EG")} ج.م</td>
                    <td>{item.location || "-"}</td>
                    <td>{item.status}</td>
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
