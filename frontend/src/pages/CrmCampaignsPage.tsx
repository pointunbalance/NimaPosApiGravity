import { FormEvent, useState } from "react";

import { createCrmCampaign, executeCrmCampaign, getCrmCampaigns, getCrmSegments } from "../app/api/crm";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialForm = { name: "", type: "sms", segmentId: "", messageTemplate: "", scheduledAt: "" };

export function CrmCampaignsPage() {
  const { session } = useAuth();
  const { messages } = useI18n();
  const copy = messages.crmCampaigns;
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: segments } = useAsyncValue(session ? () => getCrmSegments(session.token) : null, [session?.token]);
  const { data: campaigns, loading, error } = useAsyncValue(session ? () => getCrmCampaigns(session.token) : null, [session?.token, refreshKey]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const campaignId = await createCrmCampaign(session.token, {
        name: form.name,
        type: form.type,
        segment_id: Number(form.segmentId),
        message_template: form.messageTemplate,
        scheduled_at: form.scheduledAt || undefined
      });
      setForm(initialForm);
      setRefreshKey((value) => value + 1);
      setMessage(`${copy.createdPrefix} ${campaignId}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleExecute = async (campaignId: number) => {
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await executeCrmCampaign(session.token, campaignId);
      setRefreshKey((value) => value + 1);
      setMessage(`${copy.executedPrefix} ${campaignId}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title={copy.title} subtitle={copy.subtitle} />
      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">{copy.builderEyebrow}</span>
          <h3>{copy.builderTitle}</h3>
          <form className="auth-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <label><span>{copy.fields.name}</span><input value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} /></label>
              <label><span>{copy.fields.type}</span><select value={form.type} onChange={(event) => setForm((value) => ({ ...value, type: event.target.value }))}><option value="sms">{copy.types.sms}</option><option value="email">{copy.types.email}</option></select></label>
              <label><span>{copy.fields.segment}</span><select value={form.segmentId} onChange={(event) => setForm((value) => ({ ...value, segmentId: event.target.value }))}><option value="">{copy.selectSegment}</option>{(segments ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label><span>{copy.fields.scheduledAt}</span><input type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm((value) => ({ ...value, scheduledAt: event.target.value }))} /></label>
              <label className="form-field-span-2"><span>{copy.fields.template}</span><input value={form.messageTemplate} onChange={(event) => setForm((value) => ({ ...value, messageTemplate: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!form.name || !form.segmentId || !form.messageTemplate}>{copy.createSubmit}</button>
          </form>
          {message ? <QueryFeedback title={copy.successTitle} message={message} /> : null}
          {errorMessage ? <QueryFeedback title={copy.errorTitle} message={errorMessage} tone="error" /> : null}
        </article>
      </section>
      <section className="surface-panel">
        {loading ? <QueryFeedback title={copy.loadingTitle} message={copy.loadingMessage} /> : error ? <QueryFeedback title={copy.loadErrorTitle} message={error} tone="error" /> : (
          <div className="table-shell">
            <table>
              <thead><tr><th>{copy.table.id}</th><th>{copy.table.name}</th><th>{copy.table.type}</th><th>{copy.table.segment}</th><th>{copy.table.status}</th><th>{copy.table.scheduledAt}</th><th>{copy.table.action}</th></tr></thead>
              <tbody>
                {(campaigns ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{copy.types[item.type as keyof typeof copy.types] || item.type}</td>
                    <td>{item.segment_id}</td>
                    <td>{item.status || copy.table.emptyValue}</td>
                    <td>{item.scheduled_at || copy.table.emptyValue}</td>
                    <td><button className="secondary-button compact-pill" type="button" onClick={() => handleExecute(item.id)}>{copy.executeAction}</button></td>
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
