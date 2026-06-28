import React from 'react';
import { FileText } from 'lucide-react';

interface TripSummaryTabProps {
  stats: {
    totalRevenues: number;
    totalExpenses: number;
    profit: number;
    transportation: number;
    additional: number;
  };
  tripParticipants: any[];
}

export const TripSummaryTab: React.FC<TripSummaryTabProps> = ({ stats, tripParticipants }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-right">
          <p className="text-xs text-emerald-700 font-bold mb-1">إجمالي الإيرادات (المحصلة)</p>
          <p className="text-2xl font-black text-emerald-800 font-mono">
            {stats.totalRevenues} <span className="text-sm">ج.م</span>
          </p>
        </div>
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 text-right">
          <p className="text-xs text-rose-700 font-bold mb-1">إجمالي المصاريف</p>
          <p className="text-2xl font-black text-rose-800 font-mono">
            {stats.totalExpenses} <span className="text-sm">ج.م</span>
          </p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 text-right">
          <p className="text-xs text-indigo-700 font-bold mb-1">صافي الربح / الفائض</p>
          <p
            className={`text-2xl font-black font-mono ${
              stats.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            {stats.profit} <span className="text-sm">ج.م</span>
          </p>
        </div>
      </div>

      <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50 space-y-3">
        <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-1.5 text-sm">
          <FileText className="w-4 h-4 text-slate-400" /> تحليل تفاصيل النفقات والاشتراكات
        </h4>
        <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-600 font-medium">
          <p>تكلفة النقل والمواصلات:</p>
          <p className="font-bold text-slate-800 font-mono">{stats.transportation} ج.م</p>

          <p>المصروفات الإضافية والمسليات:</p>
          <p className="font-bold text-slate-800 font-mono">{stats.additional} ج.م</p>

          <p>عدد الأطفال المسجلين بالرحلة:</p>
          <p className="font-bold text-indigo-600">{tripParticipants.length} طفل</p>

          <p>نسبة حضور الأطفال الفعلي:</p>
          <p className="font-bold text-emerald-600">
            {tripParticipants.filter((p: any) => p.attended).length} / {tripParticipants.length} ({tripParticipants.length ? Math.round((tripParticipants.filter((p: any) => p.attended).length / tripParticipants.length) * 100) : 0}%)
          </p>
        </div>
      </div>
    </div>
  );
};
