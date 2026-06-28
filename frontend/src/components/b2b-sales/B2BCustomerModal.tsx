import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Customer } from '../../types';
import { Loader2 } from 'lucide-react';

const customerSchema = z.object({
  name: z.string().min(2, 'الاسم مطلوب ويجب أن يكون حرفين على الأقل'),
  phone: z.string().min(8, 'رقم الهاتف مطلوب ويجب أن يكون 8 أرقام على الأقل'),
  creditLimit: z.coerce.number().min(0, 'الحد الائتماني يجب أن يكون 0 أو أكثر'),
  balance: z.coerce.number().min(0, 'الرصيد الافتتاحي يجب أن يكون 0 أو أكثر'),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

interface B2BCustomerModalProps {
  editingCustomer: Customer | null;
  onClose: () => void;
  onSave: (data: CustomerFormData) => Promise<void>;
}

const B2BCustomerModal: React.FC<B2BCustomerModalProps> = ({
  editingCustomer,
  onClose,
  onSave
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema) as any,
    defaultValues: {
      name: '',
      phone: '',
      creditLimit: 0,
      balance: 0,
    }
  });

  useEffect(() => {
    if (editingCustomer) {
      reset({
        name: editingCustomer.name,
        phone: editingCustomer.phone,
        creditLimit: editingCustomer.creditLimit || 0,
        balance: editingCustomer.balance || 0,
      });
    } else {
      reset({
        name: '',
        phone: '',
        creditLimit: 0,
        balance: 0,
      });
    }
  }, [editingCustomer, reset]);

  const onSubmit = async (data: CustomerFormData) => {
    await onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">{editingCustomer ? 'تعديل العميل' : 'إضافة عميل جديد'}</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">اسم الشركة / العميل</label>
              <input
                type="text"
                {...register('name')}
                className={`w-full p-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${errors.name ? 'border-red-500' : 'border-slate-200'}`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">رقم الهاتف</label>
              <input
                type="text"
                {...register('phone')}
                className={`w-full p-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${errors.phone ? 'border-red-500' : 'border-slate-200'}`}
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">الحد الائتماني</label>
              <input
                type="number"
                min="0"
                {...register('creditLimit')}
                className={`w-full p-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${errors.creditLimit ? 'border-red-500' : 'border-slate-200'}`}
              />
              {errors.creditLimit && <p className="text-red-500 text-xs mt-1">{errors.creditLimit.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">الرصيد الافتتاحي (عليه)</label>
              <input
                type="number"
                min="0"
                {...register('balance')}
                className={`w-full p-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${errors.balance ? 'border-red-500' : 'border-slate-200'}`}
              />
              {errors.balance && <p className="text-red-500 text-xs mt-1">{errors.balance.message}</p>}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                حفظ العميل
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default B2BCustomerModal;
