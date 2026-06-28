import { useMemo, useState } from "react";

import { getAccounts, getGeneralLedger } from "../app/api/accounting";
import { useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const today = new Date().toISOString().slice(0, 10);
const monthStart = `${today.slice(0, 8)}01`;

export function GeneralLedgerPage() {
  const { session } = useAuth();
  const { locale, messages } = useI18n();
  const copy = messages.generalLedger;
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";
  const [accountId, setAccountId] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);

  const { data: accounts } = useAsyncValue(session ? () => getAccounts(session.token) : null, [session?.token]);
  const { data, loading, error } = useAsyncValue(
    session && accountId ? () => getGeneralLedger(session.token, accountId, dateFrom, dateTo) : null,
    [session?.token, accountId, dateFrom, dateTo]
  );

  const totals = useMemo(() => {
    const entries = data?.entries ?? [];
    return {
      debit: entries.reduce((sum, item) => sum + (item.debit ?? 0), 0),
      credit: entries.reduce((sum, item) => sum + (item.credit ?? 0), 0)
    };
  }, [data?.entries]);

  return (
    <div className="page-stack">
      <PageHeader title={copy.title} subtitle={copy.subtitle} />

      <section className="surface-panel">
        <div className="form-grid">
          <label>
            <span>{copy.fields.account}</span>
            <select value={accountId ?? ""} onChange={(event) => setAccountId(event.target.value ? Number(event.target.value) : null)}>
              <option value="">{copy.selectAccount}</option>
              {(accounts ?? []).map((item) => <option key={item.id} value={item.id}>{item.code} - {item.name}</option>)}
            </select>
          </label>
          <label><span>{copy.fields.from}</span><input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label>
          <label><span>{copy.fields.to}</span><input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label>
        </div>
      </section>

      {!accountId ? (
        <QueryFeedback title={copy.emptyTitle} message={copy.emptyMessage} />
      ) : loading ? (
        <QueryFeedback title={copy.loadingTitle} message={copy.loadingMessage} />
      ) : error ? (
        <QueryFeedback title={copy.loadErrorTitle} message={error} tone="error" />
      ) : data ? (
        <>
          <section className="stats-grid">
            <article className="stat-card"><span className="eyebrow">{copy.cards.account}</span><strong>{data.account.code}</strong><p>{data.account.name}</p></article>
            <article className="stat-card"><span className="eyebrow">{copy.cards.totalDebit}</span><strong>{totals.debit.toLocaleString(numberLocale)} {copy.table.currencySuffix}</strong><p>{copy.cards.totalDebitNote}</p></article>
            <article className="stat-card"><span className="eyebrow">{copy.cards.totalCredit}</span><strong>{totals.credit.toLocaleString(numberLocale)} {copy.table.currencySuffix}</strong><p>{copy.cards.totalCreditNote}</p></article>
          </section>

          <section className="surface-panel">
            <div className="table-shell">
              <table>
                <thead><tr><th>{copy.table.date}</th><th>{copy.table.reference}</th><th>{copy.table.description}</th><th>{copy.table.debit}</th><th>{copy.table.credit}</th><th>{copy.table.balance}</th></tr></thead>
                <tbody>
                  {(data.entries ?? []).map((item, index) => (
                    <tr key={`${item.id ?? "line"}-${index}`}>
                      <td>{item.date || copy.table.emptyValue}</td>
                      <td>{item.reference || copy.table.emptyValue}</td>
                      <td>{item.description || copy.table.emptyValue}</td>
                      <td>{(item.debit ?? 0).toLocaleString(numberLocale)}</td>
                      <td>{(item.credit ?? 0).toLocaleString(numberLocale)}</td>
                      <td>{(item.balance ?? 0).toLocaleString(numberLocale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
