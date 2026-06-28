import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

interface SchoolClass {
  id?: number;
  name: string;
  levelId: number;
  capacity: number;
  teacherName?: string;
  assistantName?: string;
  status: string;
  notes?: string;
}

interface ClassesTableProps {
  filteredClasses: SchoolClass[];
  getClassStudentsCount: (id: number) => number;
  getLevelName: (id: number) => string;
  handleOpenClassProfile: (id: number) => void;
  handleOpenClassModal: (isEdit: boolean, cls: SchoolClass) => void;
  handleDeleteClass: (id: number) => void;
}

export const ClassesTable: React.FC<ClassesTableProps> = ({
  filteredClasses,
  getClassStudentsCount,
  getLevelName,
  handleOpenClassProfile,
  handleOpenClassModal,
  handleDeleteClass,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-right text-sm">
        <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
          <tr>
            <th className="px-6 py-4">اسم الفصل</th>
            <th className="px-6 py-4">المستوى</th>
            <th className="px-6 py-4">المعلمة مسؤولة الفصل</th>
            <th className="px-6 py-4">الإشغال</th>
            <th className="px-6 py-4">الحالة</th>
            <th className="px-6 py-4 text-center">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredClasses.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                لا توجد فصول مضافة.
              </td>
            </tr>
          ) : (
            filteredClasses.map((cls) => {
              const currentOccupancy = getClassStudentsCount(cls.id!);
              const isFull = currentOccupancy >= cls.capacity;
              return (
                <tr
                  key={cls.id}
                  className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                  onClick={() => handleOpenClassProfile(cls.id!)}
                >
                  <td className="px-6 py-4 font-bold text-slate-800">{cls.name}</td>
                  <td className="px-6 py-4 text-slate-600">{getLevelName(cls.levelId)}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{cls.teacherName || 'لم يتم التعيين'}</div>
                    <div className="text-xs text-slate-500">مساعدة: {cls.assistantName || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-24">
                        <div
                          className={`h-full ${isFull ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min((currentOccupancy / cls.capacity) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-slate-600 shrink-0">
                        {currentOccupancy} / {cls.capacity}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        cls.status === 'متاح'
                          ? 'bg-emerald-100 text-emerald-700'
                          : cls.status === 'ممتلئ'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {cls.status}
                    </span>
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-center items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenClassModal(true, cls);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg outline-none cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClass(cls.id!);
                        }}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg outline-none cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
