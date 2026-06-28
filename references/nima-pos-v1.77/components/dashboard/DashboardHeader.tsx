import React from 'react';
import { TerminalSquare } from 'lucide-react';

interface DashboardHeaderProps {
  totalPages: number;
  sectionsCount: number;
  tablesCount: number;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  totalPages,
  sectionsCount,
  tablesCount
}) => {
  return (
    <div id="dashboard-hero-header" className="bg-gradient-to-l from-slate-900 to-indigo-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
      <div 
        className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 50%)' }}
      ></div>
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="w-full md:w-1/2">
          <div className="flex items-center gap-3 mb-2">
            <TerminalSquare className="w-8 h-8 text-indigo-400" />
            <h1 className="text-2xl font-black">مستكشف المنظومة</h1>
          </div>
          <p className="text-indigo-200 text-sm">لوحة التحكم السريعة للمطور للوصول لكافة الشاشات والموارد التطويرية.</p>
        </div>
        
        <div className="w-full md:w-1/2 flex justify-end">
          <div className="grid grid-cols-3 gap-2 bg-white/10 rounded-xl p-3 backdrop-blur-md border border-white/10 w-full sm:w-auto">
            <div className="text-center px-4">
              <div id="totalPages-stat" className="text-2xl font-black text-indigo-300 transition-transform duration-200 hover:scale-105">{totalPages}</div>
              <div className="text-[10px] text-indigo-100 font-bold mt-1.5">شاشة مسجلة</div>
            </div>
            <div className="text-center px-4 border-r border-white/20">
              <div id="sectionsCount-stat" className="text-2xl font-black text-emerald-300 transition-transform duration-200 hover:scale-105">{sectionsCount}</div>
              <div className="text-[10px] text-emerald-100 font-bold mt-1.5">قسم رئيسي</div>
            </div>
            <div className="text-center px-4 border-r border-white/20">
              <div id="tablesCount-stat" className="text-2xl font-black text-amber-300 transition-transform duration-200 hover:scale-105">{tablesCount}</div>
              <div className="text-[10px] text-amber-100 font-bold mt-1.5">جدول قواعد بيانات</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
