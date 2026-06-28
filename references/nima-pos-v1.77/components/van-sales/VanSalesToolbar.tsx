import React from 'react';
import { Search, Filter } from 'lucide-react';

interface VanSalesToolbarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const VanSalesToolbar: React.FC<VanSalesToolbarProps> = ({
  searchTerm,
  setSearchTerm
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between mb-4">
      <div className="relative flex-1">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="البحث عن مسار أو سائق..."
          className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-sm font-medium transition-colors">
        <Filter className="w-4 h-4" />
        تصفية
      </button>
    </div>
  );
};

export default VanSalesToolbar;
