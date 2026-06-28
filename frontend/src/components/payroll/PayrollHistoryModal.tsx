import React from 'react';
import { X } from 'lucide-react';
import { User, Expense } from '../../types';

interface PayrollHistoryModalProps {
  historyUser: User | null;
  setHistoryUser: (user: User | null) => void;
  expenses: Expense[] | undefined;
  formatCurrency: (amount: number) => string;
}

const PayrollHistoryModal: React.FC<PayrollHistoryModalProps> = ({
  historyUser,
  setHistoryUser,
  expenses,
  formatCurrency
}) => {
  if (!historyUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="flex justify-between items-center p-6 border-b bg-slate-50">
              <div>
                  <h3 className="font-bold text-xl text-slate-800">سجل رواتب الموظف</h3>
                  <p className="text-sm text-slate-500">{historyUser.name}</p>
              </div>
              <button onClick={() => setHistoryUser(null)} className="p-2 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"><X className="w-5 h-5"/></button>
          </div>
          <div className="p-6 overflow-y-auto">
              {expenses?.filter(e => e.category === 'salary' && e.title.includes(historyUser.name)).length === 0 ? (
                  <div className="text-center py-10 text-slate-400">لا يوجد سجل رواتب لهذا الموظف</div>
              ) : (
                  <div className="space-y-3">
                      {expenses?.filter(e => e.category === 'salary' && e.title.includes(historyUser.name))
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map(expense => (
                          <div key={expense.id} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors">
                              <div className="flex justify-between items-center mb-2">
                                  <span className="font-bold text-slate-800">{expense.title}</span>
                                  <span className="text-xs text-slate-500">{new Date(expense.date).toLocaleDateString('ar-EG')}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                  <span className="text-xs text-slate-600">{expense.notes}</span>
                                  <span className="font-black text-indigo-600">{formatCurrency(expense.amount)}</span>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default PayrollHistoryModal;
