import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";
import { TreasuryTransaction, TreasuryAccount } from "../../types";

export const useTreasuryData = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterAccount, setFilterAccount] = useState<string>("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TreasuryTransaction | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [transactionToDeleteId, setTransactionToDeleteId] = useState<number | null>(null);

  const [formData, setFormData] = useState<Partial<TreasuryTransaction>>({
    type: "inflow",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    description: "",
    category: "operational",
    sourceAccount: "bank",
    paymentMethod: "bank_transfer",
    status: "completed",
  });

  const [accountFormData, setAccountFormData] = useState<Partial<TreasuryAccount>>({
    name: "",
    type: "safe",
  });

  const transactions =
    useLiveQuery(() => db.treasuryTransactions.orderBy("date").reverse().toArray(), []) || [];

  const treasuryAccounts = useLiveQuery(() => db.treasuryAccounts.toArray(), []) || [];

  // Calculate balances
  const calculateBalance = (accountId: number | string) => {
    return transactions.reduce((balance, t) => {
      if (t.status !== "completed") return balance;

      if (t.type === "inflow" && (t.sourceAccountId === accountId || t.sourceAccount === accountId)) {
        return balance + t.amount;
      }
      if (t.type === "outflow" && (t.sourceAccountId === accountId || t.sourceAccount === accountId)) {
        return balance - t.amount;
      }
      if (t.type === "transfer") {
        if (t.destinationAccountId === accountId || t.destinationAccount === accountId) return balance + t.amount;
        if (t.sourceAccountId === accountId || t.sourceAccount === accountId) return balance - t.amount;
      }
      return balance;
    }, 0);
  };

  const totalBalance = treasuryAccounts.reduce((sum, acc) => sum + calculateBalance(acc.id || acc.type), 0);

  const totalInflow = transactions
    .filter((t) => t.type === "inflow" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalOutflow = transactions
    .filter((t) => t.type === "outflow" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.referenceNumber && t.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === "all" || t.type === filterType;
    let matchesAccount = filterAccount === "all";
    if (!matchesAccount) {
      matchesAccount =
        String(t.sourceAccountId) === filterAccount ||
        t.sourceAccount === filterAccount ||
        String(t.destinationAccountId) === filterAccount ||
        t.destinationAccount === filterAccount;
    }
    return matchesSearch && matchesType && matchesAccount;
  });

  const handleOpenModal = (transaction?: TreasuryTransaction) => {
    if (transaction) {
      setEditingTransaction(transaction);
      setFormData(transaction);
    } else {
      setEditingTransaction(null);
      setFormData({
        type: "inflow",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        description: "",
        category: "operational",
        sourceAccountId: treasuryAccounts.length > 0 ? treasuryAccounts[0].id : undefined,
        paymentMethod: "bank_transfer",
        status: "completed",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  return {
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filterAccount,
    setFilterAccount,
    isModalOpen,
    setIsModalOpen,
    isAccountModalOpen,
    setIsAccountModalOpen,
    editingTransaction,
    setEditingTransaction,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    transactionToDeleteId,
    setTransactionToDeleteId,
    formData,
    setFormData,
    accountFormData,
    setAccountFormData,
    transactions,
    treasuryAccounts,
    calculateBalance,
    totalBalance,
    totalInflow,
    totalOutflow,
    filteredTransactions,
    handleOpenModal,
    handleCloseModal,
  };
};
