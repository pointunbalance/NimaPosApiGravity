import React from 'react';
import { Search, Phone, Users } from 'lucide-react';

interface SupplierSidebarProps {
  filteredSuppliers: any[];
  selectedSupplier: any;
  setSelectedSupplier: (s: any) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterCategory: string;
  setFilterCategory: (category: string) => void;
  getCategoryLabel: (catId: string) => string;
  categories: any[];
  setActiveTab: (tab: 'info' | 'invoices' | 'payments') => void;
}

export const SupplierSidebar: React.FC<SupplierSidebarProps> = ({
  filteredSuppliers,
  selectedSupplier,
  setSelectedSupplier,
  searchQuery,
  setSearchQuery,
  filterCategory,
  setFilterCategory,
  getCategoryLabel,
  categories,
  setActiveTab,
}) => {
  return (
    <div className="lg:col-span-1 space-y-4 shadow-sm border border-slate-200 bg-white rounded-2xl p-4 flex flex-col h-[calc(100vh-140px)]">
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="ابحث باسم المورد أو الجوال..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium outline-none text-sm"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mt-2 -mx-2 px-2 hide-scrollbar">
        {filteredSuppliers.map((supplier) => (
          <button
            key={supplier.id}
            onClick={() => {
              setSelectedSupplier(supplier);
              setActiveTab('info');
            }}
            className={`w-full text-right p-4 rounded-xl border transition-all cursor-pointer ${
              selectedSupplier?.id === supplier.id
                ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-bold text-slate-800 text-sm">{supplier.name}</h3>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-lg">
                {getCategoryLabel(supplier.category || '')}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs mt-2">
              <span className="text-slate-500 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> {supplier.phone}
              </span>
              <span className={`font-bold ${(supplier.balance || 0) > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                {(supplier.balance || 0) > 0 ? `دائن: ${supplier.balance}` : 'خالص'}
              </span>
            </div>
          </button>
        ))}
        {filteredSuppliers.length === 0 && (
          <div className="py-8 text-center text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="font-medium text-sm">لا يوجد موردين</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierSidebar;
