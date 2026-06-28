import React from "react";
import { X } from "lucide-react";

interface BankReconciliationDetailsModalProps {
  viewingRecId: number | null;
  viewingRec: any | null;
  setViewingRecId: (id: number | null) => void;
  accounts: any[] | undefined;
  formatCurrency: (val: number) => string;
  viewingRecTransactions: any[];
}

export const BankReconciliationDetailsModal: React.FC<BankReconciliationDetailsModalProps> = ({
  viewingRecId,
  viewingRec,
  setViewingRecId,
  accounts,
  formatCurrency,
  viewingRecTransactions,
}) => {
  if (!viewingRecId || !viewingRec) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] text-right" dir="rtl">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-slate-50 rounded-t-3xl">
          <div>
            <h3 className="font-bold text-xl text-slate-800">تفاصيل التسوية البنكية</h3>
            <p className="text-sm text-slate-500 mt-1">
              الحساب: {accounts?.find((a) => a.id === viewingRec.accountId)?.name} | تاريخ الكشف:{" "}
              {new Date(viewingRec.statementDate).toLocaleDateString()}
            </p>
          </div>
          <button onClick={() => setViewingRecId(null)} className="p-2 hover:bg-white rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500 font-bold mb-1">رصيد الكشف (Statement Balance)</p>
              <p className="text-xl font-black font-mono text-slate-800">{formatCurrency(viewingRec.statementBalance)}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500 font-bold mb-1">عدد الحركات المطابقة</p>
              <p className="text-xl font-black font-mono text-slate-800">{viewingRec.reconciledEntryIds.length}</p>
            </div>
          </div>

          <h4 className="font-bold text-slate-700 mb-3">الحركات المطابقة في هذه التسوية:</h4>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase">
                <tr>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">البيان / المرجع</th>
                  <th className="p-3 text-left">مدين (إيداع)</th>
                  <th className="p-3 text-left">دائن (سحب)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {viewingRecTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-600 font-mono text-xs">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="p-3">
                      <p className="font-bold text-sm text-slate-800">{tx.desc}</p>
                      {tx.ref && (
                        <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">#{tx.ref}</span>
                      )}
                    </td>
                    <td className="p-3 text-left font-mono font-bold text-emerald-600">
                      {tx.debit > 0 ? formatCurrency(tx.debit) : "-"}
                    </td>
                    <td className="p-3 text-left font-mono font-bold text-red-600">
                      {tx.credit > 0 ? formatCurrency(tx.credit) : "-"}
                    </td>
                  </tr>
                ))}
                {viewingRecTransactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      لا توجد حركات لعرضها
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
