import React from 'react';
import { Eye, Printer, Copy, Edit2, RotateCcw, Trash2 } from 'lucide-react';
import { JournalEntry } from '../../types';

interface JournalEntriesTableProps {
  filteredJournals: JournalEntry[];
  formatCurrency: (val: number) => string;
  onView: (entry: JournalEntry) => void;
  onPrint: (entry: JournalEntry) => void;
  onDuplicate: (entry: JournalEntry) => void;
  onEdit: (entry: JournalEntry) => void;
  onReverse: (entry: JournalEntry) => void;
  onDelete: (id: number) => void;
}

export const JournalEntriesTable: React.FC<JournalEntriesTableProps> = ({
  filteredJournals, formatCurrency, onView, onPrint, onDuplicate, onEdit, onReverse, onDelete
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-2 print:border-black print:rounded-none print:shadow-none">
      <table className="w-full text-right text-sm">
        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 print:bg-transparent print:border-b-2 print:border-black print:text-black">
          <tr>
            <th className="px-6 py-4 w-24">رقم القيد</th>
            <th className="px-6 py-4 w-32">التاريخ</th>
            <th className="px-6 py-4">البيان / الوصف</th>
            <th className="px-6 py-4 w-32 text-center">المرجع</th>
            <th className="px-6 py-4 w-32">الإجمالي</th>
            <th className="px-6 py-4 w-24 text-center">الحالة</th>
            <th className="px-6 py-4 w-32 text-center print:hidden">إجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 print:divide-black">
          {filteredJournals.map(entry => (
            <tr key={entry.id} className="hover:bg-slate-50 transition-colors group print:bg-transparent">
              <td className="px-6 py-4 font-mono font-bold text-indigo-600 print:text-black">#{entry.id}</td>
              <td className="px-6 py-4 text-slate-600 print:text-black">{new Date(entry.date).toLocaleDateString()}</td>
              <td className="px-6 py-4 font-medium text-slate-800 line-clamp-1 print:text-black">{entry.description}</td>
              <td className="px-6 py-4 text-center text-xs text-slate-500 font-mono print:text-black">{entry.reference || '-'}</td>
              <td className="px-6 py-4 font-bold text-slate-900 print:text-black">{formatCurrency(entry.totalAmount)}</td>
              <td className="px-6 py-4 text-center">
                <span className={`px-2 py-1 rounded text-xs font-bold border ${entry.status === 'posted' ? 'bg-green-50 text-green-700 border-green-200 print:border-black print:text-black print:bg-transparent' : 'bg-amber-50 text-amber-700 border-amber-200 print:border-black print:text-black print:bg-transparent'}`}>
                  {entry.status === 'posted' ? 'مرحل' : 'مسودة'}
                </span>
              </td>
              <td className="px-6 py-4 print:hidden">
                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onView(entry)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded" title="عرض التفاصيل"><Eye className="w-4 h-4"/></button>
                  <button onClick={() => onPrint(entry)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded" title="طباعة"><Printer className="w-4 h-4"/></button>
                  <button onClick={() => onDuplicate(entry)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded" title="تكرار القيد"><Copy className="w-4 h-4"/></button>
                  {entry.status === 'draft' ? (
                    <button onClick={() => onEdit(entry)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="تعديل"><Edit2 className="w-4 h-4"/></button>
                  ) : (
                    <button onClick={() => onReverse(entry)} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded" title="عكس القيد"><RotateCcw className="w-4 h-4"/></button>
                  )}
                  <button onClick={() => onDelete(entry.id!)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="حذف"><Trash2 className="w-4 h-4"/></button>
                </div>
              </td>
            </tr>
          ))}
          {filteredJournals.length === 0 && (
            <tr><td colSpan={7} className="text-center py-16 text-slate-400">لا توجد قيود مطابقة</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
