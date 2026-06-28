import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { User } from '../../types';
import { Banknote } from 'lucide-react';

interface PayrollTabProps {
  user: User;
}

export const PayrollTab: React.FC<PayrollTabProps> = ({ user }) => {
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const currency = settings?.currency || 'ج.م';

  const myPayroll = useLiveQuery(async () => {
    if (!user?.name) return [];
    const expenses = await db.expenses.where('category').equals('salary').reverse().toArray();
    return expenses.filter(e => e.title.includes(user.name));
  }, [user?.name]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800">مسير الرواتب الخاص بي</h2>
        <p className="text-sm text-gray-500">سجل الرواتب التي تم صرفها لك</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {myPayroll?.map(payroll => (
          <div key={payroll.id} className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-indigo-300 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="font-bold text-gray-800">{payroll.title.split(' - ')[0]}</div>
              <div className="text-xs text-gray-500">{new Date(payroll.date).toLocaleDateString('ar-EG')}</div>
            </div>
            <div className="text-3xl font-black text-indigo-600 mb-4">
              {payroll.amount.toLocaleString()} <span className="text-sm font-normal text-gray-500">{currency}</span>
            </div>
            <div className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-100">
              {payroll.notes || 'لا توجد تفاصيل إضافية'}
            </div>
          </div>
        ))}
        {myPayroll?.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <Banknote className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p>لم يتم تسجيل أي رواتب لك في النظام بعد</p>
          </div>
        )}
      </div>
    </div>
  );
};
