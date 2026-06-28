import { AccountingEngine } from '../services/AccountingEngine';
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Subscription } from '../types';

import SubscriptionsHeader from '../components/subscriptions/SubscriptionsHeader';
import SubscriptionsStats from '../components/subscriptions/SubscriptionsStats';
import SubscriptionsList from '../components/subscriptions/SubscriptionsList';
import SubscriptionModal from '../components/subscriptions/SubscriptionModal';

import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ui/ConfirmModal';

const Subscriptions = () => {
  const { success, error } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; subscriptionId: number } | null>(null);
  const [formData, setFormData] = useState<Partial<Subscription>>({
    customerId: 0,
    planName: '',
    amount: 0,
    billingCycle: 'monthly',
    nextBillingDate: new Date(),
    status: 'active'
  });

  const subscriptions = useLiveQuery(() => db.subscriptions.toArray());
  const customers = useLiveQuery(() => db.customers.toArray());

  const handleProcessRenewals = async () => {
      try {
          if (!subscriptions) return;
          const dueSubscriptions = subscriptions.filter(s => s.status === 'active' && new Date(s.nextBillingDate) <= new Date());
          
          if (dueSubscriptions.length === 0) {
              success('لا توجد اشتراكات مستحقة للتجديد حالياً');
              return;
          }

          let renewedCount = 0;
          
          await (db as any).transaction('rw', db.subscriptions, db.shifts, db.journalEntries, db.accounts, db.customers, async () => {
              const activeShift = await db.shifts.where('status').equals('open').first();
              const cashAccount = await db.accounts.where('code').equals('1010').first();
              const revenueAccount = await db.accounts.where('code').equals('4010').first();

              for (const sub of dueSubscriptions) {
                  const cust = await db.customers.get(sub.customerId);
                  if (!cust) continue;

                  let deductionSuccessful = false;
                  let walletDeduction = 0;
                  let debtIncrease = 0;

                  if (sub.amount > 0) {
                      const currentWallet = cust.walletBalance || 0;
                      if (currentWallet >= sub.amount) {
                          // Full deduction from wallet
                          walletDeduction = sub.amount;
                          deductionSuccessful = true;
                      } else {
                          // Partial from wallet, rest to debt
                          walletDeduction = currentWallet;
                          debtIncrease = sub.amount - currentWallet;
                          
                          const newBalance = (cust.balance || 0) + debtIncrease;
                          const creditLimit = cust.creditLimit || 0;
                          
                          if (creditLimit > 0 && newBalance > creditLimit) {
                              deductionSuccessful = false;
                          } else {
                              deductionSuccessful = true;
                          }
                      }

                      if (!deductionSuccessful) {
                          await db.subscriptions.update(sub.id!, { status: 'past_due' });
                          continue; // Skip renewal calculation
                      }

                      // Apply changes
                      await db.customers.update(cust.id!, {
                          walletBalance: currentWallet - walletDeduction,
                          balance: (cust.balance || 0) + debtIncrease
                      });

                      if (revenueAccount) {
                          const arAccount = await db.accounts.where('code').equals('1030').first(); // Accounts Receivable
                          const unearnedRevenueAccount = await db.accounts.where('code').equals('2030').first(); // Liability / Wallet

                          const lines = [];
                          if (debtIncrease > 0 && (arAccount || cashAccount)) {
                              lines.push({ accountId: arAccount?.id || cashAccount!.id!, accountName: arAccount ? arAccount.name : 'أرصدة', debit: debtIncrease, credit: 0, description: `استحقاق اشتراك` });
                          }
                          if (walletDeduction > 0 && unearnedRevenueAccount) {
                              lines.push({ accountId: unearnedRevenueAccount.id!, accountName: unearnedRevenueAccount.name, debit: walletDeduction, credit: 0, description: `خصم من المحفظة` });
                          }
                          lines.push({ accountId: revenueAccount.id!, accountName: revenueAccount.name, debit: 0, credit: sub.amount, description: `إيراد اشتراكات` });

                          await AccountingEngine.postEntry({
                              date: new Date(),
                              reference: `AUTORENEW-${sub.id}`,
                              description: `تجديد لاشتراك ${sub.planName} - ${cust.name}`,
                              lines: lines,
                          });
                      }
                  }

                  // Calculate next billing date
                  const nextDate = new Date(sub.nextBillingDate);
                  if (sub.billingCycle === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
                  else if (sub.billingCycle === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
                  else if (sub.billingCycle === 'weekly') nextDate.setDate(nextDate.getDate() + 7);

                  // Update subscription
                  await db.subscriptions.update(sub.id!, { nextBillingDate: nextDate });
                  
                  renewedCount++;
              }
          });

          success(`تم تجديد ${renewedCount} اشتراك مستحق بنجاح`);

      } catch (err) {
          console.error("Error processing renewals:", err);
          error('حدث خطأ أثناء تجديد الاشتراكات');
      }
  };

  const handleSave = async () => {
    try {
      await (db as any).transaction('rw', db.subscriptions, db.shifts, db.journalEntries, db.accounts, async () => {
        if (editingSubscription?.id) {
          await db.subscriptions.update(editingSubscription.id, formData as Subscription);
          success('تم تحديث الاشتراك بنجاح');
        } else {
          const newSubId = await db.subscriptions.add(formData as Subscription);
          success('تم إضافة الاشتراك الجديد بنجاح');
          if (formData.amount > 0) {
            const activeShift = await db.shifts.where('status').equals('open').first();
            if (activeShift) {
              await db.shifts.update(activeShift.id!, {
                expectedCash: (activeShift.expectedCash || 0) + formData.amount,
                cashSales: (activeShift.cashSales || 0) + formData.amount
              });
            }

            try {
              const cashAccount = await db.accounts.where('code').equals('1010').first();
              const revenueAccount = await db.accounts.where('code').equals('4010').first();
              
              if (cashAccount && revenueAccount) {
                await AccountingEngine.postEntry({
                  date: new Date(),
                  reference: `SUB-${newSubId}`,
                  description: `رسوم اشتراك ${formData.planName}`,
                  lines: [
                    { accountId: cashAccount.id!, accountName: cashAccount.name, debit: formData.amount, credit: 0, description: `استلام نقدي لاشتراك` },
                    { accountId: revenueAccount.id!, accountName: revenueAccount.name, debit: 0, credit: formData.amount, description: `إيراد اشتراكات` }
                  ],
                  });
              }
            } catch (err) {
              console.error("Failed to post journal entry for subscription:", err);
            }
          }
        }
      });
      setIsModalOpen(false);
      setEditingSubscription(null);
      setFormData({
        customerId: 0,
        planName: '',
        amount: 0,
        billingCycle: 'monthly',
        nextBillingDate: new Date(),
        status: 'active'
      });
    } catch (error) {
      console.error('Error saving subscription:', error);
    }
  };

  const handleEdit = (sub: Subscription) => {
    setEditingSubscription(sub);
    setFormData(sub);
    setIsModalOpen(true);
  };

  const confirmDeleteSubscription = (id: number) => {
    setConfirmConfig({ isOpen: true, subscriptionId: id });
  };

  const handleDelete = async () => {
    if (!confirmConfig) return;
    try {
      await db.subscriptions.delete(confirmConfig.subscriptionId);
      success('تم حذف الاشتراك بنجاح');
    } catch (err) {
      console.error(err);
      error('حدث خطأ أثناء حذف الاشتراك');
    }
    setConfirmConfig(null);
  };

  const filteredSubscriptions = subscriptions?.filter(sub => {
    const customer = customers?.find(c => c.id === sub.customerId);
    return customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           sub.planName.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  const activeSubscriptions = subscriptions?.filter(s => s.status === 'active').length || 0;
  const totalRevenue = subscriptions?.filter(s => s.status === 'active').reduce((sum, s) => sum + s.amount, 0) || 0;

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'cancelled': return 'ملغى';
      case 'past_due': return 'متأخر الدفع';
      default: return status;
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto bg-gradient-to-tr from-sky-50/60 via-indigo-50/40 via-slate-50 to-pink-50/40 font-['Tajawal'] min-h-screen rounded-2xl animate-in fade-in duration-350" dir="rtl">
      <SubscriptionsHeader 
        onOpenModal={() => {
          setEditingSubscription(null);
          setFormData({
            customerId: 0,
            planName: '',
            amount: 0,
            billingCycle: 'monthly',
            nextBillingDate: new Date(),
            status: 'active'
          });
          setIsModalOpen(true);
        }} 
        onProcessRenewals={handleProcessRenewals}
      />

      <SubscriptionsStats 
        activeSubscriptions={activeSubscriptions}
        totalRevenue={totalRevenue}
      />

      <SubscriptionsList 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filteredSubscriptions={filteredSubscriptions}
        customers={customers}
        onEdit={handleEdit}
        onDelete={confirmDeleteSubscription}
        getStatusText={getStatusText}
      />

      <SubscriptionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingSubscription={editingSubscription}
        formData={formData}
        setFormData={setFormData}
        customers={customers}
        onSave={handleSave}
      />

      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title="حذف الاشتراك"
          message="هل أنت متأكد من حذف هذا الاشتراك نهائياً؟ سيتم إلغاء التجديد التلقائي والمتابعة المرتبطة به."
          onConfirm={handleDelete}
          onCancel={() => setConfirmConfig(null)}
          confirmText="تأكيد الحذف"
          cancelText="إلغاء"
        />
      )}
    </div>
  );
};

export default Subscriptions;
