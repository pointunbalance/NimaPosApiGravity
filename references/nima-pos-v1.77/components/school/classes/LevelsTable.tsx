import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

interface Level {
  id?: number;
  name: string;
  sortOrder: number;
  ageFrom: string;
  ageTo: string;
  isActive?: boolean;
}

interface LevelsTableProps {
  filteredLevels: Level[];
  classesList: any[];
  handlePromoteStudents: (id: number) => void;
  handleOpenLevelModal: (isEdit: boolean, lvl: Level) => void;
  handleDeleteLevel: (id: number) => void;
}

export const LevelsTable: React.FC<LevelsTableProps> = ({
  filteredLevels,
  classesList,
  handlePromoteStudents,
  handleOpenLevelModal,
  handleDeleteLevel,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-right text-sm">
        <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
          <tr>
            <th className="px-6 py-4">الترتيب</th>
            <th className="px-6 py-4">اسم المستوى</th>
            <th className="px-6 py-4">السن المسموح (سنوات)</th>
            <th className="px-6 py-4">إجمالي الفصول</th>
            <th className="px-6 py-4">الحالة</th>
            <th className="px-6 py-4 text-center">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredLevels.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                لا توجد مستويات مضافة حالياً.
              </td>
            </tr>
          ) : (
            filteredLevels.map((lvl) => (
              <tr key={lvl.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-mono text-slate-500">{lvl.sortOrder}</td>
                <td className="px-6 py-4 font-bold text-slate-800">{lvl.name}</td>
                <td className="px-6 py-4 text-slate-600">من {lvl.ageFrom} إلى {lvl.ageTo}</td>
                <td className="px-6 py-4 text-slate-600">
                  <span className="px-3 py-1 bg-slate-100 rounded-full font-bold">
                    {classesList.filter((c) => c.levelId === lvl.id).length}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      lvl.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {lvl.isActive ? 'نشط' : 'غير نشط'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center items-center gap-2">
                    <button
                      onClick={() => handlePromoteStudents(lvl.id!)}
                      className="p-1.5 px-3 bg-brand-50 text-brand-600 font-bold hover:bg-brand-100 rounded-lg outline-none text-xs cursor-pointer"
                      title="ترقية للعام القادم"
                    >
                      ترقية الأطفال
                    </button>
                    <button
                      onClick={() => handleOpenLevelModal(true, lvl)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg outline-none cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteLevel(lvl.id!)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg outline-none cursor-pointer"
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
