import React from 'react';
import { Printer, Download } from 'lucide-react';

interface OrdersHeaderProps {
  onPrintReport: () => void;
  onExportCSV: () => void;
}

const OrdersHeader: React.FC<OrdersHeaderProps> = ({ onPrintReport, onExportCSV }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 mb-2">سجل المبيعات</h1>
        <p className="text-slate-500 text-sm">استعراض أرشيف الفواتير وإدارة المرتجعات</p>
      </div>
      <div className="flex gap-3">
        <button 
          onClick={onPrintReport} 
          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 border border-emerald-200/80 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm font-bold text-sm cursor-pointer active:scale-95"
        >
          <Printer className="w-4 h-4 stroke-[2]" />
          <span>طباعة التقرير</span>
        </button>
        <button 
          onClick={onExportCSV} 
          className="bg-sky-50 hover:bg-sky-100 text-sky-600 hover:text-sky-700 border border-sky-200/80 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm font-bold text-sm cursor-pointer active:scale-95"
        >
          <Download className="w-4 h-4 stroke-[2]" />
          <span>تصدير Excel</span>
        </button>
      </div>
    </div>
  );
};

export default OrdersHeader;
