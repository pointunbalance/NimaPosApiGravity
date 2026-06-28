import { FormEvent, useMemo, useState } from "react";

import { declareGlobalEvent, getMarketSignals, getRiskForecast, updateMarketSignal } from "../app/api/economicIntel";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialSignalForm = {
  signalType: "gold",
  value: ""
};

const initialEventForm = {
  eventName: "",
  severityScore: "5",
  affectedCategories: ""
};

export function MarketMonitorPage() {
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

  const summary = useMemo(
    () => ({
      signals: signals?.length ?? 0,
      forecastItems: forecast?.length ?? 0,
      hikes: (forecast ?? []).filter((item) => item.suggested_price > item.current_price).length
    }),
    [signals, forecast]
  );

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
      const created = await declareGlobalEvent(session.token, {
        event_name: eventForm.eventName,
        severity_score: Number(eventForm.severityScore || 5),
        affected_categories: eventForm.affectedCategories
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      });
      setEventForm(initialEventForm);
      setRefreshKey((value) => value + 1);
      setMessage(`تم تسجيل الحدث العالمي برقم ${created.id}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="مراقب السوق" subtitle="متابعة إشارات السوق والتوقعات السعرية الاستباقية وربطها بأحداث المخاطر العالمية." />

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">Signals</span><strong>{summary.signals.toLocaleString("ar-EG")}</strong><p>عدد الإشارات السوقية المعرفة حاليًا.</p></article>
        <article className="stat-card"><span className="eyebrow">Forecasts</span><strong>{summary.forecastItems.toLocaleString("ar-EG")}</strong><p>عدد المنتجات التي تحمل اقتراحات سعرية.</p></article>
        <article className="stat-card"><span className="eyebrow">Price Hikes</span><strong>{summary.hikes.toLocaleString("ar-EG")}</strong><p>الاقتراحات التي تشير إلى زيادة سعرية مقارنة بالحالي.</p></article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Signals</span>
          <h3>تحديث إشارة سوقية</h3>
          <form className="auth-form" onSubmit={handleUpdateSignal}>
            <div className="form-grid">
              <label><span>نوع الإشارة</span><input value={signalForm.signalType} onChange={(event) => setSignalForm((value) => ({ ...value, signalType: event.target.value }))} /></label>
              <label><span>القيمة الحالية</span><input type="number" step="0.01" value={signalForm.value} onChange={(event) => setSignalForm((value) => ({ ...value, value: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!signalForm.signalType || !signalForm.value}>تحديث الإشارة</button>
          </form>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Risk Events</span>
          <h3>إعلان حدث عالمي</h3>
          <form className="auth-form" onSubmit={handleDeclareEvent}>
            <div className="form-grid">
              <label><span>اسم الحدث</span><input value={eventForm.eventName} onChange={(event) => setEventForm((value) => ({ ...value, eventName: event.target.value }))} /></label>
              <label><span>درجة الشدة</span><input type="number" min="1" max="10" step="0.1" value={eventForm.severityScore} onChange={(event) => setEventForm((value) => ({ ...value, severityScore: event.target.value }))} /></label>
              <label><span>الفئات المتأثرة</span><input value={eventForm.affectedCategories} onChange={(event) => setEventForm((value) => ({ ...value, affectedCategories: event.target.value }))} placeholder="beverages, electronics" /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!eventForm.eventName}>تسجيل الحدث</button>
          </form>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          {signalsLoading ? (
            <QueryFeedback title="جارٍ تحميل الإشارات" message="نقرأ مؤشرات السوق الحالية." />
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
            <QueryFeedback title="جارٍ تحميل التوقعات" message="نحسب اقتراحات الأسعار المتأثرة بالسوق." />
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
    </div>
  );
}
