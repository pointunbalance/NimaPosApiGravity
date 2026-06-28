import React, { useEffect } from 'react';
import { DollarSign, X, RefreshCw, AlertCircle, Save } from 'lucide-react';
import { Currency } from '../../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const currencySchema = z.object({
  code: z.string().min(1, 'رمز العملة مطلوب').max(3, 'رمز العملة يجب أن يكون 3 أحرف كحد أقصى').toUpperCase(),
  name: z.string().min(1, 'اسم العملة مطلوب'),
  exchangeRate: z.number().min(0.000001, 'سعر الصرف يجب أن يكون أكبر من صفر'),
  isBaseCurrency: z.boolean(),
});

export type CurrencyFormData = z.infer<typeof currencySchema>;

interface CurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CurrencyFormData) => void;
  editingCurrency: Currency | null;
}

const CurrencyModal: React.FC<CurrencyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingCurrency
}) => {
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CurrencyFormData>({
    resolver: zodResolver(currencySchema),
    defaultValues: {
      code: '',
      name: '',
      exchangeRate: 1,
      isBaseCurrency: false,
    }
  });

  const isBaseCurrency = watch('isBaseCurrency');
  const code = watch('code');

  useEffect(() => {
    if (isOpen) {
      if (editingCurrency) {
        reset({
          code: editingCurrency.code,
          name: editingCurrency.name,
          exchangeRate: editingCurrency.exchangeRate,
          isBaseCurrency: editingCurrency.isBaseCurrency || false,
        });
      } else {
        reset({
          code: '',
          name: '',
          exchangeRate: 1,
          isBaseCurrency: false,
        });
      }
    }
  }, [isOpen, editingCurrency, reset]);

  useEffect(() => {
    if (isBaseCurrency) {
      setValue('exchangeRate', 1);
    }
  }, [isBaseCurrency, setValue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 print:hidden">
      <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 border border-slate-200">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            {editingCurrency ? 'تعديل عملة' : 'إضافة عملة جديدة'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors bg-white rounded-full p-1 shadow-sm border border-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSave)}>
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">رمز العملة</label>
              <div className="relative">
                <input
                  type="text"
                  {...register('code')}
                  className={`w-full p-3 bg-slate-50 border ${errors.code ? 'border-red-500' : 'border-slate-200'} rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800`}
                  placeholder="مثال: USD"
                  maxLength={3}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">
                  {code?.length || 0}/3
                </div>
              </div>
              {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">اسم العملة</label>
              <input
                type="text"
                {...register('name')}
                className={`w-full p-3 bg-slate-50 border ${errors.name ? 'border-red-500' : 'border-slate-200'} rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800`}
                placeholder="مثال: دولار أمريكي"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            {!isBaseCurrency && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">سعر الصرف</label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    {...register('exchangeRate', { valueAsNumber: true })}
                    className={`w-full p-3 pr-10 bg-slate-50 border ${errors.exchangeRate ? 'border-red-500' : 'border-slate-200'} rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700 text-left`}
                    placeholder="0.00"
                    dir="ltr"
                  />
                  <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
                {errors.exchangeRate && <p className="text-red-500 text-xs mt-1">{errors.exchangeRate.message}</p>}
                <div className="flex items-start gap-2 mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p>
                    أدخل قيمة هذه العملة مقابل العملة الأساسية للنظام.
                  </p>
                </div>
              </div>
            )}

            <div className="pt-2">
              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  {...register('isBaseCurrency')}
                  className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300 "
                />
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800">تعيين كعملة أساسية</span>
                  <span className="text-xs text-slate-500">العملة الأساسية يكون سعر صرفها دائماً 1</span>
                </div>
              </label>
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-white transition-colors shadow-sm"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              حفظ العملة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CurrencyModal;
