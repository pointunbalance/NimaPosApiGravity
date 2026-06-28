import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, Users, Target, Activity } from 'lucide-react';
import { format, subMonths, isSameMonth } from 'date-fns';
import { ar } from 'date-fns/locale';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function SalesDashboard() {
  const orders = useLiveQuery(() => db.orders.toArray()) || [];
  const leads = useLiveQuery(() => db.leads.toArray()) || [];

  // Metrics
  const lastMonth = subMonths(new Date(), 1);
  const currentMonthOrders = orders.filter(o => isSameMonth(new Date(o.date), new Date()));
  const lastMonthOrders = orders.filter(o => isSameMonth(new Date(o.date), lastMonth));

  const currentRevenue = currentMonthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const lastRevenue = lastMonthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const revenueGrowth = lastRevenue === 0 ? 100 : ((currentRevenue - lastRevenue) / lastRevenue) * 100;

  // Chart Data: Last 6 months revenue
  const revenueData = [];
  for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const mOrders = orders.filter(o => isSameMonth(new Date(o.date), d));
      revenueData.push({
          name: format(d, 'MMM', { locale: ar }),
          'المبيعات': mOrders.reduce((sum, o) => sum + o.totalAmount, 0)
      });
  }

  // Chart Data: Pipeline distribution
  const pipelineData = [
      { name: 'جديد', value: leads.filter(l => l.status === 'new').length },
      { name: 'تم التواصل', value: leads.filter(l => l.status === 'contacted').length },
      { name: 'مؤهل', value: leads.filter(l => l.status === 'qualified').length },
      { name: 'مقترح', value: leads.filter(l => l.status === 'proposal').length },
      { name: 'رابح', value: leads.filter(l => l.status === 'won').length },
  ].filter(d => d.value > 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Activity className="text-indigo-600" />
          لوحة تحكم المبيعات
        </h1>
        <p className="text-slate-500 text-sm mt-1">تحليل الأداء والأهداف البيعية</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <TrendingUp size={24} />
                </div>
                <span className={`text-sm font-bold ${revenueGrowth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
                </span>
            </div>
            <p className="text-slate-500 text-sm mb-1">مبيعات الشهر الحالي</p>
            <h3 className="text-2xl font-bold text-slate-800">{currentRevenue.toLocaleString()} د.ع</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Target size={24} />
                </div>
            </div>
            <p className="text-slate-500 text-sm mb-1">الفرص المربوحة</p>
            <h3 className="text-2xl font-bold text-slate-800">{leads.filter(l => l.status === 'won').length}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                    <Users size={24} />
                </div>
            </div>
            <p className="text-slate-500 text-sm mb-1">إجمالي الفرص في خط الأنابيب (Pipeline)</p>
            <h3 className="text-2xl font-bold text-slate-800">{leads.filter(l => l.status !== 'won' && l.status !== 'lost').length}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6">المبيعات (آخر 6 أشهر)</h3>
            <div className="h-80 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                        <Tooltip 
                            cursor={{fill: 'transparent'}}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="المبيعات" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6">توزيع الفرص البيعية</h3>
            <div className="h-80 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pipelineData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={110}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {pipelineData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
}
