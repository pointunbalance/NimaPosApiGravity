import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { User } from '../../types';
import { CheckCircle, XCircle } from 'lucide-react';

interface CommissionsTabProps {
  user: User;
}

export const CommissionsTab: React.FC<CommissionsTabProps> = ({ user }) => {
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const currency = settings?.currency || 'ج.م';

  const myCommissions = useLiveQuery(() => {
    if (!user?.id) return [];
    return db.commissions.where('employeeId').equals(user.id).reverse().toArray();
  }, [user?.id]);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved': return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs font-bold flex items-center justify-center gap-1 w-fit"><CheckCircle className="w-3 h-3"/> معتمد</span>;
      case 'rejected': return <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-md text-xs font-bold flex items-center justify-center gap-1 w-fit"><XCircle className="w-3 h-3"/> مرفوض</span>;
      case 'paid': return <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md text-xs font-bold flex items-center justify-center gap-1 w-fit"><CheckCircle className="w-3 h-3"/> تم الصرف</span>;
      default: return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-xs font-bold w-fit">قيد المراجعة</span>;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800">العمولات والحوافز</h2>
        <p className="text-sm text-gray-500">سجل العمولات والمكافآت الخاصة بك</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">التاريخ</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">المبلغ</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">ملاحظات</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {myCommissions?.map(commission => (
              <tr key={commission.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-600">{new Date(commission.date).toLocaleDateString('ar-EG')}</td>
                <td className="px-4 py-3 text-sm font-bold text-indigo-600">{commission.amount} {currency}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{commission.notes || '-'}</td>
                <td className="px-4 py-3">{getStatusBadge(commission.status)}</td>
              </tr>
            ))}
            {myCommissions?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">لا توجد عمولات مسجلة</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
