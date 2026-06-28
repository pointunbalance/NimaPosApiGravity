import React from 'react';
import { Users, UserCheck, UserMinus, Clock, AlertTriangle, Briefcase } from 'lucide-react';

interface StatCardsProps {
  enrolledChildren: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  latePaymentsCount: number;
  absentStaffCount: number;
}

export const StatCards: React.FC<StatCardsProps> = ({
  enrolledChildren,
  presentCount,
  absentCount,
  lateCount,
  latePaymentsCount,
  absentStaffCount,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">المسجلين</p>
            <p className="text-2xl font-black text-slate-800">{enrolledChildren}</p>
          </div>
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">حضور اليوم</p>
            <p className="text-2xl font-black text-emerald-600">{presentCount}</p>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">غياب اليوم</p>
            <p className="text-2xl font-black text-rose-600">{absentCount}</p>
          </div>
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
            <UserMinus className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">تأخير الأطفال</p>
            <p className="text-2xl font-black text-amber-600">{lateCount}</p>
          </div>
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">متأخرين في السداد</p>
            <p className="text-2xl font-black text-rose-600">{latePaymentsCount}</p>
          </div>
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">غياب الموظفين</p>
            <p className="text-2xl font-black text-slate-800">{absentStaffCount}</p>
          </div>
          <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};
