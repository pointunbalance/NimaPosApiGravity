import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Customer } from '../../types';
import { X, Tag, Building2, FileText } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';

const customerSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  phone: z.string().optional(),
  code: z.string().optional(),
  companyName: z.string().optional(),
  taxNumber: z.string().optional(),
  balance: z.number().optional(),
  creditLimit: z.number().optional(),
  tags: z.array(z.string()).optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  email: z.string().email('بريد إلكتروني غير صالح').optional().or(z.literal('')),
  totalSpent: z.number().optional(),
  walletBalance: z.number().optional(),
  measurements: z.object({
    length: z.number().optional(),
    shoulder: z.number().optional(),
    sleeveLength: z.number().optional(),
    sleeveWidth: z.number().optional(),
    cuff: z.number().optional(),
    neck: z.number().optional(),
    chest: z.number().optional(),
    waist: z.number().optional(),
    hips: z.number().optional(),
    bottomWidth: z.number().optional(),
    pantsLength: z.number().optional(),
    pantsWaist: z.number().optional(),
    thigh: z.number().optional(),
    knee: z.number().optional(),
    legOpening: z.number().optional(),
    notes: z.string().optional()
  }).optional()
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSave: (data: CustomerFormValues) => Promise<void>;
  onDelete: (id: number) => void;
}

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSave,
  onDelete,
}) => {
  const [tagInput, setTagInput] = useState('');
  
  const settings = useLiveQuery(() => db.settings.get(1));
  
  const collectB2BData = settings?.customerSettings?.collectB2BData ?? ['retail', 'wholesale'].includes(settings?.businessType || '');
  const enableMeasurements = settings?.customerSettings?.enableMeasurements ?? (settings?.businessType === 'clothing');
  const showCreditBalance = settings?.customerSettings?.showCreditBalance ?? true;
  const activeMeasurementFields = settings?.customerSettings?.activeMeasurementFields || [
    'length', 'shoulder', 'sleeveLength', 'sleeveWidth', 'cuff', 'neck', 'chest', 'waist', 'hips', 'bottomWidth', 'pantsLength', 'pantsWaist', 'thigh', 'knee', 'legOpening'
  ];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer ? {
      ...customer,
      tags: customer.tags || []
    } : {
      name: '',
      phone: '',
      code: '',
      companyName: '',
      taxNumber: '',
      balance: 0,
      creditLimit: 0,
      tags: [],
      address: '',
      notes: '',
      email: '',
      totalSpent: 0,
      walletBalance: 0
    }
  });

  const tags = watch('tags') || [];

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setValue('tags', [...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue('tags', tags.filter(tag => tag !== tagToRemove));
  };

  const onSubmit = async (data: CustomerFormValues) => {
    await onSave(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm shadow-2xl">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
          <h3 className="text-xl font-bold text-gray-800">
            {customer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                الاسم الكامل <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name')}
                className={`w-full px-4 py-2.5 bg-white border ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
                placeholder="الاسم"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">رقم الهاتف</label>
              <input
                {...register('phone')}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="01xxxxxxxxx"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                {...register('email')}
                className={`w-full px-4 py-2.5 bg-white border ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none`}
                placeholder="email@example.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">الكود (اختياري)</label>
              <input
                {...register('code')}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="C-001"
              />
            </div>
            {collectB2BData && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">اسم الشركة (اختياري)</label>
                  <div className="relative">
                    <input
                      {...register('companyName')}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none pl-10"
                      placeholder="اسم الشركة"
                    />
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">الرقم الضريبي (اختياري)</label>
                  <div className="relative">
                    <input
                      {...register('taxNumber')}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none pl-10"
                      placeholder="الرقم الضريبي"
                    />
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Credit Limit & Balance */}
          {showCreditBalance && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <label className="block text-xs font-bold text-red-800 mb-1">رصيد دائن (عليه)</label>
                <input
                  type="number"
                  step="any"
                  {...register('balance', { valueAsNumber: true })}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm font-bold text-red-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-indigo-800 mb-1">
                  الحد الائتماني (سقف الدين)
                </label>
                <input
                  type="number"
                  step="any"
                  {...register('creditLimit', { valueAsNumber: true })}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-indigo-600"
                  placeholder="0 (بلا حدود)"
                />
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">التصنيفات (Tags)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="relative">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={addTag}
                placeholder="اكتب تصنيف واضغط Enter (مثال: جملة)"
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {enableMeasurements && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 mt-4 text-indigo-700 bg-indigo-50 p-2 border border-indigo-100 rounded-lg">المقاسات (للتفصيل والاستعارة) بالسنتيمتر</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl mb-4">
                {[
                    { id: 'length', key: 'measurements.length', label: 'الطول الكلي' },
                    { id: 'shoulder', key: 'measurements.shoulder', label: 'الكتف' },
                    { id: 'sleeveLength', key: 'measurements.sleeveLength', label: 'طول الكم' },
                    { id: 'sleeveWidth', key: 'measurements.sleeveWidth', label: 'وسع الكم' },
                    { id: 'cuff', key: 'measurements.cuff', label: 'الكبك / المعصم' },
                    { id: 'neck', key: 'measurements.neck', label: 'الرقبة' },
                    { id: 'chest', key: 'measurements.chest', label: 'الصدر' },
                    { id: 'waist', key: 'measurements.waist', label: 'الوسط/الخصر' },
                    { id: 'hips', key: 'measurements.hips', label: 'الحوض' },
                    { id: 'bottomWidth', key: 'measurements.bottomWidth', label: 'وسع أسفل' },
                    { id: 'pantsLength', key: 'measurements.pantsLength', label: 'طول البنطلون' },
                    { id: 'pantsWaist', key: 'measurements.pantsWaist', label: 'خصر البنطلون' },
                    { id: 'thigh', key: 'measurements.thigh', label: 'الفخذ' },
                    { id: 'knee', key: 'measurements.knee', label: 'الركبة' },
                    { id: 'legOpening', key: 'measurements.legOpening', label: 'وسع الرجل' },
                ].filter(field => activeMeasurementFields.includes(field.id)).map(field => (
                  <div key={field.key} className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                    <label className="block text-[10px] font-bold text-gray-600 mb-1.5 text-center">{field.label}</label>
                    <input type="number" step="any" placeholder="0" {...register(field.key as any, { valueAsNumber: true })} className="w-full px-2 py-1.5 bg-slate-50/50 border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500 focus:bg-white outline-none text-sm text-center font-mono font-bold text-slate-800" />
                  </div>
                ))}
                <div className="col-span-2 sm:col-span-4 md:col-span-5 pt-2 border-t border-slate-100 mt-1">
                  <label className="block text-xs font-bold text-gray-600 mb-1">ملاحظات المقاس (مثال: يفضل الملابس الواسعة)</label>
                  <textarea rows={2} {...register('measurements.notes')} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none" />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">العنوان</label>
            <input
              {...register('address')}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">ملاحظات</label>
            <textarea
              rows={2}
              {...register('notes')}
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
          {customer && (
            <button
              type="button"
              onClick={() => onDelete(customer.id!)}
              className="w-full py-2 text-red-500 font-bold text-sm hover:bg-red-50 rounded-lg mt-2 transition-colors"
            >
              حذف العميل نهائياً
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default CustomerFormModal;
