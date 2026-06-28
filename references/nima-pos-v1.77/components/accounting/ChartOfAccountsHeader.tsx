import React, { useRef } from 'react';
import { BookOpen, FileText, Upload, Download, Plus } from 'lucide-react';

interface ChartOfAccountsHeaderProps {
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onNewAccount: () => void;
}

export const ChartOfAccountsHeader: React.FC<ChartOfAccountsHeaderProps> = ({
  onImport,
  onExport,
  onNewAccount
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-indigo-600" />
          دليل الحسابات
        </h1>
        <p className="text-slate-500 mt-1">إدارة الهيكل المالي (Chart of Accounts)</p>
      </div>
      <div className="flex gap-2">
        <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={onImport} />
        <button 
          onClick={() => window.print()}
          className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold hover:bg-slate-50 transition-colors shadow-sm"
        >
          <FileText className="w-4 h-4" /> طباعة
        </button>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Upload className="w-4 h-4" /> استيراد
        </button>
        <button 
          onClick={onExport}
          className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" /> تصدير
        </button>
        <button 
          onClick={onNewAccount}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          <span>حساب جديد</span>
        </button>
      </div>
    </div>
  );
};
