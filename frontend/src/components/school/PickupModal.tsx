import React, { useState } from "react";
import { X, ShieldCheck, Lock, Check } from "lucide-react";

interface PickupModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  authorizedPickups: any[];
  onLogPickup: (payload: { pickupPersonId: number; pickupPersonName: string; relation: string; note: string; password?: string }) => Promise<void>;
}

export const PickupModal: React.FC<PickupModalProps> = ({
  isOpen,
  onClose,
  student,
  authorizedPickups,
  onLogPickup
}) => {
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  if (!isOpen || !student) return null;

  const studentPickups = authorizedPickups.filter((ap) => ap.studentId === student.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerson) {
      setError("الرجاء اختيار الشخص المستلم");
      return;
    }

    if (selectedPerson.hasDailyPassword && selectedPerson.dailyPassword !== password) {
      setError("كلمة السر اليومية غير صحيحة");
      return;
    }

    await onLogPickup({
      pickupPersonId: selectedPerson.id,
      pickupPersonName: selectedPerson.name,
      relation: selectedPerson.relation,
      note,
      password
    });

    setSelectedPerson(null);
    setPassword("");
    setNote("");
    setError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" dir="rtl">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-emerald-900">تسجيل تسليم {student.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-emerald-400 hover:bg-emerald-100 rounded-full transition-colors outline-none">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">من هو المستلم؟ <span className="text-rose-500">*</span></label>
            <div className="grid grid-cols-1 gap-2 max-h-[180px] overflow-y-auto p-1">
              {studentPickups.map((person) => (
                <button
                  type="button"
                  key={person.id}
                  onClick={() => {
                    setSelectedPerson(person);
                    setError("");
                  }}
                  className={`w-full text-right p-3 rounded-xl border transition-all flex items-center justify-between ${
                    selectedPerson?.id === person.id
                      ? "border-emerald-500 bg-emerald-50/50 text-emerald-900 font-bold"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div>
                    <p className="text-sm">{person.name}</p>
                    <p className="text-xs text-slate-500">{person.relation} • {person.phone}</p>
                  </div>
                  {selectedPerson?.id === person.id && <Check className="w-5 h-5 text-emerald-600" />}
                </button>
              ))}
              {studentPickups.length === 0 && (
                <p className="text-sm text-rose-500 font-bold text-center py-4">لا يوجد أشخاص مصرح لهم باستلام هذا الطفل.</p>
              )}
            </div>
          </div>

          {selectedPerson?.hasDailyPassword && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-500" /> أدخل كلمة السر اليومية للتحقق
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة السر المسجلة لهذا الشخص"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all font-bold text-center"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات الاستلام (إن وجدت)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="أية ملاحظات إضافية..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-slate-200 font-bold text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!selectedPerson}
              className={`px-6 py-2.5 font-bold text-white rounded-xl transition-colors ${
                selectedPerson ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-300 cursor-not-allowed"
              }`}
            >
              تسجيل خروج آمن
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
