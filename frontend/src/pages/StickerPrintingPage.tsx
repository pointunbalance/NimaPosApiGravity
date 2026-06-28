import { FormEvent, useState } from "react";

import { createLabelTemplate, getLabelTemplates, getPrintableProducts } from "../app/api/printing";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialForm = {
  name: "",
  width: "60",
  height: "40",
  labelsPerRow: "2",
  designType: "standard",
  customText: ""
};

export function StickerPrintingPage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: templates, loading, error } = useAsyncValue(
    session ? () => getLabelTemplates(session.token, "sticker") : null,
    [session?.token, refreshKey]
  );
  const { data: products } = useAsyncValue(
    session ? () => getPrintableProducts(session.token, search.trim() || undefined) : null,
    [session?.token, search]
  );

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createLabelTemplate(session.token, {
        name: form.name,
        type: "sticker",
        width: Number(form.width || 60),
        height: Number(form.height || 40),
        labels_per_row: Number(form.labelsPerRow || 2),
        design_type: form.designType,
        custom_text: form.customText,
        show_name: true,
        show_price: true,
        show_code: true,
        show_store_name: true
      });
      setForm(initialForm);
      setRefreshKey((value) => value + 1);
      setMessage(`تم إنشاء قالب ملصقات برقم ${created.id}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="الملصقات" subtitle="قوالب ملصقات المنتجات والعناوين مع استعراض الأصناف القابلة للطباعة." />

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Sticker Builder</span>
          <h3>إنشاء قالب ملصقات</h3>
          <form className="auth-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <label><span>اسم القالب</span><input value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} /></label>
              <label><span>العرض</span><input type="number" value={form.width} onChange={(event) => setForm((value) => ({ ...value, width: event.target.value }))} /></label>
              <label><span>الارتفاع</span><input type="number" value={form.height} onChange={(event) => setForm((value) => ({ ...value, height: event.target.value }))} /></label>
              <label><span>عدد الملصقات في الصف</span><input type="number" value={form.labelsPerRow} onChange={(event) => setForm((value) => ({ ...value, labelsPerRow: event.target.value }))} /></label>
              <label><span>نمط التصميم</span><select value={form.designType} onChange={(event) => setForm((value) => ({ ...value, designType: event.target.value }))}><option value="standard">standard</option><option value="compact">compact</option><option value="shelf">shelf</option></select></label>
              <label><span>نص إضافي</span><input value={form.customText} onChange={(event) => setForm((value) => ({ ...value, customText: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!form.name}>إنشاء القالب</button>
          </form>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Preview Queue</span>
          <h3>منتجات الملصقات</h3>
          <div className="form-grid">
            <label><span>بحث</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="اسم المنتج أو SKU" /></label>
          </div>
          <div className="table-shell">
            <table>
              <thead><tr><th>#</th><th>المنتج</th><th>الباركود</th><th>المخزون</th></tr></thead>
              <tbody>
                {(products ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.barcode || "-"}</td>
                    <td>{Number(item.stock_qty ?? 0).toLocaleString("ar-EG")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="surface-panel">
        {loading ? (
          <QueryFeedback title="جارٍ تحميل القوالب" message="نقرأ قوالب الملصقات الحالية." />
        ) : error ? (
          <QueryFeedback title="فشل تحميل القوالب" message={error} tone="error" />
        ) : (
          <div className="table-shell">
            <table>
              <thead><tr><th>#</th><th>الاسم</th><th>المقاس</th><th>التصميم</th><th>النص</th></tr></thead>
              <tbody>
                {(templates ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.width} × {item.height}</td>
                    <td>{item.design_type || "-"}</td>
                    <td>{item.custom_text || "-"}</td>
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
