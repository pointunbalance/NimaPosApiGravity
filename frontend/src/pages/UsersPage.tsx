import { FormEvent, useState } from "react";

import { createUser, deactivateUser, getUsers, resetUserPin, updateUser, type UserRow } from "../app/api/users";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialCreateForm = { username: "", pin: "", role: "cashier", fullName: "", phone: "" };
const initialEditForm = { id: 0, role: "cashier", fullName: "", phone: "", isActive: "1", newPin: "" };

export function UsersPage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, loading, error } = useAsyncValue(session ? () => getUsers(session.token) : null, [session?.token, refreshKey]);
  const selected = data?.items.find((item) => item.id === editForm.id) ?? null;

  const startEdit = (user: UserRow) => {
    setEditForm({
      id: user.id,
      role: user.role,
      fullName: user.full_name || "",
      phone: user.phone || "",
      isActive: String(user.is_active ?? 1),
      newPin: ""
    });
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createUser(session.token, {
        username: createForm.username,
        pin: createForm.pin,
        role: createForm.role,
        full_name: createForm.fullName,
        phone: createForm.phone
      });
      setCreateForm(initialCreateForm);
      setRefreshKey((value) => value + 1);
      setMessage(`تم إنشاء المستخدم ${created.username}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !selected) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await updateUser(session.token, selected.id, {
        role: editForm.role,
        full_name: editForm.fullName,
        phone: editForm.phone,
        is_active: Number(editForm.isActive)
      });
      if (editForm.newPin.trim()) {
        await resetUserPin(session.token, selected.id, editForm.newPin.trim());
      }
      setRefreshKey((value) => value + 1);
      setMessage(`تم تحديث المستخدم ${selected.username}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleDeactivate = async (user: UserRow) => {
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await deactivateUser(session.token, user.id);
      setRefreshKey((value) => value + 1);
      setMessage(`تم تعطيل المستخدم ${user.username}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="المستخدمون" subtitle="إدارة مستخدمي النظام وإنشاء الحسابات وضبط الأدوار وPIN." />

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Create User</span>
          <h3>إضافة مستخدم جديد</h3>
          <form className="auth-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <label><span>اسم المستخدم</span><input value={createForm.username} onChange={(e) => setCreateForm((v) => ({ ...v, username: e.target.value }))} /></label>
              <label><span>PIN</span><input value={createForm.pin} onChange={(e) => setCreateForm((v) => ({ ...v, pin: e.target.value }))} /></label>
              <label><span>الدور</span><select value={createForm.role} onChange={(e) => setCreateForm((v) => ({ ...v, role: e.target.value }))}><option value="cashier">cashier</option><option value="manager">manager</option><option value="admin">admin</option><option value="owner">owner</option></select></label>
              <label><span>الاسم الكامل</span><input value={createForm.fullName} onChange={(e) => setCreateForm((v) => ({ ...v, fullName: e.target.value }))} /></label>
              <label className="form-field-span-2"><span>الهاتف</span><input value={createForm.phone} onChange={(e) => setCreateForm((v) => ({ ...v, phone: e.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!createForm.username || !createForm.pin}>إنشاء المستخدم</button>
          </form>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Edit User</span>
          <h3>{selected ? `تعديل ${selected.username}` : "اختر مستخدمًا من الجدول"}</h3>
          <form className="auth-form" onSubmit={handleUpdate}>
            <div className="form-grid">
              <label><span>الدور</span><select disabled={!selected} value={editForm.role} onChange={(e) => setEditForm((v) => ({ ...v, role: e.target.value }))}><option value="cashier">cashier</option><option value="manager">manager</option><option value="admin">admin</option><option value="owner">owner</option></select></label>
              <label><span>الحالة</span><select disabled={!selected} value={editForm.isActive} onChange={(e) => setEditForm((v) => ({ ...v, isActive: e.target.value }))}><option value="1">نشط</option><option value="0">معطل</option></select></label>
              <label><span>الاسم الكامل</span><input disabled={!selected} value={editForm.fullName} onChange={(e) => setEditForm((v) => ({ ...v, fullName: e.target.value }))} /></label>
              <label><span>الهاتف</span><input disabled={!selected} value={editForm.phone} onChange={(e) => setEditForm((v) => ({ ...v, phone: e.target.value }))} /></label>
              <label className="form-field-span-2"><span>PIN جديد اختياري</span><input disabled={!selected} value={editForm.newPin} onChange={(e) => setEditForm((v) => ({ ...v, newPin: e.target.value }))} /></label>
            </div>
            <button className="primary-button" disabled={!selected} type="submit">حفظ التعديلات</button>
          </form>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>
      </section>

      <section className="surface-panel">
        {loading ? (
          <QueryFeedback title="جارٍ تحميل المستخدمين" message="نقرأ سجل المستخدمين الحالي من النظام." />
        ) : error ? (
          <QueryFeedback title="فشل تحميل المستخدمين" message={error} tone="error" />
        ) : (
          <div className="table-shell">
            <table>
              <thead><tr><th>#</th><th>اسم المستخدم</th><th>الاسم الكامل</th><th>الدور</th><th>الهاتف</th><th>الحالة</th><th>إجراءات</th></tr></thead>
              <tbody>
                {(data?.items ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.username}</td>
                    <td>{item.full_name || "-"}</td>
                    <td>{item.role}</td>
                    <td>{item.phone || "-"}</td>
                    <td>{Number(item.is_active ?? 1) ? "نشط" : "معطل"}</td>
                    <td>
                      <button className="secondary-button compact-pill" type="button" onClick={() => startEdit(item)}>تعديل</button>
                      <button className="secondary-button compact-pill" type="button" onClick={() => handleDeactivate(item)}>تعطيل</button>
                    </td>
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
