import { FormEvent, useMemo, useState } from "react";

import { setUserPermission, getUserPermissions } from "../app/api/permissions";
import { getUsers } from "../app/api/users";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const defaultModules = [
  "sales",
  "products",
  "inventory",
  "customers",
  "finance",
  "accounting",
  "admin"
];

export function RoleManagementPage() {
  const { session } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [moduleName, setModuleName] = useState("sales");
  const [level, setLevel] = useState("1");
  const [refreshKey, setRefreshKey] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: users } = useAsyncValue(session ? () => getUsers(session.token) : null, [session?.token]);
  const { data: permissions, loading, error } = useAsyncValue(
    session && selectedUserId ? () => getUserPermissions(session.token, selectedUserId) : null,
    [session?.token, selectedUserId, refreshKey]
  );

  const selectedUser = useMemo(
    () => users?.items.find((item) => item.id === selectedUserId) ?? null,
    [users?.items, selectedUserId]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !selectedUserId) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await setUserPermission(session.token, {
        user_id: selectedUserId,
        module: moduleName,
        level: Number(level)
      });
      setRefreshKey((value) => value + 1);
      setMessage(`تم تحديث صلاحية ${moduleName} للمستخدم ${selectedUser?.username || selectedUserId}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="إدارة الأدوار" subtitle="مراجعة وتعديل مستويات الصلاحيات لكل مستخدم ولكل وحدة." />

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Permission Editor</span>
          <h3>تعيين صلاحية</h3>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                <span>المستخدم</span>
                <select value={selectedUserId ?? ""} onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : null)}>
                  <option value="">اختر المستخدم</option>
                  {(users?.items ?? []).map((item) => (
                    <option key={item.id} value={item.id}>{item.full_name || item.username}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>الوحدة</span>
                <select value={moduleName} onChange={(e) => setModuleName(e.target.value)}>
                  {defaultModules.map((module) => <option key={module} value={module}>{module}</option>)}
                </select>
              </label>
              <label>
                <span>المستوى</span>
                <select value={level} onChange={(e) => setLevel(e.target.value)}>
                  <option value="0">0 - none</option>
                  <option value="1">1 - view</option>
                  <option value="2">2 - add</option>
                  <option value="3">3 - edit</option>
                  <option value="4">4 - manage</option>
                  <option value="5">5 - full</option>
                </select>
              </label>
            </div>
            <button className="primary-button" type="submit" disabled={!selectedUserId}>حفظ الصلاحية</button>
          </form>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Current User</span>
          <h3>{selectedUser ? selectedUser.full_name || selectedUser.username : "اختر مستخدمًا"}</h3>
          <p>{selectedUser ? `الدور الحالي: ${selectedUser.role}` : "سيتم عرض صلاحيات المستخدم المختار هنا."}</p>
        </article>
      </section>

      <section className="surface-panel">
        {loading ? (
          <QueryFeedback title="جارٍ تحميل الصلاحيات" message="نقرأ صلاحيات المستخدم الحالي." />
        ) : error ? (
          <QueryFeedback title="فشل تحميل الصلاحيات" message={error} tone="error" />
        ) : permissions ? (
          <div className="table-shell">
            <table>
              <thead><tr><th>الوحدة</th><th>المستوى</th></tr></thead>
              <tbody>
                {permissions.map((item, index) => (
                  <tr key={`${item.module}-${index}`}>
                    <td>{item.module}</td>
                    <td>{item.level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <QueryFeedback title="لا توجد بيانات" message="اختر مستخدمًا لعرض صلاحياته الحالية." />
        )}
      </section>
    </div>
  );
}
