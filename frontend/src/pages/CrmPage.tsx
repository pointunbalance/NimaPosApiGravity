import { FormEvent, useMemo, useState } from "react";

import { createCrmInteraction, createCrmSegment, getCrmSegments, getCustomerCrmHistory } from "../app/api/crm";
import { getCustomers } from "../app/api/customers";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialSegmentForm = { name: "", criteriaJson: "{\"tier\":\"vip\"}" };
const initialInteractionForm = { customerId: "", type: "call", notes: "" };

export function CrmPage() {
  const { session } = useAuth();
  const { locale, messages } = useI18n();
  const copy = messages.crm;
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [segmentForm, setSegmentForm] = useState(initialSegmentForm);
  const [interactionForm, setInteractionForm] = useState(initialInteractionForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: segments, loading, error } = useAsyncValue(session ? () => getCrmSegments(session.token) : null, [session?.token, refreshKey]);
  const { data: customers } = useAsyncValue(session ? () => getCustomers(session.token) : null, [session?.token]);
  const { data: history, loading: historyLoading, error: historyError } = useAsyncValue(
    session && selectedCustomerId ? () => getCustomerCrmHistory(session.token, Number(selectedCustomerId)) : null,
    [session?.token, selectedCustomerId, refreshKey]
  );

  const customerName = useMemo(
    () => customers?.items.find((item) => String(item.id) === selectedCustomerId)?.name ?? null,
    [customers?.items, selectedCustomerId]
  );

  const handleCreateSegment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const segmentId = await createCrmSegment(session.token, { name: segmentForm.name, criteria_json: segmentForm.criteriaJson });
      setSegmentForm(initialSegmentForm);
      setRefreshKey((value) => value + 1);
      setMessage(`${copy.createdSegmentPrefix} ${segmentId}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleCreateInteraction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const interactionId = await createCrmInteraction(session.token, {
        customer_id: Number(interactionForm.customerId),
        type: interactionForm.type,
        notes: interactionForm.notes
      });
      setSelectedCustomerId(interactionForm.customerId);
      setInteractionForm(initialInteractionForm);
      setRefreshKey((value) => value + 1);
      setMessage(`${copy.createdInteractionPrefix} ${interactionId}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title={copy.title} subtitle={copy.subtitle} />
      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">{copy.cards.segments}</span><strong>{(segments?.length ?? 0).toLocaleString(numberLocale)}</strong><p>{copy.cards.segmentsNote}</p></article>
        <article className="stat-card"><span className="eyebrow">{copy.cards.trackedCustomers}</span><strong>{(customers?.items.length ?? 0).toLocaleString(numberLocale)}</strong><p>{copy.cards.trackedCustomersNote}</p></article>
        <article className="stat-card"><span className="eyebrow">{copy.cards.customerHistory}</span><strong>{(history?.length ?? 0).toLocaleString(numberLocale)}</strong><p>{copy.cards.customerHistoryNote}</p></article>
      </section>
      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">{copy.segmentEyebrow}</span>
          <h3>{copy.segmentTitle}</h3>
          <form className="auth-form" onSubmit={handleCreateSegment}>
            <div className="form-grid">
              <label><span>{copy.fields.segmentName}</span><input value={segmentForm.name} onChange={(event) => setSegmentForm((value) => ({ ...value, name: event.target.value }))} /></label>
              <label className="form-field-span-2"><span>{copy.fields.criteriaJson}</span><input value={segmentForm.criteriaJson} onChange={(event) => setSegmentForm((value) => ({ ...value, criteriaJson: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!segmentForm.name || !segmentForm.criteriaJson}>{copy.createSegment}</button>
          </form>
          {message ? <QueryFeedback title={copy.successTitle} message={message} /> : null}
          {errorMessage ? <QueryFeedback title={copy.errorTitle} message={errorMessage} tone="error" /> : null}
        </article>
        <article className="surface-panel">
          <span className="eyebrow">{copy.interactionEyebrow}</span>
          <h3>{copy.interactionTitle}</h3>
          <form className="auth-form" onSubmit={handleCreateInteraction}>
            <div className="form-grid">
              <label><span>{copy.fields.customer}</span><select value={interactionForm.customerId} onChange={(event) => setInteractionForm((value) => ({ ...value, customerId: event.target.value }))}><option value="">{copy.selectCustomer}</option>{(customers?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label><span>{copy.fields.interactionType}</span><select value={interactionForm.type} onChange={(event) => setInteractionForm((value) => ({ ...value, type: event.target.value }))}><option value="call">{copy.interactionTypes.call}</option><option value="email">{copy.interactionTypes.email}</option><option value="visit">{copy.interactionTypes.visit}</option><option value="sms">{copy.interactionTypes.sms}</option></select></label>
              <label className="form-field-span-2"><span>{copy.fields.notes}</span><input value={interactionForm.notes} onChange={(event) => setInteractionForm((value) => ({ ...value, notes: event.target.value }))} /></label>
            </div>
            <button className="secondary-button compact-pill" type="submit" disabled={!interactionForm.customerId || !interactionForm.notes}>{copy.saveInteraction}</button>
          </form>
        </article>
      </section>
      <section className="settings-layout">
        <article className="surface-panel">
          {loading ? <QueryFeedback title={copy.loadingSegmentsTitle} message={copy.loadingSegmentsMessage} /> : error ? <QueryFeedback title={copy.loadSegmentsErrorTitle} message={error} tone="error" /> : (
            <div className="table-shell">
              <table>
                <thead><tr><th>{copy.segmentsTable.id}</th><th>{copy.segmentsTable.name}</th><th>{copy.segmentsTable.criteria}</th><th>{copy.segmentsTable.createdAt}</th></tr></thead>
                <tbody>
                  {(segments ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.name}</td>
                      <td>{item.criteria_json}</td>
                      <td>{item.created_at || copy.segmentsTable.emptyValue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
        <article className="surface-panel">
          <span className="eyebrow">{copy.historyEyebrow}</span>
          <h3>{customerName ? `${copy.historyTitlePrefix} ${customerName}` : copy.historyTitleIdle}</h3>
          <div className="form-grid">
            <label><span>{copy.fields.historyCustomer}</span><select value={selectedCustomerId} onChange={(event) => setSelectedCustomerId(event.target.value)}><option value="">{copy.selectCustomer}</option>{(customers?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          </div>
          {historyLoading ? <QueryFeedback title={copy.loadingHistoryTitle} message={copy.loadingHistoryMessage} /> : historyError ? <QueryFeedback title={copy.loadHistoryErrorTitle} message={historyError} tone="error" /> : (
            <div className="table-shell">
              <table>
                <thead><tr><th>{copy.historyTable.type}</th><th>{copy.historyTable.notes}</th><th>{copy.historyTable.agent}</th><th>{copy.historyTable.date}</th></tr></thead>
                <tbody>
                  {(history ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>{copy.interactionTypes[item.type as keyof typeof copy.interactionTypes] || item.type}</td>
                      <td>{item.notes}</td>
                      <td>{item.agent_name || item.user_id || copy.historyTable.emptyValue}</td>
                      <td>{item.created_at || copy.historyTable.emptyValue}</td>
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
