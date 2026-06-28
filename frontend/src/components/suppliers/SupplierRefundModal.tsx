import React, { useEffect } from 'react';
import { Supplier } from '../../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const refundSchema = z.object({
  amount: z.number().min(0.01, 'المبلغ يجب أن يكون أكبر من صفر'),
  note: z.string().optional(),
});

export type SupplierRefundFormData = z.infer<typeof refundSchema>;

interface SupplierRefundModalProps {
  isOpen: boolean;
  closeModal: () => void;
  selectedSupplier: Supplier;
  handleRefund: (data: SupplierRefundFormData) => Promise<void>;
  formatCurrency: (amount: number) => string;
}

const SupplierRefundModal: React.FC<SupplierRefundModalProps> = ({
  isOpen,
  closeModal,
  selectedSupplier,
  handleRefund,
  formatCurrency
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<SupplierRefundFormData>({
    resolver: zodResolver(refundSchema),
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
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in-95 border-t-4 border-orange-500">
        <h3 className="text-xl font-bold text-slate-800 mb-1 text-center">تسجيل مرتجع مالي</h3>
        <p className="text-sm text-slate-500 text-center mb-6">خصم من رصيد المورد: {selectedSupplier.name}</p>
        
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 mb-6 text-center">
          <p className="text-xs text-orange-800 font-bold mb-1">الرصيد الحالي</p>
          <p className="text-2xl font-black text-red-600">{formatCurrency(selectedSupplier.balance || 0)}</p>
        </div>

        <form onSubmit={handleSubmit(handleRefund)}>
          <div className="mb-4">
            <label className="block text-sm font-bold text-slate-700 mb-2">قيمة المرتجع / الخصم</label>
            <input 
              type="number" 
              step="any"
              autoFocus
              {...register('amount', { valueAsNumber: true })}
              className={`w-full px-4 py-3 bg-white border-2 ${errors.amount ? 'border-red-500' : 'border-orange-100'} rounded-xl focus:border-orange-500 outline-none text-xl font-bold text-center text-orange-700`}
              placeholder="0"
            />
            {errors.amount && <p className="text-red-500 text-xs mt-1 text-center">{errors.amount.message}</p>}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">سبب المرتجع / ملاحظات</label>
            <input 
              type="text" 
              {...register('note')}
              className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-xl focus:border-orange-500 outline-none text-sm"
              placeholder="بضاعة تالفة، خصم إضافي..."
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
              className="flex-1 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200 disabled:opacity-50"
            >
              {isSubmitting ? 'جاري الحفظ...' : 'تأكيد المرتجع'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierRefundModal;
