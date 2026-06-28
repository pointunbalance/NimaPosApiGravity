import React from 'react';

interface TripExpensesTabProps {
  trip: any;
  handleUpdateTransportCost: (amount: number) => void;
  newExpenseDesc: string;
  setNewExpenseDesc: (val: string) => void;
  newExpenseAmount: string;
  setNewExpenseAmount: (val: string) => void;
  handleAddExpense: () => void;
  handleRemoveExpense: (index: number) => void;
}

export const TripExpensesTab: React.FC<TripExpensesTabProps> = ({
  trip,
  handleUpdateTransportCost,
  newExpenseDesc,
  setNewExpenseDesc,
  newExpenseAmount,
  setNewExpenseAmount,
  handleAddExpense,
  handleRemoveExpense,
}) => {
  return (
    <div className="space-y-6">
      {/* Transportation Expense */}
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">تكلفة تأجير الحافلات والمواصلات (ج.م)</label>
        <div className="flex gap-3 max-w-xs">
          <input
            type="number"
            min="0"
            value={trip.transportCost || 0}
            onChange={(e) => handleUpdateTransportCost(Number(e.target.value))}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
          />
          <span className="bg-slate-100 font-bold text-slate-600 px-3 py-2 rounded-xl flex items-center text-xs">
            ج.م
          </span>
        </div>
      </div>

      {/* Extra expenses list and form */}
      <div className="border-t border-slate-200 pt-4">
        <h4 className="font-bold text-slate-800 mb-3 text-sm">التكاليف الإضافية والمسليات:</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <input
            type="text"
            placeholder="وصف المصروف (مثل: تذاكر ملاهي)"
            value={newExpenseDesc}
            onChange={(e) => setNewExpenseDesc(e.target.value)}
            className="md:col-span-2 px-3 py-2 border border-slate-200 rounded-xl text-sm"
          />
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="المبلغ"
              value={newExpenseAmount}
              onChange={(e) => setNewExpenseAmount(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold"
            />
            <button
              onClick={handleAddExpense}
              className="bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-rose-700 transition cursor-pointer"
            >
              إضافة
            </button>
          </div>
        </div>

        <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">وصف البند</th>
                <th className="p-3">المبلغ (ج.م)</th>
                <th className="p-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-medium">
              {(trip.additionalExpenses || []).map((exp: any, index: number) => (
                <tr key={index}>
                  <td className="p-3 text-slate-800 font-bold">{exp.description}</td>
                  <td className="p-3 text-rose-600 font-black font-mono">{exp.amount} ج.م</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleRemoveExpense(index)}
                      className="text-rose-500 hover:text-rose-700 cursor-pointer"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
              {(trip.additionalExpenses || []).length === 0 && (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-slate-400 font-medium">
                    لا توجد مصروفات إضافية مسجلة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default TripExpensesTab;
