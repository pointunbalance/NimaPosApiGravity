import React from 'react';
import { Calendar, Edit, Trash2 } from 'lucide-react';
import { CourtSession } from '../../types';

interface SessionsTableProps {
  sessions: CourtSession[];
  getCaseTitle: (id: number) => string;
  onEdit: (s: CourtSession) => void;
  onDelete: (id: number) => void;
}

export const SessionsTable: React.FC<SessionsTableProps> = ({
  sessions,
  getCaseTitle,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-right">
        <thead className="bg-slate-50 text-slate-500 text-sm font-semibold border-b border-slate-200">
          <tr>
            <th className="px-6 py-4">تاريخ الجلسة</th>
            <th className="px-6 py-4">القضية</th>
            <th className="px-6 py-4">المحكمة</th>
            <th className="px-6 py-4">القرار</th>
            <th className="px-6 py-4 text-center">الحالة</th>
            <th className="px-6 py-4 text-center">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sessions.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                لا توجد جلسات مسجلة
              </td>
            </tr>
          ) : (
            sessions.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {new Date(s.sessionDate).toLocaleDateString('ar-EG')}
                </td>
                <td className="px-6 py-4 text-slate-600">{getCaseTitle(s.caseId)}</td>
                <td className="px-6 py-4 text-slate-600">{s.courtName}</td>
                <td className="px-6 py-4 text-slate-600">{s.decision || '-'}</td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      s.status === 'upcoming'
                        ? 'bg-emerald-100 text-emerald-700'
                        : s.status === 'completed'
                        ? 'bg-slate-100 text-slate-700'
                        : s.status === 'postponed'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {s.status === 'upcoming'
                      ? 'قادمة'
                      : s.status === 'completed'
                      ? 'تمت'
                      : s.status === 'postponed'
                      ? 'مؤجلة'
                      : 'ملغاة'}
                  </span>
                </td>
                <td className="px-6 py-4 flex items-center justify-center gap-2">
                  <button
                    onClick={() => onEdit(s)}
                    className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => s.id && onDelete(s.id)}
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
