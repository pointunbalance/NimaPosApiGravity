import React, { useState } from 'react';
import { Plus, Search, FileSignature, Edit2, Trash2, CheckSquare } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { ExamCreateModal } from '../../components/school/exams/ExamCreateModal';
import { ExamResultsModal } from '../../components/school/exams/ExamResultsModal';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ui/ConfirmModal';

export const SchoolExams = () => {
  const { success, error } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [currentExam, setCurrentExam] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    classId: '',
    subject: '',
    date: new Date().toISOString().split('T')[0],
    totalMarks: 100,
  });

  const [resultsData, setResultsData] = useState<{ studentId: number; marks: number }[]>([]);

  const exams = useLiveQuery(() => db.schoolExams?.toArray()) || [];
  const classes = useLiveQuery(() => db.schoolClassesList?.toArray()) || [];
  const students = useLiveQuery(() => db.schoolStudents?.toArray()) || [];

  const handleOpenModal = (exam: any = null) => {
    if (exam) {
      setCurrentExam(exam);
      setFormData({
        title: exam.title,
        classId: exam.classId,
        subject: exam.subject,
        date: exam.date,
        totalMarks: exam.totalMarks,
      });
    } else {
      setCurrentExam(null);
      setFormData({
        title: '',
        classId: '',
        subject: '',
        date: new Date().toISOString().split('T')[0],
        totalMarks: 100,
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenResults = async (exam: any) => {
    setCurrentExam(exam);
    const existingResults = await db.schoolExamResults.where('examId').equals(exam.id).toArray();
    const classStudents = students.filter(s => s.classroomId === Number(exam.classId));
    
    const initializedResults = classStudents.map(student => {
      const existing = existingResults.find(r => r.studentId === student.id);
      return {
        studentId: student.id!,
        marks: existing ? existing.marks : 0,
      };
    });
    
    setResultsData(initializedResults);
    setIsResultsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentExam) {
        await db.schoolExams.update(currentExam.id, formData);
        success('تم تحديث بيانات الاختبار بنجاح');
      } else {
        await db.schoolExams.add(formData);
        success('تم إضافة الاختبار بنجاح');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving exam:', err);
      error('فشل في حفظ بيانات الاختبار');
    }
  };

  const handleSaveResults = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const examId = currentExam.id;
      const existingResults = await db.schoolExamResults.where('examId').equals(examId).toArray();
      const idsToDelete = existingResults.map(r => r.id);
      if (idsToDelete.length > 0) {
        await db.schoolExamResults.bulkDelete(idsToDelete);
      }

      const newResults = resultsData.map(r => ({
        ...r,
        examId,
      }));
      await db.schoolExamResults.bulkAdd(newResults);
      setIsResultsModalOpen(false);
      success('تم حفظ درجات الأطفال بنجاح');
    } catch (err) {
      console.error('Error saving results:', err);
      error('حدث خطأ أثناء رصد الدرجات');
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      try {
        await db.schoolExams.delete(deleteId);
        const linkedResults = await db.schoolExamResults.where('examId').equals(deleteId).toArray();
        const idsToDelete = linkedResults.map(r => r.id);
        if (idsToDelete.length > 0) {
          await db.schoolExamResults.bulkDelete(idsToDelete);
        }
        success('تم حذف الاختبار وجميع نتائجه المرتبطة بنجاح');
      } catch (err) {
        console.error(err);
        error('فشل حذف الاختبار');
      }
    }
    setConfirmOpen(false);
    setDeleteId(null);
  };

  const filteredExams = exams.filter(e => 
    e.title.includes(searchQuery) || 
    e.subject.includes(searchQuery) ||
    classes.find(c => c.id === Number(e.classId))?.name.includes(searchQuery)
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-100 p-3 rounded-xl">
            <FileSignature className="w-8 h-8 text-indigo-700" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">الاختبارات والتقييمات</h1>
            <p className="text-slate-500 font-medium">إدارة اختبارات الأطفال وتسجيل العلامات</p>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 font-bold shadow-sm transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة اختبار</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="بحث في الاختبارات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200 text-right">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">اسم الاختبار</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">الفصل</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">المادة / المجال</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">التاريخ</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">الدرجة الكلية</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-medium">
                    لا توجد اختبارات مسجلة
                  </td>
                </tr>
              ) : (
                filteredExams.map(exam => (
                  <tr key={exam.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{exam.title}</td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg font-bold text-sm">
                        {classes.find(c => c.id === Number(exam.classId))?.name || 'غير معروف'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">{exam.subject}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{exam.date}</td>
                    <td className="px-6 py-4 text-indigo-600 font-bold">{exam.totalMarks}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenResults(exam)}
                          className="px-3 py-2 text-sm font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center gap-1 transition"
                        >
                          <CheckSquare className="w-4 h-4" /> رصد الدرجات
                        </button>
                        <button
                          onClick={() => handleOpenModal(exam)}
                          className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(exam.id)}
                          className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
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

      <ExamCreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentExam={currentExam}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSave}
        classes={classes}
      />

      <ExamResultsModal
        isOpen={isResultsModalOpen}
        onClose={() => setIsResultsModalOpen(false)}
        currentExam={currentExam}
        classes={classes}
        students={students}
        resultsData={resultsData}
        setResultsData={setResultsData}
        handleSubmit={handleSaveResults}
      />

      <ConfirmModal
        isOpen={confirmOpen}
        title="حذف الاختبار"
        message="هل أنت متأكد من حذف هذا الاختبار نهائياً؟ سيؤدي ذلك أيضاً لحذف جميع درجات الأطفال التي تم رصدها له."
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default SchoolExams;
