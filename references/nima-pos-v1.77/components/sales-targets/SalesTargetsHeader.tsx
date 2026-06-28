import React from 'react';
import { Target, Plus, RefreshCw, Download } from 'lucide-react';

interface SalesTargetsHeaderProps {
  timeframe: string;
  setTimeframe: (timeframe: string) => void;
  onAddClick: () => void;
  onSyncClick: () => void;
  onExportClick: () => void;
}

const SalesTargetsHeader: React.FC<SalesTargetsHeaderProps> = ({
  timeframe,
  setTimeframe,
  onAddClick,
  onSyncClick,
  onExportClick
}) => {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
      <div className="flex items-center gap-4">
        <div className="p-3.5 bg-indigo-100 text-indigo-600 rounded-2xl shadow-sm">
          <Target size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">أهداف المبيعات</h1>
          <p className="text-slate-500 font-medium mt-1">تحديد ومتابعة أهداف المبيعات للموظفين</p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
        <div className="flex bg-slate-100/80 rounded-xl p-1.5">
          <button 
            className={`flex-1 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${timeframe === 'month' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
            onClick={() => setTimeframe('month')}
          >
            شهري
          </button>
          <button 
            className={`flex-1 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${timeframe === 'quarter' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
            onClick={() => setTimeframe('quarter')}
          >
            ربع سنوي
          </button>
          <button 
            className={`flex-1 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${timeframe === 'year' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
            onClick={() => setTimeframe('year')}
          >
            سنوي
          </button>
        </div>
        
        <button 
          onClick={onSyncClick}
          className="px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 flex items-center justify-center gap-2 text-sm font-bold transition-colors border border-emerald-200"
          title="تحديث المحقق من المبيعات الفعلية"
        >
          <RefreshCw className="w-4 h-4" />
          تحديث 
        </button>

        <button 
          onClick={onExportClick}
          className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:text-indigo-600 flex items-center justify-center gap-2 text-sm font-bold transition-colors shadow-sm"
          title="تصدير إلى CSV"
        >
          <Download className="w-4 h-4" />
          تصدير
        </button>

        <button 
          onClick={onAddClick}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-sm"
        >
          <Plus className="w-5 h-5" />
          إضافة هدف
        </button>
      </div>
    </div>
  );
};

export default SalesTargetsHeader;
