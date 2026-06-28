import React from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface SkillsSetupTabProps {
  subjects: any[];
  setSubjectData: (data: any) => void;
  setSubjectModalOpen: (open: boolean) => void;
  handlePopulateDefaultSubjects: () => void;
  handleDeleteSubject: (id: number) => void;
}

export const SkillsSetupTab: React.FC<SkillsSetupTabProps> = ({
  subjects,
  setSubjectData,
  setSubjectModalOpen,
  handlePopulateDefaultSubjects,
  handleDeleteSubject,
}) => {
  return (
    <div className="p-6 animate-in fade-in duration-300" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">قائمة المهارات والمواد التي يتم التقييم عليها</h2>
        <div className="flex gap-2">
          {subjects.length === 0 && (
            <button
              onClick={handlePopulateDefaultSubjects}
              type="button"
              className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-200 transition"
            >
              تعبئة القائمة الافتراضية
            </button>
          )}
          <button
            onClick={() => {
              setSubjectData({ name: '', category: 'academic', evaluationMethod: 'score', applicableLevels: '' });
              setSubjectModalOpen(true);
            }}
            type="button"
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> إضافة مهارة/مادة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {subjects.map((sub) => (
          <div key={sub.id} className="border border-slate-200 rounded-2xl p-5 hover:shadow-md transition bg-slate-50/50">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-black text-lg text-slate-800 pr-2">{sub.name}</h3>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setSubjectData(sub);
                    setSubjectModalOpen(true);
                  }}
                  type="button"
                  className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteSubject(sub.id!)}
                  type="button"
                  className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-600 flex justify-between">
                <span>التصنيف:</span>
                <span className="text-indigo-600">
                  {sub.category === 'academic'
                    ? 'أكاديمي وتعليمي'
                    : sub.category === 'behavioral'
                    ? 'سلوكي وتربوي'
                    : 'أنشطة حركية وفنية'}
                </span>
              </p>
              <p className="text-sm font-bold text-slate-600 flex justify-between">
                <span>طريقة التقييم:</span>
                <span className="text-emerald-600">
                  {sub.evaluationMethod === 'score'
                    ? 'درجات'
                    : sub.evaluationMethod === 'color'
                    ? 'رموز ألوان'
                    : 'تقييم نصي وملاحظات'}
                </span>
              </p>
            </div>
          </div>
        ))}
        {subjects.length === 0 && (
          <div className="col-span-3 text-center p-12 text-slate-500 font-medium">لا توجد مواد أو مهارات مسجلة بعد.</div>
        )}
      </div>
    </div>
  );
};
export default SkillsSetupTab;
