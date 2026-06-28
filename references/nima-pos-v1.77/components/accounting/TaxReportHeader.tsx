import React from "react";
import { Receipt, Calendar, Download, Printer } from "lucide-react";

interface TaxReportHeaderProps {
  dateRange: { start: string; end: string };
  setDateRange: (range: { start: string; end: string }) => void;
  onExport: () => void;
  onPrint: () => void;
}

const TaxReportHeader: React.FC<TaxReportHeaderProps> = ({
  dateRange,
  setDateRange,
  onExport,
  onPrint,
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
          <Receipt className="w-8 h-8 text-indigo-600" />
          الإقرار الضريبي (VAT)
        </h1>
        <p className="text-slate-500 mt-1">
          حساب ضريبة القيمة المضافة (المدخلات والمخرجات)
        </p>
      </div>
      <div className="flex flex-wrap gap-2 bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange({ ...dateRange, start: e.target.value })
            }
            className="bg-transparent text-sm font-bold outline-none w-28 [color-scheme:light]"
          />
          <span className="text-slate-400">-</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange({ ...dateRange, end: e.target.value })
            }
            className="bg-transparent text-sm font-bold outline-none w-28 [color-scheme:light]"
          />
        </div>
        <button
          onClick={onExport}
          className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-50 flex items-center gap-2 transition-colors"
        >
          <Download className="w-4 h-4" /> تصدير
        </button>
        <button
          onClick={onPrint}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold shadow hover:bg-indigo-700 flex items-center gap-2 transition-colors"
        >
          <Printer className="w-4 h-4" /> طباعة
        </button>
      </div>
    </div>
  );
};

export default TaxReportHeader;
