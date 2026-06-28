import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';
import { format } from 'date-fns';

export const CATEGORIES = [
  { id: 'all', label: 'جميع الموردين' },
  { id: 'tools', label: 'أدوات ومستلزمات' },
  { id: 'meals', label: 'وجبات وأغذية' },
  { id: 'uniform', label: 'زي مدرسي (يونيفورم)' },
  { id: 'transport', label: 'مواصلات وباصات' },
  { id: 'maintenance', label: 'صيانة وإصلاح' },
  { id: 'other', label: 'أخرى' },
];

export const useSchoolSuppliers = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'invoices' | 'payments'>('info');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const suppliers = useLiveQuery(() => db.suppliers?.toArray()) || [];
  const expenses = useLiveQuery(() => db.expenses?.toArray()) || [];
  const cashierTransactions = useLiveQuery(() => db.treasuryTransactions?.toArray()) || [];

  // Success Notification state instead of native alert
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    category: 'tools',
    phone: '',
    address: '',
    notes: '',
    balance: 0,
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.suppliers.add({
      ...form,
      balance: Number(form.balance),
    });
    setIsCreateModalOpen(false);
    setForm({
      name: '',
      category: 'tools',
      phone: '',
      address: '',
      notes: '',
      balance: 0,
    });
    showNotification('تم إضافة المورد بنجاح');
  };

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;

    const paymentAmount = Number(paymentForm.amount);

    try {
      // Add payment to cashier
      const transId = await db.treasuryTransactions.add({
        type: 'outflow',
        amount: paymentAmount,
        date: paymentForm.date,
        description: `دفعة للمورد: ${selectedSupplier.name} ${
          paymentForm.notes ? '- ' + paymentForm.notes : ''
        }`,
        category: 'expenses', // Unified category
        paymentMethod: 'cash',
        status: 'completed',
        supplierId: selectedSupplier.id,
        receiptNumber: `PAY-${Date.now()}`,
      } as any);

      // Update supplier balance
      const updatedBalance = (selectedSupplier.balance || 0) - paymentAmount;
      await db.suppliers.update(selectedSupplier.id, {
        balance: updatedBalance,
      });

      // Unified Accounting Integration (Payment transaction to supplier)
      if (paymentAmount > 0) {
        try {
          const { AccountingEngine } = await import('../../../services/AccountingEngine');
          const cashAccount = await db.accounts.where('code').equals('1010').first(); // Cash
          const accountsPayable = await db.accounts.where('code').equals('2010').first(); // Supplier liability

          if (cashAccount && accountsPayable) {
            await AccountingEngine.postEntry({
              date: new Date(paymentForm.date),
              reference: `SUP-PAY-${transId}`,
              description: `سداد دفعة مالية للمورد: ${selectedSupplier.name}`,
              lines: [
                {
                  accountId: accountsPayable.id!,
                  accountName: accountsPayable.name,
                  debit: paymentAmount,
                  credit: 0,
                  description: `تخفيض مستحقات المورد: ${selectedSupplier.name}`,
                },
                {
                  accountId: cashAccount.id!,
                  accountName: cashAccount.name,
                  debit: 0,
                  credit: paymentAmount,
                  description: `صرف من الصندوق للمورد`,
                },
              ],
              ignoreClosedPeriod: true,
            });
          }
        } catch (accErr) {
          console.error('Failed to post automatic journal entry for supplier payment:', accErr);
        }
      }

      // Update locally selectedSupplier's balance as well
      setSelectedSupplier({
        ...selectedSupplier,
        balance: updatedBalance,
      });

      setPaymentForm({
        amount: 0,
        date: format(new Date(), 'yyyy-MM-dd'),
        notes: '',
      });

      showNotification('تم تسجيل الدفعة بنجاح، وتحديث حساب المورد، وتوجيه الحركة محاسبياً في الأستاذ العام.');
    } catch (err) {
      console.error(err);
      showNotification('حدث خطأ أثناء معالجة الدفعة');
    }
  };

  const filteredSuppliers = suppliers.filter((s) => {
    if (filterCategory !== 'all' && s.category !== filterCategory) return false;
    if (
      searchQuery &&
      !s.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !s.phone?.includes(searchQuery)
    ) {
      return false;
    }
    return true;
  });

  const getCategoryLabel = (catId: string) =>
    CATEGORIES.find((c) => c.id === catId)?.label || catId;

  const getSupplierInvoices = (supplierId: number) => {
    return expenses.filter((e) => e.supplierId === supplierId).reverse();
  };

  const getSupplierPayments = (supplierId: number) => {
    return cashierTransactions
      .filter((t) => t.supplierId === supplierId && t.type === 'outflow')
      .reverse();
  };

  return {
    isCreateModalOpen,
    setIsCreateModalOpen,
    selectedSupplier,
    setSelectedSupplier,
    activeTab,
    setActiveTab,
    filterCategory,
    setFilterCategory,
    searchQuery,
    setSearchQuery,
    suppliers,
    expenses,
    cashierTransactions,
    form,
    setForm,
    paymentForm,
    setPaymentForm,
    handleCreate,
    handleAddPayment,
    filteredSuppliers,
    getCategoryLabel,
    getSupplierInvoices,
    getSupplierPayments,
    successMessage,
    setSuccessMessage,
  };
};

export default useSchoolSuppliers;
