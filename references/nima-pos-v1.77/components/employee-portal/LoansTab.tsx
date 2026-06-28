import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { User } from '../../types';
import { Plus, X, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface LoansTabProps {
  user: User;
}

export const LoansTab: React.FC<LoansTabProps> = ({ user }) => {
  const { showToast } = useToast();
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanAmount, setLoanAmount] = useState('');
  const [loanReason, setLoanReason] = useState('');
  const [loanInstallments, setLoanInstallments] = useState('1');
  const [loanStartDate, setLoanStartDate] = useState('');

  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const currency = settings?.currency || 'ج.م';

  const myLoans = useLiveQuery(() => {
    if (!user?.id) return [];
    return db.loans.where('userId').equals(user.id).reverse().toArray();
  }, [user?.id]);

  const submitLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanAmount || !loanStartDate || !loanInstallments || !user?.id) return;
    
    try {
      const amount = Number(loanAmount);
      const months = Number(loanInstallments);
      const monthlyDeduction = amount / months;

      await db.loans.add({
        userId: user.id,
        amount,
        reason: loanReason,
        installments: months,
        monthlyDeduction,
        startDate: new Date(loanStartDate),
        status: 'pending',
        remainingAmount: amount,
        createdAt: new Date()
      } as any);
      showToast('تم تقديم طلب السلفة بنجاح', 'success');
      setShowLoanModal(false);
      setLoanAmount('');
      setLoanInstallments('1');
      setLoanStartDate('');
      setLoanReason('');
    } catch (error) {
      showToast('حدث خطأ أثناء تقديم الطلب', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved': return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs font-bold flex items-center justify-center gap-1 w-fit"><CheckCircle className="w-3 h-3"/> معتمد</span>;
      case 'rejected': return <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-md text-xs font-bold flex items-center justify-center gap-1 w-fit"><XCircle className="w-3 h-3"/> مرفوض</span>;
      case 'paid': return <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md text-xs font-bold flex items-center justify-center gap-1 w-fit"><CheckCircle className="w-3 h-3"/> مسدد بالكامل</span>;
      default: return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-xs font-bold w-fit">قيد المراجعة</span>;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-gray-800">سلفاتي</h2>
        <button
          onClick={() => setShowLoanModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          طلب سلفة
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">التاريخ</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">المبلغ</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">عدد الأقساط</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">القسط الشهري</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">المتبقي</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {myLoans?.map(loan => (
              <tr key={loan.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-600">{new Date(loan.createdAt).toLocaleDateString('ar-EG')}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{loan.amount.toLocaleString()} {currency}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{loan.installmentMonths} شهور</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{loan.monthlyDeduction.toFixed(2)} {currency}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(loan.startDate).toLocaleDateString('ar-EG')}</td>
                      <td className="px-4 py-3">{getStatusBadge(loan.status)}</td>
              </tr>
            ))}
            {myLoans?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">لا توجد سلف سابقة</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Loan Modal */}
      {showLoanModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">طلب سلفة جديد</h3>
              <button onClick={() => setShowLoanModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={submitLoan} className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ المطلوب ({currency})</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ بداية الخصم</label>
                    <input
                      type="date"
                      required
                      value={loanStartDate}
                      onChange={(e) => setLoanStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">على كم قسط (شهر)؟</label>
                  <select
                    value={loanInstallments}
                    onChange={(e) => setLoanInstallments(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 10, 12, 18, 24].map(num => (
                      <option key={num} value={num}>{num} شهر</option>
                    ))}
                  </select>
                  {loanAmount && loanInstallments && (
                    <p className="mt-2 text-sm font-bold text-indigo-600">
                      القسط الشهري: {(Number(loanAmount) / Number(loanInstallments)).toLocaleString(undefined, {maximumFractionDigits: 2})} {currency}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">سبب طلب السلفة</label>
                  <textarea
                    required
                    value={loanReason}
                    onChange={(e) => setLoanReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                  ></textarea>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowLoanModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  تأكيد الطلب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
