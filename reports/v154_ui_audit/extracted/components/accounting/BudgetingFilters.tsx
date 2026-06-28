import React from 'react';
import { Search } from 'lucide-react';

interface BudgetingFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const BudgetingFilters: React.FC<BudgetingFiltersProps> = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 mb-6 flex items-center gap-4">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 w-5 h-5" />
        <input 
          type="text" 
          placeholder="بحث باسم الموازنة..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-4 pr-12 py-3 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
        />
      </div>
    </div>
  );
};

export default BudgetingFilters;
