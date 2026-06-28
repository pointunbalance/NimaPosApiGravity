import React from 'react';
import { Search, Download, Calendar } from 'lucide-react';

interface QuotationsToolbarProps {
  activeStatusFilter: 'all' | 'pending' | 'accepted' | 'converted' | 'expired';
  setActiveStatusFilter: (status: 'all' | 'pending' | 'accepted' | 'converted' | 'expired') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  dateRange?: 'all' | 'today' | 'week' | 'month';
  setDateRange?: (range: 'all' | 'today' | 'week' | 'month') => void;
  onExport?: () => void;
}

const QuotationsToolbar: React.FC<QuotationsToolbarProps> = ({
  activeStatusFilter,
  setActiveStatusFilter,
  searchTerm,
  setSearchTerm,
  dateRange,
  setDateRange,
  onExport
}) => {
  return (
    <div className="mb-6 flex flex-col md:flex-row gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto">
        {[
          { id: 'all', label: 'الكل' },
          { id: 'pending', label: 'انتظار' },
          { id: 'accepted', label: 'مقبول' },
          { id: 'converted', label: 'تم البيع' },
          { id: 'expired', label: 'منتهي' },
        ].map(opt => (
          <button 
            key={opt.id}
            onClick={() => setActiveStatusFilter(opt.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeStatusFilter === opt.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      
      <div className="relative flex-1 flex gap-2">
        {dateRange && setDateRange && (
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm text-slate-600"
          >
            <option value="all">كل الأوقات</option>
            <option value="today">اليوم</option>
            <option value="week">آخر 7 أيام</option>
            <option value="month">آخر 30 يوم</option>
          </select>
        )}
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="بحث باسم العميل أو رقم العرض..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-12 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm"
          />
        </div>
        {onExport && (
          <button
            onClick={onExport}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-indigo-600 flex items-center justify-center transition-colors"
            title="تصدير إلى CSV"
          >
            <Download className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default QuotationsToolbar;
