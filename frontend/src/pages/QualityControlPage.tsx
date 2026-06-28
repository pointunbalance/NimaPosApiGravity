import { FormEvent, useMemo, useState } from "react";

import { getCategories } from "../app/api/categories";
import { getProducts } from "../app/api/products";
import {
  createInspection,
  createQcRule,
  getInspectionDefects,
  getInspectionHistory,
  getPendingInspections
} from "../app/api/qc";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialInspectionForm = { productId: "", batchId: "", status: "Passed", score: "100", notes: "" };
const initialRuleForm = { categoryId: "", productId: "", minScoreRequired: "70", isMandatory: "true" };

export function QualityControlPage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedInspectionId, setSelectedInspectionId] = useState("");
  const [inspectionForm, setInspectionForm] = useState(initialInspectionForm);
  const [ruleForm, setRuleForm] = useState(initialRuleForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: products } = useAsyncValue(session ? () => getProducts(session.token) : null, [session?.token]);
  const { data: categories } = useAsyncValue(session ? () => getCategories(session.token) : null, [session?.token]);
  const { data: pending, loading: pendingLoading, error: pendingError } = useAsyncValue(session ? () => getPendingInspections(session.token) : null, [session?.token, refreshKey]);
  const { data: history, loading: historyLoading, error: historyError } = useAsyncValue(session ? () => getInspectionHistory(session.token) : null, [session?.token, refreshKey]);
  const { data: defects } = useAsyncValue(session && selectedInspectionId ? () => getInspectionDefects(session.token, Number(selectedInspectionId)) : null, [session?.token, selectedInspectionId, refreshKey]);

  const passedCount = useMemo(() => (history ?? []).filter((item) => item.status?.toLowerCase() === "passed").length, [history]);

  const handleCreateInspection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await createInspection(session.token, {
        product_id: Number(inspectionForm.productId),
        batch_id: inspectionForm.batchId ? Number(inspectionForm.batchId) : undefined,
        inspector_id: session.user.id,
        status: inspectionForm.status,
        score: Number(inspectionForm.score || 0),
        notes: inspectionForm.notes || undefined,
        defects: []
      });
      setInspectionForm(initialInspectionForm);
      setRefreshKey((value) => value + 1);
      setMessage("تم تسجيل فحص جودة جديد.");
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleCreateRule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await createQcRule(session.token, {
        category_id: ruleForm.categoryId ? Number(ruleForm.categoryId) : undefined,
        product_id: ruleForm.productId ? Number(ruleForm.productId) : undefined,
        min_score_required: Number(ruleForm.minScoreRequired || 0),
        is_mandatory: ruleForm.isMandatory === "true"
      });
      setRuleForm(initialRuleForm);
      setMessage("تم تحديث قاعدة الجودة.");
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="مراقبة الجودة" subtitle="متابعة الدُفعات المعلقة وتسجيل الفحوصات وإنشاء قواعد الحد الأدنى للجودة من شاشة موحدة." />

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">Pending</span><strong>{(pending?.length ?? 0).toLocaleString("ar-EG")}</strong><p>دفعات أو منتجات ما زالت بانتظار الفحص.</p></article>
        <article className="stat-card"><span className="eyebrow">History</span><strong>{(history?.length ?? 0).toLocaleString("ar-EG")}</strong><p>إجمالي الفحوصات المسجلة.</p></article>
        <article className="stat-card"><span className="eyebrow">Passed</span><strong>{passedCount.toLocaleString("ar-EG")}</strong><p>الفحوصات التي انتهت بحالة نجاح.</p></article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Inspection</span>
          <h3>تسجيل فحص</h3>
          <form className="auth-form" onSubmit={handleCreateInspection}>
            <div className="form-grid">
              <label><span>المنتج</span><select value={inspectionForm.productId} onChange={(event) => setInspectionForm((value) => ({ ...value, productId: event.target.value }))}><option value="">اختر منتجًا</option>{(products?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label><span>رقم الدفعة</span><input value={inspectionForm.batchId} onChange={(event) => setInspectionForm((value) => ({ ...value, batchId: event.target.value }))} /></label>
              <label><span>الحالة</span><select value={inspectionForm.status} onChange={(event) => setInspectionForm((value) => ({ ...value, status: event.target.value }))}><option value="Passed">Passed</option><option value="Failed">Failed</option><option value="Partial">Partial</option></select></label>
              <label><span>النتيجة</span><input type="number" min="0" max="100" value={inspectionForm.score} onChange={(event) => setInspectionForm((value) => ({ ...value, score: event.target.value }))} /></label>
              <label><span>ملاحظات</span><input value={inspectionForm.notes} onChange={(event) => setInspectionForm((value) => ({ ...value, notes: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!inspectionForm.productId}>تسجيل الفحص</button>
          </form>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">QC Rule</span>
          <h3>إضافة قاعدة جودة</h3>
          <form className="auth-form" onSubmit={handleCreateRule}>
            <div className="form-grid">
              <label><span>الفئة</span><select value={ruleForm.categoryId} onChange={(event) => setRuleForm((value) => ({ ...value, categoryId: event.target.value }))}><option value="">كل الفئات</option>{(categories ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label><span>المنتج</span><select value={ruleForm.productId} onChange={(event) => setRuleForm((value) => ({ ...value, productId: event.target.value }))}><option value="">كل المنتجات</option>{(products?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label><span>أدنى نتيجة مطلوبة</span><input type="number" min="0" max="100" value={ruleForm.minScoreRequired} onChange={(event) => setRuleForm((value) => ({ ...value, minScoreRequired: event.target.value }))} /></label>
              <label><span>إلزامي</span><select value={ruleForm.isMandatory} onChange={(event) => setRuleForm((value) => ({ ...value, isMandatory: event.target.value }))}><option value="true">yes</option><option value="false">no</option></select></label>
            </div>
            <button className="primary-button" type="submit">حفظ القاعدة</button>
          </form>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          {pendingLoading ? <QueryFeedback title="جارٍ تحميل الدفعات المعلقة" message="نقرأ البنود التي تنتظر فحص الجودة." /> : pendingError ? <QueryFeedback title="فشل تحميل الدفعات المعلقة" message={pendingError} tone="error" /> : (
            <div className="table-shell">
              <table>
                <thead><tr><th>المنتج</th><th>الدفعة</th><th>الشراء</th><th>الحالة</th></tr></thead>
                <tbody>
                  {(pending ?? []).map((item, index) => (
                    <tr key={`${item.batch_id ?? index}-${index}`}>
                      <td>{item.product_name || item.product_id || "-"}</td>
                      <td>{item.batch_number || item.batch_id || "-"}</td>
                      <td>{item.purchase_id || "-"}</td>
                      <td>{item.status || "Pending"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="surface-panel">
          {historyLoading ? <QueryFeedback title="جارٍ تحميل سجل الفحوصات" message="نقرأ تاريخ الفحوصات السابقة والنتائج المسجلة." /> : historyError ? <QueryFeedback title="فشل تحميل سجل الفحوصات" message={historyError} tone="error" /> : (
            <div className="table-shell">
              <table>
                <thead><tr><th>#</th><th>المنتج</th><th>الدفعة</th><th>الحالة</th><th>النتيجة</th><th>العيوب</th></tr></thead>
                <tbody>
                  {(history ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.product_name || item.product_id || "-"}</td>
                      <td>{item.batch_id || "-"}</td>
                      <td>{item.status}</td>
                      <td>{Number(item.score ?? 0).toLocaleString("ar-EG")}</td>
                      <td><button type="button" className="secondary-button" onClick={() => setSelectedInspectionId(String(item.id))}>عرض العيوب</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {selectedInspectionId && defects ? (
            <div className="table-shell">
              <table>
                <thead><tr><th>نوع العيب</th><th>الكمية</th><th>الوصف</th></tr></thead>
                <tbody>
                  {defects.map((item, index) => (
                    <tr key={`${item.defect_type}-${index}`}>
                      <td>{item.defect_type}</td>
                      <td>{item.quantity}</td>
                      <td>{item.description || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </article>
      </section>
    </div>
  );
}
