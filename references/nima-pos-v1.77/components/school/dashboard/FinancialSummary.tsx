import React from 'react';
import { Wallet, DollarSign, Activity } from 'lucide-react';

interface FinancialSummaryProps {
  todayRevenue: number;
  todayExpenses: number;
  netToday: number;
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  todayRevenue,
  todayExpenses,
  netToday,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-sky-600 text-white p-6 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-24 h-24 bg-sky-500 rounded-br-full opacity-50 -z-0"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sky-100 font-bold">إيرادات اليوم</p>
            <Wallet className="w-6 h-6 text-sky-200" />
          </div>
          <h3 className="text-4xl font-black">
            {todayRevenue.toLocaleString()}{' '}
            <span className="text-lg font-medium text-sky-200">ج.م</span>
          </h3>
        </div>
      </div>

      <div className="bg-rose-500 text-white p-6 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-24 h-24 bg-rose-400 rounded-br-full opacity-50 -z-0"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-2">
            <p className="text-rose-100 font-bold">مصروفات اليوم</p>
            <DollarSign className="w-6 h-6 text-rose-200" />
          </div>
          <h3 className="text-4xl font-black">
            {todayExpenses.toLocaleString()}{' '}
            <span className="text-lg font-medium text-rose-200">ج.م</span>
          </h3>
        </div>
      </div>

      <div className="bg-emerald-500 text-white p-6 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-24 h-24 bg-emerald-400 rounded-br-full opacity-50 -z-0"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-2">
            <p className="text-emerald-100 font-bold">صافي اليوم</p>
            <Activity className="w-6 h-6 text-emerald-200" />
          </div>
          <h3 className="text-4xl font-black">
            {netToday.toLocaleString()}{' '}
            <span className="text-lg font-medium text-emerald-200">ج.م</span>
          </h3>
        </div>
      </div>
    </div>
  );
};
