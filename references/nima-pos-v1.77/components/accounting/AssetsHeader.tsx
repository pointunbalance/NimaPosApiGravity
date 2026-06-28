import React from 'react';
import { Calculator, Plus, Printer, Download, PlayCircle } from 'lucide-react';

interface AssetsHeaderProps {
  onOpenModal: () => void;
  onPrint: () => void;
  onExport: () => void;
  onRunDepreciation: () => void;
}

const AssetsHeader: React.FC<AssetsHeaderProps> = ({ onOpenModal, onPrint, onExport, onRunDepreciation }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
          <Calculator className="w-8 h-8 text-indigo-600" />
          الأصول الثابتة والإهلاك
        </h1>
        <p className="text-slate-500 mt-1">تتبع قيمة الأصول، حساب الإهلاك، والقيمة الدفترية</p>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <button 
          onClick={onRunDepreciation}
          className="bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all"
          title="ترحيل إهلاك الشهر الحالي لجميع الأصول"
        >
          <PlayCircle className="w-5 h-5" /> تشغيل الإهلاك
        </button>
        <button 
          onClick={onPrint}
          className="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all"
        >
          <Printer className="w-5 h-5" /> طباعة
        </button>
        <button 
          onClick={onExport}
          className="bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all"
        >
          <Download className="w-5 h-5" /> تصدير CSV
        </button>
        <button 
          onClick={onOpenModal} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" /> أصل جديد
        </button>
      </div>
    </div>
  );
};

export default AssetsHeader;
