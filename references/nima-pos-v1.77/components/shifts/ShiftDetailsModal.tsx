import React, { useState } from 'react';
import { X, Receipt, TrendingDown, CreditCard, Banknote } from 'lucide-react';
import { Shift, Order, Expense, CustomerPayment } from '../../types';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';

interface ShiftDetailsModalProps {
  shift: Shift;
  onClose: () => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date) => string;
}

const ShiftDetailsModal: React.FC<ShiftDetailsModalProps> = ({ shift, onClose, formatCurrency, formatDate }) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'expenses' | 'payments'>('orders');

  const shiftData = useLiveQuery(async () => {
    const startDate = new Date(shift.startTime);
    const endDate = shift.endTime ? new Date(shift.endTime) : new Date();

    const allOrders = await db.orders.toArray();
    const orders = allOrders.filter(o => {
      const orderDate = new Date(o.date);
      return orderDate >= startDate && orderDate <= endDate;
    });

    const allExpenses = await db.expenses.toArray();
    const expenses = allExpenses.filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });

    const allPayments = await db.customerPayments.toArray();
    const payments = allPayments.filter(p => {
      const paymentDate = new Date(p.date);
      return paymentDate >= startDate && paymentDate <= endDate;
    });

    return { orders, expenses, payments };
  }, [shift]);

  if (!shiftData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in-95">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
              <Receipt className="w-6 h-6 text-brand-600" />
              تفاصيل الوردية #{shift.id}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {formatDate(shift.startTime)} - {shift.endTime ? formatDate(shift.endTime) : 'الآن'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex border-b border-gray-200 bg-white">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'orders' ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/30' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Banknote className="w-4 h-4" />
            المبيعات ({shiftData.orders.length})
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'expenses' ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/30' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <TrendingDown className="w-4 h-4" />
            المصروفات ({shiftData.expenses.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'payments' ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/30' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <CreditCard className="w-4 h-4" />
            دفعات العملاء ({shiftData.payments.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm text-right">
                <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-4">رقم الطلب</th>
                    <th className="p-4">الوقت</th>
                    <th className="p-4">طريقة الدفع</th>
                    <th className="p-4">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {shiftData.orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="p-4 font-mono font-bold text-gray-600">#{order.id}</td>
                      <td className="p-4 text-gray-600">{new Date(order.date).toLocaleTimeString('ar-EG')}</td>
                      <td className="p-4 text-gray-600">{order.paymentMethod === 'cash' ? 'نقدي' : order.paymentMethod === 'card' ? 'بطاقة' : order.paymentMethod === 'split' ? 'مقسم' : 'آجل'}</td>
                      <td className="p-4 font-bold text-emerald-600">{formatCurrency(order.totalAmount)}</td>
                    </tr>
                  ))}
                  {shiftData.orders.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-400">لا توجد مبيعات في هذه الوردية</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="space-y-6">
                {shift.shiftExpenses && shift.shiftExpenses.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="bg-orange-50 p-4 border-b border-gray-200">
                        <h4 className="font-bold text-orange-900">مصروفات تم سحبها من الدرج</h4>
                    </div>
                    <table className="w-full text-sm text-right">
                      <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                        <tr>
                          <th className="p-4">الوقت</th>
                          <th className="p-4">الوصف</th>
                          <th className="p-4">الحالة</th>
                          <th className="p-4">المبلغ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {shift.shiftExpenses.map(expense => (
                          <tr key={expense.id} className="hover:bg-gray-50">
                            <td className="p-4 text-gray-500">{new Date(expense.timestamp).toLocaleTimeString('ar-EG')}</td>
                            <td className="p-4 font-medium text-gray-900">{expense.description}</td>
                            <td className="p-4">
                                {expense.isConfirmed ? <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded font-bold text-xs">تم التأكيد</span> : <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded font-bold text-xs">بانتظار التأكيد</span>}
                            </td>
                            <td className="p-4 font-bold text-red-600">-{formatCurrency(expense.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                      <tr>
                        <th className="p-4">الوقت</th>
                        <th className="p-4">الفئة</th>
                        <th className="p-4">الوصف</th>
                        <th className="p-4">المبلغ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {shiftData.expenses.map(expense => (
                        <tr key={expense.id} className="hover:bg-gray-50">
                          <td className="p-4 text-gray-600">{new Date(expense.date).toLocaleTimeString('ar-EG')}</td>
                          <td className="p-4 text-gray-600">{expense.category}</td>
                          <td className="p-4 text-gray-600">{expense.title}</td>
                          <td className="p-4 font-bold text-red-600">-{formatCurrency(expense.amount)}</td>
                        </tr>
                      ))}
                      {shiftData.expenses.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-gray-400">لا توجد مصروفات في هذه الوردية</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm text-right">
                <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-4">الوقت</th>
                    <th className="p-4">العميل</th>
                    <th className="p-4">طريقة الدفع</th>
                    <th className="p-4">المبلغ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {shiftData.payments.map(payment => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="p-4 text-gray-600">{new Date(payment.date).toLocaleTimeString('ar-EG')}</td>
                      <td className="p-4 text-gray-600">{payment.customerId}</td>
                      <td className="p-4 text-gray-600">{payment.type === 'debt_payment' ? 'سداد دين' : 'إيداع محفظة'}</td>
                      <td className="p-4 font-bold text-emerald-600">+{formatCurrency(payment.amount)}</td>
                    </tr>
                  ))}
                  {shiftData.payments.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-400">لا توجد دفعات عملاء في هذه الوردية</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShiftDetailsModal;
