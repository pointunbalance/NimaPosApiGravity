import React from 'react';
import { ScrollText, ArrowRightLeft, FileText } from 'lucide-react';
import { JournalEntry } from '../../types';

interface JournalEntriesSummaryProps {
  filteredJournals: JournalEntry[];
  formatCurrency: (val: number) => string;
}

export const JournalEntriesSummary: React.FC<JournalEntriesSummaryProps> = ({ filteredJournals, formatCurrency }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl">
          <ScrollText className="w-8 h-8" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-500">عدد القيود</p>
          <p className="text-2xl font-black text-slate-800">{filteredJournals.length}</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
          <ArrowRightLeft className="w-8 h-8" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-500">إجمالي الحركات (مدين)</p>
          <p className="text-2xl font-black text-slate-800">{formatCurrency(filteredJournals.reduce((sum, j) => sum + j.totalAmount, 0))}</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="p-4 bg-amber-50 text-amber-600 rounded-xl">
          <FileText className="w-8 h-8" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-500">قيود مسودة</p>
          <p className="text-2xl font-black text-slate-800">{filteredJournals.filter(j => j.status === 'draft').length}</p>
        </div>
      </div>
    </div>
  );
};
