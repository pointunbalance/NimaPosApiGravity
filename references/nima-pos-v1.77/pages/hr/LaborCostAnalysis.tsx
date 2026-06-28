import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Activity, DollarSign, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { ar } from 'date-fns/locale';

export const LaborCostAnalysis: React.FC = () => {
    // We analyze expenses directly where category is 'salary'
    const expenses = useLiveQuery(() => db.expenses.where('category').equals('salary').toArray()) || [];
    const users = useLiveQuery(() => db.users.toArray()) || [];

    const stats = useMemo(() => {
        let totalSalaries = 0;
        const currentMonth = format(new Date(), 'yyyy-MM');
        const lastMonth = format(subMonths(new Date(), 1), 'yyyy-MM');
        
        let currentMonthCost = 0;
        let lastMonthCost = 0;

        expenses.forEach(exp => {
            totalSalaries += exp.amount;
            const expMonth = format(new Date(exp.date), 'yyyy-MM');
            if (expMonth === currentMonth) currentMonthCost += exp.amount;
            if (expMonth === lastMonth) lastMonthCost += exp.amount;
        });

        const activeUsersCount = users.filter(u => u.isActive === true).length;
        const avgCostPerEmployee = activeUsersCount > 0 ? (currentMonthCost / activeUsersCount) : 0;
        
        let percentageChange = 0;
        if (lastMonthCost > 0) {
            percentageChange = ((currentMonthCost - lastMonthCost) / lastMonthCost) * 100;
        } else if (currentMonthCost > 0) {
            percentageChange = 100;
        }

        return {
            totalSalaries,
            currentMonthCost,
            avgCostPerEmployee,
            percentageChange,
            activeUsersCount
        };
    }, [expenses, users]);

    const chartData = useMemo(() => {
        const monthsData: Record<string, number> = {};
        // Generate last 6 months outline
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(new Date(), i);
            const monthStr = format(date, 'MMM yyyy', { locale: ar });
            monthsData[monthStr] = 0;
        }

        expenses.forEach(exp => {
             const mStr = format(new Date(exp.date), 'MMM yyyy', { locale: ar });
             if (monthsData[mStr] !== undefined) {
                 monthsData[mStr] += exp.amount;
             }
        });

        return Object.keys(monthsData).map(k => ({
            month: k,
            cost: monthsData[k]
        }));
    }, [expenses]);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="text-indigo-600" />
                    تقارير تحليل تكلفة العمالة (Labor Cost Analysis)
                </h1>
                <p className="text-slate-500 mt-1">تتبع التكلفة الإجمالية للقوى العاملة ومقارنة المنصرف الفعلي من الرواتب</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-b-4 border-b-indigo-500">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        {stats.percentageChange !== 0 && (
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${stats.percentageChange > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {stats.percentageChange > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                {Math.abs(stats.percentageChange).toFixed(1)}% عن الشهر السابق
                            </span>
                        )}
                    </div>
                    <h3 className="text-slate-500 font-medium text-sm">التكلفة هذا الشهر</h3>
                    <div className="text-2xl font-black text-slate-800 mt-1">{stats.currentMonthCost.toLocaleString()}</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-b-4 border-b-emerald-500">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>
                    <h3 className="text-slate-500 font-medium text-sm">متوسط التكلفة للموظف النشط (شهرياً)</h3>
                    <div className="text-2xl font-black text-slate-800 mt-1">{stats.avgCostPerEmployee.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-b-4 border-b-blue-500">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Activity className="w-6 h-6" />
                        </div>
                    </div>
                    <h3 className="text-slate-500 font-medium text-sm">الموظفين النشطين</h3>
                    <div className="text-2xl font-black text-slate-800 mt-1">{stats.activeUsersCount}</div>
                </div>
                
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-b-4 border-b-slate-500">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
                            <Activity className="w-6 h-6" />
                        </div>
                    </div>
                    <h3 className="text-slate-500 font-medium text-sm">إجمالي المنصرف التاريخي</h3>
                    <div className="text-2xl font-black text-slate-800 mt-1">{stats.totalSalaries.toLocaleString()}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4">اتجاه تكلفة الرواتب (شهرياً)</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                <RTooltip cursor={{ stroke: '#E2E8F0', strokeWidth: 1 }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Line type="monotone" dataKey="cost" name="التكلفة" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4">التكلفة مقارنة (الأعمدة)</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                <RTooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="cost" name="التكلفة" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LaborCostAnalysis;
