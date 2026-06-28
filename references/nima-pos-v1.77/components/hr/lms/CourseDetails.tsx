import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';
import { TrainingCourse, TrainingEnrollment, User } from '../../../types';
import { ArrowRight, Users, Calendar, Clock, Edit, Trash2, Plus, CheckCircle, XCircle, PlayCircle, Printer, Download } from 'lucide-react';
import { EnrollmentModal } from './EnrollmentModal';

interface CourseDetailsProps {
  course: TrainingCourse;
  onBack: () => void;
}

export const CourseDetails: React.FC<CourseDetailsProps> = ({ course, onBack }) => {
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<TrainingEnrollment | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const enrollments = useLiveQuery(
    () => db.trainingEnrollments.where('courseId').equals(course.id!).toArray(),
    [course.id]
  ) || [];

  const users = useLiveQuery(() => db.users.toArray(), []) || [];

  const handleAddEnrollment = () => {
    setEditingEnrollment(null);
    setIsEnrollmentModalOpen(true);
  };

  const handleEditEnrollment = (enrollment: TrainingEnrollment) => {
    setEditingEnrollment(enrollment);
    setIsEnrollmentModalOpen(true);
  };

  const handleDeleteEnrollment = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا التسجيل؟')) {
      await db.trainingEnrollments.delete(id);
    }
  };

  const handleEnrollmentSubmit = async (data: Partial<TrainingEnrollment>) => {
    if (editingEnrollment) {
      await db.trainingEnrollments.update(editingEnrollment.id!, data);
    } else {
      await db.trainingEnrollments.add({
        ...data,
        courseId: course.id!
      } as TrainingEnrollment);
    }
    setIsEnrollmentModalOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'enrolled':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">مسجل</span>;
      case 'in_progress':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">قيد التقدم</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">مكتمل</span>;
      case 'failed':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">لم يجتز</span>;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'enrolled':
        return <PlayCircle className="w-5 h-5 text-blue-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['الموظف', 'تاريخ التسجيل', 'الحالة', 'التقدم (%)', 'ملاحظات'];
    const csvContent = [
      headers.join(','),
      ...enrollments.map(en => {
        const user = users.find(u => u.id === en.employeeId);
        return [
          `"${user?.name || 'غير معروف'}"`,
          `"${new Date(en.enrollmentDate).toLocaleDateString('ar-EG')}"`,
          `"${en.status}"`,
          en.progress,
          `"${en.notes || ''}"`
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
    <div className="space-y-6" ref={printRef}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowRight className="w-6 h-6 text-gray-600" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">{course.title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-bold shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">تصدير CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-bold shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">طباعة</span>
          </button>
        </div>
      </div>

      <div className="hidden print:block mb-6 text-center">
          <h2 className="text-2xl font-bold text-slate-800">تفاصيل الدورة: {course.title}</h2>
          <p className="text-slate-500 mt-2">تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 print:border-none print:shadow-none print:p-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">تفاصيل الدورة</h3>
            <p className="text-gray-600 mb-6 whitespace-pre-wrap">
              {course.description || 'لا يوجد وصف متاح.'}
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-gray-600">
                <Users className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">المدرب</p>
                  <p className="text-sm">{course.instructor || 'غير محدد'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Calendar className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">الفترة</p>
                  <p className="text-sm">
                    {new Date(course.startDate).toLocaleDateString('ar-EG')} - {new Date(course.endDate).toLocaleDateString('ar-EG')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 print:border-none print:shadow-none print:p-0 print:mt-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">الموظفون المسجلون</h3>
              <button
                onClick={handleAddEnrollment}
                className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium print:hidden"
              >
                <Plus className="w-4 h-4" />
                تسجيل موظف
              </button>
            </div>

            {enrollments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-3 font-semibold text-gray-500">الموظف</th>
                      <th className="pb-3 font-semibold text-gray-500">تاريخ التسجيل</th>
                      <th className="pb-3 font-semibold text-gray-500">الحالة</th>
                      <th className="pb-3 font-semibold text-gray-500">التقدم</th>
                      <th className="pb-3 font-semibold text-gray-500 print:hidden">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {enrollments.map(enrollment => {
                      const user = users.find(u => u.id === enrollment.employeeId);
                      return (
                        <tr key={enrollment.id} className="hover:bg-gray-50">
                          <td className="py-4">
                            <div className="font-medium text-gray-900">{user?.name || 'موظف غير معروف'}</div>
                          </td>
                          <td className="py-4 text-gray-600">
                            {new Date(enrollment.enrollmentDate).toLocaleDateString('ar-EG')}
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <span className="print:hidden">{getStatusIcon(enrollment.status)}</span>
                              {getStatusBadge(enrollment.status)}
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-[100px] print:hidden">
                                <div 
                                  className="bg-purple-600 h-2.5 rounded-full" 
                                  style={{ width: `${enrollment.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">{enrollment.progress}%</span>
                            </div>
                          </td>
                          <td className="py-4 print:hidden">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditEnrollment(enrollment)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteEnrollment(enrollment.id!)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                لا يوجد موظفين مسجلين في هذه الدورة
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 print:border-none print:shadow-none print:p-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">إحصائيات الدورة</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">إجمالي المسجلين</span>
                <span className="font-bold text-gray-900">{enrollments.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">المكتملين</span>
                <span className="font-bold text-green-600">{enrollments.filter(e => e.status === 'completed').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">قيد التقدم</span>
                <span className="font-bold text-yellow-600">{enrollments.filter(e => e.status === 'in_progress').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">متوسط التقدم</span>
                <span className="font-bold text-purple-600">
                  {enrollments.length > 0 
                    ? Math.round(enrollments.reduce((acc, curr) => acc + curr.progress, 0) / enrollments.length) 
                    : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EnrollmentModal
        isOpen={isEnrollmentModalOpen}
        onClose={() => setIsEnrollmentModalOpen(false)}
        enrollment={editingEnrollment}
        users={users}
        onSubmit={handleEnrollmentSubmit}
      />
    </div>
  );
};
