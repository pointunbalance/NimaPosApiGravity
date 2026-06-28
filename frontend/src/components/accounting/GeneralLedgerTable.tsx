import React from 'react';
import { ExternalLink } from 'lucide-react';
import { JournalEntry } from '../../types';

interface GeneralLedgerTableProps {
  ledgerData: {
    openingBalance: number;
    movements: any[];
    isDebitNormal: boolean;
  };
  dateRange: { start: string; end: string };
  formatCurrency: (amount: number) => string;
  setViewEntry: (entry: JournalEntry) => void;
}

export const GeneralLedgerTable: React.FC<GeneralLedgerTableProps> = ({
  ledgerData,
  dateRange,
  formatCurrency,
  setViewEntry
}) => {
  const getBalanceLabel = (balance: number) => {
    if (balance === 0) return '';
    if (balance > 0) return ledgerData.isDebitNormal ? 'مدين' : 'دائن';
    return ledgerData.isDebitNormal ? 'دائن' : 'مدين';
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden print:border-2 print:border-black print:rounded-none">
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 print:bg-transparent print:border-b-2 print:border-black">
            <tr>
              <th className="p-4 w-32">التاريخ</th>
              <th className="p-4 w-24 text-center">رقم القيد</th>
              <th className="p-4">البيان / الشرح</th>
              <th className="p-4 w-32 text-left text-emerald-700">مدين</th>
              <th className="p-4 w-32 text-left text-red-700">دائن</th>
              <th className="p-4 w-40 text-left text-indigo-700">الرصيد</th>
              <th className="p-4 w-10 print:hidden"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 print:divide-black">
            {/* Opening Balance Row */}
            <tr className="bg-yellow-50/50 font-bold print:bg-transparent">
              <td className="p-4 text-slate-500">{new Date(dateRange.start).toLocaleDateString('ar-IQ')}</td>
              <td className="p-4 text-center">-</td>
              <td className="p-4 text-slate-700">رصيد افتتاحي مدور</td>
              <td className="p-4 text-left text-slate-400">-</td>
              <td className="p-4 text-left text-slate-400">-</td>
              <td className="p-4 text-left text-slate-800">
                {formatCurrency(Math.abs(ledgerData.openingBalance))}
                <span className="text-xs text-slate-500 mr-1">{getBalanceLabel(ledgerData.openingBalance)}</span>
              </td>
              <td className="print:hidden"></td>
            </tr>

            {ledgerData.movements.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-400 italic">لا توجد حركات في هذه الفترة</td>
              </tr>
            ) : (
              ledgerData.movements.map((move, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4 text-slate-600 font-mono text-xs">{new Date(move.date).toLocaleDateString('ar-IQ')}</td>
                  <td className="p-4 text-center font-mono text-xs"><span className="bg-slate-100 px-2 py-1 rounded group-hover:bg-white border border-slate-200 text-slate-700">#{move.id}</span></td>
                  <td className="p-4 text-slate-800 font-medium">
                    {move.description}
                    {move.reference && <span className="text-xs text-slate-400 block mt-1 font-mono">Ref: {move.reference}</span>}
                  </td>
                  <td className="p-4 text-left font-mono font-bold text-emerald-600">{move.debit > 0 ? formatCurrency(move.debit) : '-'}</td>
                  <td className="p-4 text-left font-mono font-bold text-red-600">{move.credit > 0 ? formatCurrency(move.credit) : '-'}</td>
                  <td className="p-4 text-left font-mono font-bold text-slate-800 bg-slate-50/50 group-hover:bg-indigo-50/50 transition-colors">
                    {formatCurrency(Math.abs(move.balance))}
                    <span className="text-xs text-slate-500 mr-1">{getBalanceLabel(move.balance)}</span>
                  </td>
                  <td className="p-4 text-center print:hidden">
                    <button 
                      onClick={() => setViewEntry(move.originalEntry)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="عرض تفاصيل القيد"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
