import React from 'react';
import { Edit2, Trash2, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Account } from '../../types';
import { getTypeLabel, getIndentLevel, formatCurrency } from './ChartOfAccountsHelpers';

interface ChartOfAccountsTableProps {
  accounts: Account[];
  accountBalances: Map<number, number> | undefined;
  onEdit: (account: Account) => void;
  onDelete: (id: number) => void;
}

export const ChartOfAccountsTable: React.FC<ChartOfAccountsTableProps> = ({
  accounts,
  accountBalances,
  onEdit,
  onDelete
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto print:overflow-visible print:border-2 print:border-black print:rounded-none print:shadow-none">
      <table className="w-full text-right min-w-[800px] print:min-w-full">
        <thead className="bg-slate-50 text-slate-500 font-bold text-sm border-b border-slate-200 print:bg-transparent print:border-b-2 print:border-black print:text-black">
          <tr>
            <th className="p-4 w-40">الكود</th>
            <th className="p-4">اسم الحساب</th>
            <th className="p-4 w-32">النوع</th>
            <th className="p-4 w-40">الرصيد</th>
            <th className="p-4 w-32 text-center print:hidden">إجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 print:divide-black">
          {accounts.map(acc => {
            const style = getTypeLabel(acc.type);
            const rawBalance = accountBalances?.get(acc.id!) || 0;
            const indent = getIndentLevel(acc.code);
            
            const displayBal = Math.abs(rawBalance);
            const isDr = rawBalance >= 0;

            return (
              <tr key={acc.id} className="hover:bg-slate-50 transition-colors group text-sm print:bg-transparent">
                <td className="p-4 font-mono font-bold text-slate-600 print:text-black">{acc.code}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2" style={{ paddingRight: `${indent * 24}px` }}>
                    {indent > 0 && <div className="w-4 h-4 border-b-2 border-r-2 border-slate-300 rounded-br-none -mt-2 opacity-50 print:border-black" />}
                    <span className={`font-bold ${indent === 0 ? 'text-slate-900 text-base print:text-black' : 'text-slate-700 print:text-black'}`}>{acc.name}</span>
                    {acc.isSystem && <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded border print:border-black print:text-black print:bg-transparent">نظام</span>}
                  </div>
                  {acc.description && <p className="text-xs text-slate-400 mt-0.5 pr-6 truncate max-w-md print:text-black">{acc.description}</p>}
                </td>
                <td className="p-4">
                  <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded w-fit ${style.color.replace('bg-', 'bg-opacity-10 ')} print:bg-transparent print:border print:border-black print:text-black`}>
                    <style.icon className="w-3 h-3 print:hidden" />
                    {style.label}
                  </span>
                </td>
                <td className="p-4">
                  {rawBalance !== 0 ? (
                    <span className={`font-mono font-bold ${isDr ? 'text-emerald-600' : 'text-red-600'} print:text-black`}>
                      {formatCurrency(displayBal)} <span className="text-[10px] opacity-70 print:opacity-100">{isDr ? 'Dr' : 'Cr'}</span>
                    </span>
                  ) : (
                    <span className="text-slate-300 print:text-black">-</span>
                  )}
                </td>
                <td className="p-4 print:hidden">
                  <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => navigate('/accounting/general-ledger', { state: { accountId: acc.id } })}
                      className="p-1.5 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 border border-indigo-100"
                      title="عرض دفتر الأستاذ"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button onClick={() => onEdit(acc)} className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 border border-blue-100" title="تعديل">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {!acc.isSystem && (
                      <button onClick={() => onDelete(acc.id!)} className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 border border-red-100" title="حذف">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {accounts.length === 0 && (
            <tr>
              <td colSpan={5} className="p-12 text-center text-slate-400">
                لا توجد حسابات مطابقة. ابدأ بإضافة حساب جديد أو استيراد دليل الحسابات.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
