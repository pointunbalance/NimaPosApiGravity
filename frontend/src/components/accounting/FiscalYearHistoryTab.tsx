import React from "react";
import { Lock, FileText, Unlock, History, Printer } from "lucide-react";
import { FiscalYear } from "../../types";

interface FiscalYearHistoryTabProps {
  fiscalYears: FiscalYear[];
  isProcessing: boolean;
  onViewEntry: (year: FiscalYear) => void;
  onReopen: (year: FiscalYear) => void;
}

const FiscalYearHistoryTab: React.FC<FiscalYearHistoryTabProps> = ({
  fiscalYears,
  isProcessing,
  onViewEntry,
  onReopen,
}) => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 print:hidden font-bold">
        <h2 className="text-lg font-bold text-slate-800">سجل الفترات المغلقة</h2>
        <button
          onClick={() => window.print()}
          className="text-indigo-600 hover:text-indigo-800 flex items-center gap-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors font-bold"
        >
          <Printer className="w-4 h-4" /> طباعة السجل
        </button>
      </div>
      {fiscalYears && fiscalYears.length > 0 ? (
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 text-slate-600 font-bold">
            <tr>
              <th className="p-4">الفترة المالية</th>
              <th className="p-4">بداية الفترة</th>
              <th className="p-4">نهاية الفترة</th>
              <th className="p-4">تاريخ الإغلاق</th>
              <th className="p-4 text-center">الحالة</th>
              <th className="p-4 text-center print:hidden">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-bold">
            {fiscalYears.map((year, index) => (
              <tr key={year.id} className="hover:bg-slate-50">
                <td className="p-4 font-black text-slate-800">{year.name}</td>
                <td className="p-4 text-slate-600">
                  {new Date(year.startDate).toLocaleDateString()}
                </td>
                <td className="p-4 text-slate-600">
                  {new Date(year.endDate).toLocaleDateString()}
                </td>
                <td className="p-4 text-slate-500 text-xs">
                  {year.closedAt ? new Date(year.closedAt).toLocaleString() : "-"}
                </td>
                <td className="p-4 text-center">
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center justify-center gap-1 w-fit mx-auto">
                    <Lock className="w-3 h-3" /> مغلق
                  </span>
                </td>
                <td className="p-4 text-center print:hidden">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onViewEntry(year)}
                      className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors"
                      title="عرض القيد"
                    >
                      <FileText className="w-4 h-4" /> عرض القيد
                    </button>
                    {/* Only allow reopening the most recently closed year to prevent gaps */}
                    {index === 0 && (
                      <button
                        onClick={() => onReopen(year)}
                        disabled={isProcessing}
                        className="text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors"
                        title="إلغاء الإقفال"
                      >
                        <Unlock className="w-4 h-4" /> إلغاء الإقفال
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="p-12 text-center text-slate-400 font-bold">
          <History className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="font-bold">لا يوجد سجل إغلاقات سابقة</p>
        </div>
      )}
    </div>
  );
};

export default FiscalYearHistoryTab;
