import React from 'react';
import { X } from 'lucide-react';

interface SchoolWithdrawalCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  handleCreate: (e: React.FormEvent) => void;
  activeStudents: any[];
  classes: any[];
}

export const SchoolWithdrawalCreateModal: React.FC<SchoolWithdrawalCreateModalProps> = ({
  isOpen,
  onClose,
  form,
  setForm,
  handleCreate,
  activeStudents,
  classes,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-xl animate-in zoom-in-95">
        <div className="flex justify-between items-center px-6 py-4 bg-slate-50 border-b border-slate-100">
          <h3 className="font-black text-slate-800 text-lg">تسجيل طلب انسحاب طفل</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">الطفل</label>
            <select
              required
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 font-bold outline-none"
            >
              <option value="">-- اختر الطفل --</option>
              {activeStudents.map((s) => {
                const cls = classes.find((c) => c.id === s.classroomId);
                return (
                  <option key={s.id} value={s.id}>
                    {s.name} ({cls?.name || 'بدون فصل'})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">تاريخ الانسحاب المخطط</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">سبب الانسحاب الرئيسي</label>
            <textarea
              required
              rows={2}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="اكتب تفاصيل سبب رغبة الأهل بالانسحاب..."
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 font-medium outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-red-50/50 rounded-2xl border border-red-100">
              <label className="flex items-center gap-2 font-bold text-red-800 text-sm mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hasDebt}
                  onChange={(e) => setForm({ ...form, hasDebt: e.target.checked })}
                  className="rounded border-red-300 text-red-600 focus:ring-red-500"
                />
                هل عليه مديونية متأخرة؟
              </label>
              {form.hasDebt && (
                <input
                  type="number"
                  required
                  min={0}
                  value={form.debtAmount}
                  onChange={(e) => setForm({ ...form, debtAmount: Number(e.target.value) })}
                  placeholder="المبلغ المستحق ج.م"
                  className="w-full px-3 py-1.5 bg-white border border-red-200 rounded-xl font-bold outline-none"
                />
              )}
            </div>

            <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100">
              <label className="flex items-center gap-2 font-bold text-emerald-800 text-sm mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hasRefund}
                  onChange={(e) => setForm({ ...form, hasRefund: e.target.checked })}
                  className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                />
                هل له مسترد مالي (استرجاع)؟
              </label>
              {form.hasRefund && (
                <div className="space-y-2">
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.refundAmount}
                    onChange={(e) => setForm({ ...form, refundAmount: Number(e.target.value) })}
                    placeholder="المبلغ المسترد ج.م"
                    className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-xl font-bold outline-none"
                  />
                  <select
                    value={form.refundMethod}
                    onChange={(e) => setForm({ ...form, refundMethod: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-emerald-200 rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="cash">نقدي (خزنة)</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                    <option value="e_wallet">محفظة كاش</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">ملاحظات المخالصة والعهد</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="مثال: تم إرجاع الكتب والملابس ولم يستلم الكارنيه..."
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 font-medium outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-slate-500 hover:bg-slate-50 font-bold rounded-xl border border-slate-200"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-sm shadow-red-200"
            >
              حفظ وإرسال للطلب
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default SchoolWithdrawalCreateModal;
