import { AccountingEngine } from '../services/AccountingEngine';
import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Order, OrderItem, User } from '../types';
import { logActivity } from '../utils/logger';
import InvoiceModal from '../components/InvoiceModal';

import ReturnsHeader from '../components/returns/ReturnsHeader';
import ReturnsToolbar from '../components/returns/ReturnsToolbar';
import ReturnsList from '../components/returns/ReturnsList';
import ReturnDetails from '../components/returns/ReturnDetails';
import NewReturnModal from '../components/returns/NewReturnModal';
import { generateReferenceNumber } from '../utils/generateReference';
import { Toaster, toast } from 'react-hot-toast';
import ConfirmModal from '../components/ui/ConfirmModal';

const Returns: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // New Return Modal State
  const [isNewReturnModalOpen, setIsNewReturnModalOpen] = useState(false);
  const [searchOrderId, setSearchOrderId] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [searchError, setSearchError] = useState('');

  // Refund Logic State
  const [refundItems, setRefundItems] = useState<{item: OrderItem, refundQty: number, remainingQty: number}[]>([]);
  const [refundReason, setRefundReason] = useState('');
  
  // View Return Details State
  const [selectedReturn, setSelectedReturn] = useState<Order | null>(null);
  const [invoicePreviewOrder, setInvoicePreviewOrder] = useState<Order | null>(null);

  // Custom Confirmation States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState<{ warehouseId?: number; method?: string } | null>(null);

  const settings = useLiveQuery(() => db.settings.toCollection().first(), []);
  const currencyCode = settings?.currencyCode || 'EGP';

  // Fetch only return orders
  const displayReturns = useLiveQuery(async () => {
    const all = await db.orders.reverse().toArray();
    return all.filter(o => o.isReturn === true);
  }, []) || [];

  const customers = useLiveQuery(() => db.customers.toArray(), []);
  const customerMap = useMemo(() => {
    const map = new Map<number, string>();
    customers?.forEach(c => { if (c.id) map.set(c.id, c.name); });
    return map;
  }, [customers]);

  const filteredReturns = useMemo(() => {
    return displayReturns.filter(order => {
      const customerName = order.customerId ? customerMap.get(order.customerId) : '';
      const matchesSearch = order.id?.toString().includes(searchTerm) || 
             order.parentOrderId?.toString().includes(searchTerm) ||
             (customerName && customerName.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesDate = true;
      if (startDate || endDate) {
        const orderDate = new Date(order.date);
        orderDate.setHours(0, 0, 0, 0);
        
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (orderDate < start) matchesDate = false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (orderDate > end) matchesDate = false;
        }
      }
      return matchesSearch && matchesDate;
    });
  }, [displayReturns, searchTerm, customerMap, startDate, endDate]);

  const paginatedReturns = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredReturns.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredReturns, currentPage]);

  const totalPages = Math.ceil(filteredReturns.length / itemsPerPage);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(amount);
  const formatDate = (date: Date | string) => {
    try {
        const d = new Date(date);
        return new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
    } catch(e) { return '-'; }
  };

  const handleSearchOrder = async () => {
    setSearchError('');
    setFoundOrder(null);
    if (!searchOrderId) return;
    
    const storedUser = localStorage.getItem('nima_user');
    const currentUser: User | null = storedUser ? JSON.parse(storedUser) : null;
    if (currentUser && currentUser.role !== 'admin' && !currentUser.canRefund) {
        setSearchError('ليس لديك صلاحية لإرجاع الفواتير. يرجى مراجعة مدير النظام.');
        return;
    }

    const id = parseInt(searchOrderId);
    if (isNaN(id)) {
      setSearchError('رقم الفاتورة غير صحيح');
      return;
    }

    const order = await db.orders.get(id);
    if (!order) {
      setSearchError('لم يتم العثور على الفاتورة');
      return;
    }

    if (order.isReturn) {
      setSearchError('هذه الفاتورة هي فاتورة مرتجع بالفعل');
      return;
    }

    if (order.status === 'refunded') {
      setSearchError('تم استرجاع هذه الفاتورة بالكامل مسبقاً');
      return;
    }

    // Calculate already refunded quantities
    const previousReturns = await db.orders.filter(o => o.parentOrderId === order.id && o.isReturn === true).toArray();
    const refundedQtyMap = new Map<number, number>();
    
    previousReturns.forEach(ret => {
      ret.items.forEach(item => {
        // Returned items have negative quantities
        const qty = Math.abs(item.quantity);
        refundedQtyMap.set(item.productId, (refundedQtyMap.get(item.productId) || 0) + qty);
      });
    });

    const itemsWithRemainingQty = order.items.map(item => {
      const alreadyRefunded = refundedQtyMap.get(item.productId) || 0;
      const remainingQty = Math.max(0, item.quantity - alreadyRefunded);
      return { item, refundQty: 0, remainingQty };
    }).filter(ri => ri.remainingQty > 0);

    if (itemsWithRemainingQty.length === 0) {
      setSearchError('تم استرجاع جميع أصناف هذه الفاتورة مسبقاً');
      // Also update the order status if it wasn't updated
      await db.orders.update(order.id!, { status: 'refunded' });
      return;
    }

    setFoundOrder(order);
    setRefundItems(itemsWithRemainingQty);
    setRefundReason('');
  };

  const handleRefundQtyChange = (idx: number, delta: number) => {
      setRefundItems(prev => prev.map((ri, i) => {
          if (i === idx) {
              const newQty = Math.min(Math.max(0, ri.refundQty + delta), ri.remainingQty);
              return { ...ri, refundQty: newQty };
          }
          return ri;
      }));
  };

  const calculateRefundTotal = () => {
      if (!foundOrder) return 0;
      const subtotalRefund = refundItems.reduce((acc, ri) => {
          const unitPrice = ri.item.total / ri.item.quantity;
          return acc + (unitPrice * ri.refundQty);
      }, 0);
      const ratio = foundOrder.subtotalAmount > 0 ? subtotalRefund / foundOrder.subtotalAmount : 0;
      const discountRefund = (foundOrder.discountAmount || 0) * ratio;
      const taxRefund = (foundOrder.taxAmount || 0) * ratio;
      return subtotalRefund - discountRefund + taxRefund;
  };

  const executePartialRefund = (warehouseId?: number, method?: string) => {
      if (!foundOrder) return;
      const toRefund = refundItems.filter(ri => ri.refundQty > 0);
      if (toRefund.length === 0) {
          toast.error('يرجى اختيار صنف واحد على الأقل للاسترجاع');
          return;
      }

      setConfirmData({ warehouseId, method });
      setIsConfirmOpen(true);
  };

  const handleConfirmRefund = async () => {
      if (!foundOrder || !confirmData) return;
      const { warehouseId, method } = confirmData;
      const toRefund = refundItems.filter(ri => ri.refundQty > 0);
      const totalRefundAmount = calculateRefundTotal();

      try {
          await (db as any).transaction('rw', db.orders, db.products, db.customers, db.inventory, db.warehouses, db.logs, db.shifts, db.journalEntries, db.accounts, db.auditLogs, async () => {
              const targetWarehouse = warehouseId ? await db.warehouses.get(warehouseId) : await db.warehouses.filter(w => w.isMain === true).first();
              
              const storedUser = localStorage.getItem('nima_user');
              const currentUser = storedUser ? JSON.parse(storedUser) : null;

              const subtotalRefund = toRefund.reduce((acc, ri) => acc + ((ri.item.total / ri.item.quantity) * ri.refundQty), 0);
              const ratio = foundOrder.subtotalAmount > 0 ? subtotalRefund / foundOrder.subtotalAmount : 0;
              const discountRefund = (foundOrder.discountAmount || 0) * ratio;
              const taxRefund = (foundOrder.taxAmount || 0) * ratio;
              const totalRefundAmount = subtotalRefund - discountRefund + taxRefund;

              const finalMethod = (method || foundOrder.paymentMethod) as 'cash' | 'card' | 'credit' | 'wallet' | 'split';

              let splitDetails;
              if (finalMethod === 'split' && foundOrder.splitDetails) {
                  const cashRatio = foundOrder.totalAmount > 0 ? foundOrder.splitDetails.cash / foundOrder.totalAmount : 0;
                  const cardRatio = foundOrder.totalAmount > 0 ? foundOrder.splitDetails.card / foundOrder.totalAmount : 0;
                  splitDetails = {
                      cash: -totalRefundAmount * cashRatio,
                      card: -totalRefundAmount * cardRatio
                  };
              }

              const ref = await generateReferenceNumber('orders', 'RET');
              // 1. Create Return Order
              const returnOrder: Order = {
                  referenceNumber: ref,
                  date: new Date(),
                  items: toRefund.map(ri => ({ ...ri.item, quantity: -ri.refundQty, total: -(ri.item.total / ri.item.quantity) * ri.refundQty })),
                  subtotalAmount: -subtotalRefund,
                  totalAmount: -totalRefundAmount,
                  discountAmount: -discountRefund,
                  taxAmount: -taxRefund,
                  paymentMethod: finalMethod,
                  splitDetails,
                  status: 'completed',
                  fulfillmentStatus: 'served',
                  isReturn: true,
                  parentOrderId: foundOrder.id,
                  note: `مرتجع من فاتورة #${foundOrder.id}. ${refundReason}`,
                  orderType: foundOrder.orderType,
                  cashierName: currentUser?.name || 'مدير النظام'
              };

              await db.orders.add(returnOrder);

              // 2. Restock Inventory
              for (const ri of toRefund) {
                  const product = await db.products.get(ri.item.productId);
                  if (product) await db.products.update(ri.item.productId, { stock: product.stock + ri.refundQty });
                  if (targetWarehouse) {
                      const invItem = await db.inventory.where({ warehouseId: targetWarehouse.id, productId: ri.item.productId }).first();
                      if (invItem) {
                          await db.inventory.update(invItem.id!, { quantity: invItem.quantity + ri.refundQty });
                      } else {
                          await db.inventory.add({ warehouseId: targetWarehouse.id!, productId: ri.item.productId, quantity: ri.refundQty });
                      }
                  }
              }

              // 3. Auto Accounting Integration (Journal Entry)
                  const revenueAccount = await db.accounts.where('code').equals('4010').first(); // إيرادات المبيعات
                  let cashAccountCode = '1010';
                  if (finalMethod === 'card') cashAccountCode = '1020';
                  else if (finalMethod === 'credit' || finalMethod === 'wallet') cashAccountCode = '1030';
                  
                  const cashAccount = await db.accounts.where('code').equals(cashAccountCode).first();
                  
                  if (revenueAccount && cashAccount) {
                      const lines = [];
                      lines.push({ accountId: revenueAccount.id!, accountName: revenueAccount.name, debit: totalRefundAmount, credit: 0, description: `مرتجع مبيعات ${foundOrder.id}` });
                      
                      if (finalMethod === 'split' && splitDetails) {
                          const cashAcc = await db.accounts.where('code').equals('1010').first();
                          const bankAcc = await db.accounts.where('code').equals('1020').first();
                          if (cashAcc && splitDetails.cash !== 0) {
                              lines.push({ accountId: cashAcc.id!, accountName: cashAcc.name, debit: 0, credit: Math.abs(splitDetails.cash), description: `نقدية - مرتجع مبيعات #${foundOrder.id}` });
                          }
                          if (bankAcc && splitDetails.card !== 0) {
                              lines.push({ accountId: bankAcc.id!, accountName: bankAcc.name, debit: 0, credit: Math.abs(splitDetails.card), description: `بطاقة - مرتجع مبيعات #${foundOrder.id}` });
                          }
                      } else {
                          lines.push({ accountId: cashAccount.id!, accountName: cashAccount.name, debit: 0, credit: totalRefundAmount, description: `دفع قيمة المرتجع من ${finalMethod}` });
                      }
                      
                      const taxAccount = await db.accounts.where('code').equals('2020').first();
                      if (taxRefund > 0 && taxAccount) {
                          // Note: Reverse tax (Debit) to reduce liability.
                          // Remove the tax portion from the Revenue debit so we debit Revenue and Tax separately.
                          lines[0].debit = totalRefundAmount - taxRefund;
                          lines.push({ accountId: taxAccount.id!, accountName: taxAccount.name, debit: taxRefund, credit: 0, description: ` ضريبة مرتجع #${foundOrder.id}` });
                      }
                      
                      await AccountingEngine.postEntry({
                          date: new Date(),
                          reference: `RET-${foundOrder.id}`,
                          description: `فاتورة مرتجع #${foundOrder.id}`,
                          lines: lines,
                          });
                  }

              // 4. Update Customer Balance
              if (foundOrder.customerId) {
                  const customer = await db.customers.get(foundOrder.customerId);
                  if (customer) {
                      const updates: any = { totalSpent: Math.max(0, (customer.totalSpent || 0) - totalRefundAmount) };
                      if (finalMethod === 'credit') updates.balance = Math.max(0, (customer.balance || 0) - totalRefundAmount);
                      else if (finalMethod === 'wallet') updates.walletBalance = (customer.walletBalance || 0) + totalRefundAmount;
                      await db.customers.update(foundOrder.customerId, updates);
                  }
              }

              // 4. Update Shift
              const activeShift = await db.shifts.where('status').equals('open').first();
              if (activeShift) {
                  let cashToSubtract = 0;
                  if (finalMethod === 'cash') cashToSubtract = totalRefundAmount;
                  else if (finalMethod === 'split' && splitDetails) cashToSubtract = Math.abs(splitDetails.cash);

                  await db.shifts.update(activeShift.id!, {
                      expectedCash: (activeShift.expectedCash || 0) - cashToSubtract,
                      cashSales: (activeShift.cashSales || 0) - cashToSubtract,
                      cardSales: (activeShift.cardSales || 0) - (totalRefundAmount - cashToSubtract)
                  });
              }

              // 5. Update Original Order Status
              const totalOriginalQty = foundOrder.items.reduce((s, i) => s + i.quantity, 0);
              
              // Calculate already refunded from previous returns
              const previousReturns = await db.orders.filter(o => o.parentOrderId === foundOrder.id && o.isReturn === true).toArray();
              let previouslyRefundedQty = 0;
              previousReturns.forEach(ret => {
                  ret.items.forEach(item => {
                      previouslyRefundedQty += Math.abs(item.quantity);
                  });
              });

              const totalReturnedQty = toRefund.reduce((s, r) => s + r.refundQty, 0);
              if ((previouslyRefundedQty + totalReturnedQty) >= totalOriginalQty) {
                  await db.orders.update(foundOrder.id!, { status: 'refunded' });
              } else {
                  await db.orders.update(foundOrder.id!, { status: 'partial_refund' });
              }

              await logActivity('refund', `استرجاع جزئي لفاتورة #${foundOrder.id}`, `قيمة: ${totalRefundAmount}`, totalRefundAmount, foundOrder.id, 'success');
          });

          toast.success('تم تنفيذ الاسترجاع دفتريًا وماليًا بنجاح وتحويل الحركة لليومية العامة');
          setIsNewReturnModalOpen(false);
          setFoundOrder(null);
          setSearchOrderId('');
      } catch (error) {
          console.error("Refund failed", error);
          toast.error("فشل تنفيذ المرتجع، يرجى التحقق من الأرصدة والوردية.");
      } finally {
          setIsConfirmOpen(false);
          setConfirmData(null);
      }
  };

  const handleExport = () => {
    if (filteredReturns.length === 0) return;
    
    const csvContent = [
      ['رقم المرتجع', 'التاريخ', 'الفاتورة الأصلية', 'العميل', 'قيمة المرتجع', 'ملاحظات'],
      ...filteredReturns.map(r => [
        r.id,
        new Date(r.date).toLocaleString('ar-EG'),
        r.parentOrderId,
        r.customerId ? customerMap.get(r.customerId) : 'عميل عام',
        Math.abs(r.totalAmount),
        r.note || ''
      ])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `returns_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-full bg-gradient-to-tr from-sky-50/60 via-indigo-50/40 via-slate-50 to-pink-50/40 overflow-hidden font-['Tajawal'] p-4 md:p-6 gap-6 rounded-2xl" dir="rtl">
      <div className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ${selectedReturn ? 'w-[65%] hidden lg:flex' : 'w-full'}`}>
        <div className="px-8 py-6 bg-white/60 backdrop-blur-md shadow-sm border border-indigo-100/10 rounded-2xl mb-4">
          <ReturnsHeader onNewReturnClick={() => setIsNewReturnModalOpen(true)} />
          <ReturnsToolbar 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            setCurrentPage={setCurrentPage}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            onExport={handleExport}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <ReturnsList 
            returns={paginatedReturns}
            selectedReturn={selectedReturn}
            setSelectedReturn={setSelectedReturn}
            customerMap={customerMap}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            totalFiltered={filteredReturns.length}
          />
        </div>
      </div>

      {/* Side Drawer: Return Details */}
      {selectedReturn && (
        <ReturnDetails 
          selectedReturn={selectedReturn}
          setSelectedReturn={setSelectedReturn}
          setInvoicePreviewOrder={setInvoicePreviewOrder}
          customerMap={customerMap}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      )}

      {/* New Return Modal */}
      {isNewReturnModalOpen && (
        <NewReturnModal 
          foundOrder={foundOrder}
          setFoundOrder={setFoundOrder}
          searchOrderId={searchOrderId}
          setSearchOrderId={setSearchOrderId}
          searchError={searchError}
          setSearchError={setSearchError}
          handleSearchOrder={handleSearchOrder}
          refundItems={refundItems}
          handleRefundQtyChange={handleRefundQtyChange}
          refundReason={refundReason}
          setRefundReason={setRefundReason}
          calculateRefundTotal={calculateRefundTotal}
          executePartialRefund={executePartialRefund}
          customerMap={customerMap}
          formatCurrency={formatCurrency}
          onClose={() => setIsNewReturnModalOpen(false)}
        />
      )}

      {/* Invoice Modal Preview */}
      {invoicePreviewOrder && (
        <InvoiceModal 
            order={invoicePreviewOrder}
            settings={settings}
            customer={invoicePreviewOrder.customerId && customerMap.has(invoicePreviewOrder.customerId) ? {id: invoicePreviewOrder.customerId, name: customerMap.get(invoicePreviewOrder.customerId)!} as any : undefined}
            onClose={() => setInvoicePreviewOrder(null)}
        />
      )}

      {/* Confirm Refund Custom Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title="تأكيد عملية الاسترجاع"
        message={`هل أنت متأكد من رغبتك في إرجاع الأصناف المحددة بقيمة إجمالية تبلغ ${formatCurrency(calculateRefundTotal())}؟ سيتم تحديث المخزون والتكلفة واليومية العامة تلقائياً.`}
        onConfirm={handleConfirmRefund}
        onCancel={() => { setIsConfirmOpen(false); setConfirmData(null); }}
        confirmText="تأكيد وإرجاع"
        cancelText="إلغاء التراجع"
      />
      <Toaster position="top-left" reverseOrder={true} />
    </div>
  );
};

export default Returns;
