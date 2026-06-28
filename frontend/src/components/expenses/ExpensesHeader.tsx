import React from 'react';
import { DollarSign, Plus, Download, Zap } from 'lucide-react';

interface ExpensesHeaderProps {
  handleExportCSV: () => void;
  openModal: () => void;
  handleQuickAdd: (template: { title: string; category: string; amount: number }) => void;
}

const ExpensesHeader: React.FC<ExpensesHeaderProps> = ({ handleExportCSV, openModal, handleQuickAdd }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 font-['Tajawal']">
      <div>
        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
          <DollarSign className="w-8 h-8 text-indigo-600 stroke-[2]" />
          إدارة المصروفات
        </h1>
        <p className="text-slate-500 font-bold text-sm mt-0.5">تتبع وتحليل النفقات التشغيلية</p>
      </div>
      
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="relative group">
          <button className="bg-amber-50 hover:bg-amber-100 text-amber-600 hover:text-amber-700 border border-amber-200/80 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer active:scale-95">
            <Zap className="w-5 h-5 text-amber-500 stroke-[2]" />
            إضافة سريعة
          </button>
          <div className="absolute top-full right-0 mt-2 w-48 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-indigo-100/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
            <button onClick={() => handleQuickAdd({title: 'ضيافة', category: 'other', amount: 50})} className="w-full text-right px-4 py-3 hover:bg-slate-50 border-b border-slate-50 text-sm font-bold text-slate-700 cursor-pointer">ضيافة (50 ج.م)</button>
            <button onClick={() => handleQuickAdd({title: 'مواصلات', category: 'other', amount: 100})} className="w-full text-right px-4 py-3 hover:bg-slate-50 border-b border-slate-50 text-sm font-bold text-slate-700 cursor-pointer">مواصلات (100 ج.م)</button>
            <button onClick={() => handleQuickAdd({title: 'بنزين', category: 'other', amount: 200})} className="w-full text-right px-4 py-3 hover:bg-slate-50 text-sm font-bold text-slate-700 cursor-pointer">بنزين (200 ج.م)</button>
          </div>
        </div>

        <button 
          onClick={handleExportCSV}
          className="bg-sky-50 hover:bg-sky-100 text-sky-600 hover:text-sky-700 border border-sky-200/80 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer active:scale-95"
        >
          <Download className="w-5 h-5 stroke-[2]" />
          تصدير
        </button>
        <button 
          onClick={() => openModal()}
          className="bg-gradient-to-br from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-750 text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2 shadow-md shadow-indigo-500/20 transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          مصروف جديد
        </button>
      </div>
    </div>
  );
};

export default ExpensesHeader;
