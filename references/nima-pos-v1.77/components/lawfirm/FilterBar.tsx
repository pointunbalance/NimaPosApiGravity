import React from 'react';
import { Search, Plus } from 'lucide-react';

interface FilterBarProps {
  activeTab: 'cases' | 'sessions';
  search: string;
  setSearch: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  onAdd: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  activeTab,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  onAdd,
}) => {
  return (
    <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
      <div className="flex w-full md:w-auto items-center gap-3 flex-1">
        <div className="relative w-full max-w-md">
          <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder={activeTab === 'cases' ? "بحث برقم أو موضوع القضية..." : "بحث في الجلسات..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-10 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-600"
        >
          <option value="all">كل الحالات</option>
          {activeTab === 'cases' ? (
            <>
              <option value="active">نشطة</option>
              <option value="won">رابحة</option>
              <option value="lost">خاسرة</option>
              <option value="suspended">معلقة</option>
              <option value="closed">مغلقة</option>
            </>
          ) : (
            <>
              <option value="upcoming">جلسات قادمة</option>
              <option value="completed">منتهية/تمت</option>
              <option value="postponed">مؤجلة</option>
              <option value="cancelled">ملغاة</option>
            </>
          )}
        </select>
      </div>
      <button
        onClick={onAdd}
        className="flex items-center justify-center w-full md:w-auto gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-sm font-bold whitespace-nowrap"
      >
        <Plus className="w-5 h-5" />
        {activeTab === 'cases' ? 'إضافة قضية' : 'إضافة جلسة'}
      </button>
    </div>
  );
};
