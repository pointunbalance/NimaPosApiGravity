import React from 'react';
import { MapPin, Package, DollarSign, TrendingUp, AlertTriangle, Search, Eye, EyeOff, Printer } from 'lucide-react';
import { Warehouse as IWarehouse } from '../../types';

interface WarehouseHeaderProps {
  selectedWarehouse: IWarehouse;
  activeTab: 'inventory' | 'batches';
  setActiveTab: (tab: 'inventory' | 'batches') => void;
  stats: {
    totalItems: number;
    totalRetailValue: number;
    totalCostValue: number;
    lowStock: number;
  };
  formatCurrency: (amount: number) => string;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterStatus: 'all' | 'low' | 'out';
  setFilterStatus: (status: 'all' | 'low' | 'out') => void;
  hideZeroStock: boolean;
  setHideZeroStock: (hide: boolean) => void;
  onPrint: () => void;
}

const WarehouseHeader: React.FC<WarehouseHeaderProps> = ({
  selectedWarehouse,
  activeTab,
  setActiveTab,
  stats,
  formatCurrency,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  hideZeroStock,
  setHideZeroStock,
  onPrint,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 px-8 py-6 shrink-0">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            {selectedWarehouse.name}
            {selectedWarehouse.isMain && (
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg font-bold align-middle">
                المخزن الرئيسي
              </span>
            )}
          </h1>
          {selectedWarehouse.address && (
            <p className="text-slate-500 font-medium mt-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> {selectedWarehouse.address}
            </p>
          )}
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'inventory'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            جرد المخزون
          </button>
          <button
            onClick={() => setActiveTab('batches')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'batches'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            تواريخ الصلاحية
          </button>
        </div>
      </div>

      {activeTab === 'inventory' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Package className="w-4 h-4" />
              <span className="text-sm font-bold">إجمالي القطع</span>
            </div>
            <div className="text-2xl font-black text-slate-800">{stats.totalItems}</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-bold">قيمة التكلفة</span>
            </div>
            <div className="text-2xl font-black text-slate-800" dir="ltr">
              {formatCurrency(stats.totalCostValue)}
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-bold">قيمة البيع</span>
            </div>
            <div className="text-2xl font-black text-slate-800" dir="ltr">
              {formatCurrency(stats.totalRetailValue)}
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-bold">نواقص المخزون</span>
            </div>
            <div className="text-2xl font-black text-red-700">{stats.lowStock}</div>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="بحث عن منتج..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                filterStatus === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setFilterStatus('low')}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                filterStatus === 'low'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              نواقص
            </button>
            <button
              onClick={() => setFilterStatus('out')}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                filterStatus === 'out'
                  ? 'bg-red-500 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              نفذت
            </button>
            <button
              onClick={() => setHideZeroStock(!hideZeroStock)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                hideZeroStock
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {hideZeroStock ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              إخفاء الأصفار
            </button>
            <button
              onClick={onPrint}
              className="px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 bg-slate-800 text-white hover:bg-slate-700"
            >
              <Printer className="w-4 h-4" />
              طباعة
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseHeader;
