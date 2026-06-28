import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";

export const useBankReconciliationData = () => {
  // State
  const [selectedAccountId, setSelectedAccountId] = useState<number | "">("");
  const [statementDate, setStatementDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [statementBalance, setStatementBalance] = useState<number | "">("");
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<number>>(
    new Set()
  );
  const [showHistory, setShowHistory] = useState(false);
  const [txSearchTerm, setTxSearchTerm] = useState("");

  // Adjustment Modal State
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);
  const [adjType, setAdjType] = useState<"fee" | "interest">("fee");
  const [adjAmount, setAdjAmount] = useState<number | "">("");
  const [adjDate, setAdjDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [adjExpenseAccId, setAdjExpenseAccId] = useState<number | "">("");

  // View Details Modal State
  const [viewingRecId, setViewingRecId] = useState<number | null>(null);

  // Load Data
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const journals = useLiveQuery(() => db.journalEntries.toArray(), []);
  const previousReconciliations = useLiveQuery(
    () => db.bankReconciliations.toArray(),
    []
  );
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const fiscalYears = useLiveQuery(() => db.fiscalYears.toArray(), []);

  // Filter Accounts
  const bankAccounts = useMemo(
    () => accounts?.filter((a) => a.type === "asset") || [],
    [accounts]
  );
  const expenseAccounts = useMemo(
    () => accounts?.filter((a) => a.type === "expense") || [],
    [accounts]
  );
  const revenueAccounts = useMemo(
    () => accounts?.filter((a) => a.type === "revenue") || [],
    [accounts]
  );

  // --- Core Logic ---

  // 1. Get reconciled IDs
  const reconciledIds = useMemo(() => {
    const set = new Set<number>();
    previousReconciliations?.forEach((rec) => {
      rec.reconciledEntryIds.forEach((id) => set.add(id));
    });
    return set;
  }, [previousReconciliations]);

  // 2. Get Unreconciled Transactions
  const unreconciledTransactions = useMemo(() => {
    if (!selectedAccountId || !journals) return [];

    const txns: any[] = [];
    journals.forEach((entry) => {
      if (reconciledIds.has(entry.id!)) return;

      const lines = entry.lines.filter(
        (l) => l.accountId === Number(selectedAccountId)
      );

      if (lines.length > 0) {
        const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
        const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);
        const netAmount = totalDebit - totalCredit;

        txns.push({
          id: entry.id!,
          date: entry.date,
          desc: entry.description,
          ref: entry.reference,
          amount: netAmount,
          debit: totalDebit,
          credit: totalCredit,
        });
      }
    });

    return txns.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [journals, selectedAccountId, reconciledIds]);

  // 3. Filtered Transactions (Search)
  const displayedTransactions = useMemo(() => {
    return unreconciledTransactions.filter(
      (tx) =>
        tx.desc.toLowerCase().includes(txSearchTerm.toLowerCase()) ||
        tx.ref?.toLowerCase().includes(txSearchTerm.toLowerCase()) ||
        tx.amount.toString().includes(txSearchTerm)
    );
  }, [unreconciledTransactions, txSearchTerm]);

  // 4. Last Reconciliation Info (Opening Balance)
  const lastReconciliation = useMemo(() => {
    if (!previousReconciliations || !selectedAccountId) return null;
    const accountRecs = previousReconciliations.filter(
      (r) => r.accountId === Number(selectedAccountId)
    );
    if (accountRecs.length === 0) return null;
    return accountRecs.sort(
      (a, b) =>
        new Date(b.statementDate).getTime() -
        new Date(a.statementDate).getTime()
    )[0];
  }, [previousReconciliations, selectedAccountId]);

  const openingBalance = lastReconciliation
    ? lastReconciliation.statementBalance
    : 0;

  // 5. Calculation Engine
  const calculation = useMemo(() => {
    let clearedDeposits = 0;
    let clearedPayments = 0;

    unreconciledTransactions.forEach((tx) => {
      if (selectedEntryIds.has(tx.id)) {
        if (tx.amount > 0) clearedDeposits += tx.amount;
        else clearedPayments += Math.abs(tx.amount);
      }
    });

    const clearedBalance = openingBalance + clearedDeposits - clearedPayments;
    const difference = (Number(statementBalance) || 0) - clearedBalance;

    return {
      clearedDeposits,
      clearedPayments,
      clearedBalance,
      difference,
      isBalanced: Math.abs(difference) < 0.01,
    };
  }, [
    unreconciledTransactions,
    selectedEntryIds,
    openingBalance,
    statementBalance,
  ]);

  // 6. View Details Logic
  const viewingRec = useMemo(
    () => previousReconciliations?.find((r) => r.id === viewingRecId),
    [previousReconciliations, viewingRecId]
  );

  const viewingRecTransactions = useMemo(() => {
    if (!viewingRec || !journals) return [];
    const txns: any[] = [];
    journals.forEach((entry) => {
      if (viewingRec.reconciledEntryIds.includes(entry.id!)) {
        const lines = entry.lines.filter(
          (l) => l.accountId === viewingRec.accountId
        );
        if (lines.length > 0) {
          const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
          const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);
          txns.push({
            id: entry.id!,
            date: entry.date,
            desc: entry.description,
            ref: entry.reference,
            debit: totalDebit,
            credit: totalCredit,
          });
        }
      }
    });
    return txns.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [viewingRec, journals]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);

  return {
    selectedAccountId,
    setSelectedAccountId,
    statementDate,
    setStatementDate,
    statementBalance,
    setStatementBalance,
    selectedEntryIds,
    setSelectedEntryIds,
    showHistory,
    setShowHistory,
    txSearchTerm,
    setTxSearchTerm,
    isAdjModalOpen,
    setIsAdjModalOpen,
    adjType,
    setAdjType,
    adjAmount,
    setAdjAmount,
    adjDate,
    setAdjDate,
    adjExpenseAccId,
    setAdjExpenseAccId,
    viewingRecId,
    setViewingRecId,
    accounts,
    journals,
    previousReconciliations,
    settings,
    fiscalYears,
    bankAccounts,
    expenseAccounts,
    revenueAccounts,
    unreconciledTransactions,
    displayedTransactions,
    openingBalance,
    calculation,
    viewingRec,
    viewingRecTransactions,
    formatCurrency,
  };
};
