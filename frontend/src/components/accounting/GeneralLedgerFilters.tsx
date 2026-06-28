import React from 'react';
import { ChevronDown, Calendar, Search, Activity } from 'lucide-react';
import { Account, CostCenter } from '../../types';

interface GeneralLedgerFiltersProps {
  accounts: Account[] | undefined;
  costCenters?: CostCenter[] | undefined;
  selectedAccountId: number | '';
  setSelectedAccountId: (id: number | '') => void;
  selectedCostCenterId?: number | '';
  setSelectedCostCenterId?: (id: number | '') => void;
  dateRange: { start: string; end: string };
  setDateRange: (range: { start: string; end: string }) => void;
  setQuickDate: (type: 'today' | 'month' | 'year' | 'all') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  showChart: boolean;
  setShowChart: (show: boolean) => void;
}

export const GeneralLedgerFilters: React.FC<GeneralLedgerFiltersProps> = ({
  accounts,
  costCenters,
  selectedAccountId,
  setSelectedAccountId,
  selectedCostCenterId,
  setSelectedCostCenterId,
  dateRange,
  setDateRange,
  setQuickDate,
  searchTerm,
  setSearchTerm,
  showChart,
  setShowChart
}) => {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-8 print:hidden">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Account Select */}
        <div className="md:col-span-4">
          <label className="block text-sm font-bold text-slate-700 mb-2">الحساب المطلوب</label>
          <div className="relative">
            <select 
              value={selectedAccountId}
              onChange={e => setSelectedAccountId(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 appearance-none cursor-pointer transition-all hover:bg-white"
            >
              <option value="">اختر الحساب...</option>
              {accounts?.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.code} - {acc.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Cost Center Select */}
        {setSelectedCostCenterId && (
          <div className="md:col-span-3">
            <label className="block text-sm font-bold text-slate-700 mb-2">مركز التكلفة (اختياري)</label>
            <div className="relative">
              <select 
                value={selectedCostCenterId}
                onChange={e => setSelectedCostCenterId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 appearance-none cursor-pointer transition-all hover:bg-white"
              >
                <option value="">الكل...</option>
                {costCenters?.map(cc => (
                  <option key={cc.id} value={cc.id}>
                    {cc.code} - {cc.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Date Range */}
        <div className={setSelectedCostCenterId ? "md:col-span-5" : "md:col-span-8"}>
          <div className="flex justify-between items-end mb-2">
            <label className="block text-sm font-bold text-slate-700">الفترة الزمنية</label>
            <div className="flex gap-1">
              <button onClick={() => setQuickDate('today')} className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors">اليوم</button>
              <button onClick={() => setQuickDate('month')} className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors">هذا الشهر</button>
              <button onClick={() => setQuickDate('year')} className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors">هذا العام</button>
              <button onClick={() => setQuickDate('all')} className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors">الكل</button>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white transition-all">
            <Calendar className="w-5 h-5 text-slate-400 ml-2" />
            <input 
              type="date" 
              value={dateRange.start}
              onChange={e => setDateRange({...dateRange, start: e.target.value})}
              className="flex-1 bg-transparent py-3 text-center font-bold text-slate-700 outline-none [color-scheme:light]"
            />
            <span className="text-slate-300">إلى</span>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={e => setDateRange({...dateRange, end: e.target.value})}
              className="flex-1 bg-transparent py-3 text-center font-bold text-slate-700 outline-none [color-scheme:light]"
            />
          </div>
        </div>
      </div>
      
      {/* Secondary Filter Row */}
      {selectedAccountId && (
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="بحث في الشرح أو رقم المرجع..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all hover:bg-white text-slate-700"
            />
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowChart(!showChart)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${showChart ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <Activity className="w-4 h-4" />
              {showChart ? 'إخفاء الرسم البياني' : 'عرض الرسم البياني'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
