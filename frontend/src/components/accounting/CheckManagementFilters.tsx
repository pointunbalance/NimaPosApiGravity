import React from 'react';
import { Search, Calendar, TrendingUp, TrendingDown } from 'lucide-react';

interface CheckManagementFiltersProps {
  activeTab: 'receivable' | 'payable';
  setActiveTab: (tab: 'receivable' | 'payable') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  dateRange: { start: string; end: string };
  setDateRange: (range: { start: string; end: string }) => void;
  statusFilter: 'all' | 'pending' | 'cleared' | 'bounced' | 'overdue';
  setStatusFilter: (status: 'all' | 'pending' | 'cleared' | 'bounced' | 'overdue') => void;
}

const CheckManagementFilters: React.FC<CheckManagementFiltersProps> = ({
  activeTab, setActiveTab, searchTerm, setSearchTerm, dateRange, setDateRange, statusFilter, setStatusFilter
}) => {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 print:hidden">
      <div className="flex gap-4 border-b border-slate-100 pb-4 mb-4">
        <button 
          onClick={() => setActiveTab('receivable')}
          className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'receivable' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-white text-gray-400 hover:bg-slate-50'}`}
        >
          <TrendingUp className="w-5 h-5" /> أوراق قبض (وارد)
        </button>
        <button 
          onClick={() => setActiveTab('payable')}
          className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'payable' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-100 bg-white text-gray-400 hover:bg-slate-50'}`}
        >
          <TrendingDown className="w-5 h-5" /> أوراق دفع (صادر)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="بحث برقم الشيك، البنك، أو المستفيد..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm font-bold text-sm"
          />
        </div>
        
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="bg-transparent py-2 text-xs font-bold outline-none w-full text-center [color-scheme:light]" />
          <span className="text-slate-300">|</span>
          <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="bg-transparent py-2 text-xs font-bold outline-none w-full text-center [color-scheme:light]" />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none cursor-pointer"
        >
          <option value="pending">تحت التحصيل</option>
          <option value="overdue">متأخرة السداد</option>
          <option value="cleared">تم التحصيل</option>
          <option value="bounced">مرتجع</option>
          <option value="all">كل الحالات</option>
        </select>
      </div>
    </div>
  );
};

export default CheckManagementFilters;
