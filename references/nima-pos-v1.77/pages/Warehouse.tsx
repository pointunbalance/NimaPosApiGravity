import React, { useState, useMemo, useEffect, useDeferredValue } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Warehouse as IWarehouse } from '../types';
import { Store } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ui/ConfirmModal';

import WarehouseSidebar from '../components/warehouse/WarehouseSidebar';
import WarehouseHeader from '../components/warehouse/WarehouseHeader';
import WarehouseInventoryTable from '../components/warehouse/WarehouseInventoryTable';
import WarehouseBatchesTable from '../components/warehouse/WarehouseBatchesTable';
import {
  WarehouseModal,
  StockAdjustmentModal,
  TransferModal,
  HistoryModal,
} from '../components/warehouse/WarehouseModals';

const Warehouse: React.FC = () => {
  const { success, error: showError } = useToast();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'inventory' | 'batches'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);

  // Filters
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'out'>('all');
  const [hideZeroStock, setHideZeroStock] = useState(false);

  // Modals
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<IWarehouse | null>(null);

  const [isStockCountOpen, setIsStockCountOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Stock Adjustment State
  const [editingItem, setEditingItem] = useState<{
    itemId?: number;
    productId: number;
    productName: string;
    currentQty: number;
  } | null>(null);

  // Transfer State
  const [transferItem, setTransferItem] = useState<{
    productId: number;
    productName: string;
    maxQty: number;
  } | null>(null);

  // History State
  const [historyItem, setHistoryItem] = useState<{ productId: number; name: string } | null>(null);
  const [itemAdjustments, setItemAdjustments] = useState<any[]>([]);

  const warehouses = useLiveQuery(() => db.warehouses.toArray(), []);
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const currencyCode = settings?.currencyCode || 'EGP';

  const warehouseBatches = useLiveQuery(async () => {
    if (!selectedWarehouseId) return [];
    const batches = await db.batches.where('warehouseId').equals(selectedWarehouseId).toArray();

    return batches.sort((a, b) => {
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    });
  }, [selectedWarehouseId]);

  const warehouseInventory = useLiveQuery(async () => {
    if (!selectedWarehouseId) return [];
    const inventory = await db.inventory.where('warehouseId').equals(selectedWarehouseId).toArray();
    const allProducts = await db.products.toArray();

    const completeList = allProducts.map((prod) => {
      const invItem = inventory.find((i) => i.productId === prod.id);
      return {
        id: invItem?.id,
        productId: prod.id!,
        productName: prod.name,
        productCategory: prod.category,
        productImage: prod.image,
        quantity: invItem ? invItem.quantity : 0,
        price: prod.price,
        costPrice: prod.costPrice || 0,
        alertThreshold: prod.alertThreshold || 5,
      };
    });

    return completeList.filter((i) => {
      const matchesSearch = i.productName.toLowerCase().includes(deferredSearchTerm.toLowerCase());
      let matchesStatus = true;
      if (filterStatus === 'low') matchesStatus = i.quantity > 0 && i.quantity <= i.alertThreshold;
      if (filterStatus === 'out') matchesStatus = i.quantity <= 0;
      const matchesZeroFilter = hideZeroStock ? i.quantity > 0 : true;
      return matchesSearch && matchesStatus && matchesZeroFilter;
    });
  }, [selectedWarehouseId, deferredSearchTerm, filterStatus, hideZeroStock]);

  const stats = useMemo(() => {
    if (!warehouseInventory)
      return { totalItems: 0, totalRetailValue: 0, totalCostValue: 0, lowStock: 0 };
    const totalItems = warehouseInventory.reduce((acc, item) => acc + item.quantity, 0);
    const totalRetailValue = warehouseInventory.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0
    );
    const totalCostValue = warehouseInventory.reduce(
      (acc, item) => acc + item.quantity * item.costPrice,
      0
    );
    const lowStock = warehouseInventory.filter(
      (i) => i.quantity > 0 && i.quantity <= i.alertThreshold
    ).length;
    return { totalItems, totalRetailValue, totalCostValue, lowStock };
  }, [warehouseInventory]);

  const handlePrint = () => {
    if (!warehouseInventory || !selectedWarehouse) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let filterLabel = 'الكل';
    if (filterStatus === 'low') filterLabel = 'نواقص';
    if (filterStatus === 'out') filterLabel = 'نفذت';

    const html = `
      <html dir="rtl" lang="ar">
        <head>
          <title>تقرير المخزون - ${selectedWarehouse.name}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
            th { background-color: #f1f5f9; color: #475569; }
            .footer { margin-top: 40px; text-align: center; font-size: 0.9em; color: #777; border-top: 1px dashed #ccc; padding-top: 20px; }
            .text-red { color: #dc2626; font-weight: bold; }
            .text-orange { color: #ea580c; font-weight: bold; }
            .text-green { color: #16a34a; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>تقرير المخزون - ${selectedWarehouse.name}</h2>
            <p>التاريخ: ${new Date().toLocaleString('ar-EG')}</p>
            <p>قائمة العرض: ${filterLabel} ${hideZeroStock ? '(مخفي الأصفار)' : ''}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>اسم الصنف</th>
                <th>التصنيف</th>
                <th>الكمية المتوفرة</th>
                <th>حد التنبيه</th>
                <th>سعر التكلفة</th>
                <th>إجمالي التكلفة</th>
                <th>سعر البيع</th>
              </tr>
            </thead>
            <tbody>
              ${warehouseInventory.map(item => {
                let colorClass = 'text-green';
                if (item.quantity <= 0) colorClass = 'text-red';
                else if (item.quantity <= item.alertThreshold) colorClass = 'text-orange';
                
                return `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.productCategory || '-'}</td>
                  <td class="${colorClass}">${item.quantity}</td>
                  <td>${item.alertThreshold}</td>
                  <td>${formatCurrency(item.costPrice)}</td>
                  <td>${formatCurrency(item.costPrice * item.quantity)}</td>
                  <td>${formatCurrency(item.price)}</td>
                </tr>
                `
              }).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>تم استخراج هذا التقرير من النظام</p>
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

  useEffect(() => {
    if (warehouses && warehouses.length > 0 && !selectedWarehouseId) {
      setSelectedWarehouseId(warehouses[0].id!);
    }
  }, [warehouses]);

  const handleOpenWarehouseModal = (warehouse?: IWarehouse) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
    } else {
      setEditingWarehouse(null);
    }
    setIsWarehouseModalOpen(true);
  };

  const handleSaveWarehouse = async (data: any) => {
    try {
      if (data.isMain) {
        const allWh = await db.warehouses.toArray();
        await Promise.all(allWh.map((w) => db.warehouses.update(w.id!, { isMain: false })));
      }

      if (editingWarehouse && editingWarehouse.id) {
        await db.warehouses.update(editingWarehouse.id, {
          name: data.name,
          address: data.address,
          isMain: data.isMain,
        });
      } else {
        const newId = await db.warehouses.add({
          name: data.name,
          address: data.address,
          isMain: data.isMain,
        });
        if (!selectedWarehouseId) setSelectedWarehouseId(newId);
      }
      setIsWarehouseModalOpen(false);
    } catch (error) {
      console.error('Failed to save warehouse', error);
    }
  };

  const handleDeleteWarehouse = async (id: number) => {
    const wh = warehouses?.find((w) => w.id === id);
    if (wh?.isMain) {
      showError('لا يمكن حذف المخزن الرئيسي. قم بتعيين مخزن آخر كرئيسي أولاً.');
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: 'حذف المخزن',
      message: 'هل أنت متأكد من حذف هذا المخزن؟ سيتم حذف جميع الأرصدة المرتبطة به.',
      onConfirm: async () => {
        try {
          await (db as any).transaction('rw', db.warehouses, db.inventory, async () => {
            await db.inventory.where('warehouseId').equals(id).delete();
            await db.warehouses.delete(id);
          });
          success('تم حذف المخزن بنجاح');
          if (selectedWarehouseId === id) setSelectedWarehouseId(warehouses?.[0]?.id || null);
        } catch (e) {
          console.error('Failed to delete', e);
          showError('فشل حذف المخزن');
        }
        setConfirmConfig(null);
      }
    });
  };

  const handleUpdateStock = async (data: any) => {
    if (!editingItem || !selectedWarehouseId) return;
    try {
      await (db as any).transaction(
        'rw',
        db.inventory,
        db.products,
        db.stockAdjustments,
        async () => {
          const type = data.newCountQty > editingItem.currentQty ? 'increase' : 'decrease';
          const diff = Math.abs(data.newCountQty - editingItem.currentQty);

          if (diff > 0) {
            await db.stockAdjustments.add({
              productId: editingItem.productId,
              productName: editingItem.productName,
              type: type,
              quantity: diff,
              reason: data.adjustmentReason as any,
              date: new Date(),
              notes: data.adjustmentNotes || 'تعديل جرد يدوي',
              warehouseId: selectedWarehouseId,
              warehouseName: warehouses?.find((w) => w.id === selectedWarehouseId)?.name,
            });
          }

          if (editingItem.itemId) {
            await db.inventory.update(editingItem.itemId, { quantity: data.newCountQty });
          } else {
            await db.inventory.add({
              warehouseId: selectedWarehouseId,
              productId: editingItem.productId,
              quantity: data.newCountQty,
            });
          }

          const allInv = await db.inventory
            .where('productId')
            .equals(editingItem.productId)
            .toArray();
          const otherWarehousesStock = allInv
            .filter((i) => i.warehouseId !== selectedWarehouseId)
            .reduce((s, i) => s + i.quantity, 0);
          await db.products.update(editingItem.productId, {
            stock: otherWarehousesStock + data.newCountQty,
          });
        }
      );
      success('تم تحديث المخزون بنجاح');
      setIsStockCountOpen(false);
    } catch (error) {
      showError('حدث خطأ أثناء تحديث المخزون');
    }
  };

  const handleTransfer = async (data: any) => {
    if (!transferItem || !selectedWarehouseId || !data.transferTargetId || data.transferQty <= 0) return;
    if (data.transferQty > transferItem.maxQty) {
      showError('الكمية المراد نقلها أكبر من المتوفر');
      return;
    }
    try {
      await (db as any).transaction(
        'rw',
        db.inventory,
        db.products,
        db.stockAdjustments,
        async () => {
          const sourceItem = await db.inventory
            .where({ warehouseId: selectedWarehouseId, productId: transferItem.productId })
            .first();
          if (sourceItem)
            await db.inventory.update(sourceItem.id!, {
              quantity: sourceItem.quantity - data.transferQty,
            });

          const targetItem = await db.inventory
            .where({ warehouseId: Number(data.transferTargetId), productId: transferItem.productId })
            .first();
          if (targetItem) {
            await db.inventory.update(targetItem.id!, {
              quantity: targetItem.quantity + data.transferQty,
            });
          } else {
            await db.inventory.add({
              warehouseId: Number(data.transferTargetId),
              productId: transferItem.productId,
              quantity: data.transferQty,
            });
          }

          const sourceWhName = warehouses?.find((w) => w.id === selectedWarehouseId)?.name;
          const targetWhName = warehouses?.find((w) => w.id === Number(data.transferTargetId))?.name;

          await db.stockAdjustments.add({
            productId: transferItem.productId,
            productName: transferItem.productName,
            type: 'decrease',
            quantity: data.transferQty,
            reason: 'other',
            date: new Date(),
            notes: `نقل إلى مخزن: ${targetWhName}`,
            warehouseId: selectedWarehouseId,
            warehouseName: sourceWhName,
          });

          await db.stockAdjustments.add({
            productId: transferItem.productId,
            productName: transferItem.productName,
            type: 'increase',
            quantity: data.transferQty,
            reason: 'other',
            date: new Date(),
            notes: `استلام من مخزن: ${sourceWhName}`,
            warehouseId: Number(data.transferTargetId),
            warehouseName: targetWhName,
          });

          // Total product stock remains the same, so no need to update db.products.stock
        }
      );
      success('تم نقل الكمية بنجاح بين المخازن');
      setIsTransferModalOpen(false);
    } catch (e) {
      showError('فشل النقل');
    }
  };

  const openStockModal = (item: any) => {
    setEditingItem({
      itemId: item.id,
      productId: item.productId,
      productName: item.productName,
      currentQty: item.quantity,
    });
    setIsStockCountOpen(true);
  };

  const openTransferModal = (item: any) => {
    setTransferItem({
      productId: item.productId,
      productName: item.productName,
      maxQty: item.quantity,
    });
    setIsTransferModalOpen(true);
  };

  const openHistoryModal = async (item: any) => {
    if (!selectedWarehouseId) return;
    setHistoryItem({ productId: item.productId, name: item.productName });
    const logs = await db.stockAdjustments
      .where({ productId: item.productId })
      .filter((a) => a.warehouseId === selectedWarehouseId)
      .reverse()
      .sortBy('date');
    setItemAdjustments(logs);
    setIsHistoryModalOpen(true);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(amount);

  const selectedWarehouse = warehouses?.find((w) => w.id === selectedWarehouseId);

  return (
    <div className="flex h-full bg-[#f8fafc] overflow-hidden font-sans">
      <WarehouseSidebar
        warehouses={warehouses}
        selectedWarehouseId={selectedWarehouseId}
        setSelectedWarehouseId={setSelectedWarehouseId}
        handleOpenWarehouseModal={handleOpenWarehouseModal}
        handleDeleteWarehouse={handleDeleteWarehouse}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {selectedWarehouse ? (
          <>
            <WarehouseHeader
              selectedWarehouse={selectedWarehouse}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              stats={stats}
              formatCurrency={formatCurrency}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              hideZeroStock={hideZeroStock}
              setHideZeroStock={setHideZeroStock}
              onPrint={handlePrint}
            />

            {/* Content View */}
            <div className="flex-1 overflow-y-auto p-8">
              {activeTab === 'inventory' ? (
                <WarehouseInventoryTable
                  warehouseInventory={warehouseInventory}
                  formatCurrency={formatCurrency}
                  openStockModal={openStockModal}
                  openTransferModal={openTransferModal}
                  openHistoryModal={openHistoryModal}
                />
              ) : (
                <WarehouseBatchesTable warehouseBatches={warehouseBatches} />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
              <Store className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-xl font-black text-slate-700 mb-2">اختر مخزناً لعرض التفاصيل</h2>
            <p className="text-slate-500">قم بتحديد مخزن من القائمة الجانبية أو أضف مخزناً جديداً.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <WarehouseModal
        isOpen={isWarehouseModalOpen}
        onClose={() => setIsWarehouseModalOpen(false)}
        editingWarehouse={editingWarehouse}
        handleSaveWarehouse={handleSaveWarehouse}
      />

      <StockAdjustmentModal
        isOpen={isStockCountOpen}
        onClose={() => setIsStockCountOpen(false)}
        editingItem={editingItem}
        handleUpdateStock={handleUpdateStock}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        transferItem={transferItem}
        handleTransfer={handleTransfer}
        warehouses={warehouses}
        selectedWarehouseId={selectedWarehouseId}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        historyItem={historyItem}
        itemAdjustments={itemAdjustments}
      />

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

export default Warehouse;
