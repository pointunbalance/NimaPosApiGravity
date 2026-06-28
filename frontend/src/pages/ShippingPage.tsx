import { useMemo, useState } from "react";

import { getBranchTransfers } from "../app/api/branchTransfers";
import { getFleetVehicles } from "../app/api/fleet";
import { useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

export function ShippingPage() {
  const { session } = useAuth();
  const { locale, messages } = useI18n();
  const copy = messages.shipping;
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");

  const numericWarehouseId = selectedWarehouseId ? Number(selectedWarehouseId) : undefined;
  const { data: transfers, loading, error } = useAsyncValue(
    session ? () => getBranchTransfers(session.token, numericWarehouseId) : null,
    [session?.token, numericWarehouseId]
  );
  const { data: vehicles } = useAsyncValue(session ? () => getFleetVehicles(session.token) : null, [session?.token]);

  const shippingStats = useMemo(() => {
    const allTransfers = transfers ?? [];
    const pending = allTransfers.filter((item) => item.status === "pending").length;
    const sent = allTransfers.filter((item) => item.status === "sent").length;
    const completed = allTransfers.filter((item) => item.status === "completed").length;
    const inTransitVehicles = (vehicles ?? []).filter((item) => item.status === "in_transit").length;
    return { pending, sent, completed, inTransitVehicles };
  }, [transfers, vehicles]);

  return (
    <div className="page-stack">
      <PageHeader title={copy.title} subtitle={copy.subtitle} />

      <section className="surface-panel">
        <div className="form-grid">
          <label>
            <span>{copy.warehouseFilter}</span>
            <input inputMode="numeric" value={selectedWarehouseId} onChange={(event) => setSelectedWarehouseId(event.target.value)} placeholder={copy.warehousePlaceholder} />
          </label>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">{copy.cards.pending}</span><strong>{shippingStats.pending.toLocaleString(numberLocale)}</strong><p>{copy.cards.pendingNote}</p></article>
        <article className="stat-card"><span className="eyebrow">{copy.cards.sent}</span><strong>{shippingStats.sent.toLocaleString(numberLocale)}</strong><p>{copy.cards.sentNote}</p></article>
        <article className="stat-card"><span className="eyebrow">{copy.cards.completed}</span><strong>{shippingStats.completed.toLocaleString(numberLocale)}</strong><p>{copy.cards.completedNote}</p></article>
        <article className="stat-card"><span className="eyebrow">{copy.cards.inTransitVehicles}</span><strong>{shippingStats.inTransitVehicles.toLocaleString(numberLocale)}</strong><p>{copy.cards.inTransitVehiclesNote}</p></article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">{copy.transfersEyebrow}</span>
          {loading ? (
            <QueryFeedback title={copy.loadingTitle} message={copy.loadingMessage} />
          ) : error ? (
            <QueryFeedback title={copy.loadErrorTitle} message={error} tone="error" />
          ) : (
            <div className="table-shell">
              <table>
                <thead><tr><th>{copy.transfersTable.id}</th><th>{copy.transfersTable.reference}</th><th>{copy.transfersTable.from}</th><th>{copy.transfersTable.to}</th><th>{copy.transfersTable.status}</th><th>{copy.transfersTable.requester}</th><th>{copy.transfersTable.total}</th></tr></thead>
                <tbody>
                  {(transfers ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.reference || copy.transfersTable.emptyValue}</td>
                      <td>{item.from_warehouse_id}</td>
                      <td>{item.to_warehouse_id}</td>
                      <td>{item.status}</td>
                      <td>{item.requested_by}</td>
                      <td>{(item.total_qty ?? 0).toLocaleString(numberLocale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">{copy.fleetEyebrow}</span>
          <div className="table-shell">
            <table>
              <thead><tr><th>{copy.fleetTable.id}</th><th>{copy.fleetTable.plate}</th><th>{copy.fleetTable.model}</th><th>{copy.fleetTable.status}</th><th>{copy.fleetTable.payload}</th></tr></thead>
              <tbody>
                {(vehicles ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.plate_number}</td>
                    <td>{item.model}</td>
                    <td>{item.status || copy.fleetTable.emptyValue}</td>
                    <td>{(item.payload_capacity_kg ?? 0).toLocaleString(numberLocale)} {copy.fleetTable.payloadSuffix}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}
