import React from 'react';
import { X, Brain, CheckCircle2, ChevronRight, MessageSquare, AlertTriangle, User, LineChart, MessageCircle } from 'lucide-react';
import { SchoolStudent } from '../../../types';

interface SchoolBehaviorCreateModalProps {
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (val: boolean) => void;
  handleCreate: (e: React.FormEvent) => void;
  form: any;
  setForm: (data: any) => void;
  students: SchoolStudent[];
  classes: any[];
  BEHAVIOR_TYPES: any[];
  specialists: any[];
}

export const SchoolBehaviorCreateModal: React.FC<SchoolBehaviorCreateModalProps> = ({
  isCreateModalOpen,
  setIsCreateModalOpen,
  handleCreate,
  form,
  setForm,
  students,
  classes,
  BEHAVIOR_TYPES,
  specialists
}) => {
  if (!isCreateModalOpen) return null;
  return (
      <>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Brain className="w-6 h-6 text-sky-500" /> إضافة سجل متابعة
                سلوكية / نفسية
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    الطالب <span className="text-sky-500">*</span>
                  </label>
                  <select
                    required
                    value={form.studentId}
                    onChange={(e) =>
                      setForm({ ...form, studentId: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-bold outline-none"
                  >
                    <option value="">-- اختر الطالب --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} -{" "}
                        {classes.find((c) => c.id === s.classroomId)?.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      تاريخ الملاحظة <span className="text-sky-500">*</span>
                    </label>
                    <input
                      required
                      type="date"
                      value={form.date}
                      onChange={(e) =>
                        setForm({ ...form, date: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-bold outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      الأولوية
                    </label>
                    <select
                      value={form.priority}
                      onChange={(e) =>
                        setForm({ ...form, priority: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-bold outline-none text-sm"
                    >
                      <option value="low">ملاحظة عادية</option>
                      <option value="medium">متوسطة</option>
                      <option value="high">قصوى (تدخل سريع)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    نوع السلوك / المشكلة <span className="text-sky-500">*</span>
                  </label>
                  <select
                    required
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-bold outline-none"
                  >
                    {BEHAVIOR_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center pt-8">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.recurrent}
                      onChange={(e) =>
                        setForm({ ...form, recurrent: e.target.checked })
                      }
                      className="w-5 h-5 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                    />
                    <span className="font-bold text-slate-800">
                      مشكلة متكررة
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  الملاحظات اليومية وتفاصيل الموقف{" "}
                  <span className="text-sky-500">*</span>
                </label>
                <textarea
                  required
                  value={form.dailyNotes}
                  onChange={(e) =>
                    setForm({ ...form, dailyNotes: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-medium resize-none outline-none"
                  rows={2}
                  placeholder="اكتب وصف الموقف بدقة..."
                ></textarea>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-indigo-500" /> خطط التعديل
                  والمتابعة
                </h3>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    خطة تعديل السلوك المقترحة
                  </label>
                  <textarea
                    value={form.modificationPlan}
                    onChange={(e) =>
                      setForm({ ...form, modificationPlan: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium resize-none outline-none"
                    rows={2}
                    placeholder="(مثال: نظام تعزيز إيجابي، التجاهل المتعمد، عزل مؤقت...)"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      تقييم المعلمة
                    </label>
                    <textarea
                      value={form.teacherEvaluation}
                      onChange={(e) =>
                        setForm({ ...form, teacherEvaluation: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium resize-none outline-none"
                      rows={2}
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      تقييم الأخصائي (اختياري)
                    </label>
                    <textarea
                      value={form.specialistEvaluation}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          specialistEvaluation: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium resize-none outline-none"
                      rows={2}
                    ></textarea>
                  </div>
                </div>
                <div className="mt-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    الأخصائي / المعلم المتابع
                  </label>
                  <select
                    value={form.specialistId}
                    onChange={(e) =>
                      setForm({ ...form, specialistId: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold outline-none"
                  >
                    <option value="">-- بدون تحديد --</option>
                    {specialists.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} - {e.jobTitle}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-amber-600" /> مقابلة
                  ولى الأمر (في حال تم الاستدعاء)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      تاريخ المقابلة
                    </label>
                    <input
                      type="date"
                      value={form.parentMeetingDate}
                      onChange={(e) =>
                        setForm({ ...form, parentMeetingDate: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold outline-none text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      مخرجات المقابلة وملاحظات ولي الأمر
                    </label>
                    <textarea
                      value={form.parentMeetingNotes}
                      onChange={(e) =>
                        setForm({ ...form, parentMeetingNotes: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium resize-none outline-none"
                      rows={1}
                    ></textarea>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  نتيجة التحسن (تحدث بعد فترة من التطبيق)
                </label>
                <textarea
                  value={form.improvementResult}
                  onChange={(e) =>
                    setForm({ ...form, improvementResult: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium resize-none outline-none focus:bg-emerald-50 transition-colors"
                  rows={2}
                  placeholder="هل تحسن الطفل؟ ما هي الاستجابات؟"
                ></textarea>
              </div>

              <div className="pt-6 border-t border-slate-100 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 transition-colors shadow-sm shadow-sky-200"
                >
                  حفظ السجل
                </button>
              </div>
            </form>
          </div>
        </div>
      </>
  );
};
