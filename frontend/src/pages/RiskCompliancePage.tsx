import { FormEvent, useMemo, useState } from "react";

import { createBackup, getBackups, runBackupMaintenance } from "../app/api/backup";
import { declareGlobalEvent, getMarketSignals, getRiskForecast, updateMarketSignal } from "../app/api/economicIntel";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialSignalForm = { signalType: "gold", value: "" };
const initialEventForm = { eventName: "", severityScore: "5", affectedCategories: "" };

export function RiskCompliancePage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [signalForm, setSignalForm] = useState(initialSignalForm);
  const [eventForm, setEventForm] = useState(initialEventForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: signals, loading: signalsLoading, error: signalsError } = useAsyncValue(
    session ? () => getMarketSignals(session.token) : null,
    [session?.token, refreshKey]
  );
  const { data: forecast, loading: forecastLoading, error: forecastError } = useAsyncValue(
    session ? () => getRiskForecast(session.token) : null,
    [session?.token, refreshKey]
  );
  const { data: backups, loading: backupsLoading, error: backupsError } = useAsyncValue(
    session ? () => getBackups(session.token) : null,
    [session?.token, refreshKey]
  );

  const summary = useMemo(
    () => ({
      signalCount: signals?.length ?? 0,
      riskyProducts: forecast?.length ?? 0,
      upwardSignals: (signals ?? []).filter((item) => item.trend === "UP").length,
      backupCount: backups?.length ?? 0
    }),
    [signals, forecast, backups]
  );

  const latestBackup = backups?.[0] ?? null;

  const handleUpdateSignal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const result = await updateMarketSignal(session.token, signalForm.signalType, Number(signalForm.value || 0));
      setSignalForm(initialSignalForm);
      setRefreshKey((value) => value + 1);
      setMessage(result.message);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleDeclareEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const result = await declareGlobalEvent(session.token, {
        event_name: eventForm.eventName,
        severity_score: Number(eventForm.severityScore || 5),
        affected_categories: eventForm.affectedCategories
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      });
      setEventForm(initialEventForm);
      setRefreshKey((value) => value + 1);
      setMessage(`تم تسجيل حدث مخاطر جديد برقم ${result.id}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleCreateBackup = async () => {
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createBackup(session.token);
      setRefreshKey((value) => value + 1);
      setMessage(`تم إنشاء نسخة امتثال احتياطية: ${created.filename}`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleMaintenance = async () => {
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const result = await runBackupMaintenance(session.token);
      setMessage(`${result.message} - حجم القاعدة الحالي ${result.db_size_bytes.toLocaleString("ar-EG")} بايت.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="المخاطر والالتزام" subtitle="لوحة رقابية موحدة تجمع مخاطر السوق واستمرارية الأعمال والجاهزية التشغيلية من بيانات النظام الفعلية." />

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">Signals</span><strong>{summary.signalCount.toLocaleString("ar-EG")}</strong><p>إشارات السوق التي تُراقب حاليًا ضمن سجل المخاطر.</p></article>
        <article className="stat-card"><span className="eyebrow">Risk Products</span><strong>{summary.riskyProducts.toLocaleString("ar-EG")}</strong><p>منتجات عليها اقتراحات تسعير أو تنبيه ناتج عن المخاطر.</p></article>
        <article className="stat-card"><span className="eyebrow">Upward Trends</span><strong>{summary.upwardSignals.toLocaleString("ar-EG")}</strong><p>إشارات صاعدة قد تستدعي قرارات استباقية.</p></article>
        <article className="stat-card"><span className="eyebrow">Backups</span><strong>{summary.backupCount.toLocaleString("ar-EG")}</strong><p>عدد النسخ الاحتياطية المتاحة لضمان الاستمرارية.</p></article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Risk Controls</span>
          <h3>تحديث الإشارات والحدث</h3>
          <form className="auth-form" onSubmit={handleUpdateSignal}>
            <div className="form-grid">
              <label><span>نوع الإشارة</span><input value={signalForm.signalType} onChange={(event) => setSignalForm((value) => ({ ...value, signalType: event.target.value }))} /></label>
              <label><span>القيمة الحالية</span><input type="number" step="0.01" value={signalForm.value} onChange={(event) => setSignalForm((value) => ({ ...value, value: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!signalForm.signalType || !signalForm.value}>تحديث الإشارة</button>
          </form>

          <form className="auth-form" onSubmit={handleDeclareEvent}>
            <div className="form-grid">
              <label><span>اسم الحدث</span><input value={eventForm.eventName} onChange={(event) => setEventForm((value) => ({ ...value, eventName: event.target.value }))} /></label>
              <label><span>درجة الشدة</span><input type="number" min="1" max="10" step="0.1" value={eventForm.severityScore} onChange={(event) => setEventForm((value) => ({ ...value, severityScore: event.target.value }))} /></label>
              <label className="form-field-span-2"><span>الفئات المتأثرة</span><input value={eventForm.affectedCategories} onChange={(event) => setEventForm((value) => ({ ...value, affectedCategories: event.target.value }))} placeholder="beverages, electronics" /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!eventForm.eventName}>تسجيل حدث مخاطر</button>
          </form>

          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Continuity</span>
          <h3>استمرارية الأعمال</h3>
          <div className="inline-actions">
            <button className="primary-button" type="button" onClick={handleCreateBackup}>إنشاء نسخة احتياطية</button>
            <button className="secondary-button compact-pill" type="button" onClick={handleMaintenance}>صيانة قاعدة البيانات</button>
          </div>
          {latestBackup ? (
            <div className="table-shell">
              <table>
                <tbody>
                  <tr><th>آخر نسخة</th><td>{latestBackup.filename}</td></tr>
                  <tr><th>الإنشاء</th><td>{latestBackup.created_at || "-"}</td></tr>
                  <tr><th>الحجم</th><td>{latestBackup.size_bytes.toLocaleString("ar-EG")} بايت</td></tr>
                </tbody>
              </table>
            </div>
          ) : (
            <QueryFeedback title="لا توجد نسخة حديثة" message="يمكن إنشاء نسخة احتياطية مباشرة من هذه الشاشة." />
          )}
        </article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          {signalsLoading ? (
            <QueryFeedback title="جارٍ تحميل مؤشرات المخاطر" message="نقرأ إشارات السوق الحالية." />
          ) : signalsError ? (
            <QueryFeedback title="فشل تحميل الإشارات" message={signalsError} tone="error" />
          ) : (
            <div className="table-shell">
              <table>
                <thead><tr><th>الإشارة</th><th>الحالي</th><th>السابق</th><th>الاتجاه</th><th>آخر تحديث</th></tr></thead>
                <tbody>
                  {(signals ?? []).map((item, index) => (
                    <tr key={`${item.signal_type}-${index}`}>
                      <td>{item.signal_type}</td>
                      <td>{Number(item.current_value ?? 0).toLocaleString("ar-EG")}</td>
                      <td>{Number(item.previous_value ?? 0).toLocaleString("ar-EG")}</td>
                      <td>{item.trend || "-"}</td>
                      <td>{item.last_updated || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="surface-panel">
          {forecastLoading ? (
            <QueryFeedback title="جارٍ تحميل أثر المخاطر" message="نحسب المنتجات المتأثرة والتوصيات السعرية." />
          ) : forecastError ? (
            <QueryFeedback title="فشل تحميل التوقعات" message={forecastError} tone="error" />
          ) : (
            <div className="table-shell">
              <table>
                <thead><tr><th>المنتج</th><th>الإشارة</th><th>السعر الحالي</th><th>السعر المقترح</th><th>الفرق %</th></tr></thead>
                <tbody>
                  {(forecast ?? []).map((item) => (
                    <tr key={item.product_id}>
                      <td>{item.name}</td>
                      <td>{item.trigger_signal}</td>
                      <td>{Number(item.current_price ?? 0).toLocaleString("ar-EG")}</td>
                      <td>{Number(item.suggested_price ?? 0).toLocaleString("ar-EG")}</td>
                      <td>{Number(item.diff_percentage ?? 0).toLocaleString("ar-EG")}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>

      <section className="surface-panel">
        {backupsLoading ? (
          <QueryFeedback title="جارٍ تحميل سجل النسخ" message="نقرأ النسخ الاحتياطية المتاحة لأغراض الامتثال والتعافي." />
        ) : backupsError ? (
          <QueryFeedback title="فشل تحميل سجل النسخ" message={backupsError} tone="error" />
        ) : (
          <div className="table-shell">
            <table>
              <thead><tr><th>الملف</th><th>الحجم</th><th>تاريخ الإنشاء</th></tr></thead>
              <tbody>
                {(backups ?? []).map((item) => (
                  <tr key={item.filename}>
                    <td>{item.filename}</td>
                    <td>{item.size_bytes.toLocaleString("ar-EG")} بايت</td>
                    <td>{item.created_at || "-"}</td>
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
