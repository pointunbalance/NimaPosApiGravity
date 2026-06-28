import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { User } from '../../types';

interface BenefitsTabProps {
  user: User;
}

export const BenefitsTab: React.FC<BenefitsTabProps> = ({ user }) => {
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const currency = settings?.currency || 'ج.م';

  const myBenefits = useLiveQuery(async () => {
    if (!user?.id) return [];
    const allBenefits = await db.employeeBenefits.toArray();
    return allBenefits.filter(b => b.employeeIds?.includes(user.id!));
  }, [user?.id]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800">المزايا</h2>
        <p className="text-sm text-gray-500">مراجعة المزايا المخصصة لك</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">اسم الميزة</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">النوع</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">التكلفة الشهرية</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">الوصف</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {myBenefits?.map(record => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">{record.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {record.type === 'health_insurance' && 'تأمين صحي'}
                  {record.type === 'health' && 'صحة'}
                  {record.type === 'allowance' && 'بدل'}
                  {record.type === 'other' && 'أخرى'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 font-bold">{record.monthlyCost} {currency}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{record.description || '-'}</td>
              </tr>
            ))}
            {myBenefits?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">لا توجد مزايا مسجلة</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
