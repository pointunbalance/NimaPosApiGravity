import React from 'react';
import { Truck, MapPin, Package, Users } from 'lucide-react';

interface VanSalesStatsProps {
  activeVehicles: number;
  totalVehicles: number;
  totalStopsToday: number;
  totalInventoryValue: number;
  totalRevenueToday: number;
}

const VanSalesStats: React.FC<VanSalesStatsProps> = ({
  activeVehicles,
  totalVehicles,
  totalStopsToday,
  totalInventoryValue,
  totalRevenueToday
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
          <Truck className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">السيارات النشطة</p>
          <p className="text-2xl font-bold text-slate-900">{activeVehicles}/{totalVehicles}</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
          <MapPin className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">إجمالي التوقفات اليوم</p>
          <p className="text-2xl font-bold text-slate-900">{totalStopsToday}</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
          <Package className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">قيمة المخزون</p>
          <p className="text-2xl font-bold text-slate-900">{totalInventoryValue.toLocaleString()} ر.س</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">إيرادات اليوم</p>
          <p className="text-2xl font-bold text-slate-900">{totalRevenueToday.toLocaleString()} ر.س</p>
        </div>
      </div>
    </div>
  );
};

export default VanSalesStats;
