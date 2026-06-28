import React from 'react';
import { Search, Trash2, Clock, CheckCircle2, UserMinus, Plus } from 'lucide-react';
import { AccessLogType } from './accessTypes';

interface AccessScanLogTableProps {
  search: string;
  setSearch: (val: string) => void;
  filteredRecords: AccessLogType[];
  onDeleteLog: (id: number) => void;
  onManualLog: () => void;
}

export const AccessScanLogTable: React.FC<AccessScanLogTableProps> = ({
  search,
  setSearch,
  filteredRecords,
  onDeleteLog,
  onManualLog
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4 text-right font-sans" dir="rtl">
      
      {/* Search Header and filters */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 flex-row-reverse text-right">
        <div className="flex items-center gap-2 flex-row-reverse justify-end">
          <button
            onClick={onManualLog}
            className="px-4 py-2 bg-indigo-650 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-1 cursor-pointer text-right"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل قيد حركة يدوية</span>
          </button>
        </div>

        <div className="relative flex-1 max-w-sm w-full">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في سجلات العبور اللحظية..." 
            className="w-full pr-9 pl-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold text-right"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3.5 flex-row-reverse text-right pb-1.5 border-b border-slate-100">
        <Clock className="w-5 h-5 text-indigo-600 animate-pulse" />
        <h3 className="font-black text-sm text-slate-800">سجل عمليات العبور اللحظي بالبوابات</h3>
      </div>

      {/* Raw log table */}
      <div className="overflow-x-auto text-[11px] whitespace-nowrap">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200">
              <th className="px-4 py-3 font-bold text-slate-700 text-right">المشترك / اللاعب</th>
              <th className="px-4 py-3 font-bold text-slate-700 text-right">وقت الحدوث</th>
              <th className="px-4 py-3 font-bold text-slate-705 text-right">نوع الحركة</th>
              <th className="px-4 py-3 font-bold text-slate-707 text-right">أداة المصادقة</th>
              <th className="px-4 py-3 font-bold text-slate-709 text-center">حملة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-11 text-center font-bold text-slate-400">
                  لا توجد حركات حضور أو مغادرة مقيدة تطابق البحث حتى الآن.
                </td>
              </tr>
            ) : (
              filteredRecords.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/40 transition-colors font-semibold text-slate-700">
                  <td className="px-4 py-3.5">
                    <span className="block font-black text-slate-800 text-xs text-right">{log.memberId}</span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-500 text-right">{log.timestamp}</td>
                  <td className="px-4 py-3.5 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-lg text-[9px] font-black ${
                      log.type === 'دخول' 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-100/60' 
                        : 'bg-amber-50 text-amber-800 border border-amber-100/60'
                    }`}>
                      {log.type === 'دخول' ? '🟢 دخول محقق' : '🟡 خروج ومغادرة'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-slate-500 text-[10px] bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md font-bold">
                      {log.method}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button
                      onClick={() => onDeleteLog(log.id!)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all cursor-pointer inline-block"
                      title="شطب السند"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
