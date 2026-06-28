import { useState } from 'react';
import { db } from '../../db';
import { Supplier } from '../../types';
import { AccountingEngine } from '../../services/AccountingEngine';

export const useSuppliersActions = (
  selectedSupplier: Supplier | null,
  setSelectedSupplier: (s: Supplier | null) => void,
  selectedForOrder: Set<string>,
  success: (msg: string) => void,
  error: (msg: string) => void
) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [supplierToDeleteId, setSupplierToDeleteId] = useState<number | null>(null);

  const openModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
    } else {
      setEditingSupplier(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const handleSaveSupplier = async (data: Partial<Supplier>) => {
    try {
      const existingName = await db.suppliers.where('name').equalsIgnoreCase(data.name || '').first();
      if (existingName && existingName.id !== editingSupplier?.id) {
        error('اسم المورد موجود بالفعل في قاعدة البيانات.');
        return;
      }
      
      if (data.phone) {
        const existingPhone = await db.suppliers.where('phone').equals(data.phone).first();
        if (existingPhone && existingPhone.id !== editingSupplier?.id) {
          error('رقم هاتف المورد مسجل بالفعل لمورد آخر.');
          return;
        }
      }

      if (editingSupplier?.id) {
        await db.suppliers.update(editingSupplier.id, data);
        if (selectedSupplier?.id === editingSupplier.id) {
          setSelectedSupplier({ ...editingSupplier, ...data } as Supplier);
        }
        success('تم تعديل بيانات المورد بنجاح');
      } else {
        await db.suppliers.add(data as Supplier);
        success('تمت إضافة المورد الجديد بنجاح');
      }
      closeModal();
    } catch (err) {
      console.error("Error saving supplier", err);
      error('حدث خطأ أثناء حفظ بيانات المورد.');
    }
  };

  const executeDeleteSupplier = async (id: number) => {
    try {
      const linked = await db.purchases.where('supplierId').equals(id).count();
      if (linked > 0) {
        error(`لا يمكن حذف المورد لوجود ${linked} فواتير مرتبطة به.`);
        return;
      }
      await db.suppliers.delete(id);
      if (selectedSupplier?.id === id) setSelectedSupplier(null);
      success('تم حذف المورد بنجاح');
    } catch (err) {
      console.error(err);
      error('حدث خطأ أثناء حذف المورد');
    } finally {
      setSupplierToDeleteId(null);
    }
  };

  const handlePayment = async (data: { amount: number; note?: string }) => {
    if (!selectedSupplier) return;
    const amount = data.amount;

    try {
      await (db as any).transaction('rw', db.suppliers, db.expenses, db.shifts, db.journalEntries, db.accounts, async () => {
        const currentBalance = selectedSupplier.balance || 0;
        await db.suppliers.update(selectedSupplier.id!, { balance: currentBalance - amount });
        
        const expenseId = await db.expenses.add({
          title: `سداد دفعة للمورد: ${selectedSupplier.name}`,
          amount: amount,
          category: 'purchase',
          date: new Date(),
          paymentMethod: 'cash',
          notes: data.note || 'سداد ذمم آجل',
          supplierId: selectedSupplier.id
        });
        
        const openShift = await db.shifts.where('status').equals('open').first();
        if (openShift) {
          await db.shifts.update(openShift.id!, {
            expectedCash: openShift.expectedCash - amount
          });
        }

        try {
          const cashAccount = await db.accounts.where('code').equals('1010').first();
          const supplierAccount = await db.accounts.where('code').equals('2010').first();
          
          if (cashAccount && supplierAccount) {
            await AccountingEngine.postEntry({
              date: new Date(),
              reference: `SUPPAY-${expenseId}`,
              description: `سداد دفعة للمورد: ${selectedSupplier.name}`,
              lines: [
                { accountId: supplierAccount.id!, accountName: supplierAccount.name, debit: amount, credit: 0, description: `سداد ذمم` },
                { accountId: cashAccount.id!, accountName: cashAccount.name, debit: 0, credit: amount, description: `دفع نقدي` }
              ],
            });
          }
        } catch (err) {
          console.error("Failed to post automatic journal entry for supplier payment:", err);
        }
      });
      
      success('تم تسجيل الدفعة وتحديث الحسابات بنجاح');
      setIsPaymentModalOpen(false);
      const updated = await db.suppliers.get(selectedSupplier.id!);
      if (updated) setSelectedSupplier(updated as Supplier);
    } catch (e) {
      console.error(e);
      error('حدث خطأ أثناء حفظ الدفعة');
    }
  };

  const handleRefund = async (data: { amount: number; note?: string }) => {
    if (!selectedSupplier) return;
    const amount = data.amount;

    try {
      await (db as any).transaction('rw', db.suppliers, db.expenses, db.logs, db.shifts, db.journalEntries, db.accounts, async () => {
        const currentBalance = selectedSupplier.balance || 0;
        await db.suppliers.update(selectedSupplier.id!, { balance: currentBalance - amount });
        
        const openShift = await db.shifts.where('status').equals('open').first();
        if (openShift) {
          await db.shifts.update(openShift.id!, {
            expectedCash: openShift.expectedCash + amount
          });
        }
        
        const logId = await db.logs.add({
          type: 'refund',
          action: `استرداد مالي من مورد: ${selectedSupplier.name}`,
          amount: amount,
          user: 'System',
          date: new Date(),
          details: data.note || 'تسوية مرتجع مالي',
          referenceId: selectedSupplier.id,
          status: 'success'
        });

        try {
          const cashAccount = await db.accounts.where('code').equals('1010').first();
          const supplierAccount = await db.accounts.where('code').equals('2010').first();
          
          if (cashAccount && supplierAccount) {
            await AccountingEngine.postEntry({
              date: new Date(),
              reference: `SUPREF-${logId}`,
              description: `استرداد مالي من مورد: ${selectedSupplier.name}`,
              lines: [
                { accountId: cashAccount.id!, accountName: cashAccount.name, debit: amount, credit: 0, description: `استلام نقدي` },
                { accountId: supplierAccount.id!, accountName: supplierAccount.name, debit: 0, credit: amount, description: `مرتجع ذمم` }
              ],
            });
          }
        } catch (err) {
          console.error("Failed to post automatic journal entry for supplier refund:", err);
        }
      });
      
      success('تم تسجيل المرتجع المالي بنجاح');
      setIsRefundModalOpen(false);
      const updated = await db.suppliers.get(selectedSupplier.id!);
      if (updated) setSelectedSupplier(updated as Supplier);
    } catch (e) {
      console.error(e);
      error('حدث خطأ أثناء إتمام عملية الاسترداد');
    }
  };

  const sendWhatsAppOrder = () => {
    if (!selectedSupplier || selectedForOrder.size === 0) return;
    
    let text = `مرحبا *${selectedSupplier.name}*،\nنود طلب الأصناف التالية:\n\n`;
    selectedForOrder.forEach(name => {
      text += `- ${name}\n`;
    });
    text += `\nيرجى الإفادة بالتوفر والأسعار.\nشكراً.`;
    
    const phone = selectedSupplier.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return {
    isModalOpen,
    editingSupplier,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isRefundModalOpen,
    setIsRefundModalOpen,
    supplierToDeleteId,
    setSupplierToDeleteId,
    openModal,
    closeModal,
    handleSaveSupplier,
    executeDeleteSupplier,
    handlePayment,
    handleRefund,
    sendWhatsAppOrder
  };
};
