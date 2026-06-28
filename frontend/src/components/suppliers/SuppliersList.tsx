import React from 'react';
import { Supplier } from '../../types';
import { Plus, Search, Truck, ShoppingBag, Phone, ChevronLeft } from 'lucide-react';

interface SuppliersListProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterType: 'all' | 'debt' | 'top';
  setFilterType: (type: 'all' | 'debt' | 'top') => void;
  filteredSuppliers: Supplier[];
  supplierStats: Map<number, { totalSpent: number, purchaseCount: number, lastPurchaseDate: Date | null, debt: number }>;
  selectedSupplier: Supplier | null;
  setSelectedSupplier: (supplier: Supplier | null) => void;
  setActiveDetailTab: (tab: 'overview' | 'history' | 'products' | 'statement') => void;
  formatCurrency: (amount: number) => string;
  openModal: () => void;
}

const SuppliersList: React.FC<SuppliersListProps> = ({
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  filteredSuppliers,
  supplierStats,
  selectedSupplier,
  setSelectedSupplier,
  setActiveDetailTab,
  formatCurrency,
  openModal
}) => {
  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ${selectedSupplier ? 'w-[40%] hidden lg:flex' : 'w-full'}`}>
      {/* Header */}
      <div className="p-6 bg-white/60 backdrop-blur-md shadow-sm border border-indigo-100/10 rounded-2xl mb-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">الموردين</h1>
            <p className="text-slate-500 font-bold text-xs mt-0.5">إدارة شركاء النجاح والذمم المالية</p>
          </div>
          <button onClick={openModal} className="bg-gradient-to-br from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-750 text-white p-3 rounded-xl shadow-md shadow-indigo-500/20 transition-all cursor-pointer active:scale-95">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 w-4 h-4 stroke-[2]" />
            <input 
              type="text" 
              placeholder="بحث بالاسم، الهاتف، أو المنتج..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-white/80 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
            />
          </div>
          
          <div className="flex bg-slate-100/80 p-1 rounded-xl">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'debt', label: 'عليهم ديون' },
              { id: 'top', label: 'كبار الموردين' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id as any)}
                className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${filterType === tab.id ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
        {filteredSuppliers.map(supplier => {
          const stat = supplierStats.get(supplier.id!) || { totalSpent: 0, purchaseCount: 0, lastPurchaseDate: null, debt: 0 };
          const isSelected = selectedSupplier?.id === supplier.id;
          
          return (
            <div 
              key={supplier.id} 
              onClick={() => { setSelectedSupplier(supplier); setActiveDetailTab('overview'); }}
              className={`bg-white p-4 rounded-xl border transition-all cursor-pointer group hover:shadow-md ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-md' : 'border-slate-200 hover:border-indigo-300'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold uppercase ${isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                    {supplier.name.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{supplier.name}</h3>
                    <p className="text-xs text-slate-500">{supplier.contactPerson || 'لا يوجد جهة اتصال'}</p>
                  </div>
                </div>
                {(supplier.balance || 0) > 0 && (
                  <span className="bg-red-50 text-red-600 px-2 py-1 rounded-lg text-xs font-bold border border-red-100">
                    {formatCurrency(supplier.balance!)}
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-50">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><ShoppingBag className="w-3 h-3" /> {stat.purchaseCount} فاتورة</span>
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> <span dir="ltr">{supplier.phone}</span></span>
                </div>
                <ChevronLeft className={`w-4 h-4 transition-transform ${isSelected ? 'text-indigo-500 -translate-x-1' : 'text-slate-300'}`} />
              </div>
            </div>
          );
        })}
        
        {filteredSuppliers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 bg-white/40 backdrop-blur-md rounded-2xl border border-indigo-100/10 gap-3 font-['Tajawal']">
            <div className="w-14 h-14 bg-gradient-to-tr from-indigo-100/50 to-purple-100/50 rounded-full flex items-center justify-center border border-indigo-200/50 shadow-sm">
              <Truck className="w-7 h-7 text-indigo-600 stroke-[1.8] animate-pulse" />
            </div>
            <div className="text-center">
              <h3 className="font-extrabold text-sm text-slate-700">لا يوجد موردين</h3>
              <p className="text-[11px] text-slate-500 font-bold mt-0.5">ابدأ بإضافة موردين ومتابعة فواتير التوريد</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuppliersList;
