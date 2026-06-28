import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Shift } from '../../types';
import { AccountingEngine } from '../../services/AccountingEngine';
import { notificationEngine } from '../../services/NotificationEngine';

export const useShiftsState = (success: (msg: string) => void, showError: (msg: string) => void) => {
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Inputs
  const [startCashInput, setStartCashInput] = useState<number>(0);
  const [endCashInput, setEndCashInput] = useState<number>(0);
  const [closingNotes, setClosingNotes] = useState('');
  
  // UI State
  const [isMoneyCounterOpen, setIsMoneyCounterOpen] = useState(false);
  const [selectedShiftForDetails, setSelectedShiftForDetails] = useState<Shift | null>(null);
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');

  const [isConfirmReceiptOpen, setIsConfirmReceiptOpen] = useState(false);
  const [shiftToConfirm, setShiftToConfirm] = useState<Shift | null>(null);
  const [isOpeningShift, setIsOpeningShift] = useState(false);

  // User Loading
  const [currentUser, setCurrentUser] = useState<any>(null);

  const isManagerOrAdmin = currentUser?.role === 'admin' || 
                           currentUser?.role === 'manager' || 
                           currentUser?.permissions?.includes('shift_confirm') || 
                           currentUser?.permissions?.includes('all');

  useEffect(() => {
    const userStr = localStorage.getItem('nima_user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {}
    }
  }, []);

  // Queries
  const activeShifts = useLiveQuery(async () => {
    const shifts = await db.shifts.toArray();
    return shifts.filter(s => s.status === 'open').sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, []);

  const pendingShifts = useLiveQuery(async () => {
    const shifts = await db.shifts.toArray();
    return shifts.filter(s => s.status === 'pending_confirmation').sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, []);

  const pendingExpenses = useLiveQuery(async () => {
    const shifts = await db.shifts.toArray();
    let exps: { shiftId: number, expense: any }[] = [];
    shifts.forEach(s => {
      if (s.shiftExpenses) {
        s.shiftExpenses.forEach(exp => {
          if (!exp.isConfirmed) {
            exps.push({ shiftId: s.id!, expense: exp });
          }
        });
      }
    });
    return exps.sort((a,b) => new Date(b.expense.timestamp).getTime() - new Date(a.expense.timestamp).getTime());
  }, []);

  const shiftHistory = useLiveQuery(async () => {
    const shifts = await db.shifts.toArray();
    return shifts.filter(s => s.status === 'closed').sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).slice(0, 50); 
  }, []);

  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const currencyCode = settings?.currencyCode || 'IQD';

  // Stats
  const currentShiftStats = useLiveQuery(async () => {
    if (!currentShift || !currentShift.startTime) return { cashSales: 0, cardSales: 0, totalExpenses: 0 };
    
    try {
      const startDate = new Date(currentShift.startTime);
      
      // 1. Get Orders
      const allOrders = await db.orders.toArray();
      const validOrders = allOrders.filter(o => {
        const orderDate = new Date(o.date);
        return orderDate >= startDate;
      });

      // 2. Calculate Splits & Direct Payments
      let cash = 0;
      let card = 0;

      validOrders.forEach(o => {
        if (o.paymentMethod === 'split' && o.splitDetails) {
          cash += o.splitDetails.cash;
          card += o.splitDetails.card;
        } else if (o.paymentMethod === 'cash') {
          cash += o.totalAmount;
        } else if (o.paymentMethod === 'card') {
          card += o.totalAmount;
        }
      });
      
      // 3. Get Expenses (Only Cash payments)
      const allExpenses = await db.expenses.toArray();
      const shiftExpenses = allExpenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate >= startDate && (e.paymentMethod === 'cash' || !e.paymentMethod);
      }).reduce((sum, e) => sum + e.amount, 0);

      // 4. Get Customer Payments (Cash In)
      const allCustomerPayments = await db.customerPayments.toArray();
      const customerPaymentsTotal = allCustomerPayments.filter(p => {
        const paymentDate = new Date(p.date);
        return paymentDate >= startDate;
      }).reduce((sum, p) => sum + p.amount, 0);

      // 5. Get Supplier Refunds (Cash In)
      const allLogs = await db.logs.toArray();
      const supplierRefundsTotal = allLogs.filter(l => {
        const logDate = new Date(l.date);
        return logDate >= startDate && l.type === 'refund' && l.action.includes('استرداد مالي من مورد');
      }).reduce((sum, l) => sum + (l.amount || 0), 0);

      // 6. Get Installment Payments (Cash In)
      const allInstallments = await db.installmentPayments.toArray();
      const installmentsTotal = allInstallments.filter(ip => {
        if (!ip.paidDate || ip.status !== 'paid') return false;
        const paidDate = new Date(ip.paidDate);
        return paidDate >= startDate;
      }).reduce((sum, ip) => sum + ip.amount + (ip.lateFeeApplied || 0), 0);

      return { 
        cashSales: cash + customerPaymentsTotal + supplierRefundsTotal + installmentsTotal, 
        cardSales: card, 
        totalExpenses: shiftExpenses 
      };
    } catch (e) {
      console.error("Error calculating shift stats", e);
      return { cashSales: 0, cardSales: 0, totalExpenses: 0 };
    }
  }, [currentShift]);

  // Sync currentShift with active shifts
  useEffect(() => {
    if (activeShifts !== undefined && currentUser !== null) {
      if (!currentShift && activeShifts.length > 0) {
        if (!isManagerOrAdmin) {
          setCurrentShift(activeShifts[0]);
        }
      } else if (currentShift && !activeShifts.find(s => s.id === currentShift.id)) {
        setCurrentShift(activeShifts.length > 0 && !isManagerOrAdmin ? activeShifts[0] : null);
      } else if (activeShifts.length === 0) {
        setCurrentShift(null);
      }
      setIsLoading(false);
    }
  }, [activeShifts, isManagerOrAdmin, currentUser, currentShift]);

  const handleOpenShift = async () => {
    if (startCashInput < 0) return;
    try {
      const newShiftId = await db.shifts.add({
        startTime: new Date(),
        startCash: startCashInput,
        cashSales: 0,
        cardSales: 0,
        expectedCash: startCashInput,
        status: 'open'
      });
      const newShift = await db.shifts.get(newShiftId);
      if (newShift) {
        setCurrentShift(newShift);
        setIsOpeningShift(false);
        success('تم فتح الوردية بنجاح');
      }
      setStartCashInput(0);
    } catch (error) {
      console.error("Failed to open shift", error);
      showError('فشل فتح الوردية الجديدة');
    }
  };

  const handleCloseShift = async (confirmed?: boolean) => {
    if (!currentShift || !currentShiftStats) return;
    
    const expected = (currentShift.startCash + currentShiftStats.cashSales) - currentShiftStats.totalExpenses;
    const difference = endCashInput - expected;

    if (confirmed !== true) {
      const confirmMsg = difference !== 0 
        ? `يوجد فارق بقيمة ${formatCurrency(difference)}. هل أنت متأكد من إغلاق الوردية؟` 
        : "هل أنت متأكد من إغلاق الوردية الحالية؟";
      setConfirmMessage(confirmMsg);
      setIsConfirmCloseOpen(true);
      return;
    }

    setIsConfirmCloseOpen(false);

    try {
      await db.transaction('rw', db.shifts, db.journalEntries, db.accounts, async () => {
        await db.shifts.update(currentShift.id!, {
          endTime: new Date(),
          cashSales: currentShiftStats.cashSales,
          cardSales: currentShiftStats.cardSales,
          expectedCash: expected,
          actualCash: endCashInput,
          difference: difference,
          status: 'pending_confirmation',
          notes: closingNotes
        });

        // Create Journal Entry for the difference
        if (difference !== 0) {
          const cashAccount = await db.accounts.where('code').equals('1010').first();
          const diffAccount = await db.accounts.where('code').equals('5080').first();

          if (cashAccount && diffAccount) {
            const absDiff = Math.abs(difference);
            const isShortage = difference < 0;

            await AccountingEngine.postEntry({
              date: new Date(),
              reference: `SHIFT-${currentShift.id}`,
              description: `تسوية ${isShortage ? 'عجز' : 'زيادة'} وردية رقم #${currentShift.id}`,
              lines: [
                {
                  accountId: cashAccount.id!,
                  debit: isShortage ? 0 : absDiff,
                  credit: isShortage ? absDiff : 0,
                  description: `تسوية الصندوق للوردية #${currentShift.id}`
                },
                {
                  accountId: diffAccount.id!,
                  debit: isShortage ? absDiff : 0,
                  credit: isShortage ? 0 : absDiff,
                  description: `إثبات ${isShortage ? 'عجز' : 'زيادة'} الوردية #${currentShift.id}`
                }
              ]
            });
          }
        }
      });
      
      // WhatsApp notifications
      notificationEngine.sendOwnerWhatsAppReport('0500000000', {
        date: new Date().toLocaleDateString(),
        totalSales: currentShiftStats.cashSales + currentShiftStats.cardSales,
        orderCount: 0
      });

      setEndCashInput(0);
      setClosingNotes('');
      success('تم إغلاق الوردية وإرسال التقرير بنجاح. بانتظار تأكيد الإدارة.');
    } catch (error) {
      console.error("Failed to close shift", error);
      showError("حدث خطأ أثناء إغلاق الوردية.");
    }
  };

  const handleConfirmShift = async (shift: Shift, forceConfirm: boolean = false) => {
    if (!forceConfirm) {
      setShiftToConfirm(shift);
      setIsConfirmReceiptOpen(true);
      return;
    }
    
    setIsConfirmReceiptOpen(false);

    try {
      await db.shifts.update(shift.id!, {
        status: 'closed',
        confirmedAt: new Date(),
        confirmedByUserId: currentUser?.id
      });
      setShiftToConfirm(null);
      success('تم تأكيد استلام النقدية وإقفال الوردية نهائياً');
    } catch(e) {
      console.error("Failed to confirm shift", e);
      showError('فشل تأكيد الوردية');
    }
  };

  const handleConfirmExpense = async (shiftId: number, expenseId: string) => {
    try {
      const shift = await db.shifts.get(shiftId);
      if (!shift || !shift.shiftExpenses) return;
      
      const updatedExpenses = shift.shiftExpenses.map(exp => {
        if (exp.id === expenseId) {
          return { ...exp, isConfirmed: true, confirmedByUserId: currentUser?.id };
        }
        return exp;
      });
      
      await db.shifts.update(shiftId, {
        shiftExpenses: updatedExpenses
      });
      
      const expenseObj = shift.shiftExpenses.find(e => e.id === expenseId);
      if (expenseObj) {
        await db.transaction('rw', db.expenses, db.journalEntries, db.accounts, async () => {
          await db.expenses.add({
            title: expenseObj.description,
            amount: expenseObj.amount,
            category: (expenseObj.category as any) || 'other',
            date: new Date(),
            paymentMethod: 'cash',
            notes: 'مصروف مسحوب من الدرج بوردية رقم ' + shiftId
          });
        });
      }
      success('تم اعتماد المصروف وترحيله للنظام المحاسبي بنجاح');
    } catch(e) {
      console.error("Failed to confirm expense", e);
      showError('فشل تأكيد المصروف');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-IQ-u-nu-latn', { style: 'decimal', maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (date: Date) => {
    try {
      const d = date instanceof Date ? date : new Date(date);
      return d.toLocaleDateString('ar-IQ-u-nu-latn', {
        month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch (e) { return '-'; }
  };

  const handleExportCSV = () => {
    if (!shiftHistory) return;
    const hasViewExpectedCashPermission = currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.permissions?.includes('view_expected_cash') || currentUser?.permissions?.includes('all');

    const headers = hasViewExpectedCashPermission ? 
      ['رقم الوردية', 'وقت الفتح', 'وقت الإغلاق', 'الرصيد الافتتاحي', 'المبيعات النقدية', 'المتوقع في الدرج', 'العد الفعلي', 'الفارق', 'ملاحظات'] :
      ['رقم الوردية', 'وقت الفتح', 'وقت الإغلاق', 'الرصيد الافتتاحي', 'المبيعات النقدية', 'العد الفعلي', 'ملاحظات'];
      
    const rows = shiftHistory.map(s => {
      const baseObj = [
        s.id,
        formatDate(s.startTime),
        s.endTime ? formatDate(s.endTime) : '',
        s.startCash,
        s.cashSales,
      ];
      
      if (hasViewExpectedCashPermission) {
        return [...baseObj, s.expectedCash, s.actualCash || 0, s.difference || 0, `"${s.notes || ''}"`];
      } else {
        return [...baseObj, s.actualCash || 0, `"${s.notes || ''}"`];
      }
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "shifts_history.csv";
    link.click();
    success('تم تصدير ملف CSV بنجاح');
  };

  return {
    currentShift,
    setCurrentShift,
    isLoading,
    startCashInput,
    setStartCashInput,
    endCashInput,
    setEndCashInput,
    closingNotes,
    setClosingNotes,
    isMoneyCounterOpen,
    setIsMoneyCounterOpen,
    selectedShiftForDetails,
    setSelectedShiftForDetails,
    isConfirmCloseOpen,
    setIsConfirmCloseOpen,
    confirmMessage,
    isConfirmReceiptOpen,
    setIsConfirmReceiptOpen,
    shiftToConfirm,
    setShiftToConfirm,
    isOpeningShift,
    setIsOpeningShift,
    currentUser,
    isManagerOrAdmin,
    activeShifts,
    pendingShifts,
    pendingExpenses,
    shiftHistory,
    settings,
    currencyCode,
    currentShiftStats,
    handleOpenShift,
    handleCloseShift,
    handleConfirmShift,
    handleConfirmExpense,
    formatCurrency,
    formatDate,
    handleExportCSV
  };
};
