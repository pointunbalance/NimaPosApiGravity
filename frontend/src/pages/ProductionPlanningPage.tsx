import { useMemo, useState } from "react";

import { getBom, getBoms } from "../app/api/manufacturing";
import { useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

export function ProductionPlanningPage() {
  const { session } = useAuth();
  const [selectedBomId, setSelectedBomId] = useState("");
  const [targetQuantity, setTargetQuantity] = useState("10");

  const { data: boms, loading, error } = useAsyncValue(session ? () => getBoms(session.token) : null, [session?.token]);
  const { data: selectedBom } = useAsyncValue(
    session && selectedBomId ? () => getBom(session.token, Number(selectedBomId)) : null,
    [session?.token, selectedBomId]
  );

  const planRows = useMemo(
    () =>
      (selectedBom?.items ?? []).map((item) => {
        const baseQty = Number(item.quantity ?? 0);
        const wastage = Number(item.wastage_percent ?? 0) / 100;
        const target = Number(targetQuantity || 0);
        const needed = baseQty * target * (1 + wastage);
        const itemCost = Number(item.unit_cost ?? 0) * needed;
        return { ...item, planned_quantity: needed, planned_cost: itemCost };
      }),
    [selectedBom, targetQuantity]
  );

  const totalPlannedCost = useMemo(
    () => planRows.reduce((sum, item) => sum + Number(item.planned_cost ?? 0), 0),
    [planRows]
  );

  return (
    <div className="page-stack">
      <PageHeader title="تخطيط الإنتاج" subtitle="لوحة سريعة لتقدير الاحتياج والتكلفة قبل إصدار أوامر التشغيل الفعلية اعتمادًا على BOM المعتمد." />

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Planning Inputs</span>
          <h3>إعداد الخطة</h3>
          <div className="form-grid">
            <label><span>التركيبة</span><select value={selectedBomId} onChange={(event) => setSelectedBomId(event.target.value)}><option value="">اختر BOM</option>{(boms ?? []).map((item) => <option key={item.id} value={item.id}>{item.name} - {item.product_name || item.product_id}</option>)}</select></label>
            <label><span>الكمية المستهدفة</span><input type="number" min="1" step="1" value={targetQuantity} onChange={(event) => setTargetQuantity(event.target.value)} /></label>
          </div>
          <p className="muted-text">التقديرات هنا تحليلية فقط، أما الخصم والإضافة الفعليان للمخزون فيتمّان من شاشة أوامر التشغيل.</p>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Overview</span>
          <h3>ملخص الخطة</h3>
          <div className="stats-grid">
            <article className="stat-card"><span className="eyebrow">Target Qty</span><strong>{Number(targetQuantity || 0).toLocaleString("ar-EG")}</strong><p>الكمية المخطط إنتاجها.</p></article>
            <article className="stat-card"><span className="eyebrow">Components</span><strong>{planRows.length.toLocaleString("ar-EG")}</strong><p>عدد المواد التي ستشارك في الخطة.</p></article>
            <article className="stat-card"><span className="eyebrow">Planned Cost</span><strong>{totalPlannedCost.toLocaleString("ar-EG")}</strong><p>التكلفة الإجمالية المقدرة وفق بيانات BOM الحالية.</p></article>
          </div>
        </article>
      </section>

      <section className="surface-panel">
        {loading ? <QueryFeedback title="جارٍ تحميل خطط التصنيع" message="نقرأ التركيبات المتاحة لإعداد الخطة." /> : error ? <QueryFeedback title="فشل تحميل بيانات التخطيط" message={error} tone="error" /> : selectedBom ? (
          <div className="table-shell">
            <table>
              <thead><tr><th>المكون</th><th>الكمية الأساسية</th><th>الكمية المخططة</th><th>تكلفة الوحدة</th><th>التكلفة المخططة</th></tr></thead>
              <tbody>
                {planRows.map((item, index) => (
                  <tr key={`${item.component_product_id}-${index}`}>
                    <td>{item.component_name || item.component_product_id}</td>
                    <td>{Number(item.quantity ?? 0).toLocaleString("ar-EG")}</td>
                    <td>{Number(item.planned_quantity ?? 0).toLocaleString("ar-EG")}</td>
                    <td>{Number(item.unit_cost ?? 0).toLocaleString("ar-EG")}</td>
                    <td>{Number(item.planned_cost ?? 0).toLocaleString("ar-EG")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <QueryFeedback title="ابدأ باختيار تركيبة" message="حدد BOM لترى احتياج المواد والتكلفة المخططة قبل بدء التشغيل." />}
      </section>
    </div>
  );
}
