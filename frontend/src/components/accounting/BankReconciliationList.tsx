import React from "react";
import { Search, Download, Calculator, CheckSquare, Square, CheckCircle2 } from "lucide-react";

interface BankReconciliationListProps {
  selectedAccountId: number | "";
  txSearchTerm: string;
  setTxSearchTerm: (term: string) => void;
  handleExportUnreconciled: () => void;
  autoMatch: () => void;
  toggleSelectAll: () => void;
  isAllSelected: boolean;
  displayedTransactions: any[];
  selectedEntryIds: Set<number>;
  toggleTransaction: (id: number) => void;
  unreconciledTransactions: any[];
  formatCurrency: (val: number) => string;
}

export const BankReconciliationList: React.FC<BankReconciliationListProps> = ({
  selectedAccountId,
  txSearchTerm,
  setTxSearchTerm,
  handleExportUnreconciled,
  autoMatch,
  toggleSelectAll,
  isAllSelected,
  displayedTransactions,
  selectedEntryIds,
  toggleTransaction,
  unreconciledTransactions,
  formatCurrency,
}) => {
  return (
    <div className="lg:col-span-8 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="بحث في الحركات..."
            value={txSearchTerm}
            onChange={(e) => setTxSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium text-slate-800"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportUnreconciled}
            className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1"
          >
            <Download className="w-4 h-4" /> تصدير
          </button>
          <button
            onClick={autoMatch}
            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-200 transition-colors flex items-center gap-1"
          >
            <Calculator className="w-4 h-4" /> مطابقة تلقائية
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-right text-sm">
          <thead className="bg-white text-slate-500 font-bold sticky top-0 shadow-sm z-10 text-xs uppercase">
            <tr>
              <th className="p-4 w-12 text-center">
                <button onClick={toggleSelectAll} className="focus:outline-none">
                  {isAllSelected ? (
                    <CheckSquare className="w-4 h-4 mx-auto text-indigo-600" />
                  ) : (
                    <Square className="w-4 h-4 mx-auto text-slate-300 hover:text-indigo-400 transition-colors" />
                  )}
                </button>
              </th>
              <th className="p-4">التاريخ</th>
              <th className="p-4">البيان / المرجع</th>
              <th className="p-4 text-left">مدين (إيداع)</th>
              <th className="p-4 text-left">دائن (سحب)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-400">
                  {selectedAccountId ? "لا توجد حركات غير مطابقة للعرض" : "الرجاء اختيار حساب بنكي للبدء"}
                </td>
              </tr>
            ) : (
              displayedTransactions.map((tx) => {
                const isSelected = selectedEntryIds.has(tx.id);
                return (
                  <tr
                    key={tx.id}
                    onClick={() => toggleTransaction(tx.id)}
                    className={`cursor-pointer transition-all ${isSelected ? "bg-indigo-50/60" : "hover:bg-slate-50"}`}
                  >
                    <td className="p-4 text-center">
                      <div className={`w-5 h-5 rounded border mx-auto flex items-center justify-center transition-colors ${
                        isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 bg-white"
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 font-mono text-xs">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="p-4">
                      <p className={`font-bold text-sm ${isSelected ? "text-indigo-900" : "text-slate-800"}`}>{tx.desc}</p>
                      {tx.ref && (
                        <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">#{tx.ref}</span>
                      )}
                    </td>
                    <td className="p-4 text-left font-mono font-bold text-emerald-600">
                      {tx.debit > 0 ? formatCurrency(tx.debit) : "-"}
                    </td>
                    <td className="p-4 text-left font-mono font-bold text-red-600">
                      {tx.credit > 0 ? formatCurrency(tx.credit) : "-"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 font-bold flex justify-between px-6">
        <span>عدد الحركات: {unreconciledTransactions.length}</span>
        <span>المحدد: {selectedEntryIds.size}</span>
      </div>
    </div>
  );
};
