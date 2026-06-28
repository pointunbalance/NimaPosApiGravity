import React from 'react';
import { Search } from 'lucide-react';
import { AccountType } from '../../types';
import { getTypeLabel } from './ChartOfAccountsHelpers';

interface ChartOfAccountsFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeTypeFilter: AccountType | 'all';
  setActiveTypeFilter: (type: AccountType | 'all') => void;
}

export const ChartOfAccountsFilters: React.FC<ChartOfAccountsFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  activeTypeFilter,
  setActiveTypeFilter
}) => {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="relative w-full lg:w-1/3">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="بحث بالكود أو الاسم..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 no-scrollbar">
          <button 
            onClick={() => setActiveTypeFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeTypeFilter === 'all' ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            الكل
          </button>
          {(['asset', 'liability', 'equity', 'revenue', 'expense'] as AccountType[]).map((t) => {
            const style = getTypeLabel(t);
            const isActive = activeTypeFilter === t;
            return (
              <button
                key={t}
                onClick={() => setActiveTypeFilter(t)}
                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap flex items-center gap-2 transition-all border ${isActive ? style.color + ' shadow-sm border-transparent' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                <style.icon className="w-4 h-4" />
                {style.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
