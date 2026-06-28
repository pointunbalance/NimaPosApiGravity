import React, { useEffect } from 'react';
import { Supplier } from '../../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const paymentSchema = z.object({
  amount: z.number().min(0.01, 'المبلغ يجب أن يكون أكبر من صفر'),
  note: z.string().optional(),
});

export type SupplierPaymentFormData = z.infer<typeof paymentSchema>;

interface SupplierPaymentModalProps {
  isOpen: boolean;
  closeModal: () => void;
  selectedSupplier: Supplier;
  handlePayment: (data: SupplierPaymentFormData) => Promise<void>;
  formatCurrency: (amount: number) => string;
}

const SupplierPaymentModal: React.FC<SupplierPaymentModalProps> = ({
  isOpen,
  closeModal,
  selectedSupplier,
  handlePayment,
  formatCurrency
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<SupplierPaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: undefined,
      note: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      reset({ amount: undefined, note: '' });
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in-95">
        <h3 className="text-xl font-bold text-slate-800 mb-1 text-center">سداد دفعة</h3>
        <p className="text-sm text-slate-500 text-center mb-6">للمورد: {selectedSupplier.name}</p>
        
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-center">
          <p className="text-xs text-slate-500 uppercase font-bold mb-1">الرصيد الحالي (الدين)</p>
          <p className="text-2xl font-black text-red-600">{formatCurrency(selectedSupplier.balance || 0)}</p>
        </div>

        <form onSubmit={handleSubmit(handlePayment)}>
          <div className="mb-4">
            <label className="block text-sm font-bold text-slate-700 mb-2">المبلغ المدفوع</label>
            <input 
              type="number" 
              step="any"
              autoFocus
              {...register('amount', { valueAsNumber: true })}
              className={`w-full px-4 py-3 bg-white border-2 ${errors.amount ? 'border-red-500' : 'border-indigo-100'} rounded-xl focus:border-indigo-500 outline-none text-xl font-bold text-center`}
              placeholder="0"
            />
            {errors.amount && <p className="text-red-500 text-xs mt-1 text-center">{errors.amount.message}</p>}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات (اختياري)</label>
            <input 
              type="text" 
              {...register('note')}
              className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none text-sm"
              placeholder="رقم إيصال، طريقة الدفع..."
            />
          </div>

          <div className="flex gap-3">
            <button 
              type="button"
              onClick={closeModal} 
              className="flex-1 py-3 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors"
            >
              إلغاء
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50"
            >
              {isSubmitting ? 'جاري الحفظ...' : 'تأكيد السداد'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierPaymentModal;
