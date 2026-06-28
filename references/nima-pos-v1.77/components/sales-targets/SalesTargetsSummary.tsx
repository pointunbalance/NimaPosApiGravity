import React from 'react';
import { Target, DollarSign, BarChart2, Calendar } from 'lucide-react';

interface SalesTargetsSummaryProps {
  totalTarget: number;
  totalAchieved: number;
  totalRemaining: number;
  percentage: number;
  daysRemaining?: number;
  formatCurrency: (amount: number) => string;
}

const SalesTargetsSummary: React.FC<SalesTargetsSummaryProps> = ({
  totalTarget,
  totalAchieved,
  totalRemaining,
  percentage,
  daysRemaining,
  formatCurrency
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-500 font-bold text-sm">الهدف الإجمالي</h3>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Target size={20} />
          </div>
        </div>
        <p className="text-3xl font-black text-slate-800 tracking-tight">{formatCurrency(totalTarget)}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
        <div className="flex items-center justify-between mb-4 relative z-10">
          <h3 className="text-slate-500 font-bold text-sm">المحقق</h3>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl relative z-10">
            <DollarSign size={20} />
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-3xl font-black text-slate-800 tracking-tight">{formatCurrency(totalAchieved)}</p>
          <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5 flex overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${percentage >= 100 ? 'bg-emerald-500' : percentage >= 70 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, percentage)}%` }}></div>
          </div>
          <p className="text-xs font-bold text-slate-500 mt-2">{percentage.toFixed(1)}% من الهدف</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-500 font-bold text-sm">المتبقي</h3>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <BarChart2 size={20} />
          </div>
        </div>
        <p className="text-3xl font-black text-slate-800 tracking-tight">{formatCurrency(totalRemaining)}</p>
        <p className="text-xs font-bold text-slate-500 mt-2">للوصول للهدف</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-500 font-bold text-sm">أيام متبقية</h3>
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
            <Calendar size={20} />
          </div>
        </div>
        <p className="text-3xl font-black text-slate-800 tracking-tight">{daysRemaining !== undefined ? daysRemaining : '-'}</p>
        <p className="text-xs font-bold text-slate-500 mt-2">لنهاية الفترة</p>
      </div>
    </div>
  );
};

export default SalesTargetsSummary;
