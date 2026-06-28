import { FormEvent, useMemo, useState } from "react";

import { getCustomers } from "../app/api/customers";
import {
  createSubscriptionPlan,
  enrollSubscription,
  getActiveSubscriptions,
  getSubscriptionPlans,
  runRecurringBilling
} from "../app/api/subscriptions";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialPlanForm = {
  name: "",
  price: "",
  intervalMonths: "1"
};

const initialEnrollForm = {
  customerId: "",
  planId: "",
  startDate: "",
  notes: ""
};

export function SubscriptionsPage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [planForm, setPlanForm] = useState(initialPlanForm);
  const [enrollForm, setEnrollForm] = useState(initialEnrollForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: customers } = useAsyncValue(session ? () => getCustomers(session.token) : null, [session?.token]);
  const { data: plans, loading: plansLoading, error: plansError } = useAsyncValue(
    session ? () => getSubscriptionPlans(session.token) : null,
    [session?.token, refreshKey]
  );
  const { data: subscriptions, loading: subscriptionsLoading, error: subscriptionsError } = useAsyncValue(
    session ? () => getActiveSubscriptions(session.token) : null,
    [session?.token, refreshKey]
  );

  const activePlans = useMemo(
    () => (plans ?? []).filter((item) => item.is_active !== false),
    [plans]
  );

  const handleCreatePlan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await createSubscriptionPlan(session.token, {
        name: planForm.name,
        price: Number(planForm.price || 0),
        interval_months: Number(planForm.intervalMonths || 1),
        is_active: true
      });
      setPlanForm(initialPlanForm);
      setRefreshKey((value) => value + 1);
      setMessage("تم إنشاء خطة اشتراك جديدة.");
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleEnroll = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await enrollSubscription(session.token, {
        customer_id: Number(enrollForm.customerId),
        plan_id: Number(enrollForm.planId),
        start_date: enrollForm.startDate || undefined,
        notes: enrollForm.notes || undefined
      });
      setEnrollForm(initialEnrollForm);
      setRefreshKey((value) => value + 1);
      setMessage("تم إلحاق العميل بالاشتراك المحدد.");
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleRunBilling = async () => {
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const result = await runRecurringBilling(session.token);
      setRefreshKey((value) => value + 1);
      setMessage(result.message || "تم تشغيل الفوترة الدورية.");
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="الاشتراكات" subtitle="إدارة خطط الاشتراك والعملاء المشتركين وتشغيل الفوترة الدورية من واجهة واحدة." />

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">Plans</span><strong>{(plans?.length ?? 0).toLocaleString("ar-EG")}</strong><p>عدد الخطط المعرفة في النظام.</p></article>
        <article className="stat-card"><span className="eyebrow">Active Plans</span><strong>{activePlans.length.toLocaleString("ar-EG")}</strong><p>الخطط المتاحة حاليًا للاشتراك.</p></article>
        <article className="stat-card"><span className="eyebrow">Active Subs</span><strong>{(subscriptions?.length ?? 0).toLocaleString("ar-EG")}</strong><p>إجمالي الاشتراكات النشطة الحالية.</p></article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Plan Builder</span>
          <h3>إضافة خطة</h3>
          <form className="auth-form" onSubmit={handleCreatePlan}>
            <div className="form-grid">
              <label><span>اسم الخطة</span><input value={planForm.name} onChange={(event) => setPlanForm((value) => ({ ...value, name: event.target.value }))} /></label>
              <label><span>السعر</span><input type="number" min="0" step="0.01" value={planForm.price} onChange={(event) => setPlanForm((value) => ({ ...value, price: event.target.value }))} /></label>
              <label><span>الفاصل بالأشهر</span><input type="number" min="1" value={planForm.intervalMonths} onChange={(event) => setPlanForm((value) => ({ ...value, intervalMonths: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!planForm.name || !planForm.price}>إنشاء الخطة</button>
          </form>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Enroll</span>
          <h3>إلحاق عميل</h3>
          <form className="auth-form" onSubmit={handleEnroll}>
            <div className="form-grid">
              <label>
                <span>العميل</span>
                <select value={enrollForm.customerId} onChange={(event) => setEnrollForm((value) => ({ ...value, customerId: event.target.value }))}>
                  <option value="">اختر عميلًا</option>
                  {(customers?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label>
                <span>الخطة</span>
                <select value={enrollForm.planId} onChange={(event) => setEnrollForm((value) => ({ ...value, planId: event.target.value }))}>
                  <option value="">اختر خطة</option>
                  {activePlans.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label><span>تاريخ البداية</span><input type="date" value={enrollForm.startDate} onChange={(event) => setEnrollForm((value) => ({ ...value, startDate: event.target.value }))} /></label>
              <label><span>ملاحظات</span><input value={enrollForm.notes} onChange={(event) => setEnrollForm((value) => ({ ...value, notes: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!enrollForm.customerId || !enrollForm.planId}>إلحاق العميل</button>
          </form>
          <button type="button" className="secondary-button" onClick={handleRunBilling}>تشغيل الفوترة الدورية</button>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          {plansLoading ? (
            <QueryFeedback title="جارٍ تحميل الخطط" message="نقرأ خطط الاشتراك المعرفة حاليًا." />
          ) : plansError ? (
            <QueryFeedback title="فشل تحميل الخطط" message={plansError} tone="error" />
          ) : (
            <div className="table-shell">
              <table>
                <thead><tr><th>الخطة</th><th>السعر</th><th>الفاصل</th><th>نشطة</th></tr></thead>
                <tbody>
                  {(plans ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{Number(item.price ?? 0).toLocaleString("ar-EG")}</td>
                      <td>{item.interval_months}</td>
                      <td>{item.is_active === false ? "لا" : "نعم"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="surface-panel">
          {subscriptionsLoading ? (
            <QueryFeedback title="جارٍ تحميل الاشتراكات" message="نقرأ العملاء المشتركين حاليًا وخططهم الفعالة." />
          ) : subscriptionsError ? (
            <QueryFeedback title="فشل تحميل الاشتراكات" message={subscriptionsError} tone="error" />
          ) : (
            <div className="table-shell">
              <table>
                <thead><tr><th>#</th><th>العميل</th><th>الخطة</th><th>البداية</th><th>الفاتورة التالية</th></tr></thead>
                <tbody>
                  {(subscriptions ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.customer_name || customers?.items.find((customer) => customer.id === item.customer_id)?.name || item.customer_id}</td>
                      <td>{item.plan_name || activePlans.find((plan) => plan.id === item.plan_id)?.name || item.plan_id}</td>
                      <td>{item.start_date || "-"}</td>
                      <td>{item.next_invoice_date || "-"}</td>
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
