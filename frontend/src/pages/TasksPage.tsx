import { FormEvent, useState } from "react";

import { createProjectTask, getProjectCostingSummary, getProjectTasks, getProjects } from "../app/api/project";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialForm = {
  name: "",
  allocatedBudget: "",
  estimatedHours: "",
  status: "pending"
};

export function TasksPage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: projects } = useAsyncValue(session ? () => getProjects(session.token) : null, [session?.token, refreshKey]);
  const { data: tasks, loading, error } = useAsyncValue(
    session && selectedProjectId ? () => getProjectTasks(session.token, Number(selectedProjectId)) : null,
    [session?.token, selectedProjectId, refreshKey]
  );
  const { data: summary } = useAsyncValue(
    session && selectedProjectId ? () => getProjectCostingSummary(session.token, Number(selectedProjectId)) : null,
    [session?.token, selectedProjectId, refreshKey]
  );

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !selectedProjectId) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await createProjectTask(session.token, Number(selectedProjectId), {
        name: form.name,
        allocated_budget: Number(form.allocatedBudget || 0),
        estimated_hours: Number(form.estimatedHours || 0),
        status: form.status
      });
      setForm(initialForm);
      setRefreshKey((value) => value + 1);
      setMessage("تمت إضافة المهمة وربطها بالمشروع المحدد.");
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="المهام" subtitle="تقسيم المشاريع إلى مهام WBS ومتابعة ميزانيتها التقديرية وساعاتها التنفيذية." />

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">Tasks</span><strong>{((tasks?.tasks ?? []).length).toLocaleString("ar-EG")}</strong><p>عدد المهام المعرفة داخل المشروع المحدد.</p></article>
        <article className="stat-card"><span className="eyebrow">Budget</span><strong>{Number(summary?.total_budget ?? 0).toLocaleString("ar-EG")}</strong><p>الميزانية الإجمالية للمشروع المحدد.</p></article>
        <article className="stat-card"><span className="eyebrow">Remaining</span><strong>{Number(summary?.remaining_budget ?? 0).toLocaleString("ar-EG")}</strong><p>الرصيد المتبقي بعد احتساب التكلفة الفعلية الحالية.</p></article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">WBS Planner</span>
          <h3>إضافة مهمة</h3>
          <div className="form-grid">
            <label>
              <span>المشروع</span>
              <select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)}>
                <option value="">اختر المشروع</option>
                {(projects?.projects ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
          </div>
          <form className="auth-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <label><span>اسم المهمة</span><input value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} /></label>
              <label><span>الميزانية المخصصة</span><input type="number" min="0" step="0.01" value={form.allocatedBudget} onChange={(event) => setForm((value) => ({ ...value, allocatedBudget: event.target.value }))} /></label>
              <label><span>الساعات التقديرية</span><input type="number" min="0" step="0.5" value={form.estimatedHours} onChange={(event) => setForm((value) => ({ ...value, estimatedHours: event.target.value }))} /></label>
              <label>
                <span>الحالة</span>
                <select value={form.status} onChange={(event) => setForm((value) => ({ ...value, status: event.target.value }))}>
                  <option value="pending">pending</option>
                  <option value="in_progress">in_progress</option>
                  <option value="completed">completed</option>
                </select>
              </label>
            </div>
            <button className="primary-button" type="submit" disabled={!selectedProjectId || !form.name}>إضافة المهمة</button>
          </form>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Cost Snapshot</span>
          <h3>ملخص المشروع</h3>
          {selectedProjectId && summary ? (
            <div className="form-grid">
              <div><strong>{summary.project_name}</strong><p>المشروع المحدد حاليًا.</p></div>
              <div><strong>{Number(summary.total_actual_cost).toLocaleString("ar-EG")}</strong><p>إجمالي التكلفة الفعلية.</p></div>
              <div><strong>{Number(summary.total_labor_cost).toLocaleString("ar-EG")}</strong><p>تكلفة العمل المسجلة.</p></div>
              <div><strong>{Number(summary.total_material_cost).toLocaleString("ar-EG")}</strong><p>تكلفة المواد المستهلكة.</p></div>
            </div>
          ) : (
            <p>اختر مشروعًا لقراءة ملخص التكلفة الحالي.</p>
          )}
        </article>
      </section>

      <section className="surface-panel">
        {loading ? (
          <QueryFeedback title="جارٍ تحميل المهام" message="نقرأ مهام WBS للمشروع المحدد." />
        ) : error ? (
          <QueryFeedback title="فشل تحميل المهام" message={error} tone="error" />
        ) : (
          <div className="table-shell">
            <table>
              <thead><tr><th>#</th><th>المهمة</th><th>الميزانية</th><th>الساعات</th><th>الحالة</th></tr></thead>
              <tbody>
                {(tasks?.tasks ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{Number(item.allocated_budget ?? 0).toLocaleString("ar-EG")}</td>
                    <td>{Number(item.estimated_hours ?? 0).toLocaleString("ar-EG")}</td>
                    <td>{item.status}</td>
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
