import React, { useState, useRef } from 'react';
import { db } from '../../db';
import { TrainingCourse, TrainingEnrollment, User } from '../../types';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { 
  BookOpen, Plus, Search, Filter, GraduationCap, Users, 
  Calendar, CheckCircle, Clock, PlayCircle, X, Save, User as UserIcon,
  Edit, Trash2, Printer, Download, Award
} from 'lucide-react';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useToast } from '../../context/ToastContext';

export default function Training() {
  const { showToast } = useToast();
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  
  const [isCourseDeleteOpen, setIsCourseDeleteOpen] = useState(false);
  const [courseToDeleteId, setCourseToDeleteId] = useState<number | null>(null);
  const [isEnrollmentDeleteOpen, setIsEnrollmentDeleteOpen] = useState(false);
  const [enrollmentToDeleteId, setEnrollmentToDeleteId] = useState<number | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  const [newCourse, setNewCourse] = useState<Partial<TrainingCourse>>({
    status: 'upcoming',
    startDate: new Date(),
    endDate: new Date()
  });

  const [newEnrollment, setNewEnrollment] = useState<Partial<TrainingEnrollment>>({
    status: 'enrolled',
    progress: 0,
    enrollmentDate: new Date()
  });

  const courses = useLiveQuery(() => db.trainingCourses.reverse().sortBy('startDate'));
  const enrollments = useLiveQuery(() => db.trainingEnrollments.toArray());
  const users = useLiveQuery(() => db.users.toArray());

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.title || !newCourse.startDate || !newCourse.endDate) return;

    if (editingCourseId) {
      await db.trainingCourses.update(editingCourseId, {
        title: newCourse.title,
        description: newCourse.description,
        instructor: newCourse.instructor,
        startDate: newCourse.startDate,
        endDate: newCourse.endDate,
        status: newCourse.status as any
      });
    } else {
      await db.trainingCourses.add({
        title: newCourse.title,
        description: newCourse.description,
        instructor: newCourse.instructor,
        startDate: newCourse.startDate,
        endDate: newCourse.endDate,
        status: newCourse.status as any
      });
    }

    setIsCourseModalOpen(false);
    setEditingCourseId(null);
    setNewCourse({
      status: 'upcoming',
      startDate: new Date(),
      endDate: new Date()
    });
  };

  const handleEditCourse = (course: TrainingCourse, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCourseId(course.id!);
    setNewCourse({
      title: course.title,
      description: course.description,
      instructor: course.instructor,
      startDate: course.startDate,
      endDate: course.endDate,
      status: course.status
    });
    setIsCourseModalOpen(true);
  };

  const handleDeleteCourse = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCourseToDeleteId(id);
    setIsCourseDeleteOpen(true);
  };

  const executeDeleteCourse = async () => {
    if (courseToDeleteId) {
      await db.trainingCourses.delete(courseToDeleteId);
      const relatedEnrollments = enrollments?.filter(en => en.courseId === courseToDeleteId) || [];
      for (const en of relatedEnrollments) {
        await db.trainingEnrollments.delete(en.id!);
      }
      if (selectedCourseId === courseToDeleteId) {
        setSelectedCourseId(null);
      }
      setCourseToDeleteId(null);
      showToast('تم حذف الدورة والتسجيلات المرتبطة بها بنجاح', 'success');
    }
    setIsCourseDeleteOpen(false);
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnrollment.courseId || !newEnrollment.employeeId) return;

    await db.trainingEnrollments.add({
      courseId: Number(newEnrollment.courseId),
      employeeId: Number(newEnrollment.employeeId),
      enrollmentDate: newEnrollment.enrollmentDate || new Date(),
      status: newEnrollment.status as any,
      progress: newEnrollment.progress || 0,
      notes: newEnrollment.notes
    });

    setIsEnrollModalOpen(false);
    setNewEnrollment({
      status: 'enrolled',
      progress: 0,
      enrollmentDate: new Date()
    });
  };

  const updateEnrollmentProgress = async (id: number, progress: number, status: TrainingEnrollment['status']) => {
    await db.trainingEnrollments.update(id, { progress, status });
  };

  const handleDeleteEnrollment = (id: number) => {
    setEnrollmentToDeleteId(id);
    setIsEnrollmentDeleteOpen(true);
  };

  const executeDeleteEnrollment = async () => {
    if (enrollmentToDeleteId) {
      await db.trainingEnrollments.delete(enrollmentToDeleteId);
      setEnrollmentToDeleteId(null);
      showToast('تم إلغاء تسجيل الموظف بنجاح', 'success');
    }
    setIsEnrollmentDeleteOpen(false);
  };

  const filteredCourses = courses?.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const getCourseEnrollments = (courseId: number) => {
    return enrollments?.filter(e => e.courseId === courseId) || [];
  };

  const getUserName = (id?: number) => users?.find(u => u.id === id)?.name || 'غير محدد';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800 ';
      case 'ongoing': return 'bg-amber-100 text-amber-800 ';
      case 'completed': return 'bg-emerald-100 text-emerald-800 ';
      case 'enrolled': return 'bg-slate-100 text-slate-800 ';
      case 'in_progress': return 'bg-amber-100 text-amber-800 ';
      case 'failed': return 'bg-red-100 text-red-800 ';
      default: return 'bg-slate-100 text-slate-800 ';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'upcoming': return 'قادم';
      case 'ongoing': return 'جاري';
      case 'completed': return 'مكتمل';
      case 'enrolled': return 'مسجل';
      case 'in_progress': return 'قيد التدريب';
      case 'failed': return 'لم يجتز';
      default: return status;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!selectedCourseId) return;
    const course = courses?.find(c => c.id === selectedCourseId);
    if (!course) return;

    const courseEnrollments = getCourseEnrollments(selectedCourseId);
    const headers = ['الموظف', 'تاريخ التسجيل', 'التقدم (%)', 'الحالة'];
    const csvContent = [
      headers.join(','),
      ...courseEnrollments.map(en => {
        return [
          `"${getUserName(en.employeeId)}"`,
          `"${format(new Date(en.enrollmentDate), 'yyyy-MM-dd')}"`,
          en.progress,
          `"${getStatusLabel(en.status)}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `تسجيلات_دورة_${course.title.replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="text-indigo-600" />
            التدريب والتطوير
          </h1>
          <p className="text-slate-500 text-sm mt-1">إدارة الدورات التدريبية وتتبع تقدم الموظفين</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEnrollModalOpen(true)}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Users size={20} />
            تسجيل موظف
          </button>
          <button
            onClick={() => {
              setEditingCourseId(null);
              setNewCourse({
                status: 'upcoming',
                startDate: new Date(),
                endDate: new Date()
              });
              setIsCourseModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            دورة جديدة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Courses List */}
        <div className="lg:col-span-1 space-y-4 print:hidden">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="بحث عن دورة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="space-y-3">
            {filteredCourses?.map(course => (
              <div 
                key={course.id}
                onClick={() => setSelectedCourseId(course.id!)}
                className={`p-4 rounded-xl border cursor-pointer transition-colors group ${
                  selectedCourseId === course.id 
                    ? 'bg-indigo-50 border-indigo-200 ' 
                    : 'bg-white border-slate-200 hover:border-indigo-300 '
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-800">{course.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(course.status)}`}>
                      {getStatusLabel(course.status)}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <button 
                        onClick={(e) => handleEditCourse(course, e)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteCourse(course.id!, e)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-slate-500 flex items-center gap-1 mb-1">
                  <Calendar size={14} />
                  {format(new Date(course.startDate), 'yyyy-MM-dd')} - {format(new Date(course.endDate), 'yyyy-MM-dd')}
                </div>
                <div className="text-sm text-slate-500 flex items-center gap-1">
                  <GraduationCap size={14} />
                  {course.instructor || 'مدرب غير محدد'}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-sm">
                  <span className="text-slate-600 font-medium">المسجلين:</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-full text-slate-700 font-bold">
                    {getCourseEnrollments(course.id!).length}
                  </span>
                </div>
              </div>
            ))}
            {filteredCourses?.length === 0 && (
              <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                لا توجد دورات تدريبية
              </div>
            )}
          </div>
        </div>

        {/* Enrollments Detail */}
        <div className="lg:col-span-2" ref={printRef}>
          {selectedCourseId ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col print:border-none print:shadow-none">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="font-bold text-slate-800 flex items-center gap-2">
                    <Users className="text-indigo-600" />
                    الموظفين المسجلين في: {courses?.find(c => c.id === selectedCourseId)?.title}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1 hidden print:block">
                    تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}
                  </p>
                </div>
                <div className="flex items-center gap-2 print:hidden">
                  <button
                    onClick={handleExportCSV}
                    className="text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
                  >
                    <Download size={16} />
                    تصدير
                  </button>
                  <button
                    onClick={handlePrint}
                    className="text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
                  >
                    <Printer size={16} />
                    طباعة
                  </button>
                  <button
                    onClick={() => {
                      setNewEnrollment({ ...newEnrollment, courseId: selectedCourseId });
                      setIsEnrollModalOpen(true);
                    }}
                    className="text-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    تسجيل موظف
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-right">
                  <thead className="bg-white text-slate-500 text-sm border-b border-slate-200">
                    <tr>
                      <th className="p-4 font-medium">الموظف</th>
                      <th className="p-4 font-medium">تاريخ التسجيل</th>
                      <th className="p-4 font-medium">التقدم</th>
                      <th className="p-4 font-medium">الحالة</th>
                      <th className="p-4 font-medium print:hidden">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {getCourseEnrollments(selectedCourseId).map(enrollment => (
                      <tr key={enrollment.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-medium text-slate-800">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 print:hidden">
                              <UserIcon size={16} />
                            </div>
                            {getUserName(enrollment.employeeId)}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-slate-500">
                          {format(new Date(enrollment.enrollmentDate), 'yyyy-MM-dd')}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={enrollment.progress}
                              onChange={(e) => updateEnrollmentProgress(enrollment.id!, Number(e.target.value), enrollment.status)}
                              className="w-24 accent-indigo-600 print:hidden"
                            />
                            <span className="text-sm font-bold text-slate-700 w-8">{enrollment.progress}%</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <select
                            value={enrollment.status}
                            onChange={(e) => updateEnrollmentProgress(enrollment.id!, enrollment.progress, e.target.value as any)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border-0 outline-none cursor-pointer print:hidden ${getStatusColor(enrollment.status)}`}
                          >
                            <option value="enrolled">مسجل</option>
                            <option value="in_progress">قيد التدريب</option>
                            <option value="completed">مكتمل</option>
                            <option value="failed">لم يجتز</option>
                          </select>
                          <span className={`hidden print:inline-block px-2.5 py-1 rounded-full text-xs font-medium border-0 ${getStatusColor(enrollment.status)}`}>
                            {getStatusLabel(enrollment.status)}
                          </span>
                        </td>
                        <td className="p-4 print:hidden">
                          <div className="flex gap-2">
                             {enrollment.progress === 100 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                      const courseName = courses?.find(c => c.id === selectedCourseId)?.title || 'الدورة';
                                      showToast(`تم إصدار وتنزيل شهادة اجتياز ${courseName} للموظف ${getUserName(enrollment.employeeId)}.`, 'success');
                                  }}
                                  className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-xs font-bold hover:bg-emerald-100 flex items-center gap-1 transition-colors"
                                  title="إصدار الشهادة"
                                >
                                  <Award size={14} /> الشهادة
                                </button>
                             )}
                            <button
                              onClick={() => handleDeleteEnrollment(enrollment.id!)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="حذف التسجيل"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {getCourseEnrollments(selectedCourseId).length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500">
                          لا يوجد موظفين مسجلين في هذه الدورة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col items-center justify-center p-8 text-slate-500 print:hidden">
              <BookOpen size={48} className="mb-4 text-slate-300" />
              <p>اختر دورة تدريبية لعرض تفاصيلها والمسجلين بها</p>
            </div>
          )}
        </div>
      </div>

      {/* New/Edit Course Modal */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingCourseId ? 'تعديل دورة تدريبية' : 'إضافة دورة تدريبية'}
              </h2>
              <button onClick={() => setIsCourseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">اسم الدورة *</label>
                <input
                  required
                  type="text"
                  value={newCourse.title || ''}
                  onChange={e => setNewCourse({...newCourse, title: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">المدرب / الجهة</label>
                <input
                  type="text"
                  value={newCourse.instructor || ''}
                  onChange={e => setNewCourse({...newCourse, instructor: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ البدء *</label>
                  <input
                    required
                    type="date"
                    value={format(newCourse.startDate || new Date(), 'yyyy-MM-dd')}
                    onChange={e => setNewCourse({...newCourse, startDate: new Date(e.target.value)})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ الانتهاء *</label>
                  <input
                    required
                    type="date"
                    value={format(newCourse.endDate || new Date(), 'yyyy-MM-dd')}
                    onChange={e => setNewCourse({...newCourse, endDate: new Date(e.target.value)})}
                    min={format(newCourse.startDate || new Date(), 'yyyy-MM-dd')}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الحالة</label>
                <select
                  value={newCourse.status}
                  onChange={e => setNewCourse({...newCourse, status: e.target.value as any})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="upcoming">قادم</option>
                  <option value="ongoing">جاري</option>
                  <option value="completed">مكتمل</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الوصف</label>
                <textarea
                  rows={3}
                  value={newCourse.description || ''}
                  onChange={e => setNewCourse({...newCourse, description: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  حفظ الدورة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Enrollment Modal */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">تسجيل موظف في دورة</h2>
              <button onClick={() => setIsEnrollModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleEnroll} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الدورة التدريبية *</label>
                <select
                  required
                  value={newEnrollment.courseId || ''}
                  onChange={e => setNewEnrollment({...newEnrollment, courseId: Number(e.target.value)})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">-- اختر الدورة --</option>
                  {courses?.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الموظف *</label>
                <select
                  required
                  value={newEnrollment.employeeId || ''}
                  onChange={e => setNewEnrollment({...newEnrollment, employeeId: Number(e.target.value)})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">-- اختر الموظف --</option>
                  {users?.map(u => (
                    <option key={u.id} value={u.id}>{u.name} - {u.jobTitle || 'موظف'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الحالة</label>
                <select
                  value={newEnrollment.status}
                  onChange={e => setNewEnrollment({...newEnrollment, status: e.target.value as any})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="enrolled">مسجل</option>
                  <option value="in_progress">قيد التدريب</option>
                  <option value="completed">مكتمل</option>
                  <option value="failed">لم يجتز</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ملاحظات</label>
                <textarea
                  rows={3}
                  value={newEnrollment.notes || ''}
                  onChange={e => setNewEnrollment({...newEnrollment, notes: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  تسجيل الموظف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={isCourseDeleteOpen}
        onClose={() => setIsCourseDeleteOpen(false)}
        onConfirm={executeDeleteCourse}
        title="حذف الدورة التدريبية"
        message="هل أنت متأكد من رغبتك في حذف هذه الدورة بالكامل؟ سيتم إلغاء كافة التسجيلات المرتبطة بها نهائياً."
      />
      <ConfirmModal
        isOpen={isEnrollmentDeleteOpen}
        onClose={() => setIsEnrollmentDeleteOpen(false)}
        onConfirm={executeDeleteEnrollment}
        title="إلغاء تسجيل الموظف"
        message="هل أنت متأكد من رغبتك في إلغاء تسجيل هذا الموظف من هذه الدورة التدريبية؟"
      />
    </div>
  );
}
