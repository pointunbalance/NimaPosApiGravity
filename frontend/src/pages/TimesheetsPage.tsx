import { FormEvent, useMemo, useState } from "react";

import { getProducts } from "../app/api/products";
import {
  createProjectMaterialConsumption,
  createProjectTimesheet,
  getProjectCostingSummary,
  getProjectTasks,
  getProjects
} from "../app/api/project";
import { getUsers } from "../app/api/users";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialTimesheetForm = {
  taskId: "",
  employeeId: "",
  date: "",
  hoursWorked: "",
  hourlyRate: "",
  note: ""
};

const initialMaterialForm = {
  taskId: "",
  productId: "",
  quantity: "",
  note: ""
};

export function TimesheetsPage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [timesheetForm, setTimesheetForm] = useState(initialTimesheetForm);
  const [materialForm, setMaterialForm] = useState(initialMaterialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: projects } = useAsyncValue(session ? () => getProjects(session.token) : null, [session?.token]);
  const { data: users } = useAsyncValue(session ? () => getUsers(session.token) : null, [session?.token]);
  const { data: products } = useAsyncValue(session ? () => getProducts(session.token) : null, [session?.token]);
  const { data: tasks } = useAsyncValue(
    session && selectedProjectId ? () => getProjectTasks(session.token, Number(selectedProjectId)) : null,
    [session?.token, selectedProjectId, refreshKey]
  );
  const { data: summary, loading, error } = useAsyncValue(
    session && selectedProjectId ? () => getProjectCostingSummary(session.token, Number(selectedProjectId)) : null,
    [session?.token, selectedProjectId, refreshKey]
  );

  const activeProjectName = useMemo(
    () => projects?.projects.find((item) => String(item.id) === selectedProjectId)?.name ?? null,
    [projects, selectedProjectId]
  );

  const handleTimesheetSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !selectedProjectId) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await createProjectTimesheet(session.token, Number(selectedProjectId), {
        task_id: timesheetForm.taskId ? Number(timesheetForm.taskId) : undefined,
        employee_id: timesheetForm.employeeId ? Number(timesheetForm.employeeId) : undefined,
        date: timesheetForm.date,
        hours_worked: Number(timesheetForm.hoursWorked),
        hourly_rate: Number(timesheetForm.hourlyRate),
        note: timesheetForm.note
      });
      setTimesheetForm(initialTimesheetForm);
      setRefreshKey((value) => value + 1);
      setMessage(`تم تسجيل ساعات العمل للمشروع ${activeProjectName ?? ""}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleMaterialSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !selectedProjectId) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await createProjectMaterialConsumption(session.token, Number(selectedProjectId), {
        task_id: materialForm.taskId ? Number(materialForm.taskId) : undefined,
        product_id: Number(materialForm.productId),
        quantity: Number(materialForm.quantity),
        note: materialForm.note
      });
      setMaterialForm(initialMaterialForm);
      setRefreshKey((value) => value + 1);
      setMessage(`تم تحميل استهلاك المواد على المشروع ${activeProjectName ?? ""}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="سجلات الوقت" subtitle="تسجيل ساعات العمل واستهلاك المواد مع قراءة فورية لتكلفة المشروع وهوامشه." />

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">Labor Cost</span><strong>{Number(summary?.total_labor_cost ?? 0).toLocaleString("ar-EG")}</strong><p>إجمالي تكلفة العمل المسجلة.</p></article>
        <article className="stat-card"><span className="eyebrow">Material Cost</span><strong>{Number(summary?.total_material_cost ?? 0).toLocaleString("ar-EG")}</strong><p>إجمالي تكلفة المواد المسجلة.</p></article>
        <article className="stat-card"><span className="eyebrow">Margin</span><strong>{Number(summary?.profit_margin_percentage ?? 0).toLocaleString("ar-EG")}%</strong><p>هامش الميزانية المتبقي للمشروع المحدد.</p></article>
      </section>

      <section className="surface-panel">
        <div className="form-grid">
          <label>
            <span>المشروع</span>
            <select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)}>
              <option value="">اختر المشروع</option>
              {(projects?.projects ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Labor Entry</span>
          <h3>تسجيل ساعات عمل</h3>
          <form className="auth-form" onSubmit={handleTimesheetSubmit}>
            <div className="form-grid">
              <label>
                <span>المهمة</span>
                <select value={timesheetForm.taskId} onChange={(event) => setTimesheetForm((value) => ({ ...value, taskId: event.target.value }))}>
                  <option value="">بدون مهمة محددة</option>
                  {(tasks?.tasks ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label>
                <span>الموظف</span>
                <select value={timesheetForm.employeeId} onChange={(event) => setTimesheetForm((value) => ({ ...value, employeeId: event.target.value }))}>
                  <option value="">المستخدم الحالي</option>
                  {(users?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.full_name || item.username}</option>)}
                </select>
              </label>
              <label><span>التاريخ</span><input type="date" value={timesheetForm.date} onChange={(event) => setTimesheetForm((value) => ({ ...value, date: event.target.value }))} /></label>
              <label><span>الساعات</span><input type="number" min="0" step="0.5" value={timesheetForm.hoursWorked} onChange={(event) => setTimesheetForm((value) => ({ ...value, hoursWorked: event.target.value }))} /></label>
              <label><span>سعر الساعة</span><input type="number" min="0" step="0.01" value={timesheetForm.hourlyRate} onChange={(event) => setTimesheetForm((value) => ({ ...value, hourlyRate: event.target.value }))} /></label>
              <label><span>ملاحظة</span><textarea rows={3} value={timesheetForm.note} onChange={(event) => setTimesheetForm((value) => ({ ...value, note: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!selectedProjectId || !timesheetForm.date || !timesheetForm.hoursWorked || !timesheetForm.hourlyRate}>تسجيل الساعات</button>
          </form>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Material Entry</span>
          <h3>تحميل مواد على المشروع</h3>
          <form className="auth-form" onSubmit={handleMaterialSubmit}>
            <div className="form-grid">
              <label>
                <span>المهمة</span>
                <select value={materialForm.taskId} onChange={(event) => setMaterialForm((value) => ({ ...value, taskId: event.target.value }))}>
                  <option value="">بدون مهمة محددة</option>
                  {(tasks?.tasks ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label>
                <span>الصنف</span>
                <select value={materialForm.productId} onChange={(event) => setMaterialForm((value) => ({ ...value, productId: event.target.value }))}>
                  <option value="">اختر الصنف</option>
                  {(products?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label><span>الكمية</span><input type="number" min="0" step="0.01" value={materialForm.quantity} onChange={(event) => setMaterialForm((value) => ({ ...value, quantity: event.target.value }))} /></label>
              <label><span>ملاحظة</span><textarea rows={3} value={materialForm.note} onChange={(event) => setMaterialForm((value) => ({ ...value, note: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!selectedProjectId || !materialForm.productId || !materialForm.quantity}>تحميل المادة</button>
          </form>
        </article>
      </section>

      {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
      {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}

      <section className="surface-panel">
        {loading ? (
          <QueryFeedback title="جارٍ تحميل الملخص" message="نقرأ التكلفة الحالية للمشروع المحدد." />
        ) : error ? (
          <QueryFeedback title="فشل تحميل الملخص" message={error} tone="error" />
        ) : summary ? (
          <div className="table-shell">
            <table>
              <thead><tr><th>المشروع</th><th>الميزانية</th><th>تكلفة العمل</th><th>تكلفة المواد</th><th>إجمالي التكلفة</th><th>المتبقي</th></tr></thead>
              <tbody>
                <tr>
                  <td>{summary.project_name}</td>
                  <td>{Number(summary.total_budget).toLocaleString("ar-EG")}</td>
                  <td>{Number(summary.total_labor_cost).toLocaleString("ar-EG")}</td>
                  <td>{Number(summary.total_material_cost).toLocaleString("ar-EG")}</td>
                  <td>{Number(summary.total_actual_cost).toLocaleString("ar-EG")}</td>
                  <td>{Number(summary.remaining_budget).toLocaleString("ar-EG")}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p>اختر مشروعًا لعرض ملخص التكلفة.</p>
        )}
      </section>
    </div>
  );
}
