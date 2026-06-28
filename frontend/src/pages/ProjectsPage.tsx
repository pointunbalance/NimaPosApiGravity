import { FormEvent, useState } from "react";

import { getCustomers } from "../app/api/customers";
import { createProject, getProjects } from "../app/api/project";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialForm = {
  name: "",
  customerId: "",
  description: "",
  budget: "",
  startDate: "",
  endDate: "",
  status: "planning"
};

export function ProjectsPage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: customers } = useAsyncValue(session ? () => getCustomers(session.token) : null, [session?.token]);
  const { data, loading, error } = useAsyncValue(
    session ? () => getProjects(session.token, statusFilter || undefined) : null,
    [session?.token, statusFilter, refreshKey]
  );

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await createProject(session.token, {
        name: form.name,
        customer_id: form.customerId ? Number(form.customerId) : undefined,
        description: form.description,
        budget: Number(form.budget || 0),
        start_date: form.startDate || undefined,
        end_date: form.endDate || undefined,
        status: form.status
      });
      setForm(initialForm);
      setRefreshKey((value) => value + 1);
      setMessage("تم إنشاء المشروع وإدراجه ضمن سجل التنفيذ.");
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="المشاريع" subtitle="إدارة المشاريع التشغيلية وربطها بالعملاء والميزانيات والجداول الزمنية من شاشة واحدة." />

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">Projects</span><strong>{(data?.total ?? 0).toLocaleString("ar-EG")}</strong><p>إجمالي المشاريع المقروءة من واجهة المشاريع.</p></article>
        <article className="stat-card"><span className="eyebrow">Planning</span><strong>{((data?.projects ?? []).filter((item) => item.status === "planning").length).toLocaleString("ar-EG")}</strong><p>المشاريع التي ما زالت في مرحلة التخطيط.</p></article>
        <article className="stat-card"><span className="eyebrow">In Progress</span><strong>{((data?.projects ?? []).filter((item) => item.status === "in_progress").length).toLocaleString("ar-EG")}</strong><p>المشاريع الجارية حاليًا.</p></article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Project Setup</span>
          <h3>إنشاء مشروع</h3>
          <form className="auth-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <label><span>اسم المشروع</span><input value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} /></label>
              <label>
                <span>العميل</span>
                <select value={form.customerId} onChange={(event) => setForm((value) => ({ ...value, customerId: event.target.value }))}>
                  <option value="">بدون عميل</option>
                  {(customers?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label><span>الميزانية</span><input type="number" min="0" step="0.01" value={form.budget} onChange={(event) => setForm((value) => ({ ...value, budget: event.target.value }))} /></label>
              <label>
                <span>الحالة</span>
                <select value={form.status} onChange={(event) => setForm((value) => ({ ...value, status: event.target.value }))}>
                  <option value="planning">planning</option>
                  <option value="in_progress">in_progress</option>
                  <option value="completed">completed</option>
                  <option value="on_hold">on_hold</option>
                </select>
              </label>
              <label><span>تاريخ البداية</span><input type="date" value={form.startDate} onChange={(event) => setForm((value) => ({ ...value, startDate: event.target.value }))} /></label>
              <label><span>تاريخ النهاية</span><input type="date" value={form.endDate} onChange={(event) => setForm((value) => ({ ...value, endDate: event.target.value }))} /></label>
              <label><span>الوصف</span><textarea rows={4} value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!form.name}>إنشاء المشروع</button>
          </form>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Filters</span>
          <h3>تصفية القائمة</h3>
          <div className="form-grid">
            <label>
              <span>الحالة</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">كل الحالات</option>
                <option value="planning">planning</option>
                <option value="in_progress">in_progress</option>
                <option value="completed">completed</option>
                <option value="on_hold">on_hold</option>
              </select>
            </label>
          </div>
          <p>استخدم الفلتر لعرض المشاريع حسب حالتها الحالية على مستوى التنفيذ.</p>
        </article>
      </section>

      <section className="surface-panel">
        {loading ? (
          <QueryFeedback title="جارٍ تحميل المشاريع" message="نقرأ المشاريع المتاحة من واجهة إدارة المشاريع." />
        ) : error ? (
          <QueryFeedback title="فشل تحميل المشاريع" message={error} tone="error" />
        ) : (
          <div className="table-shell">
            <table>
              <thead><tr><th>#</th><th>المشروع</th><th>العميل</th><th>الميزانية</th><th>الحالة</th><th>الفترة</th></tr></thead>
              <tbody>
                {(data?.projects ?? []).map((item) => {
                  const customerName = customers?.items?.find((customer) => customer.id === item.customer_id)?.name ?? "-";
                  return (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.name}</td>
                      <td>{customerName}</td>
                      <td>{Number(item.budget ?? 0).toLocaleString("ar-EG")}</td>
                      <td>{item.status}</td>
                      <td>{item.start_date || "-"} / {item.end_date || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
