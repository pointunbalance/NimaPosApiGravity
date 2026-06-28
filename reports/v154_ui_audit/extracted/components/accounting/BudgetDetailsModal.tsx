import React, { useMemo } from 'react';
import { X, TrendingUp, TrendingDown, Minus, Printer } from 'lucide-react';
import { Budget, FiscalYear, Account, CostCenter } from '../../types';

interface BudgetDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget: Budget | null;
  fiscalYears: FiscalYear[];
  accounts: Account[];
  costCenters: CostCenter[];
  actuals: Record<string, number>; // key: `${accountId}-${costCenterId || ''}`
}

const BudgetDetailsModal: React.FC<BudgetDetailsModalProps> = ({
  isOpen,
  onClose,
  budget,
  fiscalYears,
  accounts,
  costCenters,
  actuals
}) => {
  if (!isOpen || !budget) return null;

  const fiscalYear = fiscalYears.find(fy => fy.id === budget.fiscalYearId);
  const formatCurrency = (val: number) => new Intl.NumberFormat('ar-IQ', { style: 'decimal', maximumFractionDigits: 0 }).format(val);

  const totalBudget = budget.lines.reduce((sum, l) => sum + l.amount, 0);
  const totalActual = budget.lines.reduce((sum, l) => {
      const key = `${l.accountId}-${l.costCenterId || ''}`;
      return sum + (actuals[key] || 0);
  }, 0);
  
  const totalVariance = totalBudget - totalActual;
  const totalPercent = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-sm p-4 print:p-0 print:bg-white">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 print:shadow-none print:max-h-none print:rounded-none">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-gray-700 print:hidden">
          <div>
            <h3 className="font-bold text-xl text-slate-800 dark:text-white">تفاصيل الموازنة: {budget.name}</h3>
            <p className="text-sm text-slate-500 dark:text-gray-400">السنة المالية: {fiscalYear?.name}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full text-slate-500 dark:text-gray-400 transition-colors">
                <Printer className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full text-slate-500 dark:text-gray-400 transition-colors">
                <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="hidden print:block text-center p-6 border-b-2 border-black">
            <h2 className="text-2xl font-bold mb-2">تقرير الموازنة التقديرية</h2>
            <h3 className="text-xl">{budget.name}</h3>
            <p className="text-sm mt-2">السنة المالية: {fiscalYear?.name}</p>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-slate-100 dark:border-gray-700 print:border-black print:bg-white">
                    <p className="text-sm font-bold text-slate-500 dark:text-gray-400 mb-1">إجمالي الموازنة</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-white">{formatCurrency(totalBudget)}</p>
                </div>
                <div className="bg-slate-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-slate-100 dark:border-gray-700 print:border-black print:bg-white">
                    <p className="text-sm font-bold text-slate-500 dark:text-gray-400 mb-1">الفعلي</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-white">{formatCurrency(totalActual)}</p>
                </div>
                <div className={`p-4 rounded-2xl border print:border-black print:bg-white ${totalVariance < 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/50' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/50'}`}>
                    <p className="text-sm font-bold mb-1 flex items-center gap-1 dark:text-gray-300">
                        الانحراف (المتبقي)
                    </p>
                    <p className={`text-2xl font-black ${totalVariance < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {formatCurrency(totalVariance)}
                    </p>
                </div>
                <div className="bg-slate-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-slate-100 dark:border-gray-700 print:border-black print:bg-white">
                    <p className="text-sm font-bold text-slate-500 dark:text-gray-400 mb-1">نسبة الاستهلاك</p>
                    <div className="flex items-end gap-2">
                        <p className="text-2xl font-black text-slate-800 dark:text-white">{totalPercent.toFixed(1)}%</p>
                        <div className="flex-1 h-2 bg-slate-200 dark:bg-gray-700 rounded-full mb-2 overflow-hidden print:border print:border-black">
                            <div 
                                className={`h-full rounded-full print:bg-black ${totalPercent > 100 ? 'bg-red-500' : totalPercent > 80 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(100, totalPercent)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Details Table */}
            <div className="border border-slate-200 dark:border-gray-700 rounded-xl overflow-hidden print:border-black">
                <table className="w-full text-right text-sm">
                    <thead className="bg-slate-50 dark:bg-gray-900/50 text-slate-500 dark:text-gray-400 font-bold print:bg-white print:text-black border-b border-slate-200 dark:border-gray-700 print:border-black">
                        <tr>
                            <th className="p-4">الحساب</th>
                            <th className="p-4">مركز التكلفة</th>
                            <th className="p-4">الموازنة المقدرة</th>
                            <th className="p-4">الفعلي</th>
                            <th className="p-4">الانحراف</th>
                            <th className="p-4">نسبة الاستهلاك</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-gray-700 print:divide-black">
                        {budget.lines.map((line, idx) => {
                            const account = accounts.find(a => a.id === line.accountId);
                            const costCenter = costCenters.find(c => c.id === line.costCenterId);
                            const key = `${line.accountId}-${line.costCenterId || ''}`;
                            const actual = actuals[key] || 0;
                            const variance = line.amount - actual;
                            const percent = line.amount > 0 ? (actual / line.amount) * 100 : 0;
                            const isOver = actual > line.amount;

                            return (
                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="p-4 font-bold text-slate-700 dark:text-gray-300 print:text-black">
                                        {account?.code} - {account?.name}
                                    </td>
                                    <td className="p-4 text-slate-600 dark:text-gray-400 print:text-black">
                                        {costCenter ? `${costCenter.code} - ${costCenter.name}` : '-'}
                                    </td>
                                    <td className="p-4 font-bold text-slate-800 dark:text-white print:text-black">
                                        {formatCurrency(line.amount)}
                                    </td>
                                    <td className="p-4 font-bold text-slate-800 dark:text-white print:text-black">
                                        {formatCurrency(actual)}
                                    </td>
                                    <td className={`p-4 font-bold ${isOver ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'} print:text-black`}>
                                        <div className="flex items-center gap-1">
                                            {isOver ? <TrendingUp className="w-4 h-4 print:hidden" /> : <TrendingDown className="w-4 h-4 print:hidden" />}
                                            {formatCurrency(Math.abs(variance))}
                                            {isOver ? ' (تجاوز)' : ''}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold w-12 dark:text-white">{percent.toFixed(1)}%</span>
                                            <div className="w-24 h-2 bg-slate-100 dark:bg-gray-700 rounded-full overflow-hidden print:border print:border-black">
                                                <div 
                                                    className={`h-full rounded-full print:bg-black ${isOver ? 'bg-red-500' : percent > 80 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${Math.min(100, percent)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-gray-900/50 font-bold text-slate-800 dark:text-white print:bg-white print:text-black border-t-2 border-slate-200 dark:border-gray-700 print:border-black">
                        <tr>
                            <td colSpan={2} className="p-4 text-left">الإجمالي:</td>
                            <td className="p-4">{formatCurrency(totalBudget)}</td>
                            <td className="p-4">{formatCurrency(totalActual)}</td>
                            <td className={`p-4 ${totalVariance < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'} print:text-black`}>
                                <div className="flex items-center gap-1">
                                    {totalVariance < 0 ? <TrendingUp className="w-4 h-4 print:hidden" /> : <TrendingDown className="w-4 h-4 print:hidden" />}
                                    {formatCurrency(Math.abs(totalVariance))}
                                    {totalVariance < 0 ? ' (تجاوز)' : ''}
                                </div>
                            </td>
                            <td className="p-4">{totalPercent.toFixed(1)}%</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetDetailsModal;
