import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { BranchTransfer, BranchTransferItem } from '../../types';

export const useBranchTransfersState = (success: (msg: string) => void, showError: (msg: string) => void) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_transit' | 'completed' | 'cancelled'>('all');
  
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<BranchTransfer | null>(null);

  // New Transfer Form State
  const [sourceId, setSourceId] = useState<number | ''>('');
  const [destinationId, setDestinationId] = useState<number | ''>('');
  const [transferItems, setTransferItems] = useState<BranchTransferItem[]>([]);
  const [notes, setNotes] = useState('');
  
  // Item Selection State
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [selectedQty, setSelectedQty] = useState<number>(1);

  // Data Fetching
  const transfers = useLiveQuery(() => db.branchTransfers.reverse().sortBy('date'), []);
  const warehouses = useLiveQuery(() => db.warehouses.toArray(), []);
  const products = useLiveQuery(() => db.products.toArray(), []);
  
  // Fetch inventory for the selected source warehouse
  const sourceInventory = useLiveQuery(async () => {
    if (!sourceId) return [];
    const inv = await db.inventory.where('warehouseId').equals(Number(sourceId)).toArray();
    return inv.filter(i => i.quantity > 0);
  }, [sourceId]);

  const currentUser = useLiveQuery(() => db.users.where('isActive').equals(1).first());

  // Derived Data
  const filteredTransfers = useMemo(() => {
    if (!transfers) return [];
    return transfers.filter(t => {
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const sourceName = warehouses?.find(w => w.id === t.sourceWarehouseId)?.name || '';
      const destName = warehouses?.find(w => w.id === t.destinationWarehouseId)?.name || '';
      const matchesSearch = sourceName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            destName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            t.id?.toString().includes(searchTerm);
      return matchesStatus && matchesSearch;
    });
  }, [transfers, statusFilter, searchTerm, warehouses]);

  const availableProductsForTransfer = useMemo(() => {
    if (!sourceInventory || !products) return [];
    return sourceInventory.map(inv => {
      const product = products.find(p => p.id === inv.productId);
      return {
        ...inv,
        productName: product?.name || 'منتج غير معروف',
      };
    }).filter(p => !transferItems.some(ti => ti.productId === p.productId));
  }, [sourceInventory, products, transferItems]);

  const selectedProductMaxQty = useMemo(() => {
    if (!selectedProductId || !sourceInventory) return 0;
    const invItem = sourceInventory.find(i => i.productId === Number(selectedProductId));
    return invItem ? invItem.quantity : 0;
  }, [selectedProductId, sourceInventory]);

  const handleAddItem = () => {
    if (!selectedProductId || selectedQty <= 0 || selectedQty > selectedProductMaxQty) return;
    
    const product = products?.find(p => p.id === Number(selectedProductId));
    if (!product) return;

    setTransferItems([...transferItems, {
      productId: product.id!,
      productName: product.name,
      quantity: selectedQty
    }]);

    setSelectedProductId('');
    setSelectedQty(1);
  };

  const handleRemoveItem = (productId: number) => {
    setTransferItems(transferItems.filter(i => i.productId !== productId));
  };

  const resetForm = () => {
    setSourceId('');
    setDestinationId('');
    setTransferItems([]);
    setNotes('');
    setSelectedProductId('');
    setSelectedQty(1);
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !destinationId || transferItems.length === 0) {
      showError('يرجى إكمال جميع البيانات المطلوبة وإضافة منتج واحد على الأقل.');
      return;
    }
    if (sourceId === destinationId) {
      showError('لا يمكن التحويل لنفس المخزن.');
      return;
    }

    try {
      await db.branchTransfers.add({
        date: new Date(),
        sourceWarehouseId: Number(sourceId),
        destinationWarehouseId: Number(destinationId),
        items: transferItems,
        status: 'pending',
        notes: notes,
        createdBy: currentUser?.name || 'مستخدم غير معروف'
      });

      setIsNewModalOpen(false);
      resetForm();
      success('تم إنشاء طلب التحويل بنجاح.');
    } catch (error) {
      console.error("Failed to create transfer", error);
      showError('حدث خطأ أثناء إنشاء التحويل.');
    }
  };

  const handleStatusChange = async (transferId: number, newStatus: BranchTransfer['status']) => {
    const transfer = transfers?.find(t => t.id === transferId);
    if (!transfer) return;

    if (newStatus === 'in_transit' && transfer.status === 'pending') {
      try {
        await (db as any).transaction('rw', db.inventory, db.branchTransfers, db.stockAdjustments, async () => {
          for (const item of transfer.items) {
            const sourceItem = await db.inventory.where({ warehouseId: transfer.sourceWarehouseId, productId: item.productId }).first();
            if (sourceItem) {
              if (sourceItem.quantity < item.quantity) {
                throw new Error(`الكمية غير متوفرة للمنتج ${item.productName} في المخزن المصدر.`);
              }
              await db.inventory.update(sourceItem.id!, { quantity: sourceItem.quantity - item.quantity });
            } else {
              throw new Error(`المنتج ${item.productName} غير موجود في المخزن المصدر.`);
            }

            const sourceWhName = warehouses?.find(w => w.id === transfer.sourceWarehouseId)?.name;
            const destWhName = warehouses?.find(w => w.id === transfer.destinationWarehouseId)?.name;

            await db.stockAdjustments.add({
              productId: item.productId,
              productName: item.productName,
              type: 'decrease',
              quantity: item.quantity,
              reason: 'other',
              date: new Date(),
              notes: `شحن تحويل صادر إلى: ${destWhName} (رقم التحويل: ${transfer.id})`,
              warehouseId: transfer.sourceWarehouseId,
              warehouseName: sourceWhName
            });
          }
          await db.branchTransfers.update(transferId, { status: newStatus });
        });
        const updatedTransfer = { ...transfer, status: newStatus };
        if (selectedTransfer?.id === transferId) setSelectedTransfer(updatedTransfer);
        success('تم شحن المواد وخصمها من المخزن المصدر بتجاح (قيد النقل).');
        setIsViewModalOpen(false);
      } catch (error: any) {
        console.error("Transfer execution failed", error);
        showError(error.message || 'حدث خطأ أثناء نقل التحويل.');
      }
    } else if (newStatus === 'completed' && transfer.status === 'in_transit') {
      try {
        await (db as any).transaction('rw', db.inventory, db.branchTransfers, db.stockAdjustments, async () => {
          for (const item of transfer.items) {
            const destItem = await db.inventory.where({ warehouseId: transfer.destinationWarehouseId, productId: item.productId }).first();
            if (destItem) {
              await db.inventory.update(destItem.id!, { quantity: destItem.quantity + item.quantity });
            } else {
              await db.inventory.add({ warehouseId: transfer.destinationWarehouseId, productId: item.productId, quantity: item.quantity });
            }

            const sourceWhName = warehouses?.find(w => w.id === transfer.sourceWarehouseId)?.name;
            const destWhName = warehouses?.find(w => w.id === transfer.destinationWarehouseId)?.name;

            await db.stockAdjustments.add({
              productId: item.productId,
              productName: item.productName,
              type: 'increase',
              quantity: item.quantity,
              reason: 'other',
              date: new Date(),
              notes: `استلام تحويل وارد من: ${sourceWhName} (رقم التحويل: ${transfer.id})`,
              warehouseId: transfer.destinationWarehouseId,
              warehouseName: destWhName
            });
          }
          await db.branchTransfers.update(transferId, { status: newStatus });
        });
        const updatedTransfer = { ...transfer, status: newStatus };
        if (selectedTransfer?.id === transferId) setSelectedTransfer(updatedTransfer);
        success('تم إكمال التحويل وتسجيل الاستلام في المخزن الوجهة بنجاح.');
        setIsViewModalOpen(false);
      } catch (error: any) {
        console.error("Transfer execution failed", error);
        showError(error.message || 'حدث خطأ أثناء استلام التحويل.');
      }
    } else if (newStatus === 'cancelled' && transfer.status === 'in_transit') {
      try {
        await (db as any).transaction('rw', db.inventory, db.branchTransfers, db.stockAdjustments, async () => {
          for (const item of transfer.items) {
            const sourceItem = await db.inventory.where({ warehouseId: transfer.sourceWarehouseId, productId: item.productId }).first();
            if (sourceItem) {
              await db.inventory.update(sourceItem.id!, { quantity: sourceItem.quantity + item.quantity });
            } else {
              await db.inventory.add({ warehouseId: transfer.sourceWarehouseId, productId: item.productId, quantity: item.quantity });
            }

            const sourceWhName = warehouses?.find(w => w.id === transfer.sourceWarehouseId)?.name;

            await db.stockAdjustments.add({
              productId: item.productId,
              productName: item.productName,
              type: 'increase',
              quantity: item.quantity,
              reason: 'correction',
              date: new Date(),
              notes: `إرجاع مواد تحويل ملغى (رقم التحويل: ${transfer.id})`,
              warehouseId: transfer.sourceWarehouseId,
              warehouseName: sourceWhName
            });
          }
          await db.branchTransfers.update(transferId, { status: newStatus });
        });
        const updatedTransfer = { ...transfer, status: newStatus };
        if (selectedTransfer?.id === transferId) setSelectedTransfer(updatedTransfer);
        success('تم إلغاء التحويل المنتقل، وإرجاع المواد للمخزن المصدر.');
        setIsViewModalOpen(false);
      } catch (error: any) {
        console.error("Transfer execution failed", error);
        showError(error.message || 'حدث خطأ أثناء إلغاء التحويل.');
      }
    } else {
      await db.branchTransfers.update(transferId, { status: newStatus });
      const updatedTransfer = { ...transfer, status: newStatus };
      if (selectedTransfer?.id === transferId) {
        setSelectedTransfer(updatedTransfer);
      }
      success('تم تحديث حالة التحويل بنجاح.');
    }
  };

  const getWarehouseName = (id: number) => warehouses?.find(w => w.id === id)?.name || 'غير معروف';

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    isNewModalOpen,
    setIsNewModalOpen,
    isViewModalOpen,
    setIsViewModalOpen,
    selectedTransfer,
    setSelectedTransfer,
    sourceId,
    setSourceId,
    destinationId,
    setDestinationId,
    transferItems,
    setTransferItems,
    notes,
    setNotes,
    selectedProductId,
    setSelectedProductId,
    selectedQty,
    setSelectedQty,
    filteredTransfers,
    warehouses,
    availableProductsForTransfer,
    selectedProductMaxQty,
    handleAddItem,
    handleRemoveItem,
    resetForm,
    handleCreateTransfer,
    handleStatusChange,
    getWarehouseName,
  };
};
export default useBranchTransfersState;
