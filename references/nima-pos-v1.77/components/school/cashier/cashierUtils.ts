import { db } from '../../../db';
import { AccountingEngine } from '../../../services/AccountingEngine';

export const getStudentName = (students: any[], id: number) =>
  students.find((s) => s.id === id)?.name || 'غير معروف';

export const getFeeTypeName = (feeTypes: any[], id: number) =>
  feeTypes.find((f) => f.id === id)?.name || 'غير معروف';

interface Shift {
  startCash: number;
  [key: string]: any;
}

export const calculateExpectedCash = (
  activeShift: Shift | undefined,
  shiftPayments: any[],
  shiftGeneralOps: any[]
) => {
  if (!activeShift) return 0;
  const totalPayments = shiftPayments.reduce((acc, p) => acc + p.amount, 0);
  const inflows = shiftGeneralOps.filter((t) => t.type === 'inflow').reduce((acc, t) => acc + t.amount, 0);
  const outflows = shiftGeneralOps.filter((t) => t.type === 'outflow').reduce((acc, t) => acc + t.amount, 0);
  return activeShift.startCash + totalPayments + inflows - outflows;
};

export const calculateCardPayments = (shiftPayments: any[], shiftGeneralOps: any[]) => {
  const cardPayments = shiftPayments.filter((p) => p.paymentMethod !== 'cash').reduce((acc, p) => acc + p.amount, 0);
  const generalInflows = shiftGeneralOps.filter((t) => t.type === 'inflow' && t.paymentMethod !== 'cash').reduce((sum, t) => sum + t.amount, 0);
  return cardPayments + generalInflows;
};

export const calculateCashIn = (shiftPayments: any[], shiftGeneralOps: any[]) => {
  const cashPayments = shiftPayments.filter((p) => p.paymentMethod === 'cash').reduce((acc, p) => acc + p.amount, 0);
  const generalInflows = shiftGeneralOps.filter((t) => t.type === 'inflow' && t.paymentMethod === 'cash').reduce((sum, t) => sum + t.amount, 0);
  return cashPayments + generalInflows;
};

export const calculateCashOut = (shiftGeneralOps: any[]) => {
  return shiftGeneralOps.filter((t) => t.type === 'outflow' && t.paymentMethod === 'cash').reduce((sum, t) => sum + t.amount, 0);
};

export const saveStudentPayment = async (
  paymentFormData: any,
  subscriptions: any[],
  studentName: string,
  feeName: string
) => {
  const amount = Number(paymentFormData.amount);
  const paymentDate = new Date().toISOString();

  // Save Payment
  const paymentId = await db.studentPayments.add({
    receiptNumber: 'REC-' + Date.now().toString().slice(-6),
    studentId: Number(paymentFormData.studentId),
    subscriptionId: paymentFormData.subscriptionId ? Number(paymentFormData.subscriptionId) : undefined,
    amount,
    paymentMethod: paymentFormData.paymentMethod,
    paymentDate: paymentDate,
    userId: 1,
    notes: paymentFormData.notes,
  });

  // Update Subscription
  if (paymentFormData.subscriptionId) {
    const sub = subscriptions.find((s) => s.id === Number(paymentFormData.subscriptionId));
    if (sub) {
      const totalPaid = Number(sub.totalPaid || 0) + amount;
      const remainingAmount = Number(sub.totalRequired) - totalPaid;
      await db.studentSubscriptions.update(sub.id!, {
        totalPaid,
        remainingAmount,
        status: remainingAmount <= 0 ? 'paid' : 'partial',
      });
    }
  }

  // Global Accounting Integration (Journal Entry) for Student Payment
  try {
    if (amount > 0) {
      let debitAccountCode = '1010'; // Default Cash Cashier
      if (paymentFormData.paymentMethod === 'bank_transfer') debitAccountCode = '1020'; // Bank

      const debitAccount = await db.accounts.where('code').equals(debitAccountCode).first();
      const revenueAccount = await db.accounts.where('code').equals('4010').first();

      if (debitAccount && revenueAccount) {
        await AccountingEngine.postEntry({
          date: new Date(paymentDate),
          reference: `SCH-PAY-${paymentId}`,
          description: `قيد تلقائي لسداد رسوم دراسية للطالب: ${studentName} - الخدمة: ${feeName}`,
          lines: [
            {
              accountId: debitAccount.id!,
              accountName: debitAccount.name,
              debit: amount,
              credit: 0,
              description: `استلام دفعة رسوم من الطالب ${studentName}`,
            },
            {
              accountId: revenueAccount.id!,
              accountName: revenueAccount.name,
              debit: 0,
              credit: amount,
              description: `إيرادات رسوم دراسية - ${feeName}`,
            },
          ],
          ignoreClosedPeriod: true,
        });
      }
    }
  } catch (acctErr) {
    console.error('Accounting Integration Error (School Student Cashier Payment):', acctErr);
  }

  return paymentId;
};

export const saveGeneralTransaction = async (transactionFormData: any) => {
  const amount = Number(transactionFormData.amount);
  const addedId = await db.treasuryTransactions.add({
    type: transactionFormData.type,
    amount,
    date: new Date().toISOString(),
    description: transactionFormData.description,
    category: transactionFormData.category,
    paymentMethod: transactionFormData.paymentMethod,
    referenceNumber: 'TRN-' + Date.now().toString().slice(-6),
    status: 'completed',
  });

  // Global Accounting Integration (Journal Entry) for General Treasury Trans
  try {
    if (amount > 0) {
      const isInflow = transactionFormData.type === 'inflow';

      let cashAccountCode = '1010'; // Cash
      if (transactionFormData.paymentMethod === 'bank_transfer') cashAccountCode = '1020'; // Bank

      const cashAccount = await db.accounts.where('code').equals(cashAccountCode).first();

      if (isInflow) {
        const revenueAccount = await db.accounts.where('code').equals('4010').first();
        if (cashAccount && revenueAccount) {
          await AccountingEngine.postEntry({
            date: new Date(),
            reference: `SCH-TRN-${addedId}`,
            description: `قيد تلقائي لتوريد إيراد عام خزينة المدرسة: ${transactionFormData.description}`,
            lines: [
              {
                accountId: cashAccount.id!,
                accountName: cashAccount.name,
                debit: amount,
                credit: 0,
                description: `توريد للخزينة - ${transactionFormData.description}`,
              },
              {
                accountId: revenueAccount.id!,
                accountName: revenueAccount.name,
                debit: 0,
                credit: amount,
                description: `إيرادات عامة غير تشغيلية`,
              },
            ],
            ignoreClosedPeriod: true,
          });
        }
      } else {
        const expenseAccount = await db.accounts.where('code').equals('5020').first();
        if (cashAccount && expenseAccount) {
          await AccountingEngine.postEntry({
            date: new Date(),
            reference: `SCH-TRN-${addedId}`,
            description: `قيد تلقائي لمصروف خزينة المدرسة: ${transactionFormData.description}`,
            lines: [
              {
                accountId: expenseAccount.id!,
                accountName: expenseAccount.name,
                debit: amount,
                credit: 0,
                description: `صرف مصروف عام - ${transactionFormData.description}`,
              },
              {
                accountId: cashAccount.id!,
                accountName: cashAccount.name,
                debit: 0,
                credit: amount,
                description: `صرف نقدي من الخزينة`,
              },
            ],
            ignoreClosedPeriod: true,
          });
        }
      }
    }
  } catch (acctErr) {
    console.error('Accounting Integration Error (School Treasury transaction):', acctErr);
  }

  return addedId;
};
