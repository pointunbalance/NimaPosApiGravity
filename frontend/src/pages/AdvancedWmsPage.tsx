import { FormEvent, useMemo, useState } from "react";

import {
  createBatch,
  createSerial,
  getBatches,
  getExpiringBatches,
  getSerials,
  getWarehouses,
  updateSerialStatus
} from "../app/api/advanced";
import { getProducts } from "../app/api/products";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialBatchForm = { productId: "", warehouseId: "", quantity: "", batchNumber: "", expiryDate: "", receivedDate: "", costPrice: "" };
const initialSerialForm = { productId: "", warehouseId: "", serialNumber: "" };

export function AdvancedWmsPage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [serialStatus, setSerialStatus] = useState("available");
  const [batchForm, setBatchForm] = useState(initialBatchForm);
  const [serialForm, setSerialForm] = useState(initialSerialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: warehouses } = useAsyncValue(session ? () => getWarehouses(session.token) : null, [session?.token]);
  const { data: products } = useAsyncValue(session ? () => getProducts(session.token) : null, [session?.token]);
  const { data: batches, loading: batchesLoading, error: batchesError } = useAsyncValue(session ? () => getBatches(session.token, selectedWarehouseId ? Number(selectedWarehouseId) : undefined) : null, [session?.token, selectedWarehouseId, refreshKey]);
  const { data: expiring } = useAsyncValue(session ? () => getExpiringBatches(session.token) : null, [session?.token, refreshKey]);
  const { data: serials, loading: serialsLoading, error: serialsError } = useAsyncValue(session ? () => getSerials(session.token, undefined, serialStatus || undefined) : null, [session?.token, serialStatus, refreshKey]);

  const stockTotal = useMemo(() => (batches?.items ?? []).reduce((sum, item) => sum + Number(item.quantity ?? 0), 0), [batches]);

  const handleCreateBatch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const product = products?.items.find((item) => item.id === Number(batchForm.productId));
      await createBatch(session.token, {
        product_id: Number(batchForm.productId),
        product_name: product?.name || "",
        warehouse_id: Number(batchForm.warehouseId),
        quantity: Number(batchForm.quantity || 0),
        expiry_date: batchForm.expiryDate || undefined,
        batch_number: batchForm.batchNumber || undefined,
        received_date: batchForm.receivedDate,
        cost_price: Number(batchForm.costPrice || 0)
      });
      setBatchForm(initialBatchForm);
      setRefreshKey((value) => value + 1);
      setMessage("تم إنشاء دفعة مخزنية جديدة.");
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleCreateSerial = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await createSerial(session.token, {
        product_id: Number(serialForm.productId),
        warehouse_id: serialForm.warehouseId ? Number(serialForm.warehouseId) : undefined,
        serial_number: serialForm.serialNumber
      });
      setSerialForm(initialSerialForm);
      setRefreshKey((value) => value + 1);
      setMessage("تمت إضافة سيريال جديد.");
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleUpdateSerial = async (serialId: number) => {
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await updateSerialStatus(session.token, serialId, { status: "reserved" });
      setRefreshKey((value) => value + 1);
      setMessage("تم تحديث حالة السيريال إلى reserved.");
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="WMS المتقدم" subtitle="متابعة الدُفعات والسيريالات والانتهاء القريب للدفعات داخل البنية المتقدمة للمستودعات." />

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">Batches</span><strong>{(batches?.items.length ?? 0).toLocaleString("ar-EG")}</strong><p>دفعات المخزون ضمن التصفية الحالية.</p></article>
        <article className="stat-card"><span className="eyebrow">Serials</span><strong>{(serials?.items.length ?? 0).toLocaleString("ar-EG")}</strong><p>السيريالات المقروءة حسب الحالة المحددة.</p></article>
        <article className="stat-card"><span className="eyebrow">Expiring</span><strong>{(expiring?.length ?? 0).toLocaleString("ar-EG")}</strong><p>دفعات تقترب من الانتهاء خلال 30 يومًا.</p></article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Batch Intake</span>
          <h3>إضافة دفعة</h3>
          <form className="auth-form" onSubmit={handleCreateBatch}>
            <div className="form-grid">
              <label><span>المنتج</span><select value={batchForm.productId} onChange={(event) => setBatchForm((value) => ({ ...value, productId: event.target.value }))}><option value="">اختر منتجًا</option>{(products?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label><span>المستودع</span><select value={batchForm.warehouseId} onChange={(event) => setBatchForm((value) => ({ ...value, warehouseId: event.target.value }))}><option value="">اختر مستودعًا</option>{(warehouses ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label><span>الكمية</span><input type="number" min="1" value={batchForm.quantity} onChange={(event) => setBatchForm((value) => ({ ...value, quantity: event.target.value }))} /></label>
              <label><span>رقم الدفعة</span><input value={batchForm.batchNumber} onChange={(event) => setBatchForm((value) => ({ ...value, batchNumber: event.target.value }))} /></label>
              <label><span>تاريخ الاستلام</span><input type="date" value={batchForm.receivedDate} onChange={(event) => setBatchForm((value) => ({ ...value, receivedDate: event.target.value }))} /></label>
              <label><span>تاريخ الانتهاء</span><input type="date" value={batchForm.expiryDate} onChange={(event) => setBatchForm((value) => ({ ...value, expiryDate: event.target.value }))} /></label>
              <label><span>تكلفة الوحدة</span><input type="number" min="0" step="0.01" value={batchForm.costPrice} onChange={(event) => setBatchForm((value) => ({ ...value, costPrice: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!batchForm.productId || !batchForm.warehouseId || !batchForm.quantity || !batchForm.receivedDate}>إضافة الدفعة</button>
          </form>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Serial Intake</span>
          <h3>إضافة سيريال</h3>
          <form className="auth-form" onSubmit={handleCreateSerial}>
            <div className="form-grid">
              <label><span>المنتج</span><select value={serialForm.productId} onChange={(event) => setSerialForm((value) => ({ ...value, productId: event.target.value }))}><option value="">اختر منتجًا</option>{(products?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label><span>المستودع</span><select value={serialForm.warehouseId} onChange={(event) => setSerialForm((value) => ({ ...value, warehouseId: event.target.value }))}><option value="">اختر مستودعًا</option>{(warehouses ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label><span>السيريال</span><input value={serialForm.serialNumber} onChange={(event) => setSerialForm((value) => ({ ...value, serialNumber: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!serialForm.productId || !serialForm.serialNumber}>إضافة السيريال</button>
          </form>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <div className="form-grid">
            <label><span>تصفية المستودع</span><select value={selectedWarehouseId} onChange={(event) => setSelectedWarehouseId(event.target.value)}><option value="">كل المستودعات</option>{(warehouses ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          </div>
          {batchesLoading ? <QueryFeedback title="جارٍ تحميل الدفعات" message="نقرأ دفعات المخزون ضمن التصفية الحالية." /> : batchesError ? <QueryFeedback title="فشل تحميل الدفعات" message={batchesError} tone="error" /> : (
            <div className="table-shell">
              <table>
                <thead><tr><th>المنتج</th><th>الدفعة</th><th>الكمية</th><th>الانتهاء</th></tr></thead>
                <tbody>
                  {(batches?.items ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.product_name || item.product_id}</td>
                      <td>{item.batch_number || item.id}</td>
                      <td>{Number(item.quantity ?? 0).toLocaleString("ar-EG")}</td>
                      <td>{item.expiry_date || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="muted-text">إجمالي الكمية في النطاق الحالي: {stockTotal.toLocaleString("ar-EG")}</p>
        </article>

        <article className="surface-panel">
          <div className="form-grid">
            <label><span>حالة السيريالات</span><select value={serialStatus} onChange={(event) => setSerialStatus(event.target.value)}><option value="available">available</option><option value="reserved">reserved</option><option value="sold">sold</option></select></label>
          </div>
          {serialsLoading ? <QueryFeedback title="جارٍ تحميل السيريالات" message="نقرأ السيريالات حسب الحالة المحددة." /> : serialsError ? <QueryFeedback title="فشل تحميل السيريالات" message={serialsError} tone="error" /> : (
            <div className="table-shell">
              <table>
                <thead><tr><th>المنتج</th><th>السيريال</th><th>الحالة</th><th>إجراء</th></tr></thead>
                <tbody>
                  {(serials?.items ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>{products?.items.find((product) => product.id === item.product_id)?.name || item.product_id}</td>
                      <td>{item.serial_number}</td>
                      <td>{item.status || "-"}</td>
                      <td><button type="button" className="secondary-button" onClick={() => handleUpdateSerial(item.id)}>Reserve</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
