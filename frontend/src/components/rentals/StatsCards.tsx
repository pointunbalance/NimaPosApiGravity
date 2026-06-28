import React from 'react';
import { Briefcase, CalendarClock, AlertCircle, ShieldCheck } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    active: number;
    upcoming: number;
    late: number;
    depositsHeld: number;
  };
  formatCurrency: (amount: number) => string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, formatCurrency }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 relative overflow-hidden shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
        <div className="absolute top-0 right-0 w-2 h-full bg-blue-500"></div>
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100">
          <Briefcase className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-bold mb-1">في الخارج</p>
          <p className="text-2xl font-black text-slate-800">{stats.active}</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 relative overflow-hidden shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
        <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 border border-amber-100">
          <CalendarClock className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-bold mb-1">حجوزات قادمة</p>
          <p className="text-2xl font-black text-slate-800">{stats.upcoming}</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 relative overflow-hidden shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
        <div className="absolute top-0 right-0 w-2 h-full bg-red-500"></div>
        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shrink-0 border border-red-100">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-bold mb-1">متأخر الإرجاع</p>
          <p className="text-2xl font-black text-red-600">{stats.late}</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 relative overflow-hidden shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
        <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>
        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-100">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-bold mb-1">تأمينات محتجزة</p>
          <p className="text-2xl font-black text-slate-800">{formatCurrency(stats.depositsHeld)}</p>
        </div>
      </div>
    </div>
  );
};
