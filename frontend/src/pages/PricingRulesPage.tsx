import { FormEvent, useState } from "react";

import { getCategories } from "../app/api/categories";
import {
  applyPriceSuggestions,
  createPricingRule,
  getOptimizationSuggestions,
  getPriceSuggestions
} from "../app/api/priceAdvisory";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialForm = {
  categoryId: "",
  minCost: "",
  maxCost: "",
  targetMarginPct: "25",
  notes: ""
};

export function PricingRulesPage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: categories } = useAsyncValue(session ? () => getCategories(session.token) : null, [session?.token]);
  const { data: priceSuggestions, loading: priceLoading, error: priceError } = useAsyncValue(
    session ? () => getPriceSuggestions(session.token) : null,
    [session?.token, refreshKey]
  );
  const { data: optimization, loading: optLoading, error: optError } = useAsyncValue(
    session ? () => getOptimizationSuggestions(session.token) : null,
    [session?.token, refreshKey]
  );

  const handleCreateRule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await createPricingRule(session.token, {
        category_id: form.categoryId ? Number(form.categoryId) : undefined,
        min_cost: form.minCost ? Number(form.minCost) : undefined,
        max_cost: form.maxCost ? Number(form.maxCost) : undefined,
        target_margin_pct: Number(form.targetMarginPct || 0),
        notes: form.notes || undefined
      });
      setForm(initialForm);
      setRefreshKey((value) => value + 1);
      setMessage("تم إنشاء قاعدة تسعير جديدة.");
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleApplySuggestions = async () => {
    if (!session || !(optimization?.length || priceSuggestions?.length)) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await applyPriceSuggestions(session.token, optimization?.length ? optimization : (priceSuggestions ?? []));
      setRefreshKey((value) => value + 1);
      setMessage("تم تطبيق التوصيات السعرية الحالية.");
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="قواعد التسعير" subtitle="إدارة اقتراحات التسعير الذكية وقواعد الهامش وربطها بفئات المنتجات أو نطاقات التكلفة." />

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">Suggestions</span><strong>{(priceSuggestions?.length ?? 0).toLocaleString("ar-EG")}</strong><p>اقتراحات ناتجة عن تغيرات التكلفة أو العملة.</p></article>
        <article className="stat-card"><span className="eyebrow">Optimization</span><strong>{(optimization?.length ?? 0).toLocaleString("ar-EG")}</strong><p>اقتراحات تحسين الهامش والسرعة البيعية.</p></article>
        <article className="stat-card"><span className="eyebrow">Categories</span><strong>{(categories?.length ?? 0).toLocaleString("ar-EG")}</strong><p>الفئات المتاحة لربط قواعد التسعير بها.</p></article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Rule Builder</span>
          <h3>إضافة قاعدة تسعير</h3>
          <form className="auth-form" onSubmit={handleCreateRule}>
            <div className="form-grid">
              <label><span>الفئة</span><select value={form.categoryId} onChange={(event) => setForm((value) => ({ ...value, categoryId: event.target.value }))}><option value="">كل الفئات</option>{(categories ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label><span>أقل تكلفة</span><input type="number" min="0" step="0.01" value={form.minCost} onChange={(event) => setForm((value) => ({ ...value, minCost: event.target.value }))} /></label>
              <label><span>أعلى تكلفة</span><input type="number" min="0" step="0.01" value={form.maxCost} onChange={(event) => setForm((value) => ({ ...value, maxCost: event.target.value }))} /></label>
              <label><span>الهامش المستهدف %</span><input type="number" min="0" step="0.01" value={form.targetMarginPct} onChange={(event) => setForm((value) => ({ ...value, targetMarginPct: event.target.value }))} /></label>
              <label><span>ملاحظات</span><input value={form.notes} onChange={(event) => setForm((value) => ({ ...value, notes: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!form.targetMarginPct}>إنشاء القاعدة</button>
          </form>
          <button type="button" className="secondary-button" onClick={handleApplySuggestions}>تطبيق الاقتراحات الحالية</button>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>

        <article className="surface-panel">
          {priceLoading ? <QueryFeedback title="جارٍ تحميل الاقتراحات" message="نقرأ اقتراحات تعديل الأسعار الناتجة عن تغيرات التكلفة." /> : priceError ? <QueryFeedback title="فشل تحميل الاقتراحات" message={priceError} tone="error" /> : (
            <div className="table-shell">
              <table>
                <thead><tr><th>المنتج</th><th>الحالي</th><th>المقترح</th><th>السبب</th></tr></thead>
                <tbody>
                  {(priceSuggestions ?? []).map((item, index) => (
                    <tr key={`${item.product_id ?? index}-${index}`}>
                      <td>{item.product_name || item.sku || item.product_id || "-"}</td>
                      <td>{Number(item.current_price ?? 0).toLocaleString("ar-EG")}</td>
                      <td>{Number(item.suggested_price ?? 0).toLocaleString("ar-EG")}</td>
                      <td>{item.reason || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>

      <section className="surface-panel">
        {optLoading ? <QueryFeedback title="جارٍ تحميل تحسينات الهامش" message="نقرأ الانحرافات عن قواعد الهامش المستهدفة." /> : optError ? <QueryFeedback title="فشل تحميل تحسينات الهامش" message={optError} tone="error" /> : (
          <div className="table-shell">
            <table>
              <thead><tr><th>المنتج</th><th>الهامش الحالي</th><th>الهامش المقترح</th><th>السعر المقترح</th></tr></thead>
              <tbody>
                {(optimization ?? []).map((item, index) => (
                  <tr key={`${item.product_id ?? index}-${index}`}>
                    <td>{item.product_name || item.sku || item.product_id || "-"}</td>
                    <td>{Number(item.current_margin_pct ?? 0).toLocaleString("ar-EG")}</td>
                    <td>{Number(item.suggested_margin_pct ?? 0).toLocaleString("ar-EG")}</td>
                    <td>{Number(item.suggested_price ?? 0).toLocaleString("ar-EG")}</td>
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
