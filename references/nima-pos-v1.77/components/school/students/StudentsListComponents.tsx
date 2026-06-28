import React from 'react';
import { Plus, Search, Printer, Download, Edit2, Archive } from 'lucide-react';

interface StudentsHeaderProps {
  onExportList: () => void;
  onPrintList: () => void;
  onAddStudent: () => void;
}

export const StudentsHeader: React.FC<StudentsHeaderProps> = ({
  onExportList,
  onPrintList,
  onAddStudent
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">إدارة الأطفال</h1>
        <p className="text-slate-500 mt-1">سجل الأطفال وملفاتهم الشاملة</p>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={onExportList}
          className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-sm transition-all"
        >
          <Download className="w-5 h-5" />
          <span className="hidden sm:inline">تصدير</span>
        </button>
        <button 
          onClick={onPrintList}
          className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-sm transition-all"
        >
          <Printer className="w-5 h-5" />
          <span className="hidden sm:inline">طباعة</span>
        </button>
        <button 
          onClick={onAddStudent}
          className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-sm transition-all hover:shadow-md"
        >
          <Plus className="w-5 h-5" />
          إضافة طفل جديد
        </button>
      </div>
    </div>
  );
};

interface StudentsFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  filterLevel: string;
  onFilterLevelChange: (val: string) => void;
  filterClass: string;
  onFilterClassChange: (val: string) => void;
  filterStatus: string;
  onFilterStatusChange: (val: string) => void;
  levels: any[];
  classesList: any[];
}

export const StudentsFilters: React.FC<StudentsFiltersProps> = ({
  search,
  onSearchChange,
  filterLevel,
  onFilterLevelChange,
  filterClass,
  onFilterClassChange,
  filterStatus,
  onFilterStatusChange,
  levels,
  classesList
}) => {
  return (
    <div className="bg-white p-4 justify-between rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 no-print">
      <div className="relative flex-1">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="بحث بالاسم، الكود، الرقم القومي..." 
          className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <select 
          value={filterLevel} 
          onChange={e => onFilterLevelChange(e.target.value)} 
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 focus:ring-2 focus:ring-brand-500 outline-none font-bold"
        >
          <option value="">كل المستويات</option>
          {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select 
          value={filterClass} 
          onChange={e => onFilterClassChange(e.target.value)} 
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 focus:ring-2 focus:ring-brand-500 outline-none font-bold"
        >
          <option value="">كل الفصول</option>
          {classesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select 
          value={filterStatus} 
          onChange={e => onFilterStatusChange(e.target.value)} 
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 focus:ring-2 focus:ring-brand-500 outline-none font-bold"
        >
          <option value="">الحالة: الكل</option>
          <option value="نشط">نشط</option>
          <option value="متوقف">متوقف</option>
          <option value="منسحب">منسحب</option>
        </select>
      </div>
    </div>
  );
};

interface StudentsTableProps {
  filteredChildren: any[];
  levels: any[];
  classesList: any[];
  guardians: any[];
  search: string;
  onEdit: (id: number) => void;
  onArchive: (id: number, name: string) => void;
}

export const StudentsTable: React.FC<StudentsTableProps> = ({
  filteredChildren,
  levels,
  classesList,
  guardians,
  search,
  onEdit,
  onArchive
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print-area">
      <div className="hidden print-only border-b-2 border-slate-800 pb-4 mb-4 text-center mt-4 mx-4">
        <h2 className="text-2xl font-black mb-2">قائمة الأطفال المسجلين</h2>
        {search && <p className="text-slate-600 mb-1">نتيجة البحث: {search}</p>}
        <p className="text-slate-600">تاريخ الطباعة: {new Date().toLocaleString('ar-EG')}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
            <tr>
              <th className="px-6 py-4">الكود</th>
              <th className="px-6 py-4">اسم الطفل</th>
              <th className="px-6 py-4">المستوى / الفصل</th>
              <th className="px-6 py-4">ولي الأمر</th>
              <th className="px-6 py-4">السن</th>
              <th className="px-6 py-4">الحالة</th>
              <th className="px-6 py-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredChildren.map(child => {
              const lvl = levels.find(l => l.id === child.levelId)?.name || '-';
              const cls = classesList.find(c => c.id === child.classroomId)?.name || '-';
              const gdn = guardians.find(g => g.id === child.guardianId)?.name || 'غير محدد';
              
              return (
                <tr key={child.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-500">{child.code || '-'}</td>
                  <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold">
                      {child.name?.charAt(0) || '?'}
                    </div>
                    {child.name}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{lvl} - {cls}</td>
                  <td className="px-6 py-4 font-bold text-slate-700">{gdn}</td>
                  <td className="px-6 py-4 font-mono text-slate-600">{child.dateOfBirth ? 'متوفر' : '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${child.status === 'نشط' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {child.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => onEdit(child.id!)} 
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onArchive(child.id!, child.name)} 
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredChildren.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold">
                  لا يوجد أطفال مسجلين ومطابقين للبحث حالياً.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
