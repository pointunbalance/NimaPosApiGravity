import React from 'react';
import { Search } from 'lucide-react';

interface PettyCashFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const PettyCashFilters: React.FC<PettyCashFiltersProps> = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex items-center gap-4">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="بحث باسم الموظف أو البيان..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
        />
      </div>
    </div>
  );
};

export default PettyCashFilters;
