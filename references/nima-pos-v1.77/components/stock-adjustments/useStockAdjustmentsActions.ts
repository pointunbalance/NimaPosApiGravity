import { useState, useMemo } from 'react';
import { db } from '../../db';
import { StockAdjustment, Product, Warehouse } from '../../types';
import { AccountingEngine } from '../../services/AccountingEngine';

export interface BatchItem {
  tempId: string;
  productId: number;
  productName: string;
  currentStock: number;
  actualStock: number; // The counted qty
  difference: number;
  type: 'increase' | 'decrease';
  costPrice: number;
  totalValueImpact: number;
  reason: StockAdjustment['reason'];
}

export const getReasonConfig = (r: string) => {
  switch (r) {
    case 'damage': return { label: 'تالف / مكسور', color: 'bg-red-100 text-red-700 border-red-200' };
    case 'theft': return { label: 'سرقة / عجز', color: 'bg-orange-100 text-orange-700 border-orange-200' };
    case 'correction': return { label: 'تصحيح جرد', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    case 'gift': return { label: 'هدية / استخدام', color: 'bg-purple-100 text-purple-700 border-purple-200' };
    default: return { label: 'أخرى', color: 'bg-gray-100 text-gray-700 border-gray-200' };
  }
};

export const useStockAdjustmentsActions = (
  products: Product[] | undefined,
  warehouses: Warehouse[] | undefined,
  selectedWarehouseId: number | '',
  setSelectedWarehouseId: (w: number | '') => void,
  selectedProductId: number | '',
  setSelectedProductId: (p: number | '') => void,
  currentLineStock: number | undefined,
  filteredAdjustments: StockAdjustment[],
  success: (msg: string) => void,
  error: (msg: string) => void
) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [referenceNote, setReferenceNote] = useState('');
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [inputActualQty, setInputActualQty] = useState<number | ''>('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [itemReason, setItemReason] = useState<StockAdjustment['reason']>('correction');

  const batchTotals = useMemo(() => {
    let totalGain = 0;
    let totalLoss = 0;
    let netItems = 0;

    batchItems.forEach(item => {
      if (item.type === 'increase') {
        totalGain += item.totalValueImpact;
        netItems += item.difference;
      } else {
        totalLoss += item.totalValueImpact;
        netItems -= item.difference;
      }
    });

    return { totalGain, totalLoss, netValue: totalGain - totalLoss, netItems };
  }, [batchItems]);

  const addLineToBatch = () => {
    if (!selectedProductId || inputActualQty === '' || !selectedWarehouseId) return;
    const actual = Number(inputActualQty);
    const current = currentLineStock || 0;
    
    if (actual === current) {
      error('الكمية الفعلية تطابق الكمية الحالية. لا توجد تسوية مطلوبة.');
      return;
    }

    const product = products?.find(p => p.id === Number(selectedProductId));
    if (!product) return;

    const diff = actual - current;
    const type = diff > 0 ? 'increase' : 'decrease';
    const absDiff = Math.abs(diff);
    const cost = product.costPrice || 0;

    const newItem: BatchItem = {
      tempId: crypto.randomUUID(),
      productId: product.id!,
      productName: product.name,
      currentStock: current,
      actualStock: actual,
      difference: absDiff,
      type,
      costPrice: cost,
      totalValueImpact: absDiff * cost,
      reason: itemReason
    };

    setBatchItems(prev => {
      const exists = prev.findIndex(i => i.productId === newItem.productId);
      if (exists >= 0) {
        const updated = [...prev];
        updated[exists] = newItem;
        return updated;
      }
      return [newItem, ...prev];
    });

    setSelectedProductId('');
    setInputActualQty('');
    setBarcodeInput('');
    success('تم إدراج بند التسوية في قائمة الجرد');
  };

  const removeBatchItem = (tempId: string) => {
    setBatchItems(prev => prev.filter(i => i.tempId !== tempId));
  };

  const handleBarcodeScan = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && barcodeInput) {
      e.preventDefault();
      const prod = products?.find(p => p.barcode === barcodeInput);
      if (prod) {
        setSelectedProductId(prod.id!);
        setBarcodeInput('');
        success(`تم التعرف على المنتج: ${prod.name}`);
      } else {
        error('المنتج الممسوح غير موجود بالنظام');
        setBarcodeInput('');
      }
    }
  };

  const handleSaveBatch = async () => {
    if (batchItems.length === 0 || !selectedWarehouseId) return;
    
    const warehouse = warehouses?.find(w => w.id === Number(selectedWarehouseId));
    if (!warehouse) return;

    try {
      await (db as any).transaction('rw', db.stockAdjustments, db.products, db.inventory, db.journalEntries, db.accounts, async () => {
        for (const item of batchItems) {
          await db.stockAdjustments.add({
            productId: item.productId,
            productName: item.productName,
            type: item.type,
            quantity: item.difference,
            reason: item.reason,
            notes: `${referenceNote ? `[${referenceNote}] ` : ''}تسوية جرد - المخزون كان ${item.currentStock}`,
            date: new Date(),
            warehouseId: warehouse.id,
            warehouseName: warehouse.name
          });

          const invItem = await db.inventory.where({ warehouseId: warehouse.id, productId: item.productId }).first();
          
          if (invItem) {
            await db.inventory.update(invItem.id!, { quantity: item.actualStock });
          } else if (item.type === 'increase') {
            await db.inventory.add({
              warehouseId: warehouse.id!,
              productId: item.productId,
              quantity: item.actualStock
            });
          }

          const product = await db.products.get(item.productId);
          let costAdjustment = 0;
          if (product) {
            const newGlobalStock = item.type === 'increase' 
              ? product.stock + item.difference 
              : product.stock - item.difference;
            await db.products.update(item.productId, { stock: newGlobalStock });
            costAdjustment = (product.costPrice || 0) * item.difference;
          }
          
          if (costAdjustment > 0) {
            try {
              const inventoryAccount = await db.accounts.where('code').equals('1040').first();
              const adjustmentAccount = await db.accounts.where('code').equals('5010').first();
              
              if (inventoryAccount && adjustmentAccount) {
                const isIncrease = item.type === 'increase';
                await AccountingEngine.postEntry({
                  date: new Date(),
                  reference: `ADJ-${warehouse.id}-${Date.now()}`,
                  description: `تسوية جرد للمنتج ${item.productName}`,
                  lines: [
                    { accountId: inventoryAccount.id!, accountName: inventoryAccount.name, debit: isIncrease ? costAdjustment : 0, credit: isIncrease ? 0 : costAdjustment, description: `تسوية مخزون ${item.productName}` },
                    { accountId: adjustmentAccount.id!, accountName: adjustmentAccount.name, debit: isIncrease ? 0 : costAdjustment, credit: isIncrease ? costAdjustment : 0, description: `فروق جرد` }
                  ],
                });
              }
            } catch (err) {
              console.error("Failed to post automatic journal entry for adjustment:", err);
            }
          }
        }
      });

      closeModal();
      success('تم حفظ كامل دفعة التسويات وتحديث الجرد والحسابات بنجاح');
    } catch (e) {
      console.error("Batch save failed", e);
      error('حدث خطأ أثناء حفظ التسوية.');
    }
  };

  const handleExportCSV = () => {
    if (!filteredAdjustments.length) {
      error('لا توجد تسويات لتصديرها');
      return;
    }
    
    const headers = ['ID', 'Product', 'Warehouse', 'Type', 'Qty', 'Reason', 'Date', 'Notes'];
    const rows = filteredAdjustments.map(a => [
      a.id,
      a.productName,
      a.warehouseName,
      a.type,
      a.quantity,
      a.reason,
      new Date(a.date).toLocaleDateString(),
      a.notes
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `stock_adjustments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('تم تصدير ملف التسويات بنجاح');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setBatchItems([]);
    setReferenceNote('');
    setSelectedProductId('');
    setInputActualQty('');
    setBarcodeInput('');
  };

  return {
    isModalOpen,
    setIsModalOpen,
    referenceNote,
    setReferenceNote,
    batchItems,
    setBatchItems,
    inputActualQty,
    setInputActualQty,
    barcodeInput,
    setBarcodeInput,
    itemReason,
    setItemReason,
    batchTotals,
    addLineToBatch,
    removeBatchItem,
    handleBarcodeScan,
    handleSaveBatch,
    handleExportCSV,
    closeModal
  };
};
