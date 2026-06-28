import { useState } from 'react';
import { Customer, CustomerPayment } from '../../types';
import { db } from '../../db';
import { logActivity } from '../../utils/logger';
import { AccountingEngine } from '../../services/AccountingEngine';

export const useCustomerActions = (
  settings: any,
  selectedProfile: Customer | null,
  setSelectedProfile: (customer: Customer | null) => void,
  setProfilePayments: (payments: CustomerPayment[]) => void,
  success: (msg: string) => void,
  error: (msg: string) => void,
  formatCurrency: (amount: number) => string
) => {
  // Add/Edit customer form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Payment/Deposit modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'debt_payment' | 'wallet_deposit'>('debt_payment');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentNote, setPaymentNote] = useState('');
  const [quickPayTarget, setQuickPayTarget] = useState<Customer | null>(null);

  // Delete confirm state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [customerToDeleteId, setCustomerToDeleteId] = useState<number | null>(null);

  const openModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
    } else {
      setEditingCustomer(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const openPaymentModal = (type: 'debt_payment' | 'wallet_deposit', targetCustomer?: Customer) => {
    setPaymentType(type);
    setPaymentAmount('');
    setPaymentNote('');
    if (targetCustomer) setQuickPayTarget(targetCustomer);
    else setQuickPayTarget(null);
    setIsPaymentModalOpen(true);
  };

  const deleteCustomer = (id: number) => {
    setCustomerToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const executeDeleteCustomer = async () => {
    if (!customerToDeleteId) return;
    try {
      await db.customers.delete(customerToDeleteId);
      if (selectedProfile?.id === customerToDeleteId) setSelectedProfile(null);
      success('تم حذف العميل وسجلاته بنجاح.');
    } catch (err) {
      console.error("Delete failed", err);
      error('فشل في حذف العميل');
    } finally {
      setIsDeleteConfirmOpen(false);
      setCustomerToDeleteId(null);
    }
  };

  const handleProcessPayment = async () => {
    const target = quickPayTarget || selectedProfile;
    if (!target || !target.id || !paymentAmount) return;
    
    const amount = parseFloat(paymentAmount);
    if (amount <= 0) return;

    try {
      await (db as any).transaction('rw', db.customers, db.customerPayments, db.logs, db.shifts, db.journalEntries, db.accounts, async () => {
        if (paymentType === 'debt_payment') {
          const currentBalance = target.balance || 0;
          await db.customers.update(target.id!, {
            balance: Math.max(0, currentBalance - amount)
          });
          await logActivity('payment', `سداد دين للعميل ${target.name}`, `المبلغ: ${amount}`, amount, target.id);
        } else {
          // Wallet Deposit
          const currentWallet = target.walletBalance || 0;
          await db.customers.update(target.id!, {
            walletBalance: currentWallet + amount
          });
          await logActivity('customer', `شحن محفظة للعميل ${target.name}`, `المبلغ: ${amount}`, amount, target.id);
        }

        // Log Payment Record
        const paymentId = await db.customerPayments.add({
          customerId: target.id!,
          amount: amount,
          date: new Date(),
          type: paymentType,
          note: paymentNote || (paymentType === 'debt_payment' ? 'سداد دفعة' : 'شحن رصيد')
        });
        
        const openShift = await db.shifts.where('status').equals('open').first();
        if (openShift) {
          await db.shifts.update(openShift.id!, {
            expectedCash: openShift.expectedCash + amount
          });
        }

        // Auto Accounting Integration (Journal Entry)
        try {
          const cashAccount = await db.accounts.where('code').equals('1010').first(); // النقدية
          
          let creditAccountCode = '1030'; // Debt payment -> Accounts Receivable (Decrease)
          if (paymentType === 'wallet_deposit') {
            creditAccountCode = '2030'; // Wallet / Unearned Revenue (Increase Liability)
          }
          
          const creditAccount = await db.accounts.where('code').equals(creditAccountCode).first();
          
          if (cashAccount && creditAccount) {
            await AccountingEngine.postEntry({
              date: new Date(),
              reference: `CUSPAY-${paymentId}`,
              description: paymentType === 'debt_payment' ? `تسديد مديونية من العميل ${target.name}` : `شحن محفظة العميل ${target.name}`,
              lines: [
                { accountId: cashAccount.id!, accountName: cashAccount.name, debit: amount, credit: 0, description: `استلام نقدي` },
                { accountId: creditAccount.id!, accountName: creditAccount.name, debit: 0, credit: amount, description: paymentType === 'debt_payment' ? `ذمم مدينة (${target.name})` : `أرصدة دائنة محفظة عملاء` }
              ],
            });
          }
        } catch (err) {
          console.error("Failed to post automatic journal entry for customer payment:", err);
        }
      });
      
      success(`تمت العملية بنجاح: ${formatCurrency(amount)}`);
      
      // Refresh Local State if profile is open
      if (selectedProfile && selectedProfile.id === target.id) {
        const updatedProfile = await db.customers.get(target.id!);
        const updatedPayments = await db.customerPayments.where('customerId').equals(target.id!).reverse().toArray();
        if (updatedProfile) setSelectedProfile(updatedProfile);
        setProfilePayments(updatedPayments);
      }
      
      setIsPaymentModalOpen(false);
      setPaymentAmount('');
      setPaymentNote('');
      setQuickPayTarget(null);
    } catch (e) {
      console.error("Error processing payment", e);
      error('حدث خطأ أثناء معالجة الدفع');
    }
  };

  const handleSaveCustomer = async (data: Partial<Customer>) => {
    try {
      // Duplicate checking for phone or email
      if (data.phone) {
        const duplicatePhone = await db.customers.where('phone').equals(data.phone).first();
        if (duplicatePhone && duplicatePhone.id !== editingCustomer?.id) {
          error('رقم الهاتف مستخدم لعميل آخر');
          return;
        }
      }
      
      if (data.email) {
        const duplicateEmail = await db.customers.where('email').equals(data.email).first();
        if (duplicateEmail && duplicateEmail.id !== editingCustomer?.id) {
          error('البريد الإلكتروني مستخدم لعميل آخر');
          return;
        }
      }

      if (editingCustomer?.id) {
        await db.customers.update(editingCustomer.id, data);
        if (selectedProfile?.id === editingCustomer.id) {
          setSelectedProfile({ ...editingCustomer, ...data } as Customer);
        }
        success('تم تحديث بيانات العميل بنجاح');
      } else {
        // For new customers, assign welcome bonus if loyalty is enabled
        let loyaltyPoints = 0;
        if (settings?.loyaltySettings?.enabled && settings.loyaltySettings.welcomeBonus) {
          loyaltyPoints = settings.loyaltySettings.welcomeBonus;
        }

        const newCustomerId = await db.customers.add({ ...data, loyaltyPoints, createdAt: new Date() } as Customer);
        
        if (loyaltyPoints > 0) {
          await db.loyaltyTransactions.add({
            customerId: newCustomerId as number,
            points: loyaltyPoints,
            type: 'earn',
            date: new Date(),
            note: 'مكافأة تسجيل'
          });
        }
        success('تم إضافة العميل بنجاح');
      }
      closeModal();
    } catch (err) {
      console.error("Error saving customer", err);
      error('حدث خطأ أثناء حفظ بيانات العميل');
    }
  };

  return {
    isModalOpen,
    editingCustomer,
    openModal,
    closeModal,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    paymentType,
    paymentAmount,
    setPaymentAmount,
    paymentNote,
    setPaymentNote,
    quickPayTarget,
    setQuickPayTarget,
    openPaymentModal,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    customerToDeleteId,
    setCustomerToDeleteId,
    deleteCustomer,
    executeDeleteCustomer,
    handleProcessPayment,
    handleSaveCustomer
  };
};
