import React from 'react';
import { Activity, RefreshCw, Download, FileText, AlertTriangle } from 'lucide-react';
import { formatCurrency } from './logbookUtils';

interface LogbookHeaderProps {
  dashboardStats: {
    totalToday: number;
    errorsToday: number;
    volumeToday: number;
  };
  onRefresh: () => void;
  onExport: () => void;
}

const LogbookHeader: React.FC<LogbookHeaderProps> = ({ dashboardStats, onRefresh, onExport }) => {
  return (
    <div className="bg-white border-b border-gray-200 px-8 py-6 shrink-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-600" />
            سجل العمليات (Logbook)
          </h1>
          <p className="text-gray-500 text-sm mt-1">تتبع نشاط النظام، الأخطاء، والحركات المالية</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onRefresh} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="تحديث">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button onClick={onExport} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50 font-bold shadow-sm text-sm">
            <Download className="w-4 h-4" />
            <span>تصدير CSV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between group hover:border-indigo-100 transition-colors">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">نشاط اليوم</p>
            <h3 className="text-2xl font-black text-slate-800">{dashboardStats.totalToday}</h3>
          </div>
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-400 shadow-sm group-hover:text-indigo-600 transition-colors">
            <FileText className="w-5 h-5" />
          </div>
        </div>
        <div className={`p-4 rounded-xl border flex items-center justify-between group transition-colors ${dashboardStats.errorsToday > 0 ? 'bg-red-50 border-red-100 hover:border-red-200' : 'bg-slate-50 border-slate-100'}`}>
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${dashboardStats.errorsToday > 0 ? 'text-red-600' : 'text-slate-500'}`}>أخطاء النظام (اليوم)</p>
            <h3 className={`text-2xl font-black ${dashboardStats.errorsToday > 0 ? 'text-red-700' : 'text-slate-800'}`}>{dashboardStats.errorsToday}</h3>
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm transition-colors ${dashboardStats.errorsToday > 0 ? 'bg-white text-red-500' : 'bg-white text-slate-400'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between group hover:border-emerald-100 transition-colors">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">حجم العمليات (اليوم)</p>
            <h3 className="text-2xl font-black text-slate-800">{formatCurrency(dashboardStats.volumeToday)}</h3>
          </div>
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-400 shadow-sm group-hover:text-emerald-600 transition-colors">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogbookHeader;
