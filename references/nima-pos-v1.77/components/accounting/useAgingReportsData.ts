import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";

export type AgingBucket = "0-30" | "31-60" | "61-90" | "90+";

export interface AgingRecord {
  id: number;
  name: string;
  phone?: string;
  totalBalance: number;
  buckets: Record<AgingBucket, number>;
  lastTransactionDate?: Date;
  riskLevel: "low" | "medium" | "high" | "critical";
  relatedInvoices?: any[]; // For drill down
}

export const useAgingReportsData = () => {
  const [activeTab, setActiveTab] = useState<"receivable" | "payable">(
    "receivable"
  );
  const [selectedEntity, setSelectedEntity] = useState<AgingRecord | null>(
    null
  );
  const [asOfDate, setAsOfDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [searchTerm, setSearchTerm] = useState("");

  const customers = useLiveQuery(() => db.customers.toArray(), []);
  const suppliers = useLiveQuery(() => db.suppliers.toArray(), []);
  const orders = useLiveQuery(() => db.orders.toArray(), []);
  const purchases = useLiveQuery(() => db.purchases.toArray(), []);
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const currencyCode = settings?.currencyCode || "IQD";

  const calculateDaysDiff = (date: Date, referenceDate: Date) => {
    const diffTime = referenceDate.getTime() - date.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const agingData = useMemo(() => {
    const records: AgingRecord[] = [];
    const refDate = new Date(asOfDate);
    refDate.setHours(23, 59, 59, 999);

    if (activeTab === "receivable" && customers && orders) {
      customers
        .filter((c) => (c.balance || 0) > 0)
        .forEach((c) => {
          const customerOrders = orders.filter(
            (o) =>
              o.customerId === c.id &&
              o.paymentMethod === "credit" &&
              new Date(o.date) <= refDate
          );
          const buckets = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };

          let remainingBalance = customerOrders.reduce(
            (sum, o) => sum + o.totalAmount,
            0
          );

          if (remainingBalance <= 0 && c.balance! > 0) {
            remainingBalance = c.balance || 0;
          }

          const totalBalance = remainingBalance;

          const sortedOrders = [...customerOrders].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          const allocatedInvoices: any[] = [];

          for (const order of sortedOrders) {
            if (remainingBalance <= 0) break;

            const unpaidAmount = order.totalAmount;
            if (unpaidAmount <= 0) continue;

            const amount = Math.min(remainingBalance, unpaidAmount);
            const days = calculateDaysDiff(new Date(order.date), refDate);

            if (days <= 30) buckets["0-30"] += amount;
            else if (days <= 60) buckets["31-60"] += amount;
            else if (days <= 90) buckets["61-90"] += amount;
            else buckets["90+"] += amount;

            allocatedInvoices.push({
              ...order,
              allocatedAmount: amount,
              daysOld: days,
            });
            remainingBalance -= amount;
          }

          if (remainingBalance > 0) {
            buckets["90+"] += remainingBalance;
          }

          let risk: AgingRecord["riskLevel"] = "low";
          if (buckets["90+"] > 0) risk = "critical";
          else if (buckets["61-90"] > 0) risk = "high";
          else if (buckets["31-60"] > 0) risk = "medium";

          if (totalBalance > 0) {
            records.push({
              id: c.id!,
              name: c.name,
              phone: c.phone,
              totalBalance: totalBalance,
              buckets,
              lastTransactionDate:
                sortedOrders.length > 0 ? sortedOrders[0].date : undefined,
              riskLevel: risk,
              relatedInvoices: allocatedInvoices,
            });
          }
        });
    } else if (activeTab === "payable" && suppliers && purchases) {
      suppliers
        .filter((s) => (s.balance || 0) > 0)
        .forEach((s) => {
          const supplierPurchases = purchases.filter(
            (p) =>
              p.supplierId === s.id &&
              p.notes?.includes("آجل") &&
              new Date(p.date) <= refDate
          );
          const buckets = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };

          let remainingBalance = supplierPurchases.reduce(
            (sum, p) => sum + p.totalAmount,
            0
          );

          if (remainingBalance <= 0 && s.balance! > 0) {
            remainingBalance = s.balance || 0;
          }

          const totalBalance = remainingBalance;

          const sortedPurchases = [...supplierPurchases].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          const allocatedInvoices: any[] = [];

          for (const pur of sortedPurchases) {
            if (remainingBalance <= 0) break;

            const unpaidAmount = pur.totalAmount;
            if (unpaidAmount <= 0) continue;

            const amount = Math.min(remainingBalance, unpaidAmount);
            const days = calculateDaysDiff(new Date(pur.date), refDate);

            if (days <= 30) buckets["0-30"] += amount;
            else if (days <= 60) buckets["31-60"] += amount;
            else if (days <= 90) buckets["61-90"] += amount;
            else buckets["90+"] += amount;

            allocatedInvoices.push({
              ...pur,
              allocatedAmount: amount,
              daysOld: days,
            });
            remainingBalance -= amount;
          }

          if (remainingBalance > 0) buckets["90+"] += remainingBalance;

          let risk: AgingRecord["riskLevel"] = "low";
          if (buckets["90+"] > 0) risk = "critical";
          else if (buckets["61-90"] > 0) risk = "high";
          else if (buckets["31-60"] > 0) risk = "medium";

          if (totalBalance > 0) {
            records.push({
              id: s.id!,
              name: s.name,
              phone: s.phone,
              totalBalance: totalBalance,
              buckets,
              lastTransactionDate:
                sortedPurchases.length > 0
                  ? sortedPurchases[0].date
                  : undefined,
              riskLevel: risk,
              relatedInvoices: allocatedInvoices,
            });
          }
        });
    }

    return records
      .filter(
        (r) =>
          r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (r.phone && r.phone.includes(searchTerm))
      )
      .sort((a, b) => b.totalBalance - a.totalBalance);
  }, [
    activeTab,
    customers,
    suppliers,
    orders,
    purchases,
    asOfDate,
    searchTerm,
  ]);

  const totals = useMemo(() => {
    const t = { total: 0, "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
    agingData.forEach((r) => {
      t.total += r.totalBalance;
      t["0-30"] += r.buckets["0-30"];
      t["31-60"] += r.buckets["31-60"];
      t["61-90"] += r.buckets["61-90"];
      t["90+"] += r.buckets["90+"];
    });
    return t;
  }, [agingData]);

  const chartData = useMemo(
    () => [
      { name: "0-30 يوم", value: totals["0-30"], color: "#10b981" },
      { name: "31-60 يوم", value: totals["31-60"], color: "#3b82f6" },
      { name: "61-90 يوم", value: totals["61-90"], color: "#f59e0b" },
      { name: "90+ يوم", value: totals["90+"], color: "#ef4444" },
    ],
    [totals]
  );

  const handleExportCSV = () => {
    if (!agingData.length) return;
    const headers = [
      "Name",
      "Total Balance",
      "0-30 Days",
      "31-60 Days",
      "61-90 Days",
      "90+ Days",
      "Risk Level",
    ];
    const rows = agingData.map((r) => [
      r.name,
      r.totalBalance,
      r.buckets["0-30"],
      r.buckets["31-60"],
      r.buckets["61-90"],
      r.buckets["90+"],
      r.riskLevel,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `aging_report_${asOfDate}.csv`;
    link.click();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-IQ", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return {
    activeTab,
    setActiveTab,
    selectedEntity,
    setSelectedEntity,
    asOfDate,
    setAsOfDate,
    searchTerm,
    setSearchTerm,
    agingData,
    totals,
    chartData,
    currencyCode,
    settings,
    handleExportCSV,
    formatCurrency,
  };
};
