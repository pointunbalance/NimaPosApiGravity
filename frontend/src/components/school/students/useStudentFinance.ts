import { useState } from 'react';
import { db } from '../../../db';
import { logActivity } from '../../../utils/logger';

export const useStudentFinance = (
  selectedChildId: number | null,
  children: any[]
) => {
  const [subForm, setSubForm] = useState({ 
    name: '', 
    price: '', 
    startDate: '', 
    endDate: '', 
    status: 'active', 
    paymentMethodType: 'cash', 
    downPayment: '', 
    installmentMonths: 2 
  });
  
  const [paymentForm, setPaymentForm] = useState({ 
    amount: '', 
    date: '', 
    type: 'قسط', 
    status: 'pending', 
    notes: '', 
    paymentMethod: 'نقدي' 
  });

  const handleAddSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId) return;
    try {
      if (subForm.paymentMethodType === 'installment') {
        const basePrice = Number(subForm.price);
        const downPayment = Number(subForm.downPayment) || 0;
        const numInst = Number(subForm.installmentMonths) || 1;
        const rem = basePrice - downPayment;
        const instAmount = rem / numInst;

        if (downPayment > 0) {
          await db.studentSubscriptions.add({ 
            name: `${subForm.name} - دفعة مقدمة`, 
            price: downPayment, 
            endDate: subForm.endDate || new Date().toISOString().split('T')[0], 
            status: 'active',
            studentId: selectedChildId 
          });
        }

        let currentDate = new Date(subForm.endDate || new Date());
        for (let i = 1; i <= numInst; i++) {
          currentDate.setMonth(currentDate.getMonth() + 1);
          const formatD = currentDate.toISOString().split('T')[0];
          await db.studentSubscriptions.add({ 
            name: `${subForm.name} - قسط ${i}`, 
            price: instAmount, 
            endDate: formatD, 
            status: 'active',
            studentId: selectedChildId 
          });
        }
        await logActivity('studentSubscriptions', 'إضافة نظام تقسيط', `تمت إضافة اشتراك للطفل: ${subForm.name} بنظام تقسيط على ${numInst} أشهر`, undefined, selectedChildId);
      } else {
        const actualName = subForm.paymentMethodType === 'deferred' ? `${subForm.name} (آجل)` : subForm.name;
        await db.studentSubscriptions.add({ 
          name: actualName, 
          price: subForm.price, 
          endDate: subForm.endDate || new Date().toISOString().split('T')[0], 
          status: 'active',
          studentId: selectedChildId
        });
        await logActivity('studentSubscriptions', 'إضافة اشتراك', `تمت إضافة اشتراك للطفل: ${actualName} بمبلغ ${subForm.price}`, undefined, selectedChildId);
      }

      setSubForm({ name: '', price: '', startDate: '', endDate: '', status: 'active', paymentMethodType: 'cash', downPayment: '', installmentMonths: 2 });
    } catch(err) { console.error(err); }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId) return;
    try {
      await db.studentPayments.add({ ...paymentForm, studentId: selectedChildId });

      const childData = children.find(c => c.id === selectedChildId);

      if (paymentForm.status === 'paid') {
        await db.journalEntries.add({
          date: new Date(paymentForm.date || new Date().toISOString().split('T')[0]),
          description: `سداد ${paymentForm.type} - الطالب ${childData?.name || 'غير معروف'}`,
          status: 'posted',
          totalAmount: Number(paymentForm.amount),
          reference: 'Student Payment',
          lines: [
            {
              accountId: 1,
              debit: Number(paymentForm.amount),
              credit: 0
            },
            {
              accountId: 4,
              debit: 0,
              credit: Number(paymentForm.amount)
            }
          ]
        });
      }
      await logActivity('studentPayments', 'سداد دفعة', `تم سداد ${paymentForm.amount} ج.م كـ ${paymentForm.type} (${paymentForm.paymentMethod || 'نقدي'})`, undefined, selectedChildId);
      setPaymentForm({ amount: '', date: '', type: 'قسط', status: 'pending', notes: '', paymentMethod: 'نقدي' });
    } catch(err) { console.error(err); }
  };

  return {
    subForm,
    setSubForm,
    paymentForm,
    setPaymentForm,
    handleAddSubscription,
    handleAddPayment
  };
};
