import { useState, useMemo, useDeferredValue } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Customer, Order, CustomerPayment, B2BInvoice } from '../../types';
import { User, UserMinus, UserCheck, Star, Crown } from 'lucide-react';

export const useCustomersData = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [filterType, setFilterType] = useState<'all' | 'debt' | 'vip' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'debt_desc' | 'spent_desc' | 'name_asc' | 'newest'>('debt_desc');

  // Loader
  const customers = useLiveQuery(() => db.customers.toArray(), []);
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const currencyCode = settings?.currencyCode || 'IQD';

  const lastVisitMap = useLiveQuery(async () => {
    const map = new Map<number, Date>();
    if (!customers) return map;
    
    await Promise.all(customers.map(async (c) => {
      if (c.id) {
        const lastOrder = await db.orders.where('customerId').equals(c.id).reverse().first();
        if (lastOrder) {
          map.set(c.id, new Date(lastOrder.date));
        }
      }
    }));
    
    return map;
  }, [customers]) || new Map<number, Date>();

  const getCustomerStatus = (customer: Customer) => {
    const lastVisit = lastVisitMap.get(customer.id!);
    const daysSinceVisit = lastVisit ? Math.floor((new Date().getTime() - lastVisit.getTime()) / (1000 * 3600 * 24)) : 999;

    if ((customer.totalSpent || 0) > 1000000) return { label: 'VIP ماسي', color: 'bg-indigo-100 text-indigo-700', icon: Crown };
    if ((customer.totalSpent || 0) > 500000) return { label: 'ذهبي', color: 'bg-amber-100 text-amber-700', icon: Star };
    if (daysSinceVisit > 60 && customer.totalSpent > 0) return { label: 'منقطع', color: 'bg-red-100 text-red-700', icon: UserMinus };
    if (!lastVisit) return { label: 'جديد', color: 'bg-emerald-100 text-emerald-700', icon: UserCheck };
    
    return { label: 'نشط', color: 'bg-slate-100 text-slate-600', icon: User };
  };

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    let filtered = customers.filter(c => {
      const matchesSearch = 
        c.name.toLowerCase().includes(deferredSearchTerm.toLowerCase()) || 
        c.phone.includes(deferredSearchTerm) ||
        (c.code ? c.code.toLowerCase().includes(deferredSearchTerm.toLowerCase()) : false) ||
        (c.tags && c.tags.some(t => t.toLowerCase().includes(deferredSearchTerm.toLowerCase())));
      
      let matchesFilter = true;
      if (filterType === 'debt') matchesFilter = (c.balance || 0) > 0;
      if (filterType === 'vip') matchesFilter = (c.totalSpent || 0) > 500000;
      if (filterType === 'inactive') {
        const last = lastVisitMap.get(c.id!);
        const days = last ? Math.floor((new Date().getTime() - last.getTime()) / (1000 * 3600 * 24)) : 999;
        matchesFilter = days > 60 && (c.totalSpent || 0) > 0;
      }

      return matchesSearch && matchesFilter;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'debt_desc') return (b.balance || 0) - (a.balance || 0);
      if (sortBy === 'spent_desc') return (b.totalSpent || 0) - (a.totalSpent || 0);
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name, 'ar');
      if (sortBy === 'newest') return (b.id || 0) - (a.id || 0);
      return 0;
    });
  }, [customers, deferredSearchTerm, filterType, sortBy, lastVisitMap]);

  const stats = useMemo(() => {
    if (!customers) return { totalDebt: 0, totalCustomers: 0, vipCount: 0 };
    return {
      totalDebt: customers.reduce((sum, c) => sum + (c.balance || 0), 0),
      totalCustomers: customers.length,
      vipCount: customers.filter(c => (c.totalSpent || 0) > 500000).length
    };
  }, [customers]);

  return {
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    sortBy,
    setSortBy,
    customers,
    settings,
    currencyCode,
    getCustomerStatus,
    filteredCustomers,
    stats,
  };
};
