import React from 'react';
import { Search, Download, Calendar } from 'lucide-react';

interface ReturnsToolbarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  setCurrentPage: (page: number) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  onExport: () => void;
}

const ReturnsToolbar: React.FC<ReturnsToolbarProps> = ({
  searchTerm,
  setSearchTerm,
  setCurrentPage,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onExport
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 w-full font-['Tajawal']">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 w-5 h-5 stroke-[2]" />
        <input 
          type="text" 
          placeholder="بحث برقم المرتجع، الفاتورة الأصلية، أو العميل..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="w-full pl-4 pr-12 py-3 bg-white/80 border border-indigo-100 rounded-2xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none text-sm font-bold transition-all"
        />
      </div>
      
      <div className="flex items-center gap-3">
        <div className="relative">
          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 w-4 h-4 stroke-[2]" />
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
            className="pl-3 pr-10 py-3 bg-white/80 border border-indigo-100 rounded-2xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none text-sm font-bold transition-all"
          />
        </div>
        <span className="text-slate-400 font-bold">-</span>
        <div className="relative">
          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 w-4 h-4 stroke-[2]" />
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
            className="pl-3 pr-10 py-3 bg-white/80 border border-indigo-100 rounded-2xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none text-sm font-bold transition-all"
          />
        </div>
      </div>

      <div className="flex-1 flex justify-end">
        <button 
          onClick={onExport}
          className="flex items-center gap-2 px-5 py-3 bg-sky-50 hover:bg-sky-100 text-sky-600 hover:text-sky-700 border border-sky-200/80 rounded-2xl font-bold transition-all shadow-sm cursor-pointer active:scale-95"
        >
          <Download className="w-5 h-5 stroke-[2]" />
          تصدير
        </button>
      </div>
    </div>
  );
};

export default ReturnsToolbar;
