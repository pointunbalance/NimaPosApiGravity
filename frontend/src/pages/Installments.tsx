import { AccountingEngine } from '../services/AccountingEngine';
import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { InstallmentPlan, InstallmentPayment } from '../types';
import { useToast } from '../context/ToastContext';

import InstallmentsHeader from '../components/installments/InstallmentsHeader';
import InstallmentsList from '../components/installments/InstallmentsList';
import InstallmentPlanModal from '../components/installments/InstallmentPlanModal';

const Installments: React.FC = () => {
  const { success, error } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [expandedPlanId, setExpandedPlanId] = useState<number | null>(null);
  
  const plans = useLiveQuery(() => db.installmentPlans.toArray()) || [];
  const payments = useLiveQuery(() => db.installmentPayments.toArray()) || [];
  const customers = useLiveQuery(() => db.customers.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.toCollection().first());

  const [formData, setFormData] = useState({
    customerId: '',
    principalAmount: '',
    downPayment: '',
    installmentCount: '12',
    startDate: new Date().toISOString().split('T')[0],
    interestType: 'none' as 'none' | 'fixed' | 'declining',
    interestRate: '0',
    lateFeeEnabled: false,
    lateFeeType: 'fixed' as 'fixed' | 'percentage',
    lateFeeAmount: '0',
    gracePeriodDays: '5',
    notes: ''
  });

  const filteredPlans = plans.filter(plan => {
    const customer = customers.find(c => c.id === plan.customerId);
    return customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           plan.id?.toString().includes(searchQuery);
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const calculatedSchedule = useMemo(() => {
    const principal = parseFloat(formData.principalAmount) || 0;
    const downPayment = parseFloat(formData.downPayment) || 0;
    const count = parseInt(formData.installmentCount) || 1;
    const rate = parseFloat(formData.interestRate) || 0;
    
    const financedAmount = Math.max(0, principal - downPayment);
    let schedule = [];
    let totalInterest = 0;

    if (financedAmount <= 0) return { schedule: [], totalInterest: 0, financedAmount: 0, totalAmount: 0 };

    if (formData.interestType === 'none' || rate === 0) {
      const monthly = financedAmount / count;
      for (let i = 0; i < count; i++) {
        schedule.push({ principalPart: monthly, interestPart: 0, amount: monthly });
      }
    } else if (formData.interestType === 'fixed') {
      // Annual rate
      const interest = financedAmount * (rate / 100) * (count / 12);
      totalInterest = interest;
      const total = financedAmount + interest;
      const monthly = total / count;
      for (let i = 0; i < count; i++) {
        schedule.push({ principalPart: financedAmount/count, interestPart: interest/count, amount: monthly });
      }
    } else if (formData.interestType === 'declining') {
      const monthlyRate = (rate / 100) / 12;
      const monthlyPayment = financedAmount * (monthlyRate * Math.pow(1 + monthlyRate, count)) / (Math.pow(1 + monthlyRate, count) - 1);
      
      let remaining = financedAmount;
      for (let i = 0; i < count; i++) {
        const interestPart = remaining * monthlyRate;
        const principalPart = monthlyPayment - interestPart;
        schedule.push({ principalPart, interestPart, amount: monthlyPayment });
        remaining -= principalPart;
        totalInterest += interestPart;
      }
    }

    return { schedule, totalInterest, financedAmount, totalAmount: financedAmount + totalInterest };
  }, [formData]);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const customerId = parseInt(formData.customerId);
    const principalAmount = parseFloat(formData.principalAmount);
    const downPayment = parseFloat(formData.downPayment) || 0;
    const installmentCount = parseInt(formData.installmentCount);
    const startDate = new Date(formData.startDate);

    if (!customerId || !principalAmount || !installmentCount) {
      error('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }

    if (downPayment >= principalAmount) {
      error('الدفعة المقدمة يجب أن تكون أقل من إجمالي المبلغ');
      return;
    }

    const { schedule, totalInterest, totalAmount } = calculatedSchedule;
    const installmentAmount = totalAmount / installmentCount;

    try {
      await db.transaction('rw', db.installmentPlans, db.installmentPayments, db.customers, async () => {
        // Create Plan
        const planId = await db.installmentPlans.add({
          customerId,
          principalAmount,
          totalAmount,
          downPayment,
          remainingAmount: totalAmount,
          installmentCount,
          installmentAmount,
          startDate,
          status: 'active',
          notes: formData.notes,
          createdAt: new Date(),
          interestType: formData.interestType,
          interestRate: parseFloat(formData.interestRate) || 0,
          totalInterestAmount: totalInterest,
          lateFeeEnabled: formData.lateFeeEnabled,
          lateFeeType: formData.lateFeeType,
          lateFeeAmount: parseFloat(formData.lateFeeAmount) || 0,
          gracePeriodDays: parseInt(formData.gracePeriodDays) || 0
        });

        // Create Payments
        const paymentsToCreate: InstallmentPayment[] = [];
        for (let i = 0; i < installmentCount; i++) {
          const dueDate = new Date(startDate);
          dueDate.setMonth(dueDate.getMonth() + i);
          
          paymentsToCreate.push({
            planId: planId as number,
            customerId,
            amount: schedule[i].amount,
            principalPart: schedule[i].principalPart,
            interestPart: schedule[i].interestPart,
            dueDate,
            status: 'pending'
          });
        }
        await db.installmentPayments.bulkAdd(paymentsToCreate);

        // Update Customer Balance
        const customer = await db.customers.get(customerId);
        if (customer) {
          await db.customers.update(customerId, {
            balance: (customer.balance || 0) + totalAmount
          });
        }
      });

      success('تم إنشاء خطة الأقساط بنجاح');
      setShowNewModal(false);
      setFormData({
        customerId: '',
        principalAmount: '',
        downPayment: '',
        installmentCount: '12',
        startDate: new Date().toISOString().split('T')[0],
        interestType: 'none',
        interestRate: '0',
        lateFeeEnabled: false,
        lateFeeType: 'fixed',
        lateFeeAmount: '0',
        gracePeriodDays: '5',
        notes: ''
      });
    } catch (err) {
      console.error(err);
      error('حدث خطأ أثناء إنشاء الأقساط');
    }
  };

  const handlePayInstallment = async (payment: InstallmentPayment, plan: InstallmentPlan) => {
    let lateFee = 0;
    const now = new Date();
    const dueDate = new Date(payment.dueDate);
    
    if (plan.lateFeeEnabled && payment.status === 'pending') {
      const graceDate = new Date(dueDate);
      graceDate.setDate(graceDate.getDate() + plan.gracePeriodDays);
      
      if (now > graceDate) {
        if (plan.lateFeeType === 'fixed') {
          lateFee = plan.lateFeeAmount;
        } else {
          lateFee = payment.amount * (plan.lateFeeAmount / 100);
        }
      }
    }

    let confirmMsg = `تأكيد دفع القسط بقيمة ${payment.amount.toFixed(2)} ${settings?.currency}؟`;
    if (lateFee > 0) {
      confirmMsg = `هذا القسط متأخر! سيتم إضافة غرامة تأخير بقيمة ${lateFee.toFixed(2)} ${settings?.currency}.\nإجمالي المطلوب: ${(payment.amount + lateFee).toFixed(2)} ${settings?.currency}\nهل تريد المتابعة؟`;
    }

    if (!window.confirm(confirmMsg)) return;

    try {
      await (db as any).transaction('rw', db.installmentPayments, db.installmentPlans, db.customers, db.journalEntries, db.accounts, async () => {
        // Update Payment
        await db.installmentPayments.update(payment.id!, {
          status: 'paid',
          paidDate: new Date(),
          lateFeeApplied: lateFee
        });

        // Update Plan
        const newRemaining = Math.round((plan.remainingAmount - payment.amount) * 100) / 100;
        const isCompleted = newRemaining <= 0.01; // Handle floating point issues
        
        await db.installmentPlans.update(plan.id!, {
          remainingAmount: Math.max(0, newRemaining),
          status: isCompleted ? 'completed' : 'active'
        });

        // Update Customer Balance
        const customer = await db.customers.get(payment.customerId);
        if (customer) {
          await db.customers.update(payment.customerId, {
            balance: Math.max(0, Math.round(((customer.balance || 0) - payment.amount) * 100) / 100)
          });
        }
        
        // Auto Accounting Integration (Journal Entry)
        try {
            const cashAccount = await db.accounts.where('code').equals('1010').first(); // النقدية
            const arAccount = await db.accounts.where('code').equals('1030').first(); // ذمم مدينة (عملاء)
            
            if (cashAccount && arAccount) {
                const totalAmountPaid = payment.amount + lateFee;
                const lines = [
                    { accountId: cashAccount.id!, accountName: cashAccount.name, debit: totalAmountPaid, credit: 0, description: `دفع قسط نقداً` },
                    { accountId: arAccount.id!, accountName: arAccount.name, debit: 0, credit: payment.amount, description: `تخفيض المديونية للقسط` }
                ];
                
                if (lateFee > 0) {
                    const lateFeeAccount = await db.accounts.where('code').equals('4020').first(); // إيرادات أخرى
                    if (lateFeeAccount) {
                        lines.push({ accountId: lateFeeAccount.id!, accountName: lateFeeAccount.name, debit: 0, credit: lateFee, description: `غرامة تأخير قسط` });
                    } else {
                        // Fallback to arAccount if no other revenue account
                         lines[1].credit += lateFee;
                    }
                }

                await AccountingEngine.postEntry({
                    date: new Date(),
                    reference: `INST-${payment.id}`,
                    description: `سداد قسط للعميل ${customer?.name || ''}`,
                    lines: lines,
                    });
            }
        } catch (err) {
             console.error("Failed to post automatic journal entry for installment:", err);
        }
      });

      success('تم تسجيل الدفعة بنجاح');
    } catch (err) {
      console.error(err);
      error('حدث خطأ أثناء تسجيل الدفعة');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <InstallmentsHeader onOpenNewModal={() => setShowNewModal(true)} />

      <InstallmentsList 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredPlans={filteredPlans}
        customers={customers}
        payments={payments}
        expandedPlanId={expandedPlanId}
        setExpandedPlanId={setExpandedPlanId}
        currency={settings?.currency || 'IQD'}
        onPayInstallment={handlePayInstallment}
      />

      <InstallmentPlanModal 
        showNewModal={showNewModal}
        setShowNewModal={setShowNewModal}
        formData={formData}
        setFormData={setFormData}
        customers={customers}
        calculatedSchedule={calculatedSchedule}
        currency={settings?.currency || 'IQD'}
        onCreatePlan={handleCreatePlan}
      />
    </div>
  );
};

export default Installments;
