import React from 'react';
import { X, Percent, AlertCircle } from 'lucide-react';


interface SchoolDiscountModalProps {
isCreateModalOpen: boolean;
setIsCreateModalOpen: (val: boolean) => void;
handleCreate: (e: any) => void;
form: any;
setForm: (val: any) => void;
}

export const SchoolDiscountModal: React.FC<SchoolDiscountModalProps> = (props) => {
   const { isCreateModalOpen, setIsCreateModalOpen, handleCreate, form, setForm } = props;
   if (!isCreateModalOpen) return null;
   return (
      <>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
              <h2 className="text-xl font-black text-slate-800">
                طلب إضافة خصم / منحة
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
                    الطالب
                  </label>
                  <select
                    required
                    value={form.studentId}
                    onChange={(e) =>
                      setForm({ ...form, studentId: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-bold outline-none"
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
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    نوع الخصم
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-bold outline-none"
                  >
                    {DISCOUNT_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    القيمة
                  </label>
                  <div className="flex gap-2">
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.amount}
                      onChange={(e) =>
                        setForm({ ...form, amount: Number(e.target.value) })
                      }
                      className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-mono outline-none"
                    />
                    <select
                      value={form.isPercentage ? "percent" : "fixed"}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          isPercentage: e.target.value === "percent",
                        })
                      }
                      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-bold outline-none"
                    >
                      <option value="percent">% نسبة</option>
                      <option value="fixed">ج.م مبلغ</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    نطاق الخصم
                  </label>
                  <select
                    value={form.appliesTo}
                    onChange={(e) =>
                      setForm({ ...form, appliesTo: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-bold outline-none"
                  >
                    <option value="subscription_only">
                      الاشتراك التعليمي فقط
                    </option>
                    <option value="all_fees">
                      الاشتراك وجميع الرسوم الإضافية
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  السبب / المبرر (مطلوب)
                </label>
                <textarea
                  required
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-medium resize-none outline-none"
                  rows={3}
                  placeholder="اكتب سبب طلب الخصم ليتم مراجعته من الإدارة..."
                ></textarea>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="isPermanent"
                  checked={form.isPermanent}
                  onChange={(e) =>
                    setForm({ ...form, isPermanent: e.target.checked })
                  }
                  className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                />
                <div>
                  <label
                    htmlFor="isPermanent"
                    className="font-bold text-slate-800 cursor-pointer"
                  >
                    خصم دائم
                  </label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    إذا تم اختياره سيطبق الخصم طوال فترة بقاء الطالب في
                    المدرسة/الحضانة.
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-amber-800 leading-relaxed">
                  بمجرد تقديم الطلب، سيتحول إلى حالة "قيد الانتظار" ولن يتم
                  تفعيل الخصم في حساب الطالب إلا بعد اعتماد الإدارة / المدير.
                </p>
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
                  className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200"
                >
                  تقديم طلب الخصم
                </button>
              </div>
            </form>
          </div>
        </div>
      </>
   );
};