import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Grid, List, Search, Camera as CameraIcon, Filter } from 'lucide-react';
import { BookingStatus } from '../../types';

interface StudioToolbarProps {
  monthName: string;
  onChangeMonth: (delta: number) => void;
  viewMode: 'calendar' | 'list' | 'cameras';
  onSetViewMode: (mode: 'calendar' | 'list' | 'cameras') => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onToday: () => void;
  statusFilter: BookingStatus | 'all';
  onStatusFilterChange: (status: BookingStatus | 'all') => void;
}

const StudioToolbar: React.FC<StudioToolbarProps> = ({
  monthName,
  onChangeMonth,
  viewMode,
  onSetViewMode,
  searchTerm,
  onSearchChange,
  onToday,
  statusFilter,
  onStatusFilterChange,
}) => {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-none">
        <button onClick={() => onChangeMonth(-1)} className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors border border-slate-100 shrink-0">
          <ChevronRight className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 w-48 justify-center shrink-0">
          <CalendarIcon className="w-5 h-5 text-indigo-500" />
          {monthName}
        </h2>
        <button onClick={onToday} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg font-bold hover:bg-indigo-100 text-sm transition-colors shrink-0">
          اليوم
        </button>
        <button onClick={() => onChangeMonth(1)} className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors border border-slate-100 shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="flex gap-2 w-full md:w-auto shrink-0 justify-center">
        <button
          onClick={() => onSetViewMode('calendar')}
          className={`p-2.5 rounded-xl transition-all border shrink-0 ${viewMode === 'calendar' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}
          title="التقويم"
        >
          <Grid className="w-5 h-5" />
        </button>
        <button
          onClick={() => onSetViewMode('list')}
          className={`p-2.5 rounded-xl transition-all border shrink-0 ${viewMode === 'list' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}
          title="قائمة الحجوزات"
        >
          <List className="w-5 h-5" />
        </button>
        <button
          onClick={() => onSetViewMode('cameras')}
          className={`p-2.5 rounded-xl transition-all border shrink-0 hidden md:block ${viewMode === 'cameras' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}
          title="الكاميرات والمعدات"
        >
          <CameraIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex gap-3 w-full md:w-auto shrink-0 items-center">
        {/* Status Filter */}
        {(viewMode === 'calendar' || viewMode === 'list') && (
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as BookingStatus | 'all')}
              className="appearance-none pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none cursor-pointer transition-all"
            >
              <option value="all">كل الحالات</option>
              <option value="pending">قيد الانتظار</option>
              <option value="confirmed">مؤكد</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 pointer-events-none" />
          </div>
        )}

        {/* Quick Search */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="بحث باسم العميل أو الهاتف..."
            className="w-full pr-4 pl-10 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default StudioToolbar;
