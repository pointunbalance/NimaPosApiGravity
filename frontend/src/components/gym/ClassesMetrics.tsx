import React from 'react';
import { Layers, Users, UserCheck, Coins, TrendingUp } from 'lucide-react';

interface MetricsProps {
  metrics: {
    totalClasses: number;
    activeClasses: number;
    totalEnrolled: number;
    occupancyRate: number;
    totalCap: number;
    totalPaidRevenues: number;
  };
  currency: string;
}

export const ClassesMetrics: React.FC<MetricsProps> = ({ metrics, currency }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Classes */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-150 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-slate-400">إجمالي الحصص الجماعية</p>
          <div className="flex items-baseline gap-1.5 flex-row-reverse justify-end">
            <span className="text-[10px] text-slate-500">حصة مسجلة</span>
            <span className="text-2xl font-black text-slate-800 font-mono">{metrics.totalClasses}</span>
          </div>
          <p className="text-[10px] text-slate-400 flex items-center gap-1 justify-start">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
            <span>{metrics.activeClasses} حصة نشطة حالياً</span>
          </p>
        </div>
        <div className="p-3 bg-slate-50 border border-slate-100 text-slate-600 rounded-xl">
          <Layers className="w-5 h-5" />
        </div>
      </div>

      {/* Enrolled Members */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-150 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-slate-400">إجمالي الأعضاء المشاركين</p>
          <div className="flex items-baseline gap-1.5 flex-row-reverse justify-end">
            <span className="text-[10px] text-slate-505">مسجل بالحصص</span>
            <span className="text-2xl font-black text-indigo-650 font-mono">{metrics.totalEnrolled}</span>
          </div>
          <div className="w-24 bg-slate-100 h-1 rounded-full overflow-hidden mt-1">
            <div className="bg-indigo-600 h-1" style={{ width: `${Math.min(100, metrics.occupancyRate)}%` }}></div>
          </div>
        </div>
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <Users className="w-5 h-5" />
        </div>
      </div>

      {/* Occupancy Rate */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-150 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-slate-400">معدل الإشغال الاستيعابي</p>
          <div className="flex items-baseline gap-1.5 flex-row-reverse justify-end">
            <span className="text-[10px] text-slate-550">نسبة الامتلاء</span>
            <span className="text-2xl font-black text-emerald-650 font-mono">{metrics.occupancyRate}%</span>
          </div>
          <p className="text-[10px] text-slate-400">من السعة الكلية القصوى ({metrics.totalCap} فرد)</p>
        </div>
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
          <UserCheck className="w-5 h-5" />
        </div>
      </div>

      {/* Revenues */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-150 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-slate-400">إيرادات حجز الحصص الخاصة</p>
          <div className="flex items-baseline gap-1 flex-row-reverse justify-end">
            <span className="text-xs text-slate-555 mr-1">{currency}</span>
            <span className="text-2xl font-black text-amber-600 font-mono">{metrics.totalPaidRevenues.toLocaleString()}</span>
          </div>
          <p className="text-[10px] text-amber-650 font-bold flex items-center gap-1 justify-start">
            <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
            <span>مرحّلة بدفتر القيود اليومية</span>
          </p>
        </div>
        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
          <Coins className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
