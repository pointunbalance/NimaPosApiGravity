import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';

export const usePurchasesData = () => {
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<'all' | 'cash' | 'credit'>('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [limit, setLimit] = useState(50);

  const suppliers = useLiveQuery(() => db.suppliers.toArray(), []);
  const products = useLiveQuery(() => db.products.toArray(), []);
  const settings = useLiveQuery(() => db.settings.toCollection().first(), []);
  const currencyCode = settings?.currencyCode || 'EGP';

  // Purchases Query
  const purchases = useLiveQuery(async () => {
    let collection = db.purchases.orderBy('date').reverse();
    
    // Apply date filter
    const start = new Date(dateRange.start); start.setHours(0,0,0,0);
    const end = new Date(dateRange.end); end.setHours(23,59,59,999);
    collection = db.purchases.where('date').between(start, end, true, true).reverse();

    if (filterSupplier !== 'all') {
      collection = collection.filter(p => p.supplierId === Number(filterSupplier));
    }

    if (searchTerm) {
      const allMatches = await collection.toArray();
      const filtered = allMatches.filter(p => 
        p.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return filtered.slice(0, limit);
    }

    return await collection.limit(limit).toArray();
  }, [dateRange, filterSupplier, searchTerm, limit]);

  const totalRecords = useLiveQuery(async () => {
    let collection = db.purchases.orderBy('date').reverse();
    const start = new Date(dateRange.start); start.setHours(0,0,0,0);
    const end = new Date(dateRange.end); end.setHours(23,59,59,999);
    collection = db.purchases.where('date').between(start, end, true, true).reverse();

    if (filterSupplier !== 'all') {
      collection = collection.filter(p => p.supplierId === Number(filterSupplier));
    }

    if (searchTerm) {
      const allMatches = await collection.toArray();
      const filtered = allMatches.filter(p => 
        p.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return filtered.length;
    }
    return await collection.count();
  }, [dateRange, filterSupplier, searchTerm]) || 0;

  const loadMore = () => {
    if (purchases && purchases.length < totalRecords) {
      setLimit(prev => prev + 50);
    }
  };

  const filteredPurchases = purchases || [];

  const stats = useMemo(() => {
    const totalAmount = filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalCount = totalRecords;
    const totalItems = filteredPurchases.reduce((sum, p) => sum + p.items.length, 0);
    return { totalAmount, totalCount, totalItems };
  }, [filteredPurchases, totalRecords]);

  const fiscalYears = useLiveQuery(() => db.fiscalYears.orderBy('endDate').reverse().toArray(), []);

  const isDateClosed = (dateStr: string | Date) => {
    if (!fiscalYears) return false;
    const d = new Date(dateStr).getTime();
    return fiscalYears.some(fy => {
      const start = new Date(fy.startDate).setHours(0,0,0,0);
      const end = new Date(fy.endDate).setHours(23,59,59,999);
      return d >= start && d <= end && fy.status === 'closed';
    });
  };

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

  return {
    searchTerm,
    setSearchTerm,
    filterSupplier,
    setFilterSupplier,
    filterPaymentStatus,
    setFilterPaymentStatus,
    dateRange,
    setDateRange,
    limit,
    setLimit,
    suppliers,
    products,
    purchases,
    totalRecords,
    loadMore,
    filteredPurchases,
    stats,
    isDateClosed,
    formatCurrency,
    formatDate
  };
};
