import React from 'react';
import { X, Settings } from 'lucide-react';
import { GymPlanType } from './membershipsTypes';

interface MembershipsPlanModalProps {
  isPlanModalOpen: boolean;
  setIsPlanModalOpen: (open: boolean) => void;
  isPlanEdit: boolean;
  planFormData: Partial<GymPlanType>;
  setPlanFormData: (data: any) => void;
  currency: string;
  onSavePlan: (e: React.FormEvent) => void;
}

export const MembershipsPlanModal: React.FC<MembershipsPlanModalProps> = ({
  isPlanModalOpen,
  setIsPlanModalOpen,
  isPlanEdit,
  planFormData,
  setPlanFormData,
  currency,
  onSavePlan
}) => {
  if (!isPlanModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 font-sans text-right" dir="rtl">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-row-reverse">
          <button 
            type="button"
            onClick={() => setIsPlanModalOpen(false)}
            className="p-2 text-slate-400 hover:text-rose-50 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 flex-row-reverse">
            <Settings className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-black text-slate-800">
              {isPlanEdit ? 'تعديل باقة التدريب وقيمتها' : 'إضافة قياس باقة جديد للنواة'}
            </h2>
          </div>
        </div>

        <form onSubmit={onSavePlan} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 font-sans">عنوان الباقة المجهزة *</label>
            <input 
              type="text"
              required
              value={planFormData.name || ''}
              onChange={(e) => setPlanFormData({...planFormData, name: e.target.value})}
              placeholder="مثال: الباقة البلاتينية VIP السنوية"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none text-right"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 font-sans">فترة الصلاحية (بالأيام) *</label>
              <input 
                type="number"
                required
                min={1}
                value={planFormData.durationDays ?? 30}
                onChange={(e) => setPlanFormData({...planFormData, durationDays: Number(e.target.value)})}
                placeholder="مثال: 30"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none font-mono text-right"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 font-sans">الرسوم الافتراضية ({currency}) *</label>
              <input 
                type="number"
                required
                min={0}
                value={planFormData.price ?? 300}
                onChange={(e) => setPlanFormData({...planFormData, price: Number(e.target.value)})}
                placeholder="مثال: 500"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none font-mono text-right"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 font-sans">التصنيف والوسم</label>
            <select
              value={planFormData.category || 'عام'}
              onChange={(e) => setPlanFormData({...planFormData, category: e.target.value})}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none bg-white text-sm text-right font-bold"
            >
              <option value="عام">👥 عام / عادي</option>
              <option value="تخصصي">🎯 تخصصي (يوغا / حصص معينة)</option>
              <option value="ذهبي">👑 باقة ذهبية VIP</option>
              <option value="فضى">🥈 باقة فضية متوسطة</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 flex-row-reverse">
            <button 
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-extrabold text-xs shadow-md shadow-indigo-100 cursor-pointer"
            >
              حفظ الباقة بالمقاس
            </button>
            <button 
              type="button"
              onClick={() => setIsPlanModalOpen(false)}
              className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-bold text-xs cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
