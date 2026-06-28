import React from 'react';
import { TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

interface StudioStatsProps {
  monthStats: {
    revenue: number;
    count: number;
    remaining: number;
    completed: number;
  };
  formatCurrency: (amount: number) => string;
}

const StudioStats: React.FC<StudioStatsProps> = ({ monthStats, formatCurrency }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-indigo-100 text-xs font-bold uppercase mb-1">إيرادات الشهر المتوقعة</p>
          <h3 className="text-3xl font-black">{formatCurrency(monthStats.revenue)}</h3>
        </div>
        <TrendingUp className="absolute right-4 bottom-4 w-12 h-12 text-white opacity-20" />
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
        <div>
          <p className="text-slate-400 text-xs font-bold uppercase mb-1">عدد الجلسات (شهر)</p>
          <h3 className="text-3xl font-black text-slate-800">{monthStats.count}</h3>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${monthStats.count > 0 ? (monthStats.completed / monthStats.count) * 100 : 0}%` }}></div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <p className="text-slate-400 text-xs font-bold uppercase mb-1">المستحقات المتبقية</p>
        <h3 className="text-3xl font-black text-red-600">{formatCurrency(monthStats.remaining)}</h3>
        <div className="flex items-center gap-1 mt-2 text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded w-fit">
          <AlertCircle className="w-3 h-3" />
          ديون غير محصلة
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <p className="text-slate-400 text-xs font-bold uppercase mb-1">الجلسات المكتملة</p>
        <h3 className="text-3xl font-black text-emerald-600">{monthStats.completed}</h3>
        <div className="flex items-center gap-1 mt-2 text-xs text-emerald-500 font-bold bg-emerald-50 px-2 py-1 rounded w-fit">
          <CheckCircle2 className="w-3 h-3" />
          تم التسليم
        </div>
      </div>
    </div>
  );
};

export default StudioStats;
