import React from 'react';
import { CheckCircle2, Clock3, AlertCircle, XCircle } from 'lucide-react';

interface AttendanceStatsProps {
  stats: {
    total: number;
    present: number;
    late: number;
    excused: number;
    absent: number;
  };
  totalLabel?: string;
}

const AttendanceStats: React.FC<AttendanceStatsProps> = ({ stats, totalLabel = 'إجمالي الموظفين' }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
        <span className="text-slate-500 text-sm mb-1">{totalLabel}</span>
        <span className="text-2xl font-bold text-slate-800">{stats.total}</span>
      </div>
      <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-sm flex flex-col items-center justify-center text-center">
        <span className="text-emerald-600 text-sm mb-1 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> حاضر</span>
        <span className="text-2xl font-bold text-emerald-700">{stats.present}</span>
      </div>
      <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 shadow-sm flex flex-col items-center justify-center text-center">
        <span className="text-amber-600 text-sm mb-1 flex items-center gap-1"><Clock3 className="w-4 h-4"/> متأخر</span>
        <span className="text-2xl font-bold text-amber-700">{stats.late}</span>
      </div>
      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 shadow-sm flex flex-col items-center justify-center text-center">
        <span className="text-blue-600 text-sm mb-1 flex items-center gap-1"><AlertCircle className="w-4 h-4"/> مجاز</span>
        <span className="text-2xl font-bold text-blue-700">{stats.excused}</span>
      </div>
      <div className="bg-red-50 p-4 rounded-2xl border border-red-100 shadow-sm flex flex-col items-center justify-center text-center">
        <span className="text-red-600 text-sm mb-1 flex items-center gap-1"><XCircle className="w-4 h-4"/> غائب</span>
        <span className="text-2xl font-bold text-red-700">{stats.absent}</span>
      </div>
    </div>
  );
};

export default AttendanceStats;
