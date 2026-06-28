import React from 'react';
import { Building2, Plus, Filter } from 'lucide-react';

interface B2BSalesHeaderProps {
  activeTab: 'orders' | 'customers' | 'quotations';
  onNewClick: () => void;
}

const B2BSalesHeader: React.FC<B2BSalesHeaderProps> = ({ activeTab, onNewClick }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 font-['Tajawal']">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-sm">
          <Building2 className="w-8 h-8 stroke-[2]" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">مبيعات الجملة (B2B)</h1>
          <p className="text-slate-500 font-bold text-sm mt-1">إدارة صفقات وعقود الشركات وعملاء الجملة وعروض الأسعار المعتمدة</p>
        </div>
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <button 
          onClick={onNewClick}
          className="w-full sm:w-auto bg-gradient-to-br from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-750 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 font-black transition-all cursor-pointer active:scale-95 text-sm"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>{activeTab === 'orders' ? 'فاتورة جديدة' : activeTab === 'quotations' ? 'عرض سعر جديد' : 'عميل جديد'}</span>
        </button>
      </div>
    </div>
  );
};

export default B2BSalesHeader;
