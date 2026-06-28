import React from 'react';
import { Users, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';

interface PayrollStatsProps {
  stats: {
    totalEstimated: number;
    totalPaid: number;
    countPaid: number;
    totalCount: number;
  };
  formatCurrency: (amount: number) => string;
}

const PayrollStats: React.FC<PayrollStatsProps> = ({ stats, formatCurrency }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 print:hidden">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-indigo-200 transition-colors">
          <div className="flex justify-between items-start">
              <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">إجمالي الموظفين</p>
                  <h3 className="text-2xl font-black text-slate-800">{stats.totalCount}</h3>
              </div>
              <div className="p-2 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors"><Users className="w-5 h-5"/></div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000" style={{width: `${stats.totalCount > 0 ? (stats.countPaid / stats.totalCount) * 100 : 0}%`}}></div>
          </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-emerald-200 transition-colors">
          <div className="flex justify-between items-start">
              <div>
                  <p className="text-xs font-bold text-emerald-600 uppercase mb-1">تم صرفه (مدفوع)</p>
                  <h3 className="text-2xl font-black text-emerald-700">{formatCurrency(stats.totalPaid)}</h3>
              </div>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 className="w-5 h-5"/></div>
          </div>
          <p className="text-xs text-emerald-600 mt-2 font-bold">{stats.countPaid} موظف تم الدفع لهم</p>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-orange-200 transition-colors">
          <div className="flex justify-between items-start">
              <div>
                  <p className="text-xs font-bold text-orange-600 uppercase mb-1">المتبقي (تقديري)</p>
                  <h3 className="text-2xl font-black text-orange-700">{formatCurrency(stats.totalEstimated - stats.totalPaid)}</h3>
              </div>
              <div className="p-2 bg-orange-50 text-orange-600 rounded-xl"><AlertCircle className="w-5 h-5"/></div>
          </div>
          <p className="text-xs text-orange-600 mt-2 font-bold">{stats.totalCount - stats.countPaid} موظف متبقي</p>
      </div>

      <div className="bg-slate-800 p-5 rounded-2xl shadow-lg text-white flex flex-col justify-between">
          <div className="flex justify-between items-start">
              <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">إجمالي المسير</p>
                  <h3 className="text-2xl font-black text-white">{formatCurrency(stats.totalEstimated)}</h3>
              </div>
              <div className="p-2 bg-white/10 rounded-xl"><TrendingUp className="w-5 h-5"/></div>
          </div>
          <p className="text-xs text-slate-400 mt-2">شامل الغياب والخصومات</p>
      </div>
    </div>
  );
};

export default PayrollStats;
