import React from 'react';
import { Gift, CreditCard, RefreshCw } from 'lucide-react';

interface GiftCardsStatsProps {
  activeCardsCount: number;
  totalBalance: number;
  usedBalance: number;
}

const GiftCardsStats: React.FC<GiftCardsStatsProps> = ({
  activeCardsCount,
  totalBalance,
  usedBalance,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
          <Gift className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">البطاقات النشطة</p>
          <p className="text-2xl font-bold text-slate-900">{activeCardsCount}</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
          <CreditCard className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">إجمالي الرصيد المستحق</p>
          <p className="text-2xl font-bold text-slate-900">{totalBalance.toFixed(2)} ر.س</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
          <RefreshCw className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">إجمالي المستخدَم</p>
          <p className="text-2xl font-bold text-slate-900">{usedBalance.toFixed(2)} ر.س</p>
        </div>
      </div>
    </div>
  );
};

export default GiftCardsStats;
