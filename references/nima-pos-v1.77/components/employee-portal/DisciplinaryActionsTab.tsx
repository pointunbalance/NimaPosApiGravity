import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { User } from '../../types';

interface DisciplinaryActionsTabProps {
  user: User;
}

export const DisciplinaryActionsTab: React.FC<DisciplinaryActionsTabProps> = ({ user }) => {
  const myDisciplinaryActions = useLiveQuery(() => {
    if (!user?.id) return [];
    return db.disciplinaryActions.where('employeeId').equals(user.id).reverse().toArray();
  }, [user?.id]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800">الإجراءات التأديبية</h2>
        <p className="text-sm text-gray-500">مراجعة الإجراءات التأديبية الخاصة بك</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">التاريخ</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">النوع</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">السبب</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {myDisciplinaryActions?.map(record => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">{new Date(record.date).toLocaleDateString('ar-EG')}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {record.type === 'verbal_warning' && 'إنذار شفهي'}
                  {record.type === 'written_warning' && 'إنذار كتابي'}
                  {record.type === 'warning' && 'إنذار'}
                  {record.type === 'deduction' && 'خصم'}
                  {record.type === 'suspension' && 'إيقاف'}
                  {record.type === 'termination' && 'إنهاء خدمة'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{record.reason}</td>
                <td className="px-4 py-3 text-sm">
                  {record.status === 'pending' && <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">قيد المراجعة</span>}
                  {record.status === 'active' && <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">نشط</span>}
                  {record.status === 'resolved' && <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs">تم الحل</span>}
                  {record.status === 'applied' && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">تم التطبيق</span>}
                  {record.status === 'appealed' && <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">مستأنف</span>}
                  {record.status === 'cancelled' && <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">ملغي</span>}
                </td>
              </tr>
            ))}
            {myDisciplinaryActions?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">لا توجد إجراءات تأديبية مسجلة</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
