import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { User } from '../../types';

interface TrainingEnrollmentsTabProps {
  user: User;
}

export const TrainingEnrollmentsTab: React.FC<TrainingEnrollmentsTabProps> = ({ user }) => {
  const myTrainings = useLiveQuery(() => {
    if (!user?.id) return [];
    return db.trainingEnrollments.where('employeeId').equals(user.id).reverse().toArray();
  }, [user?.id]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800">الدورات التدريبية</h2>
        <p className="text-sm text-gray-500">متابعة الدورات التدريبية المسجل بها</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">تاريخ التسجيل</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">نسبة الإنجاز</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">الحالة</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">ملاحظات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {myTrainings?.map(record => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">{new Date(record.enrollmentDate).toLocaleDateString('ar-EG')}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${record.progress}%` }}></div>
                    </div>
                    <span className="text-xs font-medium">{record.progress}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  {record.status === 'enrolled' && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">مسجل</span>}
                  {record.status === 'in_progress' && <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">قيد التنفيذ</span>}
                  {record.status === 'completed' && <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs">مكتمل</span>}
                  {record.status === 'failed' && <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">فشل</span>}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{record.notes || '-'}</td>
              </tr>
            ))}
            {myTrainings?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">لا توجد دورات تدريبية مسجلة</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
