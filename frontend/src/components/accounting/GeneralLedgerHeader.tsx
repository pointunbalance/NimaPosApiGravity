import React from 'react';
import { BookOpen, Download, Printer } from 'lucide-react';

interface GeneralLedgerHeaderProps {
  onExportCSV: () => void;
  onPrint: () => void;
  isExportDisabled: boolean;
}

export const GeneralLedgerHeader: React.FC<GeneralLedgerHeaderProps> = ({
  onExportCSV,
  onPrint,
  isExportDisabled
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-indigo-600" />
          دفتر الأستاذ العام
        </h1>
        <p className="text-slate-500 mt-1">كشف حركة حساب تفصيلي وتحليل الأرصدة</p>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={onExportCSV} 
          className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-50 shadow-sm font-bold transition-all disabled:opacity-50" 
          disabled={isExportDisabled}
        >
          <Download className="w-4 h-4" />
          تصدير Excel
        </button>
        <button 
          onClick={onPrint} 
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 font-bold transition-all disabled:opacity-50" 
          disabled={isExportDisabled}
        >
          <Printer className="w-4 h-4" />
          طباعة
        </button>
      </div>
    </div>
  );
};
