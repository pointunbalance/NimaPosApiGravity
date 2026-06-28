import React from 'react';
import { FileText, Calendar, Edit, Trash2 } from 'lucide-react';
import { LawCase } from '../../types';

interface CasesTableProps {
  cases: LawCase[];
  getClientName: (id: number) => string;
  renderPaidAmount: (caseId: number, legacyPaid: number) => React.ReactNode;
  onViewDetails: (c: LawCase) => void;
  onAddSession: (c: LawCase) => void;
  onEdit: (c: LawCase) => void;
  onDelete: (id: number) => void;
}

export const CasesTable: React.FC<CasesTableProps> = ({
  cases,
  getClientName,
  renderPaidAmount,
  onViewDetails,
  onAddSession,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-right">
        <thead className="bg-slate-50 text-slate-500 text-sm font-semibold border-b border-slate-200">
          <tr>
            <th className="px-6 py-4">رقم القضية</th>
            <th className="px-6 py-4">الموضوع</th>
            <th className="px-6 py-4">الموكل</th>
            <th className="px-6 py-4">تاريخ الفتح</th>
            <th className="px-6 py-4">المالية</th>
            <th className="px-6 py-4 text-center">الحالة</th>
            <th className="px-6 py-4 text-center">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {cases.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                لا توجد قضايا مسجلة
              </td>
            </tr>
          ) : (
            cases.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-slate-700">{c.caseNumber}</td>
                <td className="px-6 py-4 font-bold text-slate-800">{c.title}</td>
                <td className="px-6 py-4 text-slate-600">{getClientName(c.clientId)}</td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {new Date(c.openedAt).toLocaleDateString('ar-EG')}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col text-sm">
                    <span className="text-slate-500">
                      الأتعاب: <strong className="text-slate-800">{(c.totalFees || 0).toLocaleString()}</strong>
                    </span>
                    {renderPaidAmount(c.id as number, c.paidAmount || 0)}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      c.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : c.status === 'suspended'
                        ? 'bg-amber-100 text-amber-700'
                        : c.status === 'won'
                        ? 'bg-indigo-100 text-indigo-700'
                        : c.status === 'lost'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {c.status === 'active'
                      ? 'نشطة'
                      : c.status === 'suspended'
                      ? 'معلقة'
                      : c.status === 'won'
                      ? 'رابحة'
                      : c.status === 'lost'
                      ? 'خاسرة'
                      : 'مغلقة'}
                  </span>
                </td>
                <td className="px-6 py-4 flex items-center justify-center gap-2">
                  <button
                    onClick={() => onViewDetails(c)}
                    className="p-2 text-slate-400 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors"
                    title="التفاصيل"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onAddSession(c)}
                    className="p-2 text-slate-400 hover:text-emerald-600 bg-slate-100 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="إضافة جلسة"
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(c)}
                    className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => c.id && onDelete(c.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
