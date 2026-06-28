import { useMemo, useState } from "react";

import { getBranches } from "../app/api/branches";
import { getUserActivity, getUsers, type UserRow } from "../app/api/users";
import { useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

type RoleGroup = {
  role: string;
  users: UserRow[];
};

function roleLabel(role: string) {
  switch (role) {
    case "owner":
      return "الإدارة العليا";
    case "admin":
      return "الإدارة";
    case "manager":
      return "المديرون";
    case "cashier":
      return "التشغيل والمبيعات";
    default:
      return role;
  }
}

export function OrgChartPage() {
  const { session } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState("");

  const { data: usersResponse, loading: usersLoading, error: usersError } = useAsyncValue(
    session ? () => getUsers(session.token) : null,
    [session?.token]
  );
  const { data: branches, loading: branchesLoading, error: branchesError } = useAsyncValue(
    session ? () => getBranches(session.token) : null,
    [session?.token]
  );
  const { data: activity } = useAsyncValue(
    session && selectedUserId ? () => getUserActivity(session.token, Number(selectedUserId)) : null,
    [session?.token, selectedUserId]
  );

  const users = usersResponse?.items ?? [];
  const selectedUser = users.find((item) => item.id === Number(selectedUserId)) ?? null;

  const groupedRoles = useMemo<RoleGroup[]>(() => {
    const groups = new Map<string, UserRow[]>();
    for (const user of users) {
      const key = user.role || "unknown";
      const bucket = groups.get(key) ?? [];
      bucket.push(user);
      groups.set(key, bucket);
    }

    return Array.from(groups.entries())
      .map(([role, groupedUsers]) => ({ role, users: groupedUsers }))
      .sort((left, right) => right.users.length - left.users.length);
  }, [users]);

  return (
    <div className="page-stack">
      <PageHeader title="الهيكل التنظيمي" subtitle="عرض تشغيلي للهيكل الحالي اعتمادًا على الفروع والمستخدمين والأدوار النشطة داخل النظام." />

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">Branches</span><strong>{(branches?.length ?? 0).toLocaleString("ar-EG")}</strong><p>الفروع المعرفة حاليًا داخل المؤسسة.</p></article>
        <article className="stat-card"><span className="eyebrow">Users</span><strong>{users.length.toLocaleString("ar-EG")}</strong><p>إجمالي المستخدمين المسجلين في النسخة الحالية.</p></article>
        <article className="stat-card"><span className="eyebrow">Roles</span><strong>{groupedRoles.length.toLocaleString("ar-EG")}</strong><p>عدد الأدوار التشغيلية الظاهرة في التوزيع الحالي.</p></article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Structure</span>
          <h3>الطبقات التنظيمية</h3>
          {usersLoading ? (
            <QueryFeedback title="جارٍ تحميل الهيكل" message="نقرأ المستخدمين والأدوار الحالية لتجهيز العرض التنظيمي." />
          ) : usersError ? (
            <QueryFeedback title="فشل تحميل المستخدمين" message={usersError} tone="error" />
          ) : (
            <div className="table-shell">
              <table>
                <thead><tr><th>الدور</th><th>الوصف</th><th>العدد</th><th>الأسماء</th></tr></thead>
                <tbody>
                  {groupedRoles.map((group) => (
                    <tr key={group.role}>
                      <td>{roleLabel(group.role)}</td>
                      <td>{group.role}</td>
                      <td>{group.users.length.toLocaleString("ar-EG")}</td>
                      <td>{group.users.map((item) => item.full_name || item.username).join("، ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Branches</span>
          <h3>الوحدات والفروع</h3>
          {branchesLoading ? (
            <QueryFeedback title="جارٍ تحميل الفروع" message="نقرأ الفروع لربطها بالهيكل التشغيلي." />
          ) : branchesError ? (
            <QueryFeedback title="فشل تحميل الفروع" message={branchesError} tone="error" />
          ) : (
            <div className="table-shell">
              <table>
                <thead><tr><th>#</th><th>الكود</th><th>اسم الفرع</th><th>الحالة</th></tr></thead>
                <tbody>
                  {(branches ?? []).map((branch) => (
                    <tr key={branch.id}>
                      <td>{branch.id}</td>
                      <td>{branch.code}</td>
                      <td>{branch.name}</td>
                      <td>{branch.is_active ? "نشط" : "معطل"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">People</span>
          <h3>استعراض عضو في الهيكل</h3>
          <div className="form-grid">
            <label>
              <span>المستخدم</span>
              <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
                <option value="">اختر مستخدمًا</option>
                {users.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.full_name || item.username} - {item.role}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {selectedUser ? (
            <div className="table-shell">
              <table>
                <tbody>
                  <tr><th>اسم المستخدم</th><td>{selectedUser.username}</td></tr>
                  <tr><th>الاسم الكامل</th><td>{selectedUser.full_name || "-"}</td></tr>
                  <tr><th>الدور</th><td>{roleLabel(selectedUser.role)}</td></tr>
                  <tr><th>الهاتف</th><td>{selectedUser.phone || "-"}</td></tr>
                  <tr><th>الحالة</th><td>{Number(selectedUser.is_active ?? 1) ? "نشط" : "معطل"}</td></tr>
                </tbody>
              </table>
            </div>
          ) : (
            <QueryFeedback title="اختر مستخدمًا" message="من هنا يمكن استعراض بيانات أي عضو داخل الهيكل التشغيلي الحالي." />
          )}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Recent Activity</span>
          <h3>آخر النشاطات</h3>
          {!selectedUserId ? (
            <QueryFeedback title="لا يوجد مستخدم محدد" message="حدد مستخدمًا أولًا لعرض آخر الحركات المرتبطة به." />
          ) : (
            <div className="table-shell">
              <table>
                <thead><tr><th>النوع</th><th>الإجراء</th><th>التفاصيل</th><th>التاريخ</th></tr></thead>
                <tbody>
                  {(activity?.items ?? []).map((item, index) => (
                    <tr key={`${item.id ?? index}-${index}`}>
                      <td>{item.type || "-"}</td>
                      <td>{item.action || "-"}</td>
                      <td>{item.details || "-"}</td>
                      <td>{item.created_at || "-"}</td>
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
