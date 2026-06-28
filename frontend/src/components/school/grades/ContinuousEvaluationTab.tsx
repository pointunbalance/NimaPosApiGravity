import React from 'react';
import { CheckCircle } from 'lucide-react';

interface ContinuousEvaluationTabProps {
  evalClassFilter: number;
  setEvalClassFilter: (id: number) => void;
  classes: any[];
  evalDate: string;
  setEvalDate: (date: string) => void;
  evalType: string;
  setEvalType: (type: string) => void;
  studentsToEvaluate: any[];
  evaluations: any[];
  openEvalModal: (student: any) => void;
}

export const ContinuousEvaluationTab: React.FC<ContinuousEvaluationTabProps> = ({
  evalClassFilter,
  setEvalClassFilter,
  classes,
  evalDate,
  setEvalDate,
  evalType,
  setEvalType,
  studentsToEvaluate,
  evaluations,
  openEvalModal,
}) => {
  return (
    <div className="p-6 animate-in fade-in duration-300" dir="rtl">
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row gap-4 mb-6 items-end">
        <div className="flex-1">
          <label className="block text-sm font-bold text-slate-700 mb-2">تصفية بالفصل / المستوى</label>
          <select
            value={evalClassFilter}
            onChange={(e) => setEvalClassFilter(Number(e.target.value))}
            className="w-full border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-700 outline-none"
          >
            <option value={0}>جميع الفصول والطلاب</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ التقييم</label>
          <input
            type="date"
            value={evalDate}
            onChange={(e) => setEvalDate(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none font-bold text-slate-700"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-bold text-slate-700 mb-2">نوع التقييم</label>
          <select
            value={evalType}
            onChange={(e) => setEvalType(e.target.value)}
            className="w-full border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-700 outline-none"
          >
            <option value="daily">يومي (متابعة يومية)</option>
            <option value="weekly">أسبوعي</option>
            <option value="monthly">شهري منتظم</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {studentsToEvaluate.map((student) => {
          const hasEvaluation = evaluations.some(
            (ev) => ev.studentId === student.id && ev.date === evalDate && ev.type === evalType
          );
          return (
            <div
              key={student.id}
              className="border border-slate-200 p-4 rounded-2xl flex justify-between items-center bg-white hover:border-indigo-300 transition group cursor-pointer"
              onClick={() => openEvalModal(student)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    hasEvaluation ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {student.name.substring(0, 2)}
                </div>
                <div>
                  <h4 className="font-black text-slate-800">{student.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {classes.find((c) => c.id === student.classroomId)?.name || 'بدون فصل'}
                  </p>
                </div>
              </div>
              <div>
                {hasEvaluation ? (
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                ) : (
                  <div className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition">
                    قيم ➔
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {studentsToEvaluate.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 font-bold">لا يوجد طلاب مطابقين للتصفية.</div>
        )}
      </div>
    </div>
  );
};
export default ContinuousEvaluationTab;
