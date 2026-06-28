import React from 'react';
import { 
  Users2, 
  UserCheck, 
  Star, 
  Coins 
} from 'lucide-react';

interface TrainersMetricsProps {
  statsMetrics: {
    totalTrainers: number;
    availableCount: number;
    onLeaveCount: number;
    baseSalariesSum: number;
    avgRating: number;
  };
  currency: string;
}

export const TrainersMetrics: React.FC<TrainersMetricsProps> = ({ statsMetrics, currency }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-right" dir="rtl">
      
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-slate-400">إجمالي المدربين المقيدين</p>
          <div className="flex items-baseline gap-1.5 justify-end">
            <span className="text-2xl font-black text-slate-800 font-mono">{statsMetrics.totalTrainers}</span>
            <span className="text-[10px] text-slate-500">مدرب معتمد</span>
          </div>
          <p className="text-[10px] text-indigo-650 font-black">جاهزية كاملية</p>
        </div>
        <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
          <Users2 className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-slate-400">المدربين النشطين (متاح)</p>
          <div className="flex items-baseline gap-1.5 justify-end">
            <span className="text-2xl font-black text-emerald-600 font-mono">{statsMetrics.availableCount}</span>
            <span className="text-[10px] text-slate-500">فرد يدرّب الآن</span>
          </div>
          <p className="text-[10px] text-slate-400">متواجدون داخل الصالات</p>
        </div>
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
          <UserCheck className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-slate-400 font-sans">المعدل العام لتقييم الكباتن</p>
          <div className="flex items-baseline gap-1.5 justify-end">
            <span className="text-2xl font-black text-amber-600 font-mono">{statsMetrics.avgRating}</span>
            <span className="text-[10px] text-slate-500">⭐️ من أصل 5.0</span>
          </div>
          <div className="flex items-center gap-0.5 text-amber-400 justify-end">
            <Star className="w-3 h-3 fill-current" />
            <Star className="w-3 h-3 fill-current" />
            <Star className="w-3 h-3 fill-current" />
            <Star className="w-3 h-3 fill-current" />
            <Star className="w-3 h-3 fill-current" />
          </div>
        </div>
        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
          <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
        </div>
      </div>

      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-slate-400 font-sans">العبء المالي للرواتب الأساسية</p>
          <div className="flex items-baseline gap-1 justify-end">
            <span className="text-2xl font-black text-rose-600 font-mono">{statsMetrics.baseSalariesSum.toLocaleString()}</span>
            <span className="text-xs text-slate-500">{currency}</span>
          </div>
          <p className="text-[10px] text-slate-400">مستحقة دورياً في نهاية الشهر</p>
        </div>
        <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
          <Coins className="w-5 h-5" />
        </div>
      </div>

    </div>
  );
};
