import React from 'react';
import { X, Award } from 'lucide-react';

interface ExamResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentExam: any;
  classes: any[];
  students: any[];
  resultsData: { studentId: number; marks: number }[];
  setResultsData: (data: any[]) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

export const ExamResultsModal: React.FC<ExamResultsModalProps> = ({
  isOpen,
  onClose,
  currentExam,
  classes,
  students,
  resultsData,
  setResultsData,
  handleSubmit,
}) => {
  if (!isOpen || !currentExam) return null;

  const className = classes.find(c => c.id === Number(currentExam.classId))?.name || "الفصل المجهول";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Award className="w-6 h-6 text-emerald-600" />
            رصد درجات: {currentExam.title} ({className})
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors bg-white shadow-sm border border-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1">
            <div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-200 flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-slate-500 font-bold">المادة</p>
                <p className="font-black text-slate-800">{currentExam.subject}</p>
              </div>
              <div className="w-px h-8 bg-slate-200 mx-2"></div>
              <div className="flex-1 text-center">
                <p className="text-sm text-slate-500 font-bold">التاريخ</p>
                <p className="font-bold text-slate-800">{currentExam.date}</p>
              </div>
              <div className="w-px h-8 bg-slate-200 mx-2"></div>
              <div className="flex-1 text-left">
                <p className="text-sm text-slate-500 font-bold">الدرجة الكلية</p>
                <p className="font-black text-indigo-600">{currentExam.totalMarks}</p>
              </div>
            </div>

            <div className="space-y-3">
              {resultsData.length === 0 ? (
                <div className="text-center py-8 text-slate-500 font-medium">
                  لا يوجد أطفال مسجلين في هذا الفصل
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 text-right">
                      <th className="pb-3 text-slate-500 font-bold">اسم الطفل</th>
                      <th className="pb-3 text-slate-500 font-bold w-32">الدرجة المكتسبة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultsData.map((result, index) => {
                      const student = students.find(s => s.id === result.studentId);
                      return (
                        <tr key={result.studentId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                          <td className="py-3 font-bold text-slate-800">{student?.name}</td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max={currentExam.totalMarks}
                                step="0.5"
                                value={result.marks}
                                onChange={(e) => {
                                  const newResults = [...resultsData];
                                  newResults[index].marks = Number(e.target.value);
                                  setResultsData(newResults);
                                }}
                                className="w-20 px-3 py-2 rounded-lg border border-slate-200 text-center font-bold outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-700"
                              />
                              <span className="text-slate-400 font-medium text-sm">/ {currentExam.totalMarks}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div className="p-6 border-t border-slate-100 bg-white shrink-0 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={resultsData.length === 0}
              className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-md transition disabled:opacity-50"
            >
              حفظ الدرجات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ExamResultsModal;
