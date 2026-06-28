import React from 'react';
import { X } from 'lucide-react';

interface BehaviorCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: any;
  setForm: (form: any) => void;
  handleSubmit: (e: React.FormEvent) => void;
  students: any[];
  specialists: any[];
  BEHAVIOR_TYPES: any[];
}

export const BehaviorCreateModal: React.FC<BehaviorCreateModalProps> = ({
  isOpen,
  onClose,
  form,
  setForm,
  handleSubmit,
  students,
  specialists,
  BEHAVIOR_TYPES,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-xl my-8 overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-sky-50">
          <h2 className="text-xl font-black text-slate-800">إضافة سجل سلوكي ومتابعة</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-sky-200 rounded-full text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">الطفل المستهدف *</label>
              <select
                required
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50 font-bold text-slate-700"
              >
                <option value="">-- اختر الطفل --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">التاريخ *</label>
              <input
                required
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50 text-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">نوع السلوك / الملاحظة *</label>
              <select
                required
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50 font-bold text-slate-700"
              >
                {BEHAVIOR_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">درجة الأهمية / الأولوية</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50 font-bold text-slate-700"
              >
                <option value="low">ملاحظة عادية</option>
                <option value="medium">أولوية متوسطة</option>
                <option value="high">أولوية قصوى</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">الأخصائي المتابع</label>
              <select
                value={form.specialistId}
                onChange={(e) => setForm({ ...form, specialistId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50 text-slate-700"
              >
                <option value="">-- غير محدد --</option>
                {specialists.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="recurrent"
                checked={form.recurrent}
                onChange={(e) => setForm({ ...form, recurrent: e.target.checked })}
                className="w-5 h-5 text-sky-600 rounded"
              />
              <label htmlFor="recurrent" className="text-sm font-bold text-slate-700 cursor-pointer">
                هل هذا السلوك متكرر باستمرار؟
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">الملاحظات اليومية والتفاصيل</label>
            <textarea
              rows={3}
              value={form.dailyNotes}
              onChange={(e) => setForm({ ...form, dailyNotes: e.target.value })}
              placeholder="اكتب ملاحظاتك عن السلوك وتكراره والأوقات..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">خطة التعديل المقترحة</label>
            <textarea
              rows={3}
              value={form.modificationPlan}
              onChange={(e) => setForm({ ...form, modificationPlan: e.target.value })}
              placeholder="الخطوات العلاجية المتبعة مع الطفل لتعديل هذا السلوك..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">تقييم ومتابعة المعلمة</label>
              <textarea
                rows={2}
                value={form.teacherEvaluation}
                onChange={(e) => setForm({ ...form, teacherEvaluation: e.target.value })}
                placeholder="رأي معلمة الصف..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">تقييم الأخصائي النفسي/الاجتماعي</label>
              <textarea
                rows={2}
                value={form.specialistEvaluation}
                onChange={(e) => setForm({ ...form, specialistEvaluation: e.target.value })}
                placeholder="التشخيص والتقييم الفني..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 transition-colors shadow-md"
            >
              إضافة السجل
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default BehaviorCreateModal;
