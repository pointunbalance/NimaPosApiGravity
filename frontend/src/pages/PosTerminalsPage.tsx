import { FormEvent, useState } from "react";

import {
  createLabelTemplate,
  createScale,
  getLabelTemplates,
  getScales,
  parseScaleBarcode
} from "../app/api/hardware";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialScaleForm = { name: "", prefix: "", barcodeType: "price_embedded", ipAddress: "", port: "8000" };
const initialTemplateForm = { name: "", width: "58", height: "40" };

export function PosTerminalsPage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [scaleForm, setScaleForm] = useState(initialScaleForm);
  const [templateForm, setTemplateForm] = useState(initialTemplateForm);
  const [barcode, setBarcode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: scales, loading: scalesLoading, error: scalesError } = useAsyncValue(session ? () => getScales(session.token) : null, [session?.token, refreshKey]);
  const { data: templates, loading: templatesLoading, error: templatesError } = useAsyncValue(session ? () => getLabelTemplates(session.token) : null, [session?.token, refreshKey]);
  const { data: parsedBarcode, loading: parseLoading, error: parseError } = useAsyncValue(session && barcode ? () => parseScaleBarcode(session.token, barcode) : null, [session?.token, barcode]);

  const handleCreateScale = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await createScale(session.token, {
        name: scaleForm.name,
        prefix: scaleForm.prefix || undefined,
        barcode_type: scaleForm.barcodeType,
        ip_address: scaleForm.ipAddress || undefined,
        port: Number(scaleForm.port || 0),
        is_active: true
      });
      setScaleForm(initialScaleForm);
      setRefreshKey((value) => value + 1);
      setMessage("تمت إضافة جهاز وزن/ميزان جديد.");
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleCreateTemplate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await createLabelTemplate(session.token, {
        name: templateForm.name,
        width_mm: Number(templateForm.width || 0),
        height_mm: Number(templateForm.height || 0),
        template_json: "{}",
        is_default: false
      });
      setTemplateForm(initialTemplateForm);
      setRefreshKey((value) => value + 1);
      setMessage("تمت إضافة قالب ملصق جديد.");
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="أجهزة نقاط البيع" subtitle="إدارة الموازين وقوالب الملصقات وفحص قراءة باركود الميزان من نفس الشاشة." />

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">Scales</span><strong>{(scales?.length ?? 0).toLocaleString("ar-EG")}</strong><p>عدد الأجهزة أو الموازين المعرفة حاليًا.</p></article>
        <article className="stat-card"><span className="eyebrow">Templates</span><strong>{(templates?.length ?? 0).toLocaleString("ar-EG")}</strong><p>عدد قوالب الملصقات المتاحة.</p></article>
        <article className="stat-card"><span className="eyebrow">Parse</span><strong>{parsedBarcode ? "OK" : "-"}</strong><p>نتيجة فحص آخر باركود ميزان تم تحليله.</p></article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Scale Setup</span>
          <h3>إضافة جهاز</h3>
          <form className="auth-form" onSubmit={handleCreateScale}>
            <div className="form-grid">
              <label><span>الاسم</span><input value={scaleForm.name} onChange={(event) => setScaleForm((value) => ({ ...value, name: event.target.value }))} /></label>
              <label><span>البادئة</span><input value={scaleForm.prefix} onChange={(event) => setScaleForm((value) => ({ ...value, prefix: event.target.value }))} /></label>
              <label><span>نوع الباركود</span><select value={scaleForm.barcodeType} onChange={(event) => setScaleForm((value) => ({ ...value, barcodeType: event.target.value }))}><option value="price_embedded">price_embedded</option><option value="weight_embedded">weight_embedded</option></select></label>
              <label><span>IP</span><input value={scaleForm.ipAddress} onChange={(event) => setScaleForm((value) => ({ ...value, ipAddress: event.target.value }))} /></label>
              <label><span>المنفذ</span><input type="number" value={scaleForm.port} onChange={(event) => setScaleForm((value) => ({ ...value, port: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!scaleForm.name}>إضافة الجهاز</button>
          </form>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Label Template</span>
          <h3>إضافة قالب</h3>
          <form className="auth-form" onSubmit={handleCreateTemplate}>
            <div className="form-grid">
              <label><span>الاسم</span><input value={templateForm.name} onChange={(event) => setTemplateForm((value) => ({ ...value, name: event.target.value }))} /></label>
              <label><span>العرض mm</span><input type="number" value={templateForm.width} onChange={(event) => setTemplateForm((value) => ({ ...value, width: event.target.value }))} /></label>
              <label><span>الارتفاع mm</span><input type="number" value={templateForm.height} onChange={(event) => setTemplateForm((value) => ({ ...value, height: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!templateForm.name}>إضافة القالب</button>
          </form>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Barcode Parse</span>
          <div className="form-grid">
            <label><span>باركود الميزان</span><input value={barcode} onChange={(event) => setBarcode(event.target.value)} placeholder="2901234567890" /></label>
          </div>
          {parseLoading ? <QueryFeedback title="جارٍ التحليل" message="نفكك الباركود وفق إعدادات الأجهزة النشطة." /> : null}
          {parseError ? <QueryFeedback title="فشل التحليل" message={parseError} tone="error" /> : null}
          {parsedBarcode ? (
            <div className="table-shell">
              <table>
                <thead><tr><th>كود المنتج</th><th>الوزن</th><th>السعر</th></tr></thead>
                <tbody><tr><td>{parsedBarcode.product_code || "-"}</td><td>{parsedBarcode.weight ?? parsedBarcode.embedded_weight ?? "-"}</td><td>{parsedBarcode.price ?? parsedBarcode.embedded_price ?? "-"}</td></tr></tbody>
              </table>
            </div>
          ) : null}
        </article>

        <article className="surface-panel">
          {scalesLoading ? <QueryFeedback title="جارٍ تحميل الأجهزة" message="نقرأ الأجهزة والموازين النشطة." /> : scalesError ? <QueryFeedback title="فشل تحميل الأجهزة" message={scalesError} tone="error" /> : (
            <div className="table-shell">
              <table>
                <thead><tr><th>الاسم</th><th>البادئة</th><th>النوع</th><th>IP</th><th>المنفذ</th></tr></thead>
                <tbody>{(scales ?? []).map((item) => <tr key={item.id}><td>{item.name || item.device_name || "-"}</td><td>{item.prefix || "-"}</td><td>{item.barcode_type || "-"}</td><td>{item.ip_address || "-"}</td><td>{item.port || "-"}</td></tr>)}</tbody>
              </table>
            </div>
          )}
          {templatesLoading ? <QueryFeedback title="جارٍ تحميل القوالب" message="نقرأ قوالب الملصقات المسجلة." /> : templatesError ? <QueryFeedback title="فشل تحميل القوالب" message={templatesError} tone="error" /> : (
            <div className="table-shell">
              <table>
                <thead><tr><th>القالب</th><th>العرض</th><th>الارتفاع</th><th>افتراضي</th></tr></thead>
                <tbody>{(templates ?? []).map((item) => <tr key={item.id}><td>{item.name || item.id}</td><td>{item.width_mm || "-"}</td><td>{item.height_mm || "-"}</td><td>{item.is_default ? "نعم" : "لا"}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
