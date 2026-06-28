import { FormEvent, useMemo, useState } from "react";

import { createJournalEntry, getAccounts, getJournalEntry, getJournalEntries, postJournalEntry, reverseJournalEntry } from "../app/api/accounting";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const today = new Date().toISOString().slice(0, 10);

type DraftLine = {
  account_id: string;
  debit: string;
  credit: string;
  description: string;
};

const initialLine: DraftLine = { account_id: "", debit: "", credit: "", description: "" };

export function JournalEntriesPage() {
  const { session } = useAuth();
  const { locale, messages } = useI18n();
  const copy = messages.journalEntries;
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [date, setDate] = useState(today);
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [draftLine, setDraftLine] = useState<DraftLine>(initialLine);
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: accounts } = useAsyncValue(session ? () => getAccounts(session.token) : null, [session?.token]);
  const { data: entries, loading, error } = useAsyncValue(session ? () => getJournalEntries(session.token) : null, [session?.token, refreshKey]);
  const { data: details } = useAsyncValue(
    session && selectedId ? () => getJournalEntry(session.token, selectedId) : null,
    [session?.token, selectedId, refreshKey]
  );

  const totals = useMemo(() => {
    const debit = lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
    const credit = lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
    return { debit, credit, balanced: Math.abs(debit - credit) < 0.01 };
  }, [lines]);

  const addLine = () => {
    if (!draftLine.account_id || (!draftLine.debit && !draftLine.credit)) return;
    setLines((value) => [...value, draftLine]);
    setDraftLine(initialLine);
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || lines.length === 0) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createJournalEntry(session.token, {
        date,
        reference,
        description,
        created_by: session.user.username,
        lines: lines.map((line) => {
          const account = accounts?.find((item) => item.id === Number(line.account_id));
          return {
            account_id: Number(line.account_id),
            account_name: account?.name || "",
            debit: Number(line.debit) || 0,
            credit: Number(line.credit) || 0,
            description: line.description
          };
        })
      });
      setSelectedId(created.id);
      setReference("");
      setDescription("");
      setLines([]);
      setRefreshKey((value) => value + 1);
      setMessage(`${copy.createdMessagePrefix} ${created.id}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handlePost = async () => {
    if (!session || !selectedId) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await postJournalEntry(session.token, selectedId);
      setRefreshKey((value) => value + 1);
      setMessage(`${copy.postedMessagePrefix} ${selectedId}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleReverse = async () => {
    if (!session || !selectedId) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const result = await reverseJournalEntry(session.token, selectedId);
      setRefreshKey((value) => value + 1);
      setMessage(`${copy.reversedMessagePrefix} ${result.id}.`);
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
          <form className="auth-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <label><span>{copy.fields.date}</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
              <label><span>{copy.fields.reference}</span><input value={reference} onChange={(event) => setReference(event.target.value)} /></label>
              <label className="form-field-span-2"><span>{copy.fields.description}</span><input value={description} onChange={(event) => setDescription(event.target.value)} /></label>
              <label>
                <span>{copy.fields.account}</span>
                <select value={draftLine.account_id} onChange={(event) => setDraftLine((value) => ({ ...value, account_id: event.target.value }))}>
                  <option value="">{copy.selectAccount}</option>
                  {(accounts ?? []).map((item) => <option key={item.id} value={item.id}>{item.code} - {item.name}</option>)}
                </select>
              </label>
              <label><span>{copy.fields.debit}</span><input inputMode="decimal" value={draftLine.debit} onChange={(event) => setDraftLine((value) => ({ ...value, debit: event.target.value }))} /></label>
              <label><span>{copy.fields.credit}</span><input inputMode="decimal" value={draftLine.credit} onChange={(event) => setDraftLine((value) => ({ ...value, credit: event.target.value }))} /></label>
              <label className="form-field-span-2"><span>{copy.fields.lineDescription}</span><input value={draftLine.description} onChange={(event) => setDraftLine((value) => ({ ...value, description: event.target.value }))} /></label>
            </div>
            <div className="inline-actions">
              <button className="secondary-button compact-pill" type="button" onClick={addLine}>{copy.addLine}</button>
              <button className="primary-button" type="submit" disabled={lines.length === 0 || !totals.balanced}>{copy.createSubmit}</button>
            </div>
          </form>
          <div className="detail-grid">
            <div className="feedback-panel"><strong>{copy.totals.debit}</strong><p>{totals.debit.toLocaleString(numberLocale)} {copy.table.currencySuffix}</p></div>
            <div className="feedback-panel"><strong>{copy.totals.credit}</strong><p>{totals.credit.toLocaleString(numberLocale)} {copy.table.currencySuffix}</p></div>
          </div>
          {!totals.balanced && lines.length > 0 ? <QueryFeedback title={copy.unbalancedTitle} message={copy.unbalancedMessage} tone="error" /> : null}
          {lines.length > 0 ? (
            <div className="table-shell">
              <table>
                <thead><tr><th>{copy.table.account}</th><th>{copy.table.debit}</th><th>{copy.table.credit}</th><th>{copy.table.description}</th></tr></thead>
                <tbody>
                  {lines.map((line, index) => {
                    const account = accounts?.find((item) => item.id === Number(line.account_id));
                    return (
                      <tr key={`${line.account_id}-${index}`}>
                        <td>{account ? `${account.code} - ${account.name}` : line.account_id}</td>
                        <td>{Number(line.debit || 0).toLocaleString(numberLocale)}</td>
                        <td>{Number(line.credit || 0).toLocaleString(numberLocale)}</td>
                        <td>{line.description || copy.table.emptyValue}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">{copy.detailEyebrow}</span>
          <h3>{details ? `${copy.detailTitlePrefix} #${details.id}` : copy.detailTitleIdle}</h3>
          {details ? (
            <>
              <p>{copy.labels.description}: <strong>{details.description}</strong></p>
              <p>{copy.labels.status}: <strong>{details.status}</strong></p>
              <div className="inline-actions">
                <button className="primary-button" type="button" disabled={details.status === "posted"} onClick={handlePost}>{copy.postSubmit}</button>
                <button className="secondary-button compact-pill" type="button" onClick={handleReverse}>{copy.reverseSubmit}</button>
              </div>
              {details.lines?.length ? (
                <div className="table-shell">
                  <table>
                    <thead><tr><th>{copy.table.account}</th><th>{copy.table.debit}</th><th>{copy.table.credit}</th></tr></thead>
                    <tbody>
                      {details.lines.map((line, index) => (
                        <tr key={`${line.account_id}-${index}`}>
                          <td>{line.account_name || line.account_id}</td>
                          <td>{(line.debit ?? 0).toLocaleString(numberLocale)}</td>
                          <td>{(line.credit ?? 0).toLocaleString(numberLocale)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </>
          ) : (
            <QueryFeedback title={copy.emptyDetailTitle} message={copy.emptyDetailMessage} />
          )}
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
              <thead><tr><th>{copy.table.id}</th><th>{copy.table.date}</th><th>{copy.table.reference}</th><th>{copy.table.description}</th><th>{copy.table.status}</th><th>{copy.table.total}</th><th>{copy.table.action}</th></tr></thead>
              <tbody>
                {(entries?.items ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.date}</td>
                    <td>{item.reference || copy.table.emptyValue}</td>
                    <td>{item.description}</td>
                    <td>{item.status}</td>
                    <td>{(item.total_amount ?? 0).toLocaleString(numberLocale)} {copy.table.currencySuffix}</td>
                    <td><button className="secondary-button compact-pill" type="button" onClick={() => setSelectedId(item.id)}>{copy.openAction}</button></td>
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
