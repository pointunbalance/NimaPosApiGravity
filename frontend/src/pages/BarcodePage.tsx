import { FormEvent, useState } from "react";

import { createLabelTemplate, getLabelTemplates, getPrintableProducts } from "../app/api/printing";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialForm = {
  name: "",
  width: "50",
  height: "30",
  fontSize: "12",
  barcodeFormat: "CODE128",
  paperType: "thermal",
  labelsPerRow: "2",
  customText: ""
};

export function BarcodePage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: templates, loading, error } = useAsyncValue(
    session ? () => getLabelTemplates(session.token, "barcode") : null,
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
        type: "barcode",
        width: Number(form.width || 50),
        height: Number(form.height || 30),
        font_size: Number(form.fontSize || 12),
        barcode_format: form.barcodeFormat,
        paper_type: form.paperType,
        labels_per_row: Number(form.labelsPerRow || 2),
        custom_text: form.customText,
        show_name: true,
        show_price: true,
        show_code: true
      });
      setForm(initialForm);
      setRefreshKey((value) => value + 1);
      setMessage(`تم إنشاء قالب باركود برقم ${created.id}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="الباركود" subtitle="إدارة قوالب الباركود واستعراض الأصناف الجاهزة للطباعة من نفس الشاشة." />

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Template Builder</span>
          <h3>إنشاء قالب باركود</h3>
          <form className="auth-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <label><span>اسم القالب</span><input value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} /></label>
              <label><span>العرض</span><input type="number" value={form.width} onChange={(event) => setForm((value) => ({ ...value, width: event.target.value }))} /></label>
              <label><span>الارتفاع</span><input type="number" value={form.height} onChange={(event) => setForm((value) => ({ ...value, height: event.target.value }))} /></label>
              <label><span>حجم الخط</span><input type="number" value={form.fontSize} onChange={(event) => setForm((value) => ({ ...value, fontSize: event.target.value }))} /></label>
              <label><span>نوع الباركود</span><select value={form.barcodeFormat} onChange={(event) => setForm((value) => ({ ...value, barcodeFormat: event.target.value }))}><option value="CODE128">CODE128</option><option value="CODE39">CODE39</option><option value="EAN13">EAN13</option></select></label>
              <label><span>نوع الورق</span><select value={form.paperType} onChange={(event) => setForm((value) => ({ ...value, paperType: event.target.value }))}><option value="thermal">thermal</option><option value="a4">a4</option></select></label>
              <label><span>عدد الملصقات في الصف</span><input type="number" value={form.labelsPerRow} onChange={(event) => setForm((value) => ({ ...value, labelsPerRow: event.target.value }))} /></label>
              <label><span>نص إضافي</span><input value={form.customText} onChange={(event) => setForm((value) => ({ ...value, customText: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!form.name}>إنشاء القالب</button>
          </form>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Print Queue</span>
          <h3>الأصناف الجاهزة للطباعة</h3>
          <div className="form-grid">
            <label><span>بحث</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="اسم، SKU، أو باركود" /></label>
          </div>
          <div className="table-shell">
            <table>
              <thead><tr><th>#</th><th>الصنف</th><th>SKU</th><th>الباركود</th><th>السعر</th></tr></thead>
              <tbody>
                {(products ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.sku || "-"}</td>
                    <td>{item.barcode || "-"}</td>
                    <td>{Number(item.price ?? 0).toLocaleString("ar-EG")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="surface-panel">
        {loading ? (
          <QueryFeedback title="جارٍ تحميل القوالب" message="نقرأ قوالب الباركود الحالية." />
        ) : error ? (
          <QueryFeedback title="فشل تحميل القوالب" message={error} tone="error" />
        ) : (
          <div className="table-shell">
            <table>
              <thead><tr><th>#</th><th>الاسم</th><th>المقاس</th><th>التنسيق</th><th>الورق</th></tr></thead>
              <tbody>
                {(templates ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.width} × {item.height}</td>
                    <td>{item.barcode_format || "-"}</td>
                    <td>{item.paper_type || "-"}</td>
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
