import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, AlertTriangle } from 'lucide-react';
import { Account, AccountType } from '../../types';
import { getTypeLabel } from './ChartOfAccountsHelpers';

const accountSchema = z.object({
  code: z.string().min(1, 'كود الحساب مطلوب'),
  name: z.string().min(1, 'اسم الحساب مطلوب'),
  type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
  description: z.string().optional()
});

export type AccountFormValues = z.infer<typeof accountSchema>;

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AccountFormValues) => Promise<void>;
  editingAccount: Account | null;
  errorMsg: string | null;
  defaultType?: AccountType;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingAccount,
  errorMsg,
  defaultType = 'asset'
}) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      code: '',
      name: '',
      type: defaultType,
      description: ''
    }
  });

  const selectedType = watch('type');

  useEffect(() => {
    if (isOpen) {
      if (editingAccount) {
        reset({
          code: editingAccount.code,
          name: editingAccount.name,
          type: editingAccount.type,
          description: editingAccount.description || ''
        });
      } else {
        reset({
          code: '',
          name: '',
          type: defaultType,
          description: ''
        });
      }
    }
  }, [isOpen, editingAccount, reset, defaultType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-xl text-slate-800 dark:text-white">{editingAccount ? 'تعديل بيانات الحساب' : 'إضافة حساب جديد'}</h3>
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500 dark:text-gray-400"/></button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          
          {errorMsg && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm font-bold flex items-center gap-2 border border-red-100 dark:border-red-800">
              <AlertTriangle className="w-4 h-4" />
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5">كود الحساب <span className="text-red-500">*</span></label>
              <input 
                {...register('code')}
                disabled={editingAccount?.isSystem}
                className={`w-full px-4 py-3 bg-white dark:bg-gray-900 border ${errors.code ? 'border-red-500' : 'border-slate-200 dark:border-gray-700'} rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-center disabled:bg-slate-100 dark:disabled:bg-gray-800 disabled:text-slate-500 dark:disabled:text-gray-500 dark:text-white`}
                placeholder="1010"
              />
              {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5">اسم الحساب <span className="text-red-500">*</span></label>
              <input 
                {...register('name')}
                className={`w-full px-4 py-3 bg-white dark:bg-gray-900 border ${errors.name ? 'border-red-500' : 'border-slate-200 dark:border-gray-700'} rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white`}
                placeholder="مثال: الصندوق الرئيسي"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5">نوع الحساب (التصنيف الرئيسي)</label>
            <div className="grid grid-cols-3 gap-2">
              {(['asset', 'liability', 'equity', 'revenue', 'expense'] as AccountType[]).map(t => {
                const style = getTypeLabel(t);
                const isSelected = selectedType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={editingAccount?.isSystem}
                    onClick={() => setValue('type', t)}
                    className={`py-2 px-1 rounded-lg text-xs font-bold border-2 transition-all flex flex-col items-center gap-1 ${isSelected ? style.color.replace('bg-opacity-10', '') + ' border-transparent shadow-md dark:bg-opacity-20' : 'bg-white dark:bg-gray-800 border-slate-100 dark:border-gray-700 text-slate-500 dark:text-gray-400 hover:border-slate-300 dark:hover:border-gray-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <style.icon className="w-4 h-4" />
                    {style.label}
                  </button>
                );
              })}
            </div>
            {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5">وصف إضافي</label>
            <textarea 
              {...register('description')}
              className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-24 dark:text-white"
              placeholder="ملاحظات عن استخدام هذا الحساب..."
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-50">
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ البيانات'}
          </button>
        </form>
      </div>
    </div>
  );
};
