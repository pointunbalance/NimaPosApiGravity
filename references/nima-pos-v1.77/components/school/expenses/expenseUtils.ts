export function getCategoryLabel(cat: string) {
  switch (cat) {
    case 'rent':
      return 'إيجار';
    case 'salary':
      return 'رواتب';
    case 'utilities':
      return 'فواتير (كهرباء/ماء)';
    case 'purchase':
      return 'مشتريات بضاعة';
    case 'marketing':
      return 'تسويق وإعلانات';
    case 'maintenance':
      return 'صيانة وإصلاح';
    case 'supplies':
      return 'مستلزمات مكتبية';
    case 'government':
      return 'رسوم حكومية';
    case 'transportation':
      return 'نقل ومواصلات';
    default:
      return 'نثريات / أخرى';
  }
}

export const CATEGORIES_LIST = [
  { value: 'rent', label: 'إيجار' },
  { value: 'salary', label: 'رواتب' },
  { value: 'utilities', label: 'فواتير (كهرباء/ماء)' },
  { value: 'purchase', label: 'مشتريات بضاعة' },
  { value: 'marketing', label: 'تسويق وإعلانات' },
  { value: 'maintenance', label: 'صيانة وإصلاح' },
  { value: 'supplies', label: 'مستلزمات مكتبية' },
  { value: 'government', label: 'رسوم حكومية' },
  { value: 'transportation', label: 'نقل ومواصلات' },
  { value: 'other', label: 'نثريات / أخرى' },
];

export function exportExpensesToCSV(filteredExpenses: any[], dateRange: { start: string; end: string }) {
  if (!filteredExpenses || filteredExpenses.length === 0) return;

  const headers = [
    'ID',
    'البيان',
    'المبلغ',
    'الضريبة',
    'التصنيف',
    'طريقة الدفع',
    'التاريخ',
    'المورد/المستفيد',
    'رقم المرجع',
    'ملاحظات',
  ];
  const rows = filteredExpenses.map((e) => [
    e.id,
    e.title,
    e.amount,
    e.taxAmount || 0,
    getCategoryLabel(e.category),
    e.paymentMethod === 'card' ? 'بطاقة' : e.paymentMethod === 'bank' ? 'تحويل بنكي' : 'نقدي',
    new Date(e.date).toLocaleDateString(),
    e.vendor || '',
    e.referenceNumber || '',
    e.notes || '',
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' +
    [headers.join(','), ...rows.map((r) => r.map((item) => `"${item}"`).join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `expenses_report_${dateRange.start}_${dateRange.end}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function formatExpenseCurrency(amount: number, currencyCode: string) {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatExpenseDate(date: Date | string) {
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function calculateExpenseStats(filteredExpenses: any[]) {
  if (!filteredExpenses) return { total: 0, count: 0, average: 0, cashTotal: 0, cardTotal: 0 };

  let total = 0;
  let cashTotal = 0;
  let cardTotal = 0;

  filteredExpenses.forEach((e) => {
    total += e.amount;
    if (e.paymentMethod === 'card' || e.paymentMethod === 'bank') cardTotal += e.amount;
    else cashTotal += e.amount; // Default to cash
  });

  const count = filteredExpenses.length;
  const average = count > 0 ? total / count : 0;
  return { total, count, average, cashTotal, cardTotal };
}

export function calculateExpenseChartData(filteredExpenses: any[]) {
  const map = new Map<string, number>();
  filteredExpenses.forEach((e) => {
    const cat = getCategoryLabel(e.category);
    map.set(cat, (map.get(cat) || 0) + e.amount);
  });
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function calculateExpenseTrendData(filteredExpenses: any[]) {
  const map = new Map<string, number>();
  [...filteredExpenses].reverse().forEach((e) => {
    const day = new Date(e.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    map.set(day, (map.get(day) || 0) + e.amount);
  });
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

import { db } from '../../../db';

export async function deleteExpenseFromDb(deleteId: number) {
  const expense = await db.schoolExpenses.get(deleteId);
  await db.schoolExpenses.delete(deleteId);
  if (expense && expense.paymentMethod === 'cash') {
    const openShift = await db.shifts.where('status').equals('open').first();
    if (openShift) {
      await db.shifts.update(openShift.id!, {
        expectedCash: openShift.expectedCash + expense.amount,
      });
    }
  }
}

export async function approveExpenseInDb(expense: any, userId: number) {
  await db.schoolExpenses.update(expense.id!, { status: 'approved', approvedBy: userId });

  // Affect shift if cash
  if (expense.paymentMethod === 'cash') {
    const openShift = await db.shifts.where('status').equals('open').first();
    if (openShift) {
      await db.shifts.update(openShift.id!, {
        expectedCash: openShift.expectedCash - expense.amount,
      });
    }
  }

  // Add journal entry using standard integrated accounting engine
  try {
    const creditAccountCode =
      expense.paymentMethod === 'cash'
        ? '1010'
        : expense.paymentMethod === 'bank'
        ? '1020'
        : '2010';
    const creditAccount = await db.accounts.where('code').equals(creditAccountCode).first();
    const expenseAccount = await db.accounts.where('code').equals('5020').first();

    if (creditAccount && expenseAccount) {
      const AccountingEngine = (await import('../../../services/AccountingEngine')).AccountingEngine;
      await AccountingEngine.postEntry({
        date: new Date(expense.date),
        reference: `EXP-${expense.id}`,
        description: `مصروف مدرسة معتمد: ${expense.title}`,
        lines: [
          {
            accountId: expenseAccount.id!,
            accountName: expenseAccount.name,
            debit: expense.amount,
            credit: 0,
            description: expense.category,
          },
          {
            accountId: creditAccount.id!,
            accountName: creditAccount.name,
            debit: 0,
            credit: expense.amount,
            description: `قيمة فاتورة مصروف من حساب الكاش/البنك`,
          },
        ],
        ignoreClosedPeriod: true,
      });
    }
  } catch (err) {
    console.error('Failed to post automatic journal entry for expense:', err);
  }
}

export async function rejectExpenseInDb(expense: any, userId: number) {
  await db.schoolExpenses.update(expense.id!, { status: 'rejected', approvedBy: userId });
}

export async function quickAddExpenseInDb(template: { title: string; category: string; amount: number }) {
  await db.transaction(
    'rw',
    db.schoolExpenses,
    db.shifts,
    db.journalEntries,
    db.accounts,
    async () => {
      const expenseId = await db.schoolExpenses.add({
        title: template.title,
        amount: template.amount,
        category: template.category as any,
        date: new Date(),
        paymentMethod: 'cash',
        notes: 'إضافة سريعة',
      });

      const openShift = await db.shifts.where('status').equals('open').first();
      if (openShift) {
        await db.shifts.update(openShift.id!, {
          expectedCash: openShift.expectedCash - template.amount,
        });
      }

      // Auto Accounting Integration (Journal Entry) for new expenses
      try {
        const creditAccount = await db.accounts.where('code').equals('1010').first(); // نقدية
        const expenseAccount = await db.accounts.where('code').equals('5020').first(); // مصروفات عامة أو تشغيلية

        if (creditAccount && expenseAccount) {
          const AccountingEngine = (await import('../../../services/AccountingEngine'))
            .AccountingEngine;
          await AccountingEngine.postEntry({
            date: new Date(),
            reference: `EXP-${expenseId}`,
            description: `مصروف: ${template.title}`,
            lines: [
              {
                accountId: expenseAccount.id!,
                accountName: expenseAccount.name,
                debit: template.amount,
                credit: 0,
                description: template.category,
              },
              {
                accountId: creditAccount.id!,
                accountName: creditAccount.name,
                debit: 0,
                credit: template.amount,
                description: `إضافة سريعة لمصروف`,
              },
            ],
          });
        }
      } catch (err) {
        console.error('Failed to post automatic journal entry for expense:', err);
      }
    }
  );
}


