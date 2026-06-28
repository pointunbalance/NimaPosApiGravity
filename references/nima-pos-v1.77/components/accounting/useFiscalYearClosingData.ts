import { useState, useMemo, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";
import { FiscalYear, Account } from "../../types";

export interface ClosingData {
  revenue: number;
  expenses: number;
  netIncome: number;
  revenueAccounts: { id: number; name: string; balance: number }[];
  expenseAccounts: { id: number; name: string; balance: number }[];
}

export const useFiscalYearClosingData = () => {
  const [activeTab, setActiveTab] = useState<"closing" | "history">("closing");
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Closing Data
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0]
  );
  const [closingDate, setClosingDate] = useState(
    new Date(new Date().getFullYear(), 11, 31).toISOString().split("T")[0]
  );
  const [retainedEarningsId, setRetainedEarningsId] = useState<number | "">("");
  const [description, setDescription] = useState(`إقفال السنة المالية`);
  const [hasBackedUp, setHasBackedUp] = useState(false);

  const [selectedYear, setSelectedYear] = useState<FiscalYear | null>(null);
  const [closingEntryDetails, setClosingEntryDetails] = useState<any | null>(null);
  const [showEntryModal, setShowEntryModal] = useState(false);

  const accounts = useLiveQuery(() => db.accounts.toArray(), []) || [];
  const journals = useLiveQuery(() => db.journalEntries.toArray(), []) || [];
  const fiscalYears =
    useLiveQuery(() => db.fiscalYears.orderBy("endDate").reverse().toArray(), []) || [];
  const settings = useLiveQuery(() => db.settings.toCollection().first());

  // Auto-set start date based on last closed year
  useEffect(() => {
    if (fiscalYears && fiscalYears.length > 0) {
      const lastClosed = fiscalYears[0];
      const nextStart = new Date(lastClosed.endDate);
      nextStart.setDate(nextStart.getDate() + 1);
      setStartDate(nextStart.toISOString().split("T")[0]);

      const nextEnd = new Date(nextStart);
      nextEnd.setFullYear(nextEnd.getFullYear() + 1);
      nextEnd.setDate(nextEnd.getDate() - 1);
      setClosingDate(nextEnd.toISOString().split("T")[0]);
    }
  }, [fiscalYears]);

  useEffect(() => {
    setDescription(`إقفال الفترة من ${startDate} إلى ${closingDate}`);
  }, [startDate, closingDate]);

  // Calculate Income Statement for the period
  const financialSummary = useMemo<ClosingData>(() => {
    if (!accounts || !journals) {
      return {
        revenue: 0,
        expenses: 0,
        netIncome: 0,
        revenueAccounts: [],
        expenseAccounts: [],
      };
    }

    const start = new Date(startDate).setHours(0, 0, 0, 0);
    const end = new Date(closingDate).setHours(23, 59, 59, 999);

    const periodJournals = journals.filter((j) => {
      const d = new Date(j.date).getTime();
      return d >= start && d <= end && j.status === "posted";
    });

    const balances = new Map<number, number>();
    periodJournals.forEach((entry) => {
      entry.lines.forEach((line) => {
        balances.set(
          line.accountId,
          (balances.get(line.accountId) || 0) + (line.debit - line.credit)
        );
      });
    });

    let revenue = 0;
    let expenses = 0;
    const revenueAccounts: { id: number; name: string; balance: number }[] = [];
    const expenseAccounts: { id: number; name: string; balance: number }[] = [];

    accounts.forEach((acc) => {
      const rawBal = balances.get(acc.id!) || 0;
      if (rawBal !== 0) {
        if (acc.type === "revenue") {
          revenue += Math.abs(rawBal);
          revenueAccounts.push({
            id: acc.id!,
            name: acc.name,
            balance: Math.abs(rawBal),
          });
        }
        if (acc.type === "expense") {
          expenses += rawBal;
          expenseAccounts.push({
            id: acc.id!,
            name: acc.name,
            balance: rawBal,
          });
        }
      }
    });

    return {
      revenue,
      expenses,
      netIncome: revenue - expenses,
      revenueAccounts,
      expenseAccounts,
    };
  }, [journals, accounts, startDate, closingDate]);

  // Validation Checks
  const validationIssues = useMemo(() => {
    const issues = [];
    if (!journals) return [];

    const start = new Date(startDate).setHours(0, 0, 0, 0);
    const end = new Date(closingDate).setHours(23, 59, 59, 999);

    const drafts = journals.filter((j) => {
      const d = new Date(j.date).getTime();
      return d >= start && d <= end && j.status === "draft";
    }).length;

    if (drafts > 0) {
      issues.push(`يوجد ${drafts} قيود بانتظار الترحيل (مسودة) في هذه الفترة.`);
    }

    if (new Date(startDate) >= new Date(closingDate)) {
      issues.push("تاريخ بداية الفترة يجب أن يكون قبل تاريخ الإقفال.");
    }

    const overlaps = fiscalYears?.some((y) => {
      const yStart = new Date(y.startDate).getTime();
      const yEnd = new Date(y.endDate).getTime();
      return start <= yEnd && end >= yStart;
    });

    if (overlaps) {
      issues.push(`الفترة المحددة تتداخل مع سنة مالية مغلقة بالفعل.`);
    }

    if (financialSummary.revenueAccounts.length === 0 && financialSummary.expenseAccounts.length === 0) {
      issues.push("لا توجد حركات إيرادات أو مصروفات لإقفالها في هذه الفترة.");
    }

    return issues;
  }, [journals, fiscalYears, startDate, closingDate, financialSummary]);

  // Generate Preview Entry
  const closingEntryPreview = useMemo(() => {
    if (!financialSummary || !retainedEarningsId) return [];
    const lines: any[] = [];

    // Close Revenue
    financialSummary.revenueAccounts.forEach((acc) => {
      lines.push({
        accountName: acc.name,
        debit: acc.balance,
        credit: 0,
        type: "إقفال إيرادات",
      });
    });

    // Close Expenses
    financialSummary.expenseAccounts.forEach((acc) => {
      lines.push({
        accountName: acc.name,
        debit: 0,
        credit: acc.balance,
        type: "إقفال مصروفات",
      });
    });

    // Plug Net Income to Retained Earnings
    const retainedEarningsAcc = accounts?.find((a) => a.id === retainedEarningsId);
    if (retainedEarningsAcc) {
      if (financialSummary.netIncome > 0) {
        lines.push({
          accountName: retainedEarningsAcc.name,
          debit: 0,
          credit: financialSummary.netIncome,
          type: "ترحيل صافي الربح",
          highlight: true,
        });
      } else if (financialSummary.netIncome < 0) {
        lines.push({
          accountName: retainedEarningsAcc.name,
          debit: Math.abs(financialSummary.netIncome),
          credit: 0,
          type: "ترحيل صافي الخسارة",
          highlight: true,
        });
      }
    }

    return lines;
  }, [financialSummary, retainedEarningsId, accounts]);

  return {
    activeTab,
    setActiveTab,
    currentStep,
    setCurrentStep,
    isProcessing,
    setIsProcessing,
    startDate,
    setStartDate,
    closingDate,
    setClosingDate,
    retainedEarningsId,
    setRetainedEarningsId,
    description,
    hasBackedUp,
    setHasBackedUp,
    selectedYear,
    setSelectedYear,
    closingEntryDetails,
    setClosingEntryDetails,
    showEntryModal,
    setShowEntryModal,
    accounts,
    journals,
    fiscalYears,
    settings,
    financialSummary,
    validationIssues,
    closingEntryPreview,
  };
};
