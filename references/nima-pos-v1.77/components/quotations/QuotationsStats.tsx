import React from 'react';
import { TrendingUp } from 'lucide-react';

interface QuotationsStatsProps {
  stats: {
    total: number;
    pendingValue: number;
    conversionRate: number;
  };
  formatCurrency: (amount: number) => string;
}

const QuotationsStats: React.FC<QuotationsStatsProps> = ({ stats, formatCurrency }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">إجمالي العروض المعلقة</p>
        <h3 className="text-2xl font-black text-indigo-600">{formatCurrency(stats.pendingValue)}</h3>
      </div>
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">نسبة التحويل (Conversion)</p>
        <div className="flex items-center gap-2">
          <h3 className="text-2xl font-black text-emerald-600">{stats.conversionRate}%</h3>
          <TrendingUp className="w-5 h-5 text-emerald-500" />
        </div>
      </div>
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">عدد العروض الكلي</p>
        <h3 className="text-2xl font-black text-slate-800">{stats.total}</h3>
      </div>
    </div>
  );
};

export default QuotationsStats;
