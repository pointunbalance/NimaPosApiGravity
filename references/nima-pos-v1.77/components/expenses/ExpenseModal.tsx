import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, Check, DollarSign } from 'lucide-react';
import { db } from '../../db';
import { Expense } from '../../types';
import { AccountingEngine } from '../../services/AccountingEngine';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLiveQuery } from 'dexie-react-hooks';
import { compressImage } from '../../utils/imageCompression';

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

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: Expense | null;
  duplicateExpense?: Expense | null;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose, expenseToEdit, duplicateExpense }) => {
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

      await (db as any).transaction('rw', db.expenses, db.shifts, db.journalEntries, db.accounts, db.auditLogs, async () => {
        if (expenseToEdit && expenseToEdit.id) {
          await db.expenses.update(expenseToEdit.id, expenseData);
          // If it was cash, we need to adjust the shift. This is complex for edits, 
          // so we might just log it or handle it if we have a robust shift ledger.
          // For simplicity, we'll just update the shift for new expenses.
        } else {
          const expenseId = await db.expenses.add(expenseData);
          
          if (expenseData.status === 'pending') {
              // Send notification to Owner
              import('../../utils/notifications').then(({ notificationService }) => {
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
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">البيان</label>
            <input 
              type="text" 
              {...register('title')}
              className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.title ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-indigo-500'} rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-800`}
              placeholder="مثال: فاتورة كهرباء شهر مايو"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">المبلغ</label>
              <div className="relative">
                <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="number" 
                  step="0.01"
                  {...register('amount', { valueAsNumber: true })}
                  className={`w-full pl-4 pr-10 py-2.5 bg-slate-50 border ${errors.amount ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-indigo-500'} rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-800`}
                  placeholder="0.00"
                />
              </div>
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">قيمة الضريبة (إن وجدت)</label>
              <div className="relative">
                <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="number" 
                  step="0.01"
                  {...register('taxAmount', { valueAsNumber: true })}
                  className={`w-full pl-4 pr-10 py-2.5 bg-slate-50 border ${errors.taxAmount ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-indigo-500'} rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-800`}
                  placeholder="0.00"
                />
              </div>
              {errors.taxAmount && <p className="text-red-500 text-xs mt-1">{errors.taxAmount.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">التصنيف</label>
              <select 
                {...register('category')}
                className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.category ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-indigo-500'} rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-800`}
              >
                <option value="rent">إيجار</option>
                <option value="salary">رواتب</option>
                <option value="utilities">فواتير (كهرباء/ماء)</option>
                <option value="purchase">مشتريات بضاعة</option>
                <option value="marketing">تسويق وإعلانات</option>
                <option value="maintenance">صيانة وإصلاح</option>
                <option value="supplies">مستلزمات مكتبية</option>
                <option value="government">رسوم حكومية</option>
                <option value="transportation">نقل ومواصلات</option>
                <option value="other">نثريات / أخرى</option>
              </select>
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">التاريخ</label>
              <input 
                type="date" 
                {...register('date')}
                className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.date ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-indigo-500'} rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-800`}
              />
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">المورد / المستفيد</label>
              <input 
                type="text" 
                {...register('vendor')}
                className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.vendor ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-indigo-500'} rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-800`}
                placeholder="اسم الجهة أو الشخص"
              />
              {errors.vendor && <p className="text-red-500 text-xs mt-1">{errors.vendor.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">رقم المرجع / الفاتورة</label>
              <input 
                type="text" 
                {...register('referenceNumber')}
                className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.referenceNumber ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-indigo-500'} rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-800`}
                placeholder="مثال: INV-1234"
              />
              {errors.referenceNumber && <p className="text-red-500 text-xs mt-1">{errors.referenceNumber.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">طريقة الدفع</label>
            <div className="flex gap-4">
              <label className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-all hover:bg-slate-50 ${paymentMethod === 'cash' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}>
                <input 
                  type="radio" 
                  value="cash"
                  {...register('paymentMethod')}
                  className="hidden"
                />
                <DollarSign className="w-4 h-4" />
                نقدي
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-all hover:bg-slate-50 ${paymentMethod === 'card' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}>
                <input 
                  type="radio" 
                  value="card"
                  {...register('paymentMethod')}
                  className="hidden"
                />
                <FileText className="w-4 h-4" />
                بطاقة
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-all hover:bg-slate-50 ${paymentMethod === 'bank' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}>
                <input 
                  type="radio" 
                  value="bank"
                  {...register('paymentMethod')}
                  className="hidden"
                />
                <FileText className="w-4 h-4" />
                تحويل بنكي
              </label>
            </div>
            {errors.paymentMethod && <p className="text-red-500 text-xs mt-1">{errors.paymentMethod.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات (اختياري)</label>
            <textarea 
              {...register('notes')}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none h-20 text-slate-800"
              placeholder="أي تفاصيل إضافية..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">صورة الإيصال (اختياري)</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer relative overflow-hidden">
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              {receiptImage ? (
                <div className="relative h-32 w-full">
                  <img src={receiptImage} alt="Receipt" className="h-full w-full object-contain" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <p className="text-white font-bold text-sm flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      تغيير الصورة
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-4 flex flex-col items-center text-slate-500">
                  <Upload className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm font-bold">انقر لرفع صورة الإيصال</p>
                  <p className="text-xs mt-1 opacity-75">PNG, JPG حتى 5MB</p>
                </div>
              )}
            </div>
          </div>

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

export default ExpenseModal;
