import React from "react";
import { FileText, ArrowLeft } from "lucide-react";
import { Account } from "../../types";
import { ClosingData } from "./useFiscalYearClosingData";

interface FiscalYearSetupStepProps {
  startDate: string;
  setStartDate: (val: string) => void;
  closingDate: string;
  setClosingDate: (val: string) => void;
  retainedEarningsId: number | "";
  setRetainedEarningsId: (val: number) => void;
  accounts: Account[];
  financialSummary: ClosingData;
  formatCurrency: (val: number) => string;
  onNext: () => void;
}

const FiscalYearSetupStep: React.FC<FiscalYearSetupStepProps> = ({
  startDate,
  setStartDate,
  closingDate,
  setClosingDate,
  retainedEarningsId,
  setRetainedEarningsId,
  accounts,
  financialSummary,
  formatCurrency,
  onNext,
}) => {
  const equityAccounts = accounts.filter((a) => a.type === "equity");

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 animate-in fade-in slide-in-from-bottom-4">
      <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-4">
        إعدادات الإقفال
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            بداية الفترة
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:light]"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            تاريخ الإقفال (نهاية الفترة)
          </label>
          <input
            type="date"
            value={closingDate}
            onChange={(e) => setClosingDate(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:light]"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-slate-700 mb-2">
            حساب الأرباح المبقاة (Equity)
          </label>
          <select
            value={retainedEarningsId}
            onChange={(e) => setRetainedEarningsId(Number(e.target.value))}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">اختر حساب الترحيل...</option>
            {equityAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} - {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 mb-6">
        <h3 className="text-indigo-800 font-bold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" /> ملخص الفترة (محاكاة)
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center font-bold">
          <div className="bg-white p-3 rounded-xl shadow-sm">
            <p className="text-xs text-slate-500 mb-1">الإيرادات</p>
            <p className="text-lg font-bold text-emerald-600">
              {formatCurrency(financialSummary.revenue)}
            </p>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm">
            <p className="text-xs text-slate-500 mb-1">المصروفات</p>
            <p className="text-lg font-bold text-red-600">
              {formatCurrency(financialSummary.expenses)}
            </p>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm border-2 border-indigo-100">
            <p className="text-xs text-slate-500 mb-1">صافي النتيجة</p>
            <p
              className={`text-lg font-black ${
                financialSummary.netIncome >= 0 ? "text-emerald-700" : "text-red-700"
              }`}
            >
              {formatCurrency(financialSummary.netIncome)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!retainedEarningsId}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          التالي <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default FiscalYearSetupStep;
