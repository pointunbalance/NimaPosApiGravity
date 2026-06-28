import React from 'react';
import { Plus } from 'lucide-react';

interface TransportExpensesTabProps {
  expenses: any[];
  setExpenseModalOpen: (val: boolean) => void;
}

export const TransportExpensesTab: React.FC<TransportExpensesTabProps> = ({
  expenses,
  setExpenseModalOpen,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6 border-b border-rose-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-rose-900">مصروفات الباص والوقود</h2>
          <p className="text-sm text-rose-600 mt-1">
            تؤثر هذه المصروفات تلقائياً على المحاسبة العامة والحسابات الخاصة بالنقل.
          </p>
        </div>
        <button
          onClick={() => {
            setExpenseModalOpen(true);
          }}
          className="bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-rose-700 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> تسجيل مصروف باص
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6">
          <h4 className="text-rose-900 font-bold mb-2">إجمالي منصرفات الباصات</h4>
          <div className="text-3xl font-black text-rose-700 font-mono">
            {expenses.reduce((a, b) => a + (b.amount || 0), 0)} <span className="text-lg font-bold font-sans">ج.م</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border border-rose-100 rounded-2xl">
        <table className="w-full text-sm text-right">
          <thead className="bg-rose-50 text-rose-800 font-bold border-b border-rose-100">
            <tr>
              <th className="p-4">التاريخ</th>
              <th className="p-4">مبلغ المنصرف</th>
              <th className="p-4">تفاصيل المصروف</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rose-50 bg-white">
            {expenses
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((exp) => (
                <tr key={exp.id}>
                  <td className="p-4 font-mono font-bold text-slate-500">
                    {new Date(exp.date).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="p-4 font-black text-rose-600 font-mono">{exp.amount} ج.م</td>
                  <td className="p-4">
                    <p className="font-bold text-slate-800">{exp.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{exp.notes}</p>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default TransportExpensesTab;
