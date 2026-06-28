import React from "react";
import { Filter, PlusCircle, Save, CheckCircle2, AlertTriangle } from "lucide-react";

interface BankReconciliationFormProps {
  selectedAccountId: number | "";
  setSelectedAccountId: (id: number | "") => void;
  bankAccounts: any[];
  statementDate: string;
  setStatementDate: (date: string) => void;
  statementBalance: number | "";
  setStatementBalance: (bal: number | "") => void;
  openingBalance: number;
  calculation: any;
  formatCurrency: (val: number) => string;
  setIsAdjModalOpen: (open: boolean) => void;
  handleSaveReconciliation: () => void;
  fiscalYears: any[] | undefined;
}

export const BankReconciliationForm: React.FC<BankReconciliationFormProps> = ({
  selectedAccountId,
  setSelectedAccountId,
  bankAccounts,
  statementDate,
  setStatementDate,
  statementBalance,
  setStatementBalance,
  openingBalance,
  calculation,
  formatCurrency,
  setIsAdjModalOpen,
  handleSaveReconciliation,
  fiscalYears,
}) => {
  return (
    <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto pr-1">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5 text-indigo-500" /> إعدادات المطابقة
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">الحساب البنكي</label>
            <select
              value={selectedAccountId || ""}
              onChange={(e) => setSelectedAccountId(Number(e.target.value))}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            >
              <option value="">اختر الحساب...</option>
              {bankAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} - {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">تاريخ الكشف (Statement Date)</label>
            <input
              type="date"
              value={statementDate}
              onChange={(e) => setStatementDate(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">رصيد الكشف النهائي (Ending Balance)</label>
            <div className="relative">
              <input
                type="number"
                onFocus={(e) => e.target.select()}
                value={statementBalance}
                onChange={(e) => setStatementBalance(Number(e.target.value))}
                placeholder="0.00"
                className="w-full p-3 bg-white border-2 border-indigo-100 rounded-xl font-black outline-none focus:border-indigo-500 text-lg text-left text-slate-800"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">عملة</span>
            </div>
          </div>
        </div>
      </div>

      {selectedAccountId && (
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex-1 flex flex-col justify-between border border-slate-800">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="text-slate-400 text-xs font-bold">الرصيد الافتتاحي (آخر مطابقة)</span>
              <span className="font-mono font-bold">{formatCurrency(openingBalance)}</span>
            </div>
            <div className="flex justify-between items-center text-emerald-400">
              <span className="text-sm font-bold flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> إيداعات مطابقة
              </span>
              <span className="font-mono font-bold">{formatCurrency(calculation.clearedDeposits)}</span>
            </div>
            <div className="flex justify-between items-center text-red-400">
              <span className="text-sm font-bold flex items-center gap-2">
                <PlusCircle className="w-4 h-4 rotate-45" /> سحوبات مطابقة
              </span>
              <span className="font-mono font-bold">{formatCurrency(calculation.clearedPayments)}</span>
            </div>
            <div className="pt-4 border-t border-white/20">
              <div className="flex justify-between items-center mb-1">
                <span className="text-white font-bold">الرصيد المحتسب (Cleared)</span>
                <span className="font-black text-xl font-mono">{formatCurrency(calculation.clearedBalance)}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>رصيد الكشف (Statement)</span>
                <span className="font-mono">{formatCurrency(Number(statementBalance) || 0)}</span>
              </div>
            </div>
          </div>

          <div className={`mt-6 p-4 rounded-2xl text-center border-2 transition-all ${
            calculation.isBalanced
              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
              : "bg-red-500/20 border-red-500/50 text-red-300"
          }`}>
            <p className="text-xs uppercase font-bold mb-1">الفارق (Difference)</p>
            <p className="text-3xl font-black font-mono tracking-tight">{formatCurrency(calculation.difference)}</p>
            {calculation.isBalanced ? (
              <div className="flex items-center justify-center gap-1 mt-2 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> متطابق
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1 mt-2 text-xs font-bold text-red-400">
                <AlertTriangle className="w-4 h-4" /> غير متطابق
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {!calculation.isBalanced && (
              <button
                onClick={() => setIsAdjModalOpen(true)}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm transition-colors border border-white/10 flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" /> إضافة تسوية / عمولة
              </button>
            )}
            <button
              onClick={handleSaveReconciliation}
              disabled={
                !calculation.isBalanced ||
                !statementBalance ||
                fiscalYears?.some((fy) => {
                  const d = new Date(statementDate).getTime();
                  const start = new Date(fy.startDate).setHours(0, 0, 0, 0);
                  const end = new Date(fy.endDate).setHours(23, 59, 59, 999);
                  return d >= start && d <= end && fy.status === "closed";
                })
              }
              className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> اعتماد وحفظ التسوية
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
