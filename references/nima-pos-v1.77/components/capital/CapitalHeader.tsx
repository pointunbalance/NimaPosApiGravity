import React from 'react';
import { Landmark, Briefcase, Printer, Download } from 'lucide-react';

interface CapitalHeaderProps {
  capitalInput: number | '';
  setCapitalInput: (val: number) => void;
  handleSaveCapital: () => void;
  isSaved: boolean;
  onPrint: () => void;
  onExportCSV: () => void;
}

const CapitalHeader: React.FC<CapitalHeaderProps> = ({
  capitalInput,
  setCapitalInput,
  handleSaveCapital,
  isSaved,
  onPrint,
  onExportCSV
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 mb-2 flex items-center gap-3">
          <Landmark className="w-8 h-8 text-indigo-600" />
          المركز المالي
        </h1>
        <p className="text-slate-500">تحليل الأصول، الخصوم، وتدفق رأس المال</p>
      </div>
      
      <div className="flex flex-wrap items-center gap-3">
        {/* Actions */}
        <button
          onClick={onExportCSV}
          className="bg-white text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
          title="تصدير إلى Excel"
        >
          <Download className="w-5 h-5" />
        </button>
        <button
          onClick={onPrint}
          className="bg-white text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
          title="طباعة"
        >
          <Printer className="w-5 h-5" />
        </button>

        {/* Capital Input */}
        <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Briefcase className="w-5 h-5" />
            <span className="text-xs font-bold uppercase hidden sm:inline">رأس المال التأسيسي</span>
          </div>
          <div className="h-6 w-[1px] bg-slate-200"></div>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              onFocus={(e) => e.target.select()} 
              value={capitalInput}
              onChange={(e) => setCapitalInput(Number(e.target.value))}
              className="w-24 sm:w-32 font-bold text-slate-800 outline-none bg-transparent text-sm text-center"
              placeholder="0"
            />
            <button 
              onClick={handleSaveCapital} 
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-bold ${isSaved ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {isSaved ? 'تم الحفظ' : 'تحديث'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapitalHeader;
