import React from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';

interface DeliveryToolbarProps {
  activeTab: 'deliveries' | 'couriers' | 'areas';
  setActiveTab: (tab: 'deliveries' | 'couriers' | 'areas') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onRefresh?: () => void;
}

const DeliveryToolbar: React.FC<DeliveryToolbarProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onRefresh
}) => {
  return (
    <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white rounded-t-2xl">
      <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl w-full sm:w-auto overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('deliveries')}
          className={`shrink-0 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'deliveries' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
          }`}
        >
          حالة الطلبات
        </button>
        <button
          onClick={() => setActiveTab('couriers')}
          className={`shrink-0 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'couriers' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
          }`}
        >
          متابعة المندوبين
        </button>
        <button
          onClick={() => setActiveTab('areas')}
          className={`shrink-0 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'areas' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
          }`}
        >
          مناطق التوصيل
        </button>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="relative flex-1 sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === 'deliveries' ? "بحث برقم الطلب أو جوال العميل..." : activeTab === 'couriers' ? "بحث باسم المندوب..." : "بحث باسم المنطقة..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
        </div>
        
        {onRefresh && (
            <button onClick={onRefresh} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all" title="تحديث">
            <RefreshCw className="w-4 h-4" />
            </button>
        )}
        
        <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold text-sm transition-colors">
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">تصفية</span>
        </button>
      </div>
    </div>
  );
};

export default DeliveryToolbar;
