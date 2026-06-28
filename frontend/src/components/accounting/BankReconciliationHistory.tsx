import React from "react";
import { Eye, Printer, Trash2 } from "lucide-react";
import { BankReconciliation } from "../../types";

interface BankReconciliationHistoryProps {
  previousReconciliations: BankReconciliation[] | undefined;
  accounts: any[] | undefined;
  formatCurrency: (val: number) => string;
  setViewingRecId: (id: number) => void;
  printReport: (rec: BankReconciliation) => void;
  setUndoRecId: (id: number) => void;
}

export const BankReconciliationHistory: React.FC<BankReconciliationHistoryProps> = ({
  previousReconciliations,
  accounts,
  formatCurrency,
  setViewingRecId,
  printReport,
  setUndoRecId,
}) => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h3 className="font-bold text-lg text-slate-800">سجل التسويات السابق</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 font-bold text-slate-500">
            <tr>
              <th className="p-4">تاريخ الكشف</th>
              <th className="p-4">الحساب</th>
              <th className="p-4">رصيد الإغلاق</th>
              <th className="p-4">تمت بتاريخ</th>
              <th className="p-4 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {previousReconciliations?.map((rec) => (
              <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 text-slate-800 font-medium">
                  {new Date(rec.statementDate).toLocaleDateString()}
                </td>
                <td className="p-4 text-indigo-600 font-bold">
                  {accounts?.find((a) => a.id === rec.accountId)?.name}
                </td>
                <td className="p-4 font-mono font-bold text-slate-900">
                  {formatCurrency(rec.statementBalance)}
                </td>
                <td className="p-4 text-slate-400 text-xs">
                  {new Date(rec.createdAt).toLocaleString()}
                </td>
                <td className="p-4 text-center flex justify-center gap-2">
                  <button
                    onClick={() => setViewingRecId(rec.id!)}
                    className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm"
                    title="عرض التفاصيل"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => printReport(rec)}
                    className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-emerald-600 hover:border-emerald-200 transition-colors shadow-sm"
                    title="طباعة التقرير"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setUndoRecId(rec.id!)}
                    className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm"
                    title="إلغاء التسوية"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {(!previousReconciliations || previousReconciliations.length === 0) && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-400 italic">
                  لا يوجد سجلات سابقة
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
