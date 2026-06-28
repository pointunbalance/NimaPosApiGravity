import React from "react";
import { X, TrendingUp } from "lucide-react";
import { CostCenter } from "../../types";
import { CostCenterAnalytics } from "./useCostCentersData";

interface CostCenterTransactionsModalProps {
  selectedCenterId: number | null;
  onClose: () => void;
  costCenters: CostCenter[];
  dateRange: { start: string; end: string };
  analytics: CostCenterAnalytics;
  formatCurrency: (val: number) => string;
}

const CostCenterTransactionsModal: React.FC<
  CostCenterTransactionsModalProps
> = ({
  selectedCenterId,
  onClose,
  costCenters,
  dateRange,
  analytics,
  formatCurrency,
}) => {
  if (!selectedCenterId) return null;

  const currentCenterName = costCenters.find((c) => c.id === selectedCenterId)?.name || "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 print:hidden">
      <div className="bg-white rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-3xl">
          <div>
            <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              تفاصيل الحركات
            </h3>
            <p className="text-sm text-slate-500">
              {currentCenterName} ({new Date(dateRange.start).toLocaleDateString()} -{" "}
              {new Date(dateRange.end).toLocaleDateString()})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold">
              <tr>
                <th className="p-3">التاريخ</th>
                <th className="p-3">رقم القيد</th>
                <th className="p-3">الوصف</th>
                <th className="p-3">البيان الفرعي</th>
                <th className="p-3">مدين (تكلفة)</th>
                <th className="p-3">دائن (إيراد)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics.transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    لا توجد حركات في هذه الفترة
                  </td>
                </tr>
              ) : (
                analytics.transactions.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-600">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                    <td className="p-3 font-mono text-indigo-600">#{tx.entryId}</td>
                    <td className="p-3 font-medium text-slate-800">{tx.desc}</td>
                    <td className="p-3 text-slate-500">{tx.description || "-"}</td>
                    <td className="p-3 font-bold text-red-600">
                      {tx.debit > 0 ? formatCurrency(tx.debit) : "-"}
                    </td>
                    <td className="p-3 font-bold text-emerald-600">
                      {tx.credit > 0 ? formatCurrency(tx.credit) : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-3xl flex justify-between items-center text-sm">
          <div className="text-slate-500 font-bold">
            إجمالي الحركات: {analytics.transactions.length}
          </div>
          <div className="flex gap-6">
            <div className="text-red-600 font-bold">
              إجمالي المدين:{" "}
              {formatCurrency(
                analytics.transactions.reduce((sum, tx) => sum + tx.debit, 0)
              )}
            </div>
            <div className="text-emerald-600 font-bold">
              إجمالي الدائن:{" "}
              {formatCurrency(
                analytics.transactions.reduce((sum, tx) => sum + tx.credit, 0)
              )}
            </div>
            <div className="text-slate-800 font-black border-r border-slate-300 pr-6">
              صافي الحركة:{" "}
              {formatCurrency(
                analytics.transactions.reduce((sum, tx) => sum + tx.debit, 0) -
                  analytics.transactions.reduce((sum, tx) => sum + tx.credit, 0)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostCenterTransactionsModal;
