import React from "react";
import { FolderGit2 } from "lucide-react";
import { ProjectItem } from "./useProjectAccountingData";

interface WorkInProgressTabProps {
  filteredList: ProjectItem[];
}

const WorkInProgressTab: React.FC<WorkInProgressTabProps> = ({ filteredList }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 font-bold">
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-800">أعمال ومراحل تحت التنفيذ (WIP)</h2>
      </div>

      <div className="p-6">
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-4">
          <FolderGit2 className="w-6 h-6 text-emerald-600 shrink-0" />
          <div>
            <h3 className="font-bold text-emerald-800 mb-1">إعدادات الأعمال قيد التنفيذ</h3>
            <p className="text-sm text-emerald-700 font-normal">
              هنا يمكنك تعريف مراحل الإنتاج أو التنفيذ الخاصة بكل مشروع وتحميل التكاليف عليها بشكل
              دوري ليتم إثباتها عند الانتهاء والمطابقة.
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredList.map((p, index) => (
            <div
              key={p.id ?? index}
              className="border border-slate-200 rounded-xl p-5 bg-white hover:border-emerald-300 transition-colors"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="font-bold text-slate-800 text-lg">{p.name}</h4>
                  <span className="text-sm text-slate-500">{p.projectId}</span>
                </div>
                <span className="bg-emerald-100 text-emerald-800 px-3 py-1 text-sm rounded-full font-bold">
                  تكلفة معلقة: {(p.actual * 0.15).toLocaleString()} ر.س
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="flex justify-between text-sm text-slate-600 mb-2">
                  <span>التقدم الفعلي</span>
                  <span className="font-bold">{p.completionPercentage}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: `${p.completionPercentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="mt-4 flex gap-4 text-xs font-bold">
                <button className="text-emerald-600 hover:underline transition-all">
                  تحميل تكاليف للفترة
                </button>
                <button className="text-blue-600 hover:underline border-r border-slate-200 pr-4">
                  إصدار مستخلص (نقل التكلفة للإيراد)
                </button>
              </div>
            </div>
          ))}
          {filteredList.length === 0 && (
            <div className="text-center py-8 text-slate-400 font-bold">
              لا توجد مشاريع مسجلة حالياً لعرض حسابات WIP.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkInProgressTab;
