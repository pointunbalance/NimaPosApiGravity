import React from 'react';
import { Trash2, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { StudentSubscription } from './useSchoolFees';

interface SchoolSubscriptionsTableProps {
  filteredSubscriptions: StudentSubscription[];
  getStudentName: (id: number) => string;
  getFeeTypeName: (id: number) => string;
  handleDeleteSub: (id: number) => void;
}

export const SchoolSubscriptionsTable: React.FC<SchoolSubscriptionsTableProps> = ({
  filteredSubscriptions,
  getStudentName,
  getFeeTypeName,
  handleDeleteSub,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3.5 h-3.5" /> مسدد بالكامل
          </span>
        );
      case 'partial':
        return (
          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
            <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" /> مسدد جزئياً
          </span>
        );
      default:
        return (
          <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
            <AlertCircle className="w-3.5 h-3.5" /> غير مسدد
          </span>
        );
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-right">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
          <tr>
            <th className="px-6 py-4.5">الطالب</th>
            <th className="px-6 py-4.5">باقة الرسوم</th>
            <th className="px-6 py-4.5">المبلغ الكلي</th>
            <th className="px-6 py-4.5">المدفوع</th>
            <th className="px-6 py-4.5">المتبقي</th>
            <th className="px-6 py-4.5">تاريخ الاستحقاق</th>
            <th className="px-6 py-4.5">حالة السداد</th>
            <th className="px-6 py-4.5 text-center">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {filteredSubscriptions.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-bold text-lg">
                لا يوجد أي سجلات اشتراك رسوم مطابقة لخيارات البحث الحالية.
              </td>
            </tr>
          ) : (
            filteredSubscriptions.map((sub) => (
              <tr key={sub.id} className="hover:bg-slate-50/50 transition duration-150">
                <td className="px-6 py-4">
                  <div className="font-extrabold text-slate-800">{getStudentName(sub.studentId)}</div>
                  <div className="text-xs text-slate-400 font-semibold mt-0.5">معرف الطالب #{sub.studentId}</div>
                </td>
                <td className="px-6 py-4 font-bold text-slate-700">
                  {getFeeTypeName(sub.feeTypeId)}
                </td>
                <td className="px-6 py-4 font-black text-slate-900">{sub.totalRequired} ج.م</td>
                <td className="px-6 py-4 font-bold text-emerald-600">+{sub.totalPaid || 0} ج.م</td>
                <td className="px-6 py-4 font-black text-rose-600">{sub.remainingAmount} ج.م</td>
                <td className="px-6 py-4 text-slate-500 font-mono font-bold">
                  {sub.dueDate}
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(sub.status)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleDeleteSub(sub.id!)}
                      className="p-2 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 rounded-lg transition cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
