import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { PurchaseOrder, PurchaseOrderItem } from '../../types';
import { AccountingEngine } from '../../services/AccountingEngine';

export const usePurchaseOrdersState = (success: (msg: string) => void, showError: (msg: string) => void) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'sent' | 'partially_received' | 'received' | 'cancelled'>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  // Form State
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [expectedDate, setExpectedDate] = useState('');
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [notes, setNotes] = useState('');
  
  // Item Selection State
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [selectedCost, setSelectedCost] = useState<number>(0);

  // Data Fetching
  const purchaseOrders = useLiveQuery(() => db.purchaseOrders.reverse().sortBy('date'), []);
  const suppliers = useLiveQuery(() => db.suppliers.toArray(), []);
  const products = useLiveQuery(() => db.products.toArray(), []);
  const settings = useLiveQuery(() => db.settings.toCollection().first(), []);
  const currentUser = useLiveQuery(() => db.users.where('isActive').equals(1).first());

  // Derived Data
  const filteredOrders = useMemo(() => {
    if (!purchaseOrders) return [];
    return purchaseOrders.filter(o => {
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchesSearch = o.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            o.id?.toString().includes(searchTerm);
      return matchesStatus && matchesSearch;
    });
  }, [purchaseOrders, statusFilter, searchTerm]);

  const currency = settings?.currency || 'ج.م';

  const handleProductSelect = (productId: number) => {
    setSelectedProductId(productId);
    const product = products?.find(p => p.id === productId);
    if (product) {
      setSelectedCost(product.costPrice || 0);
    }
  };

  const handleAddItem = () => {
    if (!selectedProductId || selectedQty <= 0 || selectedCost < 0) return;
    
    const product = products?.find(p => p.id === Number(selectedProductId));
    if (!product) return;

    const existingItemIndex = items.findIndex(i => i.productId === product.id);
    
    if (existingItemIndex >= 0) {
      const newItems = [...items];
      newItems[existingItemIndex].quantity += selectedQty;
      newItems[existingItemIndex].total = newItems[existingItemIndex].quantity * newItems[existingItemIndex].costPrice;
      setItems(newItems);
    } else {
      setItems([...items, {
        productId: product.id!,
        productName: product.name,
        quantity: selectedQty,
        costPrice: selectedCost,
        total: selectedQty * selectedCost
      }]);
    }

    setSelectedProductId('');
    setSelectedQty(1);
    setSelectedCost(0);
  };

  const handleRemoveItem = (productId: number) => {
    setItems(items.filter(i => i.productId !== productId));
  };

  const handleUpdateItemQty = (productId: number, qty: number) => {
    if (qty <= 0) return;
    setItems(items.map(item => {
      if (item.productId === productId) {
        return { ...item, quantity: qty, total: qty * item.costPrice };
      }
      return item;
    }));
  };

  const handleUpdateItemCost = (productId: number, cost: number) => {
    if (cost < 0) return;
    setItems(items.map(item => {
      if (item.productId === productId) {
        return { ...item, costPrice: cost, total: item.quantity * cost };
      }
      return item;
    }));
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const totalAmount = subtotal;

  const resetForm = () => {
    setSupplierId('');
    setExpectedDate('');
    setItems([]);
    setNotes('');
    setSelectedProductId('');
    setSelectedQty(1);
    setSelectedCost(0);
    setSelectedOrder(null);
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || items.length === 0) {
      showError('يرجى اختيار مورد وإضافة منتج واحد على الأقل.');
      return;
    }

    const supplier = suppliers?.find(s => s.id === Number(supplierId));
    if (!supplier) return;

    try {
      const orderData = {
        date: new Date(),
        supplierId: supplier.id!,
        supplierName: supplier.name,
        expectedDeliveryDate: expectedDate ? new Date(expectedDate) : undefined,
        items: items,
        subtotal,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount,
        status: 'draft' as const,
        notes,
        createdBy: currentUser?.name || 'مستخدم غير معروف'
      };

      if (selectedOrder) {
        await db.purchaseOrders.update(selectedOrder.id!, orderData);
        success('تم تحديث أمر الشراء بنجاح');
      } else {
        await db.purchaseOrders.add(orderData);
        success('تم حفظ أمر الشراء بنجاح');
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to save order", error);
      showError('حدث خطأ أثناء حفظ أمر الشراء.');
    }
  };

  const openEditModal = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setSupplierId(order.supplierId);
    setExpectedDate(order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toISOString().split('T')[0] : '');
    setItems(order.items);
    setNotes(order.notes || '');
    setIsModalOpen(true);
  };

  const handleStatusChange = async (orderId: number, newStatus: PurchaseOrder['status']) => {
    const order = purchaseOrders?.find(o => o.id === orderId);
    if (!order) return;

    await db.purchaseOrders.update(orderId, { status: newStatus });
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...order, status: newStatus });
    }
    success('تم تحديث الحالة بنجاح');
  };

  const handleReceiveItems = async (receivedItems: { productId: number, quantity: number, costPrice: number }[], isComplete: boolean) => {
    if (!selectedOrder) return;

    try {
      await (db as any).transaction('rw', db.purchases, db.purchaseOrders, db.products, db.inventory, db.stockAdjustments, db.journalEntries, db.accounts, db.productPriceHistory, db.warehouses, async () => {
        const purchaseTotal = receivedItems.reduce((acc, item) => acc + (item.quantity * item.costPrice), 0);

        // 1. Create Purchase Record
        const purchaseId = await db.purchases.add({
          supplierId: selectedOrder.supplierId,
          supplierName: selectedOrder.supplierName,
          date: new Date(),
          items: receivedItems.map(i => {
            const originalItem = selectedOrder.items.find(si => si.productId === i.productId);
            return {
              productId: i.productId,
              name: originalItem?.productName || 'غير معروف',
              costPrice: i.costPrice,
              quantity: i.quantity,
              total: i.quantity * i.costPrice
            };
          }),
          totalAmount: purchaseTotal,
          notes: `محول من أمر شراء رقم ${selectedOrder.id} (استلام ${isComplete ? 'كلي' : 'جزئي'})`
        });

        // 2. Update Inventory
        const mainWarehouse = await db.warehouses.where('isMain').equals(1).first();
        const warehouseId = mainWarehouse?.id || 1;

        const updatedOrderItems = [...selectedOrder.items];

        for (const item of receivedItems) {
          const orderItemIndex = updatedOrderItems.findIndex(i => i.productId === item.productId);
          if (orderItemIndex >= 0) {
            updatedOrderItems[orderItemIndex].receivedQuantity = (updatedOrderItems[orderItemIndex].receivedQuantity || 0) + item.quantity;
          }

          // Update Product Cost Price
          const product = await db.products.get(item.productId);
          if (product) {
            if (product.costPrice !== item.costPrice) {
              await db.productPriceHistory.add({
                productId: item.productId,
                oldPrice: product.price || 0,
                newPrice: product.price || 0, 
                oldCost: product.costPrice || 0,
                newCost: item.costPrice || 0,
                changeDate: new Date(),
                changedBy: `استلام طلب # ${selectedOrder.id}`
              });
            }
            await db.products.update(product.id!, { 
              costPrice: item.costPrice,
              stock: product.stock + item.quantity
            });
          }

          // Update Warehouse Inventory
          const invItem = await db.inventory.where({ warehouseId, productId: item.productId }).first();
          if (invItem) {
            await db.inventory.update(invItem.id!, { quantity: invItem.quantity + item.quantity });
          } else {
            await db.inventory.add({ warehouseId, productId: item.productId, quantity: item.quantity });
          }

          // Log Adjustment
          await db.stockAdjustments.add({
            productId: item.productId,
            productName: updatedOrderItems[orderItemIndex]?.productName || 'غير معروف',
            type: 'increase',
            quantity: item.quantity,
            reason: 'other',
            date: new Date(),
            notes: `استلام أمر شراء رقم ${selectedOrder.id}`,
            warehouseId: warehouseId,
            warehouseName: mainWarehouse?.name || 'المخزن الرئيسي'
          });
        }

        // 3. Auto Accounting Integration
        try {
          const inventoryAccount = await db.accounts.where('code').equals('1040').first(); 
          const accountsPayable = await db.accounts.where('code').equals('2010').first(); 

          if (inventoryAccount && accountsPayable) {
            await AccountingEngine.postEntry({
              date: new Date(),
              reference: `PO-${selectedOrder.id}`,
              description: `قيد استلام فاتورة مشتريات #${purchaseId} من المورد ${selectedOrder.supplierName} (جزئي/كلي)`,
              lines: [
                { accountId: inventoryAccount.id!, accountName: inventoryAccount.name, debit: purchaseTotal, credit: 0, description: `استلام بضاعة أمر شراء ${selectedOrder.id}` },
                { accountId: accountsPayable.id!, accountName: accountsPayable.name, debit: 0, credit: purchaseTotal, description: `مستحقات المورد ${selectedOrder.supplierName}` }
              ],
            });
          }
        } catch (err) {
          console.error("Failed to post automatic journal entry for purchase:", err);
        }

        // 4. Update Order Status and Items
        const newStatus: PurchaseOrder['status'] = isComplete ? 'received' : 'partially_received';
        const updatedOrder = { ...selectedOrder, status: newStatus, items: updatedOrderItems };
        await db.purchaseOrders.update(selectedOrder.id!, updatedOrder);
        setSelectedOrder(updatedOrder);
      });
      
      success('تم استلام البضاعة وتحويلها إلى فاتورة مشتريات وتحديث المخزون بنجاح.');
      setIsReceiveModalOpen(false);
      setIsViewModalOpen(false);
    } catch (error: any) {
      console.error("Receiving order failed", error);
      showError(error.message || 'حدث خطأ أثناء استلام أمر الشراء.');
    }
  };

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    isModalOpen,
    setIsModalOpen,
    isViewModalOpen,
    setIsViewModalOpen,
    isReceiveModalOpen,
    setIsReceiveModalOpen,
    selectedOrder,
    setSelectedOrder,
    supplierId,
    setSupplierId,
    expectedDate,
    setExpectedDate,
    items,
    setItems,
    notes,
    setNotes,
    selectedProductId,
    setSelectedProductId,
    selectedQty,
    setSelectedQty,
    selectedCost,
    setSelectedCost,
    filteredOrders,
    suppliers,
    products,
    currency,
    handleProductSelect,
    handleAddItem,
    handleRemoveItem,
    handleUpdateItemQty,
    handleUpdateItemCost,
    subtotal,
    totalAmount,
    resetForm,
    handleSaveOrder,
    openEditModal,
    handleStatusChange,
    handleReceiveItems,
  };
};
