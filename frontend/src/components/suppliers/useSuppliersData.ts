import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Supplier } from '../../types';

export const useSuppliersData = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'debt' | 'top'>('all');
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'history' | 'products' | 'statement'>('overview');
  const [selectedForOrder, setSelectedForOrder] = useState<Set<string>>(new Set());
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Queries
  const suppliers = useLiveQuery(async () => await db.suppliers.toArray(), []);
  const allPurchases = useLiveQuery(async () => await db.purchases.toArray(), []);
  const allExpenses = useLiveQuery(async () => await db.expenses.toArray(), []);
  const allLogs = useLiveQuery(async () => await db.logs.toArray(), []);
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const currencyCode = settings?.currencyCode || 'EGP';

  // Statistics & Derived Data
  const supplierStats = useMemo(() => {
    const stats = new Map<number, { totalSpent: number; purchaseCount: number; lastPurchaseDate: Date | null; debt: number }>();
    if (allPurchases) {
      allPurchases.forEach(p => {
        const current = stats.get(p.supplierId) || { totalSpent: 0, purchaseCount: 0, lastPurchaseDate: null, debt: 0 };
        const pDate = new Date(p.date);
        stats.set(p.supplierId, {
          totalSpent: current.totalSpent + p.totalAmount,
          purchaseCount: current.purchaseCount + 1,
          lastPurchaseDate: !current.lastPurchaseDate || pDate > current.lastPurchaseDate ? pDate : current.lastPurchaseDate,
          debt: 0
        });
      });
    }
    return stats;
  }, [allPurchases]);

  const filteredSuppliers = useMemo(() => {
    if (!suppliers) return [];
    
    let result = suppliers.filter(s => {
      const matchesSearch = 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.phone.includes(searchTerm) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()));
      
      let matchesFilter = true;
      if (filterType === 'debt') matchesFilter = (s.balance || 0) > 0;
      if (filterType === 'top') {
        const stat = supplierStats.get(s.id!);
        matchesFilter = (stat?.totalSpent || 0) > 100000;
      }

      return matchesSearch && matchesFilter;
    });

    return result.sort((a, b) => (b.balance || 0) - (a.balance || 0));
  }, [suppliers, searchTerm, filterType, supplierStats]);

  const selectedSupplierData = useMemo(() => {
    if (!selectedSupplier || !allPurchases || !allExpenses || !allLogs) return null;
    
    const purchases = allPurchases.filter(p => p.supplierId === selectedSupplier.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const expenses = allExpenses.filter(e => e.supplierId === selectedSupplier.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const refunds = allLogs.filter(l => l.type === 'refund' && l.referenceId === selectedSupplier.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const statement: { date: Date; type: 'purchase' | 'payment' | 'refund'; amount: number; description: string; id: number }[] = [];
    purchases.forEach(p => statement.push({ date: new Date(p.date), type: 'purchase', amount: p.totalAmount, description: `فاتورة مشتريات #${p.invoiceNumber || p.id}`, id: p.id! }));
    expenses.forEach(e => statement.push({ date: new Date(e.date), type: 'payment', amount: e.amount, description: e.title, id: e.id! }));
    refunds.forEach(r => statement.push({ date: new Date(r.date), type: 'refund', amount: r.amount || 0, description: r.action, id: r.id! }));
    
    statement.sort((a, b) => b.date.getTime() - a.date.getTime());

    const productMap = new Map<string, { name: string; count: number; lastPrice: number }>();
    purchases.forEach(p => {
      p.items.forEach(i => {
        const exist = productMap.get(i.name) || { name: i.name, count: 0, lastPrice: 0 };
        productMap.set(i.name, { 
          name: i.name, 
          count: exist.count + i.quantity, 
          lastPrice: i.costPrice 
        });
      });
    });
    const productsList = Array.from(productMap.values()).sort((a, b) => b.count - a.count);

    const chartDataMap = new Map<string, number>();
    purchases.forEach(p => {
      const key = new Date(p.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      chartDataMap.set(key, (chartDataMap.get(key) || 0) + p.totalAmount);
    });
    
    const chartData = Array.from(chartDataMap.entries())
      .map(([name, value]) => ({ name, value }))
      .reverse()
      .slice(0, 6)
      .reverse();

    return { purchases, expenses, refunds, statement, productsList, chartData };
  }, [selectedSupplier, allPurchases, allExpenses, allLogs]);

  const toggleProductSelection = (name: string) => {
    const newSet = new Set(selectedForOrder);
    if (newSet.has(name)) newSet.delete(name);
    else newSet.add(name);
    setSelectedForOrder(newSet);
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(amount);
  const formatDate = (date: Date) => new Intl.DateTimeFormat('ar-EG', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));

  return {
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    activeDetailTab,
    setActiveDetailTab,
    selectedForOrder,
    setSelectedForOrder,
    selectedSupplier,
    setSelectedSupplier,
    suppliers,
    currencyCode,
    supplierStats,
    filteredSuppliers,
    selectedSupplierData,
    toggleProductSelection,
    formatCurrency,
    formatDate
  };
};
