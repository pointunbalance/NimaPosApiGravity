import React from 'react';
import { X, Award, Phone } from 'lucide-react';
import { TrainerType, SHIFT_OPTIONS, SPECIALIZATION_OPTIONS } from './trainersTypes';

interface TrainersFormModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  isEdit: boolean;
  formData: Partial<TrainerType>;
  setFormData: (data: any) => void;
  onSave: (e: React.FormEvent) => void;
  currency: string;
}

export const TrainersFormModal: React.FC<TrainersFormModalProps> = ({
  isModalOpen,
  setIsModalOpen,
  isEdit,
  formData,
  setFormData,
  onSave,
  currency
}) => {
  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm font-sans text-right" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-row-reverse text-right">
          <button 
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="p-1 px-3 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-full transition-colors cursor-pointer text-xs font-bold"
          >
            إغلاق ×
          </button>
          
          <div className="flex items-center gap-2 flex-row-reverse text-right">
            <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <Award className="w-5 h-5" />
            </span>
            <h2 className="text-base font-black text-slate-800">
              {isEdit ? 'تعديل وثيقة المدرب الرياضي' : 'تسجيل وتعيين مدرب وصاحب صلاحية جديد'}
            </h2>
          </div>
        </div>

        {/* Modal Form body */}
        <form onSubmit={onSave} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* General row 1: Name & Specialized */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">الاسم الثلاثي أو الثنائي بالكامل *</label>
              <input 
                type="text" 
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="مثال: كابتن بوهدان شفتشينكو"
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">التخصص التدريبي الرئيسي *</label>
              <select
                value={formData.specialization || '🏋️‍♂️ كمال أجسام وحديد'}
                onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none bg-white"
              >
                {SPECIALIZATION_OPTIONS.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Row 2: Phone & active Shift & Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">رقم جوال تواصل المدرب *</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                  placeholder="مثال: 010043940384"
                  className="w-full pr-9 pl-4 py-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none text-left"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">الوردية والدوام المعين للعمل *</label>
              <select
                value={formData.shift || 'مسائي (02:00 م - 10:00 م)'}
                onChange={(e) => setFormData({...formData, shift: e.target.value})}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white focus:outline-none"
              >
                {SHIFT_OPTIONS.map(sh => (
                  <option key={sh} value={sh}>{sh}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">حالة التواجد الحالية *</label>
              <select
                value={formData.status || 'متاح'}
                onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-black text-slate-700 bg-white focus:outline-none"
              >
                <option value="متاح">🟢 متاح وقائم برأس العمل</option>
                <option value="في إجازة">🟡 في إجازة معتمدة</option>
                <option value="موقوف">🔴 موقوف مؤقتاً</option>
              </select>
            </div>

          </div>

          {/* Core financial parameters settlement */}
          <div className="bg-indigo-50/20 p-5 rounded-2xl border border-indigo-100/30 space-y-4">
            <span className="text-xs font-black text-indigo-700 block border-b pb-2">تفاصيل العقد المالي واحتساب العمولات والمناوبات</span>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">الراتب الأساسي التعاقدي ({currency}) *</label>
                <input 
                  type="number" 
                  value={formData.baseSalary ?? 5000}
                  onChange={(e) => setFormData({...formData, baseSalary: Number(e.target.value)})}
                  placeholder="مثال: 6000"
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-black text-indigo-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none font-mono text-right"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">نوع واحتساب عمولة المدرب *</label>
                <select
                  value={formData.commissionType || 'fixed_per_student'}
                  onChange={(e) => setFormData({...formData, commissionType: e.target.value as any})}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none bg-white"
                >
                  <option value="fixed_per_student">💵 مبلغ ثابت لكل طالب</option>
                  <option value="percentage_of_session">🎯 نسبة % من رسوم التدريب</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">قيمة عمولة التكليف المقررة *</label>
                <input 
                  type="number" 
                  value={formData.commissionValue === 0 ? '' : formData.commissionValue}
                  onChange={(e) => setFormData({...formData, commissionValue: Number(e.target.value)})}
                  placeholder="قيمة العمولة..."
                  required
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none bg-white font-mono text-right"
                />
              </div>

            </div>
          </div>

          {/* Bio & Resume */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">نبذة مختصرة ورابط السيرة المهنية (Bio)</label>
            <textarea 
              value={formData.bio || ''}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              rows={3}
              placeholder="اكتب بمهنية تفاصيل الإنجازات والشهادات المكتسبة للمدرب..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none"
            />
          </div>

          {/* Date of Joining & adjustable Rating row */}
          <div className="grid grid-cols-2 gap-5">
            
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">تاريخ الانضمام للنادي *</label>
              <input 
                type="date" 
                value={formData.hireDate || ''}
                onChange={(e) => setFormData({...formData, hireDate: e.target.value})}
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">التقييم الأولي الممنوح له (من 5.0) *</label>
              <input 
                type="number" 
                step="0.1"
                min="1.0"
                max="5.0"
                value={formData.rating ?? 4.8}
                onChange={(e) => setFormData({...formData, rating: parseFloat(e.target.value)})}
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none font-mono text-right"
              />
            </div>

          </div>

          {/* Saving and cancel actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 bg-slate-50 p-4 -mx-6 -mb-6 flex-row-reverse text-right">
            <button 
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all text-xs shadow-md cursor-pointer"
            >
              حفظ السند والبيانات
            </button>
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold bg-white hover:bg-slate-100 transition-all text-xs cursor-pointer"
            >
              إلغاء الأمر
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
