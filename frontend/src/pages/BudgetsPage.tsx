import { FormEvent, useMemo, useState } from "react";

import { createBudget, getAccounts, getBudgets, getCostCenters, getFiscalYears } from "../app/api/accounting";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialForm = {
  accountId: "",
  costCenterId: "",
  periodType: "monthly",
  fiscalYearId: "",
  plannedAmount: ""
};

export function BudgetsPage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedCostCenterId, setSelectedCostCenterId] = useState("");
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const numericCostCenterId = selectedCostCenterId ? Number(selectedCostCenterId) : undefined;
  const { data: budgets, loading, error } = useAsyncValue(
    session ? () => getBudgets(session.token, numericCostCenterId) : null,
    [session?.token, refreshKey, numericCostCenterId]
  );
  const { data: accounts } = useAsyncValue(session ? () => getAccounts(session.token) : null, [session?.token]);
  const { data: costCenters } = useAsyncValue(session ? () => getCostCenters(session.token) : null, [session?.token]);
  const { data: fiscalYears } = useAsyncValue(session ? () => getFiscalYears(session.token) : null, [session?.token, refreshKey]);

  const totalPlanned = useMemo(
    () => (budgets ?? []).reduce((sum, item) => sum + (item.planned_amount ?? 0), 0),
    [budgets]
  );

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createBudget(session.token, {
        account_id: Number(form.accountId),
        cost_center_id: form.costCenterId ? Number(form.costCenterId) : undefined,
        period_type: form.periodType,
        fiscal_year_id: Number(form.fiscalYearId),
        planned_amount: Number(form.plannedAmount) || 0
      });
      setForm(initialForm);
      setRefreshKey((value) => value + 1);
      setMessage(`تم إنشاء بند موازنة جديد برقم ${created.id}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="الموازنات" subtitle="تخطيط البنود المحاسبية وربطها بالحسابات والسنة المالية ومراكز التكلفة." />

      <section className="stats-grid">
        <article className="stat-card">
          <span className="eyebrow">Planned Total</span>
          <strong>{totalPlanned.toLocaleString("ar-EG")} ج.م</strong>
          <p>إجمالي المبالغ المخططة ضمن نتائج الفلتر الحالي.</p>
        </article>
        <article className="stat-card">
          <span className="eyebrow">Budget Items</span>
          <strong>{(budgets?.length ?? 0).toLocaleString("ar-EG")}</strong>
          <p>عدد البنود المسجلة في شاشة الموازنات.</p>
        </article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">New Budget</span>
          <h3>إضافة موازنة</h3>
          <form className="auth-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <label>
                <span>الحساب</span>
                <select value={form.accountId} onChange={(event) => setForm((value) => ({ ...value, accountId: event.target.value }))}>
                  <option value="">اختر الحساب</option>
                  {(accounts ?? []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} - {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>السنة المالية</span>
                <select value={form.fiscalYearId} onChange={(event) => setForm((value) => ({ ...value, fiscalYearId: event.target.value }))}>
                  <option value="">اختر السنة</option>
                  {(fiscalYears ?? []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>مركز التكلفة</span>
                <select value={form.costCenterId} onChange={(event) => setForm((value) => ({ ...value, costCenterId: event.target.value }))}>
                  <option value="">بدون مركز تكلفة</option>
                  {(costCenters ?? []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} - {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>دورية الموازنة</span>
                <select value={form.periodType} onChange={(event) => setForm((value) => ({ ...value, periodType: event.target.value }))}>
                  <option value="monthly">monthly</option>
                  <option value="quarterly">quarterly</option>
                  <option value="yearly">yearly</option>
                </select>
              </label>
              <label className="form-field-span-2">
                <span>المبلغ المخطط</span>
                <input
                  inputMode="decimal"
                  value={form.plannedAmount}
                  onChange={(event) => setForm((value) => ({ ...value, plannedAmount: event.target.value }))}
                />
              </label>
            </div>
            <button className="primary-button" type="submit" disabled={!form.accountId || !form.fiscalYearId || !form.plannedAmount}>
              حفظ الموازنة
            </button>
          </form>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Filter</span>
          <h3>تصفية البنود</h3>
          <div className="form-grid">
            <label>
              <span>مركز التكلفة</span>
              <select value={selectedCostCenterId} onChange={(event) => setSelectedCostCenterId(event.target.value)}>
                <option value="">كل المراكز</option>
                {(costCenters ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} - {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p>يتم تحديث القائمة مباشرة بحسب مركز التكلفة المختار.</p>
        </article>
      </section>

      <section className="surface-panel">
        {loading ? (
          <QueryFeedback title="جارٍ تحميل الموازنات" message="نقرأ بنود الموازنة الحالية من النظام." />
        ) : error ? (
          <QueryFeedback title="فشل تحميل الموازنات" message={error} tone="error" />
        ) : (
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>الحساب</th>
                  <th>مركز التكلفة</th>
                  <th>الدورية</th>
                  <th>السنة المالية</th>
                  <th>المبلغ المخطط</th>
                  <th>آخر تحديث</th>
                </tr>
              </thead>
              <tbody>
                {(budgets ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.account_name || item.account_id}</td>
                    <td>{item.cost_center_id || "-"}</td>
                    <td>{item.period_type}</td>
                    <td>{item.fiscal_year_id}</td>
                    <td>{(item.planned_amount ?? 0).toLocaleString("ar-EG")} ج.م</td>
                    <td>{item.updated_at || "-"}</td>
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
