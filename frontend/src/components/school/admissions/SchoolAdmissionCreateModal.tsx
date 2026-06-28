import React from "react";
import { UserPlus, X, Megaphone, User, Calendar } from "lucide-react";

export const SchoolAdmissionCreateModal = ({
  isCreateModalOpen,
  setIsCreateModalOpen,
  form,
  setForm,
  handleCreate,
  LEAD_SOURCES,
  levels,
  employees,
}: any) => {
  if (!isCreateModalOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl my-8">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-indigo-500" /> إضافة طلب التحاق
            جديد
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
                اسم الطفل <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={form.childName}
                onChange={(e) =>
                  setForm({ ...form, childName: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                سن الطفل (بالسنوات)
              </label>
              <input
                type="number"
                step="0.5"
                value={form.childAge}
                onChange={(e) => setForm({ ...form, childAge: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                اسم ولي الأمر <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={form.parentName}
                onChange={(e) =>
                  setForm({ ...form, parentName: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                رقم الهاتف <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold outline-none dir-ltr"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                رقم هاتف بديل (اختياري)
              </label>
              <input
                type="tel"
                value={form.altPhone}
                onChange={(e) => setForm({ ...form, altPhone: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold outline-none dir-ltr"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                البريد الإلكتروني (اختياري)
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold outline-none dir-ltr"
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                الحضانة / المدرسة السابقة (اختياري)
              </label>
              <input
                type="text"
                value={form.previousSchool}
                onChange={(e) =>
                  setForm({ ...form, previousSchool: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                وقت التواصل المفضل
              </label>
              <select
                value={form.preferredContactTime}
                onChange={(e) =>
                  setForm({ ...form, preferredContactTime: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold outline-none"
              >
                <option value="">-- غير محدد --</option>
                <option value="morning">صباحاً (9 ص - 12 م)</option>
                <option value="afternoon">ظهراً (12 م - 4 م)</option>
                <option value="evening">مساءً (4 م - 8 م)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <input
              type="checkbox"
              id="hasSiblings"
              checked={form.hasSiblingsInSchool}
              onChange={(e) =>
                setForm({ ...form, hasSiblingsInSchool: e.target.checked })
              }
              className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label
              htmlFor="hasSiblings"
              className="text-sm font-bold text-slate-700"
            >
              هل للطفل إخوة مسجلين بالمدرسة/الحضانة؟
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                كيف عرفت عنا؟ (المصدر) <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.leadSource}
                onChange={(e) =>
                  setForm({ ...form, leadSource: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold outline-none"
              >
                {LEAD_SOURCES.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>

              <label className="block text-sm font-bold text-slate-700 mt-3 mb-2 flex items-center gap-1">
                <Megaphone className="w-4 h-4" /> الحملة الإعلانية (اختياري)
              </label>
              <input
                type="text"
                value={form.campaign}
                onChange={(e) => setForm({ ...form, campaign: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold outline-none text-sm"
                placeholder="مثال: خصم الصيف 2024"
              />
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                المستوى المطلوب
              </label>
              <select
                value={form.requestedLevelId}
                onChange={(e) =>
                  setForm({ ...form, requestedLevelId: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold outline-none mb-3"
              >
                <option value="">-- غير محدد/لا أعرف --</option>
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>

              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">
                <User className="w-4 h-4" /> الموظف المسؤول (التسويق/الاستقبال)
              </label>
              <select
                value={form.assignedTo}
                onChange={(e) =>
                  setForm({ ...form, assignedTo: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold outline-none text-sm"
              >
                <option value="">-- للكل --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl">
            <label className="block text-sm font-bold text-purple-900 mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> تاريخ الزيارة أو المقابلة البدئي
              (إن وجد)
            </label>
            <input
              type="date"
              value={form.visitDate}
              onChange={(e) => setForm({ ...form, visitDate: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-bold outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              ملاحظات بدئية
            </label>
            <textarea
              value={form.receptionistNotes}
              onChange={(e) =>
                setForm({ ...form, receptionistNotes: e.target.value })
              }
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium resize-none outline-none text-sm"
              rows={2}
              placeholder="اكتب ملاحظاتك عن الطلب..."
            ></textarea>
          </div>

          <div className="pt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-sm shadow-indigo-200"
            >
              حفظ الطلب
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
