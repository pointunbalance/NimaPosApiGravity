import React from 'react';
import { Download, Printer } from 'lucide-react';

interface ReportsHeaderProps {
  dateRange: 'today' | 'week' | 'month' | 'year';
  setDateRange: (range: 'today' | 'week' | 'month' | 'year') => void;
  customStartDate: string;
  setCustomStartDate: (date: string) => void;
  customEndDate: string;
  setCustomEndDate: (date: string) => void;
  isCustomDate: boolean;
  setIsCustomDate: (isCustom: boolean) => void;
  handleExport: () => void;
  handlePrint: () => void;
}

const ReportsHeader: React.FC<ReportsHeaderProps> = ({
  dateRange,
  setDateRange,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  isCustomDate,
  setIsCustomDate,
  handleExport,
  handlePrint
}) => {
  return (
    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 mb-2">التقارير والتحليلات</h1>
        <p className="text-slate-500">نظرة شاملة على الأداء المالي، المخزون، وسلوك المبيعات</p>
      </div>
      
      {/* Controls - Hidden on Print */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 print:hidden">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {(['today', 'week', 'month', 'year'] as const).map(range => (
            <button
              key={range}
              onClick={() => { setDateRange(range); setIsCustomDate(false); }}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${!isCustomDate && dateRange === range ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {range === 'today' && 'اليوم'}
              {range === 'week' && 'أسبوع'}
              {range === 'month' && 'شهر'}
              {range === 'year' && 'سنة'}
            </button>
          ))}
        </div>
        <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
        <div className="flex items-center gap-2">
          <input 
            type="date" 
            value={customStartDate} 
            onChange={(e) => { setCustomStartDate(e.target.value); setIsCustomDate(true); }} 
            className="text-xs font-bold text-slate-600 outline-none bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 color-scheme-light"
          />
          <span className="text-slate-400">-</span>
          <input 
            type="date" 
            value={customEndDate} 
            onChange={(e) => { setCustomEndDate(e.target.value); setIsCustomDate(true); }} 
            className="text-xs font-bold text-slate-600 outline-none bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 color-scheme-light"
          />
        </div>
        <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
        <button 
          onClick={handleExport} 
          className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors" 
          title="تصدير Excel"
        >
          <Download className="w-5 h-5" />
        </button>
        <button 
          onClick={handlePrint} 
          className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer" 
          title="طباعة"
        >
          <Printer className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ReportsHeader;
