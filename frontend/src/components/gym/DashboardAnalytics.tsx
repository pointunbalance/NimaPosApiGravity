import React from 'react';
import { TrendingUp, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, BarChart, Bar, Cell } from 'recharts';

interface DashboardAnalyticsProps {
  chartData: any[];
  distributionData: any[];
  currency: string;
}

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({
  chartData,
  distributionData,
  currency
}) => {
  const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-right font-sans" dir="rtl">
      
      {/* 1. Area Chart (col-span-2) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 flex flex-col" style={{ minHeight: '420px' }}>
        <div className="flex justify-between items-center mb-6 flex-row-reverse text-right">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">النشاط المالي ونمو الاشتراكات</h3>
            <p className="text-xs text-slate-400 mt-0.5">معدل تحصيل باقات العضوية ومبيعات البوتيك الرياضي</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold flex-row-reverse">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-indigo-600 rounded-sm"></span> 
              <span>الأعضاء الجدد</span>
            </span>
            <span className="flex items-center gap-1 mr-2">
              <span className="w-2.5 h-2.5 bg-blue-400 rounded-sm"></span> 
              <span>الإيرادات التقريبية ({currency})</span>
            </span>
          </div>
        </div>

        <div className="flex-1 w-full h-full min-h-[300px] font-mono select-none" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gymColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gymColorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <Tooltip 
                contentStyle={{ direction: 'rtl', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                labelClassName="font-bold text-slate-750 text-xs"
              />
              <Area type="monotone" name="الأعضاء الجدد" dataKey="value" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#gymColor)" />
              <Area type="monotone" name={`الإيرادات التقريبية (${currency})`} dataKey="revenue" stroke="#3b82f6" strokeWidth={1.5} fillOpacity={1} fill="url(#gymColorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Plan Distribution Bar Chart (col-span-1) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between" style={{ minHeight: '420px' }}>
        <div>
          <h3 className="font-bold text-slate-800 text-sm">طلب باقات اشتراك المسبح والجمنازيوم</h3>
          <p className="text-xs text-slate-400 mt-0.5">توزيع المقيدين على أنواع الاشتراكات بنظام العضوية المستمر</p>
        </div>

        {distributionData.length === 0 ? (
          <div className="h-44 text-xs font-bold text-slate-350 flex flex-col items-center justify-center bg-slate-50 rounded-xl">
            <span>لا توجد بيانات توزيع للاشتراكات.</span>
          </div>
        ) : (
          <div className="flex-1 w-full h-full min-h-[260px] mt-4 flex items-center justify-center font-mono select-none" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} layout="vertical" margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={80} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9' }} />
                <Bar name="عدد المشتركين" dataKey="value" fill="#4f46e5" radius={[0, 8, 8, 0]} barSize={16}>
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="border-t border-slate-100 pt-4 mt-2">
          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-bold justify-items-end">
            <span className="flex items-center gap-1.5 flex-row-reverse"><span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0"></span><span>اشتراكات مخصصة</span></span>
            <span className="flex items-center gap-1.5 flex-row-reverse"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span><span>زيارات حرة</span></span>
            <span className="flex items-center gap-1.5 flex-row-reverse"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span><span>مدفوعات نقدية</span></span>
            <span className="flex items-center gap-1.5 flex-row-reverse"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span><span>حصص جماعية</span></span>
          </div>
        </div>
      </div>

    </div>
  );
};
export default DashboardAnalytics;
