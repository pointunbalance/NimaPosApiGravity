import React from "react";
import { Landmark, Plus } from "lucide-react";

interface TreasuryHeaderProps {
  onAddAccount: () => void;
  onNewTransaction: () => void;
}

const TreasuryHeader: React.FC<TreasuryHeaderProps> = ({
  onAddAccount,
  onNewTransaction,
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
          <Landmark className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            إدارة الخزينة والسيولة
          </h1>
          <p className="text-slate-500">
            متابعة الأرصدة، الحسابات البنكية، والتدفقات النقدية
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onAddAccount}
          className="bg-white text-emerald-600 border border-emerald-600 px-4 py-2 rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-2 shadow-sm font-bold"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة خزينة / حساب</span>
        </button>
        <button
          onClick={onNewTransaction}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm font-bold"
        >
          <Plus className="w-5 h-5" />
          <span>تسجيل حركة جديدة</span>
        </button>
      </div>
    </div>
  );
};

export default TreasuryHeader;
