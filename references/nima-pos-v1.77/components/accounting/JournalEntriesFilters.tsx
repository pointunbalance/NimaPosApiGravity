import React from 'react';
import { Search } from 'lucide-react';

interface JournalEntriesFiltersProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  statusFilter: 'all' | 'posted' | 'draft';
  setStatusFilter: (val: 'all' | 'posted' | 'draft') => void;
  dateRange: { start: string; end: string };
  setDateRange: (val: { start: string; end: string }) => void;
  setQuickDate: (type: 'today' | 'month' | 'year' | 'all') => void;
}

export const JournalEntriesFilters: React.FC<JournalEntriesFiltersProps> = ({
  searchTerm, setSearchTerm, statusFilter, setStatusFilter, dateRange, setDateRange, setQuickDate
}) => {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 print:hidden">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="relative md:col-span-2">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="بحث بالوصف، المرجع، أو رقم القيد..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
          />
        </div>
        
        <div className="flex bg-white border border-slate-200 p-1 rounded-xl">
          {['all', 'posted', 'draft'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s as any)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${statusFilter === s ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {s === 'all' ? 'الكل' : s === 'posted' ? 'مرحل' : 'مسودة'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2">
          <input 
            type="date" 
            value={dateRange.start}
            onChange={e => setDateRange({...dateRange, start: e.target.value})}
            className="bg-transparent py-2 text-xs font-bold text-slate-600 outline-none w-full text-center [color-scheme:light]"
          />
          <span className="text-slate-300">|</span>
          <input 
            type="date" 
            value={dateRange.end}
            onChange={e => setDateRange({...dateRange, end: e.target.value})}
            className="bg-transparent py-2 text-xs font-bold text-slate-600 outline-none w-full text-center [color-scheme:light]"
          />
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setQuickDate('today')} className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">اليوم</button>
        <button onClick={() => setQuickDate('month')} className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">هذا الشهر</button>
        <button onClick={() => setQuickDate('year')} className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">هذه السنة</button>
        <button onClick={() => setQuickDate('all')} className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">كل الفترات</button>
      </div>
    </div>
  );
};
