import React from 'react';
import { ClipboardCheck, Search, Plus } from 'lucide-react';

interface InventoryCountHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: 'all' | 'draft' | 'in_progress' | 'completed' | 'cancelled';
  setStatusFilter: (status: 'all' | 'draft' | 'in_progress' | 'completed' | 'cancelled') => void;
  onNewSessionClick: () => void;
}

const InventoryCountHeader: React.FC<InventoryCountHeaderProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  onNewSessionClick,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 px-8 py-6 shrink-0 transition-colors">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <ClipboardCheck className="w-8 h-8 text-indigo-600" />
            الجرد الدوري
          </h1>
          <p className="text-slate-500 font-medium mt-2">إدارة جلسات الجرد وتسويات المخزون</p>
        </div>
        <button
          onClick={onNewSessionClick}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
        >
          <Plus className="w-5 h-5" />
          بدء جلسة جرد
        </button>
      </div>

      {/* Filters */}
      <div className="mt-8 flex flex-col md:flex-row gap-4 items-center bg-slate-50 p-3 rounded-2xl border border-slate-100 transition-colors">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="بحث برقم الجلسة أو اسم المخزن..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-12 pl-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-900 placeholder-slate-400"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          {(['all', 'draft', 'in_progress', 'completed', 'cancelled'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                statusFilter === status
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {status === 'all'
                ? 'الكل'
                : status === 'draft'
                ? 'مسودة'
                : status === 'in_progress'
                ? 'قيد التنفيذ'
                : status === 'completed'
                ? 'مكتمل'
                : 'ملغي'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InventoryCountHeader;
