import React from "react";
import { FileText, Printer, ArrowLeft } from "lucide-react";
import { FiscalYear } from "../../types";

interface FiscalYearEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  closingEntryDetails: any;
  selectedYear: FiscalYear | null;
  storeName?: string;
  formatCurrency: (val: number) => string;
}

const FiscalYearEntryModal: React.FC<FiscalYearEntryModalProps> = ({
  isOpen,
  onClose,
  closingEntryDetails,
  selectedYear,
  storeName,
  formatCurrency,
}) => {
  if (!isOpen || !closingEntryDetails || !selectedYear) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden print:shadow-none print:max-h-none">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 print:hidden font-bold">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            تفاصيل قيد الإقفال - {selectedYear.name}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="text-indigo-600 hover:text-indigo-800 p-2 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 print:overflow-visible font-bold">
          <div className="mb-6 hidden print:block text-center font-bold">
            <h1 className="text-2xl font-bold mb-2 print:text-black">
              {storeName || "النظام المحاسبي"}
            </h1>
            <h2 className="text-xl print:text-black">قيد إقفال الفترة</h2>
            <p className="text-gray-500 print:text-black">
              من {new Date(selectedYear.startDate).toLocaleDateString()} إلى{" "}
              {new Date(selectedYear.endDate).toLocaleDateString()}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-sm text-slate-500 mb-1">رقم القيد</p>
              <p className="font-bold text-slate-800">{closingEntryDetails.id}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-sm text-slate-500 mb-1">المرجع</p>
              <p className="font-bold text-slate-800">{closingEntryDetails.reference}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-sm text-slate-500 mb-1">التاريخ</p>
              <p className="font-bold text-slate-800">
                {new Date(closingEntryDetails.date).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-sm text-slate-500 mb-1">البيان</p>
              <p className="font-bold text-slate-800">{closingEntryDetails.description}</p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden print:border-2 print:border-black print:rounded-none">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 font-bold text-slate-600 print:bg-transparent print:text-black print:border-b-2 print:border-black">
                <tr>
                  <th className="p-4">اسم الحساب</th>
                  <th className="p-4">البيان</th>
                  <th className="p-4 text-left">مدين</th>
                  <th className="p-4 text-left">دائن</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-black">
                {closingEntryDetails.lines.map((line: any, idx: number) => (
                  <tr key={idx}>
                    <td className="p-3 text-slate-800 font-bold print:text-black">
                      {line.accountName}
                    </td>
                    <td className="p-3 text-slate-500 print:text-black">{line.description}</td>
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
                    {formatCurrency(closingEntryDetails.totalAmount)}
                  </td>
                  <td className="p-3 text-left text-red-700 print:text-black">
                    {formatCurrency(closingEntryDetails.totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FiscalYearEntryModal;
