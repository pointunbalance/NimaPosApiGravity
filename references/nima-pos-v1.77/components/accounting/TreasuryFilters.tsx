import React from "react";
import { Search, Filter } from "lucide-react";
import { TreasuryAccount } from "../../types";

interface TreasuryFiltersProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  filterType: string;
  setFilterType: (val: string) => void;
  filterAccount: string;
  setFilterAccount: (val: string) => void;
  treasuryAccounts: TreasuryAccount[];
  totalInflow: number;
  totalOutflow: number;
}

const TreasuryFilters: React.FC<TreasuryFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  filterAccount,
  setFilterAccount,
  treasuryAccounts,
  totalInflow,
  totalOutflow,
}) => {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-wrap gap-4 items-center justify-between">
      <div className="flex gap-4 flex-1 flex-wrap md:flex-nowrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="ابحث في الحركات أو رقم المرجع..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold outline-none"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-5 h-5 text-slate-400 shrink-0" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold outline-none"
          >
            <option value="all">جميع الحركات</option>
            <option value="inflow">وارد</option>
            <option value="outflow">صادر</option>
            <option value="transfer">تحويل داخلي</option>
          </select>
          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold outline-none"
          >
            <option value="all">جميع الحسابات</option>
            {treasuryAccounts.map((acc) => (
              <option key={acc.id} value={String(acc.id)}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-4 text-sm font-bold">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">إجمالي الوارد:</span>
          <span className="font-bold text-emerald-600">
            {totalInflow.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">إجمالي الصادر:</span>
          <span className="font-bold text-rose-600">
            {totalOutflow.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TreasuryFilters;
