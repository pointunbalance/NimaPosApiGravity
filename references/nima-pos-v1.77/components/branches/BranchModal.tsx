import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Branch } from '../../types';
import { X, Save, Building2 } from 'lucide-react';

const branchSchema = z.object({
  name: z.string().min(1, 'اسم الفرع مطلوب'),
  code: z.string().optional(),
  type: z.enum(['main', 'sub', 'warehouse', 'kiosk']).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('البريد الإلكتروني غير صالح').optional().or(z.literal('')),
  manager: z.string().optional(),
  taxNumber: z.string().optional(),
  commercialRegister: z.string().optional(),
  workingHours: z.string().optional(),
  status: z.enum(['active', 'inactive'])
});

type BranchFormValues = z.infer<typeof branchSchema>;

interface BranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (branch: Partial<Branch>) => Promise<void>;
  editingBranch: Branch | null;
}

const BranchModal: React.FC<BranchModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingBranch
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: '',
      code: '',
      type: 'sub',
      address: '',
      phone: '',
      email: '',
      manager: '',
      taxNumber: '',
      commercialRegister: '',
      workingHours: '',
      status: 'active'
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (editingBranch) {
        reset({
          name: editingBranch.name,
          code: editingBranch.code || '',
          type: editingBranch.type || 'sub',
          address: editingBranch.address || '',
          phone: editingBranch.phone || '',
          email: editingBranch.email || '',
          manager: editingBranch.manager || '',
          taxNumber: editingBranch.taxNumber || '',
          commercialRegister: editingBranch.commercialRegister || '',
          workingHours: editingBranch.workingHours || '',
          status: editingBranch.status || 'active'
        });
      } else {
        reset({
          name: '',
          code: '',
          type: 'sub',
          address: '',
          phone: '',
          email: '',
          manager: '',
          taxNumber: '',
          commercialRegister: '',
          workingHours: '',
          status: 'active'
        });
      }
    }
  }, [editingBranch, isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: BranchFormValues) => {
    await onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-600" />
            {editingBranch ? 'تعديل بيانات الفرع' : 'إضافة فرع جديد'}
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">المعلومات الأساسية</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">اسم الفرع *</label>
                <input
                  type="text"
                  {...register('name')}
                  className={`w-full px-4 py-2.5 rounded-xl border ${errors.name ? 'border-red-500' : 'border-slate-200'} focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-slate-50`}
                  placeholder="مثال: فرع المهندسين"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">كود الفرع</label>
                <input
                  type="text"
                  {...register('code')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 font-mono bg-slate-50"
                  placeholder="مثال: BR-01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">نوع الفرع</label>
                <select
                  {...register('type')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-slate-50"
                >
                  <option value="main">فرع رئيسي</option>
                  <option value="sub">فرع فرعي</option>
                  <option value="warehouse">مستودع</option>
                  <option value="kiosk">نقطة بيع مصغرة (Kiosk)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">معلومات الاتصال</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">مدير الفرع</label>
                <input
                  type="text"
                  {...register('manager')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-slate-50"
                  placeholder="اسم المسؤول عن الفرع"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف</label>
                <input
                  type="tel"
                  dir="ltr"
                  {...register('phone')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-right bg-slate-50"
                  placeholder="01xxxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  dir="ltr"
                  {...register('email')}
                  className={`w-full px-4 py-2.5 rounded-xl border ${errors.email ? 'border-red-500' : 'border-slate-200'} focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-right bg-slate-50`}
                  placeholder="branch@example.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ساعات العمل</label>
                <input
                  type="text"
                  {...register('workingHours')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-slate-50"
                  placeholder="مثال: 9 ص - 10 م"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">العنوان</label>
                <textarea
                  {...register('address')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none bg-slate-50"
                  rows={2}
                  placeholder="العنوان التفصيلي للفرع"
                />
              </div>
            </div>
          </div>

          {/* Legal Info */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">البيانات القانونية والحالة</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الرقم الضريبي</label>
                <input
                  type="text"
                  {...register('taxNumber')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">السجل التجاري</label>
                <input
                  type="text"
                  {...register('commercialRegister')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الحالة</label>
                <select
                  {...register('status')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-slate-50"
                >
                  <option value="active">نشط</option>
                  <option value="inactive">غير نشط</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 text-white bg-brand-600 hover:bg-brand-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ بيانات الفرع'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BranchModal;
