import React from 'react';
import { DollarSign, TrendingUp, ShoppingBag, Users, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardStatsProps {
    totalSales: number;
    netProfit: number;
    aov: number;
    newCustomers: number;
    formatCurrency: (amount: number) => string;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ 
    totalSales, 
    netProfit, 
    aov, 
    newCustomers, 
    formatCurrency 
}) => {
    const stats = [
        {
            title: 'إجمالي المبيعات',
            value: formatCurrency(totalSales),
            icon: <DollarSign className="w-6 h-6" />,
            color: 'indigo',
            trend: '+12.5%'
        },
        {
            title: 'صافي الربح التقديري',
            value: formatCurrency(netProfit),
            icon: <TrendingUp className="w-6 h-6" />,
            color: 'emerald',
            trend: '+8.2%'
        },
        {
            title: 'متوسط السلة (AOV)',
            value: formatCurrency(aov),
            icon: <ShoppingBag className="w-6 h-6" />,
            color: 'violet',
            trend: '+3.1%'
        },
        {
            title: 'عملاء جدد',
            value: newCustomers,
            icon: <Users className="w-6 h-6" />,
            color: 'blue',
            trend: '+15.3%'
        }
    ];

    const getColorClasses = (color: string) => {
        switch (color) {
            case 'indigo': return 'bg-indigo-50 text-indigo-600';
            case 'emerald': return 'bg-emerald-50 text-emerald-600';
            case 'violet': return 'bg-violet-50 text-violet-600';
            case 'blue': return 'bg-blue-50 text-blue-600';
            default: return 'bg-slate-50 text-slate-600';
        }
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-2">
            {stats.map((stat, index) => (
                <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="bg-white p-6 rounded-3xl shadow-lg shadow-slate-200/40 border border-slate-100 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50/50 pointer-events-none"></div>
                    <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-[0.03].05] group-hover:scale-150 transition-transform duration-700 ${getColorClasses(stat.color).split(' ')[0]}`}></div>
                    <div className={`absolute bottom-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${getColorClasses(stat.color).split(' ')[0]}`}></div>
                    
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className={`p-4 rounded-2xl shadow-sm ${getColorClasses(stat.color)}`}>
                            {stat.icon}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-100">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            {stat.trend}
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-slate-800 mb-2 relative z-10 group-hover:scale-[1.02] origin-right transition-transform">{stat.value}</h3>
                    <p className="text-sm text-slate-500 font-bold relative z-10 uppercase tracking-widest">{stat.title}</p>
                </motion.div>
            ))}
        </div>
    );
};
