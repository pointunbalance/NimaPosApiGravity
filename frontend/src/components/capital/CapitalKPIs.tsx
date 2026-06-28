import React from 'react';
import { Activity, TrendingUp, TrendingDown, Percent, Briefcase, AlertCircle } from 'lucide-react';

interface FinancialData {
  initial: number;
  warehouseAssets: Record<number, number>;
  totalInventoryValue: number;
  estimatedCash: number;
  totalLiabilities: number;
  suppliersDebt: any[];
  customersDebt: number;
  totalFixedAssets: number;
  currentAssets: number;
  totalAssets: number;
  netWorth: number;
  workingCapital: number;
  netProfit: number;
  roi: number;
}

interface CapitalKPIsProps {
  financialData: FinancialData;
  formatCurrency: (amount: number) => string;
}

const CapitalKPIs: React.FC<CapitalKPIsProps> = ({ financialData, formatCurrency }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Net Worth */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">صافي حقوق الملكية</p>
              <h3 className="text-3xl font-extrabold">{formatCurrency(financialData.netWorth)}</h3>
            </div>
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
              <Activity className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs bg-white/10 w-fit px-3 py-1.5 rounded-lg backdrop-blur-sm">
            <span className={`${financialData.netWorth >= financialData.initial ? 'text-emerald-300' : 'text-red-300'} font-bold flex items-center`}>
              {financialData.netWorth >= financialData.initial ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {financialData.initial > 0 
                ? `${Math.abs(((financialData.netWorth - financialData.initial) / financialData.initial) * 100).toFixed(1)}%` 
                : '0%'}
            </span>
            <span className="text-indigo-200">نمو رأس المال</span>
          </div>
        </div>
      </div>

      {/* ROI Card */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 group hover:border-violet-200 transition-colors">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">العائد على الاستثمار (ROI)</p>
            <h3 className={`text-2xl font-extrabold ${financialData.roi >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {financialData.roi.toFixed(1)}%
            </h3>
          </div>
          <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl group-hover:scale-110 transition-transform">
            <Percent className="w-6 h-6" />
          </div>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          نسبة الربح الصافي مقارنة برأس المال التأسيسي
        </p>
      </div>

      {/* Total Assets */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 group hover:border-blue-200 transition-colors">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">إجمالي الأصول</p>
            <h3 className="text-2xl font-extrabold text-blue-700">{formatCurrency(financialData.totalAssets)}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>
        <div className="flex gap-1 h-1.5 w-full rounded-full overflow-hidden bg-slate-100">
          <div className="bg-emerald-500 h-full" style={{ width: `${(Math.max(0, financialData.estimatedCash) / financialData.totalAssets) * 100}%` }} title="نقد"></div>
          <div className="bg-indigo-500 h-full" style={{ width: `${(financialData.totalInventoryValue / financialData.totalAssets) * 100}%` }} title="مخزون"></div>
          <div className="bg-amber-500 h-full" style={{ width: `${(financialData.customersDebt / financialData.totalAssets) * 100}%` }} title="ديون"></div>
          <div className="bg-violet-500 h-full" style={{ width: `${(financialData.totalFixedAssets / financialData.totalAssets) * 100}%` }} title="أصول"></div>
        </div>
      </div>

      {/* Liabilities */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 group hover:border-red-200 transition-colors">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">الخصوم (الالتزامات)</p>
            <h3 className="text-2xl font-extrabold text-red-600">{formatCurrency(financialData.totalLiabilities)}</h3>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-2xl group-hover:scale-110 transition-transform">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-2">مستحقات للموردين</p>
      </div>
    </div>
  );
};

export default CapitalKPIs;
