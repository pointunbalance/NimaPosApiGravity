import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { GraduationCap, Plus, Search, BookOpen, Calendar, Users, Edit, Trash2 } from 'lucide-react';
import { TrainingCourse } from '../../types';
import { CourseModal } from '../../components/hr/lms/CourseModal';
import { CourseDetails } from '../../components/hr/lms/CourseDetails';
import ConfirmModal from '../../components/ui/ConfirmModal';

export const LMS: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [courseToDeleteId, setCourseToDeleteId] = useState<number | null>(null);
  const [editingCourse, setEditingCourse] = useState<TrainingCourse | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<TrainingCourse | null>(null);

  const courses = useLiveQuery(() => db.trainingCourses.toArray(), []) || [];
  const enrollments = useLiveQuery(() => db.trainingEnrollments.toArray(), []) || [];

  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.instructor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCourse = () => {
    setEditingCourse(null);
    setIsCourseModalOpen(true);
  };

  const handleEditCourse = (course: TrainingCourse, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCourse(course);
    setIsCourseModalOpen(true);
  };

  const handleDeleteCourse = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCourseToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const executeDeleteCourse = async () => {
    if (courseToDeleteId) {
      await db.trainingCourses.delete(courseToDeleteId);
      // Also delete related enrollments
      const relatedEnrollments = enrollments.filter(en => en.courseId === courseToDeleteId);
      for (const en of relatedEnrollments) {
        await db.trainingEnrollments.delete(en.id!);
      }
      if (selectedCourse?.id === courseToDeleteId) {
        setSelectedCourse(null);
      }
      setCourseToDeleteId(null);
    }
    setIsDeleteConfirmOpen(false);
  };

  const handleCourseSubmit = async (data: Partial<TrainingCourse>) => {
    if (editingCourse) {
      await db.trainingCourses.update(editingCourse.id!, data);
    } else {
      await db.trainingCourses.add(data as TrainingCourse);
    }
    setIsCourseModalOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">قادمة</span>;
      case 'ongoing':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">جارية</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">مكتملة</span>;
      default:
        return null;
    }
  };

  if (selectedCourse) {
    return <CourseDetails course={selectedCourse} onBack={() => setSelectedCourse(null)} />;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">نظام إدارة التعلم (LMS)</h1>
            <p className="text-gray-500">المسارات التعليمية، الاختبارات، والشهادات للموظفين</p>
          </div>
        </div>
        <button 
          onClick={handleAddCourse}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus size={20} />
          <span>دورة جديدة</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="البحث في الدورات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => {
              const courseEnrollments = enrollments.filter(e => e.courseId === course.id);
              return (
                <div 
                  key={course.id} 
                  onClick={() => setSelectedCourse(course)}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(course.status)}
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
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{course.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                    {course.description || 'لا يوجد وصف'}
                  </p>
                  
                  <div className="space-y-2 mt-auto">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{courseEnrollments.length} مسجلين</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{new Date(course.startDate).toLocaleDateString('ar-EG')} - {new Date(course.endDate).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <GraduationCap size={48} className="mx-auto mb-4 text-gray-300" />
            <p>لا توجد دورات تدريبية حالياً</p>
          </div>
        )}
      </div>

      <CourseModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        course={editingCourse}
        onSubmit={handleCourseSubmit}
      />
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={executeDeleteCourse}
        title="حذف الدورة التدريبية"
        message="هل أنت متأكد من رغبتك في حذف هذه الدورة بالكامل؟ سيتم إلغاء كافة التسجيلات المرتبطة بها نهائياً."
      />
    </div>
  );
};

export default LMS;