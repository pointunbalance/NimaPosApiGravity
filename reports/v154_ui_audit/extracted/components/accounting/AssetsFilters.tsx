import React from 'react';
import { Search, Filter } from 'lucide-react';

interface AssetsFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterCategory: string;
  setFilterCategory: (category: string) => void;
}

const AssetsFilters: React.FC<AssetsFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterCategory,
  setFilterCategory
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 mb-6 flex flex-col md:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 w-5 h-5" />
        <input 
          type="text" 
          placeholder="بحث باسم الأصل، الرقم التسلسلي..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-4 pr-12 py-2.5 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm dark:text-white"
        />
      </div>
      <div className="relative">
        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 w-4 h-4 pointer-events-none" />
        <select 
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm appearance-none cursor-pointer dark:text-white"
        >
          <option value="all">كل الفئات</option>
          <option value="equipment">معدات</option>
          <option value="electronics">إلكترونيات</option>
          <option value="furniture">أثاث</option>
          <option value="vehicles">سيارات</option>
          <option value="buildings">مباني</option>
        </select>
      </div>
    </div>
  );
};

export default AssetsFilters;
