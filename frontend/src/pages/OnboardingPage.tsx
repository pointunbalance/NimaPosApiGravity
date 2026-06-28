import { FormEvent, useMemo, useState } from "react";

import { getBranches } from "../app/api/branches";
import { setUserPermission } from "../app/api/permissions";
import { createUser, getUsers } from "../app/api/users";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const modules = ["sales", "products", "inventory", "customers", "finance", "accounting", "admin"];
const initialForm = {
  username: "",
  fullName: "",
  phone: "",
  pin: "",
  role: "cashier",
  branchId: "",
  moduleName: "sales",
  level: "1"
};

export function OnboardingPage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: branches } = useAsyncValue(session ? () => getBranches(session.token) : null, [session?.token]);
  const { data: users } = useAsyncValue(session ? () => getUsers(session.token) : null, [session?.token, refreshKey]);

  const branchName = useMemo(
    () => branches?.find((item) => String(item.id) === form.branchId)?.name ?? null,
    [branches, form.branchId]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createUser(session.token, {
        username: form.username,
        pin: form.pin,
        role: form.role,
        full_name: form.fullName,
        phone: form.phone
      });
      await setUserPermission(session.token, {
        user_id: created.user_id,
        module: form.moduleName,
        level: Number(form.level)
      });
      setForm(initialForm);
      setRefreshKey((value) => value + 1);
      setMessage(`تمت تهيئة ${created.username} بصلاحية ${form.moduleName} للمستوى ${form.level}${branchName ? ` مع تجهيز العمل لفرع ${branchName}` : ""}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="التهيئة" subtitle="تهيئة موظف جديد عبر إنشاء الحساب ومنحه صلاحية تشغيل أولية مع سياق الفرع المستهدف." />

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Starter Setup</span>
          <h3>إعداد موظف جديد</h3>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label><span>اسم المستخدم</span><input value={form.username} onChange={(event) => setForm((value) => ({ ...value, username: event.target.value }))} /></label>
              <label><span>الاسم الكامل</span><input value={form.fullName} onChange={(event) => setForm((value) => ({ ...value, fullName: event.target.value }))} /></label>
              <label><span>الهاتف</span><input value={form.phone} onChange={(event) => setForm((value) => ({ ...value, phone: event.target.value }))} /></label>
              <label><span>PIN</span><input value={form.pin} onChange={(event) => setForm((value) => ({ ...value, pin: event.target.value }))} /></label>
              <label><span>الدور</span><select value={form.role} onChange={(event) => setForm((value) => ({ ...value, role: event.target.value }))}><option value="cashier">cashier</option><option value="manager">manager</option><option value="admin">admin</option><option value="owner">owner</option></select></label>
              <label>
                <span>الفرع المستهدف</span>
                <select value={form.branchId} onChange={(event) => setForm((value) => ({ ...value, branchId: event.target.value }))}>
                  <option value="">اختر الفرع</option>
                  {(branches ?? []).map((item) => <option key={item.id} value={item.id}>{item.code} - {item.name}</option>)}
                </select>
              </label>
              <label>
                <span>الوحدة الأولى</span>
                <select value={form.moduleName} onChange={(event) => setForm((value) => ({ ...value, moduleName: event.target.value }))}>
                  {modules.map((module) => <option key={module} value={module}>{module}</option>)}
                </select>
              </label>
              <label>
                <span>مستوى الصلاحية</span>
                <select value={form.level} onChange={(event) => setForm((value) => ({ ...value, level: event.target.value }))}>
                  <option value="1">1 - view</option>
                  <option value="2">2 - add</option>
                  <option value="3">3 - edit</option>
                  <option value="4">4 - manage</option>
                  <option value="5">5 - full</option>
                </select>
              </label>
            </div>
            <button className="primary-button" type="submit" disabled={!form.username || !form.pin || !form.moduleName}>تنفيذ التهيئة</button>
          </form>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Ready Queue</span>
          <h3>أحدث الحسابات الجاهزة</h3>
          <div className="table-shell">
            <table>
              <thead><tr><th>#</th><th>المستخدم</th><th>الاسم</th><th>الدور</th><th>الحالة</th></tr></thead>
              <tbody>
                {(users?.items ?? []).slice(0, 8).map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.username}</td>
                    <td>{item.full_name || "-"}</td>
                    <td>{item.role}</td>
                    <td>{Number(item.is_active ?? 1) ? "نشط" : "معطل"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}
