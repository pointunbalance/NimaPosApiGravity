import React from "react";
import { Search, Calendar } from "lucide-react";

interface CostCentersFiltersProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  dateRange: { start: string; end: string };
  setDateRange: (val: { start: string; end: string }) => void;
  setQuickFilter: (filter: string) => void;
}

const CostCentersFilters: React.FC<CostCentersFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  dateRange,
  setDateRange,
  setQuickFilter,
}) => {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col xl:flex-row gap-4 justify-between items-center print:hidden">
      <div className="relative flex-1 w-full xl:w-auto">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="بحث باسم المركز أو الكود..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-4 pr-12 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setQuickFilter("thisMonth")}
            className="px-3 py-1.5 text-xs font-bold rounded-lg hover:bg-white hover:shadow-sm transition-all text-slate-600"
          >
            هذا الشهر
          </button>
          <button
            onClick={() => setQuickFilter("lastMonth")}
            className="px-3 py-1.5 text-xs font-bold rounded-lg hover:bg-white hover:shadow-sm transition-all text-slate-600"
          >
            الشهر السابق
          </button>
          <button
            onClick={() => setQuickFilter("thisYear")}
            className="px-3 py-1.5 text-xs font-bold rounded-lg hover:bg-white hover:shadow-sm transition-all text-slate-600"
          >
            هذا العام
          </button>
          <button
            onClick={() => setQuickFilter("allTime")}
            className="px-3 py-1.5 text-xs font-bold rounded-lg hover:bg-white hover:shadow-sm transition-all text-slate-600"
          >
            كل الوقت
          </button>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 flex-1 sm:flex-none justify-center">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange({ ...dateRange, start: e.target.value })
            }
            className="bg-transparent text-sm font-bold outline-none text-slate-700 w-28 [color-scheme:light]"
          />
          <span className="text-slate-300">إلى</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange({ ...dateRange, end: e.target.value })
            }
            className="bg-transparent text-sm font-bold outline-none text-slate-700 w-28 [color-scheme:light]"
          />
        </div>
      </div>
    </div>
  );
};

export default CostCentersFilters;
