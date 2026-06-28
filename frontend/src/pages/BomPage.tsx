import { FormEvent, useMemo, useState } from "react";

import { createBom, getBom, getBoms } from "../app/api/manufacturing";
import { getProducts } from "../app/api/products";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialForm = {
  productId: "",
  name: "",
  version: "1.0",
  totalEstimatedCost: "",
  componentProductId: "",
  quantity: "",
  unitName: "pcs",
  wastagePercent: "0",
  unitCost: ""
};

export function BomPage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedBomId, setSelectedBomId] = useState("");
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: products } = useAsyncValue(session ? () => getProducts(session.token) : null, [session?.token]);
  const { data: boms, loading, error } = useAsyncValue(session ? () => getBoms(session.token) : null, [session?.token, refreshKey]);
  const { data: selectedBom } = useAsyncValue(
    session && selectedBomId ? () => getBom(session.token, Number(selectedBomId)) : null,
    [session?.token, selectedBomId, refreshKey]
  );

  const bomCount = boms?.length ?? 0;
  const totalComponents = useMemo(
    () => (selectedBom?.items ?? []).reduce((sum, item) => sum + Number(item.quantity ?? 0), 0),
    [selectedBom]
  );

  const handleCreateBom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const product = products?.items.find((item) => item.id === Number(form.productId));
      const component = products?.items.find((item) => item.id === Number(form.componentProductId));
      const created = await createBom(session.token, {
        product_id: Number(form.productId),
        name: form.name || `BOM - ${product?.name || form.productId}`,
        version: form.version || "1.0",
        total_estimated_cost: Number(form.totalEstimatedCost || 0),
        items: [
          {
            component_product_id: Number(form.componentProductId),
            quantity: Number(form.quantity || 0),
            unit_name: form.unitName || "pcs",
            wastage_percent: Number(form.wastagePercent || 0),
            unit_cost: Number(form.unitCost || 0)
          }
        ]
      });
      setRefreshKey((value) => value + 1);
      setSelectedBomId(String(created.id));
      setForm(initialForm);
      setMessage(`تم إنشاء BOM جديد للمنتج ${product?.name || created.product_name || ""}${component ? ` باستخدام المكون ${component.name}` : ""}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="قائمة المواد" subtitle="تعريف تركيبات التصنيع الأساسية وربط المنتج النهائي بمكوناته وتكلفته التقديرية من شاشة تشغيلية واحدة." />

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">BOMs</span><strong>{bomCount.toLocaleString("ar-EG")}</strong><p>إجمالي التركيبات المعرفة داخل النظام حاليًا.</p></article>
        <article className="stat-card"><span className="eyebrow">Selected</span><strong>{selectedBom ? selectedBom.name : "-"}</strong><p>التركيبة المفتوحة الآن للمراجعة التفصيلية.</p></article>
        <article className="stat-card"><span className="eyebrow">Components</span><strong>{totalComponents.toLocaleString("ar-EG")}</strong><p>إجمالي كمية المكونات في التركيبة الحالية.</p></article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Create BOM</span>
          <h3>إضافة تركيبة</h3>
          <form className="auth-form" onSubmit={handleCreateBom}>
            <div className="form-grid">
              <label><span>المنتج النهائي</span><select value={form.productId} onChange={(event) => setForm((value) => ({ ...value, productId: event.target.value }))}><option value="">اختر منتجًا</option>{(products?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label><span>اسم التركيبة</span><input value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} placeholder="مثال: خلطة إنتاج قياسية" /></label>
              <label><span>الإصدار</span><input value={form.version} onChange={(event) => setForm((value) => ({ ...value, version: event.target.value }))} /></label>
              <label><span>التكلفة التقديرية</span><input type="number" min="0" step="0.01" value={form.totalEstimatedCost} onChange={(event) => setForm((value) => ({ ...value, totalEstimatedCost: event.target.value }))} /></label>
              <label><span>المكون</span><select value={form.componentProductId} onChange={(event) => setForm((value) => ({ ...value, componentProductId: event.target.value }))}><option value="">اختر مكونًا</option>{(products?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label><span>الكمية</span><input type="number" min="0.01" step="0.01" value={form.quantity} onChange={(event) => setForm((value) => ({ ...value, quantity: event.target.value }))} /></label>
              <label><span>الوحدة</span><input value={form.unitName} onChange={(event) => setForm((value) => ({ ...value, unitName: event.target.value }))} /></label>
              <label><span>الهالك %</span><input type="number" min="0" step="0.01" value={form.wastagePercent} onChange={(event) => setForm((value) => ({ ...value, wastagePercent: event.target.value }))} /></label>
              <label><span>تكلفة المكون</span><input type="number" min="0" step="0.01" value={form.unitCost} onChange={(event) => setForm((value) => ({ ...value, unitCost: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!form.productId || !form.componentProductId || !form.quantity}>حفظ التركيبة</button>
          </form>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر إنشاء التركيبة" message={errorMessage} tone="error" /> : null}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Inspect</span>
          <h3>عرض تفاصيل BOM</h3>
          <div className="form-grid">
            <label><span>التركيبة</span><select value={selectedBomId} onChange={(event) => setSelectedBomId(event.target.value)}><option value="">اختر تركيبة</option>{(boms ?? []).map((item) => <option key={item.id} value={item.id}>{item.name} - {item.product_name || item.product_id}</option>)}</select></label>
          </div>
          {selectedBom ? (
            <div className="table-shell">
              <table>
                <thead><tr><th>المكون</th><th>الكمية</th><th>الوحدة</th><th>الهالك</th><th>التكلفة</th></tr></thead>
                <tbody>
                  {(selectedBom.items ?? []).map((item, index) => (
                    <tr key={`${item.component_product_id}-${index}`}>
                      <td>{item.component_name || item.component_product_id}</td>
                      <td>{Number(item.quantity ?? 0).toLocaleString("ar-EG")}</td>
                      <td>{item.unit_name || "-"}</td>
                      <td>{Number(item.wastage_percent ?? 0).toLocaleString("ar-EG")}%</td>
                      <td>{Number(item.unit_cost ?? 0).toLocaleString("ar-EG")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <QueryFeedback title="اختر تركيبة" message="يمكنك اختيار أي BOM من القائمة لعرض المكونات والتكلفة التقديرية." />}
        </article>
      </section>

      <section className="surface-panel">
        {loading ? <QueryFeedback title="جارٍ تحميل التركيبات" message="نقرأ تعريفات BOM الحالية من الخلفية." /> : error ? <QueryFeedback title="فشل تحميل التركيبات" message={error} tone="error" /> : (
          <div className="table-shell">
            <table>
              <thead><tr><th>#</th><th>الاسم</th><th>المنتج</th><th>الإصدار</th><th>التكلفة التقديرية</th></tr></thead>
              <tbody>
                {(boms ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.product_name || item.product_id}</td>
                    <td>{item.version || "-"}</td>
                    <td>{Number(item.total_estimated_cost ?? 0).toLocaleString("ar-EG")}</td>
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
