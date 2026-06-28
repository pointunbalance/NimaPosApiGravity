import { FormEvent, useState } from "react";

import { getCustomers } from "../app/api/customers";
import { createSupportTicket, createSupportTicketMessage, getSupportTicket, getSupportTickets, updateSupportTicketStatus } from "../app/api/support";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialTicketForm = { customerId: "", subject: "", description: "", priority: "normal", category: "complaint" };
const initialMessageForm = { message: "", status: "open" };

export function CrmTicketsPage() {
  const { session } = useAuth();
  const { messages } = useI18n();
  const copy = messages.crmTickets;
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [ticketForm, setTicketForm] = useState(initialTicketForm);
  const [messageForm, setMessageForm] = useState(initialMessageForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: customers } = useAsyncValue(session ? () => getCustomers(session.token) : null, [session?.token]);
  const { data: tickets, loading, error } = useAsyncValue(session ? () => getSupportTickets(session.token) : null, [session?.token, refreshKey]);
  const { data: ticketDetails, loading: ticketLoading, error: ticketError } = useAsyncValue(
    session && selectedTicketId ? () => getSupportTicket(session.token, Number(selectedTicketId)) : null,
    [session?.token, selectedTicketId, refreshKey]
  );

  const handleCreateTicket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const ticketId = await createSupportTicket(session.token, {
        customer_id: Number(ticketForm.customerId),
        subject: ticketForm.subject,
        description: ticketForm.description,
        priority: ticketForm.priority,
        category: ticketForm.category
      });
      setTicketForm(initialTicketForm);
      setSelectedTicketId(String(ticketId));
      setRefreshKey((value) => value + 1);
      setMessage(`${copy.createdPrefix} ${ticketId}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleAddMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !selectedTicketId || !messageForm.message) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await createSupportTicketMessage(session.token, {
        ticket_id: Number(selectedTicketId),
        sender_type: "staff",
        sender_id: session.user.id,
        message: messageForm.message
      });
      await updateSupportTicketStatus(session.token, Number(selectedTicketId), messageForm.status);
      setMessageForm(initialMessageForm);
      setRefreshKey((value) => value + 1);
      setMessage(`${copy.updatedPrefix} ${selectedTicketId}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title={copy.title} subtitle={copy.subtitle} />
      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">{copy.newEyebrow}</span>
          <h3>{copy.newTitle}</h3>
          <form className="auth-form" onSubmit={handleCreateTicket}>
            <div className="form-grid">
              <label><span>{copy.fields.customer}</span><select value={ticketForm.customerId} onChange={(event) => setTicketForm((value) => ({ ...value, customerId: event.target.value }))}><option value="">{copy.selectCustomer}</option>{(customers?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label><span>{copy.fields.subject}</span><input value={ticketForm.subject} onChange={(event) => setTicketForm((value) => ({ ...value, subject: event.target.value }))} /></label>
              <label><span>{copy.fields.priority}</span><select value={ticketForm.priority} onChange={(event) => setTicketForm((value) => ({ ...value, priority: event.target.value }))}><option value="low">{copy.priorities.low}</option><option value="normal">{copy.priorities.normal}</option><option value="high">{copy.priorities.high}</option><option value="urgent">{copy.priorities.urgent}</option></select></label>
              <label><span>{copy.fields.category}</span><select value={ticketForm.category} onChange={(event) => setTicketForm((value) => ({ ...value, category: event.target.value }))}><option value="complaint">{copy.categories.complaint}</option><option value="inquiry">{copy.categories.inquiry}</option><option value="refund_request">{copy.categories.refund_request}</option></select></label>
              <label className="form-field-span-2"><span>{copy.fields.description}</span><input value={ticketForm.description} onChange={(event) => setTicketForm((value) => ({ ...value, description: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!ticketForm.customerId || !ticketForm.subject || !ticketForm.description}>{copy.createSubmit}</button>
          </form>
          {message ? <QueryFeedback title={copy.successTitle} message={message} /> : null}
          {errorMessage ? <QueryFeedback title={copy.errorTitle} message={errorMessage} tone="error" /> : null}
        </article>
        <article className="surface-panel">
          <span className="eyebrow">{copy.replyEyebrow}</span>
          <h3>{selectedTicketId ? `${copy.replyTitlePrefix} ${selectedTicketId}` : copy.replyTitleIdle}</h3>
          <form className="auth-form" onSubmit={handleAddMessage}>
            <div className="form-grid">
              <label><span>{copy.fields.status}</span><select value={messageForm.status} onChange={(event) => setMessageForm((value) => ({ ...value, status: event.target.value }))}><option value="open">{copy.statuses.open}</option><option value="in_progress">{copy.statuses.in_progress}</option><option value="resolved">{copy.statuses.resolved}</option><option value="closed">{copy.statuses.closed}</option></select></label>
              <label className="form-field-span-2"><span>{copy.fields.reply}</span><input value={messageForm.message} onChange={(event) => setMessageForm((value) => ({ ...value, message: event.target.value }))} /></label>
            </div>
            <button className="secondary-button compact-pill" type="submit" disabled={!selectedTicketId || !messageForm.message}>{copy.replySubmit}</button>
          </form>
        </article>
      </section>
      <section className="settings-layout">
        <article className="surface-panel">
          {loading ? <QueryFeedback title={copy.loadingTitle} message={copy.loadingMessage} /> : error ? <QueryFeedback title={copy.loadErrorTitle} message={error} tone="error" /> : (
            <div className="table-shell">
              <table>
                <thead><tr><th>{copy.table.id}</th><th>{copy.table.subject}</th><th>{copy.table.customer}</th><th>{copy.table.priority}</th><th>{copy.table.status}</th><th>{copy.table.action}</th></tr></thead>
                <tbody>
                  {(tickets ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.subject}</td>
                      <td>{item.customer_id}</td>
                      <td>{copy.priorities[item.priority as keyof typeof copy.priorities] || item.priority}</td>
                      <td>{copy.statuses[(item.status as keyof typeof copy.statuses) || "open"] || item.status || copy.table.emptyValue}</td>
                      <td><button className="secondary-button compact-pill" type="button" onClick={() => setSelectedTicketId(String(item.id))}>{copy.openAction}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
        <article className="surface-panel">
          <span className="eyebrow">{copy.detailsEyebrow}</span>
          {ticketLoading ? <QueryFeedback title={copy.ticketLoadingTitle} message={copy.ticketLoadingMessage} /> : ticketError ? <QueryFeedback title={copy.ticketErrorTitle} message={ticketError} tone="error" /> : ticketDetails ? (
            <div className="detail-grid">
              <div className="feedback-panel"><strong>{copy.details.subject}</strong><p>{ticketDetails.subject}</p></div>
              <div className="feedback-panel"><strong>{copy.details.description}</strong><p>{ticketDetails.description}</p></div>
              <div className="feedback-panel"><strong>{copy.details.status}</strong><p>{copy.statuses[(ticketDetails.status as keyof typeof copy.statuses) || "open"] || ticketDetails.status || copy.table.emptyValue}</p></div>
              <div className="feedback-panel"><strong>{copy.details.updatedAt}</strong><p>{ticketDetails.updated_at || copy.table.emptyValue}</p></div>
            </div>
          ) : <QueryFeedback title={copy.emptyTitle} message={copy.emptyMessage} />}
        </article>
      </section>
    </div>
  );
}
