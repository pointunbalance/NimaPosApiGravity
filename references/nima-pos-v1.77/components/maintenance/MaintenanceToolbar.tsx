import React from 'react';
import { Search, Calendar } from 'lucide-react';
import { MaintenanceStatus } from '../../types';

interface MaintenanceToolbarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterStatus: MaintenanceStatus | 'all';
  setFilterStatus: (status: MaintenanceStatus | 'all') => void;
  statusMap: Record<MaintenanceStatus, { label: string; color: string; icon: React.ReactNode }>;
  dateFilter: string;
  setDateFilter: (date: string) => void;
}

const MaintenanceToolbar: React.FC<MaintenanceToolbarProps> = ({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  statusMap,
  dateFilter,
  setDateFilter
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="بحث برقم الهاتف، اسم العميل، أو الموديل..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
        />
      </div>
      <div className="flex gap-2">
        <div className="relative">
          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border border-slate-200 rounded-xl pr-10 pl-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none"
        >
          <option value="all">جميع الحالات</option>
          {Object.entries(statusMap).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default MaintenanceToolbar;
