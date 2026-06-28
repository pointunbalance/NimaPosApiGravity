import React from 'react';
import { ShoppingBag, Download, Plus } from 'lucide-react';

interface EcommerceOrdersHeaderProps {
  onNewClick: () => void;
}

const EcommerceOrdersHeader: React.FC<EcommerceOrdersHeaderProps> = ({ onNewClick }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
          <ShoppingBag size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">طلبات التجارة الإلكترونية</h1>
          <p className="text-slate-500 text-sm mt-1">إدارة المبيعات عبر الإنترنت من جميع المنصات</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-sm font-medium transition-colors">
          <Download className="w-4 h-4" />
          تصدير
        </button>
        <button 
          onClick={onNewClick}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          إضافة طلب
        </button>
      </div>
    </div>
  );
};

export default EcommerceOrdersHeader;
