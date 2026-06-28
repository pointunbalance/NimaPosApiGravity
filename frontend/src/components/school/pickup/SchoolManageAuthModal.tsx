import React from 'react';
import { X, UserCog, User, Phone, CheckCircle2, QrCode, ShieldCheck, AlertTriangle } from 'lucide-react';
import { SchoolStudent } from '../../../types';

interface SchoolManageAuthModalProps {
  isManageAuthModalOpen: boolean;
  setIsManageAuthModalOpen: (val: boolean) => void;
  selectedStudent: any;
  handleAddAuthPerson: (e: React.FormEvent) => void;
  authForm: any;
  setAuthForm: (val: any) => void;
  handleDeleteAuthPerson: (name: string) => void;
}

export const SchoolManageAuthModal: React.FC<SchoolManageAuthModalProps> = ({
  isManageAuthModalOpen, setIsManageAuthModalOpen, selectedStudent, handleAddAuthPerson, authForm, setAuthForm, handleDeleteAuthPerson
}) => {
  if (!isManageAuthModalOpen || !selectedStudent) return null;
  return (
      <>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-500" /> الأشخاص
                المصرح لهم بالاستلام
              </h2>
              <button
                onClick={() => setIsManageAuthModalOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6 flex items-center gap-3 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                <UserCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                <span className="font-bold text-indigo-900 text-sm">
                  طالب: {selectedStudent.name}
                </span>
              </div>

              <div className="space-y-3 mb-8">
                <h3 className="font-bold text-slate-700 text-sm">
                  القائمة الحالية:
                </h3>
                {authorizedPickups
                  .filter((ap) => ap.studentId === selectedStudent.id)
                  .map((ap) => (
                    <div
                      key={ap.id}
                      className="flex justify-between items-center bg-white border border-slate-200 p-3 rounded-xl"
                    >
                      <div>
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          {ap.name}
                          {ap.hasDailyPassword && (
                            <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded font-bold">
                              كلمة سر
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          صلة القرابة: {ap.relation} | {ap.phone}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePrintQR(selectedStudent, ap)}
                          title="طباعة كود QR للاستلام"
                          className="text-sky-500 hover:bg-sky-50 p-2 rounded-lg transition-colors"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAuthPerson(ap.id)}
                          className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                {authorizedPickups.filter(
                  (ap) => ap.studentId === selectedStudent.id,
                ).length === 0 && (
                  <div className="text-center py-4 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 font-bold text-sm">
                    لم يتم إضافة أي شخص للآن
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> إضافة شخص مصرح له
                </h3>
                <form onSubmit={handleAddAuthPerson} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">
                        الاسم الرباعي <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        value={authForm.name}
                        onChange={(e) =>
                          setAuthForm({ ...authForm, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">
                        صلة القرابة <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        value={authForm.relation}
                        onChange={(e) =>
                          setAuthForm({ ...authForm, relation: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                        placeholder="مثل: الأب، الأم، الخال..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">
                        رقم الهاتف <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="tel"
                        value={authForm.phone}
                        onChange={(e) =>
                          setAuthForm({ ...authForm, phone: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">
                        الرقم القومي
                      </label>
                      <input
                        type="text"
                        value={authForm.nationalId}
                        onChange={(e) =>
                          setAuthForm({
                            ...authForm,
                            nationalId: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between gap-4">
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={authForm.hasDailyPassword}
                        onChange={(e) =>
                          setAuthForm({
                            ...authForm,
                            hasDailyPassword: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm font-bold text-slate-700">
                        تفعيل كلمة سر للاستلام
                      </span>
                    </label>
                    {authForm.hasDailyPassword && (
                      <input
                        type="password"
                        required
                        value={authForm.dailyPassword}
                        onChange={(e) =>
                          setAuthForm({
                            ...authForm,
                            dailyPassword: e.target.value,
                          })
                        }
                        placeholder="كلمة السر"
                        className="w-1/2 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-mono tracking-widest text-center"
                      />
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition"
                  >
                    إضافة الشخص المصرح
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </>
  );
};
