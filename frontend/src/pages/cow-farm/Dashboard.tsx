import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { 
  Plus, Activity, ShoppingCart, Landmark, AlertTriangle, 
  Calendar, CheckCircle, ChevronLeft, ArrowUpRight, TrendingUp
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function CowFarmDashboard() {
  const navigate = useNavigate();

  // Queries
  const cows = useLiveQuery(() => db.cowFarmCows.toArray()) || [];
  const milkProduction = useLiveQuery(() => db.cowFarmMilkProduction.toArray()) || [];
  const feedStock = useLiveQuery(() => db.cowFarmFeedStock.toArray()) || [];
  const healthLogs = useLiveQuery(() => db.cowFarmHealth.toArray()) || [];
  const breedingLogs = useLiveQuery(() => db.cowFarmBreeding.toArray()) || [];
  const financials = useLiveQuery(() => db.cowFarmFinancials.toArray()) || [];

  // Metrics calculations
  const totalCows = cows.length;
  const milkingCows = cows.filter(c => c.status === 'منتج').length;
  const pregnantCows = cows.filter(c => c.status === 'عشّار').length;
  const isolatedCows = cows.filter(c => c.status === 'عزل' || c.healthStatus === 'مريض').length;

  // Today's total milk production
  const todayStr = new Date().toISOString().split('T')[0];
  const todayMilk = useMemo(() => {
    return milkProduction
      .filter(p => p.date === todayStr)
      .reduce((sum, p) => sum + Number(p.quantity || 0), 0);
  }, [milkProduction, todayStr]);

  // Active healthcare warnings (safety period not yet ended)
  const activeWarningsCount = useMemo(() => {
    const today = new Date();
    return healthLogs.filter(log => {
      if (!log.safetyPeriodEnd) return false;
      const end = new Date(log.safetyPeriodEnd);
      return end >= today;
    }).length;
  }, [healthLogs]);

  // Chart data: past 7 days of milk production
  const milkChartData = useMemo(() => {
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return dates.map(d => {
      const dayLogs = milkProduction.filter(p => p.date === d);
      const total = dayLogs.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
      const dayLabel = new Date(d).toLocaleDateString('ar-EG', { weekday: 'short' });
      return {
        name: dayLabel,
        "كمية الحليب (ليتر)": total,
        dateStr: d
      };
    });
  }, [milkProduction]);

  // Feed stocks health
  const lowFeedWarnings = feedStock.filter(f => f.stock < 100);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-[#fcfcfc] min-h-screen text-slate-800" dir="rtl" id="cowfarm-dashboard">
      
      {/* Top Welcome and Header Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-700 flex items-center justify-center rounded-xl border border-emerald-100 shadow-sm">
              <Activity className="w-5 h-5 stroke-[2]" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight" id="cowfarm-dashboard-title">إدارة مزارع البقر</h1>
            <span className="text-[10px] font-bold bg-emerald-100/60 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200/50">النظام المتكامل</span>
          </div>
          <p className="text-slate-500 text-sm mt-2 font-medium max-w-2xl leading-relaxed">
            البوابة الذكية لمتابعة إنتاج الحليب، دورات التناسل والتلقيح البيطري، وربط حركة الأعلاف والمبيعات بدفاتر الحسابات المركزية تلقائياً.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={() => navigate('/cow-farm/cows')} 
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl duration-150 flex items-center gap-2 text-xs border border-emerald-600 shadow-sm shadow-emerald-600/5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-100" />إضافة رأس جديد
          </button>
          <button 
            onClick={() => navigate('/cow-farm/milk')} 
            className="px-4 py-2 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold rounded-xl duration-150 flex items-center gap-2 text-xs border border-slate-200/80 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-400" />تسجيل إنتاج الحليب
          </button>
        </div>
      </div>

      {/* Critical Warnings Notice Component */}
      {(activeWarningsCount > 0 || lowFeedWarnings.length > 0) && (
        <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-4.5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shadow-xs">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-amber-105 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0 border border-amber-200/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-950 text-xs">تنبيهات الحظر والأمان البيطري</h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                {activeWarningsCount > 0 && `تنبيه: يوجد ${activeWarningsCount} من قطيع الأبقار تحت فترة الأمان البيطرية والعلاجية النشطة (الاستبعاد الإلزامي للحليب من التوريد). `}
                {lowFeedWarnings.length > 0 && `تنبيه المخزون: هناك ${lowFeedWarnings.length} أصناف من الأعلاف تحت الحد الآمن للتغذية.`}
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/cow-farm/health')} 
            className="text-xs font-bold text-amber-900 bg-amber-100/60 hover:bg-amber-200/80 px-4 py-2 rounded-xl border border-amber-200 transition shrink-0 cursor-pointer"
          >
            استعراض ملف العلاجات
          </button>
        </div>
      )}

      {/* Primary KPI Grid Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Herd */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs hover:border-slate-300 hover:shadow-sm duration-200">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">القطيع الكلي</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-800 tracking-tight">{totalCows}</span>
              <span className="text-xs font-semibold text-slate-400">رأس</span>
            </div>
            <p className="text-[10px] text-slate-405 text-slate-400 mt-1">إجمالي الأبقار النشطة والمقيدة بالحظائر</p>
          </div>
        </div>

        {/* Milking Cows */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs hover:border-slate-300 hover:shadow-sm duration-200">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">مدرّات الحليب</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-800 tracking-tight">{milkingCows}</span>
              <span className="text-xs font-semibold text-slate-450 text-slate-400">من {totalCows}</span>
            </div>
            <p className="text-[10px] text-slate-405 text-slate-400 mt-1">إناث في فترة الإنتاج والمدرات النشطة</p>
          </div>
        </div>

        {/* Pregnant Cows */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs hover:border-slate-300 hover:shadow-sm duration-200">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">القطيع الحوامل (عشّار)</span>
            <div className="p-2 bg-fuchsia-50 text-fuchsia-600 rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-800 tracking-tight">{pregnantCows}</span>
              <span className="text-xs font-semibold text-slate-400">رأس</span>
            </div>
            <p className="text-[10px] text-slate-405 text-slate-400 mt-1">تتبع دورات الحمل المخططة ومواعيد الولادة</p>
          </div>
        </div>

        {/* Milk Harvested Today */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs hover:border-slate-300 hover:shadow-sm duration-200">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">إنتاج الحليب اليوم</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-800 tracking-tight">{todayMilk}</span>
              <span className="text-xs font-semibold text-slate-400">ليتر</span>
            </div>
            <p className="text-[10px] text-slate-405 text-slate-400 mt-1"> حصيلة الحلبات الصباحية والمسائية لليوم</p>
          </div>
        </div>

      </div>

      {/* Main Charts and Sub-grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recharts Production Curve */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-base">دورة إنتاج الألبان الأسبوعية</h3>
              <p className="text-xs text-slate-500 mt-0.5">مقارنة وتتبع مسار الحليب الإجمالي بالليتر على مدار 7 أيام</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              محدث مباشرة
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={milkChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '12px', 
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    fontSize: '12px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="كمية الحليب (ليتر)" 
                  stroke="#059669" 
                  strokeWidth={3} 
                  dot={{ r: 4, strokeWidth: 1.5, fill: '#fff', stroke: '#059669' }} 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feed Stocks Dashboard Widget */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="font-bold text-slate-900 text-base">مخزن وصوامع الأعلاف</h3>
                <p className="text-xs text-slate-400 mt-0.5">مستويات الحبوب والخلطات الغذائية الحالية</p>
              </div>
              <button 
                onClick={() => navigate('/cow-farm/feed')}
                className="text-xs text-emerald-750 text-emerald-700 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-100/40 px-2.5 py-1 rounded-lg font-bold duration-150 cursor-pointer"
              >
                المخزن
              </button>
            </div>
            
            <div className="space-y-4">
              {feedStock.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">لا توجد مواد مخزنة حالياً في صوامع الأعلاف.</div>
              ) : (
                feedStock.map((f, i) => {
                  const percentage = Math.min((f.stock / 2500) * 100, 100);
                  const isLow = f.stock < 150;
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-705 text-slate-705">
                        <span className="text-slate-800 font-bold">{f.name}</span>
                        <span className={isLow ? 'text-amber-600 font-bold' : 'text-slate-500 font-medium'}>
                          {f.stock} {f.unit || 'كجم'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-105 rounded-full h-2 overflow-hidden bg-slate-100/80">
                        <div 
                          className={`h-2 rounded-full duration-500 transition-all ${isLow ? 'bg-amber-500' : 'bg-emerald-600'}`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 mt-6">
            <button 
              onClick={() => navigate('/cow-farm/feed')}
              className="w-full py-2 bg-slate-50 hover:bg-slate-105 hover:bg-slate-100 text-slate-650 font-semibold rounded-xl text-xs flex items-center justify-center gap-1 transition cursor-pointer"
            >
              عرض مخزن الأعلاف بالكامل
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

      </div>

      {/* Breeding pregnancy status and veterinary log snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Breeding calendar log */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-xs">
          <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">تتبع التناسل والمواليد المتوقعة</h3>
              <p className="text-[11px] text-slate-405 text-slate-400">آخر عمليات التلقيح وحقن النطاف في القطيع</p>
            </div>
            <button 
              onClick={() => navigate('/cow-farm/breeding')} 
              className="px-2.5 py-1 text-xs border border-slate-200 hover:border-slate-350 text-slate-600 font-bold rounded-lg hover:bg-slate-50 duration-150 cursor-pointer"
            >
              سجل التناسل
            </button>
          </div>

          <div className="divide-y divide-slate-100/70">
            {breedingLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">لا توجد سجلات تلقيح مسجلة نشطة بالدفاتر.</div>
            ) : (
              breedingLogs.slice(0, 3).map((b, i) => (
                <div key={i} className="py-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-fuchsia-500"></div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs">تلقيح البقرة # {b.cowTag}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">تاريخ التلقيح: {b.inseminationDate}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] bg-fuchsia-50 text-fuchsia-700 font-bold px-2 py-0.5 rounded-full border border-fuchsia-100/50">
                      حمل: {b.pregnancyStatus}
                    </span>
                    <p className="text-[9px] text-slate-450 mt-1">الولادة المتوقعة: {b.expectedArrivalDate}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Vet appointments log snapshot */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-xs">
          <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">استعراض العيادة البيطرية والتحصينات</h3>
              <p className="text-[11px] text-slate-405 text-slate-400 font-medium">الأوضاع الطبية والفحوص المقيدة حديثاً</p>
            </div>
            <button 
              onClick={() => navigate('/cow-farm/health')} 
              className="px-2.5 py-1 text-xs border border-slate-200 hover:border-slate-350 text-slate-600 font-bold rounded-lg hover:bg-slate-50 duration-150 cursor-pointer"
            >
              الملف الصحي
            </button>
          </div>

          <div className="divide-y divide-slate-100/70">
            {healthLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">القطيع خالي من أي سجلات فحص عيادية أو علاجات.</div>
            ) : (
              healthLogs.slice(0, 3).map((h, i) => (
                <div key={i} className="py-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs">رأس البقرة {h.cowTag} - {h.diagnosis}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">العلاج: {h.treatment || 'فحص عام ووقائي'}</p>
                    </div>
                  </div>
                  <div className="text-left text-xs">
                    <p className="font-semibold text-slate-600">{h.veterinarian}</p>
                    {h.safetyPeriodEnd && (
                      <p className="text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-100/40 mt-1 inline-block">
                        حظر الحليب لغاية: {h.safetyPeriodEnd}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
