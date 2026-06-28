import React from 'react';
import { Banknote, Plus, Download, Printer } from 'lucide-react';

interface CheckManagementHeaderProps {
  onExport: () => void;
  onOpenModal: () => void;
  onPrint?: () => void;
}

const CheckManagementHeader: React.FC<CheckManagementHeaderProps> = ({ onExport, onOpenModal, onPrint }) => {
  return (
    <div className="flex justify-between items-center mb-8 print:hidden">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Banknote className="w-8 h-8 text-indigo-600" />
          إدارة الشيكات
        </h1>
        <p className="text-slate-500 mt-1">متابعة أوراق القبض والدفع والسيولة البنكية</p>
      </div>
      <div className="flex gap-2">
        {onPrint && (
          <button onClick={onPrint} className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-colors">
            <Printer className="w-4 h-4"/> طباعة
          </button>
        )}
        <button onClick={onExport} className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-colors">
          <Download className="w-4 h-4"/> تصدير
        </button>
        <button onClick={onOpenModal} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5">
          <Plus className="w-5 h-5" />
          <span>تسجيل شيك</span>
        </button>
      </div>
    </div>
  );
};

export default CheckManagementHeader;
