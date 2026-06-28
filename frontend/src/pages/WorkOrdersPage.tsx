import { FormEvent, useMemo, useState } from "react";

import { createProductionOrder, getBom, getBoms } from "../app/api/manufacturing";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialForm = { bomId: "", quantity: "1" };

export function WorkOrdersPage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: boms, loading, error } = useAsyncValue(session ? () => getBoms(session.token) : null, [session?.token, refreshKey]);
  const { data: selectedBom } = useAsyncValue(
    session && form.bomId ? () => getBom(session.token, Number(form.bomId)) : null,
    [session?.token, form.bomId, refreshKey]
  );

  const requiredUnits = useMemo(
    () =>
      (selectedBom?.items ?? []).map((item) => ({
        ...item,
        required_quantity: Number(item.quantity ?? 0) * Number(form.quantity || 0) * (1 + Number(item.wastage_percent ?? 0) / 100)
      })),
    [selectedBom, form.quantity]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const response = await createProductionOrder(session.token, {
        bom_id: Number(form.bomId),
        quantity: Number(form.quantity || 0)
      });
      setRefreshKey((value) => value + 1);
      setMessage(response.message || "تم تنفيذ أمر التشغيل بنجاح.");
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="أوامر التشغيل" subtitle="تنفيذ أمر تصنيع مباشرة من BOM جاهز مع معاينة الكميات المطلوبة للمكونات قبل الإطلاق." />

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">Available BOMs</span><strong>{(boms?.length ?? 0).toLocaleString("ar-EG")}</strong><p>تركيبات متاحة الآن للتشغيل الفوري.</p></article>
        <article className="stat-card"><span className="eyebrow">Selected Product</span><strong>{selectedBom?.product_name || "-"}</strong><p>المنتج النهائي الذي سيستقبل ناتج التشغيل.</p></article>
        <article className="stat-card"><span className="eyebrow">Requested Qty</span><strong>{Number(form.quantity || 0).toLocaleString("ar-EG")}</strong><p>الكمية التي سيتم إنتاجها في هذا الأمر.</p></article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Execute</span>
          <h3>تشغيل جديد</h3>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label><span>التركيبة</span><select value={form.bomId} onChange={(event) => setForm((value) => ({ ...value, bomId: event.target.value }))}><option value="">اختر BOM</option>{(boms ?? []).map((item) => <option key={item.id} value={item.id}>{item.name} - {item.product_name || item.product_id}</option>)}</select></label>
              <label><span>كمية الإنتاج</span><input type="number" min="0.01" step="0.01" value={form.quantity} onChange={(event) => setForm((value) => ({ ...value, quantity: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!form.bomId || !form.quantity}>تنفيذ أمر التشغيل</button>
          </form>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ الأمر" message={errorMessage} tone="error" /> : null}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Requirements</span>
          <h3>المكونات المطلوبة</h3>
          {selectedBom ? (
            <div className="table-shell">
              <table>
                <thead><tr><th>المكون</th><th>الكمية الأساسية</th><th>الهالك</th><th>الكمية المطلوبة</th></tr></thead>
                <tbody>
                  {requiredUnits.map((item, index) => (
                    <tr key={`${item.component_product_id}-${index}`}>
                      <td>{item.component_name || item.component_product_id}</td>
                      <td>{Number(item.quantity ?? 0).toLocaleString("ar-EG")}</td>
                      <td>{Number(item.wastage_percent ?? 0).toLocaleString("ar-EG")}%</td>
                      <td>{Number(item.required_quantity ?? 0).toLocaleString("ar-EG")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <QueryFeedback title="اختر أمرًا" message="حدد BOM وكمية الإنتاج لنحسب الاحتياج المتوقع قبل التنفيذ." />}
        </article>
      </section>

      <section className="surface-panel">
        {loading ? <QueryFeedback title="جارٍ تحميل أوامر التشغيل المتاحة" message="نقرأ تعريفات BOM التي يمكن تشغيلها." /> : error ? <QueryFeedback title="فشل تحميل BOMs" message={error} tone="error" /> : (
          <div className="table-shell">
            <table>
              <thead><tr><th>#</th><th>التركيبة</th><th>المنتج النهائي</th><th>المكونات</th></tr></thead>
              <tbody>
                {(boms ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.product_name || item.product_id}</td>
                    <td>{selectedBom?.id === item.id ? (selectedBom.items?.length ?? 0) : "-"}</td>
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
