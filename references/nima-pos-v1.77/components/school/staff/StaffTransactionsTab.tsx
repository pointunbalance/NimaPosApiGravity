import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { db } from '../../../db';

interface StaffTransactionsTabProps {
  transactions: any[];
  staff: any[];
  setTransFormData: (data: any) => void;
  setTransModalOpen: (open: boolean) => void;
  openConfirm: (title: string, message: string, onConfirm: () => void) => void;
  success: (msg: string) => void;
  error: (msg: string) => void;
}

export const StaffTransactionsTab: React.FC<StaffTransactionsTabProps> = ({
  transactions,
  staff,
  setTransFormData,
  setTransModalOpen,
  openConfirm,
  success,
  error,
}) => {
  const currentMonthStr = React.useMemo(() => new Date().toISOString().slice(0, 7), []);

  const totalBonuses = React.useMemo(() => {
    return transactions
      .filter((t) => t.type === 'bonus' && t.date.startsWith(currentMonthStr))
      .reduce((a, b) => a + b.amount, 0);
  }, [transactions, currentMonthStr]);

  const totalDeductions = React.useMemo(() => {
    return transactions
      .filter((t) => ['deduction', 'absence'].includes(t.type) && t.date.startsWith(currentMonthStr))
      .reduce((a, b) => a + b.amount, 0);
  }, [transactions, currentMonthStr]);

  const totalAdvances = React.useMemo(() => {
    return transactions
      .filter((t) => t.type === 'advance' && t.date.startsWith(currentMonthStr))
      .reduce((a, b) => a + b.amount, 0);
  }, [transactions, currentMonthStr]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex flex-col justify-center">
          <h3 className="text-emerald-800 font-bold mb-1">إجمالي المكافآت (هذا الشهر)</h3>
          <p className="text-2xl font-black text-emerald-600">{totalBonuses} ج.م</p>
        </div>
        <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl flex flex-col justify-center">
          <h3 className="text-rose-800 font-bold mb-1">إجمالي الخصومات (هذا الشهر)</h3>
          <p className="text-2xl font-black text-rose-600">{totalDeductions} ج.م</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl flex flex-col justify-center">
          <h3 className="text-amber-800 font-bold mb-1">إجمالي السلف</h3>
          <p className="text-2xl font-black text-amber-600">{totalAdvances} ج.م</p>
        </div>
        <button
          onClick={() => {
            setTransFormData({
              userId: 0,
              type: 'bonus',
              amount: 0,
              date: new Date().toISOString().split('T')[0],
              description: '',
            });
            setTransModalOpen(true);
          }}
          type="button"
          className="bg-white border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center p-5 hover:bg-slate-50 transition text-slate-600 cursor-pointer"
        >
          <Plus className="w-8 h-8 mb-2" />
          <span className="font-bold">تسجيل حركة موظف</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-right text-sm font-bold text-slate-600">التاريخ</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-slate-600">الموظف</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-slate-600">نوع الحركة</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-slate-600">القيمة والبيان</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white relative">
            {transactions
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-slate-600 font-mono text-sm">{t.date}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">
                    {staff.find((s) => s.id === t.userId)?.name || 'غير معروف'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        t.type === 'bonus'
                          ? 'bg-emerald-100 text-emerald-700'
                          : t.type === 'advance'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {t.type === 'bonus'
                        ? 'مكافأة'
                        : t.type === 'deduction'
                        ? 'خصم مالي'
                        : t.type === 'advance'
                        ? 'سلفة'
                        : t.type === 'absence'
                        ? 'غياب'
                        : 'تأخير'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-black text-slate-800">{t.amount} ج.م</p>
                    <p className="text-xs text-slate-500 mt-1">{t.description}</p>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <button
                      onClick={() => {
                        openConfirm(
                          'تأكيد حذف المعاملة',
                          'هل تود حذف هذه المعاملة المالية المسجلة للموظف؟ سيؤثر هذا على صافي راتبه المستقبلي.',
                          async () => {
                            try {
                              await db.staffTransactions.delete(t.id!);
                              success('تم اختيار وحذف المعاملة المالية بنجاح للدفتر');
                            } catch (err) {
                              error('فشل إلغاء الحركة المالية للموظف');
                            }
                          }
                        );
                      }}
                      type="button"
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  لا توجد حركات مسجلة.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default StaffTransactionsTab;
