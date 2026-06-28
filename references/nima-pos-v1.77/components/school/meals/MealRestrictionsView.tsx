import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface MealRestrictionsViewProps {
  students: any[];
  classes: any[];
  trackingClass: string;
  openRestrictionsModal: (student: any) => void;
}

export const MealRestrictionsView: React.FC<MealRestrictionsViewProps> = ({
  students,
  classes,
  trackingClass,
  openRestrictionsModal,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-red-50/50">
        <AlertTriangle className="w-6 h-6 text-red-500" />
        <h2 className="text-lg font-black text-slate-800">الحساسية والممنوعات الغذائية</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="p-4 font-bold text-slate-600">اسم الطفل</th>
              <th className="p-4 font-bold text-slate-600">الفصل</th>
              <th className="p-4 font-bold text-slate-600">ممنوعات طبية (حساسية)</th>
              <th className="p-4 font-bold text-slate-600">ملاحظات غذائية (رغبة الأهل)</th>
              <th className="p-4 font-bold text-slate-600">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((student) => {
              const cls = classes.find((c) => c.id === student.classroomId);
              const hasAllergies = !!student.allergies;
              const hasNotes = !!student.dietaryNotes;

              if (!hasAllergies && !hasNotes && trackingClass !== '' && student.classroomId !== Number(trackingClass)) {
                return null;
              }

              return (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-800">{student.name}</td>
                  <td className="p-4 font-bold text-slate-600">{cls?.name || '-'}</td>
                  <td className="p-4">
                    {hasAllergies ? (
                      <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-md font-bold text-xs">
                        <AlertTriangle className="w-3 h-3" /> {student.allergies}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="p-4 text-slate-600 font-medium">
                    {hasNotes ? student.dietaryNotes : <span className="text-slate-400">-</span>}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => openRestrictionsModal(student)}
                      className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      تعديل
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
