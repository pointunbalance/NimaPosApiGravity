import React from 'react';
import { Users, Activity, Wrench, DollarSign, ArrowUpRight } from 'lucide-react';

interface DashboardMetricsProps {
  totalMembers: number;
  activeMembers: number;
  expiredMembers: number;
  totalAccessCount: number;
  checkinsCount: number;
  checkoutsCount: number;
  equipmentHealthPercentage: number;
  operationalEquipCount: number;
  inMaintenanceCount: number;
  estimatedRevenue: number;
  currency: string;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  totalMembers,
  activeMembers,
  expiredMembers,
  totalAccessCount,
  checkinsCount,
  checkoutsCount,
  equipmentHealthPercentage,
  operationalEquipCount,
  inMaintenanceCount,
  estimatedRevenue,
  currency
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-right font-sans" dir="rtl">
      
      {/* Stat 1: Memberships */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all flex flex-row justify-between items-start text-right">
        <div className="p-3 rounded-xl bg-blue-50 text-blue-600 shadow-inner shrink-0">
          <Users className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-400">إجمالي الأفراد والمشتركين</p>
          <h3 className="text-2xl font-black text-slate-800 mt-2 font-mono">
            {totalMembers.toLocaleString()}
          </h3>
          <div className="flex items-center gap-2 mt-3 text-[10px] font-bold">
            <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md">
              {activeMembers} نشط
            </span>
            <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">
              {expiredMembers} منتهي
            </span>
          </div>
        </div>
      </div>

      {/* Stat 2: Daily Access Activity */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all flex flex-row justify-between items-start text-right">
        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 shadow-inner shrink-0 animate-pulse">
          <Activity className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-400">النشاط اليومي وعمليات المرور</p>
          <h3 className="text-2xl font-black text-slate-800 mt-2 font-mono">{totalAccessCount}%</h3>
          <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-500 font-bold">
            <span className="text-emerald-600">🟢 {checkinsCount} دخول</span>
            <span>•</span>
            <span className="text-amber-600">🔴 {checkoutsCount} خروج</span>
          </div>
        </div>
      </div>

      {/* Stat 3: Maintenance & Equipment */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all flex flex-row justify-between items-start text-right">
        <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 shadow-inner shrink-0">
          <Wrench className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-400">الحالة التشغيلية للأجهزة</p>
          <h3 className="text-2xl font-black text-slate-800 mt-2 font-mono">{equipmentHealthPercentage}%</h3>
          <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-500 font-bold">
            <span className="text-indigo-600">{operationalEquipCount} جاهز للعمل</span>
            <span>•</span>
            <span className="text-rose-600">{inMaintenanceCount} بالصيانة</span>
          </div>
        </div>
      </div>

      {/* Stat 4: Estimated Revenues */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all flex flex-row justify-between items-start text-right">
        <div className="p-3 rounded-xl bg-amber-50 text-amber-600 shadow-inner shrink-0">
          <DollarSign className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-400">الإيرادات الشاملة والمبيعات</p>
          <h3 className="text-2xl font-black text-slate-800 mt-2 font-mono">
            {estimatedRevenue.toLocaleString()} {currency}
          </h3>
          <div className="flex items-center gap-1 mt-3 text-[9px] text-emerald-600 font-black">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>شامل مبيعات السبا ومستلزمات الرياضة</span>
          </div>
        </div>
      </div>

    </div>
  );
};
export default DashboardMetrics;
