import React from 'react';
import { X, Check } from 'lucide-react';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const SubjectModal: React.FC<SubjectModalProps> = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" dir="rtl">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-xl font-black text-slate-800">
            {formData.id ? 'تعديل مهارة / مادة' : 'إضافة مهارة أو مادة جديدة'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4 text-sm">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">اسم المادة أو المهارة <span className="text-rose-500">*</span></label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="مثال: اللغة العربية، التركيز والانتباه"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">التصنيف الرئيسي <span className="text-rose-500">*</span></label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold text-slate-700"
            >
              <option value="academic">أكاديمي وتعليمي</option>
              <option value="behavioral">سلوكي وتربوي</option>
              <option value="activities">أنشطة فنية وحركية</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">طريقة التقييم المستهدف <span className="text-rose-500">*</span></label>
            <select
              required
              value={formData.evaluationMethod}
              onChange={(e) => setFormData({ ...formData, evaluationMethod: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold text-slate-700"
            >
              <option value="score">درجة مئوية (أو تقدير رقمي)</option>
              <option value="color">نظام تقييم الألوان (ممتاز 🟢 / مقبول 🟡 / يحتاج تحسين 🔴)</option>
              <option value="text">تقييم وصفي (ملاحظات نصية)</option>
            </select>
          </div>

          <div className="pt-6 flex gap-3">
            <button
              type="submit"
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 flex-1 transition"
            >
              حفظ البيانات
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  subjects: any[];
  formData: any;
  handleEvalChange: (subjectId: number, field: string, value: any) => void;
  generalNotes: string;
  setGeneralNotes: (notes: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const EvaluationModal: React.FC<EvaluationModalProps> = ({
  isOpen,
  onClose,
  student,
  subjects,
  formData,
  handleEvalChange,
  generalNotes,
  setGeneralNotes,
  onSubmit,
}) => {
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" dir="rtl">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-xl font-black text-slate-800">تسجيل التقييم المستمر</h3>
            <p className="text-xs text-indigo-600 font-bold mt-1">الطفل: {student.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            {subjects.map((sub) => {
              const subData = formData[sub.id] || {};
              return (
                <div key={sub.id} className="p-4 border border-slate-150 rounded-2xl bg-slate-50/50 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 text-base">{sub.name}</span>
                    <span className="text-xs font-bold text-slate-500 px-2 py-1 rounded bg-slate-100">
                      {sub.category === 'academic' ? 'أكاديمي' : sub.category === 'behavioral' ? 'سلوكي' : 'أنشطة'}
                    </span>
                  </div>

                  {sub.evaluationMethod === 'score' && (
                    <div>
                      <input
                        type="text"
                        placeholder="مثال: 95% أو ممتاز أو جيد جداً..."
                        value={subData.grade || ''}
                        onChange={(e) => handleEvalChange(sub.id, 'grade', e.target.value)}
                        className="w-full bg-white border border-slate-200 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-700"
                      />
                    </div>
                  )}

                  {sub.evaluationMethod === 'color' && (
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleEvalChange(sub.id, 'colorRating', 'green')}
                        className={`py-2 rounded-xl font-bold flex items-center justify-center gap-2 border text-sm transition ${
                          subData.colorRating === 'green'
                            ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                            : 'bg-white border-slate-200 hover:bg-emerald-50 text-slate-600'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full bg-emerald-500" />
                        ممتاز
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEvalChange(sub.id, 'colorRating', 'yellow')}
                        className={`py-2 rounded-xl font-bold flex items-center justify-center gap-2 border text-sm transition ${
                          subData.colorRating === 'yellow'
                            ? 'bg-amber-100 border-amber-400 text-amber-800'
                            : 'bg-white border-slate-200 hover:bg-amber-50 text-slate-600'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full bg-amber-500" />
                        مقبول
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEvalChange(sub.id, 'colorRating', 'red')}
                        className={`py-2 rounded-xl font-bold flex items-center justify-center gap-2 border text-sm transition ${
                          subData.colorRating === 'red'
                            ? 'bg-rose-100 border-rose-400 text-rose-800'
                            : 'bg-white border-slate-200 hover:bg-rose-50 text-slate-600'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full bg-rose-500" />
                        يحتاج تحسين
                      </button>
                    </div>
                  )}

                  {sub.evaluationMethod === 'text' && (
                    <div>
                      <textarea
                        rows={2}
                        placeholder="ملاحظات حول أداء وتطور مهارات الطفل..."
                        value={subData.textRating || ''}
                        onChange={(e) => handleEvalChange(sub.id, 'textRating', e.target.value)}
                        className="w-full bg-white border border-slate-200 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {subjects.length === 0 && (
              <div className="text-center py-6 text-slate-400 font-bold">يرجى إضافة مهارات أولاً لتقييم الطفل عليها.</div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4">
            <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات عامة حول التطور السلوكي والبدني</label>
            <textarea
              rows={3}
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="اكتب أي ملاحظات إضافية يقرأها ولي الأمر..."
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
            />
          </div>

          <div className="pt-4 flex gap-3 border-t border-slate-100">
            <button
              type="submit"
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 flex-1 transition"
            >
              حفظ التقييم بالكامل
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
