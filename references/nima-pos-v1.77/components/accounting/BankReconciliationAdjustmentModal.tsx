import React from "react";
import { X } from "lucide-react";

interface BankReconciliationAdjustmentModalProps {
  isAdjModalOpen: boolean;
  setIsAdjModalOpen: (open: boolean) => void;
  adjType: "fee" | "interest";
  setAdjType: (type: "fee" | "interest") => void;
  adjAmount: number | "";
  setAdjAmount: (amount: number | "") => void;
  adjDate: string;
  setAdjDate: (date: string) => void;
  adjExpenseAccId: number | "";
  setAdjExpenseAccId: (id: number | "") => void;
  expenseAccounts: any[];
  revenueAccounts: any[];
  handleAddAdjustment: () => void;
}

export const BankReconciliationAdjustmentModal: React.FC<BankReconciliationAdjustmentModalProps> = ({
  isAdjModalOpen,
  setIsAdjModalOpen,
  adjType,
  setAdjType,
  adjAmount,
  setAdjAmount,
  adjDate,
  setAdjDate,
  adjExpenseAccId,
  setAdjExpenseAccId,
  expenseAccounts,
  revenueAccounts,
  handleAddAdjustment,
}) => {
  if (!isAdjModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-right" dir="rtl">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="font-bold text-xl text-slate-800">إضافة تسوية بنكية</h3>
          <button onClick={() => setIsAdjModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setAdjType("fee")}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                adjType === "fee" ? "bg-white text-red-600 shadow-sm" : "text-slate-500"
              }`}
            >
              مصروفات بنكية (خصم)
            </button>
            <button
              onClick={() => setAdjType("interest")}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                adjType === "interest" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"
              }`}
            >
              فوائد دائنة (إضافة)
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">المبلغ</label>
            <input
              type="number"
              onFocus={(e) => e.target.select()}
              value={adjAmount}
              onChange={(e) => setAdjAmount(Number(e.target.value))}
              className="w-full border border-slate-200 p-3 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
              placeholder="0.00"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">تاريخ العملية</label>
            <input
              type="date"
              value={adjDate}
              onChange={(e) => setAdjDate(e.target.value)}
              className="w-full border border-slate-200 p-3 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">الحساب المقابل (مصروف/إيراد)</label>
            <select
              value={adjExpenseAccId}
              onChange={(e) => setAdjExpenseAccId(Number(e.target.value))}
              className="w-full border border-slate-200 p-3 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-800"
            >
              <option value="">اختر الحساب...</option>
              {(adjType === "fee" ? expenseAccounts : revenueAccounts).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} - {a.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAddAdjustment}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg mt-2"
          >
            حفظ وإضافة للقيد
          </button>
        </div>
      </div>
    </div>
  );
};
