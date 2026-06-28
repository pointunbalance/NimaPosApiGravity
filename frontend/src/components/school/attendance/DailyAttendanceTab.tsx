import React from 'react';
import { CheckCircle, LogOut, Camera } from 'lucide-react';

interface DailyAttendanceTabProps {
  students: any[];
  allAttendance: any[];
  allPickups: any[];
  selectedStudentId: number;
  setSelectedStudentId: (id: number) => void;
  pickupId: number;
  setPickupId: (id: number) => void;
  notes: string;
  setNotes: (text: string) => void;
  today: string;
  handleCheckIn: () => void;
  handleCheckOut: () => void;
  triggerAbsencePrompt: (id: number) => void;
}

export const DailyAttendanceTab: React.FC<DailyAttendanceTabProps> = ({
  students,
  allAttendance,
  allPickups,
  selectedStudentId,
  setSelectedStudentId,
  pickupId,
  setPickupId,
  notes,
  setNotes,
  today,
  handleCheckIn,
  handleCheckOut,
  triggerAbsencePrompt,
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Check IN */}
        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute -left-6 -bottom-6 opacity-10">
            <CheckCircle className="w-40 h-40 text-emerald-900" />
          </div>
          <h3 className="text-2xl font-black text-emerald-900 mb-6 flex items-center gap-2">
            <CheckCircle className="w-6 h-6" /> تسجيل حضور (دخول)
          </h3>

          <div className="space-y-4 relative z-10">
            <div>
              <label className="block text-sm font-bold text-emerald-800 mb-2">اختر الطفل</label>
              <select
                className="w-full border-emerald-200 bg-white p-3 rounded-xl font-bold text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-500"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(Number(e.target.value))}
              >
                <option value={0}>-- ابحث واختار الطفل --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleCheckIn}
              className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl shadow-lg shadow-emerald-600/30 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:hover:scale-100"
              disabled={!selectedStudentId}
            >
              <CheckCircle className="w-6 h-6" /> تأكيد الحضور ودخول طفل
            </button>
          </div>
        </div>

        {/* Check OUT */}
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute -left-6 -bottom-6 opacity-10">
            <LogOut className="w-40 h-40 text-rose-900" />
          </div>
          <h3 className="text-2xl font-black text-rose-900 mb-6 flex items-center gap-2">
            <LogOut className="w-6 h-6" /> تسجيل انصراف (خروج)
          </h3>
          <div className="space-y-4 relative z-10">
            <div>
              <label className="block text-sm font-bold text-rose-800 mb-2">اختر الطفل لعمل خروج</label>
              <select
                className="w-full border-rose-200 bg-white p-3 rounded-xl font-bold text-rose-900 outline-none focus:ring-2 focus:ring-rose-500"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(Number(e.target.value))}
              >
                <option value={0}>-- ابحث واختار الطفل --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedStudentId > 0 && (
              <div className="animate-in slide-in-from-top-2">
                <label className="block text-sm font-bold text-rose-800 mb-2">
                  من الذي استلم الطفل؟ <span className="text-rose-500">*</span>
                </label>
                <select
                  className="w-full border-rose-200 bg-white p-3 rounded-xl font-bold text-rose-900 outline-none mb-3"
                  value={pickupId}
                  onChange={(e) => setPickupId(Number(e.target.value))}
                >
                  <option value={0}>-- اختر الشخص المستلم --</option>
                  {allPickups
                    .filter((p) => p.studentId === selectedStudentId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.relation})
                      </option>
                    ))}
                </select>

                {allPickups.filter((p) => p.studentId === selectedStudentId).length === 0 && (
                  <p className="text-xs text-rose-600 font-bold bg-white p-2 border border-rose-200 rounded-lg mb-3">
                    لا يوجد أشخاص مفوضين مضافين لهذا الطفل! يرجى إضافتهم من شريط "مفوضي الاستلام"
                  </p>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ملاحظات / إذن انصراف مبكر.."
                    className="flex-1 bg-white border border-rose-200 p-3 rounded-xl font-medium outline-none text-sm text-slate-800"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <button
                    type="button"
                    className="bg-rose-100 text-rose-700 p-3 rounded-xl border border-rose-200 hover:bg-rose-200 flex-shrink-0"
                    title="التقاط صورة"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleCheckOut}
              className="w-full bg-rose-600 text-white font-black py-4 rounded-xl shadow-lg shadow-rose-600/30 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:hover:scale-100"
              disabled={!selectedStudentId || !pickupId}
            >
              <LogOut className="w-6 h-6" /> تسليم الطفل وتسجيل انصراف
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
        <h4 className="font-black text-slate-800 mb-4 text-xl">سجل حركة وحالة اليوم</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="p-3 text-right">اسم الطفل</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-right">وقت الدخول</th>
                <th className="p-3 text-right">وقت الخروج (المستلم)</th>
                <th className="p-3 text-right">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {students.map((student) => {
                const att = allAttendance.find((a) => a.studentId === student.id && a.date === today);
                let statusEl = (
                  <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">
                    لم يسجل
                  </span>
                );
                if (att) {
                  if (att.status === 'present')
                    statusEl = (
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">
                        حاضر
                      </span>
                    );
                  if (att.status === 'absent')
                    statusEl = (
                      <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded text-xs font-bold">
                        غائب
                      </span>
                    );
                }

                return (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-slate-800">{student.name}</td>
                    <td className="p-3">{statusEl}</td>
                    <td className="p-3 text-slate-600 font-mono text-xs font-bold">
                      {att?.checkInTime || '-'}
                    </td>
                    <td className="p-3 text-slate-600 font-mono text-xs font-bold">
                      {att?.checkOutTime ? (
                        <div className="flex flex-col">
                          <span>{att.checkOutTime}</span>
                          {att.pickedUpById && (
                            <span className="text-indigo-600 text-[10px]">
                              بواسطة:{' '}
                              {allPickups.find((p) => p.id === att.pickedUpById)?.name}
                            </span>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-3 flex gap-2">
                      {!att && (
                        <button
                          onClick={() => triggerAbsencePrompt(student.id!)}
                          className="text-xs bg-rose-50 text-rose-600 font-bold px-2 py-1 rounded hover:bg-rose-100"
                        >
                          إثبات غياب
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default DailyAttendanceTab;
