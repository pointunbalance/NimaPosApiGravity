import React from 'react';
import { 
  User, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  TrendingUp 
} from 'lucide-react';

interface MembershipsMetricsProps {
  metrics: {
    total: number;
    active: number;
    expired: number;
    revenue: number;
    expiringCount: number;
  };
  currency: string;
}

export const MembershipsMetrics: React.FC<MembershipsMetricsProps> = ({ metrics, currency }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-right" dir="rtl">
      
      <div id="metric-total-subscribers" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-400">إجمالي المشتركين المقيدين</p>
          <h3 className="text-2xl font-black text-slate-800 font-mono">{metrics.total}</h3>
          <p className="text-[10px] text-slate-500">تم تسجيلهم بنجاح في قاعدة البيانات</p>
        </div>
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-slate-600">
          <User className="w-5 h-5" />
        </div>
      </div>

      <div id="metric-active-subscribers" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-400">الاشتراكات الفعالة الحالية</p>
          <h3 className="text-2xl font-black text-emerald-600 font-mono">{metrics.active}</h3>
          <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>يتمتعون بصلاحية الدخول بالبوابة</span>
          </p>
        </div>
        <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
          <CheckCircle className="w-5 h-5" />
        </div>
      </div>

      <div id="metric-expiring-subscribers" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-400">اشتراكات توشك على الانتهاء</p>
          <h3 className="text-2xl font-black text-amber-500 font-mono">{metrics.expiringCount}</h3>
          <p className="text-[10px] text-amber-500 font-medium font-mono">سينتهي خلال الـ 7 أيام القادمة</p>
        </div>
        <div className="p-3 rounded-lg bg-amber-50 text-amber-500">
          <Clock className="w-5 h-5 animate-pulse" />
        </div>
      </div>

      <div id="metric-total-revenue" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-400">العوائد والمبيعات المحصلة</p>
          <h3 className="text-2xl font-black text-indigo-600 font-mono">{metrics.revenue.toLocaleString()} {currency}</h3>
          <p className="text-[10px] text-indigo-500 font-bold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>تحديث تراكمي تلقائي من الاشتراكات</span>
          </p>
        </div>
        <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
          <DollarSign className="w-5 h-5" />
        </div>
      </div>

    </div>
  );
};
