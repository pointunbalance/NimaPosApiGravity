import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';
import { format } from 'date-fns';
import { useToast } from '../../../context/ToastContext';

export const CATEGORIES = [
  { id: 'uniform', label: 'يونيفورم' },
  { id: 'books', label: 'كتب دراسية' },
  { id: 'educational', label: 'أدوات تعليمية' },
  { id: 'cleaning', label: 'أدوات نظافة' },
  { id: 'meals', label: 'مكونات وجبات' },
  { id: 'activities', label: 'خامات أنشطة' },
  { id: 'toys', label: 'ألعاب' },
  { id: 'medical', label: 'أدوات طبية' },
  { id: 'bus', label: 'مستلزمات باص' },
];

export const useSchoolInventory = () => {
  const { success, error: toastError } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const inventory = useLiveQuery(() => db.schoolInventory?.toArray()) || [];
  const students = useLiveQuery(() => db.schoolStudents?.toArray()) || [];
  const classes = useLiveQuery(() => db.schoolClassesList?.toArray()) || [];

  const [form, setForm] = useState({
    name: '',
    category: 'uniform',
    quantity: 0,
    purchasePrice: 0,
    sellingPrice: 0,
    minQuantity: 5,
    supplier: '',
    purchaseDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const [sellForm, setSellForm] = useState({
    studentId: '',
    quantity: 1,
    notes: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const qty = Number(form.quantity);
      const buyPrice = Number(form.purchasePrice);
      const sellPrice = Number(form.sellingPrice);
      const minQty = Number(form.minQuantity);

      const addedId = await db.schoolInventory.add({
        ...form,
        quantity: qty,
        purchasePrice: buyPrice,
        sellingPrice: sellPrice,
        minQuantity: minQty,
      });

      // Unified Accounting Integration (Purchase transaction)
      const totalCost = qty * buyPrice;
      if (totalCost > 0) {
        try {
          const { AccountingEngine } = await import('../../../services/AccountingEngine');
          const cashAccount = await db.accounts.where('code').equals('1010').first(); // Cash
          const expenseAccount = await db.accounts.where('code').equals('5020').first(); // Materials Expense

          if (cashAccount && expenseAccount) {
            await AccountingEngine.postEntry({
              date: new Date(form.purchaseDate),
              reference: `INV-PUR-${addedId}`,
              description: `شراء وتوريد مستلزمات للمخزن: ${form.name} (${qty} وحدة)`,
              lines: [
                {
                  accountId: expenseAccount.id!,
                  accountName: expenseAccount.name,
                  debit: totalCost,
                  credit: 0,
                  description: `تكلفة شراء أصناف مخزنية مضافة`,
                },
                {
                  accountId: cashAccount.id!,
                  accountName: cashAccount.name,
                  debit: 0,
                  credit: totalCost,
                  description: `صرف نقدي لشراء المستلزمات`,
                },
              ],
              ignoreClosedPeriod: true,
            });
          }
        } catch (accErr) {
          console.error('Failed to post automatic journal entry for inventory purchase:', accErr);
        }
      }

      success('تم إضافة الصنف للمخزن وتوليد قيد المشتريات المالي بنجاح.');
      setIsCreateModalOpen(false);
      resetForm();
    } catch (err) {
      toastError('حدث خطأ أثناء إضافة الصنف للمخزن');
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      category: 'uniform',
      quantity: 0,
      purchasePrice: 0,
      sellingPrice: 0,
      minQuantity: 5,
      supplier: '',
      purchaseDate: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  const openSellModal = (item: any) => {
    setSelectedItem(item);
    setSellForm({
      studentId: '',
      quantity: 1,
      notes: '',
    });
    setIsSellModalOpen(true);
  };

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !sellForm.studentId) return;

    const qtyToSell = Number(sellForm.quantity);
    if (qtyToSell > selectedItem.quantity) {
      toastError('الكمية المطلوبة أكبر من المتاح في المخزن');
      return;
    }

    try {
      // Deduct from inventory
      await db.schoolInventory.update(selectedItem.id, {
        quantity: selectedItem.quantity - qtyToSell,
      });

      const totalAmount = (selectedItem.sellingPrice || 0) * qtyToSell;

      // Register transaction in cashier
      const student = students.find((s) => s.id === Number(sellForm.studentId));
      const transId = await db.treasuryTransactions.add({
        type: 'inflow',
        amount: totalAmount,
        date: new Date().toISOString(),
        category: 'sales',
        description: `شراء ${selectedItem.name || selectedItem.itemName} من المخزن (${qtyToSell} وحدة) للطالب ${student?.name || ''}`,
        paymentMethod: 'cash',
        status: 'completed',
        studentId: student?.id,
        receiptNumber: `INV-SL-${Date.now()}`,
      } as any);

      // Unified Accounting Integration (Sales transaction)
      if (totalAmount > 0) {
        try {
          const { AccountingEngine } = await import('../../../services/AccountingEngine');
          const cashAccount = await db.accounts.where('code').equals('1010').first(); // Cash
          const revenueAccount = await db.accounts.where('code').equals('4010').first(); // Sales Revenue

          if (cashAccount && revenueAccount) {
            await AccountingEngine.postEntry({
              date: new Date(),
              reference: `INV-SL-${transId}`,
              description: `مبيعات مخزن (زي/كتب) للطالب: ${student?.name || ''} - كمية ${qtyToSell}`,
              lines: [
                {
                  accountId: cashAccount.id!,
                  accountName: cashAccount.name,
                  debit: totalAmount,
                  credit: 0,
                  description: `إيراد بيع مقبوض نقداً لصنف: ${selectedItem.name || selectedItem.itemName}`,
                },
                {
                  accountId: revenueAccount.id!,
                  accountName: revenueAccount.name,
                  debit: 0,
                  credit: totalAmount,
                  description: `إثبات إيرادات بيع المستلزمات والكتب الدراسية`,
                },
              ],
              ignoreClosedPeriod: true,
            });
          }
        } catch (accErr) {
          console.error('Failed to post automatic journal entry for inventory sale:', accErr);
        }
      }

      setIsSellModalOpen(false);
      setSelectedItem(null);
      success('تم بيع الصنف للطفل بنجاح، وتثبيت الإيراد المالي في الخزنة والأستاذ العام.');
    } catch (err) {
      toastError('فشل إتمام عملية بيع الصنف');
    }
  };

  const filteredInventory = inventory.filter((item) => {
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    const searchTarget = item.name || item.itemName || '';
    if (searchQuery && !searchTarget.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getCategoryLabel = (catId: string) => CATEGORIES.find((c) => c.id === catId)?.label || catId;

  return {
    isCreateModalOpen,
    setIsCreateModalOpen,
    isSellModalOpen,
    setIsSellModalOpen,
    selectedItem,
    setSelectedItem,
    filterCategory,
    setFilterCategory,
    searchQuery,
    setSearchQuery,
    inventory,
    students,
    classes,
    form,
    setForm,
    sellForm,
    setSellForm,
    handleCreate,
    openSellModal,
    handleSell,
    filteredInventory,
    getCategoryLabel,
  };
};
