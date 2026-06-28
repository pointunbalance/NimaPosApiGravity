import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { User } from '../../types';

interface PerformanceAppraisalsTabProps {
  user: User;
}

export const PerformanceAppraisalsTab: React.FC<PerformanceAppraisalsTabProps> = ({ user }) => {
  const myAppraisals = useLiveQuery(() => {
    if (!user?.id) return [];
    return db.performanceAppraisals.where('employeeId').equals(user.id).reverse().toArray();
  }, [user?.id]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800">تقييم الأداء</h2>
        <p className="text-sm text-gray-500">مراجعة تقييمات الأداء الخاصة بك</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">الفترة</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">التاريخ</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">النتيجة الإجمالية</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">ملاحظات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {myAppraisals?.map(record => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">{record.period}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{new Date(record.date).toLocaleDateString('ar-EG')}</td>
                <td className="px-4 py-3 text-sm text-gray-900 font-bold">{record.overallScore}%</td>
                <td className="px-4 py-3 text-sm text-gray-600">{record.comments || '-'}</td>
              </tr>
            ))}
            {myAppraisals?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">لا توجد تقييمات أداء مسجلة</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
