import { useMemo, useState } from "react";

import { getPurchaseOrders } from "../app/api/purchaseOrders";
import { getPurchasesBySupplier } from "../app/api/purchases";
import { getSupplierBalanceSummary, getSuppliers } from "../app/api/suppliers";
import { useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

export function VendorPortalPage() {
  const { session } = useAuth();
  const [supplierId, setSupplierId] = useState("");

  const { data: suppliers, loading: suppliersLoading, error: suppliersError } = useAsyncValue(
    session ? () => getSuppliers(session.token) : null,
    [session?.token]
  );

  const effectiveSupplierId = supplierId || String(suppliers?.items[0]?.id ?? "");

  const { data: summary, loading: summaryLoading, error: summaryError } = useAsyncValue(
    session && effectiveSupplierId ? () => getSupplierBalanceSummary(session.token, Number(effectiveSupplierId)) : null,
    [session?.token, effectiveSupplierId]
  );
  const { data: purchaseOrders, loading: poLoading, error: poError } = useAsyncValue(
    session && effectiveSupplierId ? () => getPurchaseOrders(session.token, Number(effectiveSupplierId)) : null,
    [session?.token, effectiveSupplierId]
  );
  const { data: purchases, loading: purchasesLoading, error: purchasesError } = useAsyncValue(
    session && effectiveSupplierId ? () => getPurchasesBySupplier(session.token, Number(effectiveSupplierId)) : null,
    [session?.token, effectiveSupplierId]
  );

  const selectedSupplier = useMemo(
    () => suppliers?.items.find((item) => item.id === Number(effectiveSupplierId)) ?? null,
    [suppliers, effectiveSupplierId]
  );

  return (
    <div className="page-stack">
      <PageHeader title="بوابة الموردين" subtitle="واجهة تشغيلية لمتابعة المورد المختار وأوامر شرائه ومشترياته وملخصه المالي من شاشة واحدة." />

      <section className="surface-panel">
        <div className="form-grid">
          <label>
            <span>المورد</span>
            <select value={effectiveSupplierId} onChange={(event) => setSupplierId(event.target.value)}>
              {(suppliers?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
        </div>
        {suppliersLoading ? <QueryFeedback title="جارٍ تحميل الموردين" message="نقرأ الموردين المتاحين لاختيار الحساب التشغيلي المناسب." /> : null}
        {suppliersError ? <QueryFeedback title="فشل تحميل الموردين" message={suppliersError} tone="error" /> : null}
      </section>

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">Suppliers</span><strong>{(suppliers?.items.length ?? 0).toLocaleString("ar-EG")}</strong><p>إجمالي الموردين المتاحين في النظام.</p></article>
        <article className="stat-card"><span className="eyebrow">Balance</span><strong>{Number(summary?.balance ?? selectedSupplier?.balance ?? 0).toLocaleString("ar-EG")}</strong><p>الرصيد الحالي للمورد المختار.</p></article>
        <article className="stat-card"><span className="eyebrow">Orders</span><strong>{(purchaseOrders?.length ?? 0).toLocaleString("ar-EG")}</strong><p>أوامر الشراء المرتبطة بالمورد.</p></article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          {summaryLoading ? (
            <QueryFeedback title="جارٍ تحميل الملخص المالي" message="نحسب رصيد المورد وإجمالي مشترياته الحالية." />
          ) : summaryError ? (
            <QueryFeedback title="فشل تحميل الملخص المالي" message={summaryError} tone="error" />
          ) : (
            <div className="table-shell">
              <table>
                <thead><tr><th>المورد</th><th>الرصيد</th><th>إجمالي المشتريات</th><th>الهاتف</th></tr></thead>
                <tbody>
                  <tr>
                    <td>{summary?.name || selectedSupplier?.name || "-"}</td>
                    <td>{Number(summary?.balance ?? selectedSupplier?.balance ?? 0).toLocaleString("ar-EG")}</td>
                    <td>{Number(summary?.total_purchases ?? selectedSupplier?.total_purchases ?? 0).toLocaleString("ar-EG")}</td>
                    <td>{selectedSupplier?.phone || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="surface-panel">
          {poLoading ? (
            <QueryFeedback title="جارٍ تحميل أوامر الشراء" message="نقرأ أوامر الشراء الخاصة بالمورد المختار." />
          ) : poError ? (
            <QueryFeedback title="فشل تحميل أوامر الشراء" message={poError} tone="error" />
          ) : (
            <div className="table-shell">
              <table>
                <thead><tr><th>الرقم</th><th>الحالة</th><th>التاريخ المتوقع</th><th>الإجمالي</th></tr></thead>
                <tbody>
                  {(purchaseOrders ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.po_number || item.id}</td>
                      <td>{item.status}</td>
                      <td>{item.expected_date || "-"}</td>
                      <td>{Number(item.total_amount ?? 0).toLocaleString("ar-EG")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>

      <section className="surface-panel">
        {purchasesLoading ? (
          <QueryFeedback title="جارٍ تحميل المشتريات" message="نقرأ آخر فواتير التوريد والمشتريات للمورد المحدد." />
        ) : purchasesError ? (
          <QueryFeedback title="فشل تحميل المشتريات" message={purchasesError} tone="error" />
        ) : (
          <div className="table-shell">
            <table>
              <thead><tr><th>الفاتورة</th><th>التاريخ</th><th>الإجمالي</th><th>ملاحظات</th></tr></thead>
              <tbody>
                {(purchases?.items ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.invoice_number || item.id}</td>
                    <td>{item.date || "-"}</td>
                    <td>{Number(item.total_amount ?? 0).toLocaleString("ar-EG")}</td>
                    <td>{item.notes || "-"}</td>
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
