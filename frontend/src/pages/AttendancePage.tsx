import { FormEvent, useMemo, useState } from "react";

import { checkOutAttendance, createAttendance, getAttendance, getAttendanceStats } from "../app/api/attendance";
import { getUsers } from "../app/api/users";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const today = new Date().toISOString().slice(0, 10);
const monthValue = today.slice(0, 7);
const timeValue = new Date().toTimeString().slice(0, 8);

export function AttendancePage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [userId, setUserId] = useState("");
  const [date, setDate] = useState(today);
  const [checkIn, setCheckIn] = useState(timeValue);
  const [notes, setNotes] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(monthValue);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: attendance, loading, error } = useAsyncValue(
    session ? () => getAttendance(session.token) : null,
    [session?.token, refreshKey]
  );
  const { data: users } = useAsyncValue(session ? () => getUsers(session.token) : null, [session?.token]);
  const { data: stats } = useAsyncValue(
    session && selectedUserId ? () => getAttendanceStats(session.token, selectedUserId, selectedMonth) : null,
    [session?.token, selectedUserId, selectedMonth, refreshKey]
  );

  const selectedUser = useMemo(
    () => users?.items.find((item) => String(item.id) === userId) ?? null,
    [users?.items, userId]
  );

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !selectedUser) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createAttendance(session.token, {
        user_id: selectedUser.id,
        user_name: selectedUser.full_name || selectedUser.username,
        date,
        check_in: checkIn,
        status: "present",
        notes,
        branch_id: 1
      });
      setUserId("");
      setNotes("");
      setSelectedUserId(selectedUser.id);
      setRefreshKey((value) => value + 1);
      setMessage(`تم تسجيل حضور جديد برقم ${created.id}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleCheckOut = async (id: number, employeeId: number) => {
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const result = await checkOutAttendance(session.token, id);
      setSelectedUserId(employeeId);
      setRefreshKey((value) => value + 1);
      setMessage(`تم تسجيل الانصراف عند ${result.check_out} بعد ${result.hours} ساعة عمل.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="الحضور والانصراف" subtitle="تسجيل حضور الموظفين ومعالجة الانصراف ومراجعة إحصاءات الشهر." />

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Check-in</span>
          <h3>تسجيل حضور</h3>
          <form className="auth-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <label>
                <span>الموظف</span>
                <select value={userId} onChange={(e) => setUserId(e.target.value)}>
                  <option value="">اختر الموظف</option>
                  {(users?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.full_name || item.username}</option>)}
                </select>
              </label>
              <label><span>التاريخ</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
              <label><span>وقت الحضور</span><input type="time" step="1" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} /></label>
              <label className="form-field-span-2"><span>ملاحظات</span><input value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!selectedUser}>تسجيل الحضور</button>
          </form>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Monthly Stats</span>
          <h3>إحصاءات الموظف</h3>
          <div className="form-grid">
            <label>
              <span>الموظف</span>
              <select value={selectedUserId ?? ""} onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : null)}>
                <option value="">اختر الموظف</option>
                {(users?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.full_name || item.username}</option>)}
              </select>
            </label>
            <label><span>الشهر</span><input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} /></label>
          </div>
          {stats ? (
            <div className="detail-grid">
              <div className="feedback-panel"><strong>أيام الحضور</strong><p>{stats.present_days ?? 0}</p></div>
              <div className="feedback-panel"><strong>أيام الغياب</strong><p>{stats.absent_days ?? 0}</p></div>
              <div className="feedback-panel"><strong>إجمالي الساعات</strong><p>{stats.total_hours ?? 0}</p></div>
              <div className="feedback-panel"><strong>إضافي</strong><p>{stats.overtime_hours ?? 0}</p></div>
            </div>
          ) : (
            <QueryFeedback title="لا توجد إحصاءات معروضة" message="اختر موظفًا وشهرًا لعرض ملخص الحضور." />
          )}
        </article>
      </section>

      <section className="surface-panel">
        {loading ? (
          <QueryFeedback title="جارٍ تحميل السجلات" message="نقرأ أحدث سجلات الحضور والانصراف." />
        ) : error ? (
          <QueryFeedback title="فشل تحميل السجلات" message={error} tone="error" />
        ) : (
          <div className="table-shell">
            <table>
              <thead><tr><th>#</th><th>الموظف</th><th>التاريخ</th><th>الحضور</th><th>الانصراف</th><th>الساعات</th><th>الحالة</th><th>إجراء</th></tr></thead>
              <tbody>
                {(attendance ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.user_name || item.user_id}</td>
                    <td>{item.date}</td>
                    <td>{item.check_in || "-"}</td>
                    <td>{item.check_out || "-"}</td>
                    <td>{item.hours_worked ?? 0}</td>
                    <td>{item.status}</td>
                    <td>
                      {!item.check_out ? (
                        <button className="secondary-button compact-pill" type="button" onClick={() => handleCheckOut(item.id, item.user_id)}>تسجيل انصراف</button>
                      ) : (
                        <span className="status-tag">مكتمل</span>
                      )}
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
