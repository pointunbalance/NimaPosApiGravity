import { TrendingUp } from "lucide-react";

import { getHealth } from "../app/api/auth";
import { getDashboardKpis } from "../app/api/dashboard";
import { useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";
import { StatCard } from "../components/StatCard";

export function DashboardPage() {
  const { session } = useAuth();
  const { locale, messages } = useI18n();
  const copy = messages.dashboard;
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";
  const { data: kpis, loading, error } = useAsyncValue(
    session ? () => getDashboardKpis(session.token) : null,
    [session?.token]
  );
  const { data: health } = useAsyncValue(() => getHealth(), []);

  if (loading) {
    return (
      <div className="page-stack">
        <PageHeader title={copy.title} subtitle={copy.subtitle} />
        <QueryFeedback title={copy.loadingTitle} message={copy.loadingMessage} />
      </div>
    );
  }

  if (error || !kpis) {
    return (
      <div className="page-stack">
        <PageHeader title={copy.title} subtitle={copy.errorSubtitle} />
        <QueryFeedback title={copy.errorTitle} message={error ?? copy.emptyError} tone="error" />
      </div>
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        title={copy.title}
        subtitle={copy.subtitle}
        actions={
          <button className="primary-button" type="button">
            {copy.expandPlan}
          </button>
        }
      />

      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">{copy.heroEyebrow}</span>
          <h2>{copy.heroTitle}</h2>
          <p>{copy.heroBody}</p>
        </div>
        <div className="hero-metric">
          <TrendingUp size={28} />
          <strong>{kpis.today_net.toLocaleString(numberLocale)}</strong>
          <span>
            {copy.netToday} {health?.status ?? copy.unknownStatus}.
          </span>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard
          label={copy.cards.salesToday}
          value={kpis.today_sales.toLocaleString(numberLocale)}
          note={`${kpis.today_invoices} ${copy.notes.invoicesToday}`}
        />
        <StatCard
          label={copy.cards.profitability}
          value={kpis.today_profit.toLocaleString(numberLocale)}
          note={`${copy.notes.expenses} ${kpis.today_expenses.toLocaleString(numberLocale)}`}
        />
        <StatCard
          label={copy.cards.alerts}
          value={String(kpis.low_stock_count)}
          note={`${kpis.pending_orders} ${copy.notes.pendingAndHeld} ${kpis.held_orders_count}`}
        />
      </section>

      <section className="insight-grid">
        {copy.highlights.map((item) => (
          <article className="insight-card" key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>
        ))}
      </section>

      <section className="report-panels">
        <article className="surface-panel">
          <span className="eyebrow">{copy.topProductsEyebrow}</span>
          <h3>{copy.topProductsTitle}</h3>
          <ul className="mini-list">
            {kpis.top_products_today.length > 0 ? (
              kpis.top_products_today.map((item) => (
                <li key={item.name}>
                  <strong>{item.name}</strong>
                  <span>{item.total_qty}</span>
                </li>
              ))
            ) : (
              <li>
                <strong>{copy.noSalesTitle}</strong>
                <span>{copy.noSalesMessage}</span>
              </li>
            )}
          </ul>
        </article>

        <article className="surface-panel accent-panel">
          <span className="eyebrow">{copy.paymentSplitEyebrow}</span>
          <h3>{copy.paymentSplitTitle}</h3>
          <ul className="mini-list">
            {kpis.payment_split.length > 0 ? (
              kpis.payment_split.map((item) => (
                <li key={item.payment_method}>
                  <strong>{item.payment_method}</strong>
                  <span>{item.total.toLocaleString(numberLocale)}</span>
                </li>
              ))
            ) : (
              <li>
                <strong>{copy.noPaymentsTitle}</strong>
                <span>{copy.noPaymentsMessage}</span>
              </li>
            )}
          </ul>
        </article>
      </section>
    </div>
  );
}
