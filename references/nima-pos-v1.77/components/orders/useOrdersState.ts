import { useState, useMemo, useDeferredValue } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Order, Customer, OrderItem, User } from '../../types';
import { logActivity } from '../../utils/logger';

export const useOrdersState = (success: (msg: string) => void, showError: (msg: string) => void) => {
  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'refunded'>('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  // Advanced Filters
  const [filterOrderType, setFilterOrderType] = useState<string>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');
  const [filterCashier, setFilterCashier] = useState<string>('all');

  // UI State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoicePreviewOrder, setInvoicePreviewOrder] = useState<Order | null>(null);

  // Partial Refund Modal State
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundItems, setRefundItems] = useState<{ item: OrderItem; refundQty: number; remainingQty: number }[]>([]);
  const [refundReason, setRefundReason] = useState('');

  // Pagination State
  const [limit, setLimit] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);

  // Generic Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Fetch unique cashiers
  const uniqueCashiers = useLiveQuery(async () => {
    const users = await db.users.toArray();
    return users.map((u) => u.name).filter(Boolean);
  }, []) || [];

  // Pagination query
  const { orders, isLoading } = useLiveQuery(async () => {
    const start = new Date(dateRange.start);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateRange.end);
    end.setHours(23, 59, 59, 999);

    let collection = db.orders.where('date').between(start, end, true, true).reverse();

    if (statusFilter !== 'all') {
      collection = collection.filter((o) => o.status === statusFilter);
    }
    if (filterOrderType !== 'all') {
      collection = collection.filter((o) => o.orderType === filterOrderType);
    }
    if (filterPaymentMethod !== 'all') {
      collection = collection.filter((o) => o.paymentMethod === filterPaymentMethod);
    }
    if (filterCashier !== 'all') {
      collection = collection.filter((o) => o.cashierName === filterCashier);
    }

    if (deferredSearchTerm) {
      const allMatches = await collection.toArray();
      const filtered = allMatches.filter(
        (order) =>
          order.id?.toString().includes(deferredSearchTerm) ||
          order.cashierName?.toLowerCase().includes(deferredSearchTerm.toLowerCase()) ||
          order.note?.includes(deferredSearchTerm)
      );
      setTotalRecords(filtered.length);
      const paginated = filtered.slice(0, limit);
      return { orders: paginated, isLoading: false };
    }

    const count = await collection.count();
    setTotalRecords(count);

    const paginated = await collection.limit(limit).toArray();
    return { orders: paginated, isLoading: false };
  }, [
    dateRange.start,
    dateRange.end,
    statusFilter,
    filterOrderType,
    filterPaymentMethod,
    filterCashier,
    deferredSearchTerm,
    limit,
  ]) || { orders: [], isLoading: true };

  const loadMore = () => {
    if (orders && orders.length < totalRecords) {
      setLimit((prev) => prev + 50);
    }
  };

  // Helper Stats
  const stats = useLiveQuery(async () => {
    const start = new Date(dateRange.start);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateRange.end);
    end.setHours(23, 59, 59, 999);

    let totalRevenue = 0;
    let totalRefunded = 0;
    let count = 0;

    await db.orders
      .where('date')
      .between(start, end)
      .each((o) => {
        count++;
        totalRevenue += o.totalAmount;
        if (o.isReturn) {
          totalRefunded += Math.abs(o.totalAmount);
        }
      });

    const avgOrder = count > 0 ? totalRevenue / count : 0;
    return { totalRevenue, totalRefunded, count, avgOrder };
  }, [dateRange]) || { totalRevenue: 0, totalRefunded: 0, count: 0, avgOrder: 0 };

  const customers = useLiveQuery(() => db.customers.toArray(), []);
  const settings = useLiveQuery(() => db.settings.toCollection().first(), []);
  const currencyCode = settings?.currencyCode || 'EGP';

  const customerMap = useMemo(() => {
    const map = new Map<number, string>();
    customers?.forEach((c) => {
      if (c.id) map.set(c.id, c.name);
    });
    return map;
  }, [customers]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('ar-IQ', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (date: Date | string) => {
    try {
      const d = new Date(date);
      return new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
    } catch (e) {
      return '-';
    }
  };

  const formatTime = (date: Date | string) => {
    try {
      return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const openRefundModal = async () => {
    if (!selectedOrder) return;

    const storedUser = localStorage.getItem('nima_user');
    const currentUser: User | null = storedUser ? JSON.parse(storedUser) : null;
    if (currentUser && currentUser.role !== 'admin' && !currentUser.canRefund) {
      showError('ليس لديك صلاحية لإرجاع الفواتير. يرجى مراجعة مدير النظام.');
      return;
    }

    const previousReturns = await db.orders
      .filter((o) => o.parentOrderId === selectedOrder.id && o.isReturn === true)
      .toArray();
    const refundedQtyMap = new Map<number, number>();

    previousReturns.forEach((ret) => {
      ret.items.forEach((item) => {
        const qty = Math.abs(item.quantity);
        refundedQtyMap.set(item.productId, (refundedQtyMap.get(item.productId) || 0) + qty);
      });
    });

    const itemsWithRemainingQty = selectedOrder.items
      .map((item) => {
        const alreadyRefunded = refundedQtyMap.get(item.productId) || 0;
        const remainingQty = Math.max(0, item.quantity - alreadyRefunded);
        return { item, refundQty: 0, remainingQty };
      })
      .filter((ri) => ri.remainingQty > 0);

    if (itemsWithRemainingQty.length === 0) {
      showError('تم استرجاع جميع أصناف هذه الفاتورة مسبقاً');
      return;
    }

    setRefundItems(itemsWithRemainingQty);
    setRefundReason('');
    setIsRefundModalOpen(true);
  };

  const handleRefundQtyChange = (idx: number, delta: number) => {
    setRefundItems((prev) =>
      prev.map((ri, i) => {
        if (i === idx) {
          const newQty = Math.min(Math.max(0, ri.refundQty + delta), ri.remainingQty);
          return { ...ri, refundQty: newQty };
        }
        return ri;
      })
    );
  };

  const calculateRefundTotal = () => {
    if (!selectedOrder) return 0;
    const subtotalRefund = refundItems.reduce((acc, ri) => {
      const unitPrice = ri.item.total / ri.item.quantity;
      return acc + unitPrice * ri.refundQty;
    }, 0);
    const ratio = selectedOrder.subtotalAmount > 0 ? subtotalRefund / selectedOrder.subtotalAmount : 0;
    const discountRefund = (selectedOrder.discountAmount || 0) * ratio;
    const taxRefund = (selectedOrder.taxAmount || 0) * ratio;
    return subtotalRefund - discountRefund + taxRefund;
  };

  const executePartialRefund = async () => {
    if (!selectedOrder) return;
    const toRefund = refundItems.filter((ri) => ri.refundQty > 0);
    if (toRefund.length === 0) {
      showError('يرجى اختيار صنف واحد على الأقل للاسترجاع');
      return;
    }

    const totalRefundAmount = calculateRefundTotal();

    // Trigger custom Confirmation instead of native window.confirm
    setConfirmConfig({
      isOpen: true,
      title: 'تأكيد عملية الاسترجاع',
      message: `تأكيد استرجاع بقيمة ${formatCurrency(totalRefundAmount)}؟`,
      onConfirm: async () => {
        try {
          await (db as any).transaction(
            'rw',
            db.orders,
            db.products,
            db.customers,
            db.inventory,
            db.warehouses,
            db.logs,
            db.shifts,
            db.accounts,
            db.journalEntries,
            db.batches,
            async () => {
              const mainWarehouse = await db.warehouses.filter((w) => w.isMain === true).first();
              const storedUser = localStorage.getItem('nima_user');
              const currentUser = storedUser ? JSON.parse(storedUser) : null;

              const subtotalRefund = toRefund.reduce(
                (acc, ri) => acc + (ri.item.total / ri.item.quantity) * ri.refundQty,
                0
              );
              const ratio = selectedOrder.subtotalAmount > 0 ? subtotalRefund / selectedOrder.subtotalAmount : 0;
              const discountRefund = (selectedOrder.discountAmount || 0) * ratio;
              const taxRefund = (selectedOrder.taxAmount || 0) * ratio;
              const totalRefundAmount = subtotalRefund - discountRefund + taxRefund;

              let splitDetails;
              if (selectedOrder.paymentMethod === 'split' && selectedOrder.splitDetails) {
                const cashRatio =
                  selectedOrder.totalAmount > 0 ? selectedOrder.splitDetails.cash / selectedOrder.totalAmount : 0;
                const cardRatio =
                  selectedOrder.totalAmount > 0 ? selectedOrder.splitDetails.card / selectedOrder.totalAmount : 0;
                splitDetails = {
                  cash: -totalRefundAmount * cashRatio,
                  card: -totalRefundAmount * cardRatio,
                };
              }

              const returnOrder: Order = {
                date: new Date(),
                items: toRefund.map((ri) => ({
                  ...ri.item,
                  quantity: -ri.refundQty,
                  total: -(ri.item.total / ri.item.quantity) * ri.refundQty,
                })),
                subtotalAmount: -subtotalRefund,
                discountAmount: -discountRefund,
                taxAmount: -taxRefund,
                totalAmount: -totalRefundAmount,
                paymentMethod: selectedOrder.paymentMethod,
                splitDetails,
                status: 'completed',
                fulfillmentStatus: 'served',
                isReturn: true,
                parentOrderId: selectedOrder.id,
                note: `مرتجع من فاتورة #${selectedOrder.id}. ${refundReason}`,
                orderType: selectedOrder.orderType,
                cashierName: currentUser?.name || 'مدير النظام',
                warehouseId: selectedOrder.warehouseId || mainWarehouse?.id,
              };

              await db.orders.add(returnOrder);

              for (const ri of toRefund) {
                const targetWarehouseId = selectedOrder.warehouseId || mainWarehouse?.id;
                if (!targetWarehouseId) continue;

                const product = await db.products.get(ri.item.productId);
                if (product) {
                  if (product.type === 'composite' && product.composition) {
                    // Do not re-stock cooked composite products
                  } else {
                    const matchingBatches = await db.batches
                      .where({ productId: ri.item.productId, warehouseId: targetWarehouseId })
                      .toArray();
                    const latestBatch = matchingBatches.sort(
                      (a, b) => (b.expiryDate?.getTime() || 0) - (a.expiryDate?.getTime() || 0)
                    )[0];

                    if (latestBatch) {
                      await db.batches.update(latestBatch.id!, { quantity: latestBatch.quantity + ri.refundQty });
                    } else {
                      await db.batches.add({
                        productId: ri.item.productId,
                        productName: product.name || 'Unknown',
                        warehouseId: targetWarehouseId,
                        batchNumber: 'RET-' + new Date().getTime().toString().slice(-6),
                        quantity: ri.refundQty,
                        receivedDate: new Date(),
                        costPrice: product.costPrice || 0,
                      });
                    }

                    const invItem = await db.inventory
                      .where({ warehouseId: targetWarehouseId, productId: ri.item.productId })
                      .first();
                    if (invItem) {
                      await db.inventory.update(invItem.id!, { quantity: invItem.quantity + ri.refundQty });
                    } else {
                      await db.inventory.add({
                        warehouseId: targetWarehouseId,
                        productId: ri.item.productId,
                        quantity: ri.refundQty,
                      });
                    }
                    await db.products.update(ri.item.productId, { stock: product.stock + ri.refundQty });
                  }
                }
              }

              if (selectedOrder.customerId) {
                const customer = await db.customers.get(selectedOrder.customerId);
                if (customer) {
                  const updates: any = { totalSpent: Math.max(0, (customer.totalSpent || 0) - totalRefundAmount) };
                  if (selectedOrder.paymentMethod === 'credit')
                    updates.balance = Math.max(0, (customer.balance || 0) - totalRefundAmount);
                  else if (selectedOrder.paymentMethod === 'wallet')
                    updates.walletBalance = (customer.walletBalance || 0) + totalRefundAmount;
                  await db.customers.update(selectedOrder.customerId, updates);
                }
              }

              const activeShift = await db.shifts.where('status').equals('open').first();
              if (activeShift) {
                let cashToSubtract = 0;
                let cardToSubtract = 0;
                if (selectedOrder.paymentMethod === 'cash') {
                  cashToSubtract = totalRefundAmount;
                } else if (selectedOrder.paymentMethod === 'card') {
                  cardToSubtract = totalRefundAmount;
                } else if (selectedOrder.paymentMethod === 'split' && splitDetails) {
                  cashToSubtract = Math.abs(splitDetails.cash);
                  cardToSubtract = Math.abs(splitDetails.card);
                }

                await db.shifts.update(activeShift.id!, {
                  expectedCash: Math.max(0, (activeShift.expectedCash || 0) - cashToSubtract),
                  cashSales: Math.max(0, (activeShift.cashSales || 0) - cashToSubtract),
                  cardSales: Math.max(0, (activeShift.cardSales || 0) - cardToSubtract),
                });
              }

              // Journal Reversal
              try {
                let debitAccountCode = '1010';
                if (selectedOrder.paymentMethod === 'card') debitAccountCode = '1020';
                else if (selectedOrder.paymentMethod === 'credit' || selectedOrder.paymentMethod === 'wallet')
                  debitAccountCode = '1030';

                const debitAccount = await db.accounts.where('code').equals(debitAccountCode).first();
                const revenueAccount = await db.accounts.where('code').equals('4010').first();
                const taxAccount = await db.accounts.where('code').equals('2020').first();
                const cogsAccount = await db.accounts.where('code').equals('5010').first();
                const inventoryAccount = await db.accounts.where('code').equals('1040').first();

                let totalCost = 0;
                for (const ri of toRefund) {
                  const product = await db.products.get(ri.item.productId);
                  if (product && product.costPrice && product.type !== 'composite') {
                    totalCost += product.costPrice * ri.refundQty;
                  }
                }

                if (debitAccount && revenueAccount) {
                  const lines = [];
                  const absTotal = totalRefundAmount;
                  const absRevenue = subtotalRefund - discountRefund;
                  const absTax = taxRefund;
                  const absCost = totalCost;

                  if (absRevenue > 0)
                    lines.push({
                      accountId: revenueAccount.id!,
                      accountName: revenueAccount.name,
                      debit: absRevenue,
                      credit: 0,
                      description: `استرجاع إيراد الفاتورة #${selectedOrder.id}`,
                    });
                  if (absTax > 0 && taxAccount)
                    lines.push({
                      accountId: taxAccount.id!,
                      accountName: taxAccount.name,
                      debit: absTax,
                      credit: 0,
                      description: `استرجاع ضريبة الفاتورة #${selectedOrder.id}`,
                    });

                  if (selectedOrder.paymentMethod === 'split' && splitDetails) {
                    const cashAcc = await db.accounts.where('code').equals('1010').first();
                    const bankAcc = await db.accounts.where('code').equals('1020').first();
                    if (cashAcc && splitDetails.cash !== 0)
                      lines.push({
                        accountId: cashAcc.id!,
                        accountName: cashAcc.name,
                        debit: 0,
                        credit: Math.abs(splitDetails.cash),
                        description: `نقدية - استرجاع #${selectedOrder.id}`,
                      });
                    if (bankAcc && splitDetails.card !== 0)
                      lines.push({
                        accountId: bankAcc.id!,
                        accountName: bankAcc.name,
                        debit: 0,
                        credit: Math.abs(splitDetails.card),
                        description: `بطاقة - استرجاع #${selectedOrder.id}`,
                      });
                  } else {
                    lines.push({
                      accountId: debitAccount.id!,
                      accountName: debitAccount.name,
                      debit: 0,
                      credit: absTotal,
                      description: `مدفوعات استرجاع #${selectedOrder.id}`,
                    });
                  }

                  if (absCost > 0 && cogsAccount && inventoryAccount) {
                    lines.push({
                      accountId: inventoryAccount.id!,
                      accountName: inventoryAccount.name,
                      debit: absCost,
                      credit: 0,
                      description: `مخزون استرجاع الفاتورة #${selectedOrder.id}`,
                    });
                    lines.push({
                      accountId: cogsAccount.id!,
                      accountName: cogsAccount.name,
                      debit: 0,
                      credit: absCost,
                      description: `تكلفة البضاعة المسترجعة #${selectedOrder.id}`,
                    });
                  }

                  if (lines.length > 0) {
                    await db.journalEntries.add({
                      date: new Date(),
                      reference: `RET-${selectedOrder.id}`,
                      description: `قيد استرجاع فاتورة المبيعات #${selectedOrder.id}`,
                      lines: lines,
                      totalAmount: absTotal + absCost,
                      status: 'posted',
                    });
                  }
                }
              } catch (err) {
                console.error('Failed to post return journal:', err);
              }

              const totalOriginalQty = selectedOrder.items.reduce((s, i) => s + i.quantity, 0);
              const previousReturns = await db.orders
                .filter((o) => o.parentOrderId === selectedOrder.id && o.isReturn === true)
                .toArray();
              let previouslyRefundedQty = 0;
              previousReturns.forEach((ret) => {
                ret.items.forEach((item) => {
                  previouslyRefundedQty += Math.abs(item.quantity);
                });
              });

              const totalReturnedQty = toRefund.reduce((s, r) => s + r.refundQty, 0);
              if (previouslyRefundedQty + totalReturnedQty >= totalOriginalQty) {
                await db.orders.update(selectedOrder.id!, { status: 'refunded' });
              } else {
                await db.orders.update(selectedOrder.id!, { status: 'partial_refund' });
              }

              await logActivity(
                'refund',
                `استرجاع جزئي لفاتورة #${selectedOrder.id}`,
                `قيمة: ${totalRefundAmount}`,
                totalRefundAmount,
                selectedOrder.id,
                'success'
              );
            }
          );

          success('تم تنفيذ الاسترجاع بنجاح');
          setIsRefundModalOpen(false);
          setSelectedOrder(null);
        } catch (error) {
          console.error('Refund failed', error);
          showError('فشل الاسترجاع');
        }
      },
    });
  };

  const handlePrintReport = async () => {
    const start = new Date(dateRange.start);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateRange.end);
    end.setHours(23, 59, 59, 999);

    let totalRevenue = 0;
    let totalRefunded = 0;
    let count = 0;
    const paymentMethods: Record<string, number> = {};

    await db.orders
      .where('date')
      .between(start, end)
      .each((o) => {
        totalRevenue += o.totalAmount;
        if (o.isReturn) totalRefunded += Math.abs(o.totalAmount);
        count++;
        paymentMethods[o.paymentMethod] = (paymentMethods[o.paymentMethod] || 0) + o.totalAmount;
      });

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showError('يرجى السماح بالنوافذ المنبثقة للطباعة');
      return;
    }

    const html = `
      <html dir="rtl">
      <head>
          <title>تقرير المبيعات</title>
          <style>
              body { font-family: 'Tahoma', Arial, sans-serif; padding: 20px; color: #333; }
              h1 { text-align: center; color: #1e293b; margin-bottom: 5px; }
              .date-range { text-align: center; color: #64748b; margin-bottom: 30px; font-size: 14px; }
              .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px; }
              .summary-card { border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; text-align: center; }
              .summary-card h3 { margin: 0 0 10px 0; color: #64748b; font-size: 14px; }
              .summary-card p { margin: 0; font-size: 20px; font-weight: bold; color: #0f172a; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: right; }
              th { background-color: #f8fafc; color: #475569; font-size: 14px; }
              td { font-size: 14px; }
              .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #94a3b8; }
          </style>
      </head>
      <body>
          <h1>تقرير المبيعات</h1>
          <div class="date-range">
              من: ${formatDate(start)} - إلى: ${formatDate(end)}
          </div>

          <div class="summary-grid">
              <div class="summary-card">
                  <h3>إجمالي المبيعات</h3>
                  <p>${formatCurrency(totalRevenue)}</p>
              </div>
              <div class="summary-card">
                  <h3>عدد الطلبات</h3>
                  <p>${count}</p>
              </div>
              <div class="summary-card">
                  <h3>إجمالي المرتجعات</h3>
                  <p style="color: #ef4444;">${formatCurrency(totalRefunded)}</p>
              </div>
              <div class="summary-card">
                  <h3>صافي المبيعات</h3>
                  <p style="color: #10b981;">${formatCurrency(totalRevenue - totalRefunded)}</p>
              </div>
          </div>

          <h2>تفاصيل طرق الدفع</h2>
          <table>
              <thead>
                  <tr>
                      <th>طريقة الدفع</th>
                      <th>المبلغ</th>
                  </tr>
              </thead>
              <tbody>
                  ${Object.entries(paymentMethods)
                    .map(
                      ([method, amount]) => `
                      <tr>
                          <td>${
                            method === 'cash'
                              ? 'كاش'
                              : method === 'card'
                              ? 'بطاقة ائتمان'
                              : method === 'wallet'
                              ? 'محفظة'
                              : method === 'credit'
                              ? 'آجل'
                              : method
                          }</td>
                          <td>${formatCurrency(amount)}</td>
                      </tr>
                  `
                    )
                    .join('')}
              </tbody>
          </table>

          <div class="footer">
              تم إصدار التقرير في: ${new Date().toLocaleString('ar-EG')}
          </div>
          <script>
              window.onload = () => { window.print(); window.close(); }
          </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleExportCSV = async () => {
    const start = new Date(dateRange.start);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateRange.end);
    end.setHours(23, 59, 59, 999);
    const allOrders = await db.orders.where('date').between(start, end).toArray();

    if (!allOrders.length) return;

    const headers = [
      'Order ID',
      'Date',
      'Time',
      'Customer',
      'Items Count',
      'Total',
      'Payment',
      'Status',
      'Order Type',
      'Cashier',
    ];
    const rows = allOrders.map((o) => [
      o.id,
      new Date(o.date).toLocaleDateString(),
      new Date(o.date).toLocaleTimeString(),
      o.customerId ? customerMap.get(o.customerId) || 'Unknown' : 'Walk-in',
      o.items.length,
      o.totalAmount,
      o.paymentMethod,
      o.status,
      o.orderType || 'takeaway',
      o.cashierName,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_report_${dateRange.start}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteOrder = async (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: 'تأكيد الحذف',
      message: 'هل أنت متأكد من رغبتك في حذف هذه الفاتورة بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء.',
      onConfirm: async () => {
        try {
          await db.orders.delete(id);
          setSelectedOrder(null);
          success('تم حذف الفاتورة بنجاح');
        } catch (error) {
          console.error('Error deleting order:', error);
          showError('حدث خطأ أثناء حذف الفاتورة');
        }
      },
    });
  };

  const handleSendWhatsApp = (order: Order) => {
    let customerPhone = '';
    if (order.customerId) {
      const customer = customers?.find((c) => c.id === order.customerId);
      if (customer && customer.phone) {
        customerPhone = customer.phone;
      }
    }

    const text = `فاتورة رقم #${order.id}
الإجمالي: ${formatCurrency(order.totalAmount)}
التاريخ: ${formatDate(order.date)}
شكراً لتعاملكم معنا!`;

    const encodedText = encodeURIComponent(text);
    const url = customerPhone
      ? `https://wa.me/${customerPhone}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;

    window.open(url, '_blank');
  };

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    dateRange,
    setDateRange,
    filterOrderType,
    setFilterOrderType,
    filterPaymentMethod,
    setFilterPaymentMethod,
    filterCashier,
    setFilterCashier,
    selectedOrder,
    setSelectedOrder,
    invoicePreviewOrder,
    setInvoicePreviewOrder,
    isRefundModalOpen,
    setIsRefundModalOpen,
    refundItems,
    refundReason,
    setRefundReason,
    orders,
    isLoading,
    loadMore,
    hasMore: (orders?.length || 0) < totalRecords,
    stats,
    settings,
    uniqueCashiers,
    customerMap,
    formatCurrency,
    formatDate,
    formatTime,
    openRefundModal,
    handleRefundQtyChange,
    calculateRefundTotal,
    executePartialRefund,
    handlePrintReport,
    handleExportCSV,
    handleDeleteOrder,
    handleSendWhatsApp,
    confirmConfig,
    setConfirmConfig,
  };
};
export default useOrdersState;
