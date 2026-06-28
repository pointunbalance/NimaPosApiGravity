import React from 'react';
import { Truck, Download, Plus, DollarSign, FileText, Package, Search, Filter } from 'lucide-react';
import { Supplier } from '../../types';

interface PurchasesHeaderProps {
  stats: { totalAmount: number; totalCount: number; totalItems: number };
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterSupplier: string;
  setFilterSupplier: (val: string) => void;
  filterPaymentStatus: 'all' | 'cash' | 'credit';
  setFilterPaymentStatus: (val: 'all' | 'cash' | 'credit') => void;
  dateRange: { start: string; end: string };
  setDateRange: (val: { start: string; end: string }) => void;
  suppliers: Supplier[] | undefined;
  onExportCSV: () => void;
  onNewPurchaseClick: () => void;
  formatCurrency: (amount: number) => string;
}

const PurchasesHeader: React.FC<PurchasesHeaderProps> = ({
  stats,
  searchTerm,
  setSearchTerm,
  filterSupplier,
  setFilterSupplier,
  filterPaymentStatus,
  setFilterPaymentStatus,
  dateRange,
  setDateRange,
  suppliers,
  onExportCSV,
  onNewPurchaseClick,
  formatCurrency
}) => {
  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 font-['Tajawal']">
        <div>
           <div className="flex items-center gap-2 mb-1">
               <span className="p-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100"><Truck className="w-5 h-5 stroke-[2]" /></span>
               <h1 className="text-3xl font-black text-gray-800 tracking-tight">إدارة المشتريات</h1>
           </div>
           <p className="text-gray-500 font-bold text-xs mt-0.5">إدارة التوريد، الفواتير، ومتابعة المخزون الوارد</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={onExportCSV}
                className="bg-sky-50 hover:bg-sky-100 text-sky-600 hover:text-sky-700 border border-sky-200/80 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold shadow-sm cursor-pointer active:scale-95"
            >
                <Download className="w-5 h-5 stroke-[2]" />
                <span>تصدير Excel</span>
            </button>
            <button 
                onClick={onNewPurchaseClick}
                className="bg-gradient-to-br from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-750 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-md shadow-indigo-500/20 font-black transition-all cursor-pointer active:scale-95"
            >
                <Plus className="w-5 h-5 stroke-[2.5]" />
                <span>فاتورة شراء جديدة</span>
            </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.1)] flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">إجمالي المشتريات</p>
            <h3 className="text-3xl font-black text-slate-800">{formatCurrency(stats.totalAmount)}</h3>
          </div>
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
            <DollarSign className="w-7 h-7" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.1)] flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">عدد الفواتير</p>
            <h3 className="text-3xl font-black text-slate-800">{stats.totalCount}</h3>
          </div>
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <FileText className="w-7 h-7" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.1)] flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">إجمالي الأصناف</p>
            <h3 className="text-3xl font-black text-slate-800">{stats.totalItems}</h3>
          </div>
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <Package className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-t-3xl border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="بحث برقم الفاتورة أو المورد..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
            />
          </div>
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
          <div className="relative">
            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="w-full appearance-none px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 outline-none cursor-pointer"
            >
              <option value="all">كل الموردين</option>
              {suppliers?.map((s) => (
                <option key={s.id} value={s.id?.toString()}>
                  {s.name}
                </option>
              ))}
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={filterPaymentStatus}
              onChange={(e) => setFilterPaymentStatus(e.target.value as any)}
              className="w-full appearance-none px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 outline-none cursor-pointer"
            >
              <option value="all">كل حالات الدفع</option>
              <option value="cash">نقدي</option>
              <option value="credit">آجل</option>
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
        </div>
      </div>
    </>
  );
};

export default PurchasesHeader;
