import React from 'react';
import { Search } from 'lucide-react';

interface OrdersToolbarProps {
  statusFilter: 'all' | 'completed' | 'refunded';
  setStatusFilter: (status: 'all' | 'completed' | 'refunded') => void;
  dateRange: { start: string; end: string };
  setDateRange: (range: { start: string; end: string }) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterOrderType: string;
  setFilterOrderType: (type: string) => void;
  filterPaymentMethod: string;
  setFilterPaymentMethod: (method: string) => void;
  filterCashier: string;
  setFilterCashier: (cashier: string) => void;
  uniqueCashiers: string[];
}

const OrdersToolbar: React.FC<OrdersToolbarProps> = ({
  statusFilter,
  setStatusFilter,
  dateRange,
  setDateRange,
  searchTerm,
  setSearchTerm,
  filterOrderType,
  setFilterOrderType,
  filterPaymentMethod,
  setFilterPaymentMethod,
  filterCashier,
  setFilterCashier,
  uniqueCashiers
}) => {
  return (
    <div className="space-y-4">
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
        {['all', 'completed', 'refunded'].map((status) => (
          <button
            key={status}
            onClick={() => { setStatusFilter(status as any); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${statusFilter === status ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {status === 'all' ? 'الكل' : status === 'completed' ? 'مكتملة' : 'مسترجعة'}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        <button onClick={() => setDateRange({start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0]})} className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-600 whitespace-nowrap">اليوم</button>
        <button onClick={() => { const y = new Date(); y.setDate(y.getDate()-1); setDateRange({start: y.toISOString().split('T')[0], end: y.toISOString().split('T')[0]})}} className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-600 whitespace-nowrap">الأمس</button>
        <button onClick={() => { const d = new Date(); d.setDate(1); setDateRange({start: d.toISOString().split('T')[0], end: new Date().toISOString().split('T')[0]})}} className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-600 whitespace-nowrap">هذا الشهر</button>
        <button onClick={() => { const d = new Date(); d.setDate(d.getDate()-30); setDateRange({start: d.toISOString().split('T')[0], end: new Date().toISOString().split('T')[0]})}} className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-600 whitespace-nowrap">آخر 30 يوم</button>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="بحث برقم الفاتورة، العميل..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); }}
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
          />
        </div>
        
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2">
          <input 
            type="date" 
            value={dateRange.start}
            onChange={(e) => { setDateRange({...dateRange, start: e.target.value}); }}
            className="bg-transparent py-2 text-sm outline-none w-full text-slate-600 font-bold text-center"
          />
          <span className="text-slate-400">-</span>
          <input 
            type="date" 
            value={dateRange.end}
            onChange={(e) => { setDateRange({...dateRange, end: e.target.value}); }}
            className="bg-transparent py-2 text-sm outline-none w-full text-slate-600 font-bold text-center"
          />
        </div>

        <select
           value={filterOrderType}
           onChange={(e) => { setFilterOrderType(e.target.value); }}
           className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none cursor-pointer"
        >
            <option value="all">كل الأنواع</option>
            <option value="takeaway">سفري</option>
            <option value="dine-in">صالة</option>
            <option value="delivery">توصيل</option>
            <option value="direct">مباشر</option>
            <option value="receive">استلام</option>
            <option value="deliver">تسليم</option>
            <option value="maintenance">صيانة</option>
        </select>

        <select
           value={filterPaymentMethod}
           onChange={(e) => { setFilterPaymentMethod(e.target.value); }}
           className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none cursor-pointer"
        >
            <option value="all">كل طرق الدفع</option>
            <option value="cash">كاش</option>
            <option value="card">بطاقة ائتمان</option>
            <option value="credit">آجل</option>
            <option value="wallet">محفظة</option>
            <option value="split">متعدد</option>
        </select>

        <select
           value={filterCashier}
           onChange={(e) => { setFilterCashier(e.target.value); }}
           className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none cursor-pointer"
        >
            <option value="all">كل الكاشيرية</option>
            {uniqueCashiers.map(cashier => (
              <option key={cashier} value={cashier}>{cashier}</option>
            ))}
        </select>
      </div>
    </div>
  );
};

export default OrdersToolbar;
