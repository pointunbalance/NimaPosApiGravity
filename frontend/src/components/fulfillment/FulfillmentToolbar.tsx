import React from 'react';
import { 
  ListChecks, Store, Package, Truck, 
  History, Volume2, VolumeX, Maximize, Minimize,
  LayoutGrid, LayoutList, Search
} from 'lucide-react';

interface FulfillmentToolbarProps {
  showSummary: boolean;
  setShowSummary: (show: boolean) => void;
  filterType: 'all' | 'dine-in' | 'takeaway' | 'delivery';
  setFilterType: (type: 'all' | 'dine-in' | 'takeaway' | 'delivery') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setShowHistory: (show: boolean) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

const FulfillmentToolbar: React.FC<FulfillmentToolbarProps> = ({
  showSummary,
  setShowSummary,
  filterType,
  setFilterType,
  searchQuery,
  setSearchQuery,
  setShowHistory,
  isMuted,
  setIsMuted,
  isFullscreen,
  toggleFullscreen
}) => {
  return (
    <div className="flex flex-col xl:flex-row justify-between items-center mb-6 bg-white p-3 rounded-2xl shadow-sm border border-slate-100 shrink-0 gap-4">
      <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
        <button 
          onClick={() => setShowSummary(!showSummary)}
          className={`p-2.5 rounded-xl transition-all border hidden md:block shrink-0 ${showSummary ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
          title="عرض ملخص الكميات"
        >
          {showSummary ? <LayoutList className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
        </button>
        
        {/* Filter Tabs */}
        <div className="flex bg-slate-50/80 border border-slate-200/60 p-1.5 rounded-xl overflow-x-auto scrollbar-none w-full sm:w-auto">
          {[
            { id: 'all', label: 'الكل', icon: ListChecks },
            { id: 'dine-in', label: 'استلام مباشر', icon: Store },
            { id: 'takeaway', label: 'تجهيز عميل', icon: Package },
            { id: 'delivery', label: 'شحن وتوصيل', icon: Truck },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all shrink-0 ${
                filterType === tab.id 
                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
        
        <div className="relative flex-1 sm:w-64 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث برقم الطلب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex gap-2 w-full xl:w-auto shrink-0">
        <button 
          onClick={() => setShowHistory(true)}
          className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-bold transition-colors text-sm"
        >
          <History className="w-4 h-4" />
          <span>السجل</span>
        </button>
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className={`p-2.5 rounded-xl transition-all border shrink-0 ${isMuted ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
          title={isMuted ? "تفعيل الصوت" : "كتم الصوت"}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
        <button 
          onClick={toggleFullscreen}
          className="p-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-all shadow-md shrink-0 focus:ring-2 focus:ring-slate-400 focus:outline-none"
          title="ملء الشاشة"
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};

export default FulfillmentToolbar;

