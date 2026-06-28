import React from 'react';
import { X, ScrollText, Printer } from 'lucide-react';
import { JournalEntry, CostCenter } from '../../types';

interface JournalEntryViewModalProps {
  viewEntry: JournalEntry | null;
  onClose: () => void;
  onPrint: (entry: JournalEntry) => void;
  formatCurrency: (val: number) => string;
  costCenters?: CostCenter[];
}

export const JournalEntryViewModal: React.FC<JournalEntryViewModalProps> = ({
  viewEntry, onClose, onPrint, formatCurrency, costCenters
}) => {
  if (!viewEntry) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
        <div className="p-6 border-b bg-slate-50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><ScrollText className="w-6 h-6" /></div>
            <div>
              <h3 className="font-extrabold text-xl text-slate-800">تفاصيل القيد #{viewEntry.id}</h3>
              <p className="text-sm font-bold text-slate-500">{new Date(viewEntry.date).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${viewEntry.status === 'posted' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
              {viewEntry.status === 'posted' ? 'مرحل' : 'مسودة'}
            </span>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X className="w-6 h-6"/></button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 bg-white">
          <div className="grid grid-cols-2 gap-6 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">البيان / الوصف</p>
              <p className="font-bold text-slate-800 text-lg">{viewEntry.description}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">المرجع</p>
              <p className="font-bold text-slate-800 text-lg">{viewEntry.reference || '-'}</p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase">
                <tr>
                  <th className="p-4 w-12 text-center">#</th>
                  <th className="p-4">الحساب</th>
                  <th className="p-4 w-40">البيان الفرعي</th>
                  <th className="p-4 w-32">مركز التكلفة</th>
                  <th className="p-4 w-32 text-emerald-600">مدين</th>
                  <th className="p-4 w-32 text-red-600">دائن</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {viewEntry.lines.map((line, idx) => (
                  <tr key={idx} className="bg-white hover:bg-slate-50">
                    <td className="p-4 text-center text-xs text-slate-400">{idx + 1}</td>
                    <td className="p-4 font-bold text-slate-700">{line.accountName}</td>
                    <td className="p-4 text-sm text-slate-600">{line.description || '-'}</td>
                    <td className="p-4 text-sm text-slate-500">{costCenters?.find(c => c.id === line.costCenterId)?.name || '-'}</td>
                    <td className="p-4 font-mono font-bold text-emerald-600">{line.debit > 0 ? formatCurrency(line.debit) : '-'}</td>
                    <td className="p-4 font-mono font-bold text-red-600">{line.credit > 0 ? formatCurrency(line.credit) : '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td colSpan={4} className="p-4 text-left font-bold text-slate-600">الإجمالي</td>
                  <td className="p-4 font-mono font-black text-slate-800">{formatCurrency(viewEntry.totalAmount)}</td>
                  <td className="p-4 font-mono font-black text-slate-800">{formatCurrency(viewEntry.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        
        <div className="p-6 border-t bg-slate-50 flex justify-end gap-3 shrink-0">
          <button onClick={() => onPrint(viewEntry)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 flex items-center gap-2 shadow-sm">
            <Printer className="w-4 h-4" /> طباعة السند
          </button>
          <button onClick={onClose} className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 shadow-sm">
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
