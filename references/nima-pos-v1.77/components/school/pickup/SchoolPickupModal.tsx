import React from 'react';
import { X, ShieldCheck, QrCode } from 'lucide-react';
import { SchoolStudent } from '../../../types';

interface SchoolPickupModalProps {
  isPickupModalOpen: boolean;
  setIsPickupModalOpen: (val: boolean) => void;
  selectedStudent: any;
  pin: string;
  setPin: (val: string) => void;
  handleLogPickup: (e: React.FormEvent) => void;
}

export const SchoolPickupModal: React.FC<SchoolPickupModalProps> = ({
  isPickupModalOpen, setIsPickupModalOpen, selectedStudent, pin, setPin, handleLogPickup
}) => {
  if (!isPickupModalOpen || !selectedStudent) return null;
  return (
      <>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50 rounded-t-3xl">
              <h2 className="text-xl font-black text-emerald-800 flex items-center gap-2">
                <QrCode className="w-6 h-6" /> تأكيد تسليم الطفل
              </h2>
              <button
                onClick={() => setIsPickupModalOpen(false)}
                className="p-2 hover:bg-emerald-100 rounded-full text-emerald-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleLogPickup} className="p-6 space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-black text-slate-800">
                  {selectedStudent.name}
                </h3>
                <p className="text-slate-500 font-bold mt-1">
                  يرجى التحقق من هوية المستلم
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  الشخص المستلم (المصرح له){" "}
                  <span className="text-emerald-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {authorizedPickups
                    .filter((ap) => ap.studentId === selectedStudent.id)
                    .map((ap) => (
                      <label
                        key={ap.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedAuthPerson?.id === ap.id ? "border-emerald-500 bg-emerald-50" : "border-slate-100 bg-white hover:border-emerald-200"}`}
                      >
                        <input
                          type="radio"
                          name="authPerson"
                          className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                          checked={selectedAuthPerson?.id === ap.id}
                          onChange={() => setSelectedAuthPerson(ap)}
                        />
                        <div className="flex-1">
                          <div className="font-bold text-slate-800 flex items-center gap-2">
                            {ap.name}
                            {ap.hasDailyPassword && (
                              <span title="يتطلب كلمة سر">
                                <Lock className="w-3.5 h-3.5 text-amber-500" />
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 font-medium">
                            {ap.relation} • {ap.phone} • ق.ق:{" "}
                            {ap.nationalId || "غير مسجل"}
                          </div>
                        </div>
                      </label>
                    ))}
                </div>
              </div>

              {selectedAuthPerson?.hasDailyPassword && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                  <label className="block text-sm font-bold text-amber-800 mb-2 flex items-center gap-1.5">
                    <Key className="w-4 h-4" /> كلمة السر للاستلام{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={pickupPassword}
                    onChange={(e) => setPickupPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono outline-none text-center tracking-widest text-lg"
                    placeholder="••••"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  ملاحظات والتوقيع (اختياري)
                </label>
                <textarea
                  value={pickupNote}
                  onChange={(e) => setPickupNote(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium resize-none outline-none"
                  rows={2}
                  placeholder="اكتب أي ملاحظات وقت الاستلام..."
                ></textarea>
                <div className="mt-2 p-4 bg-slate-50 border border-slate-200 border-dashed rounded-xl flex items-center justify-center text-slate-400 text-sm font-bold flex-col gap-2">
                  (محاكاة) توقيع المستلم إلكترونياً
                  <div className="w-full h-12 bg-white border border-slate-100 rounded-lg"></div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!selectedAuthPerson}
                className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-black text-lg hover:bg-emerald-700 transition shadow-sm shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check className="w-6 h-6" /> تسجيل انصراف وتسليم الطفل
              </button>
            </form>
          </div>
        </div>
      </>

  );
};
