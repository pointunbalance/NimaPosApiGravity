import React from 'react';
import { Target, Plus, Printer, Download } from 'lucide-react';

interface BudgetingHeaderProps {
  onOpenModal: () => void;
  onPrint?: () => void;
  onExport?: () => void;
}

const BudgetingHeader: React.FC<BudgetingHeaderProps> = ({ onOpenModal, onPrint, onExport }) => {
  return (
    <div className="flex justify-between items-center mb-8 print:hidden">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
          <Target className="w-8 h-8 text-indigo-600" />
          الموازنات التقديرية
        </h1>
        <p className="text-slate-500 mt-1">تخطيط ومراقبة الميزانيات والانحرافات</p>
      </div>
      <div className="flex gap-2">
        {onExport && (
          <button 
            onClick={onExport}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            تصدير
          </button>
        )}
        {onPrint && (
          <button 
            onClick={onPrint}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            طباعة
          </button>
        )}
        <button 
            onClick={onOpenModal}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus className="w-5 h-5" />
          إنشاء موازنة جديدة
        </button>
      </div>
    </div>
  );
};

export default BudgetingHeader;
