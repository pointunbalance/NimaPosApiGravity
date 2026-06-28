import React from 'react';
import { BookmarkPlus, UserPlus2, UserCheck } from 'lucide-react';
import { ClassType } from './types';

interface ClassesTabEnrollProps {
  originalClasses: ClassType[];
  selectedClassForEnroll: number | null;
  onSelectClassForEnroll: (id: number) => void;
  activeClassData: ClassType | null;
  members: any[];
  selectedMemberId: string;
  setSelectedMemberId: (val: string) => void;
  isPaidEnroll: boolean;
  setIsPaidEnroll: (val: boolean) => void;
  enrollPaymentMethod: string;
  setEnrollPaymentMethod: (val: string) => void;
  onEnrollMember: (e: React.FormEvent) => void;
  onCancelEnrollment: (memberId: string) => void;
  currency: string;
}

export const ClassesTabEnroll: React.FC<ClassesTabEnrollProps> = ({
  originalClasses,
  selectedClassForEnroll,
  onSelectClassForEnroll,
  activeClassData,
  members,
  selectedMemberId,
  setSelectedMemberId,
  isPaidEnroll,
  setIsPaidEnroll,
  enrollPaymentMethod,
  setEnrollPaymentMethod,
  onEnrollMember,
  onCancelEnrollment,
  currency,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" dir="rtl">
      
      {/* List of classes to select */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-150 shadow-sm p-4 space-y-4">
        <h3 className="font-extrabold text-slate-800 text-sm border-b pb-2.5 text-right">📋 اختر الحصة المعنية للمراجعة:</h3>
        
        <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1 [scrollbar-width:thin]">
          {originalClasses.length === 0 ? (
            <p className="text-slate-400 text-xs text-center py-8">لا تتوفر أي حصة مجدولة بالمؤسسة بعد.</p>
          ) : (
            originalClasses.map((cl: ClassType) => {
              const attendeesCount = Array.isArray(cl.enrolledMembers) ? cl.enrolledMembers.length : 0;
              const isCurSelected = cl.id === selectedClassForEnroll;

              return (
                <button
                  type="button"
                  key={cl.id}
                  onClick={() => onSelectClassForEnroll(cl.id!)}
                  className={`w-full p-3 rounded-xl border text-right cursor-pointer transition-all flex justify-between items-center ${
                    isCurSelected 
                      ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500' 
                      : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className="space-y-1 text-right">
                    <h4 className="font-extrabold text-xs text-slate-800">{cl.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">{cl.schedule}</p>
                    <div className="text-[9px] text-indigo-650 font-bold">{cl.trainerId}</div>
                  </div>

                  <div className="text-left select-none">
                    <span className={`px-2 py-1 text-[10px] font-black rounded-full font-mono ${
                      attendeesCount >= (cl.capacity || 20) 
                        ? 'bg-rose-100 text-rose-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {attendeesCount} / {cl.capacity}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Registration forms and enrolled table */}
      <div className="lg:col-span-8 space-y-6">
        {activeClassData ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm space-y-5">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4 text-right">
              <div>
                <span className="text-[10px] bg-indigo-55/70 text-indigo-700 font-bold px-2.5 py-0.5 rounded">
                  {activeClassData.category}
                </span>
                <h3 className="text-lg font-black text-slate-800 mt-1">{activeClassData.name}</h3>
                <p className="text-xs text-slate-400">
                  المدرب المسؤول: <strong className="text-indigo-600">{activeClassData.trainerId}</strong> | الموعد: {activeClassData.schedule}
                </p>
              </div>

              <div className="text-right sm:text-left select-none">
                <span className="text-xs text-slate-400">سعر الاشتراك بالأولية:</span>
                <div className="text-lg font-black text-slate-800 font-mono">
                  {activeClassData.price && activeClassData.price > 0 ? `${activeClassData.price} ${currency}` : 'دخول مجاني لأعضاء النادي ⚡'}
                </div>
              </div>
            </div>

            {/* Register New attendee inline form */}
            <form onSubmit={onEnrollMember} className="bg-slate-50/60 p-4.5 rounded-xl border border-slate-150 space-y-4 text-right">
              <h4 className="font-extrabold text-xs text-slate-700 flex items-center gap-1">
                <BookmarkPlus className="w-4.5 h-4.5 text-indigo-500" />
                <span>تدوين وحجز عضو جديد بالحصة:</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                {/* Member select */}
                <div className="md:col-span-5 space-y-1">
                  <label className="block text-[10px] font-black text-slate-500">اسم وسجل العضو الرياضي المقيد *</label>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 focus:outline-none"
                  >
                    <option value="">-- اختر عضو رياضي نشط بالذاكرة --</option>
                    {members.map(m => (
                      <option key={m.id} value={m.memberId}>
                        {m.memberId} ({m.status === 'فعال' ? '🟢 ساري المفعول' : '🔴 منتهي الصلاحية'}) - {m.plan}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment method */}
                {activeClassData.price && activeClassData.price > 0 ? (
                  <>
                    <div className="md:col-span-3 space-y-1">
                      <label className="block text-[10px] font-black text-slate-500">تحصيل من العضو ({activeClassData.price} {currency})</label>
                      <select
                        value={enrollPaymentMethod}
                        onChange={(e) => setEnrollPaymentMethod(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none"
                      >
                        <option value="نقدي">💵 نقد كاش بالدرج</option>
                        <option value="شبكة">💳 مدى / شبكة دفع</option>
                        <option value="تحويل">🏦 تحويل بنكي</option>
                      </select>
                    </div>

                    <div className="md:col-span-2 flex items-center pb-2.5">
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={isPaidEnroll}
                          onChange={(e) => setIsPaidEnroll(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                        />
                        <span className="text-[11px] font-black text-slate-600">تسجيل مدفوع</span>
                      </label>
                    </div>
                  </>
                ) : (
                  <div className="md:col-span-5 pb-2.5 text-[11px] text-emerald-600 font-bold">
                    💡 هذه الحصة مجانية، تذكرة الدخول مشمولة باشتراك العضو الأساسي.
                  </div>
                )}

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                  >
                    <UserPlus2 className="w-4 h-4" />
                    <span>تأكيد الحجز</span>
                  </button>
                </div>
              </div>

              {members.length === 0 && (
                <div className="bg-amber-50 p-2 text-[10px] text-amber-700 rounded border border-amber-100 font-bold">
                  ⚠️ لم يتم العثور على أي أعضاء مسجلين بصالة النادي الرياضي. يرجى الذهاب أولاً لشاشة "إدارة الاشتراكات" لتسجيل عضو جديد لتتمكن من حجز الحصص له.
                </div>
              )}
            </form>

            {/* Enrolled members list table */}
            <div className="space-y-3 text-right">
              <h4 className="font-extrabold text-slate-800 text-xs flex items-center justify-between col-span-12">
                <span>👤 قائمة حضور وفترات تسجيل الأعضاء المقيدين بالتمرين:</span>
                <span className="text-[10px] text-slate-400 font-normal font-mono">السعة الحالية: {(Array.isArray(activeClassData.enrolledMembers) ? activeClassData.enrolledMembers.length : 0)} / {activeClassData.capacity} مقعد</span>
              </h4>

              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-indigo-50 font-black text-slate-500">
                      <th className="px-4 py-3">اسم كود العضو</th>
                      <th className="px-4 py-3">رقم الهاتف</th>
                      <th className="px-4 py-3">تاريخ تسجيل الانضمام</th>
                      <th className="px-4 py-3">الرسوم المحصلة والضريبة</th>
                      <th className="px-4 py-3 text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {!Array.isArray(activeClassData.enrolledMembers) || activeClassData.enrolledMembers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-bold">
                          لا يوجد أي متدربين مسجلين للحضور في هذه الفترة حتى الآن. استخدم حقول التسجيل أعلاه.
                        </td>
                      </tr>
                    ) : (
                      activeClassData.enrolledMembers.map((at: any, index: number) => (
                        <tr key={index} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-6.5 h-6.5 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center font-black">
                                {at.memberName?.charAt(0) || 'ع'}
                              </div>
                              <span className="font-extrabold text-slate-700">{at.memberName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-slate-400">{at.phone || 'غير مسجل'}</td>
                          <td className="px-4 py-3.5 text-slate-500 font-mono">{at.enrolledAt}</td>
                          <td className="px-4 py-3.5">
                            {at.paidAmount && at.paidAmount > 0 ? (
                              <span className="text-amber-600 font-bold font-mono">
                                {at.paidAmount} {currency} ({at.paymentMethod || 'نقدي'})
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-semibold">مشمول بالباقة</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => onCancelEnrollment(at.memberId)}
                              className="p-1 px-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors font-extrabold cursor-pointer"
                            >
                              إلغاء حجز الحصة
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-150 p-12 text-center text-slate-400">
            <p className="font-bold">يرجى تحديد إحدى الحصص من اللوحة الجانبية لمراجعة وتسجيل الحضور.</p>
          </div>
        )}
      </div>

    </div>
  );
};
