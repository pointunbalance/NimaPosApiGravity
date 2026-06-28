import React from 'react';
import { Plus, Search, Edit2, Trash2, CalendarDays, BookOpen, Clock } from 'lucide-react';
import { useTimetable } from '../../components/school/timetable/useTimetable';
import { TimetableModal } from '../../components/school/timetable/TimetableModal';

export const Timetable = () => {
  const {
    search,
    setSearch,
    isModalOpen,
    setIsModalOpen,
    isEdit,
    formData,
    setFormData,
    classes,
    employees,
    filteredRecords,
    getClassName,
    getTeacherName,
    handleOpenModal,
    handleSave,
    handleDelete,
  } = useTimetable();

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen" dir="rtl">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-100 p-3 rounded-xl">
            <CalendarDays className="w-8 h-8 text-indigo-700" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">الجدول الدراسي</h1>
            <p className="text-slate-500 font-medium mt-1">توزيع الحصص وربط المعلمين بصفوفهم</p>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal(false)}
          className="bg-indigo-600 text-white px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-indigo-700 shadow-sm font-bold"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة حصة</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="relative max-w-md">
            <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالفصل، المعلم، المادة..."
              className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">الصف والفصل</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">المادة</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">المعلم / الموظف</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">اليوم</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">الوقت</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-500 font-medium text-lg bg-slate-50/50"
                  >
                    لا توجد حصص دراسية، ابدأ بإضافة حصة لربط الفصول بالمعلمين.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">
                        {getClassName(item.classId)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-500" />
                        <span className="font-bold text-slate-800">{item.subject}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center flex-wrap gap-2">
                        <div className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                          {getTeacherName(item.teacherId).charAt(0)}
                        </div>
                        <span className="font-bold text-slate-800">{getTeacherName(item.teacherId)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">{item.day}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600 font-mono font-medium bg-slate-50 px-2 py-1 rounded-md w-max border border-slate-200">
                        <Clock className="w-4 h-4" />
                        {item.time}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(true, item)}
                          className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition"
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
      </div>

      <TimetableModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        isEdit={isEdit}
        formData={formData}
        setFormData={setFormData}
        classes={classes}
        employees={employees}
        handleSave={handleSave}
      />
    </div>
  );
};

export default Timetable;
