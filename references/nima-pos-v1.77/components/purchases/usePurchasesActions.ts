import { useState } from 'react';
import { db } from '../../db';
import { Purchase, Supplier } from '../../types';
import { AccountingEngine } from '../../services/AccountingEngine';

export const usePurchasesActions = (
  suppliers: Supplier[] | undefined,
  filteredPurchases: Purchase[],
  isDateClosed: (date: string | Date) => boolean,
  dateRange: { start: string; end: string },
  success: (msg: string) => void,
  error: (msg: string) => void
) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewPurchase, setViewPurchase] = useState<Purchase | null>(null);
  const [purchaseToDeleteId, setPurchaseToDeleteId] = useState<number | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleExportCSV = () => {
    if (!filteredPurchases.length) return;
    const headers = ['Invoice No', 'Date', 'Supplier', 'Items Count', 'Subtotal', 'Tax', 'Discount', 'Total', 'Payment', 'Notes'];
    const rows = filteredPurchases.map(p => [
      p.invoiceNumber || '-',
      new Date(p.date).toLocaleDateString(),
      p.supplierName,
      p.items.length,
      p.subtotal || 0,
      p.taxAmount || 0,
      p.discountAmount || 0,
      p.totalAmount,
      p.notes?.includes('آجل') ? 'Credit' : 'Cash',
      p.notes || ''
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `purchases_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleSavePurchase = async (data: any) => {
    if (isDateClosed(data.date)) {
      error('لا يمكن إضافة فاتورة مشتريات في سنة مالية مغلقة.');
      return;
    }

    const supplier = suppliers?.find(s => s.id === Number(data.supplierId));
    if (!supplier) return;

    const formSubtotal = data.items.reduce((sum: number, item: any) => sum + item.total, 0);
    const formFinalTotal = Math.max(0, formSubtotal + data.tax - data.discount);

    const newPurchase: Purchase = {
      supplierId: supplier.id!,
      supplierName: supplier.name,
      date: new Date(data.date),
      invoiceNumber: data.invoiceNumber,
      items: data.items,
      subtotal: formSubtotal,
      taxAmount: data.tax,
      discountAmount: data.discount,
      totalAmount: formFinalTotal,
      notes: `${data.notes || ''} | ${data.paymentType === 'credit' ? 'آجل (ذمم)' : 'نقدي'}`,
      attachment: data.attachment
    };

    try {
      await (db as any).transaction('rw', db.purchases, db.products, db.expenses, db.inventory, db.batches, db.productSerials, db.warehouses, db.suppliers, db.shifts, db.journalEntries, db.accounts, db.productPriceHistory, db.auditLogs, async () => {
        // 1. Save Purchase Record
        const purchaseId = await db.purchases.add(newPurchase);

        // 2. Update Product Stock (Global) & Cost Price & Main Warehouse Inventory & Batches
        const mainWarehouse = await db.warehouses.where('isMain').equals(1).first();
        if(!mainWarehouse) throw new Error("No Main Warehouse");

        for (const item of data.items) {
          // Update Global Product
          const product = await db.products.get(item.productId);
          if (product) {
            // Check if cost price modified
            if (product.costPrice !== item.costPrice) {
              await db.productPriceHistory.add({
                productId: item.productId,
                oldPrice: product.price || 0,
                newPrice: product.price || 0, 
                oldCost: product.costPrice || 0,
                newCost: item.costPrice || 0,
                changeDate: new Date(),
                changedBy: 'عملية شراء (فاتورة)'
              });
            }
          
            const totalQty = item.quantity + (item.bonusQuantity || 0);
            const currentStock = product.stock || 0;
            const oldAvgCost = product.averageCost || product.costPrice || 0;
            const purchaseCost = item.costPrice || 0;
            
            let newAvgCost = oldAvgCost;
            if (currentStock + totalQty > 0) {
              newAvgCost = ((currentStock * oldAvgCost) + (totalQty * purchaseCost)) / (currentStock + totalQty);
            } else {
              newAvgCost = purchaseCost;
            }
            newAvgCost = Math.round(newAvgCost * 100) / 100;

            await db.products.update(item.productId, {
              stock: product.stock + totalQty,
              costPrice: item.costPrice, // Update cost price to latest
              averageCost: newAvgCost
            });
          }

          // Update Inventory (Main Warehouse)
          const totalQty = item.quantity + (item.bonusQuantity || 0);
          const invItem = await db.inventory.where({ warehouseId: mainWarehouse.id, productId: item.productId }).first();
          if (invItem) {
            await db.inventory.update(invItem.id!, { quantity: invItem.quantity + totalQty });
          } else {
            await db.inventory.add({
              warehouseId: mainWarehouse.id!,
              productId: item.productId,
              quantity: totalQty
            });
          }
          
          // Add Batch Entry
          await db.batches.add({
            productId: item.productId,
            productName: item.name,
            warehouseId: mainWarehouse.id!,
            quantity: totalQty,
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
            receivedDate: new Date(data.date),
            costPrice: item.costPrice
          });

          // Add Serials (if any)
          if (item.serials && item.serials.length > 0) {
            for (const serial of item.serials) {
              await db.productSerials.add({
                productId: item.productId,
                serialNumber: serial,
                status: 'available',
                warehouseId: mainWarehouse.id!,
                purchaseId: purchaseId as number,
                dateAdded: new Date(data.date)
              });
            }
          }
        }

        // 3. Handle Payment Logic
        if (data.paymentType === 'cash') {
          // If Cash: Record Expense
          await db.expenses.add({
            title: `فاتورة مشتريات #${data.invoiceNumber || 'New'} - ${supplier.name}`,
            amount: formFinalTotal,
            category: 'purchase',
            date: new Date(data.date),
            paymentMethod: 'cash',
            notes: 'دفع نقدي فوري'
          });
          
          const openShift = await db.shifts.where('status').equals('open').first();
          if (openShift) {
            await db.shifts.update(openShift.id!, {
              expectedCash: openShift.expectedCash - formFinalTotal
            });
          }
        } else {
          // If Credit: Increase Supplier Balance (Debt)
          const currentBalance = supplier.balance || 0;
          await db.suppliers.update(supplier.id!, {
            balance: currentBalance + formFinalTotal
          });
        }
        
        // 4. Auto Accounting Integration (Journal Entry)
        const inventoryAccount = await db.accounts.where('code').equals('1040').first(); // المخزون
        const creditAccountCode = data.paymentType === 'cash' ? '1010' : '2010'; // الصندوق أو الموردين
        const creditAccount = await db.accounts.where('code').equals(creditAccountCode).first(); 

        if (inventoryAccount && creditAccount) {
          await AccountingEngine.postEntry({
            date: new Date(),
            reference: `PUR-${purchaseId}`,
            description: `قيد فاتورة مشتريات #${data.invoiceNumber || purchaseId} من المورد ${supplier.name}`,
            lines: [
              { accountId: inventoryAccount.id!, accountName: inventoryAccount.name, debit: formFinalTotal, credit: 0, description: `استلام بضاعة مشتريات ${purchaseId}` },
              { accountId: creditAccount.id!, accountName: creditAccount.name, debit: 0, credit: formFinalTotal, description: `مدفوعات/مستحقات المورد ${supplier.name}` }
            ],
          });
        }
      });

      setIsModalOpen(false);
      success('تم حفظ فاتورة المشتريات وتحديث المخزون والحسابات المالية بنجاح.');
    } catch (err) {
      console.error("Failed to save purchase", err);
      error('حدث خطأ أثناء حفظ الفاتورة');
    }
  };

  const handleDeletePurchase = (id: number) => {
    setPurchaseToDeleteId(id);
    setIsConfirmOpen(true);
  };

  const executeDeletePurchase = async () => {
    if (!purchaseToDeleteId) return;
    const id = purchaseToDeleteId;
    try {
      await (db as any).transaction('rw', db.purchases, db.products, db.inventory, db.warehouses, db.productSerials, async () => {
        const purchase = await db.purchases.get(id);
        if (!purchase) return;

        const mainWarehouse = await db.warehouses.where('isMain').equals(1).first();
        
        for (const item of purchase.items) {
          const totalQty = item.quantity + (item.bonusQuantity || 0);
          const product = await db.products.get(item.productId);
          if (product) {
            await db.products.update(item.productId, {
              stock: Math.max(0, product.stock - totalQty)
            });
          }
          if (mainWarehouse) {
            const invItem = await db.inventory.where({ warehouseId: mainWarehouse.id, productId: item.productId }).first();
            if (invItem) {
              await db.inventory.update(invItem.id!, { quantity: Math.max(0, invItem.quantity - totalQty) });
            }
          }
          // Remove Serials associated with this purchase
          const serials = await db.productSerials.where('purchaseId').equals(id).toArray();
          const soldSerials = serials.filter(s => s.status === 'sold');
          if(soldSerials.length > 0) {
            throw new Error(`لا يمكن حذف الفاتورة لأن بعض السيريالات قد تم بيعها بالفعل (${soldSerials.length} قطعة).`);
          }
          await db.productSerials.where('purchaseId').equals(id).delete();
        }

        await db.purchases.delete(id);
      });
      success('تم حذف فاتورة المشتريات والتراجع عن كميات المخزن بنجاح.');
      if (viewPurchase) setViewPurchase(null);
    } catch (e: any) {
      console.error("Delete failed", e);
      error('فشل الحذف: ' + e.message);
    } finally {
      setIsConfirmOpen(false);
      setPurchaseToDeleteId(null);
    }
  };

  return {
    isModalOpen,
    setIsModalOpen,
    viewPurchase,
    setViewPurchase,
    purchaseToDeleteId,
    setPurchaseToDeleteId,
    isConfirmOpen,
    setIsConfirmOpen,
    handleExportCSV,
    handleSavePurchase,
    handleDeletePurchase,
    executeDeletePurchase
  };
};
