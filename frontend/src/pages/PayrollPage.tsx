import { FormEvent, useMemo, useState } from "react";

import { getPayroll, getPayrollSummary, processPayroll } from "../app/api/payroll";
import { getUsers } from "../app/api/users";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const currentMonth = new Date().toISOString().slice(0, 7);

export function PayrollPage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [userId, setUserId] = useState("");
  const [month, setMonth] = useState(currentMonth);
  const [baseSalary, setBaseSalary] = useState("");
  const [daysWorked, setDaysWorked] = useState("30");
  const [bonus, setBonus] = useState("0");
  const [deductions, setDeductions] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: users } = useAsyncValue(session ? () => getUsers(session.token) : null, [session?.token]);
  const { data: payrollResponse, loading, error } = useAsyncValue(
    session ? () => getPayroll(session.token, month) : null,
    [session?.token, month, refreshKey]
  );
  const { data: summaryResponse } = useAsyncValue(
    session ? () => getPayrollSummary(session.token, month) : null,
    [session?.token, month, refreshKey]
  );

  const rows = payrollResponse?.data ?? [];
  const summary = summaryResponse?.data;
  const selectedUser = useMemo(
    () => users?.items.find((item) => String(item.id) === userId) ?? null,
    [users?.items, userId]
  );

  const handleProcess = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !selectedUser) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const result = await processPayroll(session.token, {
        user_id: selectedUser.id,
        month,
        base_salary: Number(baseSalary) || 0,
        days_worked: Number(daysWorked) || 0,
        bonus: Number(bonus) || 0,
        deductions: Number(deductions) || 0,
        payment_method: paymentMethod,
        notes
      });
      setRefreshKey((value) => value + 1);
      setMessage(`تمت معالجة راتب ${selectedUser.full_name || selectedUser.username} بصافي ${(result.data.net_salary ?? 0).toLocaleString("ar-EG")} ج.م.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="الرواتب" subtitle="معالجة الرواتب الشهرية ومراجعة الملخص المالي لكل شهر." />

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Process Salary</span>
          <h3>معالجة راتب جديد</h3>
          <form className="auth-form" onSubmit={handleProcess}>
            <div className="form-grid">
              <label>
                <span>الموظف</span>
                <select value={userId} onChange={(e) => setUserId(e.target.value)}>
                  <option value="">اختر الموظف</option>
                  {(users?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.full_name || item.username}</option>)}
                </select>
              </label>
              <label><span>الشهر</span><input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></label>
              <label><span>الراتب الأساسي</span><input inputMode="decimal" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} /></label>
              <label><span>أيام العمل</span><input inputMode="numeric" value={daysWorked} onChange={(e) => setDaysWorked(e.target.value)} /></label>
              <label><span>المكافآت</span><input inputMode="decimal" value={bonus} onChange={(e) => setBonus(e.target.value)} /></label>
              <label><span>الاستقطاعات</span><input inputMode="decimal" value={deductions} onChange={(e) => setDeductions(e.target.value)} /></label>
              <label><span>طريقة الدفع</span><select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}><option value="cash">cash</option><option value="bank">bank</option></select></label>
              <label className="form-field-span-2"><span>ملاحظات</span><input value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!selectedUser || !baseSalary}>معالجة الراتب</button>
          </form>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Monthly Summary</span>
          <h3>ملخص شهر {month}</h3>
          {summary ? (
            <div className="detail-grid">
              <div className="feedback-panel"><strong>عدد السجلات</strong><p>{summary.total_records ?? rows.length}</p></div>
              <div className="feedback-panel"><strong>الأساسي</strong><p>{(summary.total_base_salary ?? 0).toLocaleString("ar-EG")} ج.م</p></div>
              <div className="feedback-panel"><strong>المكافآت</strong><p>{(summary.total_bonus ?? 0).toLocaleString("ar-EG")} ج.م</p></div>
              <div className="feedback-panel"><strong>الاستقطاعات</strong><p>{(summary.total_deductions ?? 0).toLocaleString("ar-EG")} ج.م</p></div>
              <div className="feedback-panel"><strong>الصافي</strong><p>{(summary.total_net_salary ?? 0).toLocaleString("ar-EG")} ج.م</p></div>
            </div>
          ) : (
            <QueryFeedback title="لا يوجد ملخص متاح" message="سيظهر هنا ملخص الشهر بعد وجود سجلات رواتب." />
          )}
        </article>
      </section>

      <section className="surface-panel">
        {loading ? (
          <QueryFeedback title="جارٍ تحميل سجلات الرواتب" message="نقرأ السجلات الخاصة بالشهر المحدد." />
        ) : error ? (
          <QueryFeedback title="فشل تحميل سجلات الرواتب" message={error} tone="error" />
        ) : (
          <div className="table-shell">
            <table>
              <thead><tr><th>#</th><th>الموظف</th><th>الشهر</th><th>الأساسي</th><th>المكافآت</th><th>الاستقطاعات</th><th>الصافي</th><th>الدفع</th></tr></thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.user_name || item.user_id}</td>
                    <td>{item.month}</td>
                    <td>{item.base_salary.toLocaleString("ar-EG")} ج.م</td>
                    <td>{(item.bonus ?? 0).toLocaleString("ar-EG")} ج.م</td>
                    <td>{(item.deductions ?? 0).toLocaleString("ar-EG")} ج.م</td>
                    <td>{(item.net_salary ?? 0).toLocaleString("ar-EG")} ج.م</td>
                    <td>{item.payment_method || "-"}</td>
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
