import React, { useState } from "react";
import { X, ShieldCheck, Plus, Trash2, Key, QrCode } from "lucide-react";

interface ManageAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  authorizedPickups: any[];
  onAddAuth: (authForm: any) => void | Promise<void>;
  onDeleteAuth: (id: number) => void | Promise<void>;
}

export const ManageAuthModal: React.FC<ManageAuthModalProps> = ({
  isOpen,
  onClose,
  student,
  authorizedPickups,
  onAddAuth,
  onDeleteAuth
}) => {
  const [authForm, setAuthForm] = useState({
    name: "",
    phone: "",
    relation: "",
    nationalId: "",
    hasDailyPassword: false,
    dailyPassword: "",
  });

  if (!isOpen || !student) return null;

  const studentPickups = authorizedPickups.filter((ap) => ap.studentId === student.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authForm.name || !authForm.relation) return;

    await onAddAuth({
      studentId: student.id,
      ...authForm
    });

    setAuthForm({
      name: "",
      phone: "",
      relation: "",
      nationalId: "",
      hasDailyPassword: false,
      dailyPassword: "",
    });
  };

  const handlePrintQR = (person: any) => {
    alert(`جاري طباعة بطاقة الاستلام (QR Code) لـ ${person.name} (استلام الطالب: ${student.name})`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" dir="rtl">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-800">إدارة الأشخاص المصرح لهم بالاستلام: {student.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors outline-none">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* List of current authorized pickups */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 mb-3">قائمة المصرح لهم حالياً</h3>
            <div className="space-y-2">
              {studentPickups.map((person) => (
                <div key={person.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <h4 className="font-black text-slate-800">{person.name} ({person.relation})</h4>
                    <p className="text-xs text-slate-500 mt-1">الجوال: {person.phone || "-"} • الهوية: {person.nationalId || "-"}</p>
                    {person.hasDailyPassword && (
                      <p className="text-xs text-amber-600 font-bold mt-1 flex items-center gap-1">
                        <Key className="w-3 h-3" /> كلمة السر اليومية للتحقق: {person.dailyPassword}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handlePrintQR(person)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="طباعة بطاقة الاستلام"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteAuth(person.id!)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {studentPickups.length === 0 && (
                <div className="py-6 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                  <p className="text-sm text-slate-500 font-bold">لا يوجد أي شخص مصرح له بالاستلام مضاف حالياً.</p>
                </div>
              )}
            </div>
          </div>

          {/* Add Form */}
          <form onSubmit={handleSubmit} className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/80 space-y-4">
            <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> إضافة شخص مصرح له جديد
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">الاسم الكامل <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  placeholder="مثال: ميكولا زاخاروف"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">الصلة/القرابة <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={authForm.relation}
                  onChange={(e) => setAuthForm({ ...authForm, relation: e.target.value })}
                  placeholder="أب، أم، عم، سائق..."
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">رقم الجوال</label>
                <input
                  type="text"
                  value={authForm.phone}
                  onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })}
                  placeholder="09XXXXXXXX"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">رقم الهوية الوطنية</label>
                <input
                  type="text"
                  value={authForm.nationalId}
                  onChange={(e) => setAuthForm({ ...authForm, nationalId: e.target.value })}
                  placeholder="اختياري للتحقق الفعلي"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={authForm.hasDailyPassword}
                    onChange={(e) => setAuthForm({ ...authForm, hasDailyPassword: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="text-xs font-bold text-slate-700">تفعيل كلمة السر اليومية للتحقق عند الاستلام</span>
                </label>

                {authForm.hasDailyPassword && (
                  <input
                    type="text"
                    required
                    value={authForm.dailyPassword}
                    onChange={(e) => setAuthForm({ ...authForm, dailyPassword: e.target.value })}
                    placeholder="ضع كلمة السر المعتمدة اليوم (أرقام أو حروف)"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" /> إضافة للمصرح لهم
              </button>
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-slate-200 font-bold text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
