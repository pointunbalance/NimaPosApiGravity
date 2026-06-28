import React from 'react';
import { TrendingUp, Users, Clock, Building2 } from 'lucide-react';

interface B2BSalesStatsProps {
  totalSales: number;
  activeCustomers: number;
  inProgressOrders: number;
  overdueAmount: number;
}

const B2BSalesStats: React.FC<B2BSalesStatsProps> = ({
  totalSales,
  activeCustomers,
  inProgressOrders,
  overdueAmount
}) => {
  const stats = [
    { title: 'إجمالي مبيعات الجملة', value: `${totalSales.toLocaleString()} ج.م`, trend: '+15%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'عملاء الجملة النشطين', value: activeCustomers.toString(), trend: '+3', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'طلبات قيد التنفيذ', value: inProgressOrders.toString(), trend: '-2', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
    { title: 'مستحقات متأخرة', value: `${overdueAmount.toLocaleString()} ج.م`, trend: '+5%', icon: Building2, color: 'text-rose-600', bg: 'bg-rose-100' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <span className={`text-sm font-medium ${stat.trend.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
              {stat.trend}
            </span>
          </div>
          <h3 className="text-slate-500 text-sm font-medium mb-1">{stat.title}</h3>
          <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
        </div>
      ))}
    </div>
  );
};

export default B2BSalesStats;
