import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";
import { PettyCash } from "../../types";

export const usePettyCashData = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFund, setSelectedFund] = useState<PettyCash | null>(null);

  // New Expense State
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseAccountId, setExpenseAccountId] = useState("");

  const pettyCashFunds = useLiveQuery(() => db.pettyCash.reverse().toArray(), []) || [];
  const accounts = useLiveQuery(() => db.accounts.toArray(), []) || [];
  const settings = useLiveQuery(() => db.settings.toCollection().first());

  const filteredFunds = useMemo(() => {
    return pettyCashFunds.filter(
      (fund) =>
        fund.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fund.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pettyCashFunds, searchTerm]);

  const calculateRemaining = (fund: PettyCash) => {
    const totalExpenses = fund.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    return fund.amount - totalExpenses;
  };

  return {
    searchTerm,
    setSearchTerm,
    isModalOpen,
    setIsModalOpen,
    selectedFund,
    setSelectedFund,
    expenseAmount,
    setExpenseAmount,
    expenseDescription,
    setExpenseDescription,
    expenseAccountId,
    setExpenseAccountId,
    pettyCashFunds,
    accounts,
    settings,
    filteredFunds,
    calculateRemaining,
  };
};
