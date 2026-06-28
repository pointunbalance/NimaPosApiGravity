import React from 'react';
import { DollarSign, Search, Plus, Download, Printer } from 'lucide-react';

interface CurrenciesHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onAddCurrency: () => void;
  onExportCSV: () => void;
  onPrint: () => void;
}

const CurrenciesHeader: React.FC<CurrenciesHeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onAddCurrency,
  onExportCSV,
  onPrint
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
      <div>
        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
            <DollarSign className="w-8 h-8" />
          </div>
          إدارة العملات
        </h1>
        <p className="text-slate-500 mt-2 font-medium">أضف العملات الأجنبية وقم بتحديث أسعار الصرف لمراقبة تكاليف الاستيراد</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <div className="relative flex-1 md:w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="بحث عن عملة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow shadow-sm text-slate-800"
          />
        </div>
        <button
          onClick={onExportCSV}
          className="bg-white text-slate-700 border border-slate-200 px-4 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
          title="تصدير إلى Excel"
        >
          <Download className="w-5 h-5" />
        </button>
        <button
          onClick={onPrint}
          className="bg-white text-slate-700 border border-slate-200 px-4 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
          title="طباعة"
        >
          <Printer className="w-5 h-5" />
        </button>
        <button
          onClick={onAddCurrency}
          className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-200 whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          إضافة عملة
        </button>
      </div>
    </div>
  );
};

export default CurrenciesHeader;
