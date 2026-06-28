import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';
import { format } from 'date-fns';

export const useSchoolMeals = () => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'tracking' | 'restrictions' | 'reports'>('tracking');
  
  // Day tracker for tracking view
  const [trackingDate, setTrackingDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [trackingClass, setTrackingClass] = useState<string>('');

  const classes = useLiveQuery(() => db.schoolClassesList?.toArray()) || [];
  const students = useLiveQuery(() => db.schoolStudents?.toArray()) || [];
  const mealsSchedules = useLiveQuery(() => db.schoolMealsSchedule?.toArray()) || [];
  const studentMeals = useLiveQuery(() => db.schoolStudentMeals?.filter(m => m.date === trackingDate).toArray()) || [];

  // --- Schedule State ---
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    id: undefined as number | undefined,
    day: 'sunday',
    weekId: 'default',
    breakfast: '',
    snack: '',
    lunch: ''
  });

  // --- Tracking State Logic ---
  const handleSaveMealTracking = async (studentId: number, mealType: string, status: string, notes: string = '') => {
    const existing = studentMeals.find(m => m.studentId === studentId && m.date === trackingDate);
    if (existing) {
      const mealsData = existing.meals || {};
      await db.schoolStudentMeals.update(existing.id!, {
        meals: {
          ...mealsData,
          [mealType]: { status, notes }
        }
      });
    } else {
      const student = students.find(s => s.id === studentId);
      if (!student) return;
      
      await db.schoolStudentMeals.add({
        studentId,
        classroomId: student.classroomId,
        date: trackingDate,
        meals: {
          [mealType]: { status, notes }
        }
      });
    }
  };

  // --- Restrictions Logic ---
  const [isRestrictionModalOpen, setIsRestrictionModalOpen] = useState(false);
  const [resStudentId, setResStudentId] = useState<number | null>(null);
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [allergies, setAllergies] = useState('');

  const openRestrictionsModal = (student: any) => {
    setResStudentId(student.id);
    setDietaryNotes(student.dietaryNotes || '');
    setAllergies(student.allergies || '');
    setIsRestrictionModalOpen(true);
  };

  const saveRestrictions = async () => {
    if (!resStudentId) return;
    await db.schoolStudents.update(resStudentId, {
      dietaryNotes,
      allergies
    });
    setIsRestrictionModalOpen(false);
  };

  // --- Schedule Logic ---
  const openScheduleModal = (day: string) => {
    const existing = mealsSchedules.find(m => m.day === day && m.weekId === 'default');
    if (existing) {
      setScheduleForm({
        id: existing.id,
        day,
        weekId: 'default',
        breakfast: existing.breakfast || '',
        snack: existing.snack || '',
        lunch: existing.lunch || ''
      });
    } else {
      setScheduleForm({
        id: undefined,
        day,
        weekId: 'default',
        breakfast: '',
        snack: '',
        lunch: ''
      });
    }
    setIsScheduleModalOpen(true);
  };

  const saveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (scheduleForm.id) {
      await db.schoolMealsSchedule.update(scheduleForm.id, scheduleForm);
    } else {
      await db.schoolMealsSchedule.add(scheduleForm);
    }
    setIsScheduleModalOpen(false);
  };

  const getDailyMenu = (day: string) => {
    return mealsSchedules.find(m => m.day === day && m.weekId === 'default') || {
      breakfast: 'لم يحدد', snack: 'لم يحدد', lunch: 'لم يحدد'
    };
  };

  return {
    activeTab,
    setActiveTab,
    trackingDate,
    setTrackingDate,
    trackingClass,
    setTrackingClass,
    classes,
    students,
    mealsSchedules,
    studentMeals,
    isScheduleModalOpen,
    setIsScheduleModalOpen,
    scheduleForm,
    setScheduleForm,
    isRestrictionModalOpen,
    setIsRestrictionModalOpen,
    allergies,
    setAllergies,
    dietaryNotes,
    setDietaryNotes,
    handleSaveMealTracking,
    openRestrictionsModal,
    saveRestrictions,
    openScheduleModal,
    saveSchedule,
    getDailyMenu
  };
};

export default useSchoolMeals;
