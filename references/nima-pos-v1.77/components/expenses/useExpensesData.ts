import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Expense } from '../../types';

export const getCategoryLabel = (cat: string) => {
  switch (cat) {
    case 'rent': return 'إيجار';
    case 'salary': return 'رواتب';
    case 'utilities': return 'فواتير (كهرباء/ماء)';
    case 'purchase': return 'مشتريات بضاعة';
    case 'marketing': return 'تسويق وإعلانات';
    case 'maintenance': return 'صيانة وإصلاح';
    case 'supplies': return 'مستلزمات مكتبية';
    case 'government': return 'رسوم حكومية';
    case 'transportation': return 'نقل ومواصلات';
    default: return 'نثريات / أخرى';
  }
};

export const useExpensesData = () => {
  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // Start of current month
    end: new Date().toISOString().split('T')[0]
  });

  const settings = useLiveQuery(() => db.settings.toCollection().first(), []);
  const currencyCode = settings?.currencyCode || 'EGP';

  // Query All Expenses
  const allExpenses = useLiveQuery(async () => {
    const all = await db.expenses.toArray();
    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, []);

  // Filter Logic
  const filteredExpenses = useMemo(() => {
    if (!allExpenses) return [];
    
    return allExpenses.filter(e => {
      // Text Search
      const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (e.notes && e.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Category Filter
      const matchesCategory = filterCategory === 'all' || e.category === filterCategory;

      // Date Range Filter
      const expDate = new Date(e.date).setHours(0,0,0,0);
      const startDate = new Date(dateRange.start).setHours(0,0,0,0);
      const endDate = new Date(dateRange.end).setHours(23,59,59,999);
      const matchesDate = expDate >= startDate && expDate <= endDate;

      return matchesSearch && matchesCategory && matchesDate;
    });
  }, [allExpenses, searchTerm, filterCategory, dateRange]);

  // Stats Logic
  const stats = useMemo(() => {
    if (!filteredExpenses) return { total: 0, count: 0, average: 0, cashTotal: 0, cardTotal: 0 };
    
    let total = 0;
    let cashTotal = 0;
    let cardTotal = 0;

    filteredExpenses.forEach(e => {
      total += e.amount;
      if (e.paymentMethod === 'card' || e.paymentMethod === 'bank') cardTotal += e.amount;
      else cashTotal += e.amount; // Default to cash
    });

    const count = filteredExpenses.length;
    const average = count > 0 ? total / count : 0;
    return { total, count, average, cashTotal, cardTotal };
  }, [filteredExpenses]);

  // Chart Data - Category Pie
  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach(e => {
      const cat = getCategoryLabel(e.category);
      map.set(cat, (map.get(cat) || 0) + e.amount);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  // Chart Data - Daily Trend Bar
  const trendData = useMemo(() => {
    const map = new Map<string, number>();
    [...filteredExpenses].reverse().forEach(e => {
      const day = new Date(e.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      map.set(day, (map.get(day) || 0) + e.amount);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredExpenses]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    }).format(new Date(date));
  };

  const getCategoryPercentage = (cat: string) => {
    const catTotal = filteredExpenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
    return stats.total > 0 ? (catTotal / stats.total) * 100 : 0;
  };

  return {
    searchTerm,
    setSearchTerm,
    filterCategory,
    setFilterCategory,
    dateRange,
    setDateRange,
    currencyCode,
    allExpenses,
    filteredExpenses,
    stats,
    chartData,
    trendData,
    formatCurrency,
    formatDate,
    getCategoryPercentage
  };
};
