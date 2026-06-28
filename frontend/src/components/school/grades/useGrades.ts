import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';
import { useToast } from '../../../context/ToastContext';
import { printGradeReport } from './printUtils';

export const useGrades = () => {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<'skills' | 'evaluate' | 'reports'>('evaluate');

  const students = useLiveQuery(() => db.schoolStudents?.toArray()) || [];
  const classes = useLiveQuery(() => db.schoolClassesList?.toArray()) || [];
  const subjects = useLiveQuery(() => db.schoolSubjects?.toArray()) || [];
  const evaluations = useLiveQuery(() => db.schoolEvaluations?.toArray()) || [];

  // SETUP TAB
  const [isSubjectModalOpen, setSubjectModalOpen] = useState(false);
  const [subjectData, setSubjectData] = useState<any>({ name: '', category: 'academic', evaluationMethod: 'score', applicableLevels: '' });

  // EVALUATE TAB
  const [evalClassFilter, setEvalClassFilter] = useState<number>(0);
  const [evalDate, setEvalDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [evalType, setEvalType] = useState<string>('daily');
  const [isEvalModalOpen, setEvalModalOpen] = useState(false);
  const [selectedStudentForEval, setSelectedStudentForEval] = useState<any>(null);
  const [evalFormData, setEvalFormData] = useState<any>({}); // map subjectId -> evaluation data
  const [generalNotes, setGeneralNotes] = useState('');

  // REPORTS TAB
  const [reportClassFilter, setReportClassFilter] = useState<number>(0);
  const [reportStudentFilter, setReportStudentFilter] = useState<number>(0);

  // --- Handlers for Skills/Subjects ---
  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (subjectData.id) {
        await db.schoolSubjects.update(subjectData.id, subjectData);
        success('تم تعديل المهارة بنجاح');
      } else {
        await db.schoolSubjects.add(subjectData);
        success('تم إضافة المهارة الجديدة بنجاح');
      }
      setSubjectModalOpen(false);
      setSubjectData({ name: '', category: 'academic', evaluationMethod: 'score', applicableLevels: '' });
    } catch (err) {
      error('خطأ في الحفظ');
    }
  };

  const handleDeleteSubject = async (id: number) => {
    try {
      await db.schoolSubjects.delete(id);
      success('تم حذف المهارة بنجاح');
    } catch (err) {
      error('خطأ في الحذف');
    }
  };

  // --- Handlers for Evaluation ---
  const openEvalModal = (student: any) => {
    setSelectedStudentForEval(student);
    const existing = evaluations.filter(ev => ev.studentId === student.id && ev.date === evalDate && ev.type === evalType);
    
    const map: any = {};
    existing.forEach(ex => {
      map[ex.subjectId] = { grade: ex.grade, colorRating: ex.colorRating, textRating: ex.textRating };
    });
    
    const noteEval = existing.find(ex => ex.notes);
    setGeneralNotes(noteEval?.notes || '');

    setEvalFormData(map);
    setEvalModalOpen(true);
  };

  const handleEvalChange = (subjectId: number, field: string, value: any) => {
    setEvalFormData((prev: any) => ({
      ...prev,
      [subjectId]: {
        ...prev[subjectId],
        [field]: value
      }
    }));
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForEval) return;

    try {
      const existingIds = evaluations.filter(ev => ev.studentId === selectedStudentForEval.id && ev.date === evalDate && ev.type === evalType).map(e => e.id!);
      if (existingIds.length > 0) {
        await db.schoolEvaluations.bulkDelete(existingIds);
      }

      const newEvals: any[] = [];
      let hasNotes = false;

      subjects.forEach(sub => {
        if (evalFormData[sub.id]) {
          const isFirst = !hasNotes;
          const eData = evalFormData[sub.id];
          newEvals.push({
            studentId: selectedStudentForEval.id,
            subjectId: sub.id,
            date: evalDate,
            type: evalType,
            term: 'الأول',
            grade: eData.grade || '',
            colorRating: eData.colorRating || '',
            textRating: eData.textRating || '',
            notes: isFirst ? generalNotes : ''
          });
          if (isFirst) hasNotes = true;
        }
      });

      if (newEvals.length > 0) {
        await db.schoolEvaluations.bulkAdd(newEvals);
      } else if (generalNotes) {
        await db.schoolEvaluations.add({
          studentId: selectedStudentForEval.id,
          subjectId: 0,
          date: evalDate,
          type: evalType,
          term: 'الأول',
          grade: '', colorRating: '', textRating: '',
          notes: generalNotes
        });
      }

      setEvalModalOpen(false);
      success('تم حفظ التقييم بنجاح');
    } catch (err) {
      error('فشل حفظ التقييم');
    }
  };

  // --- Report / Print ---
  const printReport = (studentId: number, dateStr: string, type: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    printGradeReport(student, evaluations, subjects, classes, type, dateStr);
  };

  const handleSendReport = (studentId: number) => {
    const student = students.find(s => s.id === studentId);
    if (!student || !student.parentPhone) {
      error('لا يوجد رقم هاتف لولي الأمر!');
      return;
    }
    success(`تم إرسال التقرير بنجاح عبر الواتساب إلى رقم ولي الأمر: ${student.parentPhone}`);
  };

  const studentsToEvaluate = students.filter(s => evalClassFilter === 0 || s.classroomId === evalClassFilter);
  const studentsForReports = students.filter(s => reportClassFilter === 0 || s.classroomId === reportClassFilter);

  const handlePopulateDefaultSubjects = async () => {
    const defaults = [
      { name: 'القرآن الكريم', category: 'academic', evaluationMethod: 'text', applicableLevels: '' },
      { name: 'اللغة العربية', category: 'academic', evaluationMethod: 'score', applicableLevels: '' },
      { name: 'Math / الحساب', category: 'academic', evaluationMethod: 'score', applicableLevels: '' },
      { name: 'السلوك مع الزملاء', category: 'behavioral', evaluationMethod: 'color', applicableLevels: '' },
      { name: 'التركيز والانتباه', category: 'behavioral', evaluationMethod: 'color', applicableLevels: '' },
      { name: 'الأنشطة الفنية', category: 'activities', evaluationMethod: 'text', applicableLevels: '' }
    ];
    try {
      for (let s of defaults) {
        await db.schoolSubjects.add(s);
      }
      success('تم تعبئة المواد والمهارات الافتراضية بنجاح.');
    } catch (err) {
      error('خطأ في تهيئة المهارات');
    }
  };

  return {
    activeTab,
    setActiveTab,
    students,
    classes,
    subjects,
    evaluations,
    isSubjectModalOpen,
    setSubjectModalOpen,
    subjectData,
    setSubjectData,
    evalClassFilter,
    setEvalClassFilter,
    evalDate,
    setEvalDate,
    evalType,
    setEvalType,
    isEvalModalOpen,
    setEvalModalOpen,
    selectedStudentForEval,
    setSelectedStudentForEval,
    evalFormData,
    setEvalFormData,
    generalNotes,
    setGeneralNotes,
    reportClassFilter,
    setReportClassFilter,
    reportStudentFilter,
    setReportStudentFilter,
    handleSaveSubject,
    handleDeleteSubject,
    openEvalModal,
    handleEvalChange,
    handleSaveEvaluation,
    printReport,
    handleSendReport,
    studentsToEvaluate,
    studentsForReports,
    handlePopulateDefaultSubjects,
  };
};
