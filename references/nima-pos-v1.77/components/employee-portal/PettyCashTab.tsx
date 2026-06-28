import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { User } from '../../types';
import { X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface PettyCashTabProps {
  user: User;
}

export const PettyCashTab: React.FC<PettyCashTabProps> = ({ user }) => {
  const { showToast } = useToast();
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedPettyCashId, setSelectedPettyCashId] = useState<number | null>(null);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');

  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const currency = settings?.currency || 'ج.م';

  const myPettyCash = useLiveQuery(() => {
    if (!user?.name) return [];
    return db.pettyCash.where('employeeName').equals(user.name).reverse().toArray();
  }, [user?.name]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPettyCashId || !expenseAmount || !expenseDescription) return;

    try {
      const pettyCash = await db.pettyCash.get(selectedPettyCashId);
      if (!pettyCash) return;

      const newExpense = {
        id: crypto.randomUUID(),
        date: new Date(),
        amount: Number(expenseAmount),
        description: expenseDescription
      };

      const updatedExpenses = [...(pettyCash.expenses || []), newExpense];
      
      await db.pettyCash.update(selectedPettyCashId, {
        expenses: updatedExpenses
      });

      showToast('تم إضافة المصروف بنجاح', 'success');
      setShowExpenseModal(false);
      setExpenseAmount('');
      setExpenseDescription('');
      setSelectedPettyCashId(null);
    } catch (error) {
      console.error('Error adding expense:', error);
      showToast('حدث خطأ أثناء إضافة المصروف', 'error');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800">العهد المالية</h2>
        <p className="text-sm text-gray-500">متابعة العهد المالية والمصروفات الخاصة بك</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">التاريخ</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">المبلغ</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">البيان</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">المصروفات</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">الحالة</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {myPettyCash?.map(pc => (
              <tr key={pc.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-600">{new Date(pc.date).toLocaleDateString('ar-EG')}</td>
                <td className="px-4 py-3 text-sm font-bold text-indigo-600">{pc.amount} {currency}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{pc.description || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600 font-bold">{pc.expenses?.length || 0}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    pc.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {pc.status === 'active' ? 'نشطة' : 'مغلقة'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {pc.status === 'active' && (
                    <button
                      onClick={() => {
                        setSelectedPettyCashId(pc.id!);
                        setShowExpenseModal(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900 font-medium text-xs bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      إضافة مصروف
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {myPettyCash?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">لا توجد عهد مالية مسجلة</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold font-cairo">إضافة مصروف جديد</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ ({currency})</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البيان</label>
                <textarea
                  required
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                ></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  حفظ المصروف
                </button>
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-6 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
