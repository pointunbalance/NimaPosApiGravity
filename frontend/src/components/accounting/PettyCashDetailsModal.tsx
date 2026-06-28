import React from 'react';
import { Receipt, X, Plus, Trash2, Check, Printer } from 'lucide-react';
import { PettyCash, Account } from '../../types';

interface PettyCashDetailsModalProps {
  selectedFund: PettyCash | null;
  onClose: () => void;
  calculateRemaining: (fund: PettyCash) => number;
  onAddExpense: (e: React.FormEvent) => void;
  expenseDescription: string;
  setExpenseDescription: (desc: string) => void;
  expenseAmount: string;
  setExpenseAmount: (amount: string) => void;
  expenseAccountId: string;
  setExpenseAccountId: (id: string) => void;
  onRemoveExpense: (expenseId: string) => void;
  onCloseFund: () => void;
  accounts: Account[];
  onPrint: () => void;
}

const PettyCashDetailsModal: React.FC<PettyCashDetailsModalProps> = ({
  selectedFund, onClose, calculateRemaining, onAddExpense, expenseDescription, setExpenseDescription,
  expenseAmount, setExpenseAmount, expenseAccountId, setExpenseAccountId, onRemoveExpense, onCloseFund, accounts, onPrint
}) => {
  if (!selectedFund) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-600" />
              تفاصيل العهدة: {selectedFund.employeeName}
            </h2>
            <p className="text-sm text-slate-500 mt-1">{selectedFund.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onPrint} className="p-2 text-slate-400 hover:text-indigo-600 bg-white border border-slate-200 rounded-lg transition-colors shadow-sm" title="طباعة">
              <Printer className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-sm text-slate-500 mb-1">المبلغ الأساسي</p>
              <p className="text-xl font-bold text-slate-800">{selectedFund.amount.toLocaleString()} ج.م</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-sm text-slate-500 mb-1">إجمالي المصروفات</p>
              <p className="text-xl font-bold text-rose-600">
                {selectedFund.expenses.reduce((sum, exp) => sum + exp.amount, 0).toLocaleString()} ج.م
              </p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
              <p className="text-sm text-indigo-600 mb-1">المتبقي</p>
              <p className={`text-xl font-bold ${calculateRemaining(selectedFund) < 0 ? 'text-rose-600' : 'text-indigo-700'}`}>
                {calculateRemaining(selectedFund).toLocaleString()} ج.م
              </p>
            </div>
          </div>

          {selectedFund.status === 'active' && (
            <form onSubmit={onAddExpense} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-8 flex items-end gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-bold text-slate-700 mb-1">البيان</label>
                <input 
                  type="text" 
                  required
                  value={expenseDescription}
                  onChange={e => setExpenseDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="بيان المصروف..."
                />
              </div>
              <div className="w-48">
                <label className="block text-xs font-bold text-slate-700 mb-1">حساب المصروف</label>
                <select 
                  required
                  value={expenseAccountId}
                  onChange={e => setExpenseAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                >
                  <option value="">اختر الحساب...</option>
                  {accounts.filter(a => a.type === 'expense').map(a => (
                    <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-32">
                <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ</label>
                <input 
                  type="number" 
                  required
                  min="0.01"
                  step="0.01"
                  value={expenseAmount}
                  onChange={e => setExpenseAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="0.00"
                />
              </div>
              <button 
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors text-sm flex items-center gap-2 h-[38px]"
              >
                <Plus className="w-4 h-4" />
                إضافة مصروف
              </button>
            </form>
          )}

          <h3 className="font-bold text-slate-800 mb-4">سجل المصروفات</h3>
          {selectedFund.expenses.length === 0 ? (
            <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
              لا توجد مصروفات مسجلة على هذه العهدة
            </div>
          ) : (
            <div className="space-y-3">
              {selectedFund.expenses.map(expense => (
                <div key={expense.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                  <div>
                    <p className="font-bold text-slate-800">{expense.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-slate-500">{new Date(expense.date).toLocaleString('ar-EG')}</p>
                      {expenseAccountId && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          {accounts.find(a => a.id === expense.accountId)?.name || 'حساب غير معروف'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-rose-600">{expense.amount.toLocaleString()} ج.م</span>
                    {selectedFund.status === 'active' && (
                      <button 
                        onClick={() => onRemoveExpense(expense.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          {selectedFund.status === 'active' ? (
            <button 
              onClick={onCloseFund}
              className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              تسوية وإغلاق العهدة
            </button>
          ) : (
            <div className="text-emerald-600 font-bold flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-lg">
              <Check className="w-5 h-5" />
              تمت تسوية هذه العهدة في {selectedFund.closedAt ? new Date(selectedFund.closedAt).toLocaleDateString('ar-EG') : ''}
            </div>
          )}
          <button 
            onClick={onClose}
            className="bg-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-bold hover:bg-slate-300 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default PettyCashDetailsModal;
