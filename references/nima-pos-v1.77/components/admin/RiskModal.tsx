import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RiskRecord } from '../../types';
import { X, Save, AlertTriangle } from 'lucide-react';

const riskSchema = z.object({
  title: z.string().min(1, 'عنوان الخطر مطلوب'),
  description: z.string().min(1, 'الوصف مطلوب'),
  category: z.enum(['financial', 'operational', 'strategic', 'compliance', 'reputational']),
  probability: z.enum(['low', 'medium', 'high', 'critical']),
  impact: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['identified', 'assessed', 'mitigated', 'closed']),
  mitigationPlan: z.string().optional(),
  owner: z.string().optional(),
});

type RiskFormValues = z.infer<typeof riskSchema>;

interface RiskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (risk: Partial<RiskRecord>) => Promise<void>;
  editingRisk: RiskRecord | null;
}

const RiskModal: React.FC<RiskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingRisk
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<RiskFormValues>({
    resolver: zodResolver(riskSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'operational',
      probability: 'medium',
      impact: 'medium',
      status: 'identified',
      mitigationPlan: '',
      owner: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (editingRisk) {
        reset({
          title: editingRisk.title,
          description: editingRisk.description,
          category: editingRisk.category,
          probability: editingRisk.probability,
          impact: editingRisk.impact,
          status: editingRisk.status,
          mitigationPlan: editingRisk.mitigationPlan || '',
          owner: editingRisk.owner || ''
        });
      } else {
        reset({
          title: '',
          description: '',
          category: 'operational',
          probability: 'medium',
          impact: 'medium',
          status: 'identified',
          mitigationPlan: '',
          owner: ''
        });
      }
    }
  }, [editingRisk, isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: RiskFormValues) => {
    await onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            {editingRisk ? 'تعديل سجل الخطر' : 'إضافة خطر جديد'}
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
              <label className="block text-sm font-medium text-slate-700 mb-1">عنوان الخطر *</label>
              <input
                type="text"
                {...register('title')}
                className={`w-full px-4 py-2.5 rounded-xl border ${errors.title ? 'border-red-500' : 'border-slate-200'} focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-slate-50`}
                placeholder="مثال: تعطل نظام الدفع"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">الوصف *</label>
              <textarea
                {...register('description')}
                className={`w-full px-4 py-2.5 rounded-xl border ${errors.description ? 'border-red-500' : 'border-slate-200'} focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-slate-50 resize-none`}
                rows={3}
                placeholder="وصف تفصيلي للخطر وتأثيره المحتمل..."
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">التصنيف</label>
              <select
                {...register('category')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-slate-50"
              >
                <option value="operational">تشغيلي</option>
                <option value="financial">مالي</option>
                <option value="strategic">استراتيجي</option>
                <option value="compliance">امتثال</option>
                <option value="reputational">سمعة</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">الحالة</label>
              <select
                {...register('status')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-slate-50"
              >
                <option value="identified">تم التحديد</option>
                <option value="assessed">تم التقييم</option>
                <option value="mitigated">تم التخفيف</option>
                <option value="closed">مغلق</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">الاحتمالية</label>
              <select
                {...register('probability')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-slate-50"
              >
                <option value="low">منخفضة</option>
                <option value="medium">متوسطة</option>
                <option value="high">عالية</option>
                <option value="critical">حرجة</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">التأثير</label>
              <select
                {...register('impact')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-slate-50"
              >
                <option value="low">منخفض</option>
                <option value="medium">متوسط</option>
                <option value="high">عالي</option>
                <option value="critical">حرج</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">خطة التخفيف (Mitigation Plan)</label>
              <textarea
                {...register('mitigationPlan')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-slate-50 resize-none"
                rows={3}
                placeholder="الإجراءات المتخذة أو المخطط لها لتخفيف الخطر..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">المالك / المسؤول</label>
              <input
                type="text"
                {...register('owner')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-slate-50"
                placeholder="اسم الشخص أو القسم المسؤول"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 text-white bg-red-600 hover:bg-red-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ الخطر'}
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

export default RiskModal;
