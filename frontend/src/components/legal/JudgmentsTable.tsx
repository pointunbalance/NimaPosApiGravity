import React from 'react';
import { Gavel, Calendar, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { Judgment, LawCase } from '../../types';

interface JudgmentsTableProps {
  judgments: Judgment[];
  cases: LawCase[];
  getCaseName: (caseId: number) => string;
  onQuickStatusChange: (j: Judgment, newStatus: Judgment['status']) => void;
  onEdit: (j: Judgment) => void;
  onDelete: (id: number) => void;
}

export const JudgmentsTable: React.FC<JudgmentsTableProps> = ({
  judgments,
  cases,
  getCaseName,
  onQuickStatusChange,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-right font-medium">
        <thead className="bg-slate-50 text-slate-500 text-sm font-semibold border-b border-slate-200">
          <tr>
            <th className="px-6 py-4">القضية</th>
            <th className="px-6 py-4">المحكمة</th>
            <th className="px-6 py-4">تاريخ الحكم</th>
            <th className="px-6 py-4">منطوق الحكم</th>
            <th className="px-6 py-4 text-center">التنفيذ</th>
            <th className="px-6 py-4 text-center">الحالة</th>
            <th className="px-6 py-4 text-center">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {judgments.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                <Gavel className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                لا توجد أحكام مسجلة تطابق البحث
              </td>
            </tr>
          ) : (
            judgments.map((j) => (
              <tr key={j.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{getCaseName(j.caseId)}</td>
                <td className="px-6 py-4 text-slate-700">{j.courtName}</td>
                <td className="px-6 py-4 text-slate-600">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {new Date(j.judgmentDate).toLocaleDateString('ar-EG')}
                    </div>
                    {j.appealDeadline && j.status !== 'executed' && (
                      <div className={`text-xs flex items-center gap-1 ${new Date(j.appealDeadline) < new Date() ? 'text-rose-600 font-bold' : 'text-amber-600'}`}>
                        <AlertCircle className="w-3 h-3" />
                        {new Date(j.appealDeadline) < new Date() ? 'انتهت مدة الطعن' : `الطعن قبل: ${new Date(j.appealDeadline).toLocaleDateString('ar-EG')}`}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600 max-w-xs truncate text-sm" title={j.judgmentText}>
                  {j.judgmentText}
                </td>
                <td className="px-6 py-4 text-center text-slate-600">
                  {j.status === 'executed' ? (
                    j.executionDate ? new Date(j.executionDate).toLocaleDateString('ar-EG') : 'تم'
                  ) : (
                    <button 
                      onClick={() => onQuickStatusChange(j, 'executed')}
                      className="px-3 py-1 text-xs font-bold text-center border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 rounded-lg transition"
                      title="تحديد كـ 'تم التنفيذ'"
                    >
                      تحديد كمنفذ
                    </button>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    j.status === 'executed' ? 'bg-emerald-100 text-emerald-700' :
                    j.status === 'pending_execution' ? 'bg-amber-100 text-amber-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {j.status === 'executed' ? 'تم التنفيذ' : j.status === 'pending_execution' ? 'قيد التنفيذ' : 'مستأنف'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => onEdit(j)}
                      className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="تعديل"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => j.id && onDelete(j.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-lg transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
