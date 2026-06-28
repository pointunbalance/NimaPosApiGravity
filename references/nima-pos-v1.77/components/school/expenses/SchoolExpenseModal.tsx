import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, Check, DollarSign } from 'lucide-react';
import { db } from '../../../db';
import { Expense } from '../../../types';
import { AccountingEngine } from '../../../services/AccountingEngine';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLiveQuery } from 'dexie-react-hooks';
import { compressImage } from '../../../utils/imageCompression';
import { ExpenseFormFields } from './ExpenseFormFields';

const expenseSchema = z.object({
  title: z.string().min(1, 'البيان مطلوب'),
  amount: z.number().min(0.01, 'المبلغ يجب أن يكون أكبر من صفر'),
  category: z.string().min(1, 'التصنيف مطلوب'),
  paymentMethod: z.enum(['cash', 'card', 'bank']),
  date: z.string().min(1, 'التاريخ مطلوب'),
  referenceNumber: z.string().optional(),
  vendor: z.string().optional(),
  taxAmount: z.number().min(0).optional(),
  notes: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface SchoolExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: Expense | null;
  duplicateExpense?: Expense | null;
}

const SchoolExpenseModal: React.FC<SchoolExpenseModalProps> = ({ isOpen, onClose, expenseToEdit, duplicateExpense }) => {
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: '',
      amount: undefined,
      category: 'other',
      paymentMethod: 'cash',
      date: new Date().toISOString().split('T')[0],
      referenceNumber: '',
      vendor: '',
      taxAmount: 0,
      notes: '',
    },
  });

  const paymentMethod = watch('paymentMethod');

  useEffect(() => {
    if (isOpen) {
      if (expenseToEdit) {
        reset({
          title: expenseToEdit.title,
          amount: expenseToEdit.amount,
          category: expenseToEdit.category,
          paymentMethod: (expenseToEdit.paymentMethod as any) || 'cash',
          date: new Date(expenseToEdit.date).toISOString().split('T')[0],
          referenceNumber: expenseToEdit.referenceNumber || '',
          vendor: expenseToEdit.vendor || '',
          taxAmount: expenseToEdit.taxAmount || 0,
          notes: expenseToEdit.notes || '',
        });
        setReceiptImage(expenseToEdit.attachment || null);
      } else if (duplicateExpense) {
        reset({
          title: duplicateExpense.title + ' (نسخة)',
          amount: duplicateExpense.amount,
          category: duplicateExpense.category,
          paymentMethod: (duplicateExpense.paymentMethod as any) || 'cash',
          date: new Date().toISOString().split('T')[0],
          referenceNumber: '',
          vendor: duplicateExpense.vendor || '',
          taxAmount: duplicateExpense.taxAmount || 0,
          notes: duplicateExpense.notes || '',
        });
        setReceiptImage(duplicateExpense.attachment || null);
      } else {
        reset({
          title: '',
          amount: undefined,
          category: 'other',
          paymentMethod: 'cash',
          date: new Date().toISOString().split('T')[0],
          referenceNumber: '',
          vendor: '',
          taxAmount: 0,
          notes: '',
        });
        setReceiptImage(null);
      }
    }
  }, [expenseToEdit, duplicateExpense, isOpen, reset]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file).then(result => setReceiptImage(result));
    }
  };

  const fiscalYears = useLiveQuery(() => db.fiscalYears.orderBy('endDate').reverse().toArray(), []);

  const isDateClosed = (dateStr: string | Date) => {
      if (!fiscalYears) return false;
      const d = new Date(dateStr).getTime();
      return fiscalYears.some(fy => {
          const start = new Date(fy.startDate).setHours(0,0,0,0);
          const end = new Date(fy.endDate).setHours(23,59,59,999);
          return d >= start && d <= end && fy.status === 'closed';
      });
  };

  const onSubmit = async (data: ExpenseFormValues) => {
    if (isDateClosed(data.date)) {
        alert('لا يمكن إضافة أو تعديل مصروف في سنة مالية مغلقة.');
        return;
    }

    const expenseData: Expense = {
      ...data,
      date: new Date(data.date),
      attachment: receiptImage || undefined,
      status: 'pending' // Default to pending, we will update it based on user
    };

    try {
      const currentUserData = localStorage.getItem('nima_user');
      const user = currentUserData ? JSON.parse(currentUserData) : { role: 'admin', id: 1 };
      
      if (user.role === 'admin' || user.role === 'owner') {
          expenseData.status = 'approved';
          expenseData.approvedBy = user.id;
      } else {
          // If non-admin manager adds expense, status is pending
          expenseData.status = 'pending';
      }

      await (db as any).transaction('rw', db.schoolExpenses, db.shifts, db.journalEntries, db.accounts, db.auditLogs, async () => {
        if (expenseToEdit && expenseToEdit.id) {
          await db.schoolExpenses.update(expenseToEdit.id, expenseData);
          // If it was cash, we need to adjust the shift. This is complex for edits, 
          // so we might just log it or handle it if we have a robust shift ledger.
          // For simplicity, we'll just update the shift for new expenses.
        } else {
          const expenseId = await db.schoolExpenses.add(expenseData);
          
          if (expenseData.status === 'pending') {
              // Send notification to Owner
              import('../../../utils/notifications').then(({ notificationService }) => {
                  notificationService.addNotification(
                      "طلب موافقة على مصروف",
                      `طلب ${user.name} إضافة مصروف "${expenseData.title}" بقيمة ${expenseData.amount} ج.م. بانتظار موافقتك.`,
                      "warning"
                  );
              });
          }

          if (expenseData.paymentMethod === 'cash' && expenseData.status === 'approved') {
              const openShift = await db.shifts.where('status').equals('open').first();
              if (openShift) {
                  await db.shifts.update(openShift.id!, {
                      expectedCash: openShift.expectedCash - expenseData.amount
                  });
              }
          }
          
          // Auto Accounting Integration (Journal Entry) for approved expenses
          if (expenseData.status === 'approved') {
                const creditAccountCode = data.paymentMethod === 'cash' ? '1010' : data.paymentMethod === 'bank' ? '1020' : '2010'; // نقدية أو بنك أو موردين/ذمم
                const creditAccount = await db.accounts.where('code').equals(creditAccountCode).first();
                const expenseAccount = await db.accounts.where('code').equals('5020').first(); // مصروفات عامة أو تشغيلية
                
                if (creditAccount && expenseAccount) {
                    await AccountingEngine.postEntry({
                        date: expenseData.date,
                        reference: `EXP-${expenseId}`,
                        description: `مصروف: ${expenseData.title}`,
                        lines: [
                            { accountId: expenseAccount.id!, accountName: expenseAccount.name, debit: expenseData.amount, credit: 0, description: expenseData.category },
                            { accountId: creditAccount.id!, accountName: creditAccount.name, debit: 0, credit: expenseData.amount, description: `دفع فاتورة مصروف` }
                        ],
                    });
                }
          }
        }
      });
      onClose();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-600" />
            {expenseToEdit ? 'تعديل مصروف' : 'إضافة مصروف جديد'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <ExpenseFormFields
            register={register}
            errors={errors}
            paymentMethod={paymentMethod}
            receiptImage={receiptImage}
            handleImageUpload={handleImageUpload}
          />

          <div className="pt-4 flex gap-3">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <Check className="w-5 h-5" />
              {expenseToEdit ? 'حفظ التعديلات' : 'حفظ المصروف'}
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SchoolExpenseModal;
