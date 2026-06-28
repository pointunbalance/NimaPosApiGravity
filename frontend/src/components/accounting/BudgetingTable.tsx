import React from 'react';
import { BarChart3, Edit, Trash2, Eye } from 'lucide-react';
import { Budget, FiscalYear } from '../../types';

interface BudgetingTableProps {
  budgets: Budget[];
  fiscalYears: FiscalYear[];
  onEdit: (budget: Budget) => void;
  onDelete: (id: number) => void;
  onViewDetails: (budget: Budget) => void;
}

const BudgetingTable: React.FC<BudgetingTableProps> = ({ budgets, fiscalYears, onEdit, onDelete, onViewDetails }) => {
  const formatCurrency = (val: number) => new Intl.NumberFormat('ar-IQ', { style: 'decimal', maximumFractionDigits: 0 }).format(val);

  if (budgets.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-12 text-center text-slate-400 flex flex-col items-center">
            <BarChart3 className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-bold">لا توجد موازنات تقديرية مسجلة حالياً</p>
            <p className="text-sm mt-2">انقر على "إنشاء موازنة جديدة" للبدء</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-500 text-sm font-bold">
              <tr>
                  <th className="p-4">اسم الموازنة</th>
                  <th className="p-4">السنة المالية</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4">إجمالي الموازنة</th>
                  <th className="p-4 text-center print:hidden">الإجراءات</th>
              </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 print:divide-black">
              {budgets.map(budget => {
                  const year = fiscalYears.find(y => y.id === budget.fiscalYearId);
                  const total = budget.lines.reduce((sum, l) => sum + l.amount, 0);
                  return (
                      <tr key={budget.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-bold text-slate-800 print:text-black">{budget.name}</td>
                          <td className="p-4 text-slate-600 print:text-black">{year?.name || 'غير محدد'}</td>
                          <td className="p-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  budget.status === 'active' ? 'bg-emerald-100 text-emerald-700 print:border print:border-black print:text-black print:bg-white' :
                                  budget.status === 'closed' ? 'bg-slate-100 text-slate-700 print:border print:border-black print:text-black print:bg-white' :
                                  'bg-amber-100 text-amber-700 print:border print:border-black print:text-black print:bg-white'
                              }`}>
                                  {budget.status === 'active' ? 'نشط' : budget.status === 'closed' ? 'مغلق' : 'مسودة'}
                              </span>
                          </td>
                          <td className="p-4 font-mono font-bold text-indigo-600 print:text-black">{formatCurrency(total)}</td>
                          <td className="p-4 flex justify-center gap-2 print:hidden">
                              <button 
                                  onClick={() => onViewDetails(budget)}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="عرض التفاصيل"
                              >
                                  <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                  onClick={() => onEdit(budget)}
                                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="تعديل"
                              >
                                  <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                  onClick={() => onDelete(budget.id!)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="حذف"
                              >
                                  <Trash2 className="w-4 h-4" />
                              </button>
                          </td>
                      </tr>
                  );
              })}
          </tbody>
      </table>
    </div>
  );
};

export default BudgetingTable;
