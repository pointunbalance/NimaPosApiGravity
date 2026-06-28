import React from 'react';
import { X, Receipt, DollarSign } from 'lucide-react';

interface SchoolExpenseModalProps {
  expenseModalOpen: boolean;
  setExpenseModalOpen: (val: boolean) => void;
  handleSaveExpense: (e: any) => void;
  expenseFormData: any;
  setExpenseFormData: (val: any) => void;
  routes: any[];
}

export const SchoolExpenseModal: React.FC<SchoolExpenseModalProps> = (props) => {
  const {
    expenseModalOpen,
    setExpenseModalOpen,
    handleSaveExpense,
    expenseFormData,
    setExpenseFormData,
    routes,
  } = props;
  if (!expenseModalOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-rose-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200 border border-rose-200">
        <div className="p-6 border-b border-rose-100 flex justify-between items-center bg-rose-50">
          <h3 className="text-xl font-black text-rose-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6" /> تسجيل مصروفات باص
          </h3>
          <button
            onClick={() => setExpenseModalOpen(false)}
            type="button"
            className="text-rose-700 hover:text-rose-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSaveExpense} className="p-6 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">الخط / الباص</label>
              <select
                value={expenseFormData.routeId}
                onChange={(e) =>
                  setExpenseFormData({ ...expenseFormData, routeId: Number(e.target.value) })
                }
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none text-slate-700"
              >
                <option value={0}>-- مصاريف نقل عامة --</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">المبلغ (ج.م)</label>
              <input
                required
                type="number"
                min="1"
                value={expenseFormData.amount}
                onChange={(e) =>
                  setExpenseFormData({ ...expenseFormData, amount: Number(e.target.value) })
                }
                className="w-full bg-slate-50 border border-rose-300 p-3 rounded-xl outline-none font-black text-rose-700 text-lg"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">نوع المصروف</label>
              <select
                value={expenseFormData.category}
                onChange={(e) =>
                  setExpenseFormData({ ...expenseFormData, category: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none text-slate-700"
              >
                <option value="fuel">وقود / بنزين</option>
                <option value="maintenance">صيانة</option>
                <option value="salary">راتب إضافي / مكافأة سائق</option>
                <option value="other">أخرى</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">البيان (التفاصيل)</label>
              <input
                required
                type="text"
                value={expenseFormData.description}
                onChange={(e) =>
                  setExpenseFormData({ ...expenseFormData, description: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none placeholder:text-slate-400 text-slate-700"
                placeholder="مثال: تفويلة بنزين 92.."
              />
            </div>
          </div>
          <div className="pt-6">
            <button
              type="submit"
              className="w-full bg-rose-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-rose-700"
            >
              تأكيد المصروف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SchoolExpenseModal;
