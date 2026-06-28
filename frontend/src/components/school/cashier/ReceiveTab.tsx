import React from 'react';
import { Plus } from 'lucide-react';

interface ReceiveTabProps {
  shiftPayments: any[];
  subscriptions: any[];
  getStudentName: (id: number) => string;
  getFeeTypeName: (id: number) => string;
  setPaymentModalOpen: (open: boolean) => void;
}

export const ReceiveTab: React.FC<ReceiveTabProps> = ({
  shiftPayments,
  subscriptions,
  getStudentName,
  getFeeTypeName,
  setPaymentModalOpen,
}) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-300" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">إصدار إيصال قبض (طالب)</h2>
        <button
          onClick={() => setPaymentModalOpen(true)}
          type="button"
          className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 transition shadow-md"
        >
          <Plus className="w-4 h-4" /> إيصال جديد
        </button>
      </div>
      {shiftPayments.length === 0 ? (
        <div className="text-center p-8 text-slate-500 font-bold border-2 border-dashed border-slate-100 rounded-2xl">
          لا يوجد أي مدفوعات مسجلة في هذه الوردية
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-slate-600 font-bold">رقم الإيصال</th>
                <th className="p-4 text-slate-600 font-bold">الطالب</th>
                <th className="p-4 text-slate-600 font-bold">المشترك فيه / البيان</th>
                <th className="p-4 text-slate-600 font-bold">وسيلة الدفع</th>
                <th className="p-4 text-slate-600 font-bold">المبلغ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {shiftPayments.map((p) => {
                const sub = subscriptions.find((s) => s.id === p.subscriptionId);
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-500 font-mono font-bold">{p.receiptNumber}</td>
                    <td className="p-4 font-bold text-slate-800">{getStudentName(p.studentId)}</td>
                    <td className="p-4 font-medium text-slate-600">
                      {sub ? getFeeTypeName(sub.feeTypeId) : 'مبلغ عام (دفعة)'}
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">
                        {p.paymentMethod === 'cash'
                          ? 'نقدي'
                          : p.paymentMethod === 'bank_transfer'
                          ? 'بنكي'
                          : p.paymentMethod}
                      </span>
                    </td>
                    <td className="p-4 font-black text-emerald-600">+{p.amount} ج.م</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
export default ReceiveTab;
