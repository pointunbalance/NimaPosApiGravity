import { useState } from 'react';
import { db } from '../../db';
import { Expense } from '../../types';
import { getCategoryLabel } from './useExpensesData';

export const useExpensesActions = (
  filteredExpenses: Expense[],
  dateRange: { start: string; end: string },
  success: (msg: string) => void,
  error: (msg: string) => void
) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [duplicateExpense, setDuplicateExpense] = useState<Expense | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [expenseToDeleteId, setExpenseToDeleteId] = useState<number | null>(null);

  const deleteExpense = (id: number) => {
    setExpenseToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const executeDeleteExpense = async () => {
    if (!expenseToDeleteId) return;
    try {
      const expense = await db.expenses.get(expenseToDeleteId);
      await db.expenses.delete(expenseToDeleteId);
      if (expense && expense.paymentMethod === 'cash') {
        const openShift = await db.shifts.where('status').equals('open').first();
        if (openShift) {
          await db.shifts.update(openShift.id!, {
            expectedCash: openShift.expectedCash + expense.amount
          });
        }
      }
      success('تم حذف المصروف بنجاح');
    } catch (err) {
      console.error("Expense delete failed", err);
      error('حدث خطأ أثناء حذف المصروف');
    } finally {
      setIsDeleteConfirmOpen(false);
      setExpenseToDeleteId(null);
    }
  };

  const handleApprove = async (expense: Expense) => {
    try {
      const currentUserData = localStorage.getItem('nima_user');
      const user = currentUserData ? JSON.parse(currentUserData) : { id: 1 };
      
      await db.expenses.update(expense.id!, { status: 'approved', approvedBy: user.id });
      
      // Affect shift if cash
      if (expense.paymentMethod === 'cash') {
        const openShift = await db.shifts.where('status').equals('open').first();
        if (openShift) {
          await db.shifts.update(openShift.id!, {
            expectedCash: openShift.expectedCash - expense.amount
          });
        }
      }
      
      // Add journal entry
      try {
        const creditAccountCode = expense.paymentMethod === 'cash' ? '1010' : expense.paymentMethod === 'bank' ? '1020' : '2010';
        const creditAccount = await db.accounts.where('code').equals(creditAccountCode).first();
        const expenseAccount = await db.accounts.where('code').equals('5020').first();
        
        if (creditAccount && expenseAccount) {
          await db.journalEntries.add({
            date: expense.date,
            reference: `EXP-${expense.id}`,
            description: `مصروف: ${expense.title}`,
            lines: [
              { accountId: expenseAccount.id!, accountName: expenseAccount.name, debit: expense.amount, credit: 0, description: expense.category },
              { accountId: creditAccount.id!, accountName: creditAccount.name, debit: 0, credit: expense.amount, description: `دفع فاتورة مصروف` }
            ],
            totalAmount: expense.amount,
            status: 'posted'
          });
        }
      } catch (err) {
        console.error("Failed to post automatic journal entry for expense:", err);
      }
      success('تمت الموافقة على المصروف بنجاح');
    } catch (err) {
      console.error(err);
      error('حدث خطأ أثناء الموافقة');
    }
  };

  const handleReject = async (expense: Expense) => {
    try {
      const currentUserData = localStorage.getItem('nima_user');
      const user = currentUserData ? JSON.parse(currentUserData) : { id: 1 };
      await db.expenses.update(expense.id!, { status: 'rejected', approvedBy: user.id });
      success('تم رفض المصروف بنجاح');
    } catch (err) {
      console.error(err);
      error('حدث خطأ أثناء معالجة الرفض');
    }
  };

  const handleDuplicate = (expense: Expense) => {
    setExpenseToEdit(null);
    setDuplicateExpense(expense);
    setIsModalOpen(true);
  };

  // Quick Add Templates
  const handleQuickAdd = async (template: { title: string, category: string, amount: number }) => {
    try {
      await db.transaction('rw', db.expenses, db.shifts, db.journalEntries, db.accounts, async () => {
        const expenseId = await db.expenses.add({
          title: template.title,
          amount: template.amount,
          category: template.category as any,
          date: new Date(),
          paymentMethod: 'cash',
          notes: 'إضافة سريعة'
        });
        
        const openShift = await db.shifts.where('status').equals('open').first();
        if (openShift) {
          await db.shifts.update(openShift.id!, {
            expectedCash: openShift.expectedCash - template.amount
          });
        }

        // Auto Accounting Integration (Journal Entry) for new expenses
        try {
          const creditAccount = await db.accounts.where('code').equals('1010').first(); // نقدية
          const expenseAccount = await db.accounts.where('code').equals('5020').first(); // مصروفات عامة أو تشغيلية
          
          if (creditAccount && expenseAccount) {
            const AccountingEngine = (await import('../../services/AccountingEngine')).AccountingEngine;
            await AccountingEngine.postEntry({
              date: new Date(),
              reference: `EXP-${expenseId}`,
              description: `مصروف: ${template.title}`,
              lines: [
                { accountId: expenseAccount.id!, accountName: expenseAccount.name, debit: template.amount, credit: 0, description: template.category },
                { accountId: creditAccount.id!, accountName: creditAccount.name, debit: 0, credit: template.amount, description: `إضافة سريعة لمصروف` }
              ]
            });
          }
        } catch (err) {
          console.error("Failed to post automatic journal entry for expense:", err);
        }
      });
      success('تمت إضافة المصروف السريع وتحديث الوردية والحسابات بنجاح');
    } catch (e) {
      console.error(e);
      error('حدث خطأ أثناء إضافة المصروف السريع');
    }
  };

  const openModal = (expense?: Expense) => {
    if (expense) {
      setExpenseToEdit(expense);
      setDuplicateExpense(null);
    } else {
      setExpenseToEdit(null);
      setDuplicateExpense(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setExpenseToEdit(null);
    setDuplicateExpense(null);
  };

  const handleExportCSV = () => {
    if (!filteredExpenses || filteredExpenses.length === 0) {
      error('لا توجد بيانات مصروفات للتصدير');
      return;
    }
    
    const headers = ['ID', 'البيان', 'المبلغ', 'الضريبة', 'التصنيف', 'طريقة الدفع', 'التاريخ', 'المورد/المستفيد', 'رقم المرجع', 'ملاحظات'];
    const rows = filteredExpenses.map(e => [
      e.id,
      e.title,
      e.amount,
      e.taxAmount || 0,
      getCategoryLabel(e.category),
      e.paymentMethod === 'card' ? 'بطاقة' : e.paymentMethod === 'bank' ? 'تحويل بنكي' : 'نقدي',
      new Date(e.date).toLocaleDateString(),
      e.vendor || '',
      e.referenceNumber || '',
      e.notes || ''
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(r => r.map(item => `"${item}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `expenses_report_${dateRange.start}_${dateRange.end}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('تم تصدير ملف المصروفات بنجاح');
  };

  return {
    isModalOpen,
    viewImage,
    setViewImage,
    expenseToEdit,
    duplicateExpense,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    expenseToDeleteId,
    setExpenseToDeleteId,
    deleteExpense,
    executeDeleteExpense,
    handleApprove,
    handleReject,
    handleDuplicate,
    handleQuickAdd,
    openModal,
    closeModal,
    handleExportCSV
  };
};
