import React from 'react';
import { FileText, Plus } from 'lucide-react';

interface QuotationsHeaderProps {
  onOpenModal: () => void;
}

const QuotationsHeader: React.FC<QuotationsHeaderProps> = ({ onOpenModal }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 font-['Tajawal']">
      <div>
        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
          <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
            <FileText className="w-8 h-8 stroke-[2]" />
          </div>
          عروض الأسعار
        </h1>
        <p className="text-slate-500 font-bold text-sm mt-0.5">إدارة العروض التقديرية (Quotations) ومتابعة العملاء</p>
      </div>
      <button 
        onClick={onOpenModal}
        className="bg-gradient-to-br from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-750 text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-md shadow-indigo-500/20 font-black transition-all active:scale-95 cursor-pointer"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        <span>إنشاء عرض جديد</span>
      </button>
    </div>
  );
};

export default QuotationsHeader;
