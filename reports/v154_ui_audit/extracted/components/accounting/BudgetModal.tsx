import React, { useEffect } from 'react';
import { Calculator, X, Plus, Trash2, Save } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Budget, BudgetLine, Account, CostCenter, FiscalYear } from '../../types';

const budgetLineSchema = z.object({
  accountId: z.coerce.number().min(1, "الرجاء اختيار حساب"),
  costCenterId: z.coerce.number().optional(),
  amount: z.coerce.number().min(0.01, "المبلغ يجب أن يكون أكبر من صفر"),
});

const budgetSchema = z.object({
  name: z.string().min(1, "اسم الموازنة مطلوب"),
  fiscalYearId: z.coerce.number().min(1, "الرجاء اختيار السنة المالية"),
  status: z.enum(['draft', 'active', 'closed']),
  lines: z.array(budgetLineSchema).min(1, "يجب إضافة بند واحد على الأقل"),
});

export type BudgetFormData = z.infer<typeof budgetSchema>;

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BudgetFormData) => void;
  editingBudget: Budget | null;
  fiscalYears: FiscalYear[];
  budgetableAccounts: Account[];
  costCenters: CostCenter[];
}

const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingBudget,
  fiscalYears,
  budgetableAccounts,
  costCenters
}) => {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema) as any,
    defaultValues: {
      name: '',
      fiscalYearId: 0,
      status: 'draft',
      lines: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  });

  useEffect(() => {
    if (isOpen) {
      if (editingBudget) {
        reset({
          name: editingBudget.name,
          fiscalYearId: editingBudget.fiscalYearId,
          status: editingBudget.status,
          lines: editingBudget.lines || [],
        });
      } else {
        reset({
          name: '',
          fiscalYearId: 0,
          status: 'draft',
          lines: [],
        });
      }
    }
  }, [editingBudget, isOpen, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = (data: BudgetFormData) => {
    onSubmit(data);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('ar-IQ', { style: 'decimal', maximumFractionDigits: 0 }).format(val);

  // Calculate total amount
  const totalAmount = fields.reduce((sum, field, index) => {
    // We need to get the actual value from the form, but for simplicity we can just use the field's initial value
    // A better way is to use watch, but let's keep it simple or use watch if needed
    return sum + (Number(field.amount) || 0);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-gray-700">
                <h3 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
                    <Calculator className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    {editingBudget ? 'تعديل الموازنة' : 'إنشاء موازنة جديدة'}
                </h3>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full text-slate-500 dark:text-gray-400 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">اسم الموازنة</label>
                            <input 
                                type="text" 
                                {...register('name')}
                                placeholder="مثال: موازنة التشغيل 2024"
                                className={`w-full p-3 bg-slate-50 dark:bg-gray-900 border ${errors.name ? 'border-red-500' : 'border-slate-200 dark:border-gray-700'} rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white`}
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">السنة المالية</label>
                            <select 
                                {...register('fiscalYearId')}
                                className={`w-full p-3 bg-slate-50 dark:bg-gray-900 border ${errors.fiscalYearId ? 'border-red-500' : 'border-slate-200 dark:border-gray-700'} rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white`}
                            >
                                <option value="0">اختر السنة المالية...</option>
                                {fiscalYears.map(fy => (
                                    <option key={fy.id} value={fy.id}>{fy.name}</option>
                                ))}
                            </select>
                            {errors.fiscalYearId && <p className="text-red-500 text-xs mt-1">{errors.fiscalYearId.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">الحالة</label>
                            <select 
                                {...register('status')}
                                className="w-full p-3 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                            >
                                <option value="draft">مسودة</option>
                                <option value="active">نشط</option>
                                <option value="closed">مغلق</option>
                            </select>
                            {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>}
                        </div>
                    </div>

                    {/* Budget Lines */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-slate-800 dark:text-white">بنود الموازنة</h4>
                            <button 
                                type="button"
                                onClick={() => append({ accountId: 0, amount: 0 })}
                                className="text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" /> إضافة بند
                            </button>
                        </div>
                        {errors.lines?.root && <p className="text-red-500 text-xs mb-2">{errors.lines.root.message}</p>}

                        <div className="border border-slate-200 dark:border-gray-700 rounded-xl overflow-hidden">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-slate-50 dark:bg-gray-900/50 text-slate-500 dark:text-gray-400 font-bold">
                                    <tr>
                                        <th className="p-3 w-1/3">الحساب (مصروف/إيراد)</th>
                                        <th className="p-3 w-1/3">مركز التكلفة (اختياري)</th>
                                        <th className="p-3 w-1/4">المبلغ المقدر</th>
                                        <th className="p-3 w-12 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                                    {fields.map((field, index) => (
                                        <tr key={field.id} className="bg-white dark:bg-gray-800">
                                            <td className="p-2">
                                                <select 
                                                    {...register(`lines.${index}.accountId`)}
                                                    className={`w-full p-2 bg-slate-50 dark:bg-gray-900 border ${errors.lines?.[index]?.accountId ? 'border-red-500' : 'border-slate-200 dark:border-gray-700'} rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white`}
                                                >
                                                    <option value="0">اختر الحساب...</option>
                                                    {budgetableAccounts.map(a => (
                                                        <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="p-2">
                                                <select 
                                                    {...register(`lines.${index}.costCenterId`)}
                                                    className="w-full p-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                                >
                                                    <option value="">بدون مركز تكلفة</option>
                                                    {costCenters.map(c => (
                                                        <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="p-2">
                                                <input 
                                                    type="number"
                                                    step="0.01"
                                                    {...register(`lines.${index}.amount`)}
                                                    placeholder="0.00"
                                                    className={`w-full p-2 bg-slate-50 dark:bg-gray-900 border ${errors.lines?.[index]?.amount ? 'border-red-500' : 'border-slate-200 dark:border-gray-700'} rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold dark:text-white`}
                                                />
                                            </td>
                                            <td className="p-2 text-center">
                                                <button 
                                                    type="button"
                                                    onClick={() => remove(index)}
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {fields.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-slate-400 dark:text-gray-500">
                                                لا توجد بنود مضافة. انقر على "إضافة بند" للبدء.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-900/50 flex justify-end gap-3 rounded-b-3xl">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl font-bold text-slate-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        إلغاء
                    </button>
                    <button 
                        type="submit"
                        className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-2"
                    >
                        <Save className="w-5 h-5" />
                        حفظ الموازنة
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default BudgetModal;
