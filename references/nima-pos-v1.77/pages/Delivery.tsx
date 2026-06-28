import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, Navigation } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Order, OrderItem } from '../types';
import DeliveryHeader from '../components/delivery/DeliveryHeader';
import DeliveryStats from '../components/delivery/DeliveryStats';
import DeliveryToolbar from '../components/delivery/DeliveryToolbar';
import DeliveryList from '../components/delivery/DeliveryList';
import CouriersList from '../components/delivery/CouriersList';
import DeliveryAreasList from '../components/delivery/DeliveryAreasList';
import OrderDetailsDrawer from '../components/orders/OrderDetailsDrawer';
import InvoiceModal from '../components/InvoiceModal';
import RefundModal from '../components/orders/RefundModal';
import { logActivity } from '../utils/logger';
import { useToast } from '../context/ToastContext';
import { notificationEngine } from '../services/NotificationEngine';

const Delivery: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'deliveries' | 'couriers' | 'areas'>('deliveries');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoicePreviewOrder, setInvoicePreviewOrder] = useState<Order | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundItems, setRefundItems] = useState<{item: OrderItem, refundQty: number, remainingQty: number}[]>([]);
  const [refundReason, setRefundReason] = useState('');

  // Fetch delivery orders
  const deliveries = useLiveQuery(
    () => db.orders.filter(order => order.orderType === 'delivery').toArray(),
    []
  ) || [];

  // Fetch customers
  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];

  // Fetch couriers (users with jobTitle 'مندوب' or role 'warehouse' for now)
  const couriers = useLiveQuery(
    () => db.users.filter(user => user.jobTitle === 'مندوب' || user.role === 'warehouse').toArray(),
    []
  ) || [];

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5 w-fit"><Clock className="w-3.5 h-3.5" /> قيد الانتظار</span>;
      case 'ready':
        return <span className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5 w-fit"><Navigation className="w-3.5 h-3.5" /> في الطريق</span>;
      case 'served':
        return <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 w-fit"><CheckCircle className="w-3.5 h-3.5" /> تم التوصيل</span>;
      default:
        return <span className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200 w-fit">{status || 'قيد الانتظار'}</span>;
    }
  };

  const getCourierStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit inline-flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> متاح</span>;
    } else {
      return <span className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200 w-fit inline-flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div> غير متصل</span>;
    }
  };

  const deliveriesWithCustomer = deliveries.map(delivery => {
    const customer = customers.find(c => c.id === delivery.customerId);
    return {
      ...delivery,
      customerName: customer?.name || 'عميل غير مسجل',
      customerPhone: customer?.phone || 'لا يوجد',
      customerAddress: customer?.address || delivery.note || 'لا يوجد عنوان'
    };
  });

  const filteredDeliveries = deliveriesWithCustomer.filter(d => 
    d.id?.toString().includes(searchQuery) ||
    d.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.customerPhone.includes(searchQuery)
  );

  const filteredCouriers = couriers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id?.toString().includes(searchQuery)
  );

  const totalDeliveries = deliveries.length;
  const deliveredCount = deliveries.filter(d => d.fulfillmentStatus === 'served').length;
  const pendingCount = deliveries.filter(d => d.fulfillmentStatus === 'pending').length;
  const availableCouriersCount = couriers.filter(c => c.isActive).length;

  const handleAssignCourier = async (orderId: number, courierId: number) => {
    try {
      const courierVehicle = await db.vehicles.filter(v => v.assignedDriverId === courierId).first();
      if (courierVehicle && courierVehicle.status === 'maintenance') {
        showToast(`لا يمكن تعيين الطلب: المندوب مسند لمركبة (${courierVehicle.plateNumber}) في وضع الصيانة`, 'error');
        return;
      }
      await db.orders.update(orderId, { courierId, fulfillmentStatus: 'ready' });
      showToast('تم تعيين المندوب للطلب', 'success');
    } catch (error) {
      console.error('Failed to assign courier:', error);
      showToast('حدث خطأ أثناء التعيين', 'error');
    }
  };

  const handleUpdateStatus = async (orderId: number, status: 'pending' | 'ready' | 'served') => {
    try {
      await db.orders.update(orderId, { fulfillmentStatus: status });
      
      const order = await db.orders.get(orderId);
      if (order && order.deliveryPhone && status === 'ready') {
          // Send SMS to customer when order is out for delivery
          notificationEngine.sendCustomerSMS(
              order.deliveryPhone, 
              `مرحباً! طلبك رقم #${orderId} في الطريق إليك مع المندوب. 🚚`
          );
      }

      showToast('تم تحديث حالة الطلب', 'success');
    } catch (error) {
      console.error('Failed to update status:', error);
      showToast('حدث خطأ أثناء التحديث', 'error');
    }
  };

  const handleSettleCourier = async (courierId: number, amountToSettle: number) => {
    if (amountToSettle <= 0) return;
    if (window.confirm(`هل أنت متأكد من تصفية المبالغ المحصلة المتبقية (${formatCurrency(amountToSettle)}) للمندوب؟`)) {
      try {
        const orderIdsToSettle = deliveries
          .filter(d => d.courierId === courierId && d.fulfillmentStatus === 'served' && d.paymentMethod === 'cash' && !d.courierSettled)
          .map(d => d.id!);

        await db.transaction('rw', db.orders, async () => {
          for (const id of orderIdsToSettle) {
            await db.orders.update(id, { courierSettled: true });
          }
        });
        showToast('تمت تصفية حساب المندوب بنجاح', 'success');
      } catch (error) {
        console.error('Error settling courier:', error);
        showToast('حدث خطأ أثناء تصفية الحساب', 'error');
      }
    }
  };

  const handleSettleAllCouriers = async () => {
    const totalToSettle = deliveries
          .filter(d => d.fulfillmentStatus === 'served' && d.paymentMethod === 'cash' && !d.courierSettled)
          .reduce((sum, d) => sum + d.totalAmount, 0);

    if (totalToSettle <= 0) {
       showToast('لا توجد مبالغ مستحقة للتصفية حالياً', 'info');
       return;
    }

    if (window.confirm(`هل أنت متأكد من تصفية جميع المبالغ المحصلة المتبقية (${formatCurrency(totalToSettle)}) لجميع المندوبين؟`)) {
      try {
        const orderIdsToSettle = deliveries
          .filter(d => d.fulfillmentStatus === 'served' && d.paymentMethod === 'cash' && !d.courierSettled)
          .map(d => d.id!);

        await db.transaction('rw', db.orders, async () => {
          for (const id of orderIdsToSettle) {
            await db.orders.update(id, { courierSettled: true });
          }
        });
        showToast('تمت تصفية حسابات جميع المندوبين بنجاح', 'success');
      } catch (error) {
        console.error('Error settling all couriers:', error);
        showToast('حدث خطأ أثناء تصفية الحسابات', 'error');
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount);
  };

  const openRefundModal = async () => {
    if (selectedOrder) {
      try {
        const orderWithItems = await db.orders.get(selectedOrder.id!);
        if (orderWithItems) {
          // Calculate remaining quantity for each item
          const allOrders = await db.orders.toArray();
          const remainingItems = await Promise.all(orderWithItems.items.map(async (item) => {
            // Find all returns for this order
            const returns = allOrders.filter(o => o.parentOrderId === orderWithItems.id!);
            let returnedQty = 0;
            returns.forEach(ret => {
              const returnedItem = ret.items.find(ri => ri.productId === item.productId);
              if (returnedItem) {
                returnedQty += returnedItem.quantity;
              }
            });
            return {
              item,
              refundQty: 0,
              remainingQty: item.quantity - returnedQty
            };
          }));
          
          setRefundItems(remainingItems.filter(ri => ri.remainingQty > 0));
          setIsRefundModalOpen(true);
        }
      } catch (error) {
        console.error("Error fetching order items for refund:", error);
        showToast("حدث خطأ أثناء جلب بيانات الطلب للاسترجاع.", 'error');
      }
    }
  };

  const handleRefundQtyChange = (idx: number, delta: number) => {
    setRefundItems(prev => prev.map((ri, i) => {
      if (i === idx) {
        const newQty = Math.max(0, Math.min(ri.remainingQty, ri.refundQty + delta));
        return { ...ri, refundQty: newQty };
      }
      return ri;
    }));
  };

  const calculateRefundTotal = () => {
    return refundItems.reduce((sum, ri) => sum + (ri.item.price * ri.refundQty), 0);
  };

  const handleRefund = async () => {
    if (!selectedOrder) return;

    try {
      const itemsToRefund = refundItems.filter(ri => ri.refundQty > 0);
      
      if (itemsToRefund.length === 0) {
        showToast('الرجاء تحديد كمية للاسترجاع', 'warning');
        return;
      }

      const refundTotal = calculateRefundTotal();

      // Create a new return order
      const returnOrder: Order = {
        ...selectedOrder,
        id: undefined, // Let Dexie generate a new ID
        parentOrderId: selectedOrder.id,
        isReturn: true,
        status: 'refunded',
        totalAmount: refundTotal,
        subtotalAmount: refundTotal,
        taxAmount: 0, // Simplified for now
        discountAmount: 0,
        items: itemsToRefund.map(ri => ({
          ...ri.item,
          quantity: ri.refundQty,
          total: ri.item.price * ri.refundQty
        })),
        date: new Date(),
        paymentMethod: selectedOrder.paymentMethod,
        cashierName: selectedOrder.cashierName,
        note: refundReason
      };

      await db.transaction('rw', db.orders, db.products, async () => {
        // 1. Add return order
        await db.orders.add(returnOrder);

        // 2. Update original order status if fully refunded
        const isFullyRefunded = refundItems.every(ri => ri.remainingQty === ri.refundQty);
        if (isFullyRefunded) {
          await db.orders.update(selectedOrder.id!, { status: 'refunded' });
        } else {
           await db.orders.update(selectedOrder.id!, { status: 'partial_refund' });
        }

        // 3. Update inventory
        for (const ri of itemsToRefund) {
          const product = await db.products.get(ri.item.productId);
          if (product) {
            await db.products.update(ri.item.productId, {
              stock: product.stock + ri.refundQty
            });
          }
        }
      });

      await logActivity(
        'refund',
        `تم إرجاع طلب توصيل رقم #${selectedOrder.id} بقيمة ${formatCurrency(refundTotal)}`
      );

      setIsRefundModalOpen(false);
      setSelectedOrder(null);
      setRefundReason('');
      showToast('تم استرجاع الطلب بنجاح', 'success');

    } catch (error) {
      console.error('Error processing refund:', error);
      showToast('حدث خطأ أثناء معالجة الاسترجاع', 'error');
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
      try {
        await db.orders.delete(id);
        setSelectedOrder(null);
        showToast('تم حذف الطلب بنجاح', 'success');
      } catch (error) {
        console.error('Error deleting order:', error);
        showToast('حدث خطأ أثناء حذف الطلب', 'error');
      }
    }
  };

  const handleSendWhatsApp = (order: Order) => {
    if (!order.deliveryPhone) {
      showToast('لا يوجد رقم هاتف للعميل', 'warning');
      return;
    }
    
    const message = `مرحباً،
طلبك رقم #${order.id?.toString().padStart(5, '0')}
الإجمالي: ${formatCurrency(order.totalAmount)}
حالة الطلب: ${order.status === 'completed' ? 'تم التوصيل' : 'قيد التوصيل'}
شكراً لتعاملك معنا.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${order.deliveryPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      <DeliveryHeader onNewDelivery={() => navigate('/pos', { state: { orderType: 'delivery' } })} onSettleAllCouriers={handleSettleAllCouriers} />

      <DeliveryStats 
        totalDeliveries={totalDeliveries}
        deliveredCount={deliveredCount}
        pendingCount={pendingCount}
        availableCouriersCount={availableCouriersCount}
        totalCouriers={couriers.length}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <DeliveryToolbar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onRefresh={() => {
            // Optional: force reload logic if any, but since we rely on real-time dexie hooks it's just visual.
            showToast('تم تحديث البيانات', 'success');
          }}
        />

        {activeTab === 'deliveries' && (
          <DeliveryList 
            deliveries={filteredDeliveries}
            couriers={couriers}
            getStatusBadge={getStatusBadge}
            onAssignCourier={handleAssignCourier}
            onUpdateStatus={handleUpdateStatus}
            onViewOrder={(order) => setSelectedOrder(order)}
          />
        )}

        {activeTab === 'couriers' && (
          <CouriersList 
            couriers={filteredCouriers}
            deliveries={deliveries}
            getCourierStatusBadge={getCourierStatusBadge}
            onSettleCourier={handleSettleCourier}
          />
        )}

        {activeTab === 'areas' && (
          <DeliveryAreasList searchQuery={searchQuery} />
        )}
      </div>

      {/* Order Details Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-end">
          <OrderDetailsDrawer
            selectedOrder={selectedOrder}
            setSelectedOrder={setSelectedOrder}
            setInvoicePreviewOrder={setInvoicePreviewOrder}
            openRefundModal={openRefundModal}
            handleDeleteOrder={handleDeleteOrder}
            handleSendWhatsApp={handleSendWhatsApp}
            formatCurrency={formatCurrency}
          />
        </div>
      )}

      {/* Invoice Modal */}
      {invoicePreviewOrder && (
        <InvoiceModal
          order={invoicePreviewOrder}
          onClose={() => setInvoicePreviewOrder(null)}
        />
      )}

      {/* Refund Modal */}
      {isRefundModalOpen && (
        <RefundModal 
          refundItems={refundItems}
          refundReason={refundReason}
          setRefundReason={setRefundReason}
          handleRefundQtyChange={handleRefundQtyChange}
          calculateRefundTotal={calculateRefundTotal}
          executePartialRefund={handleRefund}
          setIsRefundModalOpen={setIsRefundModalOpen}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
};

export default Delivery;

