import React from 'react';
import { DollarSign, Layers, CheckCircle, AlertTriangle } from 'lucide-react';

interface StoreMetricsProps {
  statsCore: {
    activeProductsCount: number;
    lowStockCount: number;
    totalSalesRevenue: number;
    totalItemsSold: number;
  };
  totalSalesCount: number;
  currency: string;
}

export const StoreMetrics: React.FC<StoreMetricsProps> = ({ statsCore, totalSalesCount, currency }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 text-right font-sans" dir="rtl">
      
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all flex-row-reverse text-right">
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
          <DollarSign className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] font-black text-slate-400">إجمالي عوائد مبيعات المتجر</p>
          <div className="flex items-baseline gap-1 justify-end">
            <span className="text-xl font-black text-emerald-600 font-mono">
              {statsCore.totalSalesRevenue.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-500 font-bold">{currency}</span>
          </div>
          <p className="text-[9px] text-slate-400 font-medium">مرحلة ومعتمدة محاسبياً بالكامل</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all flex-row-reverse text-right">
        <div className="p-3 bg-slate-50 text-slate-500 rounded-xl">
          <Layers className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] font-black text-slate-400">عدد الأصناف المتوفرة</p>
          <div className="flex items-baseline gap-1 justify-end">
            <span className="text-xl font-black text-slate-800 font-mono">{statsCore.activeProductsCount}</span>
            <span className="text-[10px] text-slate-400 font-bold">صنف</span>
          </div>
          <p className="text-[9px] text-slate-400 font-medium">بمستودعات الفرع والمعسكر الرياضي</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all flex-row-reverse text-right">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <CheckCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] font-black text-indigo-600">إجمالي الفواتير الصادرة</p>
          <div className="flex items-baseline gap-1 justify-end">
            <span className="text-xl font-black text-indigo-600 font-mono">{totalSalesCount}</span>
            <span className="text-[10px] text-indigo-400 font-bold">سند بيع</span>
          </div>
          <p className="text-[9px] text-indigo-400 font-bold">خلال العمليات الراهنة لليومية</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all flex-row-reverse text-right">
        <div className="p-3 bg-rose-50 text-rose-500 rounded-xl">
          <AlertTriangle className="w-5 h-5 animate-pulse" />
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] font-black text-rose-505">أصناف قاربت على النفاد</p>
          <div className="flex items-baseline gap-1 justify-end">
            <span className="text-xl font-black text-rose-600 font-mono">{statsCore.lowStockCount}</span>
            <span className="text-[10px] text-rose-505 font-bold">صنف حرج</span>
          </div>
          <p className="text-[9px] text-rose-400 font-bold">تحتاج طلب شراء وتوريد فوري</p>
        </div>
      </div>

    </div>
  );
};
export default StoreMetrics;
