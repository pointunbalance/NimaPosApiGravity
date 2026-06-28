import React from 'react';
import { Wallet, Plus, Printer, Download } from 'lucide-react';

interface PettyCashHeaderProps {
  onOpenCreateModal: () => void;
  onPrint?: () => void;
  onExport?: () => void;
}

const PettyCashHeader: React.FC<PettyCashHeaderProps> = ({ onOpenCreateModal, onPrint, onExport }) => {
  return (
    <div className="flex justify-between items-center mb-8 print:hidden">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
          <Wallet className="w-8 h-8 text-indigo-600" />
          إدارة العهد النقدية
        </h1>
        <p className="text-slate-500 mt-1">متابعة وتسوية العهد المصروفة للموظفين</p>
      </div>
      <div className="flex gap-3">
        {onPrint && (
          <button 
            onClick={onPrint}
            className="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all"
          >
            <Printer className="w-5 h-5" /> طباعة
          </button>
        )}
        {onExport && (
          <button 
            onClick={onExport}
            className="bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all"
          >
            <Download className="w-5 h-5" /> تصدير
          </button>
        )}
        <button 
          onClick={onOpenCreateModal}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus className="w-5 h-5" />
          صرف عهدة جديدة
        </button>
      </div>
    </div>
  );
};

export default PettyCashHeader;
