import React from 'react';
import { DollarSign, FileText, TrendingUp, TrendingDown } from 'lucide-react';

interface SchoolExpensesStatsProps {
  stats: {
    total: number;
    count: number;
    average: number;
    cashTotal: number;
    cardTotal: number;
  };
  chartData: { name: string; value: number }[];
  formatCurrency: (amount: number) => string;
}

const SchoolExpensesStats: React.FC<SchoolExpensesStatsProps> = ({ stats, chartData, formatCurrency }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-50 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
        <div className="relative flex justify-between items-start">
          <div>
            <p className="text-slate-500 text-sm font-bold mb-1">إجمالي المصروفات</p>
            <h3 className="text-3xl font-extrabold text-slate-800">{formatCurrency(stats.total)}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className="text-emerald-600 flex items-center gap-1 font-bold bg-emerald-50 px-2 py-1 rounded-lg">
            <TrendingDown className="w-4 h-4" />
            12%
          </span>
          <span className="text-slate-400">مقارنة بالشهر السابق</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
        <div className="relative flex justify-between items-start">
          <div>
            <p className="text-slate-500 text-sm font-bold mb-1">عدد العمليات</p>
            <h3 className="text-3xl font-extrabold text-slate-800">{stats.count}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
            <FileText className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className="text-slate-500">متوسط العملية: <span className="font-bold text-slate-700">{formatCurrency(stats.average)}</span></span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-50 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
        <div className="relative flex justify-between items-start">
          <div>
            <p className="text-slate-500 text-sm font-bold mb-1">نقدي</p>
            <h3 className="text-3xl font-extrabold text-slate-800">{formatCurrency(stats.cashTotal)}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm">
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${stats.total > 0 ? (stats.cashTotal / stats.total) * 100 : 0}%` }}></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
        <div className="relative flex justify-between items-start">
          <div>
            <p className="text-slate-500 text-sm font-bold mb-1">بطاقة / تحويل</p>
            <h3 className="text-3xl font-extrabold text-slate-800">{formatCurrency(stats.cardTotal)}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
            <FileText className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm">
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${stats.total > 0 ? (stats.cardTotal / stats.total) * 100 : 0}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolExpensesStats;
