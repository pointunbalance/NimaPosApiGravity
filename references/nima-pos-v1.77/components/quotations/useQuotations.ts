import { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Quotation, Product, OrderItem } from '../../types';
import { logActivity } from '../../utils/logger';
import { AccountingEngine } from '../../services/AccountingEngine';
import { useToast } from '../../context/ToastContext';
import { generateReferenceNumber } from '../../utils/generateReference';

export const useQuotations = () => {
  const { success, error: showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'converted' | 'expired'>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  
  // Editor State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formCustomerId, setFormCustomerId] = useState<number | ''>('');
  const [formItems, setFormItems] = useState<OrderItem[]>([]);
  const [formNotes, setFormNotes] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formExpiryDate, setFormExpiryDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  
  // Financials
  const [formDiscount, setFormDiscount] = useState<number>(0);
  const [formTaxRate, setFormTaxRate] = useState<number>(0);

  // Item Addition State
  const [productSearch, setProductSearch] = useState('');
  
  const quotations = useLiveQuery(() => db.quotations.toArray(), []);
  const products = useLiveQuery(() => db.products.toArray(), []);
  const customers = useLiveQuery(() => db.customers.toArray(), []);
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  
  const currencyCode = settings?.currencyCode || 'IQD';

  const termsTemplates = [
    { label: 'قياسي', text: 'صلاحية العرض 7 أيام. الدفع نقداً عند التسليم. الأسعار تشمل التوصيل.' },
    { label: 'مشروع', text: 'دفعة مقدمة 50%. صلاحية العرض 30 يوماً. التوريد خلال 14 يوم عمل.' },
    { label: 'دولي', text: 'الأسعار لا تشمل الشحن والجمارك. الدفع تحويل بنكي مسبق.' }
  ];

  const filteredQuotations = useMemo(() => {
    if (!quotations) return [];
    const today = new Date().toISOString().split('T')[0];

    return quotations.filter(q => {
      const matchesSearch = q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || q.id?.toString().includes(searchTerm);
      
      let matchesStatus = true;
      if (activeStatusFilter === 'expired') {
        matchesStatus = q.status === 'pending' && q.expiryDate ? q.expiryDate.toISOString().split('T')[0] < today : false;
      } else if (activeStatusFilter !== 'all') {
        matchesStatus = q.status === activeStatusFilter;
      }

      let matchesDate = true;
      if (dateRange !== 'all') {
        const qDate = new Date(q.date);
        const now = new Date();
        if (dateRange === 'today') {
          matchesDate = qDate.toDateString() === now.toDateString();
        } else if (dateRange === 'week') {
          const weekAgo = new Date(now.setDate(now.getDate() - 7));
          matchesDate = qDate >= weekAgo;
        } else if (dateRange === 'month') {
          const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
          matchesDate = qDate >= monthAgo;
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    }).sort((a,b) => b.date.getTime() - a.date.getTime());
  }, [quotations, searchTerm, activeStatusFilter, dateRange]);

  const stats = useMemo(() => {
    if (!quotations) return { total: 0, pendingValue: 0, conversionRate: 0 };
    const total = quotations.length;
    const converted = quotations.filter(q => q.status === 'converted').length;
    const pendingValue = quotations.filter(q => q.status === 'pending').reduce((sum, q) => sum + q.totalAmount, 0);
    
    return {
      total,
      pendingValue,
      conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0
    };
  }, [quotations]);

  const formTotals = useMemo(() => {
    const subtotal = formItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const taxAmount = (subtotal - formDiscount) * (formTaxRate / 100);
    const total = Math.max(0, subtotal - formDiscount + taxAmount);
    
    let totalCost = 0;
    formItems.forEach(item => {
      const product = products?.find(p => p.id === item.productId);
      const cost = product?.costPrice || 0;
      totalCost += cost * item.quantity;
    });
    const profit = (subtotal - formDiscount) - totalCost;
    const margin = (subtotal - formDiscount) > 0 ? (profit / (subtotal - formDiscount)) * 100 : 0;

    return { subtotal, taxAmount, total, totalCost, profit, margin };
  }, [formItems, formDiscount, formTaxRate, products]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return [];
    return products?.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.barcode === productSearch).slice(0, 5);
  }, [products, productSearch]);

  const addProductToForm = (product: Product) => {
    const newItem: OrderItem = {
      productId: product.id!,
      name: product.name,
      price: product.price,
      quantity: 1,
      total: product.price
    };
    
    setFormItems(prev => {
      const exists = prev.find(i => i.productId === product.id);
      if (exists) {
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, newItem];
    });
    setProductSearch('');
  };

  const addCustomItemToForm = () => {
    const newItem: OrderItem = {
      productId: Date.now(),
      name: 'صنف مخصص',
      price: 0,
      quantity: 1,
      total: 0
    };
    setFormItems(prev => [...prev, newItem]);
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    setFormItems(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const removeItem = (index: number) => {
    setFormItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveQuotation = async () => {
    if (!formCustomerName || formItems.length === 0) {
      showError('الرجاء إدخال اسم العميل وإضافة منتجات أو بنود للعرض');
      return;
    }

    const generatedRef = await generateReferenceNumber('quotations', 'QT');
    const quoteData: Quotation = {
      referenceNumber: editingId ? (quotations?.find(q => q.id === editingId)?.referenceNumber || generatedRef) : generatedRef,
      date: new Date(formDate),
      expiryDate: new Date(formExpiryDate),
      customerName: formCustomerName,
      customerId: formCustomerId ? Number(formCustomerId) : undefined,
      items: formItems.map(i => ({...i, total: i.price * i.quantity})),
      subtotalAmount: formTotals.subtotal,
      totalAmount: formTotals.total,
      discountAmount: formDiscount,
      taxAmount: formTotals.taxAmount,
      status: editingId ? (quotations?.find(q => q.id === editingId)?.status || 'pending') : 'pending',
      notes: formNotes,
      createdBy: 'Admin'
    };

    try {
      if (editingId) {
        await db.quotations.put({ ...quoteData, id: editingId });
        success('تم تحديث عرض السعر بنجاح');
      } else {
        await db.quotations.add(quoteData);
        success('تم إضافة عرض السعر بنجاح');
      }
      closeModal();
    } catch (e) {
      console.error(e);
      showError('حدث خطأ أثناء حفظ عرض السعر');
    }
  };

  const handleDuplicate = (quote: Quotation) => {
    setEditingId(null);
    setFormCustomerName(quote.customerName);
    setFormCustomerId(quote.customerId || '');
    setFormItems(quote.items.map(i => ({...i})));
    setFormNotes(quote.notes || '');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormExpiryDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setFormDiscount(quote.discountAmount || 0);
    setFormTaxRate(0);
    setIsModalOpen(true);
    success('تم نسخ عرض السعر وتكراره بنجاح');
  };

  const sendWhatsApp = (quote: Quotation) => {
    let text = `مرحباً ${quote.customerName}،\nإليك تفاصيل عرض السعر رقم #${quote.id}:\n`;
    quote.items.forEach(i => {
      text += `- ${i.name} (x${i.quantity}): ${formatCurrency(i.price * i.quantity)}\n`;
    });
    text += `\nالإجمالي: ${formatCurrency(quote.totalAmount)}\n\nصالح حتى: ${new Date(quote.expiryDate!).toLocaleDateString()}`;
    
    let phone = '';
    if(quote.customerId) {
      const c = customers?.find(cust => cust.id === quote.customerId);
      if(c) phone = c.phone;
    }
    
    const url = `https://wa.me/${phone ? phone.replace(/[^0-9]/g, '') : ''}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const updateStatus = async (id: number, status: Quotation['status']) => {
    await db.quotations.update(id, { status });
    success('تم تحديث حالة عرض السعر');
  };

  const openModal = (quote?: Quotation) => {
    if (quote) {
      setEditingId(quote.id!);
      setFormCustomerName(quote.customerName);
      setFormCustomerId(quote.customerId || '');
      setFormItems(quote.items);
      setFormNotes(quote.notes || '');
      setFormDate(new Date(quote.date).toISOString().split('T')[0]);
      setFormExpiryDate(quote.expiryDate ? new Date(quote.expiryDate).toISOString().split('T')[0] : '');
      setFormDiscount(quote.discountAmount || 0);
      setFormTaxRate(0);
    } else {
      setEditingId(null);
      setFormCustomerName('');
      setFormCustomerId('');
      setFormItems([]);
      setFormNotes('');
      setFormDate(new Date().toISOString().split('T')[0]);
      setFormExpiryDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setFormDiscount(0);
      setFormTaxRate(settings?.taxRate || 0);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-IQ', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleExportCSV = () => {
    const headers = ['رقم العرض', 'العميل', 'التاريخ', 'تاريخ الانتهاء', 'الإجمالي', 'الحالة'];
    const csvData = filteredQuotations.map(quote => [
      `#${quote.id}`,
      quote.customerName,
      new Date(quote.date).toLocaleDateString('ar-SA'),
      quote.expiryDate ? new Date(quote.expiryDate).toLocaleDateString('ar-SA') : '',
      quote.totalAmount,
      quote.status
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `quotations_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('تم تصدير عروض الأسعار بنجاح');
  };

  return {
    isModalOpen,
    setIsModalOpen,
    searchTerm,
    setSearchTerm,
    activeStatusFilter,
    setActiveStatusFilter,
    dateRange,
    setDateRange,
    editingId,
    formCustomerName,
    setFormCustomerName,
    formCustomerId,
    setFormCustomerId,
    formItems,
    setFormItems,
    formNotes,
    setFormNotes,
    formDate,
    setFormDate,
    formExpiryDate,
    setFormExpiryDate,
    formDiscount,
    setFormDiscount,
    formTaxRate,
    setFormTaxRate,
    productSearch,
    setProductSearch,
    filteredQuotations,
    stats,
    formTotals,
    filteredProducts,
    customers,
    settings,
    termsTemplates,
    addProductToForm,
    addCustomItemToForm,
    updateItem,
    removeItem,
    handleSaveQuotation,
    handleDuplicate,
    sendWhatsApp,
    updateStatus,
    openModal,
    closeModal,
    formatCurrency,
    handleExportCSV
  };
};
