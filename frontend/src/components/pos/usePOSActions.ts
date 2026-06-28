import { useState, Dispatch, SetStateAction } from 'react';
import { db } from '../../db';
import { SalesService } from '../../services/SalesService';
import { printQueue } from '../../services/PrintQueueService';
import { generateReferenceNumber } from '../../utils/generateReference';
import { hardwareService } from '../../utils/hardware';
import { logActivity } from '../../utils/logger';
import { CartItem, Customer, User, Order } from '../../types';

export const usePOSActions = (
  cart: CartItem[],
  handleSetCart: (cart: CartItem[]) => void,
  totals: any,
  isWholesale: boolean,
  isRefundMode: boolean,
  setIsRefundMode: Dispatch<SetStateAction<boolean>>,
  settings: any,
  customers: Customer[] | undefined,
  users: User[] | undefined,
  activeShifts: any[] | undefined,
  activeHeldOrderId: number | null,
  setActiveHeldOrderId: Dispatch<SetStateAction<number | null>>,
  selectedCustomerId: number | null,
  setSelectedCustomerId: Dispatch<SetStateAction<number | null>>,
  selectedSalespersonId: number | null,
  setSelectedSalespersonId: Dispatch<SetStateAction<number | null>>,
  selectedWarehouseId: number | null,
  setSelectedWarehouseId: Dispatch<SetStateAction<number | null>>,
  orderType: 'takeaway' | 'dine-in' | 'delivery' | 'direct' | 'receive' | 'deliver' | 'maintenance',
  setOrderType: Dispatch<SetStateAction<'takeaway' | 'dine-in' | 'delivery' | 'direct' | 'receive' | 'deliver' | 'maintenance'>>,
  promoCode: string,
  setPromoCode: Dispatch<SetStateAction<string>>,
  delivery: { address: string; phone: string; fee: number },
  setDelivery: Dispatch<SetStateAction<{ address: string; phone: string; fee: number }>>,
  maintenance: { serial: string; issue: string; attachments: string; dueDate: string },
  setMaintenance: Dispatch<SetStateAction<{ serial: string; issue: string; attachments: string; dueDate: string }>>,
  success: (msg: string) => void,
  showError: (msg: string) => void
) => {
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  // Delivery & Service Options
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  // Payment/Checkout Modal States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProformaInvoiceOpen, setIsProformaInvoiceOpen] = useState(false);
  const [isReservation, setIsReservation] = useState(false);
  const [reservationDueDate, setReservationDueDate] = useState<string>('');
  const [reservationDeliveredItems, setReservationDeliveredItems] = useState<{ productId: number; quantity: number }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'credit' | 'wallet' | 'split'>('cash');
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [tipAmount, setTipAmount] = useState<number>(0); 
  const [orderNote, setOrderNote] = useState('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [giftCardCode, setGiftCardCode] = useState('');
  const [giftCardAmount, setGiftCardAmount] = useState<number>(0);
  const [splitCash, setSplitCash] = useState<number>(0);
  const [splitCard, setSplitCard] = useState<number>(0);
  const [heldOrderDetailToDelete, setHeldOrderDetailToDelete] = useState<number | null>(null);

  const handleOpenCashDrawer = async () => {
    try {
      await hardwareService.openCashDrawer();
      await logActivity('security', 'Opened Cash Drawer Manually');
      success('تم فتح درج الكاشير');
    } catch {
      showError('فشل في فتح درج الكاشير. تأكد من اتصال الطابعة.');
    }
  };

  const initiatePayment = (selectedUser: number | null) => {
    if (cart.length === 0) return;
    if (!selectedUser) { showError('الرجاء اختيار الموظف'); return; }
    if (orderType === 'dine-in' && !selectedTable) { showError('يرجى اختيار الطاولة'); return; }
    if (!activeShifts || activeShifts.length === 0) {
      showError('الرجاء فتح وردية جديدة للدرج أولاً');
      return;
    }
    setAmountReceived(totals.total); 
    setPaymentMethod('cash'); 
    setSplitCash(0); 
    setSplitCard(0);
    setTipAmount(0); 
    setIsReservation(false);
    setReservationDueDate('');
    setReservationDeliveredItems(cart.map(item => ({ productId: item.id || 0, quantity: 0 })));
    setIsPaymentModalOpen(true); 
    setCheckoutError(null);
  };

  const handleFastCash = async (selectedUser: number | null) => {
    if (cart.length === 0 || !selectedUser) return;
    if (orderType === 'dine-in' && !selectedTable) { showError('يرجى اختيار الطاولة'); return; }
    if (!selectedWarehouseId) { showError("لم يتم تحديد مخزن للسحب منه"); return; }
    if (!activeShifts || activeShifts.length === 0) {
      showError('الرجاء فتح وردية جديدة للدرج أولاً');
      return;
    }
    try {
      const user = users?.find(u => u.id === selectedUser);
      if (!user) throw new Error("المستخدم غير موجود");
      const ref = await generateReferenceNumber('orders', 'POS');
      const orderId = await SalesService.processSale({
        referenceNumber: ref,
        cart,
        totals,
        paymentMethod: 'cash',
        customerId: selectedCustomerId,
        user,
        settings,
        note: orderNote,
        orderType,
        tableNumber: orderType === 'dine-in' && selectedTable ? selectedTable : undefined,
        tipAmount: 0,
        warehouseId: selectedWarehouseId,
        salespersonId: selectedSalespersonId || undefined,
        serviceChargeAmount: totals.serviceChargeAmount,
        deliveryAddress: orderType === 'delivery' ? delivery.address : undefined,
        deliveryPhone: orderType === 'delivery' ? delivery.phone : undefined,
        deliveryFee: orderType === 'delivery' ? delivery.fee : undefined
      });
      const savedOrder = await db.orders.get(orderId);
      if (savedOrder) {
        setLastOrder(savedOrder);
        if (settings?.autoPrint) printQueue.addJob({ type: 'receipt', order: savedOrder, settings });
      }
      if (orderType === 'dine-in' && selectedTable) {
        await db.diningTables.update(Number(selectedTable), { status: 'available' });
      }
      if (activeHeldOrderId) {
        await db.heldOrders.delete(activeHeldOrderId);
        setActiveHeldOrderId(null);
      }
      success(`تمت العملية بنجاح! فاتورة #${orderId}`);
      handleSetCart([]);
      setOrderNote('');
      setSelectedTable(null);
      if (isRefundMode) setIsRefundMode(false);
    } catch (err: any) {
      showError(err.message || "حدث خطأ أثناء حفظ الفاتورة");
    }
  };

  const handleFinalizeCheckout = async (selectedUser: number | null, loyaltyPointsUsed: number) => {
    const selectedCustomer = customers?.find(c => c.id === selectedCustomerId);
    if (!selectedWarehouseId) { setCheckoutError("لم يتم تحديد مخزن للسحب منه"); return; }
    if (!users) { setCheckoutError("خطأ في بيانات المستخدم"); return; }
    
    if (paymentMethod === 'credit' || isReservation) {
      if (!selectedCustomerId || !selectedCustomer || selectedCustomer.name === 'زبون عام') {
        setCheckoutError(paymentMethod === 'credit' ? "لا يمكن إتمام البيع بالآجل إلا لعميل مسجل ومحدد." : "لا يمكن حجز البضاعة مؤجلاً إلا لعميل مسجل ومحدد.");
        return;
      }
    }
    if (paymentMethod === 'cash' && !isRefundMode && amountReceived < totals.total) {
      setCheckoutError("المبلغ المدفوع أقل من الإجمالي"); return;
    }
    try {
      const user = users.find(u => u.id === selectedUser);
      if (!user) throw new Error("المستخدم غير موجود");
      const ref = await generateReferenceNumber('orders', 'POS');
      const orderId = await SalesService.processSale({
        referenceNumber: ref,
        cart,
        totals,
        paymentMethod,
        splitDetails: paymentMethod === 'split' ? { cash: splitCash, card: splitCard } : undefined,
        customerId: selectedCustomerId,
        user,
        settings,
        note: orderNote,
        orderType: isReservation ? 'reservation' : orderType,
        tableNumber: orderType === 'dine-in' && selectedTable ? selectedTable : undefined,
        tipAmount: paymentMethod === 'card' ? tipAmount : 0,
        warehouseId: selectedWarehouseId,
        salespersonId: selectedSalespersonId || undefined,
        serviceChargeAmount: totals.serviceChargeAmount,
        deliveryAddress: orderType === 'delivery' ? delivery.address : undefined,
        deliveryPhone: orderType === 'delivery' ? delivery.phone : undefined,
        deliveryFee: orderType === 'delivery' ? delivery.fee : undefined,
        dueDate: paymentMethod === 'credit' && maintenance.dueDate ? new Date(maintenance.dueDate) : undefined,
        deviceSerial: ['receive', 'maintenance'].includes(orderType) ? maintenance.serial : undefined,
        issueDescription: ['receive', 'maintenance'].includes(orderType) ? maintenance.issue : undefined,
        deviceAttachments: ['receive', 'maintenance'].includes(orderType) ? maintenance.attachments : undefined,
        loyaltyPointsUsed: loyaltyPointsUsed > 0 ? loyaltyPointsUsed : undefined,
        paidAmount: paymentMethod === 'credit' ? amountReceived : undefined,
        giftCardCode: giftCardCode || undefined,
        giftCardAmount: giftCardAmount > 0 ? giftCardAmount : undefined,
        isReservation: isReservation || undefined,
        reservationDetails: isReservation ? {
          depositAmount: amountReceived,
          remainingAmount: totals.total - amountReceived,
          dueDate: reservationDueDate || undefined,
          deliveredItems: reservationDeliveredItems
        } : undefined
      } as any);

      const savedOrder = await db.orders.get(orderId);
      if (savedOrder) {
        setLastOrder(savedOrder);
        if (settings?.autoPrint) printQueue.addJob({ type: 'receipt', order: savedOrder, settings });
      }
      if (orderType === 'dine-in' && selectedTable) {
        await db.diningTables.update(Number(selectedTable), { status: 'available' });
      }
      if (activeHeldOrderId) {
        await db.heldOrders.delete(activeHeldOrderId);
        setActiveHeldOrderId(null);
      }
      success(`تمت العملية بنجاح! فاتورة #${orderId}`);
      handleSetCart([]);
      setOrderNote('');
      setSelectedTable(null);
      setOrderType('takeaway');
      setSelectedCustomerId(null);
      setIsPaymentModalOpen(false);
      setIsRefundMode(false);
    } catch (error: any) {
      setCheckoutError("فشلت عملية الدفع: " + (error.message || "خطأ غير معروف"));
    }
  };

  const handleCheckoutWholesale = async (selectedUser: number | null, data: any) => {
    if (cart.length === 0 || !selectedUser) return;
    if (!selectedWarehouseId) { showError("لم يتم تحديد مخزن للسحب منه"); return; }
    if (!activeShifts || activeShifts.length === 0) {
      showError('الرجاء فتح وردية جديدة للدرج أولاً');
      return;
    }
    try {
      const user = users?.find(u => u.id === selectedUser);
      if (!user) throw new Error("المستخدم غير موجود");
      const ref = await generateReferenceNumber('orders', 'POS');
      const paymentMethod = data.paymentTerms === 'immediate' ? 'cash' : 'credit';

      const orderId = await SalesService.processSale({
        referenceNumber: ref,
        cart,
        totals,
        paymentMethod,
        customerId: selectedCustomerId,
        user,
        settings,
        note: orderNote,
        orderType: 'direct',
        warehouseId: selectedWarehouseId,
        salespersonId: selectedSalespersonId || undefined,
        dueDate: paymentMethod === 'credit' ? new Date(Date.now() + Number(data.paymentTerms) * 24 * 60 * 60 * 1000) : undefined,
        paidAmount: paymentMethod === 'credit' ? data.downPayment : undefined,
        journalLinesOverride: data.journalLines,
        costCenterId: Number(data.costCenter) || undefined,
      } as any);

      const savedOrder = await db.orders.get(orderId);
      if (savedOrder) {
        setLastOrder(savedOrder);
        if (settings?.autoPrint) printQueue.addJob({ type: 'receipt', order: savedOrder, settings });
      }
      if (activeHeldOrderId) {
        await db.heldOrders.delete(activeHeldOrderId);
        setActiveHeldOrderId(null);
      }
      success(`تم ترحيل مبيعات الجملة بنجاح! رقم الحركة #${orderId}`);
      handleSetCart([]);
      setOrderNote('');
      if (isRefundMode) setIsRefundMode(false);
    } catch (err: any) {
      showError(err.message || "حدث خطأ أثناء حفظ الفاتورة");
    }
  };

  const addCustomItem = (name: string, price: number) => {
    if (!price || price <= 0) return;
    const finalPrice = isRefundMode ? -price : price;
    const newItem: CartItem = { 
      id: Date.now(), 
      name: name || 'مبلغ حر', 
      price: Math.abs(finalPrice), 
      category: 'مخصص', 
      stock: 999999, 
      image: '', 
      type: 'simple', 
      quantity: isRefundMode ? -1 : 1,
      cartItemId: crypto.randomUUID(),
      itemDiscount: 0
    };
    handleSetCart([...cart, newItem]);
  };

  const handleHoldOrder = async (clearCart = true) => {
    if (cart.length === 0) {
      if (activeHeldOrderId) {
        await db.heldOrders.delete(activeHeldOrderId);
        if (clearCart) setActiveHeldOrderId(null);
      }
      return;
    }
    const payload = {
      date: new Date(), 
      items: cart, 
      customerId: selectedCustomerId || undefined, 
      note: orderNote,
      orderType: orderType,
      tableId: selectedTable
    };
    if (activeHeldOrderId) {
      await db.heldOrders.update(activeHeldOrderId, payload);
    } else {
      const id = await db.heldOrders.add(payload);
      if (!clearCart) setActiveHeldOrderId(id as number);
    }
    if (orderType === 'dine-in' && selectedTable) {
      await db.diningTables.update(Number(selectedTable), { status: 'occupied' });
    }
    if (clearCart) {
      handleSetCart([]);
      setOrderNote('');
      setSelectedTable(null);
      setSelectedCustomerId(null);
      setActiveHeldOrderId(null);
      success('تم تعليق الطلب');
    }
  };

  const handleRetrieveOrder = async (id: number) => {
    if (cart.length > 0 && activeHeldOrderId !== id) {
      await handleHoldOrder(true);
    }
    const held = await db.heldOrders.get(id);
    if (held) {
      handleSetCart(held.items); 
      setSelectedCustomerId(held.customerId || null); 
      setOrderNote(held.note || '');
      setOrderType(held.orderType as any || 'direct');
      setSelectedTable(held.tableId || null);
      setActiveHeldOrderId(id);
    }
  };

  const executeDeleteHeldOrder = async (id: number) => {
    const held = await db.heldOrders.get(id);
    if (held?.orderType === 'dine-in' && held.tableId) {
      await db.diningTables.update(Number(held.tableId), { status: 'available' });
    }
    await db.heldOrders.delete(id);
    success('تم حذف الطلب المعلق بنجاح');
  };

  return {
    activeHeldOrderId,
    setActiveHeldOrderId,
    selectedCustomerId,
    setSelectedCustomerId,
    selectedSalespersonId,
    setSelectedSalespersonId,
    selectedWarehouseId,
    setSelectedWarehouseId,
    lastOrder,
    setLastOrder,
    orderType,
    setOrderType,
    selectedTable,
    setSelectedTable,
    promoCode,
    setPromoCode,
    delivery,
    setDelivery,
    maintenance,
    setMaintenance,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isProformaInvoiceOpen,
    setIsProformaInvoiceOpen,
    isReservation,
    setIsReservation,
    reservationDueDate,
    setReservationDueDate,
    reservationDeliveredItems,
    setReservationDeliveredItems,
    paymentMethod,
    setPaymentMethod,
    amountReceived,
    setAmountReceived,
    tipAmount,
    setTipAmount,
    orderNote,
    setOrderNote,
    checkoutError,
    setCheckoutError,
    giftCardCode,
    setGiftCardCode,
    giftCardAmount,
    setGiftCardAmount,
    splitCash,
    setSplitCash,
    splitCard,
    setSplitCard,
    heldOrderDetailToDelete,
    setHeldOrderDetailToDelete,
    handleOpenCashDrawer,
    initiatePayment,
    handleFastCash,
    handleFinalizeCheckout,
    handleCheckoutWholesale,
    addCustomItem,
    handleHoldOrder,
    handleRetrieveOrder,
    executeDeleteHeldOrder
  };
};
