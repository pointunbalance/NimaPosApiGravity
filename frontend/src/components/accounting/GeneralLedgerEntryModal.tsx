import React from 'react';
import { X, FileText, Printer } from 'lucide-react';
import { JournalEntry, Account } from '../../types';

interface GeneralLedgerEntryModalProps {
  viewEntry: JournalEntry | null;
  setViewEntry: (entry: JournalEntry | null) => void;
  selectedAccount: Account | undefined;
  formatCurrency: (amount: number) => string;
}

export const GeneralLedgerEntryModal: React.FC<GeneralLedgerEntryModalProps> = ({
  viewEntry,
  setViewEntry,
  selectedAccount,
  formatCurrency
}) => {
  if (!viewEntry) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 print:p-0 print:bg-white print:static print:block">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 print:shadow-none print:rounded-none print:max-w-none">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50 print:bg-white print:border-b-2 print:border-black">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center print:hidden">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-slate-800">تفاصيل قيد اليومية #{viewEntry.id}</h3>
              <p className="text-sm text-slate-500 mt-1">{new Date(viewEntry.date).toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button onClick={handlePrint} className="p-2 hover:bg-slate-200 rounded-full transition-colors" title="طباعة القيد">
              <Printer className="w-5 h-5 text-slate-500" />
            </button>
            <button onClick={() => setViewEntry(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors" title="إغلاق">
              <X className="w-5 h-5 text-slate-500"/>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 print:bg-white print:border-none print:p-0">
            <p className="text-sm font-bold text-slate-500 mb-1">البيان / الوصف</p>
            <p className="text-lg font-bold text-slate-800">{viewEntry.description}</p>
            {viewEntry.reference && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-lg print:border-none print:p-0 print:bg-transparent">
                <span className="text-xs text-slate-400 font-bold">المرجع:</span>
                <span className="text-sm text-slate-700 font-mono">{viewEntry.reference}</span>
              </div>
            )}
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm print:border-2 print:border-black print:rounded-none print:shadow-none">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 print:bg-transparent print:border-b-2 print:border-black">
                <tr>
                  <th className="p-4">الحساب</th>
                  <th className="p-4 text-left w-32">مدين</th>
                  <th className="p-4 text-left w-32">دائن</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-black">
                {viewEntry.lines.map((line, idx) => (
                  <tr key={idx} className={line.accountId === selectedAccount?.id ? 'bg-indigo-50/50 print:bg-transparent' : 'hover:bg-slate-50 print:bg-transparent'}>
                    <td className="p-4">
                      <span className="font-bold text-slate-800 block">{line.accountName}</span>
                      {line.description && <span className="text-xs text-slate-500 mt-1 block">{line.description}</span>}
                    </td>
                    <td className="p-4 text-left font-mono font-bold text-emerald-600 print:text-black">{line.debit > 0 ? formatCurrency(line.debit) : '-'}</td>
                    <td className="p-4 text-left font-mono font-bold text-red-600 print:text-black">{line.credit > 0 ? formatCurrency(line.credit) : '-'}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-bold border-t-2 border-slate-200 print:bg-transparent print:border-t-2 print:border-black">
                  <td className="p-4 text-left text-slate-600 print:text-black">الإجمالي الموزون</td>
                  <td className="p-4 text-left font-mono text-slate-800 print:text-black">{formatCurrency(viewEntry.totalAmount)}</td>
                  <td className="p-4 text-left font-mono text-slate-800 print:text-black">{formatCurrency(viewEntry.totalAmount)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
