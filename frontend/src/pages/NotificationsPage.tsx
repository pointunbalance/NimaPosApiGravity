import { FormEvent, useState } from "react";

import { getNotifications, sendNotification, updateNotificationStatus } from "../app/api/notifications";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialForm = { channel: "whatsapp", recipient: "", subject: "", content: "" };

export function NotificationsPage() {
  const { session } = useAuth();
  const { messages } = useI18n();
  const copy = messages.notifications;
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, loading, error } = useAsyncValue(session ? () => getNotifications(session.token) : null, [session?.token, refreshKey]);

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await sendNotification(session.token, {
        channel: form.channel,
        recipient: form.recipient,
        subject: form.subject || undefined,
        content: form.content
      });
      setForm(initialForm);
      setRefreshKey((value) => value + 1);
      setMessage(`${copy.createdMessagePrefix} ${created.id ?? copy.table.emptyValue}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleStatus = async (notifId: number, status: string) => {
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await updateNotificationStatus(session.token, notifId, status);
      setRefreshKey((value) => value + 1);
      setMessage(`${copy.statusUpdatedPrefix} ${notifId} ${copy.statusUpdatedConnector} ${status}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title={copy.title} subtitle={copy.subtitle} />

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">{copy.composeEyebrow}</span>
          <h3>{copy.composeTitle}</h3>
          <form className="auth-form" onSubmit={handleSend}>
            <div className="form-grid">
              <label><span>{copy.fields.channel}</span><select value={form.channel} onChange={(event) => setForm((value) => ({ ...value, channel: event.target.value }))}><option value="whatsapp">whatsapp</option><option value="sms">sms</option><option value="email">email</option></select></label>
              <label><span>{copy.fields.recipient}</span><input value={form.recipient} onChange={(event) => setForm((value) => ({ ...value, recipient: event.target.value }))} /></label>
              <label className="form-field-span-2"><span>{copy.fields.subject}</span><input value={form.subject} onChange={(event) => setForm((value) => ({ ...value, subject: event.target.value }))} /></label>
              <label className="form-field-span-2"><span>{copy.fields.content}</span><input value={form.content} onChange={(event) => setForm((value) => ({ ...value, content: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!form.recipient || !form.content}>{copy.submit}</button>
          </form>
          {message ? <QueryFeedback title={copy.successTitle} message={message} /> : null}
          {errorMessage ? <QueryFeedback title={copy.errorTitle} message={errorMessage} tone="error" /> : null}
        </article>
      </section>

      <section className="surface-panel">
        {loading ? (
          <QueryFeedback title={copy.loadingTitle} message={copy.loadingMessage} />
        ) : error ? (
          <QueryFeedback title={copy.loadErrorTitle} message={error} tone="error" />
        ) : (
          <div className="table-shell">
            <table>
              <thead><tr><th>{copy.table.id}</th><th>{copy.table.channel}</th><th>{copy.table.recipient}</th><th>{copy.table.subject}</th><th>{copy.table.status}</th><th>{copy.table.sentAt}</th><th>{copy.table.actions}</th></tr></thead>
              <tbody>
                {(data ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.channel}</td>
                    <td>{item.recipient}</td>
                    <td>{item.subject || copy.table.emptyValue}</td>
                    <td>{item.status}</td>
                    <td>{item.sent_at || copy.table.emptyValue}</td>
                    <td>
                      <button className="secondary-button compact-pill" type="button" onClick={() => handleStatus(item.id ?? 0, "sent")}>{copy.actions.markSent}</button>
                      <button className="secondary-button compact-pill" type="button" onClick={() => handleStatus(item.id ?? 0, "failed")}>{copy.actions.markFailed}</button>
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
