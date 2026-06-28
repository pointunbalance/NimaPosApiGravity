import { useMemo, useState } from "react";

import { getUserActivity, getUsers } from "../app/api/users";
import { useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

export function EmployeesPage() {
  const { session } = useAuth();
  const { locale, messages } = useI18n();
  const copy = messages.employees;
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const { data, loading, error } = useAsyncValue(session ? () => getUsers(session.token) : null, [session?.token]);
  const { data: activity, loading: activityLoading, error: activityError } = useAsyncValue(
    session && selectedUserId ? () => getUserActivity(session.token, selectedUserId) : null,
    [session?.token, selectedUserId]
  );

  const selectedUser = useMemo(
    () => data?.items.find((item) => item.id === selectedUserId) ?? null,
    [data?.items, selectedUserId]
  );

  const stats = useMemo(() => {
    const items = data?.items ?? [];
    return {
      total: items.length,
      active: items.filter((item) => Number(item.is_active ?? 1)).length,
      managers: items.filter((item) => item.role === "manager" || item.role === "owner" || item.role === "admin").length
    };
  }, [data?.items]);

  return (
    <div className="page-stack">
      <PageHeader title={copy.title} subtitle={copy.subtitle} />

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">{copy.cards.total}</span><strong>{stats.total.toLocaleString(numberLocale)}</strong><p>{copy.cards.totalNote}</p></article>
        <article className="stat-card"><span className="eyebrow">{copy.cards.active}</span><strong>{stats.active.toLocaleString(numberLocale)}</strong><p>{copy.cards.activeNote}</p></article>
        <article className="stat-card"><span className="eyebrow">{copy.cards.leadership}</span><strong>{stats.managers.toLocaleString(numberLocale)}</strong><p>{copy.cards.leadershipNote}</p></article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          {loading ? (
            <QueryFeedback title={copy.loadingTitle} message={copy.loadingMessage} />
          ) : error ? (
            <QueryFeedback title={copy.loadErrorTitle} message={error} tone="error" />
          ) : (
            <div className="table-shell">
              <table>
                <thead><tr><th>{copy.table.id}</th><th>{copy.table.username}</th><th>{copy.table.fullName}</th><th>{copy.table.role}</th><th>{copy.table.phone}</th><th>{copy.table.status}</th><th>{copy.table.action}</th></tr></thead>
                <tbody>
                  {(data?.items ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.username}</td>
                      <td>{item.full_name || copy.table.emptyValue}</td>
                      <td>{item.role}</td>
                      <td>{item.phone || copy.table.emptyValue}</td>
                      <td>{Number(item.is_active ?? 1) ? copy.active : copy.inactive}</td>
                      <td><button className="secondary-button compact-pill" type="button" onClick={() => setSelectedUserId(item.id)}>{copy.showActivity}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">{copy.activityEyebrow}</span>
          <h3>{selectedUser ? selectedUser.full_name || selectedUser.username : copy.activityTitleIdle}</h3>
          {activityLoading ? (
            <QueryFeedback title={copy.activityLoadingTitle} message={copy.activityLoadingMessage} />
          ) : activityError ? (
            <QueryFeedback title={copy.activityErrorTitle} message={activityError} tone="error" />
          ) : (
            <div className="table-shell">
              <table>
                <thead><tr><th>{copy.activityTable.type}</th><th>{copy.activityTable.action}</th><th>{copy.activityTable.details}</th><th>{copy.activityTable.createdAt}</th></tr></thead>
                <tbody>
                  {(activity?.items ?? []).map((item, index) => (
                    <tr key={`activity-${index}`}>
                      <td>{item.type || copy.activityTable.emptyValue}</td>
                      <td>{item.action || copy.activityTable.emptyValue}</td>
                      <td>{item.details || copy.activityTable.emptyValue}</td>
                      <td>{item.created_at || copy.activityTable.emptyValue}</td>
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
