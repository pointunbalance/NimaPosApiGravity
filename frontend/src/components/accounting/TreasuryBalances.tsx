import React from "react";
import { Activity, Building2, Landmark, Wallet } from "lucide-react";
import { TreasuryAccount } from "../../types";

interface TreasuryBalancesProps {
  treasuryAccounts: TreasuryAccount[];
  calculateBalance: (accountId: number | string) => number;
  totalBalance: number;
}

const TreasuryBalances: React.FC<TreasuryBalancesProps> = ({
  treasuryAccounts,
  calculateBalance,
  totalBalance,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl shadow-sm text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-emerald-50 font-medium">إجمالي السيولة المتاحة</h3>
          <div className="p-2 bg-white/20 rounded-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
        </div>
        <p className="text-3xl font-bold">
          {totalBalance.toLocaleString()}{" "}
          <span className="text-sm font-normal opacity-80">ر.س</span>
        </p>
      </div>

      {treasuryAccounts.map((account) => {
        const bal = calculateBalance(account.id || account.type);
        const isBank = account.type === "bank";
        const isSafe =
          account.type === "safe" ||
          account.type === "cashier" ||
          account.type === "representative";

        return (
          <div
            key={account.id}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                {account.name}
              </h3>
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  isBank
                    ? "bg-blue-50 text-blue-600"
                    : isSafe
                    ? "bg-amber-50 text-amber-600"
                    : "bg-purple-50 text-purple-600"
                }`}
              >
                {isBank ? (
                  <Building2 className="w-5 h-5" />
                ) : isSafe ? (
                  <Landmark className="w-5 h-5" />
                ) : (
                  <Wallet className="w-5 h-5" />
                )}
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 truncate">
              {bal.toLocaleString()}{" "}
              <span className="text-sm text-slate-500 font-normal">ر.س</span>
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default TreasuryBalances;
