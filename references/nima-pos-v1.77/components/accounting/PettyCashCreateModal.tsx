import React, { useEffect } from 'react';
import { Wallet, X, DollarSign, Check, Building2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Account } from '../../types';

const pettyCashSchema = z.object({
  employeeName: z.string().min(1, 'اسم الموظف مطلوب'),
  amount: z.coerce.number().min(0.01, 'المبلغ يجب أن يكون أكبر من صفر'),
  description: z.string().min(1, 'البيان مطلوب'),
  sourceAccountId: z.coerce.number().min(1, 'حساب المصدر مطلوب'),
  pettyCashAccountId: z.coerce.number().min(1, 'حساب العهدة مطلوب'),
});

export type PettyCashFormData = z.infer<typeof pettyCashSchema>;

interface PettyCashCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PettyCashFormData) => void;
  accounts: Account[];
}

const PettyCashCreateModal: React.FC<PettyCashCreateModalProps> = ({
  isOpen, onClose, onSubmit, accounts
}) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PettyCashFormData>({
    resolver: zodResolver(pettyCashSchema) as any,
    defaultValues: {
      employeeName: '',
      amount: 0,
      description: '',
      sourceAccountId: 0,
      pettyCashAccountId: 0
    }
  });

  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-600" />
            صرف عهدة جديدة
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">اسم الموظف</label>
            <input 
              type="text" 
              {...register('employeeName')}
              className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.employeeName ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
              placeholder="أدخل اسم الموظف المستلم للعهدة"
            />
            {errors.employeeName && <p className="text-red-500 text-xs mt-1">{errors.employeeName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">المبلغ</label>
            <div className="relative">
              <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="number" 
                step="0.01"
                {...register('amount')}
                className={`w-full pl-4 pr-10 py-2.5 bg-slate-50 border ${errors.amount ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
                placeholder="0.00"
              />
            </div>
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">حساب المصدر (بنك/صندوق)</label>
              <select 
                {...register('sourceAccountId')}
                className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.sourceAccountId ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
              >
                <option value={0}>اختر الحساب...</option>
                {accounts.filter(a => a.type === 'asset').map(a => (
                  <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                ))}
              </select>
              {errors.sourceAccountId && <p className="text-red-500 text-xs mt-1">{errors.sourceAccountId.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">حساب العهدة</label>
              <select 
                {...register('pettyCashAccountId')}
                className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.pettyCashAccountId ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
              >
                <option value={0}>اختر الحساب...</option>
                {accounts.filter(a => a.type === 'asset').map(a => (
                  <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                ))}
              </select>
              {errors.pettyCashAccountId && <p className="text-red-500 text-xs mt-1">{errors.pettyCashAccountId.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">البيان / الغرض</label>
            <textarea 
              {...register('description')}
              className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.description ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none h-24`}
              placeholder="سبب صرف العهدة..."
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>
          <div className="pt-4 flex gap-3">
            <button 
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              حفظ وصرف
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

export default PettyCashCreateModal;
