import { FormEvent, useState } from "react";

import { getCustomers } from "../app/api/customers";
import { getOrders } from "../app/api/orders";
import {
  createInstallmentPlan,
  getInstallmentPlan,
  getInstallmentPlans,
  payInstallment
} from "../app/api/advanced";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialPlanForm = {
  customerId: "",
  orderId: "",
  principalAmount: "",
  totalAmount: "",
  downPayment: "0",
  installmentCount: "3",
  installmentAmount: "",
  startDate: "",
  notes: ""
};

const initialPaymentForm = {
  planId: "",
  customerId: "",
  amount: "",
  dueDate: "",
  notes: ""
};

export function InstallmentsPage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planForm, setPlanForm] = useState(initialPlanForm);
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: customers } = useAsyncValue(session ? () => getCustomers(session.token) : null, [session?.token]);
  const { data: orders } = useAsyncValue(session ? () => getOrders(session.token) : null, [session?.token]);
  const { data: plans, loading, error } = useAsyncValue(
    session ? () => getInstallmentPlans(session.token, undefined, statusFilter || undefined) : null,
    [session?.token, statusFilter, refreshKey]
  );
  const { data: planDetail } = useAsyncValue(
    session && selectedPlanId ? () => getInstallmentPlan(session.token, Number(selectedPlanId)) : null,
    [session?.token, selectedPlanId, refreshKey]
  );

  const handleCreatePlan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await createInstallmentPlan(session.token, {
        customer_id: Number(planForm.customerId),
        order_id: planForm.orderId ? Number(planForm.orderId) : undefined,
        principal_amount: Number(planForm.principalAmount || 0),
        total_amount: Number(planForm.totalAmount || 0),
        down_payment: Number(planForm.downPayment || 0),
        installment_count: Number(planForm.installmentCount || 0),
        installment_amount: Number(planForm.installmentAmount || 0),
        start_date: planForm.startDate,
        notes: planForm.notes || undefined,
        interest_type: "none",
        interest_rate: 0,
        total_interest_amount: 0,
        late_fee_enabled: false,
        late_fee_type: "fixed",
        late_fee_amount: 0,
        grace_period_days: 0
      });
      setPlanForm(initialPlanForm);
      setRefreshKey((value) => value + 1);
      setMessage("تم إنشاء خطة تقسيط جديدة.");
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handlePayInstallment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await payInstallment(session.token, Number(paymentForm.planId), {
        plan_id: Number(paymentForm.planId),
        customer_id: Number(paymentForm.customerId),
        amount: Number(paymentForm.amount || 0),
        principal_part: Number(paymentForm.amount || 0),
        interest_part: 0,
        due_date: paymentForm.dueDate,
        notes: paymentForm.notes || undefined
      });
      setPaymentForm(initialPaymentForm);
      setRefreshKey((value) => value + 1);
      setMessage("تم تسجيل دفعة قسط.");
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="الأقساط" subtitle="إدارة خطط السداد وتقسيط الطلبات وتسجيل المدفوعات من واجهة تشغيلية واحدة." />

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">Plans</span><strong>{(plans?.items.length ?? 0).toLocaleString("ar-EG")}</strong><p>عدد خطط الأقساط المقروءة في التصفية الحالية.</p></article>
        <article className="stat-card"><span className="eyebrow">Payments</span><strong>{(planDetail?.payments?.length ?? 0).toLocaleString("ar-EG")}</strong><p>الدفعات المسجلة للخطة المحددة.</p></article>
        <article className="stat-card"><span className="eyebrow">Outstanding</span><strong>{Number((planDetail?.total_amount ?? 0) - (planDetail?.payments?.reduce((sum, item) => sum + Number(item.amount ?? 0), 0) ?? 0)).toLocaleString("ar-EG")}</strong><p>المتبقي التقديري للخطة المحددة.</p></article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Plan Builder</span>
          <h3>إنشاء خطة تقسيط</h3>
          <form className="auth-form" onSubmit={handleCreatePlan}>
            <div className="form-grid">
              <label><span>العميل</span><select value={planForm.customerId} onChange={(event) => setPlanForm((value) => ({ ...value, customerId: event.target.value }))}><option value="">اختر عميلًا</option>{(customers?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label><span>الطلب</span><select value={planForm.orderId} onChange={(event) => setPlanForm((value) => ({ ...value, orderId: event.target.value }))}><option value="">بدون طلب</option>{(orders?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.id}</option>)}</select></label>
              <label><span>الأصل</span><input type="number" min="0" step="0.01" value={planForm.principalAmount} onChange={(event) => setPlanForm((value) => ({ ...value, principalAmount: event.target.value }))} /></label>
              <label><span>الإجمالي</span><input type="number" min="0" step="0.01" value={planForm.totalAmount} onChange={(event) => setPlanForm((value) => ({ ...value, totalAmount: event.target.value }))} /></label>
              <label><span>الدفعة الأولى</span><input type="number" min="0" step="0.01" value={planForm.downPayment} onChange={(event) => setPlanForm((value) => ({ ...value, downPayment: event.target.value }))} /></label>
              <label><span>عدد الأقساط</span><input type="number" min="1" value={planForm.installmentCount} onChange={(event) => setPlanForm((value) => ({ ...value, installmentCount: event.target.value }))} /></label>
              <label><span>قيمة القسط</span><input type="number" min="0" step="0.01" value={planForm.installmentAmount} onChange={(event) => setPlanForm((value) => ({ ...value, installmentAmount: event.target.value }))} /></label>
              <label><span>البداية</span><input type="date" value={planForm.startDate} onChange={(event) => setPlanForm((value) => ({ ...value, startDate: event.target.value }))} /></label>
              <label><span>ملاحظات</span><input value={planForm.notes} onChange={(event) => setPlanForm((value) => ({ ...value, notes: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!planForm.customerId || !planForm.totalAmount || !planForm.installmentAmount || !planForm.startDate}>إنشاء الخطة</button>
          </form>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Payment Entry</span>
          <h3>تسجيل دفعة</h3>
          <form className="auth-form" onSubmit={handlePayInstallment}>
            <div className="form-grid">
              <label><span>الخطة</span><select value={paymentForm.planId} onChange={(event) => setPaymentForm((value) => ({ ...value, planId: event.target.value }))}><option value="">اختر خطة</option>{(plans?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.id}</option>)}</select></label>
              <label><span>العميل</span><select value={paymentForm.customerId} onChange={(event) => setPaymentForm((value) => ({ ...value, customerId: event.target.value }))}><option value="">اختر عميلًا</option>{(customers?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label><span>المبلغ</span><input type="number" min="0" step="0.01" value={paymentForm.amount} onChange={(event) => setPaymentForm((value) => ({ ...value, amount: event.target.value }))} /></label>
              <label><span>تاريخ الاستحقاق</span><input type="date" value={paymentForm.dueDate} onChange={(event) => setPaymentForm((value) => ({ ...value, dueDate: event.target.value }))} /></label>
              <label><span>ملاحظات</span><input value={paymentForm.notes} onChange={(event) => setPaymentForm((value) => ({ ...value, notes: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!paymentForm.planId || !paymentForm.customerId || !paymentForm.amount || !paymentForm.dueDate}>تسجيل الدفعة</button>
          </form>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <div className="form-grid">
            <label><span>الحالة</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">كل الحالات</option><option value="active">active</option><option value="completed">completed</option><option value="overdue">overdue</option></select></label>
          </div>
          {loading ? <QueryFeedback title="جارٍ تحميل الخطط" message="نقرأ خطط الأقساط الحالية." /> : error ? <QueryFeedback title="فشل تحميل الخطط" message={error} tone="error" /> : (
            <div className="table-shell">
              <table>
                <thead><tr><th>#</th><th>العميل</th><th>الإجمالي</th><th>القسط</th><th>الحالة</th><th>تفاصيل</th></tr></thead>
                <tbody>
                  {(plans?.items ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{customers?.items.find((customer) => customer.id === item.customer_id)?.name || item.customer_id}</td>
                      <td>{Number(item.total_amount ?? 0).toLocaleString("ar-EG")}</td>
                      <td>{Number(item.installment_amount ?? 0).toLocaleString("ar-EG")}</td>
                      <td>{item.status || "-"}</td>
                      <td><button type="button" className="secondary-button" onClick={() => setSelectedPlanId(String(item.id))}>عرض</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Plan Detail</span>
          {planDetail ? (
            <div className="table-shell">
              <table>
                <thead><tr><th>الدفعة</th><th>المبلغ</th><th>الأصل</th><th>الفائدة</th><th>الاستحقاق</th></tr></thead>
                <tbody>
                  {(planDetail.payments ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{Number(item.amount ?? 0).toLocaleString("ar-EG")}</td>
                      <td>{Number(item.principal_part ?? 0).toLocaleString("ar-EG")}</td>
                      <td>{Number(item.interest_part ?? 0).toLocaleString("ar-EG")}</td>
                      <td>{item.due_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <QueryFeedback title="لم يتم اختيار خطة" message="اختر خطة من الجدول لعرض دفعاتها المسجلة." />
          )}
        </article>
      </section>
    </div>
  );
}
