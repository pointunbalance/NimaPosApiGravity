import React, { useState, useMemo } from 'react';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { EventModal } from '../../components/school/events/EventModal';
import { CalendarView } from '../../components/school/events/CalendarView';
import { ListView } from '../../components/school/events/ListView';
import { EVENT_TYPES } from '../../components/school/events/eventConstants';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ui/ConfirmModal';

export const SchoolEvents = () => {
  const { success, error } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'special_activity',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    classes: [] as number[],
    students: [] as number[],
    cost: 0,
    notes: '',
    isNotificationSent: false,
  });

  const events = useLiveQuery(() => db.schoolEvents?.toArray()) || [];
  const students = useLiveQuery(() => db.schoolStudents?.toArray()) || [];
  const classes = useLiveQuery(() => db.schoolClassesList?.toArray()) || [];

  const handleOpenModal = (editMode = false, item: any = null) => {
    setIsEdit(editMode);
    if (editMode && item) {
      setCurrentId(item.id!);
      setFormData({
        name: item.name || '',
        type: item.type || 'special_activity',
        date: item.date || format(new Date(), 'yyyy-MM-dd'),
        time: item.time || '09:00',
        classes: item.classes || [],
        students: item.students || [],
        cost: item.cost || 0,
        notes: item.notes || '',
        isNotificationSent: item.isNotificationSent || false,
      });
    } else {
      setCurrentId(null);
      setFormData({
        name: '',
        type: 'special_activity',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '09:00',
        classes: [],
        students: [],
        cost: 0,
        notes: '',
        isNotificationSent: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit && currentId) {
        await db.schoolEvents.update(currentId, formData);
        success('تم تحديث الحدث بنجاح');
      } else {
        await db.schoolEvents.add(formData);
        success('تم إضافة الحدث بنجاح');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      error('حدث خطأ أثناء حفظ الحدث');
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      try {
        await db.schoolEvents.delete(deleteId);
        success('تم حذف الحدث بنجاح');
      } catch (err) {
        console.error(err);
        error('فشل حذف الحدث');
      }
    }
    setConfirmOpen(false);
    setDeleteId(null);
  };

  const handleToggleNotification = async (id: number, currentStatus: boolean) => {
    try {
      await db.schoolEvents.update(id, { isNotificationSent: !currentStatus });
      success(!currentStatus ? 'تم تفعيل حالة الإشعار بنجاح' : 'تم إلغاء حالة الإشعار');
    } catch (err) {
      console.error(err);
      error('فشل تحديث حالة الإشعار');
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  let currentStart = new Date(monthStart);
  while (currentStart.getDay() !== 6) {
    currentStart = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000);
  }

  let currentEnd = new Date(monthEnd);
  while (currentEnd.getDay() !== 5) {
    currentEnd = new Date(currentEnd.getTime() + 24 * 60 * 60 * 1000);
  }

  const calendarDays = eachDayOfInterval({ start: currentStart, end: currentEnd });

  const combinedEvents = useMemo(() => {
    const allEvents: any[] = [...events];

    students.forEach((s) => {
      const dob = (s as any).dob || s.birthDate || (s as any).dateOfBirth;
      if (dob) {
        try {
          const dobDate = new Date(dob);
          const bdayDate = new Date(currentDate.getFullYear(), dobDate.getMonth(), dobDate.getDate());
          allEvents.push({
            id: `bday-${s.id}`,
            name: `عيد ميلاد: ${s.name}`,
            type: 'birthday',
            date: format(bdayDate, 'yyyy-MM-dd'),
            time: '-',
            isVirtual: true,
          });
        } catch (e) {}
      }
    });

    return allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, students, currentDate.getFullYear()]);

  const getEventsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return combinedEvents.filter((e) => e.date === dateStr);
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <div className="p-6" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-3 rounded-2xl">
            <CalendarIcon className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">التقويم والأحداث</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              تخطيط الأنشطة، الرحلات، المواعيد المهمة وأعياد الميلاد
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1 flex">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              تقويم
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              قائمة
            </button>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-colors font-bold shadow-sm"
          >
            <Plus className="w-5 h-5" /> بناء حدث
          </button>
        </div>
      </div>

      {viewMode === 'calendar' && (
        <CalendarView
          currentDate={currentDate}
          prevMonth={prevMonth}
          nextMonth={nextMonth}
          calendarDays={calendarDays}
          getEventsForDay={getEventsForDay}
          handleOpenModal={handleOpenModal}
        />
      )}

      {viewMode === 'list' && (
        <ListView
          currentDate={currentDate}
          prevMonth={prevMonth}
          nextMonth={nextMonth}
          combinedEvents={combinedEvents}
          handleToggleNotification={handleToggleNotification}
          handleOpenModal={handleOpenModal}
          handleDeleteClick={handleDeleteClick}
        />
      )}

      <EventModal
        isOpen={isModalOpen}
        isEdit={isEdit}
        onClose={() => setIsModalOpen(false)}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSave}
        classes={classes}
        students={students}
        EVENT_TYPES={EVENT_TYPES}
      />

      <ConfirmModal
        isOpen={confirmOpen}
        title="حذف الحدث"
        message="هل أنت متأكد من حذف هذا الحدث نهائياً؟"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default SchoolEvents;
