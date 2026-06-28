import React from 'react';
import { ClipboardX, Download, Plus, Calculator, TrendingDown, History, Search, Filter } from 'lucide-react';
import { Warehouse } from '../../types';

interface StockAdjustmentsHeaderProps {
  stats: {
    totalCount: number;
    netChange: number;
    totalLossValue: number;
  };
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterWarehouse: string;
  setFilterWarehouse: (warehouseId: string) => void;
  filterReason: string;
  setFilterReason: (reason: string) => void;
  dateRange: { start: string; end: string };
  setDateRange: (range: { start: string; end: string }) => void;
  warehouses: Warehouse[] | undefined;
  onExportCSV: () => void;
  onNewSessionClick: () => void;
  formatCurrency: (amount: number) => string;
}

const StockAdjustmentsHeader: React.FC<StockAdjustmentsHeaderProps> = ({
  stats,
  searchTerm,
  setSearchTerm,
  filterWarehouse,
  setFilterWarehouse,
  filterReason,
  setFilterReason,
  dateRange,
  setDateRange,
  warehouses,
  onExportCSV,
  onNewSessionClick,
  formatCurrency,
}) => {
  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <ClipboardX className="w-5 h-5" />
            </span>
            <h1 className="text-3xl font-bold text-gray-800">تسوية المخزون</h1>
          </div>
          <p className="text-gray-500">ضبط الكميات، معالجة التالف، ومطابقة الجرد الفعلي</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onExportCSV}
            className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors font-bold shadow-sm"
          >
            <Download className="w-5 h-5" />
            <span>تصدير Excel</span>
          </button>
          <button
            onClick={onNewSessionClick}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-200 font-bold hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            <span>جلسة جرد جديدة</span>
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.1)] flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">صافي الحركات</p>
            <h3 className={`text-3xl font-black ${stats.netChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`} dir="ltr">
              {stats.netChange > 0 ? '+' : ''}
              {stats.netChange}
            </h3>
            <p className="text-xs text-slate-400 mt-1">قطعة</p>
          </div>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stats.netChange >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            <Calculator className="w-7 h-7" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.1)] flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">قيمة الخسائر (التكلفة)</p>
            <h3 className="text-3xl font-black text-orange-600">{formatCurrency(stats.totalLossValue)}</h3>
            <p className="text-xs text-slate-400 mt-1">للفترة المحددة</p>
          </div>
          <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
            <TrendingDown className="w-7 h-7" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.1)] flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">عدد عمليات التسوية</p>
            <h3 className="text-3xl font-black text-slate-800">{stats.totalCount}</h3>
            <p className="text-xs text-slate-400 mt-1">حركة مخزنية</p>
          </div>
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <History className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="بحث باسم المنتج أو الملاحظات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
            />
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="flex-1 bg-transparent py-2 text-sm outline-none text-gray-600 font-bold text-center"
            />
            <span className="text-gray-300">|</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="flex-1 bg-transparent py-2 text-sm outline-none text-gray-600 font-bold text-center"
            />
          </div>

          {/* Warehouse Filter */}
          <div className="relative">
            <select
              value={filterWarehouse}
              onChange={(e) => setFilterWarehouse(e.target.value)}
              className="w-full appearance-none px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 outline-none cursor-pointer"
            >
              <option value="all">كل المخازن</option>
              {warehouses?.map((w) => (
                <option key={w.id} value={w.id?.toString()}>
                  {w.name}
                </option>
              ))}
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>

          {/* Reason Filter */}
          <div className="relative">
            <select
              value={filterReason}
              onChange={(e) => setFilterReason(e.target.value)}
              className="w-full appearance-none px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 outline-none cursor-pointer"
            >
              <option value="all">كل الأسباب</option>
              <option value="damage">تالف / مكسور</option>
              <option value="theft">عجز / سرقة</option>
              <option value="correction">تصحيح جرد</option>
              <option value="gift">هدايا / استخدام</option>
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
        </div>
      </div>
    </>
  );
};

export default StockAdjustmentsHeader;
