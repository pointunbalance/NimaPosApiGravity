import React from "react";
import { Printer, ArrowLeft } from "lucide-react";

interface FiscalYearPreviewStepProps {
  closingEntryPreview: any[];
  startDate: string;
  closingDate: string;
  storeName?: string;
  formatCurrency: (val: number) => string;
  onPrev: () => void;
  onNext: () => void;
}

const FiscalYearPreviewStep: React.FC<FiscalYearPreviewStepProps> = ({
  closingEntryPreview,
  startDate,
  closingDate,
  storeName,
  formatCurrency,
  onPrev,
  onNext,
}) => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 animate-in fade-in slide-in-from-bottom-4 print:shadow-none print:border-none print:p-0 print:bg-transparent">
      <div className="flex justify-between items-center mb-6 border-b pb-4 print:border-b-2 print:border-black">
        <h2 className="text-xl font-bold text-slate-800 print:text-black">
          معاينة قيد الإقفال المقترح
        </h2>
        <button
          onClick={() => window.print()}
          className="text-indigo-600 hover:text-indigo-800 flex items-center gap-2 print:hidden font-bold"
        >
          <Printer className="w-5 h-5" /> طباعة
        </button>
      </div>

      <div className="mb-4 hidden print:block text-center font-bold">
        <h1 className="text-2xl font-bold mb-2 print:text-black">
          {storeName || "النظام المحاسبي"}
        </h1>
        <h2 className="text-xl print:text-black">قيد إقفال الفترة</h2>
        <p className="text-gray-500 print:text-black">
          من {startDate} إلى {closingDate}
        </p>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden mb-8 print:border-2 print:border-black print:rounded-none">
        <table className="w-full text-sm text-right">
          <thead className="bg-slate-50 font-bold text-slate-600 print:bg-transparent print:text-black print:border-b-2 print:border-black">
            <tr>
              <th className="p-4">اسم الحساب</th>
              <th className="p-4">نوع الحركة</th>
              <th className="p-4 text-left">مدين</th>
              <th className="p-4 text-left">دائن</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 print:divide-black font-bold">
            {closingEntryPreview.map((line, idx) => (
              <tr
                key={idx}
                className={line.highlight ? "bg-indigo-50 font-black" : ""}
              >
                <td className="p-3 text-slate-800 print:text-black">
                  {line.accountName}
                </td>
                <td className="p-3 text-slate-500 text-xs print:text-black">
                  {line.type}
                </td>
                <td className="p-3 text-left font-mono text-emerald-600 print:text-black">
                  {line.debit > 0 ? formatCurrency(line.debit) : "-"}
                </td>
                <td className="p-3 text-left font-mono text-red-600 print:text-black">
                  {line.credit > 0 ? formatCurrency(line.credit) : "-"}
                </td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-black border-t border-gray-200 print:bg-transparent print:border-t-2 print:border-black">
              <td colSpan={2} className="p-3 text-center print:text-black">
                الإجمالي
              </td>
              <td className="p-3 text-left text-emerald-700 print:text-black">
                {formatCurrency(
                  closingEntryPreview.reduce((s, l) => s + l.debit, 0)
                )}
              </td>
              <td className="p-3 text-left text-red-700 print:text-black">
                {formatCurrency(
                  closingEntryPreview.reduce((s, l) => s + l.credit, 0)
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex justify-between print:hidden font-bold">
        <button onClick={onPrev} className="text-gray-500 hover:text-gray-700">
          السابق
        </button>
        <button
          onClick={onNext}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2"
        >
          اعتماد ومتابعة <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default FiscalYearPreviewStep;
