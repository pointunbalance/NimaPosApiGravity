import { AccountingEngine } from '../services/AccountingEngine';
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { MaintenanceOrder, MaintenanceStatus, MaintenancePart } from '../types';
import { Wrench, Search, AlertCircle, CheckCircle, Clock, X, MessageCircle, Edit, Trash2, Printer, ChevronDown } from 'lucide-react';
import MaintenanceHeader from '../components/maintenance/MaintenanceHeader';
import MaintenanceToolbar from '../components/maintenance/MaintenanceToolbar';
import MaintenanceList from '../components/maintenance/MaintenanceList';
import MaintenanceModal from '../components/maintenance/MaintenanceModal';
import ConfirmModal from '../components/ui/ConfirmModal';

const statusMap: Record<MaintenanceStatus, { label: string; color: string; icon: React.ReactNode }> = {
  received: { label: 'تم الاستلام', color: 'bg-blue-100 text-blue-800', icon: <Clock className="w-4 h-4" /> },
  diagnosing: { label: 'جاري الفحص', color: 'bg-purple-100 text-purple-800', icon: <Search className="w-4 h-4" /> },
  waiting_parts: { label: 'بانتظار قطع غيار', color: 'bg-orange-100 text-orange-800', icon: <AlertCircle className="w-4 h-4" /> },
  repairing: { label: 'جاري الصيانة', color: 'bg-yellow-100 text-yellow-800', icon: <Wrench className="w-4 h-4" /> },
  ready: { label: 'جاهز للتسليم', color: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle className="w-4 h-4" /> },
  delivered: { label: 'تم التسليم', color: 'bg-slate-100 text-slate-800', icon: <CheckCircle className="w-4 h-4" /> },
  cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-800', icon: <X className="w-4 h-4" /> },
  waiting_approval: { label: 'بانتظار موافقة العميل', color: 'bg-rose-100 text-rose-800', icon: <MessageCircle className="w-4 h-4" /> },
  abandoned: { label: 'مهمل / مصادر', color: 'bg-stone-100 text-stone-800', icon: <AlertCircle className="w-4 h-4" /> },
};

const Maintenance: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<MaintenanceOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<MaintenanceStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [orderParts, setOrderParts] = useState<MaintenancePart[]>([]);
  const [newPart, setNewPart] = useState<Partial<MaintenancePart>>({ name: '', quantity: 1, price: 0 });
  const [deleteOrderId, setDeleteOrderId] = useState<number | null>(null);

  const orders = useLiveQuery(() => db.maintenanceOrders.orderBy('date').reverse().toArray()) || [];
  const customers = useLiveQuery(() => db.customers.toArray()) || [];
  const users = useLiveQuery(() => db.users.toArray()) || [];

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm) ||
      order.deviceModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.deviceSerial && order.deviceSerial.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    
    const matchesDate = !dateFilter || new Date(order.date).toISOString().split('T')[0] === dateFilter;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Stats calculation
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => ['received', 'diagnosing', 'waiting_parts', 'repairing'].includes(o.status)).length;
  const readyOrders = orders.filter(o => o.status === 'ready').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.actualCost || 0), 0);

  const handleSave = async (data: any) => {
    const orderData: Partial<MaintenanceOrder> = {
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      deviceType: data.deviceType,
      deviceModel: data.deviceModel,
      deviceSerial: data.deviceSerial,
      devicePassword: data.devicePassword,
      issueDescription: data.issueDescription,
      deviceAttachments: data.deviceAttachments,
      expectedCost: data.expectedCost || 0,
      actualCost: data.actualCost || 0,
      deposit: data.deposit || 0,
      status: data.status || 'received',
      technicianName: data.technicianName,
      notes: data.notes,
    };

    // Find or create customer
    let customerId = editingOrder?.customerId;
    if (!customerId) {
      const existingCustomer = customers.find(c => c.phone === orderData.customerPhone);
      if (existingCustomer && existingCustomer.id) {
        customerId = existingCustomer.id;
      } else {
        customerId = await db.customers.add({
          name: orderData.customerName!,
          phone: orderData.customerPhone!,
          totalSpent: 0
        });
      }
    }

    const finalOrder: MaintenanceOrder = {
      ...orderData,
      customerId: customerId as number,
      date: editingOrder ? editingOrder.date : new Date(),
      parts: orderParts,
    } as MaintenanceOrder;

    if (editingOrder?.id) {
      finalOrder.id = editingOrder.id;
      
      const oldStatus = editingOrder.status;
      const newStatus = finalOrder.status;
      
      if (oldStatus !== newStatus) {
        if (newStatus === 'delivered' && oldStatus !== 'delivered') {
          const amountToPay = (finalOrder.actualCost || 0) - (finalOrder.deposit || 0);
          for (const part of finalOrder.parts) {
            const product = await db.products.where('name').equals(part.name).first();
            if (product && product.id) {
              await db.products.update(product.id, {
                stock: Math.max(0, (product.stock || 0) - part.quantity)
              });
            }
          }
          if (amountToPay > 0) {
            const activeShift = await db.shifts.where('status').equals('open').first();
            if (activeShift && activeShift.id) {
              await db.shifts.update(activeShift.id, {
                expectedCash: (activeShift.expectedCash || 0) + amountToPay,
                cashSales: (activeShift.cashSales || 0) + amountToPay
              });
            }
            if (finalOrder.customerId) {
              const customer = await db.customers.get(finalOrder.customerId);
              if (customer) {
                await db.customers.update(finalOrder.customerId, {
                  totalSpent: (customer.totalSpent || 0) + (finalOrder.actualCost || 0)
                });
              }
            }
          }
        } else if (oldStatus === 'delivered' && newStatus !== 'delivered') {
          const amountToPay = (editingOrder.actualCost || 0) - (editingOrder.deposit || 0);
          for (const part of editingOrder.parts) {
            const product = await db.products.where('name').equals(part.name).first();
            if (product && product.id) {
              await db.products.update(product.id, {
                stock: (product.stock || 0) + part.quantity
              });
            }
          }
          if (amountToPay > 0) {
            const activeShift = await db.shifts.where('status').equals('open').first();
            if (activeShift && activeShift.id) {
              await db.shifts.update(activeShift.id, {
                expectedCash: (activeShift.expectedCash || 0) - amountToPay,
                cashSales: (activeShift.cashSales || 0) - amountToPay
              });
            }
            if (editingOrder.customerId) {
              const customer = await db.customers.get(editingOrder.customerId);
              if (customer) {
                await db.customers.update(editingOrder.customerId, {
                  totalSpent: Math.max(0, (customer.totalSpent || 0) - (editingOrder.actualCost || 0))
                });
              }
            }
          }
        }
      } else if (oldStatus !== 'delivered' && newStatus !== 'delivered') {
        const depositDiff = (finalOrder.deposit || 0) - (editingOrder.deposit || 0);
        if (depositDiff !== 0) {
          const activeShift = await db.shifts.where('status').equals('open').first();
          if (activeShift && activeShift.id) {
            await db.shifts.update(activeShift.id, {
              expectedCash: (activeShift.expectedCash || 0) + depositDiff,
              cashSales: (activeShift.cashSales || 0) + depositDiff
            });
          }
        }
      }
      
      await db.maintenanceOrders.put(finalOrder);
    } else {
      // New order created directly as delivered? Rare but possible.
      if (finalOrder.status === 'delivered') {
        const amountToPay = (finalOrder.actualCost || 0) - (finalOrder.deposit || 0);
        for (const part of finalOrder.parts) {
          const product = await db.products.where('name').equals(part.name).first();
          if (product && product.id) {
            await db.products.update(product.id, {
              stock: Math.max(0, (product.stock || 0) - part.quantity)
            });
          }
        }
        if (amountToPay > 0) {
          const activeShift = await db.shifts.where('status').equals('open').first();
          if (activeShift && activeShift.id) {
            await db.shifts.update(activeShift.id, {
              expectedCash: (activeShift.expectedCash || 0) + amountToPay,
              cashSales: (activeShift.cashSales || 0) + amountToPay
            });
          }
          if (finalOrder.customerId) {
            const customer = await db.customers.get(finalOrder.customerId);
            if (customer) {
              await db.customers.update(finalOrder.customerId, {
                totalSpent: (customer.totalSpent || 0) + (finalOrder.actualCost || 0)
              });
            }
          }
        }
      }
      
      // Also, if deposit is added in a new order, it should be added to the shift right away
      if (finalOrder.deposit && finalOrder.deposit > 0 && finalOrder.status !== 'delivered') {
          const activeShift = await db.shifts.where('status').equals('open').first();
          if (activeShift && activeShift.id) {
            await db.shifts.update(activeShift.id, {
              expectedCash: (activeShift.expectedCash || 0) + finalOrder.deposit,
              cashSales: (activeShift.cashSales || 0) + finalOrder.deposit
            });
          }
      }
      
      await db.maintenanceOrders.add(finalOrder);
    }

    setIsModalOpen(false);
    setEditingOrder(null);
  };

  const handleDelete = async (id: number) => {
    setDeleteOrderId(id);
  };

  const confirmDelete = async () => {
    if (deleteOrderId) {
      await db.maintenanceOrders.delete(deleteOrderId);
      setDeleteOrderId(null);
    }
  };

  const openEditModal = (order: MaintenanceOrder | null) => {
    setEditingOrder(order);
    setOrderParts(order?.parts || []);
    setIsModalOpen(true);
  };

  const handleAddPart = () => {
    if (newPart.name && newPart.price !== undefined && newPart.quantity) {
      setOrderParts([...orderParts, newPart as MaintenancePart]);
      setNewPart({ name: '', quantity: 1, price: 0 });
    }
  };

  const handleRemovePart = (index: number) => {
    setOrderParts(orderParts.filter((_, i) => i !== index));
  };

  const handlePrint = (order: MaintenanceOrder) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html dir="rtl" lang="ar">
        <head>
          <title>إيصال استلام صيانة - ${order.id}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .label { font-weight: bold; color: #666; }
            .section-title { font-size: 1.2em; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 20px; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
            th { background-color: #f9f9f9; }
            .footer { margin-top: 40px; text-align: center; font-size: 0.9em; color: #777; border-top: 1px dashed #ccc; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>إيصال استلام صيانة</h2>
            <p>رقم الطلب: #${order.id}</p>
            <p>التاريخ: ${new Date(order.date).toLocaleString('ar-EG')}</p>
          </div>
          
          <div class="section-title">بيانات العميل</div>
          <div class="row"><span class="label">الاسم:</span> <span>${order.customerName}</span></div>
          <div class="row"><span class="label">رقم الهاتف:</span> <span>${order.customerPhone}</span></div>

          <div class="section-title">بيانات الجهاز</div>
          <div class="row"><span class="label">النوع:</span> <span>${order.deviceType}</span></div>
          ${order.deviceBrand ? `<div class="row"><span class="label">الشركة المصنعة:</span> <span>${order.deviceBrand}</span></div>` : ''}
          <div class="row"><span class="label">الموديل:</span> <span>${order.deviceModel}</span></div>
          ${order.deviceSerial ? `<div class="row"><span class="label">الرقم التسلسلي:</span> <span>${order.deviceSerial}</span></div>` : ''}
          
          <div class="section-title">تفاصيل الصيانة</div>
          ${order.maintenanceType ? `<div class="row"><span class="label">نوع الصيانة:</span> <span>${order.maintenanceType}</span></div>` : ''}
          ${order.specifications ? `<div class="row"><span class="label">المواصفات:</span> <span>${order.specifications}</span></div>` : ''}
          <div class="row"><span class="label">وصف العطل:</span> <span>${order.issueDescription}</span></div>
          ${order.deviceAttachments ? `<div class="row"><span class="label">المرفقات المستلمة:</span> <span>${order.deviceAttachments}</span></div>` : ''}
          
          <div class="section-title">التكلفة</div>
          <div class="row"><span class="label">التكلفة المتوقعة:</span> <span>${order.expectedCost} ج.م</span></div>
          <div class="row"><span class="label">المدفوع (عربون):</span> <span>${order.deposit} ج.م</span></div>
          
          ${order.parts && order.parts.length > 0 ? `
            <div class="section-title">قطع الغيار والخدمات</div>
            <table>
              <thead>
                <tr>
                  <th>البيان</th>
                  <th>الكمية</th>
                  <th>السعر</th>
                  <th>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                ${order.parts.map(p => `
                  <tr>
                    <td>${p.name}</td>
                    <td>${p.quantity}</td>
                    <td>${p.price}</td>
                    <td>${p.price * p.quantity}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}

          <div class="footer">
            <p>يرجى الاحتفاظ بهذا الإيصال لاستلام جهازك.</p>
            <p>شكراً لثقتكم بنا!</p>
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

  const handleStatusChange = async (id: number, newStatus: MaintenanceStatus) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    const oldStatus = order.status;
    if (oldStatus !== newStatus) {
      try {
        await (db as any).transaction('rw', db.maintenanceOrders, db.products, db.shifts, db.customers, db.journalEntries, db.accounts, async () => {
          if (newStatus === 'delivered' && oldStatus !== 'delivered') {
            const amountToPay = (order.actualCost || 0) - (order.deposit || 0);
            
            // Stock Deduction for parts and calculate cost
            let totalPartsCost = 0;
            for (const part of order.parts) {
              const product = await db.products.where('name').equals(part.name).first();
              if (product && product.id) {
                await db.products.update(product.id, {
                  stock: Math.max(0, (product.stock || 0) - part.quantity)
                });
                if (product.costPrice) {
                    totalPartsCost += (product.costPrice * part.quantity);
                }
              }
            }

            // Add revenue to Shift
            if (amountToPay > 0) {
              const activeShift = await db.shifts.where('status').equals('open').first();
              if (activeShift && activeShift.id) {
                await db.shifts.update(activeShift.id, {
                  expectedCash: (activeShift.expectedCash || 0) + amountToPay,
                  cashSales: (activeShift.cashSales || 0) + amountToPay
                });
              }
              
              // Add to Customer Spent
              if (order.customerId) {
                 const customer = await db.customers.get(order.customerId);
                 if (customer) {
                     await db.customers.update(order.customerId, {
                         totalSpent: (customer.totalSpent || 0) + (order.actualCost || 0)
                     });
                 }
              }
            }

            // Auto Accounting Integration (Journal Entry)
            try {
                const cashAccount = await db.accounts.where('code').equals('1010').first(); // النقدية
                const revenueAccount = await db.accounts.where('code').equals('4010').first(); // إيرادات الصيانة/الخدمات
                const cogsAccount = await db.accounts.where('code').equals('5010').first(); // تكلفة البضاعة المباعة
                const inventoryAccount = await db.accounts.where('code').equals('1040').first(); // المخزون
                
                if (cashAccount && revenueAccount) {
                    const lines = [];
                    // Revenue from Maintenance
                    lines.push({ accountId: cashAccount.id!, accountName: cashAccount.name, debit: order.actualCost || 0, credit: 0, description: `إيراد طلب صيانة #${order.id}` });
                    lines.push({ accountId: revenueAccount.id!, accountName: revenueAccount.name, debit: 0, credit: order.actualCost || 0, description: `إيراد صيانة - عميل ${order.customerName}` });
                    
                    // COGS for consumed parts
                    if (totalPartsCost > 0 && cogsAccount && inventoryAccount) {
                        lines.push({ accountId: cogsAccount.id!, accountName: cogsAccount.name, debit: totalPartsCost, credit: 0, description: `تكلفة قطع غيار مستخدمة بأمر الصيانة #${order.id}` });
                        lines.push({ accountId: inventoryAccount.id!, accountName: inventoryAccount.name, debit: 0, credit: totalPartsCost, description: `استهلاك مخزون قطع غيار` });
                    }

                    await AccountingEngine.postEntry({
                        date: new Date(),
                        reference: `MNTC-${order.id}`,
                        description: `إيراد طلب صيانة مکتمل #${order.id}`,
                        lines: lines,
                        });
                }
            } catch (err) {
                 console.error("Failed to post automatic journal entry for maintenance:", err);
            }
          } else if (oldStatus === 'delivered' && newStatus !== 'delivered') {
            // Reverse if accidentally marked delivered
            const amountToPay = (order.actualCost || 0) - (order.deposit || 0);

            for (const part of order.parts) {
              const product = await db.products.where('name').equals(part.name).first();
              if (product && product.id) {
                await db.products.update(product.id, {
                  stock: (product.stock || 0) + part.quantity
                });
              }
            }

            if (amountToPay > 0) {
              const activeShift = await db.shifts.where('status').equals('open').first();
              if (activeShift && activeShift.id) {
                await db.shifts.update(activeShift.id, {
                  expectedCash: (activeShift.expectedCash || 0) - amountToPay,
                  cashSales: (activeShift.cashSales || 0) - amountToPay
                });
              }
              
              if (order.customerId) {
                 const customer = await db.customers.get(order.customerId);
                 if (customer) {
                     await db.customers.update(order.customerId, {
                         totalSpent: Math.max(0, (customer.totalSpent || 0) - (order.actualCost || 0))
                     });
                 }
              }
            }
          }

          await db.maintenanceOrders.update(id, { status: newStatus });
        });
      } catch (err) {
        console.error('Failed to change status', err);
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <MaintenanceHeader onNewOrder={() => openEditModal(null)} />

      {/* Maintenance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">إجمالي الأوامر</p>
            <p className="text-2xl font-bold text-slate-800">{totalOrders}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">قيد العمل</p>
            <p className="text-2xl font-bold text-slate-800">{pendingOrders}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">جاهز للتسليم</p>
            <p className="text-2xl font-bold text-slate-800">{readyOrders}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">الإيرادات (تم التسليم)</p>
            <p className="text-2xl font-bold text-slate-800">{totalRevenue.toLocaleString()} ج.م</p>
          </div>
        </div>
      </div>

      <MaintenanceToolbar 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        statusMap={statusMap}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
      />

      <MaintenanceList 
        orders={filteredOrders}
        statusMap={statusMap}
        onEdit={openEditModal}
        onDelete={handleDelete}
        onPrint={handlePrint}
        onStatusChange={handleStatusChange}
      />

      {isModalOpen && (
        <MaintenanceModal 
          editingOrder={editingOrder}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          statusMap={statusMap}
          orderParts={orderParts}
          newPart={newPart}
          setNewPart={setNewPart}
          handleAddPart={handleAddPart}
          handleRemovePart={handleRemovePart}
          users={users}
        />
      )}

      <ConfirmModal
        isOpen={deleteOrderId !== null}
        title="تأكيد الحذف"
        message="هل أنت متأكد من حذف أمر الصيانة هذا؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOrderId(null)}
        confirmText="حذف"
      />
    </div>
  );
};

export default Maintenance;
