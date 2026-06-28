import React from 'react';
import { Banknote, FileText, Calculator, RotateCcw } from 'lucide-react';

interface OrdersStatsProps {
  totalRevenue: number;
  count: number;
  avgOrder: number;
  totalRefunded: number;
  formatCurrency: (amount: number) => string;
}

const OrdersStats: React.FC<OrdersStatsProps> = ({
  totalRevenue,
  count,
  avgOrder,
  totalRefunded,
  formatCurrency
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-center gap-4">
        <div className="p-3 bg-white rounded-xl text-indigo-600 shadow-sm"><Banknote className="w-6 h-6" /></div>
        <div>
          <p className="text-xs text-indigo-400 font-bold uppercase">صافي الإيراد</p>
          <p className="text-xl font-black text-indigo-900">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center gap-4">
        <div className="p-3 bg-white rounded-xl text-slate-600 shadow-sm"><FileText className="w-6 h-6" /></div>
        <div>
          <p className="text-xs text-slate-400 font-bold uppercase">عدد الفواتير</p>
          <p className="text-xl font-black text-slate-800">{count}</p>
        </div>
      </div>
      <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center gap-4">
        <div className="p-3 bg-white rounded-xl text-emerald-600 shadow-sm"><Calculator className="w-6 h-6" /></div>
        <div>
          <p className="text-xs text-emerald-500 font-bold uppercase">متوسط السلة</p>
          <p className="text-xl font-black text-emerald-800">{formatCurrency(avgOrder)}</p>
        </div>
      </div>
      <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center gap-4">
        <div className="p-3 bg-white rounded-xl text-red-600 shadow-sm"><RotateCcw className="w-6 h-6" /></div>
        <div>
          <p className="text-xs text-red-400 font-bold uppercase">المرتجع</p>
          <p className="text-xl font-black text-red-800">{formatCurrency(totalRefunded)}</p>
        </div>
      </div>
    </div>
  );
};

export default OrdersStats;
