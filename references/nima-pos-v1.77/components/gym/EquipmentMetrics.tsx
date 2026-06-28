import React from 'react';
import { 
  ClipboardList, 
  Calendar, 
  CheckCircle, 
  Wrench, 
  TrendingUp 
} from 'lucide-react';

interface EquipmentMetricsProps {
  statsCore: {
    total: number;
    active: number;
    warning: number;
    maintenance: number;
    broken: number;
    totalExpenses: number;
  };
  currency: string;
}

export const EquipmentMetrics: React.FC<EquipmentMetricsProps> = ({ statsCore, currency }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-4 text-right" dir="rtl">
      
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
        <div className="space-y-1">
          <p className="text-[10px] font-extrabold text-slate-400">إجمالي الأجهزة المقيدة</p>
          <div className="flex items-baseline gap-1 justify-end">
            <span className="text-xl font-black text-slate-800 font-mono">{statsCore.total}</span>
            <span className="text-[10px] text-slate-400 font-bold">وحدة</span>
          </div>
          <p className="text-[9px] text-slate-400 font-bold">بمخزن وجرد الفروع بالأصل</p>
        </div>
        <div className="p-2.5 bg-slate-50 text-slate-500 rounded-lg">
          <ClipboardList className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
        <div className="space-y-1">
          <p className="text-[10px] font-extrabold text-indigo-600">جدول الصيانة الوقائية</p>
          <div className="flex items-baseline gap-1 justify-end">
            <span className="text-xl font-black text-indigo-600 font-mono">{statsCore.warning}</span>
            <span className="text-[10px] text-indigo-400 font-bold">بحاجة للتدقيق</span>
          </div>
          <p className="text-[9px] text-indigo-400 font-bold">قرابة فحصهم الفني السنوي</p>
        </div>
        <div className="p-2.5 bg-indigo-50 text-indigo-500 rounded-lg">
          <Calendar className="w-5 h-5 animate-pulse" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
        <div className="space-y-1">
          <p className="text-[10px] font-extrabold text-emerald-600">الأجهزة الشغالة حالياً</p>
          <div className="flex items-baseline gap-1 justify-end">
            <span className="text-xl font-black text-emerald-600 font-mono">{statsCore.active}</span>
            <span className="text-[10px] text-emerald-400 font-bold">جهاز سليم</span>
          </div>
          <p className="text-[9px] text-emerald-400 font-bold">تعمل بكفاءة قوية بالصالة</p>
        </div>
        <div className="p-2.5 bg-emerald-50 text-emerald-500 rounded-lg">
          <CheckCircle className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
        <div className="space-y-1">
          <p className="text-[10px] font-extrabold text-amber-600">أجهزة قيد الإصلاح</p>
          <div className="flex items-baseline gap-1 justify-end">
            <span className="text-xl font-black text-amber-600 font-mono">{statsCore.maintenance}</span>
            <span className="text-[10px] text-amber-400 font-bold">وحدات</span>
          </div>
          <p className="text-[9px] text-amber-400 font-bold">تحت إشراف الشركات والمهندسين</p>
        </div>
        <div className="p-2.5 bg-amber-50 text-amber-500 rounded-lg">
          <Wrench className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all col-span-2 lg:col-span-1">
        <div className="space-y-1">
          <p className="text-[10px] font-extrabold text-rose-600">إجمالي نفقات الصيانة مالي</p>
          <div className="flex items-baseline gap-0.5 justify-end">
            <span className="text-lg font-black text-rose-600 font-mono">{statsCore.totalExpenses.toLocaleString()}</span>
            <span className="text-[9px] text-slate-400 font-extrabold">{currency}</span>
          </div>
          <p className="text-[9px] text-rose-450 font-bold">مقيدة تلقائياً بقيود اليومية العامة</p>
        </div>
        <div className="p-2.5 bg-rose-50 text-rose-500 rounded-lg">
          <TrendingUp className="w-5 h-5" />
        </div>
      </div>

    </div>
  );
};
