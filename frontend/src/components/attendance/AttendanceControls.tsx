import React from 'react';
import { Search, Download, Printer, Filter } from 'lucide-react';
import { Attendance as AttendanceType } from '../../types';

interface AttendanceControlsProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: 'all' | AttendanceType['status'];
  setStatusFilter: (status: 'all' | AttendanceType['status']) => void;
  onExport: () => void;
  onPrint: () => void;
  onPrintOfficial: () => void;
  searchPlaceholder?: string;
}

const AttendanceControls: React.FC<AttendanceControlsProps> = ({ 
  searchTerm, 
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  onExport,
  onPrint,
  onPrintOfficial,
  searchPlaceholder = "بحث عن موظف..."
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
      <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-1">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder={searchPlaceholder} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 py-2 pr-10 pl-4 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-800"
          />
        </div>
        <div className="relative">
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-48 bg-slate-50 border border-slate-200 py-2 pr-10 pl-4 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-800 appearance-none"
          >
            <option value="all">جميع الحالات</option>
            <option value="present">حاضر</option>
            <option value="absent">غائب</option>
            <option value="late">متأخر</option>
            <option value="excused">مجاز</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2 w-full md:w-auto">
        <button 
          onClick={onExport}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 text-slate-600 hover:text-brand-600 transition-colors px-4 py-2 rounded-xl hover:bg-brand-50 border border-slate-200"
        >
          <Download className="w-5 h-5" />
          تصدير CSV
        </button>
        <button 
          onClick={onPrint}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 text-slate-600 hover:text-brand-600 transition-colors px-4 py-2 rounded-xl hover:bg-brand-50 border border-slate-200"
        >
          <Printer className="w-5 h-5" />
          طباعة عادية
        </button>
        <button 
          onClick={onPrintOfficial}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 text-white bg-brand-600 hover:bg-brand-700 transition-colors px-4 py-2 rounded-xl shadow-sm font-medium"
        >
          <Printer className="w-5 h-5" />
          كشف رسمي (PDF)
        </button>
      </div>
    </div>
  );
};

export default AttendanceControls;
