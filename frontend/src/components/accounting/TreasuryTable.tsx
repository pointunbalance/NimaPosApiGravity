import React from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Edit,
  Trash2,
} from "lucide-react";
import { TreasuryTransaction, TreasuryAccount } from "../../types";

interface TreasuryTableProps {
  filteredTransactions: TreasuryTransaction[];
  treasuryAccounts: TreasuryAccount[];
  getAccountName: (accountIdStr?: string, accountIdNum?: number) => string;
  getCategoryName: (category: string) => string;
  getPaymentMethodName: (method: string) => string;
  onEdit: (transaction: TreasuryTransaction) => void;
  onDelete: (id: number) => void;
}

const TreasuryTable: React.FC<TreasuryTableProps> = ({
  filteredTransactions,
  treasuryAccounts,
  getAccountName,
  getCategoryName,
  getPaymentMethodName,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="p-4 text-slate-600 font-bold">التاريخ</th>
              <th className="p-4 text-slate-600 font-bold">النوع</th>
              <th className="p-4 text-slate-600 font-bold">الحساب</th>
              <th className="p-4 text-slate-600 font-bold">التصنيف</th>
              <th className="p-4 text-slate-600 font-bold">البيان</th>
              <th className="p-4 text-slate-600 font-bold">المبلغ</th>
              <th className="p-4 text-slate-600 font-bold">طريقة الدفع</th>
              <th className="p-4 text-slate-600 font-bold">الحالة</th>
              <th className="p-4 text-slate-600 font-bold text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTransactions.map((transaction) => (
              <tr
                key={transaction.id}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="p-4 text-slate-600">
                  {new Date(transaction.date).toLocaleDateString("ar-EG")}
                </td>
                <td className="p-4">
                  {transaction.type === "inflow" ? (
                    <span className="text-emerald-600 flex items-center gap-1 font-bold">
                      <ArrowUpRight className="w-4 h-4" /> وارد
                    </span>
                  ) : transaction.type === "outflow" ? (
                    <span className="text-rose-600 flex items-center gap-1 font-bold">
                      <ArrowDownRight className="w-4 h-4" /> صادر
                    </span>
                  ) : (
                    <span className="text-blue-600 flex items-center gap-1 font-bold">
                      <RefreshCw className="w-4 h-4" /> تحويل
                    </span>
                  )}
                </td>
                <td className="p-4 text-slate-600 font-bold">
                  {transaction.type === "transfer" ? (
                    <span className="text-xs">
                      من {getAccountName(transaction.sourceAccount, transaction.sourceAccountId)}{" "}
                      <br /> إلى{" "}
                      {getAccountName(
                        transaction.destinationAccount,
                        transaction.destinationAccountId
                      )}
                    </span>
                  ) : (
                    getAccountName(transaction.sourceAccount, transaction.sourceAccountId)
                  )}
                </td>
                <td className="p-4 text-slate-600">
                  {getCategoryName(transaction.category)}
                </td>
                <td className="p-4">
                  <div className="font-bold text-slate-800">
                    {transaction.description}
                  </div>
                  {transaction.referenceNumber && (
                    <div className="text-xs text-slate-500 mt-1 font-mono">
                      مرجع: {transaction.referenceNumber}
                    </div>
                  )}
                </td>
                <td
                  className={`p-4 font-black ${
                    transaction.type === "inflow"
                      ? "text-emerald-600"
                      : transaction.type === "outflow"
                      ? "text-rose-600"
                      : "text-blue-600"
                  }`}
                >
                  {transaction.type === "inflow"
                    ? "+"
                    : transaction.type === "outflow"
                    ? "-"
                    : ""}
                  {transaction.amount.toLocaleString()}
                </td>
                <td className="p-4 text-slate-600">
                  {getPaymentMethodName(transaction.paymentMethod)}
                </td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      transaction.status === "completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : transaction.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {transaction.status === "completed"
                      ? "مكتمل"
                      : transaction.status === "pending"
                      ? "معلق"
                      : "ملغي"}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onEdit(transaction)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="تعديل"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => transaction.id && onDelete(transaction.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-500 font-bold">
                  لا توجد حركات مسجلة تطابق معايير البحث.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TreasuryTable;
