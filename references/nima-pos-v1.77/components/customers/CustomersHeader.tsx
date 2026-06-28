import React, { useRef } from 'react';
import { Plus, Search, LayoutGrid, List, Users, Wallet, Crown, Download, Upload, ArrowUpDown, Settings } from 'lucide-react';

interface CustomersHeaderProps {
  stats: { totalDebt: number; totalCustomers: number; vipCount: number };
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  viewMode: 'list' | 'grid';
  setViewMode: (mode: 'list' | 'grid') => void;
  filterType: 'all' | 'debt' | 'vip' | 'inactive';
  setFilterType: (type: 'all' | 'debt' | 'vip' | 'inactive') => void;
  sortBy: 'debt_desc' | 'spent_desc' | 'name_asc' | 'newest';
  setSortBy: (sort: 'debt_desc' | 'spent_desc' | 'name_asc' | 'newest') => void;
  onOpenModal: () => void;
  onOpenSettings?: () => void;
  formatCurrency: (amount: number) => string;
  onExport: () => void;
  onImport: (file: File) => void;
}

const CustomersHeader: React.FC<CustomersHeaderProps> = ({
  stats,
  searchTerm,
  setSearchTerm,
  viewMode,
  setViewMode,
  filterType,
  setFilterType,
  sortBy,
  setSortBy,
  onOpenModal,
  onOpenSettings,
  formatCurrency,
  onExport,
  onImport
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="p-6 bg-white/60 backdrop-blur-md shadow-sm border-b border-indigo-100/10 rounded-2xl mb-4 font-['Tajawal']">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">قاعدة العملاء</h1>
          <p className="text-slate-500 font-bold text-xs mt-0.5">إدارة العلاقات (CRM)، الديون، وبرامج الولاء</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={onOpenSettings}
            className="bg-slate-50 hover:bg-slate-150 text-slate-600 hover:text-slate-850 border border-slate-200/80 px-3 py-2.5 rounded-xl flex items-center justify-center transition-all font-bold shadow-sm cursor-pointer active:scale-95"
            title="إعدادات شاشة العملاء"
          >
            <Settings className="w-5 h-5 stroke-[2]" />
          </button>
          
          <button
            onClick={onExport}
            className="bg-sky-50 hover:bg-sky-100 text-sky-600 hover:text-sky-700 border border-sky-200/80 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold shadow-sm cursor-pointer active:scale-95"
            title="تصدير إلى Excel"
          >
            <Download className="w-5 h-5 stroke-[2]" />
            <span className="hidden sm:inline">تصدير</span>
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".xlsx, .xls, .csv" 
            onChange={handleFileChange} 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700 border border-indigo-200/80 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold shadow-sm cursor-pointer active:scale-95"
            title="استيراد من Excel"
          >
            <Upload className="w-5 h-5 stroke-[2]" />
            <span className="hidden sm:inline">استيراد</span>
          </button>

          <button
            onClick={onOpenModal}
            className="bg-gradient-to-br from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-750 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-indigo-500/20 font-black transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>عميل جديد</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold">العدد الكلي</p>
            <p className="text-lg font-black text-slate-800">{stats.totalCustomers}</p>
          </div>
          <div className="p-2 bg-white rounded-xl shadow-sm text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-red-600/80 font-bold">الديون المستحقة</p>
            <p className="text-lg font-black text-red-700">{formatCurrency(stats.totalDebt)}</p>
          </div>
          <div className="p-2 bg-white rounded-xl shadow-sm text-red-600">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-600/80 font-bold">عملاء VIP</p>
            <p className="text-lg font-black text-amber-700">{stats.vipCount}</p>
          </div>
          <div className="p-2 bg-white rounded-xl shadow-sm text-amber-600">
            <Crown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="بحث سريع (الاسم، الهاتف، الكود)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-sm"
          />
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'list' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'grid' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none cursor-pointer"
        >
          <option value="all">الكل</option>
          <option value="debt">عليهم ديون</option>
          <option value="vip">كبار العملاء (VIP)</option>
          <option value="inactive">منقطعين (60+ يوم)</option>
        </select>
        <div className="relative">
          <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none cursor-pointer appearance-none"
          >
            <option value="debt_desc">الأعلى ديناً</option>
            <option value="spent_desc">الأكثر شراءً</option>
            <option value="name_asc">الاسم (أ-ي)</option>
            <option value="newest">الأحدث</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default CustomersHeader;
