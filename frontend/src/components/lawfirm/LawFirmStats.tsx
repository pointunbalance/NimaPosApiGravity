import React from 'react';
import { Briefcase, AlertCircle, Calendar, DollarSign } from 'lucide-react';

interface LawFirmStatsProps {
  totalCasesCount: number;
  activeCasesCount: number;
  upcomingSessionsCount: number;
  collectedFeesCount: number;
  totalFeesCount: number;
}

export const LawFirmStats: React.FC<LawFirmStatsProps> = ({
  totalCasesCount,
  activeCasesCount,
  upcomingSessionsCount,
  collectedFeesCount,
  totalFeesCount,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 group hover:shadow-md transition-shadow">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Briefcase className="w-6 h-6" />
        </div>
        <div>
          <p className="text-slate-500 text-sm font-medium">إجمالي القضايا</p>
          <p className="text-2xl font-bold text-slate-800">{totalCasesCount}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 group hover:shadow-md transition-shadow">
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-slate-500 text-sm font-medium">قضايا مرجوة/نشطة</p>
          <p className="text-2xl font-bold text-slate-800">{activeCasesCount}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 group hover:shadow-md transition-shadow">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <p className="text-slate-500 text-sm font-medium">جلسات قادمة</p>
          <p className="text-2xl font-bold text-slate-800">{upcomingSessionsCount}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 group hover:shadow-md transition-shadow">
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
          <DollarSign className="w-6 h-6" />
        </div>
        <div>
          <p className="text-slate-500 text-sm font-medium">الإيرادات المحصلة/الإجمالي</p>
          <p className="text-xl font-bold text-slate-800">
            {collectedFeesCount.toLocaleString()} <span className="text-sm font-normal text-slate-500">/ {totalFeesCount.toLocaleString()}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
