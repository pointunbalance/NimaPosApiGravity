import { AccountingEngine } from '../services/AccountingEngine';
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { EcommerceOrder } from '../types';

import EcommerceOrdersHeader from '../components/ecommerce-orders/EcommerceOrdersHeader';
import EcommerceOrdersStats from '../components/ecommerce-orders/EcommerceOrdersStats';
import EcommerceOrdersToolbar from '../components/ecommerce-orders/EcommerceOrdersToolbar';
import EcommerceOrdersList from '../components/ecommerce-orders/EcommerceOrdersList';
import EcommerceOrderModal from '../components/ecommerce-orders/EcommerceOrderModal';

const EcommerceOrders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<EcommerceOrder | null>(null);
  const [formData, setFormData] = useState<Partial<EcommerceOrder>>({
    orderNumber: '',
    platform: 'shopify',
    customerName: '',
    total: 0,
    status: 'pending',
    createdAt: new Date()
  });

  const orders = useLiveQuery(() => db.ecommerceOrders.toArray());

  const handleSave = async () => {
    try {
      await (db as any).transaction('rw', db.ecommerceOrders, db.shifts, db.journalEntries, db.accounts, async () => {
        if (editingOrder?.id) {
          await db.ecommerceOrders.update(editingOrder.id, formData as any);
        } else {
          const newOrderId = await db.ecommerceOrders.add(formData as EcommerceOrder);
          
          if (formData.total && formData.total > 0) {
            const activeShift = await db.shifts.where('status').equals('open').first();
            if (activeShift) {
              await db.shifts.update(activeShift.id!, {
                expectedCash: (activeShift.expectedCash || 0) + formData.total,
                cashSales: (activeShift.cashSales || 0) + formData.total
              });
            }

            try {
              const cashAccount = await db.accounts.where('code').equals('1010').first();
              const revenueAccount = await db.accounts.where('code').equals('4010').first();
              
              if (cashAccount && revenueAccount) {
                await AccountingEngine.postEntry({
                  date: new Date(),
                  reference: `ECOM-${newOrderId}`,
                  description: `مبيعات تجارة إلكترونية طلب ${formData.orderNumber}`,
                  lines: [
                    { accountId: cashAccount.id!, accountName: cashAccount.name, debit: formData.total, credit: 0, description: `متحصلات طلبات منصة خارجية` },
                    { accountId: revenueAccount.id!, accountName: revenueAccount.name, debit: 0, credit: formData.total, description: `إيراد تجارة إلكترونية` }
                  ],
                  });
              }
            } catch (err) {
              console.error("Failed to post journal entry for ecommerce order:", err);
            }
          }
        }
      });
      setIsModalOpen(false);
      setEditingOrder(null);
      setFormData({
        orderNumber: '',
        platform: 'shopify',
        customerName: '',
        total: 0,
        status: 'pending',
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  const handleEdit = (order: EcommerceOrder) => {
    setEditingOrder(order);
    setFormData(order);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
      await db.ecommerceOrders.delete(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'shipped': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'refunded': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered': return 'تم التوصيل';
      case 'shipped': return 'تم الشحن';
      case 'processing': return 'قيد المعالجة';
      case 'pending': return 'قيد الانتظار';
      case 'cancelled': return 'ملغي';
      case 'refunded': return 'مسترجع';
      default: return status;
    }
  };

  const filteredOrders = orders?.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = platformFilter === 'all' || order.platform === platformFilter;
    return matchesSearch && matchesPlatform;
  }) || [];

  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders?.filter(o => new Date(o.createdAt).toISOString().split('T')[0] === todayStr).length || 0;
  const pendingOrders = orders?.filter(o => o.status === 'pending' || o.status === 'processing').length || 0;
  const shippedOrders = orders?.filter(o => o.status === 'shipped').length || 0;
  const deliveredOrders = orders?.filter(o => o.status === 'delivered').length || 0;

  return (
    <div className="space-y-6 p-6">
      <EcommerceOrdersHeader 
        onNewClick={() => {
          setEditingOrder(null);
          setFormData({
            orderNumber: '',
            platform: 'shopify',
            customerName: '',
            total: 0,
            status: 'pending',
            createdAt: new Date()
          });
          setIsModalOpen(true);
        }}
      />

      <EcommerceOrdersStats 
        todayOrders={todayOrders}
        pendingOrders={pendingOrders}
        shippedOrders={shippedOrders}
        deliveredOrders={deliveredOrders}
      />

      <EcommerceOrdersToolbar 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        platformFilter={platformFilter}
        setPlatformFilter={setPlatformFilter}
      />

      <EcommerceOrdersList 
        orders={filteredOrders}
        getStatusColor={getStatusColor}
        getStatusText={getStatusText}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {isModalOpen && (
        <EcommerceOrderModal 
          editingOrder={editingOrder}
          formData={formData}
          setFormData={setFormData}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default EcommerceOrders;
