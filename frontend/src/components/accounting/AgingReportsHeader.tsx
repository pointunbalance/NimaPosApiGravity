import React from "react";
import { Clock, Calendar, Download, Printer } from "lucide-react";

interface AgingReportsHeaderProps {
  asOfDate: string;
  setAsOfDate: (date: string) => void;
  onExport: () => void;
  onPrint: () => void;
}

const AgingReportsHeader: React.FC<AgingReportsHeaderProps> = ({
  asOfDate,
  setAsOfDate,
  onExport,
  onPrint,
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
          <Clock className="w-8 h-8 text-indigo-600 animate-pulse" />
          تقرير أعمار الديون
        </h1>
        <p className="text-slate-500 mt-1">
          تحليل الحسابات المدينة والدائنة وجدولتها الزمنية
        </p>
      </div>
      <div className="flex flex-wrap gap-2 bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-bold text-slate-600">اعتباراً من:</span>
          <input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="bg-transparent text-sm font-bold outline-none [color-scheme:light]"
          />
        </div>
        <button
          onClick={onExport}
          className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-50 flex items-center gap-2 transition-colors"
        >
          <Download className="w-4 h-4" /> تصدير CSV
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

export default AgingReportsHeader;
