import React from 'react';
import { Users } from 'lucide-react';

interface StaffTabProps {
  staffStats: any[];
  formatCurrency: (amount: number) => string;
}

const StaffTab: React.FC<StaffTabProps> = ({ staffStats, formatCurrency }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-slate-800">أداء فريق المبيعات</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffStats.map((staff, idx) => (
            <div key={idx} className="border border-slate-100 rounded-2xl p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-bl-full -mr-8 -mt-8 group-hover:bg-indigo-100 transition-colors"></div>
              <div className="relative z-10 flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-lg text-slate-600 border-2 border-white shadow-sm">
                  {staff.name.substring(0, 1)}
                </div>
                <div>
                  <h4 className="font-bold text-lg text-slate-800">{staff.name}</h4>
                  <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded">كاشير</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">إجمالي المبيعات</span>
                  <span className="font-bold text-indigo-600">{formatCurrency(staff.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">عدد الفواتير</span>
                  <span className="font-bold text-slate-700">{staff.orders}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">متوسط الفاتورة</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(staff.orders > 0 ? staff.total / staff.orders : 0)}</span>
                </div>
              </div>
            </div>
          ))}
          {staffStats.length === 0 && <div className="col-span-3 text-center py-10 text-slate-400">لا توجد بيانات موظفين</div>}
        </div>
      </div>
    </div>
  );
};

export default StaffTab;
