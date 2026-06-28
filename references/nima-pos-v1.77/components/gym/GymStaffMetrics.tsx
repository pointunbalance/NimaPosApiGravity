import React from 'react';
import { UserCircle, Briefcase, FileText } from 'lucide-react';

interface GymStaffMetricsProps {
  totalStaffCount: number;
  activeStaff: number;
  suspendedStaff: number;
}

export const GymStaffMetrics: React.FC<GymStaffMetricsProps> = ({
  totalStaffCount,
  activeStaff,
  suspendedStaff,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 text-right font-sans" dir="rtl">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-205 flex items-center gap-4 flex-row-reverse">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
          <UserCircle className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-500 font-bold">إجمالي الموظفين</p>
          <p className="text-xl font-bold text-slate-800 font-mono mt-0.5">{totalStaffCount}</p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-205 flex items-center gap-4 flex-row-reverse">
        <div className="p-3 bg-green-50 text-green-600 rounded-lg">
          <Briefcase className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-500 font-bold">الموظفين النشطين</p>
          <p className="text-xl font-bold text-slate-800 font-mono mt-0.5">{activeStaff}</p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-205 flex items-center gap-4 flex-row-reverse">
        <div className="p-3 bg-red-50 text-red-600 rounded-lg">
          <FileText className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-500 font-bold">موقوف / مجاز</p>
          <p className="text-xl font-bold text-slate-800 font-mono mt-0.5">{suspendedStaff}</p>
        </div>
      </div>
    </div>
  );
};

export default GymStaffMetrics;
