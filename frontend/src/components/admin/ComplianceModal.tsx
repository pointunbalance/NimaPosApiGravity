import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ComplianceRecord } from '../../types';
import { X, Save, ShieldCheck } from 'lucide-react';

const complianceSchema = z.object({
  title: z.string().min(1, 'عنوان الامتثال مطلوب'),
  description: z.string().optional(),
  type: z.string().min(1, 'النوع مطلوب'),
  status: z.string().min(1, 'الحالة مطلوبة'),
  dueDate: z.string().optional(),
  lastReviewedDate: z.string().optional(),
  nextReviewDate: z.string().optional(),
  responsibleOfficer: z.string().optional(),
  reviewer: z.string().optional(),
  notes: z.string().optional(),
});

type ComplianceFormValues = z.infer<typeof complianceSchema>;

interface ComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Partial<ComplianceRecord>) => Promise<void>;
  editingRecord: ComplianceRecord | null;
}

const ComplianceModal: React.FC<ComplianceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingRecord
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ComplianceFormValues>({
    resolver: zodResolver(complianceSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'policy',
      status: 'pending_review',
      dueDate: '',
      lastReviewedDate: '',
      nextReviewDate: '',
      responsibleOfficer: '',
      reviewer: '',
      notes: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (editingRecord) {
        reset({
          title: editingRecord.title,
          description: editingRecord.description || '',
          type: editingRecord.type,
          status: editingRecord.status,
          dueDate: editingRecord.dueDate || '',
          lastReviewedDate: editingRecord.lastReviewedDate 
            ? new Date(editingRecord.lastReviewedDate).toISOString().split('T')[0] 
            : '',
          nextReviewDate: editingRecord.nextReviewDate 
            ? new Date(editingRecord.nextReviewDate).toISOString().split('T')[0] 
            : '',
          responsibleOfficer: editingRecord.responsibleOfficer || '',
          reviewer: editingRecord.reviewer || '',
          notes: editingRecord.notes || ''
        });
      } else {
        reset({
          title: '',
          description: '',
          type: 'policy',
          status: 'pending_review',
          dueDate: '',
          lastReviewedDate: '',
          nextReviewDate: '',
          responsibleOfficer: '',
          reviewer: '',
          notes: ''
        });
      }
    }
  }, [editingRecord, isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: ComplianceFormValues) => {
    await onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            {editingRecord ? 'تعديل سجل الامتثال' : 'إضافة سجل امتثال جديد'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">العنوان *</label>
              <input
                type="text"
                {...register('title')}
                className={`w-full px-4 py-2.5 rounded-xl border ${errors.title ? 'border-red-500' : 'border-slate-200'} focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-slate-50`}
                placeholder="مثال: الامتثال للائحة حماية البيانات"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">الوصف *</label>
              <textarea
                {...register('description')}
                className={`w-full px-4 py-2.5 rounded-xl border ${errors.description ? 'border-red-500' : 'border-slate-200'} focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-slate-50 resize-none`}
                rows={3}
                placeholder="وصف تفصيلي لمتطلبات الامتثال..."
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">النوع</label>
              <select
                {...register('type')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
              >
                <option value="policy">سياسة داخلية</option>
                <option value="regulation">لائحة تنظيمية</option>
                <option value="standard">معيار (مثل ISO)</option>
                <option value="law">قانون</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">الحالة</label>
              <select
                {...register('status')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
              >
                <option value="compliant">ممتثل</option>
                <option value="non_compliant">غير ممتثل</option>
                <option value="pending_review">قيد المراجعة</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ الاستحقاق (إن وجد)</label>
              <input
                type="date"
                {...register('dueDate')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ آخر مراجعة</label>
              <input
                type="date"
                {...register('lastReviewedDate')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ المراجعة القادمة</label>
              <input
                type="date"
                {...register('nextReviewDate')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">الضابط المسؤول</label>
              <input
                type="text"
                {...register('responsibleOfficer')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
                placeholder="Person responsible"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">المراجع / المسؤول</label>
              <input
                type="text"
                {...register('reviewer')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
                placeholder="اسم الشخص المسؤول عن المراجعة"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">ملاحظات إضافية</label>
              <textarea
                {...register('notes')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-slate-50 resize-none"
                rows={2}
                placeholder="أي ملاحظات أو إجراءات مطلوبة..."
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ السجل'}
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

export default ComplianceModal;
