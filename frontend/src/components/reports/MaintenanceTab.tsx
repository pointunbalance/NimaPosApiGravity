import React, { useMemo } from 'react';
import { Wrench, CheckCircle, XCircle, Clock, Award, Hammer, Smartphone, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface MaintenanceOrder {
  id?: number;
  date: Date;
  customerName: string;
  deviceType: string;
  deviceModel: string;
  status: string;
  technicianName?: string;
  expectedCost: number;
  actualCost?: number;
}

interface MaintenanceTabProps {
  maintenanceOrders: MaintenanceOrder[];
  formatCurrency: (amount: number) => string;
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

const STATUS_MAP: Record<string, string> = {
  received: 'مستلم',
  diagnosing: 'قيد الفحص والمراجعة',
  waiting_parts: 'بانتظار قطع الغيار',
  repairing: 'قيد العمل والإصلاح',
  ready: 'تم الإصلاح وجاهز للاستلام',
  delivered: 'تم تسليمه والتحصيل للعميل',
  cancelled: 'ملغي مرتجع بدون صيانة'
};

const MaintenanceTab: React.FC<MaintenanceTabProps> = ({ maintenanceOrders, formatCurrency }) => {

  // Overall Statistics
  const summary = useMemo(() => {
    let totalDevices = maintenanceOrders.length;
    let repaired = 0; // ready, delivered
    let cancelled = 0; // cancelled
    let inProgress = 0; // received, diagnosing, waiting_parts, repairing
    let totalRevenue = 0;

    maintenanceOrders.forEach(o => {
      if (o.status === 'ready' || o.status === 'delivered') {
        repaired++;
        totalRevenue += (o.actualCost || o.expectedCost || 0);
      } else if (o.status === 'cancelled') {
        cancelled++;
      } else {
        inProgress++;
      }
    });

    const totalResolved = repaired + cancelled;
    const repairSuccessRate = totalResolved > 0 ? (repaired / totalResolved) * 100 : 0;

    return { totalDevices, repaired, cancelled, inProgress, totalRevenue, repairSuccessRate };
  }, [maintenanceOrders]);

  // Group by Technician
  const technicianStats = useMemo(() => {
    const techMap = new Map<string, { total: number; repaired: number; cancelled: number; ongoing: number; revenue: number }>();

    maintenanceOrders.forEach(o => {
      const technician = o.technicianName?.trim() || 'فني غير محدد';
      const curr = techMap.get(technician) || { total: 0, repaired: 0, cancelled: 0, ongoing: 0, revenue: 0 };

      curr.total++;
      if (o.status === 'ready' || o.status === 'delivered') {
        curr.repaired++;
        curr.revenue += (o.actualCost || o.expectedCost || 0);
      } else if (o.status === 'cancelled') {
        curr.cancelled++;
      } else {
        curr.ongoing++;
      }

      techMap.set(technician, curr);
    });

    return Array.from(techMap.entries())
      .map(([name, data]) => {
        const resolved = data.repaired + data.cancelled;
        const rate = resolved > 0 ? (data.repaired / resolved) * 100 : 0;
        return { name, ...data, successRate: rate };
      })
      .sort((a, b) => b.repaired - a.repaired);
  }, [maintenanceOrders]);

  // Recharts Pie Chart Data
  const ratioPieData = [
    { name: 'تم الإصلاح بنجاح', value: summary.repaired },
    { name: 'مرتجع بدون صيانة (ملغي)', value: summary.cancelled }
  ].filter(item => item.value > 0);

  // Recharts Technician Performance Data
  const technicianChartData = technicianStats.slice(0, 8).map(t => ({
    name: t.name,
    'أجهزة تم إصلاحها': t.repaired,
    'مرتجعة دون صيانة': t.cancelled,
    'قيد العمل': t.ongoing
  }));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 print:grid-cols-4">
        {/* Total Devices */}
        <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 text-xs font-bold uppercase">إجمالي كروت الصيانة المستلمة</p>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Smartphone className="w-4 h-4" /></div>
          </div>
          <h3 className="text-3xl font-extrabold text-slate-800">{summary.totalDevices} كارت صيانة</h3>
          <div className="text-xs text-indigo-600">الفحص والصيانة بالمحل</div>
        </div>

        {/* Repaired Successfully */}
        <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 text-xs font-bold uppercase">أجهزة تم إصلاحها بنجاح</p>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle className="w-4 h-4" /></div>
          </div>
          <h3 className="text-3xl font-extrabold text-slate-800">{summary.repaired} جهاز</h3>
          <div className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded w-fit">معدل نجاح: {summary.repairSuccessRate.toFixed(1)}%</div>
        </div>

        {/* Cancelled / Unrepaired */}
        <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 text-xs font-bold uppercase">مرتجع ملغي بدون تصليح</p>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><XCircle className="w-4 h-4" /></div>
          </div>
          <h3 className="text-3xl font-extrabold text-slate-800">{summary.cancelled} جهاز</h3>
          <div className="text-xs text-rose-500 font-bold bg-rose-50 px-2 py-0.5 rounded w-fit">أجهزة مرتجعة</div>
        </div>

        {/* In progress */}
        <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 text-xs font-bold uppercase">تحت العمل والإصلاح</p>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Clock className="w-4 h-4" /></div>
          </div>
          <h3 className="text-3xl font-extrabold text-slate-850">{summary.inProgress} جهاز</h3>
          <div className="text-xs text-amber-600">قيد التشخيص أو قطع الغيار</div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 print:break-inside-avoid">
        {/* success ratio gage */}
        <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex flex-col h-96">
          <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" /> نسبة نجاح الصيانة للفنيين
          </h3>
          <p className="text-xs text-slate-400 mb-4">مقارنة الأجهزة المصلحة مقابل المرتجعة ملغية</p>
          <div className="flex-1 flex flex-col items-center justify-center">
            {ratioPieData.length > 0 ? (
              <div className="w-full h-48 select-none">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={ratioPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                      {ratioPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value} جهاز`, 'العدد']} />
                    <Legend verticalAlign="bottom" wrapperStyle={{fontSize: '11px', fontWeight: 'bold'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center text-slate-400 text-xs py-8 space-y-2">
                <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto" />
                <p>لا توجد بيانات صيانة منتهية لقياس نسبة نجاح الصيانة.</p>
              </div>
            )}
            <div className="bg-slate-50 p-4 rounded-2xl w-full border border-slate-100 flex justify-between items-center text-xs mt-2">
              <span className="text-slate-500">معدل الإنجاز العام للمحل:</span>
              <span className="font-extrabold text-base text-emerald-600">{summary.repairSuccessRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Technician load chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex flex-col h-96">
          <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" /> مقارنة إنتاجية الفنيين وعبء العمل
          </h3>
          <p className="text-xs text-slate-400 mb-4">الأجهزة المنجزة والمرتجعة حالياً لكل فني صيانة بالورشة</p>
          <div className="flex-1 h-64 select-none">
            {technicianChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={technicianChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 10}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill: '#94a3b8', fontSize: 10}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                  <Legend iconType="circle" wrapperStyle={{fontSize: '11px'}} />
                  <Bar dataKey="أجهزة تم إصلاحها" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="مرتجعة دون صيانة" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="قيد العمل" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-slate-400 py-16 text-xs">لا توجد بيانات أجهزة فنيين حالياً.</p>
            )}
          </div>
        </div>
      </div>

      {/* Technician Productivity Leaderboard */}
      <div className="bg-white rounded-3xl border border-slate-150 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500 animate-bounce" />
            <span className="font-bold text-slate-800">بيان إنتاجية وأداء الفنيين المفصل</span>
          </div>
          <span className="text-xs bg-amber-50 text-amber-700 px-3 py-1 border border-amber-200 rounded-full font-bold">
            تقييم فنيي الصيانة
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-100 text-slate-600 font-semibold select-none">
              <tr>
                <th className="px-6 py-4">اسم فني الصيانة</th>
                <th className="px-6 py-4 text-center">إجمالي مستلم</th>
                <th className="px-6 py-4 text-center">تم تصليحه</th>
                <th className="px-6 py-4 text-center">مرتجع دون تصليح</th>
                <th className="px-6 py-4 text-center">قيد الفحص والعمل</th>
                <th className="px-6 py-4 text-center">نسبة نجاح الإصلاح</th>
                <th className="px-6 py-4 text-left">إجمالي الإيرادات المتوقعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {technicianStats.map((t, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  {/* Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600 border border-slate-200">
                        {t.name.substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-850">{t.name}</div>
                        <div className="text-[10px] text-slate-400">قسم الصيانة والورشة</div>
                      </div>
                    </div>
                  </td>

                  {/* Total Assigned */}
                  <td className="px-6 py-4 text-center font-bold text-slate-700 font-sans">{t.total}</td>

                  {/* Repaired */}
                  <td className="px-6 py-4 text-center text-emerald-600 font-sans font-extrabold">{t.repaired}</td>

                  {/* Unrepaired / Cancelled */}
                  <td className="px-6 py-4 text-center text-rose-500 font-sans">{t.cancelled}</td>

                  {/* Ongoing */}
                  <td className="px-6 py-4 text-center text-amber-500 font-sans">{t.ongoing}</td>

                  {/* Success Rate */}
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${t.successRate >= 80 ? 'bg-emerald-50 text-emerald-700' : t.successRate >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                      {t.successRate.toFixed(1)}%
                    </span>
                  </td>

                  {/* Revenue Generated */}
                  <td className="px-6 py-4 text-left font-extrabold text-indigo-600 font-sans">
                    {formatCurrency(t.revenue)}
                  </td>
                </tr>
              ))}

              {technicianStats.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                    لا توجد بيانات كروت صيانة أو فنيين مسجلين في النظام بعد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default MaintenanceTab;
