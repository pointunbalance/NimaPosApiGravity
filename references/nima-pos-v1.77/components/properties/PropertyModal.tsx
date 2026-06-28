import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Property } from '../../types';
import { X, Save, Building2 } from 'lucide-react';

const propertySchema = z.object({
  name: z.string().min(1, 'اسم العقار مطلوب'),
  type: z.enum(['building', 'villa', 'apartment', 'land', 'commercial']),
  address: z.string().min(1, 'العنوان مطلوب'),
  unitsCount: z.number().min(1, 'عدد الوحدات يجب أن يكون 1 على الأقل'),
  occupancyRate: z.number().min(0).max(100),
  status: z.enum(['active', 'maintenance', 'inactive']),
  rentalValue: z.number().min(0, 'القيمة الإيجارية يجب أن تكون 0 أو أكثر'),
  manager: z.string().optional(),
  notes: z.string().optional(),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (property: Partial<Property>) => Promise<void>;
  editingProperty: Property | null;
}

const PropertyModal: React.FC<PropertyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingProperty
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: '',
      type: 'building',
      address: '',
      unitsCount: 1,
      occupancyRate: 0,
      status: 'active',
      rentalValue: 0,
      manager: '',
      notes: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (editingProperty) {
        reset({
          name: editingProperty.name,
          type: editingProperty.type,
          address: editingProperty.address,
          unitsCount: editingProperty.unitsCount,
          occupancyRate: editingProperty.occupancyRate,
          status: editingProperty.status,
          rentalValue: editingProperty.rentalValue,
          manager: editingProperty.manager || '',
          notes: editingProperty.notes || ''
        });
      } else {
        reset({
          name: '',
          type: 'building',
          address: '',
          unitsCount: 1,
          occupancyRate: 0,
          status: 'active',
          rentalValue: 0,
          manager: '',
          notes: ''
        });
      }
    }
  }, [editingProperty, isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: PropertyFormValues) => {
    await onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-600" />
            {editingProperty ? 'تعديل بيانات العقار' : 'إضافة عقار جديد'}
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
                <label className="block text-sm font-medium text-slate-700 mb-1">اسم العقار *</label>
                <input
                  type="text"
                  {...register('name')}
                  className={`w-full px-4 py-2.5 rounded-xl border ${errors.name ? 'border-red-500' : 'border-slate-200'} focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-slate-50`}
                  placeholder="مثال: عمارة الياسمين"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">نوع العقار</label>
                <select
                  {...register('type')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-slate-50"
                >
                  <option value="building">عمارة / مبنى</option>
                  <option value="villa">فيلا</option>
                  <option value="apartment">شقة</option>
                  <option value="commercial">محل تجاري / مكتب</option>
                  <option value="land">أرض</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الحالة</label>
                <select
                  {...register('status')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-slate-50"
                >
                  <option value="active">نشط (متاح للتأجير)</option>
                  <option value="maintenance">في الصيانة</option>
                  <option value="inactive">غير نشط</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">العنوان *</label>
                <input
                  type="text"
                  {...register('address')}
                  className={`w-full px-4 py-2.5 rounded-xl border ${errors.address ? 'border-red-500' : 'border-slate-200'} focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-slate-50`}
                  placeholder="المدينة - الحي - الشارع"
                />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
              </div>
            </div>
          </div>

          {/* Operational Info */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">البيانات التشغيلية</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">عدد الوحدات</label>
                <input
                  type="number"
                  {...register('unitsCount', { valueAsNumber: true })}
                  className={`w-full px-4 py-2.5 rounded-xl border ${errors.unitsCount ? 'border-red-500' : 'border-slate-200'} focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-slate-50`}
                  min="1"
                />
                {errors.unitsCount && <p className="text-red-500 text-xs mt-1">{errors.unitsCount.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">نسبة الإشغال (%)</label>
                <input
                  type="number"
                  {...register('occupancyRate', { valueAsNumber: true })}
                  className={`w-full px-4 py-2.5 rounded-xl border ${errors.occupancyRate ? 'border-red-500' : 'border-slate-200'} focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-slate-50`}
                  min="0"
                  max="100"
                />
                {errors.occupancyRate && <p className="text-red-500 text-xs mt-1">{errors.occupancyRate.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">القيمة الإيجارية التقديرية</label>
                <input
                  type="number"
                  {...register('rentalValue', { valueAsNumber: true })}
                  className={`w-full px-4 py-2.5 rounded-xl border ${errors.rentalValue ? 'border-red-500' : 'border-slate-200'} focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-slate-50`}
                  min="0"
                />
                {errors.rentalValue && <p className="text-red-500 text-xs mt-1">{errors.rentalValue.message}</p>}
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">معلومات إضافية</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">مدير العقار / الحارس</label>
                <input
                  type="text"
                  {...register('manager')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-slate-50"
                  placeholder="اسم المسؤول عن العقار"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ملاحظات</label>
                <textarea
                  {...register('notes')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none bg-slate-50"
                  rows={3}
                  placeholder="أي ملاحظات إضافية حول العقار..."
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 text-white bg-teal-600 hover:bg-teal-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ بيانات العقار'}
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

export default PropertyModal;
