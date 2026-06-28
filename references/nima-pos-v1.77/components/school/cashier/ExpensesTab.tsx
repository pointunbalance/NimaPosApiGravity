import React from 'react';
import { Plus } from 'lucide-react';

interface ExpensesTabProps {
  shiftGeneralOps: any[];
  setTransactionModalOpen: (open: boolean) => void;
}

export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  shiftGeneralOps,
  setTransactionModalOpen,
}) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-300" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">حركة المصروفات والإيرادات العامة</h2>
        <button
          onClick={() => setTransactionModalOpen(true)}
          type="button"
          className="bg-slate-800 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-900 transition shadow-md"
        >
          <Plus className="w-4 h-4" /> حركة مالية جديدة
        </button>
      </div>
      {shiftGeneralOps.length === 0 ? (
        <div className="text-center p-8 text-slate-500 font-bold border-2 border-dashed border-slate-100 rounded-2xl">
          لا يوجد معاملات عامة في هذه الوردية
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-slate-600 font-bold">الرقم المرجعي</th>
                <th className="p-4 text-slate-600 font-bold">البيان / الوصف</th>
                <th className="p-4 text-slate-600 font-bold">وسيلة الدفع</th>
                <th className="p-4 text-slate-600 font-bold">النوع</th>
                <th className="p-4 text-slate-600 font-bold">المبلغ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {shiftGeneralOps.map((op) => (
                <tr key={op.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-slate-500 font-mono font-bold">{op.referenceNumber}</td>
                  <td className="p-4 font-bold text-slate-800">{op.description}</td>
                  <td className="p-4 text-slate-600 font-medium">
                    {op.paymentMethod === 'cash' ? 'نقدي' : op.paymentMethod}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        op.type === 'inflow'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {op.type === 'inflow' ? 'إيراد / توريد' : 'مصروف / سحب'}
                    </span>
                  </td>
                  <td
                    className={`p-4 font-black ${
                      op.type === 'inflow' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {op.type === 'inflow' ? '+' : '-'}
                    {op.amount} ج.م
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
export default ExpensesTab;
