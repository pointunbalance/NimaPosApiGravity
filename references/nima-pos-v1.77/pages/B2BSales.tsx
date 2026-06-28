import { AccountingEngine } from '../services/AccountingEngine';
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { B2BInvoice, Customer, Quotation } from '../types';
import B2BSalesHeader from '../components/b2b-sales/B2BSalesHeader';
import B2BSalesStats from '../components/b2b-sales/B2BSalesStats';
import B2BSalesToolbar from '../components/b2b-sales/B2BSalesToolbar';
import B2BInvoicesList from '../components/b2b-sales/B2BInvoicesList';
import B2BCustomersList from '../components/b2b-sales/B2BCustomersList';
import B2BQuotationsList from '../components/b2b-sales/B2BQuotationsList';
import B2BInvoiceModal, { InvoiceFormData } from '../components/b2b-sales/B2BInvoiceModal';
import B2BCustomerModal, { CustomerFormData } from '../components/b2b-sales/B2BCustomerModal';
import B2BQuotationModal, { QuotationFormData } from '../components/b2b-sales/B2BQuotationModal';
import B2BCustomerStatementModal from '../components/b2b-sales/B2BCustomerStatementModal';
import { useToast } from '../context/ToastContext';
import { generateReferenceNumber } from '../utils/generateReference';
import ConfirmModal from '../components/ui/ConfirmModal';

const B2BSales: React.FC = () => {
  const { success, error: showError } = useToast();
  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean; title: string; message: string; onConfirm: () => void} | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'customers' | 'quotations'>('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'dueDate' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<B2BInvoice | null>(null);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<B2BInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);

  const invoices = useLiveQuery(() => db.b2bInvoices.toArray()) || [];
  const customers = useLiveQuery(() => db.customers.toArray()) || [];
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const quotations = useLiveQuery(() => db.quotations.toArray()) || [];

  // Stats calculation
  const totalSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const activeCustomers = customers.length;
  const inProgressOrders = invoices.filter(inv => inv.status === 'partial').length;
  const overdueAmount = invoices.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0);

  const handleSubmit = async (data: InvoiceFormData) => {
    try {
      const generatedRef = await generateReferenceNumber('b2bInvoices', 'INV');
      await (db as any).transaction('rw', db.b2bInvoices, db.customers, db.products, db.journalEntries, db.accounts, db.shifts, async () => {
        const invoiceToSave = {
          ...data,
          referenceNumber: editingInvoice?.referenceNumber || generatedRef,
          status: data.paidAmount === data.totalAmount ? 'paid' : (data.paidAmount > 0 ? 'partial' : 'unpaid'),
          items: data.items,
          createdAt: editingInvoice?.createdAt || new Date()
        };

        let differenceInTotal = data.totalAmount;
        let differenceInBalance = data.totalAmount - data.paidAmount;
        let invoiceId;

        // Deduct or Adjust Stock
        if (editingInvoice?.id) {
          invoiceId = editingInvoice.id;
          differenceInTotal = data.totalAmount - editingInvoice.totalAmount;
          differenceInBalance = (data.totalAmount - data.paidAmount) - (editingInvoice.totalAmount - editingInvoice.paidAmount);
          
          // Revert old items stock
          for (const oldItem of editingInvoice.items || []) {
              const product = await db.products.where('name').equals(oldItem.name || '').first();
              if (product) {
                  await db.products.update(product.id!, { stock: (product.stock || 0) + oldItem.quantity });
              }
          }
          await db.b2bInvoices.put({ ...invoiceToSave, id: editingInvoice.id } as B2BInvoice);
        } else {
          invoiceId = await db.b2bInvoices.add(invoiceToSave as B2BInvoice);
        }
        
        let totalCogs = 0;
        // Apply new items stock
        for (const newItem of data.items || []) {
            const product = await db.products.where('name').equals(newItem.name || '').first();
            if (product) {
                await db.products.update(product.id!, { stock: Math.max(0, (product.stock || 0) - newItem.quantity) });
                totalCogs += (product.costPrice || 0) * newItem.quantity;
            }
        }

        // Update customer total spent and balance
        let customerName = 'عميل B2B';
        const customer = customers.find(c => c.id === data.customerId);
        if (customer) {
          customerName = customer.name;
          await db.customers.update(customer.id!, {
            totalSpent: (customer.totalSpent || 0) + differenceInTotal,
            balance: (customer.balance || 0) + differenceInBalance
          });
        }
        
        // Log to Cash if there's paid amount in this transaction difference
        // For simplicity, we just add the newly paid amount to the open shift if it's new
        if (!editingInvoice && data.paidAmount > 0) {
            const openShift = await db.shifts.where('status').equals('open').first();
            if (openShift) {
                await db.shifts.update(openShift.id!, {
                    expectedCash: openShift.expectedCash + data.paidAmount,
                    cashSales: openShift.cashSales + data.paidAmount
                });
            }
        }

        // Accounting Integration (Journal Entry)
        // Only run for new invoices for simplicity to avoid complex reversing entries
        if (!editingInvoice) {
            try {
                const revenueAccount = await db.accounts.where('code').equals('4010').first(); // إيرادات مبيعات
                const cashAccount = await db.accounts.where('code').equals('1010').first(); // النقدية
                const arAccount = await db.accounts.where('code').equals('1030').first(); // ذمم مدينة
                const cogsAccount = await db.accounts.where('code').equals('5010').first(); // تكلفة البضاعة
                const inventoryAccount = await db.accounts.where('code').equals('1040').first(); // المخزون
                const taxAccount = await db.accounts.where('code').equals('2020').first(); // ضريبة المبيعات
                
                if (revenueAccount && (cashAccount || arAccount)) {
                    const lines = [];
                    // Revenue (Total without Tax)
                    const totalTax = 0; // Removing taxAmount since it doesn't exist on interface
                    const revenueAmount = data.totalAmount - totalTax;
                    lines.push({ accountId: revenueAccount.id!, accountName: revenueAccount.name, debit: 0, credit: revenueAmount, description: `مبيعات للعميل ${customerName}` });

                    // Cash and Receivables
                    if (data.paidAmount > 0 && cashAccount) {
                        lines.push({ accountId: cashAccount.id!, accountName: cashAccount.name, debit: data.paidAmount, credit: 0, description: `دفعة مقدمة من ${customerName}` });
                    }
                    const creditAmount = data.totalAmount - data.paidAmount;
                    if (creditAmount > 0 && arAccount) {
                        lines.push({ accountId: arAccount.id!, accountName: arAccount.name, debit: creditAmount, credit: 0, description: `ذمم مدينة ${customerName}` });
                    }

                    // COGS
                    if (totalCogs > 0 && cogsAccount && inventoryAccount) {
                         lines.push({ accountId: cogsAccount.id!, accountName: cogsAccount.name, debit: totalCogs, credit: 0, description: `تكلفة بضاعة مباعة ${customerName}` });
                         lines.push({ accountId: inventoryAccount.id!, accountName: inventoryAccount.name, debit: 0, credit: totalCogs, description: `صرف مخزون` });
                    }

                    await AccountingEngine.postEntry({
                        date: new Date(),
                        reference: `B2B-${invoiceId}`,
                        description: `فاتورة مبيعات B2B للعميل ${customerName}`,
                        lines: lines,
                        });
                }
            } catch (err) {
                 console.error("Failed to post automatic journal entry for B2B invoice:", err);
            }
        }
      });
      
      setIsModalOpen(false);
      setEditingInvoice(null);
      success(editingInvoice ? 'تم تحديث الفاتورة بنجاح' : 'تم إنشاء الفاتورة بنجاح');
    } catch (err) {
      console.error(err);
      showError('حدث خطأ أثناء حفظ الفاتورة');
    }
  };

  const handleEdit = (invoice: B2BInvoice) => {
    setEditingInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: 'حذف الفاتورة',
      message: 'هل أنت متأكد من حذف هذه الفاتورة؟ لن تتمكن من التراجع عن هذا الإجراء.',
      onConfirm: async () => {
        const invoice = invoices.find(inv => inv.id === id);
        if (invoice) {
          const customer = customers.find(c => c.id === invoice.customerId);
          if (customer) {
            await db.customers.update(customer.id!, {
              totalSpent: Math.max(0, (customer.totalSpent || 0) - invoice.totalAmount),
              balance: Math.max(0, (customer.balance || 0) - (invoice.totalAmount - invoice.paidAmount))
            });
          }
        }
        await db.b2bInvoices.delete(id);
        success('تم حذف الفاتورة بنجاح');
        setConfirmConfig(null);
      }
    });
  };

  const handleCustomerSave = async (data: CustomerFormData) => {
    if (editingCustomer?.id) {
      await db.customers.put({ ...data, id: editingCustomer.id, totalSpent: editingCustomer.totalSpent } as Customer);
      success('تم تحديث العميل بنجاح');
    } else {
      await db.customers.add({ ...data, totalSpent: 0 } as Customer);
      success('تم إضافة العميل بنجاح');
    }
    setIsCustomerModalOpen(false);
    setEditingCustomer(null);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsCustomerModalOpen(true);
  };

  const handleViewStatement = (customer: Customer) => {
    setStatementCustomer(customer);
    setIsStatementModalOpen(true);
  };

  const handleDeleteCustomer = (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: 'حذف العميل',
      message: 'هل أنت متأكد من حذف هذا العميل؟ سيتم إزالة كافة البيانات المرتبطة به.',
      onConfirm: async () => {
        await db.customers.delete(id);
        success('تم حذف العميل بنجاح');
        setConfirmConfig(null);
      }
    });
  };

  const handlePrintInvoice = (invoice: B2BInvoice) => {
    const customer = customers.find(c => c.id === invoice.customerId);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>فاتورة مبيعات B2B #${invoice.referenceNumber || invoice.id}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
              th { background-color: #f2f2f2; }
              .header { text-align: center; margin-bottom: 30px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>فاتورة مبيعات B2B</h2>
              <p>رقم الفاتورة: ${invoice.referenceNumber || ('INV-' + invoice.id?.toString().padStart(4, '0'))}</p>
              <p>التاريخ: ${new Date(invoice.createdAt).toLocaleDateString('ar-SA')}</p>
            </div>
            <div>
              <h3>معلومات العميل:</h3>
              <p>الاسم: ${customer?.name || 'غير معروف'}</p>
              <p>الهاتف: ${customer?.phone || 'غير متوفر'}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th>الكمية</th>
                  <th>السعر</th>
                  <th>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                ${(invoice.items || []).map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>${item.price}</td>
                    <td>${item.price * item.quantity}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div style="margin-top: 20px; text-align: left;">
              <p><strong>الإجمالي:</strong> ${invoice.totalAmount}</p>
              <p><strong>المدفوع:</strong> ${invoice.paidAmount}</p>
              <p><strong>المتبقي:</strong> ${invoice.totalAmount - invoice.paidAmount}</p>
            </div>
            ${invoice.notes ? `
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <h3>ملاحظات:</h3>
              <p style="white-space: pre-wrap;">${invoice.notes}</p>
            </div>
            ` : ''}
            <script>
              window.onload = () => { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleExportCSV = () => {
    const headers = ['رقم الفاتورة', 'العميل', 'تاريخ الإصدار', 'تاريخ الاستحقاق', 'الإجمالي', 'المدفوع', 'المتبقي', 'الحالة'];
    const csvData = filteredInvoices.map(invoice => [
      invoice.referenceNumber || `INV-${invoice.id?.toString().padStart(4, '0')}`,
      getCustomerName(invoice.customerId),
      new Date(invoice.createdAt).toLocaleDateString('ar-SA'),
      new Date(invoice.dueDate).toLocaleDateString('ar-SA'),
      invoice.totalAmount,
      invoice.paidAmount,
      invoice.totalAmount - invoice.paidAmount,
      translateStatus(invoice.status)
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `b2b_invoices_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('تم تصدير الفواتير بنجاح');
  };

  const getCustomerName = (id: number) => {
    return customers.find(c => c.id === id)?.name || 'غير معروف';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'نشط':
      case 'accepted':
      case 'converted':
        return 'bg-emerald-100 text-emerald-700';
      case 'partial':
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'unpaid':
      case 'موقوف':
      case 'rejected':
        return 'bg-rose-100 text-rose-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case 'paid': return 'مدفوعة';
      case 'partial': return 'جزئي';
      case 'unpaid': return 'غير مدفوعة';
      case 'pending': return 'قيد الانتظار';
      case 'accepted': return 'مقبول';
      case 'rejected': return 'مرفوض';
      case 'converted': return 'محول لفاتورة';
      default: return status;
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const customerName = getCustomerName(inv.customerId).toLowerCase();
    const matchesSearch = customerName.includes(searchQuery.toLowerCase()) || inv.id?.toString().includes(searchQuery);
    
    if (!matchesSearch) return false;

    if (dateRange === 'all') return true;

    const invoiceDate = new Date(inv.createdAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateRange === 'today') {
      return invoiceDate >= today;
    } else if (dateRange === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return invoiceDate >= weekAgo;
    } else if (dateRange === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return invoiceDate >= monthAgo;
    }

    return true;
  }).filter(inv => {
    if (statusFilter === 'all') return true;
    return inv.status === statusFilter;
  }).sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'amount':
        comparison = a.totalAmount - b.totalAmount;
        break;
      case 'dueDate':
        comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'date':
      default:
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const filteredCustomers = customers
    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const filteredQuotations = quotations.filter(q => {
    const matchesSearch = q.id?.toString().includes(searchQuery) ||
                          q.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (q.customerId && getCustomerName(q.customerId).toLowerCase().includes(searchQuery.toLowerCase()));
    
    let matchesDate = true;
    const qDate = new Date(q.date);
    const today = new Date();
    if (dateRange === 'today') {
      matchesDate = qDate.toDateString() === today.toDateString();
    } else if (dateRange === 'week') {
      const weekAgo = new Date(today.setDate(today.getDate() - 7));
      matchesDate = qDate >= weekAgo;
    } else if (dateRange === 'month') {
      const monthAgo = new Date(today.setMonth(today.getMonth() - 1));
      matchesDate = qDate >= monthAgo;
    }

    let matchesStatus = true;
    if (statusFilter !== 'all') {
      matchesStatus = q.status === (statusFilter as string);
    }

    return matchesSearch && matchesDate && matchesStatus;
  }).sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'date') comparison = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === 'amount') comparison = b.totalAmount - a.totalAmount;
    if (sortBy === 'dueDate' && a.expiryDate && b.expiryDate) comparison = new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime();
    if (sortBy === 'status') comparison = a.status.localeCompare(b.status);
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSaveQuotation = async (data: QuotationFormData) => {
    const generatedRef = await generateReferenceNumber('quotations', 'QT');
    const quotationToSave = {
      ...data,
      referenceNumber: editingQuotation?.referenceNumber || generatedRef,
      createdBy: 'مدير النظام', // Should be from auth context
      date: editingQuotation?.date || new Date(),
      updatedAt: new Date()
    };

    if (editingQuotation?.id) {
      await db.quotations.put({ ...quotationToSave, id: editingQuotation.id } as Quotation);
    } else {
      await db.quotations.add(quotationToSave as Quotation);
    }

    setIsQuotationModalOpen(false);
    setEditingQuotation(null);
    success(editingQuotation ? 'تم تحديث عرض السعر بنجاح' : 'تم إنشاء عرض السعر بنجاح');
  };

  const handleEditQuotation = (quotation: Quotation) => {
    setEditingQuotation(quotation);
    setIsQuotationModalOpen(true);
  };

  const handleDeleteQuotation = (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: 'حذف عرض السعر',
      message: 'هل أنت متأكد من حذف عرض السعر؟ هذا الإجراء لا يمكن التراجع عنه.',
      onConfirm: async () => {
        await db.quotations.delete(id);
        success('تم حذف عرض السعر بنجاح');
        setConfirmConfig(null);
      }
    });
  };

  const handlePrintQuotation = (quotation: Quotation) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const customerName = quotation.customerId ? getCustomerName(quotation.customerId) : quotation.customerName;

    const html = `
      <html dir="rtl">
        <head>
          <title>عرض سعر #${quotation.id}</title>
          <style>
            body { font-family: 'Tajawal', sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .logo { max-width: 150px; margin-bottom: 10px; }
            .invoice-details { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .details-box { background: #f8fafc; padding: 20px; border-radius: 8px; width: 45%; }
            table { w-full; border-collapse: collapse; margin-bottom: 30px; }
            th, td { padding: 12px; text-align: right; border-bottom: 1px solid #eee; }
            th { background: #f8fafc; font-weight: bold; }
            .totals { width: 300px; margin-left: auto; }
            .total-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .total-row.final { font-weight: bold; font-size: 1.2em; border-bottom: none; border-top: 2px solid #333; }
            .footer { margin-top: 50px; text-align: center; color: #666; font-size: 0.9em; }
            .notes { margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 8px; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>عرض سعر</h1>
            <p>رقم العرض: QT-${quotation.id?.toString().padStart(4, '0')}</p>
          </div>
          
          <div class="invoice-details">
            <div class="details-box">
              <h3>معلومات العميل</h3>
              <p><strong>الاسم:</strong> ${customerName}</p>
            </div>
            <div class="details-box">
              <h3>تفاصيل العرض</h3>
              <p><strong>التاريخ:</strong> ${new Date(quotation.date).toLocaleDateString('ar-SA')}</p>
              <p><strong>تاريخ الانتهاء:</strong> ${quotation.expiryDate ? new Date(quotation.expiryDate).toLocaleDateString('ar-SA') : '-'}</p>
            </div>
          </div>

          <table style="width: 100%">
            <thead>
              <tr>
                <th>الصنف</th>
                <th>السعر</th>
                <th>الكمية</th>
                <th>المجموع</th>
              </tr>
            </thead>
            <tbody>
              ${quotation.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.price.toLocaleString()}</td>
                  <td>${item.quantity}</td>
                  <td>${(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>المجموع الفرعي:</span>
              <span>${quotation.subtotalAmount.toLocaleString()}</span>
            </div>
            ${quotation.discountAmount ? `
            <div class="total-row">
              <span>الخصم:</span>
              <span>${quotation.discountAmount.toLocaleString()}</span>
            </div>
            ` : ''}
            ${quotation.taxAmount ? `
            <div class="total-row">
              <span>الضريبة:</span>
              <span>${quotation.taxAmount.toLocaleString()}</span>
            </div>
            ` : ''}
            <div class="total-row final">
              <span>الإجمالي النهائي:</span>
              <span>${quotation.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          ${quotation.notes ? `
          <div class="notes">
            <h3>ملاحظات وشروط العرض:</h3>
            <p>${quotation.notes.replace(/\n/g, '<br>')}</p>
          </div>
          ` : ''}

          <div class="footer">
            <p>شكراً لثقتكم بنا</p>
          </div>
          
          <script>
            window.onload = () => window.print();
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleConvertQuotation = (quotation: Quotation) => {
    setConfirmConfig({
      isOpen: true,
      title: 'تحويل عرض السعر',
      message: 'هل أنت متأكد من تحويل عرض السعر إلى فاتورة مبيعات؟ سيتم إنشاء فاتورة جديدة مسودة وتحديث حالة العرض.',
      onConfirm: async () => {
        try {
          const formData: InvoiceFormData = {
             customerId: quotation.customerId || 0,
             items: quotation.items,
             totalAmount: quotation.totalAmount,
             paidAmount: 0,
             dueDate: new Date(),
             notes: `محولة من عرض سعر رقم QT-${quotation.id}`
          };
          
          await handleSubmit(formData);
          await db.quotations.update(quotation.id!, { status: 'converted' });

          success('تم تحويل عرض السعر إلى فاتورة بنجاح');
          setActiveTab('orders'); // Switch to orders tab to see the new invoice
        } catch (err) {
          console.error(err);
          showError('حدث خطأ أثناء تحويل عرض السعر');
        } finally {
          setConfirmConfig(null);
        }
      }
    });
  };

  const handleNewClick = () => {
    if (activeTab === 'orders') {
      setEditingInvoice(null);
      setIsModalOpen(true);
    } else if (activeTab === 'quotations') {
      setEditingQuotation(null);
      setIsQuotationModalOpen(true);
    } else {
      setEditingCustomer(null);
      setIsCustomerModalOpen(true);
    }
  };

  const handleOpenPaymentModal = (invoice: B2BInvoice) => {
    setPaymentInvoice(invoice);
    setPaymentAmount(invoice.totalAmount - invoice.paidAmount);
    setIsPaymentModalOpen(true);
  };

  const handleProcessPayment = async () => {
    if (!paymentInvoice || !paymentInvoice.id) return;
    if (paymentAmount <= 0) {
      showError('مبلغ الدفع يجب أن يكون أكبر من صفر');
      return;
    }
    
    const remaining = paymentInvoice.totalAmount - paymentInvoice.paidAmount;
    if (paymentAmount > remaining) {
      showError('مبلغ الدفع لا يمكن أن يكون أكبر من المبلغ المتبقي');
      return;
    }

    try {
      const newPaidAmount = paymentInvoice.paidAmount + paymentAmount;
      const newStatus = newPaidAmount >= paymentInvoice.totalAmount ? 'paid' : 'partial';

      const paymentRecord = {
        id: Date.now().toString(),
        amount: paymentAmount,
        date: new Date(),
        method: 'cash' as const, // Defaulting to cash for now, could add a selector
        notes: 'دفعة مسجلة'
      };

      const updatedPayments = [...(paymentInvoice.payments || []), paymentRecord];

      await db.b2bInvoices.update(paymentInvoice.id, {
        paidAmount: newPaidAmount,
        status: newStatus,
        payments: updatedPayments
      });

      const customer = customers.find(c => c.id === paymentInvoice.customerId);
      if (customer && customer.id) {
        await db.customers.update(customer.id, {
          balance: Math.max(0, (customer.balance || 0) - paymentAmount)
        });
      }

      success('تم تسجيل الدفعة بنجاح');
      setIsPaymentModalOpen(false);
      setPaymentInvoice(null);
      setPaymentAmount(0);
    } catch (err) {
      console.error(err);
      showError('حدث خطأ أثناء تسجيل الدفعة');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gradient-to-tr from-sky-50/60 via-indigo-50/40 via-slate-50 to-pink-50/40 min-h-screen font-['Tajawal'] rounded-2xl" dir="rtl">
      <B2BSalesHeader activeTab={activeTab} onNewClick={handleNewClick} />

      <B2BSalesStats 
        totalSales={totalSales}
        activeCustomers={activeCustomers}
        inProgressOrders={inProgressOrders}
        overdueAmount={overdueAmount}
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <B2BSalesToolbar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          dateRange={dateRange}
          setDateRange={setDateRange}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          onExport={handleExportCSV}
        />

        {activeTab === 'orders' ? (
          <B2BInvoicesList 
            invoices={filteredInvoices}
            getCustomerName={getCustomerName}
            getStatusColor={getStatusColor}
            translateStatus={translateStatus}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPrint={handlePrintInvoice}
            onPayment={handleOpenPaymentModal}
          />
        ) : activeTab === 'quotations' ? (
          <B2BQuotationsList
            quotations={filteredQuotations}
            getCustomerName={getCustomerName}
            getStatusColor={getStatusColor}
            translateStatus={translateStatus}
            onEdit={handleEditQuotation}
            onDelete={handleDeleteQuotation}
            onPrint={handlePrintQuotation}
            onConvert={handleConvertQuotation}
          />
        ) : (
          <B2BCustomersList 
            customers={filteredCustomers}
            getStatusColor={getStatusColor}
            onEdit={handleEditCustomer}
            onDelete={handleDeleteCustomer}
            onViewStatement={handleViewStatement}
          />
        )}
      </div>

      {isModalOpen && (
        <B2BInvoiceModal 
          editingInvoice={editingInvoice}
          customers={customers}
          products={products}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSubmit}
        />
      )}

      {isCustomerModalOpen && (
        <B2BCustomerModal 
          editingCustomer={editingCustomer}
          onClose={() => setIsCustomerModalOpen(false)}
          onSave={handleCustomerSave}
        />
      )}

      {isQuotationModalOpen && (
        <B2BQuotationModal
          editingQuotation={editingQuotation}
          customers={customers}
          products={products}
          onClose={() => setIsQuotationModalOpen(false)}
          onSave={handleSaveQuotation}
        />
      )}

      {isStatementModalOpen && statementCustomer && (
        <B2BCustomerStatementModal
          customer={statementCustomer}
          invoices={invoices}
          onClose={() => setIsStatementModalOpen(false)}
        />
      )}

      {isPaymentModalOpen && paymentInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">تسجيل دفعة للفاتورة INV-{paymentInvoice.id?.toString().padStart(4, '0')}</h2>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">العميل</p>
                <p className="font-bold text-slate-800">{getCustomerName(paymentInvoice.customerId)}</p>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                <div>
                  <p className="text-sm text-slate-500">إجمالي الفاتورة</p>
                  <p className="font-bold text-slate-800">{paymentInvoice.totalAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">المدفوع مسبقاً</p>
                  <p className="font-bold text-emerald-600">{paymentInvoice.paidAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">المتبقي</p>
                  <p className="font-bold text-rose-600">{(paymentInvoice.totalAmount - paymentInvoice.paidAmount).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">مبلغ الدفعة الجديدة</label>
                <input
                  type="number"
                  min="0"
                  max={paymentInvoice.totalAmount - paymentInvoice.paidAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-lg font-bold"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleProcessPayment}
                className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
              >
                تأكيد الدفع
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
          confirmText="تأكيد"
          cancelText="إلغاء"
        />
      )}
    </div>
  );
};

export default B2BSales;

