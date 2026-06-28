import React from 'react';
import { ScrollText, Plus, Download, Printer } from 'lucide-react';

interface JournalEntriesHeaderProps {
  onNewEntry: () => void;
  onExportCSV: () => void;
  onPrintList: () => void;
  isExportDisabled: boolean;
}

export const JournalEntriesHeader: React.FC<JournalEntriesHeaderProps> = ({ 
  onNewEntry, onExportCSV, onPrintList, isExportDisabled 
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
          <ScrollText className="w-8 h-8 text-indigo-600" />
          قيود اليومية
        </h1>
        <p className="text-slate-500 mt-1">تسجيل ومراجعة العمليات المالية (Journal Entries)</p>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={onPrintList}
          disabled={isExportDisabled}
          className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-sm transition-all disabled:opacity-50"
        >
          <Printer className="w-5 h-5" />
          <span className="hidden sm:inline">طباعة القائمة</span>
        </button>
        <button 
          onClick={onExportCSV}
          disabled={isExportDisabled}
          className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-sm transition-all disabled:opacity-50"
        >
          <Download className="w-5 h-5" />
          <span className="hidden sm:inline">تصدير CSV</span>
        </button>
        <button 
          onClick={onNewEntry}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          <span>قيد جديد</span>
        </button>
      </div>
    </div>
  );
};
