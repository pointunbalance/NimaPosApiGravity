import React from 'react';
import { Search, Users } from 'lucide-react';

interface RecipientSelectorProps {
  filteredStudents: any[];
  selectedStudents: number[];
  classes: any[];
  classFilter: number;
  setClassFilter: (val: number) => void;
  searchStudent: string;
  setSearchStudent: (val: string) => void;
  handleSelectAll: (checked: boolean) => void;
  handleSelectStudent: (id: number) => void;
}

export const RecipientSelector: React.FC<RecipientSelectorProps> = ({
  filteredStudents,
  selectedStudents,
  classes,
  classFilter,
  setClassFilter,
  searchStudent,
  setSearchStudent,
  handleSelectAll,
  handleSelectStudent,
}) => {
  return (
    <div className="flex-1 lg:max-w-md border-l border-slate-100 pl-0 lg:pl-8">
      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-indigo-600" /> تحديد المستلمين
      </h3>

      <div className="space-y-4 mb-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchStudent}
            onChange={(e) => setSearchStudent(e.target.value)}
            placeholder="بحث باسم الطالب..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-sm bg-slate-50"
          />
        </div>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(Number(e.target.value))}
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 bg-white font-bold text-xs"
        >
          <option value={0}>جميع الفصول</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl max-h-[400px] overflow-y-auto">
        <div className="p-3 border-b border-slate-200 bg-slate-100 sticky top-0 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="selectAll"
              checked={filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="selectAll" className="text-sm font-bold text-slate-700 cursor-pointer">
              تحديد الكل ({filteredStudents.length})
            </label>
          </div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-md">
            محدد: {selectedStudents.length}
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {filteredStudents.map((student) => (
            <label
              key={student.id}
              className="flex items-center gap-3 p-3 hover:bg-white cursor-pointer transition"
            >
              <input
                type="checkbox"
                checked={selectedStudents.includes(student.id!)}
                onChange={() => handleSelectStudent(student.id!)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <div>
                <div className="font-bold text-slate-800 text-sm">{student.name}</div>
                <div className="text-xs text-slate-500">
                  {classes.find((c) => c.id === student.classroomId)?.name || 'بدون فصل'}
                </div>
              </div>
            </label>
          ))}
          {filteredStudents.length === 0 && (
            <div className="p-6 text-center text-slate-500 text-sm">لا يوجد طلاب متطابقين</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipientSelector;
