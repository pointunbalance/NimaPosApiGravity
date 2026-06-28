import React from 'react';
import { X, AlertOctagon, FileMinus } from 'lucide-react';
import { SchoolStudent } from '../../../types';

interface SchoolWithdrawalModalProps {
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (val: boolean) => void;
  handleCreate: (e: React.FormEvent) => void;
  form: any;
  setForm: (data: any) => void;
  students: SchoolStudent[];
}

export const SchoolWithdrawalModal: React.FC<SchoolWithdrawalModalProps> = ({
  isCreateModalOpen, setIsCreateModalOpen, handleCreate, form, setForm, students
}) => {
  if (!isCreateModalOpen) return null;
  return (
      <>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
              <h2 className="text-xl font-black text-slate-800">
                تسجيل طلب انسحاب ومخالصة
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
                    الطالب <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={form.studentId}
                    onChange={(e) =>
                      setForm({ ...form, studentId: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 font-bold outline-none"
                  >
                    <option value="">-- اختر الطالب --</option>
                    {activeStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} -{" "}
                        {classes.find((c) => c.id === s.classroomId)?.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    تاريخ الانسحاب <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 font-bold outline-none font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  سبب الانسحاب <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 font-medium resize-none outline-none"
                  rows={2}
                  placeholder="مثل: الانتقال لمدينة أخرى، الرسوم غير مناسبة..."
                ></textarea>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                  <Wallet className="w-5 h-5 text-slate-500" /> التسوية المالية
                  والمخالصة
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Debt Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="hasDebt"
                        checked={form.hasDebt}
                        onChange={(e) =>
                          setForm({ ...form, hasDebt: e.target.checked })
                        }
                        className="w-4 h-4 text-red-600 rounded focus:ring-red-500 border-slate-300"
                      />
                      <label
                        htmlFor="hasDebt"
                        className="font-bold text-sm text-slate-700 cursor-pointer"
                      >
                        هل على الطالب مديونية (عليه)؟
                      </label>
                    </div>
                    {form.hasDebt && (
                      <div>
                        <input
                          type="number"
                          required
                          min="1"
                          value={form.debtAmount}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              debtAmount: Number(e.target.value),
                            })
                          }
                          placeholder="المبلغ (ج.م)"
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 font-mono outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Refund Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="hasRefund"
                        checked={form.hasRefund}
                        onChange={(e) =>
                          setForm({ ...form, hasRefund: e.target.checked })
                        }
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300"
                      />
                      <label
                        htmlFor="hasRefund"
                        className="font-bold text-sm text-slate-700 cursor-pointer"
                      >
                        هل للطالب مبلغ مسترد (له)؟
                      </label>
                    </div>
                    {form.hasRefund && (
                      <div className="space-y-2">
                        <input
                          type="number"
                          required
                          min="1"
                          value={form.refundAmount}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              refundAmount: Number(e.target.value),
                            })
                          }
                          placeholder="المبلغ المسترد (ج.م)"
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono outline-none"
                        />
                        <select
                          value={form.refundMethod}
                          onChange={(e) =>
                            setForm({ ...form, refundMethod: e.target.value })
                          }
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold outline-none text-sm"
                        >
                          <option value="cash">نقدي (من الخزنة)</option>
                          <option value="bank_transfer">تحويل بنكي</option>
                          <option value="mobile_wallet">
                            محفظة إلكترونية (فودافون كاش الخ)
                          </option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  ملاحظات إضافية (اختياري)
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 font-medium resize-none outline-none"
                  rows={2}
                ></textarea>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-blue-800 leading-relaxed">
                  عند اعتماد الطلب من الإدارة سيتم تحويل حالة الطالب إلى "منسحب"
                  تلقائياً، وإذا كان له مسترد سيتم تسجيله كمصروف من الخزنة.
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
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-sm shadow-red-200"
                >
                  رفع طلب الانسحاب
                </button>
              </div>
            </form>
          </div>
        </div>
      </>
  );
};
