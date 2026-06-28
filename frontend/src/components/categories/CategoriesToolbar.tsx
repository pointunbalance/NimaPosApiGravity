import React from 'react';
import { Search, ArrowUpDown } from 'lucide-react';

interface CategoriesToolbarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: 'name-asc' | 'name-desc' | 'count-desc' | 'count-asc';
  setSortBy: (sort: 'name-asc' | 'name-desc' | 'count-desc' | 'count-asc') => void;
}

const CategoriesToolbar: React.FC<CategoriesToolbarProps> = ({
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white/60 backdrop-blur-md p-4 rounded-3xl border border-indigo-100/10 shadow-sm font-['Tajawal']">
      <div className="relative flex-1">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 w-5 h-5 stroke-[2]" />
        <input 
          type="text" 
          placeholder="بحث عن تصنيف..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-4 pr-12 py-3 bg-white/80 border border-indigo-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
        />
      </div>
      <div className="relative min-w-[200px]">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 stroke-[2]" />
        </div>
        <select 
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="w-full pl-4 pr-12 py-3 bg-white/80 border border-indigo-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-black text-sm text-slate-700 appearance-none cursor-pointer"
        >
          <option value="name-asc">الاسم (أ - ي)</option>
          <option value="name-desc">الاسم (ي - أ)</option>
          <option value="count-desc">الأكثر منتجات</option>
          <option value="count-asc">الأقل منتجات</option>
        </select>
      </div>
    </div>
  );
};

export default CategoriesToolbar;
