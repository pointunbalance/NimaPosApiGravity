import { getDashboardKpis } from "../app/api/dashboard";
import { useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";
import { StatCard } from "../components/StatCard";

export function ReportsPage() {
  const { session } = useAuth();
  const { locale, messages } = useI18n();
  const copy = messages.reports;
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";
  const { data, loading, error } = useAsyncValue(session ? () => getDashboardKpis(session.token) : null, [session?.token]);

  return (
    <div className="page-stack">
      <PageHeader title={copy.title} subtitle={copy.subtitle} />

      {loading ? (
        <QueryFeedback title={copy.loadingTitle} message={copy.loadingMessage} />
      ) : error || !data ? (
        <QueryFeedback title={copy.errorTitle} message={error ?? copy.emptyError} tone="error" />
      ) : (
        <>
          <section className="stats-grid">
            <StatCard label={copy.cards.netSales} value={data.today_net.toLocaleString(numberLocale)} note={copy.notes.netSales} />
            <StatCard
              label={copy.cards.avgInvoice}
              value={(data.today_invoices > 0 ? data.today_sales / data.today_invoices : 0).toLocaleString(numberLocale, { maximumFractionDigits: 2 })}
              note={`${data.today_invoices} ${copy.notes.invoicesToday}`}
            />
            <StatCard label={copy.cards.topChannel} value={data.payment_split[0]?.payment_method || copy.unavailable} note={copy.notes.topChannel} />
          </section>

          <section className="report-panels">
            <article className="surface-panel">
              <span className="eyebrow">{copy.trendEyebrow}</span>
              <h3>{copy.trendTitle}</h3>
              <p>{data.today_profit.toLocaleString(numberLocale)} / {data.low_stock_count} / {data.pending_orders}</p>
            </article>
            <article className="surface-panel accent-panel">
              <span className="eyebrow">{copy.expansionEyebrow}</span>
              <h3>{copy.expansionTitle}</h3>
              <p>{copy.expansionBody}</p>
            </article>
          </section>
        </>
      )}
    </div>
  );
}
