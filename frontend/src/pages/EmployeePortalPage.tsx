import { useMemo, useState } from "react";

import { getAttendance, getAttendanceStats } from "../app/api/attendance";
import { getMyTraining } from "../app/api/lms";
import { getNotifications } from "../app/api/notifications";
import { getUserActivity } from "../app/api/users";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function EmployeePortalPage() {
  const { session } = useAuth();
  const [month, setMonth] = useState(currentMonth());

  const { data: attendance } = useAsyncValue(session ? () => getAttendance(session.token) : null, [session?.token]);
  const { data: stats, error: statsError } = useAsyncValue(
    session ? () => getAttendanceStats(session.token, session.user.id, month) : null,
    [session?.token, session?.user.id, month]
  );
  const { data: training } = useAsyncValue(session ? () => getMyTraining(session.token) : null, [session?.token]);
  const { data: activity } = useAsyncValue(
    session ? () => getUserActivity(session.token, session.user.id) : null,
    [session?.token, session?.user.id]
  );
  const { data: notifications } = useAsyncValue(session ? () => getNotifications(session.token) : null, [session?.token]);

  const personalAttendance = useMemo(
    () => (attendance ?? []).filter((item) => item.user_id === session?.user.id).slice(0, 8),
    [attendance, session?.user.id]
  );

  const notificationPreview = useMemo(() => (notifications ?? []).slice(0, 5), [notifications]);

  return (
    <div className="page-stack">
      <PageHeader title="بوابة الموظفين" subtitle="واجهة شخصية تعرض الحضور وسجل النشاط والتدريب والتنبيهات للمستخدم الحالي." />

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">Present Days</span><strong>{Number(stats?.present_days ?? 0).toLocaleString("ar-EG")}</strong><p>أيام الحضور خلال الشهر المحدد.</p></article>
        <article className="stat-card"><span className="eyebrow">Hours</span><strong>{Number(stats?.total_hours ?? 0).toLocaleString("ar-EG")}</strong><p>إجمالي الساعات المسجلة خلال الشهر.</p></article>
        <article className="stat-card"><span className="eyebrow">Training</span><strong>{(training ?? []).length.toLocaleString("ar-EG")}</strong><p>سجلات التدريب المسجلة للمستخدم.</p></article>
      </section>

      <section className="surface-panel">
        <div className="form-grid">
          <label><span>الشهر</span><input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label>
        </div>
        {statsError ? <QueryFeedback title="فشل تحميل إحصاءات الحضور" message={getReadableAuthError(statsError)} tone="error" /> : null}
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Attendance</span>
          <div className="table-shell">
            <table>
              <thead><tr><th>التاريخ</th><th>الدخول</th><th>الخروج</th><th>الساعات</th><th>الحالة</th></tr></thead>
              <tbody>
                {personalAttendance.map((item) => (
                  <tr key={item.id}>
                    <td>{item.date}</td>
                    <td>{item.check_in || "-"}</td>
                    <td>{item.check_out || "-"}</td>
                    <td>{Number(item.hours_worked ?? 0).toLocaleString("ar-EG")}</td>
                    <td>{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Training</span>
          <div className="table-shell">
            <table>
              <thead><tr><th>المادة</th><th>الفئة</th><th>النتيجة</th><th>الإكمال</th></tr></thead>
              <tbody>
                {(training ?? []).slice(0, 8).map((item, index) => (
                  <tr key={`${item.article_id ?? index}-${index}`}>
                    <td>{item.article_title || item.article_id || "-"}</td>
                    <td>{item.category || "-"}</td>
                    <td>{Number(item.score ?? 0).toLocaleString("ar-EG")}</td>
                    <td>{item.completed_at || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Activity</span>
          <div className="table-shell">
            <table>
              <thead><tr><th>النوع</th><th>الإجراء</th><th>التفاصيل</th><th>الوقت</th></tr></thead>
              <tbody>
                {(activity?.items ?? []).slice(0, 8).map((item, index) => (
                  <tr key={`${item.reference_id ?? index}-${index}`}>
                    <td>{item.type || "-"}</td>
                    <td>{item.action || "-"}</td>
                    <td>{item.details || "-"}</td>
                    <td>{item.created_at || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Notifications</span>
          <div className="table-shell">
            <table>
              <thead><tr><th>القناة</th><th>المستلم</th><th>الحالة</th><th>المرسل</th></tr></thead>
              <tbody>
                {notificationPreview.map((item, index) => (
                  <tr key={`${item.id ?? index}-${index}`}>
                    <td>{item.channel}</td>
                    <td>{item.recipient}</td>
                    <td>{item.status}</td>
                    <td>{item.sent_at || "-"}</td>
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
