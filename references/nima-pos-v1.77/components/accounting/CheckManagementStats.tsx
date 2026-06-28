import React from 'react';
import { ArrowUpRight, ArrowDownLeft, AlertTriangle, Clock } from 'lucide-react';

interface CheckManagementStatsProps {
  stats: {
    incoming: number;
    outgoing: number;
    overdueCount: number;
    overdueAmount: number;
  };
  formatCurrency: (amount: number) => string;
}

const CheckManagementStats: React.FC<CheckManagementStatsProps> = ({ stats, formatCurrency }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print:hidden">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex justify-between items-center relative overflow-hidden">
        <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-emerald-50 to-transparent"></div>
        <div>
          <p className="text-emerald-600 text-xs font-bold uppercase mb-1">وارد متوقع (تحت التحصيل)</p>
          <h3 className="text-2xl font-black text-emerald-800">{formatCurrency(stats.incoming)}</h3>
        </div>
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 z-10"><ArrowDownLeft className="w-6 h-6"/></div>
      </div>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 flex justify-between items-center relative overflow-hidden">
        <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-red-50 to-transparent"></div>
        <div>
          <p className="text-red-600 text-xs font-bold uppercase mb-1">صادر مستحق (دفعات)</p>
          <h3 className="text-2xl font-black text-red-800">{formatCurrency(stats.outgoing)}</h3>
        </div>
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 z-10"><ArrowUpRight className="w-6 h-6"/></div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 flex justify-between items-center relative overflow-hidden">
        <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-orange-50 to-transparent"></div>
        <div>
          <p className="text-orange-600 text-xs font-bold uppercase mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> شيكات متأخرة ({stats.overdueCount})</p>
          <h3 className="text-2xl font-black text-orange-800">{formatCurrency(stats.overdueAmount)}</h3>
        </div>
        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 z-10"><Clock className="w-6 h-6"/></div>
      </div>
    </div>
  );
};

export default CheckManagementStats;
