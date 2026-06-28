import React from 'react';
import { Database } from 'lucide-react';

interface TableCountItem {
  name: string;
  count: number;
}

interface DashboardTableStatusProps {
  tableCounts: TableCountItem[];
}

export const DashboardTableStatus: React.FC<DashboardTableStatusProps> = ({ tableCounts }) => {
  return (
    <div id="dashboard-db-tables-status" className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-auto overflow-hidden hidden xl:flex">
      <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Database className="w-4 h-4 text-emerald-500" />
          حالة الجداول وقواعد البيانات
        </div>
      </div>
      <div className="p-2 flex-1 overflow-y-auto max-h-[350px] custom-scrollbar">
        <div className="space-y-1 text-xs" dir="rtl">
          {tableCounts.map((t) => (
            <div 
              key={t.name} 
              className="flex justify-between items-center px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 rounded-lg transition-colors" 
              dir="rtl"
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className={`w-2 h-2 rounded-full ${t.count > 0 ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                <span className="font-extrabold text-slate-800 font-mono text-[12px] truncate select-all" dir="ltr">{t.name}</span>
              </div>
              <span className={`font-mono font-black px-2.5 py-1 rounded-lg border text-xs shrink-0 ${
                t.count > 0 
                  ? 'bg-[#DEF7EC] text-[#03543F] border-emerald-200 shadow-sm' 
                  : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}>
                {t.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
