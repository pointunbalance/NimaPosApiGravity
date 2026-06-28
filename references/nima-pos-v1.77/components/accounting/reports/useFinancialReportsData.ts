import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../db";
import { useNavigate } from "react-router-dom";

export const useFinancialReportsData = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"trial" | "income" | "balance" | "cashflow">("trial");
  const [costCenterId, setCostCenterId] = useState<number | "all">("all");

  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const journals = useLiveQuery(() => db.journalEntries.toArray(), []);
  const costCenters = useLiveQuery(() => db.costCenters.toArray(), []) || [];
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const currencyCode = settings?.currencyCode || "IQD";

  // --- Advanced Core Calculations ---
  const reportData = useMemo(() => {
    if (!accounts || !journals) return null;
    const startDate = new Date(dateRange.start).setHours(0, 0, 0, 0);
    const endDate = new Date(dateRange.end).setHours(23, 59, 59, 999);
    const accountMap = new Map();

    accounts.forEach((acc) => {
      const isDebitNormal = ["asset", "expense"].includes(acc.type);
      accountMap.set(acc.id, {
        ...acc,
        openingBalance: 0,
        periodDebit: 0,
        periodCredit: 0,
        closingBalance: 0,
        isDebitNormal,
      });
    });

    journals.forEach((entry) => {
      const entryDate = new Date(entry.date).getTime();
      const isBefore = entryDate < startDate;
      const isWithin = entryDate >= startDate && entryDate <= endDate;
      if (!isBefore && !isWithin) return;

      entry.lines.forEach((line) => {
        if (costCenterId !== "all" && line.costCenterId !== costCenterId) return;
        const accData = accountMap.get(line.accountId);
        if (!accData) return;
        if (isBefore) {
          accData.openingBalance += accData.isDebitNormal ? (line.debit - line.credit) : (line.credit - line.debit);
        } else if (isWithin) {
          accData.periodDebit += line.debit || 0;
          accData.periodCredit += line.credit || 0;
        }
      });
    });

    const result: any[] = [];
    accountMap.forEach((acc) => {
      acc.closingBalance = acc.isDebitNormal
        ? (acc.openingBalance + acc.periodDebit - acc.periodCredit)
        : (acc.openingBalance + acc.periodCredit - acc.periodDebit);

      if (acc.openingBalance !== 0 || acc.periodDebit !== 0 || acc.periodCredit !== 0) {
        result.push(acc);
      }
    });
    return result;
  }, [accounts, journals, dateRange, costCenterId]);

  // --- Derived Datasets ---
  const incomeStatementData = useMemo(() => {
    if (!reportData) {
      return {
        revenues: [],
        expenses: [],
        netProfit: 0,
        totalRevenue: 0,
        totalExpenses: 0,
      };
    }

    const revenues = reportData.filter((d) => d.type === "revenue");
    const expenses = reportData.filter((d) => d.type === "expense");

    const totalRevenue = revenues.reduce((sum, r) => sum + (r.periodCredit - r.periodDebit), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.periodDebit - e.periodCredit), 0);
    const netProfit = totalRevenue - totalExpenses;

    return { revenues, expenses, totalRevenue, totalExpenses, netProfit };
  }, [reportData]);

  const balanceSheetData = useMemo(() => {
    if (!reportData) {
      return {
        assets: [],
        liabilities: [],
        equity: [],
        totalAssets: 0,
        totalLiabilities: 0,
        totalEquity: 0,
      };
    }

    const assets = reportData.filter((d) => d.type === "asset");
    const liabilities = reportData.filter((d) => d.type === "liability");
    const equity = reportData.filter((d) => d.type === "equity");

    const totalAssets = assets.reduce((sum, a) => sum + a.closingBalance, 0);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + l.closingBalance, 0);

    const totalEquityBase = equity.reduce((sum, e) => sum + e.closingBalance, 0);
    const totalEquity = totalEquityBase + (incomeStatementData?.netProfit || 0);

    return {
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
    };
  }, [reportData, incomeStatementData]);

  const cashFlowData = useMemo(() => {
    if (!reportData) {
      return {
        operating: [],
        investing: [],
        financing: [],
        netOperating: 0,
        netInvesting: 0,
        netFinancing: 0,
        netChange: 0,
        beginningBalance: 0,
        endingBalance: 0,
      };
    }

    const cashAccounts = reportData.filter(
      (a) =>
        a.type === "asset" &&
        (a.name.includes("نقد") ||
          a.name.includes("بنك") ||
          a.name.includes("صندوق") ||
          a.code.startsWith("11"))
    );

    const beginningBalance = cashAccounts.reduce((sum, a) => sum + a.openingBalance, 0);
    const endingBalance = cashAccounts.reduce((sum, a) => sum + a.closingBalance, 0);
    const netChange = endingBalance - beginningBalance;

    const operating = [
      { name: "صافي الدخل", amount: incomeStatementData.netProfit },
      ...reportData
        .filter((a) => a.type === "asset" && !cashAccounts.includes(a) && a.code.startsWith("12"))
        .map((a) => ({
          name: `التغير في ${a.name}`,
          amount: -(a.periodDebit - a.periodCredit),
        })),
      ...reportData
        .filter((a) => a.type === "liability" && a.code.startsWith("21"))
        .map((a) => ({
          name: `التغير في ${a.name}`,
          amount: a.periodCredit - a.periodDebit,
        })),
    ].filter((item) => item.amount !== 0);

    const investing = reportData
      .filter((a) => a.type === "asset" && a.code.startsWith("13"))
      .map((a) => ({
        name: `التغير في ${a.name}`,
        amount: -(a.periodDebit - a.periodCredit),
      }))
      .filter((item) => item.amount !== 0);

    const financing = [
      ...reportData
        .filter((a) => a.type === "liability" && a.code.startsWith("22"))
        .map((a) => ({
          name: `التغير في ${a.name}`,
          amount: a.periodCredit - a.periodDebit,
        })),
      ...reportData
        .filter((a) => a.type === "equity")
        .map((a) => ({
          name: `التغير في ${a.name}`,
          amount: a.periodCredit - a.periodDebit,
        })),
    ].filter((item) => item.amount !== 0);

    const netOperating = operating.reduce((sum, item) => sum + item.amount, 0);
    const netInvesting = investing.reduce((sum, item) => sum + item.amount, 0);
    const netFinancing = financing.reduce((sum, item) => sum + item.amount, 0);

    return {
      operating,
      investing,
      financing,
      netOperating,
      netInvesting,
      netFinancing,
      netChange,
      beginningBalance,
      endingBalance,
    };
  }, [reportData, incomeStatementData]);

  const expenseChartData = useMemo(() => {
    return incomeStatementData.expenses
      .sort((a, b) => b.periodDebit - b.periodCredit - (a.periodDebit - a.periodCredit))
      .slice(0, 5)
      .map((e) => ({ name: e.name, value: e.periodDebit - e.periodCredit }));
  }, [incomeStatementData]);

  const goToLedger = (accountId: number) => {
    navigate("/accounting/general-ledger", { state: { accountId } });
  };

  const handleExportCSV = () => {
    if (!reportData) return;

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";

    if (activeTab === "trial") {
      csvContent += "Code,Account Name,Opening Balance,Debit,Credit,Closing Balance\n";
      reportData.forEach((row) => {
        csvContent += `${row.code},${row.name},${row.openingBalance},${row.periodDebit},${row.periodCredit},${row.closingBalance}\n`;
      });
    } else if (activeTab === "income") {
      csvContent += "Type,Account,Amount\n";
      incomeStatementData.revenues.forEach((r) => {
        csvContent += `Revenue,${r.name},${r.periodCredit - r.periodDebit}\n`;
      });
      incomeStatementData.expenses.forEach((e) => {
        csvContent += `Expense,${e.name},${e.periodDebit - e.periodCredit}\n`;
      });
      csvContent += `,,Net Profit: ${incomeStatementData.netProfit}\n`;
    } else if (activeTab === "balance") {
      csvContent += "Type,Account,Closing Balance\n";
      balanceSheetData.assets.forEach((a) => {
        csvContent += `Asset,${a.name},${a.closingBalance}\n`;
      });
      balanceSheetData.liabilities.forEach((l) => {
        csvContent += `Liability,${l.name},${l.closingBalance}\n`;
      });
      balanceSheetData.equity.forEach((eq) => {
        csvContent += `Equity,${eq.name},${eq.closingBalance}\n`;
      });
    } else if (activeTab === "cashflow") {
      csvContent += "Section,Source,Amount\n";
      cashFlowData.operating.forEach((o) => {
        csvContent += `Operating,${o.name},${o.amount}\n`;
      });
      cashFlowData.investing.forEach((i) => {
        csvContent += `Investing,${i.name},${i.amount}\n`;
      });
      cashFlowData.financing.forEach((f) => {
        csvContent += `Financing,${f.name},${f.amount}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `financial_report_${activeTab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    activeTab,
    setActiveTab,
    costCenterId,
    setCostCenterId,
    dateRange,
    setDateRange,
    costCenters,
    currencyCode,
    reportData,
    incomeStatementData,
    balanceSheetData,
    cashFlowData,
    expenseChartData,
    goToLedger,
    handleExportCSV,
  };
};
