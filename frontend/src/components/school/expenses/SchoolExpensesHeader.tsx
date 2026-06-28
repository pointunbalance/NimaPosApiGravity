import React from 'react';
import { DollarSign, Plus, Download, Zap } from 'lucide-react';

interface SchoolExpensesHeaderProps {
  handleExportCSV: () => void;
  openModal: () => void;
  handleQuickAdd: (template: { title: string; category: string; amount: number }) => void;
}

const SchoolExpensesHeader: React.FC<SchoolExpensesHeaderProps> = ({ handleExportCSV, openModal, handleQuickAdd }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-indigo-600" />
          إدارة المصروفات
        </h1>
        <p className="text-slate-500 mt-1">تتبع وتحليل النفقات التشغيلية</p>
      </div>
      
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="relative group">
          <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
            <Zap className="w-5 h-5 text-amber-500" />
            إضافة سريعة
          </button>
          <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
            <button onClick={() => handleQuickAdd({title: 'ضيافة', category: 'other', amount: 50})} className="w-full text-right px-4 py-3 hover:bg-slate-50 border-b border-slate-50 text-sm font-bold text-slate-700">ضيافة (50 ج.م)</button>
            <button onClick={() => handleQuickAdd({title: 'مواصلات', category: 'other', amount: 100})} className="w-full text-right px-4 py-3 hover:bg-slate-50 border-b border-slate-50 text-sm font-bold text-slate-700">مواصلات (100 ج.م)</button>
            <button onClick={() => handleQuickAdd({title: 'بنزين', category: 'other', amount: 200})} className="w-full text-right px-4 py-3 hover:bg-slate-50 text-sm font-bold text-slate-700">بنزين (200 ج.م)</button>
          </div>
        </div>

        <button 
          onClick={handleExportCSV}
          className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
        >
          <Download className="w-5 h-5" />
          تصدير
        </button>
        <button 
          onClick={() => openModal()}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus className="w-5 h-5" />
          مصروف جديد
        </button>
      </div>
    </div>
  );
};

export default SchoolExpensesHeader;
