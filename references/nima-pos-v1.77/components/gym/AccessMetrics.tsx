import React from 'react';
import { 
  UserCheck, 
  Activity, 
  UserMinus, 
  Monitor 
} from 'lucide-react';

interface AccessMetricsProps {
  statsCore: {
    totalEntriesToday: number;
    totalExitsToday: number;
    activeNowInGym: number;
  };
}

export const AccessMetrics: React.FC<AccessMetricsProps> = ({ statsCore }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-right font-sans" dir="rtl">
      
      <div className="bg-white p-6 rounded-2xl border-l border-t border-b border-slate-100 border-r-4 border-emerald-500 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 flex items-center justify-between">
        <div className="space-y-1.5 text-right">
          <p className="text-xs font-bold text-slate-400">حركات الدخول المصدقة اليوم</p>
          <p className="text-3xl font-black text-emerald-600 tracking-tight font-mono">{statsCore.totalEntriesToday}</p>
          <p className="text-[10px] text-slate-500 font-extrabold flex items-center gap-1 justify-end flex-row-reverse">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
            <span>بوابات الصالة الرئيسية</span>
          </p>
        </div>
        <div className="p-3.5 bg-emerald-50/80 text-emerald-600 rounded-2xl shadow-inner shrink-0">
          <UserCheck className="w-6 h-6" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border-l border-t border-b border-slate-100 border-r-4 border-indigo-500 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 flex items-center justify-between">
        <div className="space-y-1.5 text-right">
          <p className="text-xs font-bold text-slate-400">الأعضاء واللاعبين بالداخل</p>
          <p className="text-3xl font-black text-indigo-600 tracking-tight font-mono">{statsCore.activeNowInGym}</p>
          <p className="text-[10px] text-slate-500 font-extrabold flex items-center gap-1 justify-end flex-row-reverse">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full inline-block"></span>
            <span>بناءً على تتبع الحضور والمغادرة</span>
          </p>
        </div>
        <div className="p-3.5 bg-indigo-50/80 text-indigo-600 rounded-2xl shadow-inner shrink-0">
          <Activity className="w-6 h-6 animate-pulse" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border-l border-t border-b border-slate-100 border-r-4 border-amber-500 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 flex items-center justify-between">
        <div className="space-y-1.5 text-right">
          <p className="text-xs font-bold text-slate-400">مسجلات تسجيل الخروج اليوم</p>
          <p className="text-3xl font-black text-amber-655 tracking-tight font-mono">{statsCore.totalExitsToday}</p>
          <p className="text-[10px] text-slate-500 font-extrabold flex items-center gap-1 justify-end flex-row-reverse">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full inline-block"></span>
            <span>تسجيل عبور خارجي للردهات</span>
          </p>
        </div>
        <div className="p-3.5 bg-amber-50/80 text-amber-600 rounded-2xl shadow-inner shrink-0">
          <UserMinus className="w-6 h-6" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border-l border-t border-b border-slate-100 border-r-4 border-cyan-500 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 flex items-center justify-between">
        <div className="space-y-1.5 text-right">
          <p className="text-xs font-bold text-slate-400">حالة الربط والشبكة</p>
          <div className="flex items-center gap-1.5 mt-1 justify-end flex-row-reverse">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-ping"></span>
            <p className="text-xs font-black text-emerald-605">متصل (USB+CORS)</p>
          </div>
          <p className="text-[10px] text-slate-500 font-extrabold flex items-center gap-1 mt-1 justify-end">
            المراقب يقرأ المنافذ النشطة
          </p>
        </div>
        <div className="p-3.5 bg-cyan-50/80 text-cyan-600 rounded-2xl shadow-inner shrink-0">
          <Monitor className="w-6 h-6" />
        </div>
      </div>

    </div>
  );
};
