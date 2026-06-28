import React from 'react';
import { CalendarClock } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';

interface AttendanceTabProps {
  selectedChildId: number;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({ selectedChildId }) => {
  const attendanceLogs = useLiveQuery(() => db.schoolAttendanceList.toArray())?.filter(a => a.studentId === selectedChildId) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
       <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <CalendarClock className="w-6 h-6 text-emerald-600" />
          <h3 className="text-xl font-black text-slate-800">سجل الحضور والغياب</h3>
       </div>
       <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-right text-sm">
             <thead className="bg-slate-50 border-b border-slate-200">
               <tr>
                  <th className="p-4 font-bold text-slate-600">التاريخ</th>
                  <th className="p-4 font-bold text-slate-600">الحالة</th>
                  <th className="p-4 font-bold text-slate-600">العذر / الملاحظات</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {attendanceLogs.length === 0 ? (
                  <tr><td colSpan={3} className="p-8 text-center text-slate-500">لا يوجد سجل للحضور أو الغياب</td></tr>
               ) : (
                  attendanceLogs.map(a => (
                     <tr key={a.id} className="hover:bg-slate-50">
                       <td className="p-4 font-bold text-slate-800">{a.date}</td>
                       <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                             a.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                             a.status === 'absent' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                             {a.status === 'present' ? 'حاضر' : a.status === 'absent' ? 'غائب' : 'متأخر'}
                          </span>
                       </td>
                       <td className="p-4 text-slate-600">{a.notes || '-'}</td>
                     </tr>
                  ))
               )}
             </tbody>
          </table>
       </div>
    </div>
  );
};
