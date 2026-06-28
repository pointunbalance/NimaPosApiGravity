import React from 'react';
import { Truck, CheckCircle, Clock, User, ArrowUpRight } from 'lucide-react';

interface DeliveryStatsProps {
  totalDeliveries: number;
  deliveredCount: number;
  pendingCount: number;
  availableCouriersCount: number;
  totalCouriers: number;
}

const DeliveryStats: React.FC<DeliveryStatsProps> = ({
  totalDeliveries,
  deliveredCount,
  pendingCount,
  availableCouriersCount,
  totalCouriers
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-indigo-100 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50/50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-indigo-50 transition-colors">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-bold mb-1">إجمالي طلبات اليوم</p>
            <p className="text-2xl font-black text-slate-800 leading-none">{totalDeliveries}</p>
          </div>
        </div>
        <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-emerald-100 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50/50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-emerald-50 transition-colors">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-bold mb-1">تم التوصيل</p>
            <p className="text-2xl font-black text-slate-800 leading-none">{deliveredCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-amber-100 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50/50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-amber-50 transition-colors">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-bold mb-1">قيد الانتظار</p>
            <p className="text-2xl font-black text-slate-800 leading-none">{pendingCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-blue-100 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50/50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-bold mb-1">المندوبين المتاحين</p>
            <p className="text-2xl font-black text-slate-800 leading-none flex items-baseline gap-1">
              {availableCouriersCount}
              <span className="text-sm font-bold text-slate-400">/ {totalCouriers}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryStats;
