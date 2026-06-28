import React from 'react';
import { UserPlus, Check, Trash2 } from 'lucide-react';

interface TripParticipantsTabProps {
  selectedStudentToAdd: number | null;
  setSelectedStudentToAdd: (id: number | null) => void;
  availableStudents: any[];
  handleAddStudent: () => void;
  tripParticipants: any[];
  students: any[];
  handleUpdateStudent: (studentId: number, field: string, value: any) => void;
  handleRemoveStudent: (studentId: number) => void;
}

export const TripParticipantsTab: React.FC<TripParticipantsTabProps> = ({
  selectedStudentToAdd,
  setSelectedStudentToAdd,
  availableStudents,
  handleAddStudent,
  tripParticipants,
  students,
  handleUpdateStudent,
  handleRemoveStudent,
}) => {
  return (
    <div className="space-y-4">
      {/* Register New Student */}
      <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex flex-col md:flex-row gap-3 items-center">
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-slate-600 mb-1">تسجيل طفل إضافي بالرحلة:</label>
          <select
            value={selectedStudentToAdd || ''}
            onChange={(e) => setSelectedStudentToAdd(Number(e.target.value) || null)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm"
          >
            <option value="">-- اختر طالباً --</option>
            {availableStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleAddStudent}
          disabled={!selectedStudentToAdd}
          className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 hover:bg-indigo-700 transition self-end cursor-pointer disabled:opacity-50"
        >
          <UserPlus className="w-4 h-4" /> إضافة للرحلة
        </button>
      </div>

      {/* Participants list */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-[400px] overflow-y-auto">
        <table className="w-full text-xs text-right">
          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0">
            <tr>
              <th className="p-3">اسم الطفل</th>
              <th className="p-3">موافقة الأهل</th>
              <th className="p-3">المبلغ المدفوع (ج.م)</th>
              <th className="p-3">الحضور الفعلي</th>
              <th className="p-3 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white font-medium">
            {tripParticipants.map((p: any) => {
              const studentInfo = students.find((s) => s.id === p.studentId);
              return (
                <tr key={p.studentId} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-800">{studentInfo?.name || 'طالب محذوف'}</td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={p.parentApproved}
                      onChange={(e) => handleUpdateStudent(p.studentId, 'parentApproved', e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      min="0"
                      value={p.paidAmount}
                      onChange={(e) => handleUpdateStudent(p.studentId, 'paidAmount', Number(e.target.value))}
                      className="w-20 px-2 py-1 border border-slate-200 rounded text-center font-bold"
                    />
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleUpdateStudent(p.studentId, 'attended', !p.attended)}
                      className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                        p.attended
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {p.attended ? <Check className="w-3.5 h-3.5" /> : null}
                      {p.attended ? 'حضر الرحلة' : 'غائب'}
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleRemoveStudent(p.studentId)}
                      className="text-rose-500 hover:bg-rose-50 p-1 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {tripParticipants.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">
                  لم يتم إضافة أي مشتركين لهذه الرحلة حتى الآن.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
