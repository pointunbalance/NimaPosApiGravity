import { useState, useMemo } from 'react';
import { Customer, Order, CustomerPayment, B2BInvoice } from '../../types';
import { db } from '../../db';
import { printQueue } from '../../services/PrintQueueService';
import { printStatement } from './customerHelpers';

export const useCustomerProfile = (
  settings: any,
  currencyCode: string,
  formatCurrency: (amount: number) => string
) => {
  const [selectedProfile, setSelectedProfile] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'b2b_invoices' | 'payments' | 'statement' | 'activity'>('overview');
  const [profileOrders, setProfileOrders] = useState<Order[]>([]);
  const [profileB2BInvoices, setProfileB2BInvoices] = useState<B2BInvoice[]>([]);
  const [profilePayments, setProfilePayments] = useState<CustomerPayment[]>([]);
  const [profileLoyalty, setProfileLoyalty] = useState<any[]>([]);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<number>>(new Set());

  const customerInsights = useMemo(() => {
    if (!selectedProfile || !profileOrders.length) {
      return { favoriteItems: [], avgBasket: 0, lastVisit: null, monthlySpending: [] };
    }
    
    const itemCounts = new Map<string, number>();
    let totalValue = 0;
    const monthlyMap = new Map<string, number>();

    profileOrders.forEach(o => {
      totalValue += o.totalAmount;
      o.items.forEach(i => {
        itemCounts.set(i.name, (itemCounts.get(i.name) || 0) + i.quantity);
      });
      const monthKey = new Date(o.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + o.totalAmount);
    });

    const favoriteItems = Array.from(itemCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(i => ({ name: i[0], count: i[1] }));

    const monthlySpending = Array.from(monthlyMap.entries())
      .map(([name, value]) => ({ name, value }))
      .reverse()
      .slice(0, 6)
      .reverse();

    const lastVisit = profileOrders.length > 0 ? profileOrders[0].date : null;

    return {
      favoriteItems,
      avgBasket: totalValue / profileOrders.length,
      lastVisit,
      monthlySpending
    };
  }, [selectedProfile, profileOrders]);

  const handleOpenProfile = async (customer: Customer) => {
    const orders = await db.orders.where('customerId').equals(customer.id!).reverse().toArray();
    const b2bInvoices = await db.b2bInvoices.where('customerId').equals(customer.id!).reverse().toArray();
    const payments = await db.customerPayments.where('customerId').equals(customer.id!).reverse().toArray();
    const loyalties = await db.loyaltyTransactions.where('customerId').equals(customer.id!).reverse().toArray();
    
    setProfileOrders(orders);
    setProfileB2BInvoices(b2bInvoices);
    setProfilePayments(payments);
    setProfileLoyalty(loyalties);
    setSelectedProfile(customer);
    setActiveTab('overview');
    setSelectedInvoiceIds(new Set());
  };

  const toggleInvoiceSelection = (id: number) => {
    const newSet = new Set(selectedInvoiceIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedInvoiceIds(newSet);
  };

  const selectAllInvoices = () => {
    if (selectedInvoiceIds.size === profileOrders.length) {
      setSelectedInvoiceIds(new Set());
    } else {
      setSelectedInvoiceIds(new Set(profileOrders.map(o => o.id!)));
    }
  };

  const handlePrintStatement = (orderIds?: number[]) => {
    if (!selectedProfile) return;
    const ordersToPrint = orderIds 
      ? profileOrders.filter(o => orderIds.includes(o.id!)) 
      : profileOrders;
    if (ordersToPrint.length === 0) return;
    printStatement(selectedProfile, ordersToPrint, settings, currencyCode, formatCurrency);
  };

  const handlePrintSelected = () => {
    if (selectedInvoiceIds.size === 0) return;
    if (selectedInvoiceIds.size === 1) {
      const order = profileOrders.find(o => o.id === Array.from(selectedInvoiceIds)[0]);
      if (order && settings) {
        printQueue.addJob({ type: 'receipt', order, settings: settings as any });
      }
    } else {
      handlePrintStatement(Array.from(selectedInvoiceIds));
    }
  };

  return {
    selectedProfile,
    setSelectedProfile,
    activeTab,
    setActiveTab,
    profileOrders,
    setProfileOrders,
    profileB2BInvoices,
    setProfileB2BInvoices,
    profilePayments,
    setProfilePayments,
    profileLoyalty,
    setProfileLoyalty,
    viewOrder,
    setViewOrder,
    selectedInvoiceIds,
    setSelectedInvoiceIds,
    customerInsights,
    handleOpenProfile,
    toggleInvoiceSelection,
    selectAllInvoices,
    handlePrintSelected,
    handlePrintStatement
  };
};
