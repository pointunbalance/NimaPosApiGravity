import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';
import { Expense } from '../../../types';
import {
  getCategoryLabel,
  exportExpensesToCSV,
  formatExpenseCurrency,
  formatExpenseDate,
  calculateExpenseStats,
  calculateExpenseChartData,
  calculateExpenseTrendData,
  deleteExpenseFromDb,
  approveExpenseInDb,
  rejectExpenseInDb,
  quickAddExpenseInDb,
} from './expenseUtils';

const getCurrentUser = () => {
  const currentUserData = localStorage.getItem('nima_user');
  return currentUserData ? JSON.parse(currentUserData) : { id: 1 };
};

export const useSchoolExpenses = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [duplicateExpense, setDuplicateExpense] = useState<Expense | null>(null);

  // Deletion confirm states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // Start of current month
    end: new Date().toISOString().split('T')[0],
  });

  const settings = useLiveQuery(() => db.settings.toCollection().first(), []);
  const currencyCode = settings?.currencyCode || 'EGP';

  // Query All Expenses
  const allExpenses = useLiveQuery(async () => {
    const all = await db.schoolExpenses.toArray();
    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, []);

  // Filter Logic
  const filteredExpenses = useMemo(() => {
    if (!allExpenses) return [];

    return allExpenses.filter((e) => {
      // Text Search
      const matchesSearch =
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.notes && e.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      // Category Filter
      const matchesCategory = filterCategory === 'all' || e.category === filterCategory;

      // Date Range Filter
      const expDate = new Date(e.date).setHours(0, 0, 0, 0);
      const startDate = new Date(dateRange.start).setHours(0, 0, 0, 0);
      const endDate = new Date(dateRange.end).setHours(23, 59, 59, 999);
      const matchesDate = expDate >= startDate && expDate <= endDate;

      return matchesSearch && matchesCategory && matchesDate;
    });
  }, [allExpenses, searchTerm, filterCategory, dateRange]);

  // Stats Logic
  const stats = useMemo(() => calculateExpenseStats(filteredExpenses), [filteredExpenses]);

  // Chart Data - Category Pie
  const chartData = useMemo(() => calculateExpenseChartData(filteredExpenses), [filteredExpenses]);

  // Chart Data - Daily Trend Bar
  const trendData = useMemo(() => calculateExpenseTrendData(filteredExpenses), [filteredExpenses]);

  // --- Handlers ---

  const deleteExpense = (id: number) => {
    setDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteExpense = async () => {
    if (!deleteId) return;
    try {
      await deleteExpenseFromDb(deleteId);
    } catch (err) {
      console.error(err);
    }
    setDeleteId(null);
    setIsDeleteConfirmOpen(false);
  };

  const handleApprove = async (expense: Expense) => {
    const user = getCurrentUser();
    try {
      await approveExpenseInDb(expense, user.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (expense: Expense) => {
    const user = getCurrentUser();
    try {
      await rejectExpenseInDb(expense, user.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicate = (expense: Expense) => {
    setExpenseToEdit(null);
    setDuplicateExpense(expense);
    setIsModalOpen(true);
  };

  // Quick Add Templates
  const handleQuickAdd = async (template: { title: string; category: string; amount: number }) => {
    try {
      await quickAddExpenseInDb(template);
    } catch (e) {
      console.error(e);
    }
  };

  const openModal = (expense?: Expense) => {
    if (expense) {
      setExpenseToEdit(expense);
      setDuplicateExpense(null);
    } else {
      setExpenseToEdit(null);
      setDuplicateExpense(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setExpenseToEdit(null); setDuplicateExpense(null); };

  const handleExportCSV = () => exportExpensesToCSV(filteredExpenses, dateRange);

  const formatCurrency = (amount: number) => formatExpenseCurrency(amount, currencyCode);

  const formatDate = (date: Date | string) => formatExpenseDate(date);

  const getCategoryPercentage = (cat: string) => {
    const catTotal = filteredExpenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0);
    return stats.total > 0 ? (catTotal / stats.total) * 100 : 0;
  };

  return {
    isModalOpen,
    viewImage,
    setViewImage,
    expenseToEdit,
    duplicateExpense,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    searchTerm,
    setSearchTerm,
    filterCategory,
    setFilterCategory,
    dateRange,
    setDateRange,
    filteredExpenses,
    stats,
    chartData,
    trendData,
    deleteExpense,
    confirmDeleteExpense,
    handleApprove,
    handleReject,
    handleDuplicate,
    handleQuickAdd,
    openModal,
    closeModal,
    handleExportCSV,
    formatCurrency,
    formatDate,
    getCategoryLabel,
    getCategoryPercentage,
  };
};
export default useSchoolExpenses;
