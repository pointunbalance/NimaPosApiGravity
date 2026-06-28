import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";
import { generateReferenceNumber } from "../../utils/generateReference";
import { TaxReturn } from "../../types";

export interface TaxData {
  taxableOrders: any[];
  totalSalesNet: number;
  totalOutputTax: number;
  totalSalesGross: number;

  taxablePurchases: any[];
  totalPurchasesNet: number;
  totalInputTax: number;
  totalPurchasesGross: number;

  netTaxPayable: number;
}

export const useTaxReportData = () => {
  const [activeTab, setActiveTab] = useState<
    "summary" | "sales" | "purchases" | "history"
  >("summary");
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  // Modal confirmations state
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [isNoAccountsConfirmOpen, setIsNoAccountsConfirmOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null);

  const orders = useLiveQuery(() => db.orders.toArray(), []);
  const purchases = useLiveQuery(() => db.purchases.toArray(), []);
  const taxReturns = useLiveQuery(
    () => db.taxReturns.orderBy("periodStart").reverse().toArray(),
    []
  );
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const currencyCode = settings?.currencyCode || "IQD";

  const taxData = useMemo<TaxData | null>(() => {
    if (!orders || !purchases) return null;

    const startDate = new Date(dateRange.start).setHours(0, 0, 0, 0);
    const endDate = new Date(dateRange.end).setHours(23, 59, 59, 999);

    const taxableOrders = orders.filter((o) => {
      const d = new Date(o.date).getTime();
      return d >= startDate && d <= endDate && (o.taxAmount || 0) !== 0;
    });

    const qRound = (val: number) => Math.round(val * 100) / 100;

    const totalSalesNet = qRound(
      taxableOrders.reduce((sum, o) => sum + (o.subtotalAmount || 0), 0)
    );
    const totalOutputTax = qRound(
      taxableOrders.reduce((sum, o) => sum + (o.taxAmount || 0), 0)
    );
    const totalSalesGross = qRound(totalSalesNet + totalOutputTax);

    const taxablePurchases = purchases.filter((p) => {
      const d = new Date(p.date).getTime();
      return d >= startDate && d <= endDate && (p.taxAmount || 0) > 0;
    });

    const totalPurchasesNet = qRound(
      taxablePurchases.reduce((sum, p) => sum + (p.subtotal || 0), 0)
    );
    const totalInputTax = qRound(
      taxablePurchases.reduce((sum, p) => sum + (p.taxAmount || 0), 0)
    );
    const totalPurchasesGross = qRound(totalPurchasesNet + totalInputTax);

    const netTaxPayable = qRound(totalOutputTax - totalInputTax);

    return {
      taxableOrders,
      totalSalesNet,
      totalOutputTax,
      totalSalesGross,

      taxablePurchases,
      totalPurchasesNet,
      totalInputTax,
      totalPurchasesGross,

      netTaxPayable,
    };
  }, [orders, purchases, dateRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-IQ", {
      style: "decimal",
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleExport = () => {
    if (!taxData) return;

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";

    csvContent += "Tax Summary Report\n";
    csvContent += `Period,${dateRange.start} to ${dateRange.end}\n\n`;

    csvContent += "Type,Net Amount,Tax Amount,Total Amount\n";
    csvContent += `Sales (Output),${taxData.totalSalesNet},${taxData.totalOutputTax},${taxData.totalSalesGross}\n`;
    csvContent += `Purchases (Input),${taxData.totalPurchasesNet},${taxData.totalInputTax},${taxData.totalPurchasesGross}\n`;
    csvContent += `NET PAYABLE,,${taxData.netTaxPayable},\n\n`;

    csvContent += "Sales Details (Output Tax)\n";
    csvContent += "Invoice ID,Date,Net Amount,Tax,Total\n";
    taxData.taxableOrders.forEach((o) => {
      csvContent += `#${o.id},${new Date(o.date).toLocaleDateString()},${o.subtotalAmount},${o.taxAmount},${o.totalAmount}\n`;
    });

    csvContent += "\nPurchases Details (Input Tax)\n";
    csvContent += "Invoice No,Date,Supplier,Net Amount,Tax,Total\n";
    taxData.taxablePurchases.forEach((p) => {
      csvContent += `${p.invoiceNumber || p.id},${new Date(p.date).toLocaleDateString()},${p.supplierName},${p.subtotal},${p.taxAmount},${p.totalAmount}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tax_return_${dateRange.start}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const setQuickFilter = (filter: string) => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    let start = new Date();
    let end = new Date();

    if (filter === "thisMonth") { start = new Date(y, m, 1); end = new Date(y, m + 1, 0); }
    else if (filter === "lastMonth") { start = new Date(y, m - 1, 1); end = new Date(y, m, 0); }
    else if (filter === "q1") { start = new Date(y, 0, 1); end = new Date(y, 3, 0); }
    else if (filter === "q2") { start = new Date(y, 3, 1); end = new Date(y, 6, 0); }
    else if (filter === "q3") { start = new Date(y, 6, 1); end = new Date(y, 9, 0); }
    else if (filter === "q4") { start = new Date(y, 9, 1); end = new Date(y, 12, 0); }
    else if (filter === "thisYear") { start = new Date(y, 0, 1); end = new Date(y, 11, 31); }

    setDateRange({
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    });
  };

  const handleSaveTaxReturn = async (ignoreAccountsCheck: boolean = false) => {
    if (!taxData) return;

    // Check if tax return exists
    const existingReturn = taxReturns?.find(
      (r) => r.periodStart === dateRange.start && r.periodEnd === dateRange.end
    );

    if (existingReturn && !ignoreAccountsCheck) {
      // Open save confirm modal
      setIsSaveConfirmOpen(true);
      return;
    }

    // Account check
    const accounts = await db.accounts.toArray();
    const outputVatAccount = accounts.find(
      (a) => a.name.includes("مخرجات") && a.name.includes("ضريبة")
    );
    const inputVatAccount = accounts.find(
      (a) => a.name.includes("مدخلات") && a.name.includes("ضريبة")
    );
    const payableVatAccount = accounts.find(
      (a) =>
        a.name.includes("مستحقة") &&
        (a.name.includes("ضريبة") || a.name.includes("VAT"))
    );

    if ((!outputVatAccount || !inputVatAccount || !payableVatAccount) && !ignoreAccountsCheck) {
      setIsNoAccountsConfirmOpen(true);
      return;
    }

    try {
      if (outputVatAccount && inputVatAccount && payableVatAccount) {
        const lines = [];

        if (taxData.totalOutputTax > 0) {
          lines.push({
            accountId: outputVatAccount.id!,
            debit: taxData.totalOutputTax,
            credit: 0,
            description: `إقفال ضريبة المخرجات للفترة ${dateRange.start} إلى ${dateRange.end}`,
          });
        }

        if (taxData.totalInputTax > 0) {
          lines.push({
            accountId: inputVatAccount.id!,
            debit: 0,
            credit: taxData.totalInputTax,
            description: `إقفال ضريبة المدخلات للفترة ${dateRange.start} إلى ${dateRange.end}`,
          });
        }

        if (taxData.netTaxPayable > 0) {
          lines.push({
            accountId: payableVatAccount.id!,
            debit: 0,
            credit: taxData.netTaxPayable,
            description: `إثبات الضريبة المستحقة الدفع`,
          });
        } else if (taxData.netTaxPayable < 0) {
          lines.push({
            accountId: payableVatAccount.id!,
            debit: Math.abs(taxData.netTaxPayable),
            credit: 0,
            description: `إثبات الضريبة المستردة`,
          });
        }

        const AccountingEngine = (await import("../../services/AccountingEngine"))
          .AccountingEngine;
        await AccountingEngine.postEntry({
          date: new Date(),
          description: `إقفال وإثبات الإقرار الضريبي للفترة ${dateRange.start} إلى ${dateRange.end}`,
          reference: await generateReferenceNumber("journalEntries", "VAT-JRN"),
          lines: lines,
        });
      }

      const ref = await generateReferenceNumber("taxReturns", "VAT");
      const newReturn: TaxReturn = {
        periodStart: dateRange.start,
        periodEnd: dateRange.end,
        filingDate: new Date().toISOString(),
        totalSalesNet: taxData.totalSalesNet,
        totalOutputTax: taxData.totalOutputTax,
        totalPurchasesNet: taxData.totalPurchasesNet,
        totalInputTax: taxData.totalInputTax,
        netTaxPayable: taxData.netTaxPayable,
        status: "filed",
        referenceNumber: ref,
      };

      await db.taxReturns.add(newReturn);
      await db.auditLogs.add({
        userId: "1",
        userName: "مدير النظام (رومان)", // Ukrainian Christian name placeholder
        action: "create",
        module: "taxes",
        details: `إصدار وحفظ إقرار الضريبة للفترة ${dateRange.start} إلى ${dateRange.end} بصافي ${taxData.netTaxPayable}`,
        timestamp: new Date().toISOString(),
      });

      setSaveStatus({ success: true, message: "تم حفظ الإقرار الضريبي بنجاح" });
      setActiveTab("history");
    } catch (error) {
      console.error("Error saving tax return:", error);
      setSaveStatus({ success: false, message: "حدث خطأ أثناء حفظ الإقرار" });
    }
  };

  return {
    activeTab,
    setActiveTab,
    dateRange,
    setDateRange,
    taxData,
    settings,
    currencyCode,
    taxReturns,
    formatCurrency,
    handleExport,
    setQuickFilter,
    handleSaveTaxReturn,
    isSaveConfirmOpen,
    setIsSaveConfirmOpen,
    isNoAccountsConfirmOpen,
    setIsNoAccountsConfirmOpen,
    saveStatus,
    setSaveStatus,
  };
};
