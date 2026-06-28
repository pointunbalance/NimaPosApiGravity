import React from 'react';
import { Repeat, CreditCard, Calendar } from 'lucide-react';

interface SubscriptionsStatsProps {
  activeSubscriptions: number;
  totalRevenue: number;
}

const SubscriptionsStats: React.FC<SubscriptionsStatsProps> = ({
  activeSubscriptions,
  totalRevenue,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
          <Repeat className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">الاشتراكات النشطة</p>
          <p className="text-2xl font-bold text-slate-900">{activeSubscriptions}</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
          <CreditCard className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">الإيرادات المتوقعة</p>
          <p className="text-2xl font-bold text-slate-900">{totalRevenue.toFixed(2)} ر.س</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">تجديدات هذا الشهر</p>
          <p className="text-2xl font-bold text-slate-900">-</p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionsStats;
