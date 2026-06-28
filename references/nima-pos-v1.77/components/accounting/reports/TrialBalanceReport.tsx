import React from 'react';
import { ArrowRight } from 'lucide-react';

interface TrialBalanceReportProps {
  reportData: any[];
  formatCurrency: (amount: number) => string;
  goToLedger: (accountId: number) => void;
}

const TrialBalanceReport: React.FC<TrialBalanceReportProps> = ({ reportData, formatCurrency, goToLedger }) => {
  if (!reportData) return null;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300 print:shadow-none print:border-none">
        <table className="w-full text-right text-sm">
            <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                <tr>
                    <th className="p-4 w-24">الكود</th>
                    <th className="p-4">الحساب</th>
                    <th className="p-4 w-32 bg-gray-200/50">رصيد افتتاحي</th>
                    <th className="p-4 w-32 text-emerald-700">حركة مدينة</th>
                    <th className="p-4 w-32 text-red-700">حركة دائنة</th>
                    <th className="p-4 w-32 bg-gray-200/50">رصيد ختامي</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {reportData.map(acc => (
                    <tr key={acc.id} onClick={() => goToLedger(acc.id!)} className="hover:bg-indigo-50/50 cursor-pointer transition-colors group">
                        <td className="p-4 font-mono text-slate-500">{acc.code}</td>
                        <td className="p-4 font-bold text-slate-700 flex items-center gap-2 group-hover:text-indigo-700">
                            {acc.name}
                            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity print:hidden" />
                        </td>
                        <td className="p-4 font-mono text-slate-600 bg-gray-50/50 dir-ltr text-left">
                            {formatCurrency(acc.openingBalance)}
                        </td>
                        <td className="p-4 font-mono font-bold text-emerald-600 dir-ltr text-left">
                            {formatCurrency(acc.periodDebit)}
                        </td>
                        <td className="p-4 font-mono font-bold text-red-600 dir-ltr text-left">
                            {formatCurrency(acc.periodCredit)}
                        </td>
                        <td className="p-4 font-mono font-black text-indigo-900 bg-gray-50/50 dir-ltr text-left">
                            {formatCurrency(acc.closingBalance)}
                        </td>
                    </tr>
                ))}
            </tbody>
            <tfoot className="bg-slate-800 text-white font-bold text-lg">
                <tr>
                    <td colSpan={3} className="p-4 text-center">المجاميع</td>
                    <td className="p-4 text-emerald-400 text-left" dir="ltr">{formatCurrency(reportData.reduce((s, a) => s + a.periodDebit, 0))}</td>
                    <td className="p-4 text-red-400 text-left" dir="ltr">{formatCurrency(reportData.reduce((s, a) => s + a.periodCredit, 0))}</td>
                    <td className="p-4"></td>
                </tr>
            </tfoot>
        </table>
    </div>
  );
};

export default TrialBalanceReport;
