import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { motion } from 'framer-motion';

interface DashboardChartsProps {
    chartData: any[];
    paymentChartData: any[];
    formatCurrency: (amount: number) => string;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ 
    chartData, 
    paymentChartData, 
    formatCurrency 
}) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
             <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100"
            >
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                    تحليل الإيرادات
                </h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} width={80} tickFormatter={(val) => `${val / 1000}k`} />
                            <Tooltip 
                                formatter={(val: number) => formatCurrency(val)} 
                                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: 'var(--tw-colors-slate-800)', color: 'var(--tw-colors-slate-100)' }} 
                                itemStyle={{ color: 'var(--tw-colors-slate-100)' }} 
                            />
                            <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorAmount)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
             <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col"
            >
                <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                    مصادر الدخل
                </h3>
                <div className="flex-1 min-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie 
                                data={paymentChartData} 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={70} 
                                outerRadius={100} 
                                paddingAngle={5} 
                                dataKey="value" 
                                stroke="none"
                            >
                                {paymentChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                            <Tooltip 
                                formatter={(val: number) => formatCurrency(val)} 
                                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: 'var(--tw-colors-slate-800)', color: 'var(--tw-colors-slate-100)' }} 
                                itemStyle={{ color: 'var(--tw-colors-slate-100)' }} 
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ color: 'var(--tw-colors-slate-400)' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </div>
    );
};
