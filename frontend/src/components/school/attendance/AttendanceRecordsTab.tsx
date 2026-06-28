import React from 'react';
import { Info, Download } from 'lucide-react';

interface AttendanceRecordsTabProps {
  allAttendance: any[];
  allPickups: any[];
  getStudentName: (id: number) => string;
}

export const AttendanceRecordsTab: React.FC<AttendanceRecordsTabProps> = ({
  allAttendance,
  allPickups,
  getStudentName,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">
      <div className="flex justify-between items-center bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
        <div className="flex items-center gap-3 text-indigo-800 font-bold">
          <Info className="w-5 h-5" /> يمكنك الاستعلام عن أيام محددة واستخراج تقارير الغياب الشهرية
        </div>
        <button
          type="button"
          className="bg-white text-indigo-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm border border-indigo-200 flex items-center gap-2 hover:bg-indigo-50"
        >
          <Download className="w-4 h-4" /> تصدير تقرير الغياب (Excel)
        </button>
      </div>
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
            <tr>
              <th className="p-4 text-right">التاريخ</th>
              <th className="p-4 text-right">الطالب</th>
              <th className="p-4 text-right">الحالة / الدخول / الخروج</th>
              <th className="p-4 text-right">المستلم</th>
              <th className="p-4 text-right">ملاحظات وسبب الغياب</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {allAttendance
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((att) => (
                <tr key={att.id}>
                  <td className="p-4 font-mono font-bold text-slate-500">{att.date}</td>
                  <td className="p-4 font-bold text-slate-800">{getStudentName(att.studentId)}</td>
                  <td className="p-4">
                    {att.status === 'present' ? (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-emerald-700 font-bold">حاضر</span>
                        <span className="text-slate-400 font-mono mx-2 text-xs">
                          {att.checkInTime || '-'} &rarr; {att.checkOutTime || '-'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="text-rose-700 font-bold">غائب</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-slate-600 font-medium text-xs">
                    {att.pickedUpById
                      ? allPickups.find((p) => p.id === att.pickedUpById)?.name +
                        ` (${allPickups.find((p) => p.id === att.pickedUpById)?.relation})`
                      : '-'}
                  </td>
                  <td className="p-4 text-slate-600 font-medium text-xs">
                    {att.absenceReason || att.notes || '-'}
                  </td>
                </tr>
              ))}
            {allAttendance.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">
                  لا يوجد سجلات حضور مسجلة
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default AttendanceRecordsTab;
