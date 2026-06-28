import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { WorkShift, RosterAssignment } from '../../types';
import { Plus, Clock, CalendarDays } from 'lucide-react';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useToast } from '../../context/ToastContext';

// Import refactored modular components
import { ShiftCard } from '../../components/hr/ShiftCard';
import { ShiftModal } from '../../components/hr/ShiftModal';
import { RosterTable } from '../../components/hr/RosterTable';

const DAYS_OF_WEEK = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export const WorkShifts: React.FC = () => {
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState<'shifts' | 'roster'>('shifts');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<WorkShift | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState<number | null>(null);

  const workShifts = useLiveQuery(() => db.workShifts.toArray(), []) || [];
  const users = useLiveQuery(() => db.users.where('isActive').equals(1).toArray(), []) || [];

  // Weekly Roster state
  const [rosterWeekStart, setRosterWeekStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay()); // Sunday
    return d.toISOString().split('T')[0];
  });

  // Fetch assignments for the selected week
  const rosterAssignments = useLiveQuery(async () => {
    const end = new Date(rosterWeekStart);
    end.setDate(end.getDate() + 6);
    const endDateStr = end.toISOString().split('T')[0];

    return await db.rosterAssignments
      .where('date')
      .between(rosterWeekStart, endDateStr, true, true)
      .toArray();
  }, [rosterWeekStart]) || [];

  const handleOpenModal = (shift?: WorkShift) => {
    if (shift) {
      setEditingShift(shift);
    } else {
      setEditingShift(null);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (formData: any) => {
    try {
      if (editingShift?.id) {
        await db.workShifts.update(editingShift.id, formData);
        success('تم تحديث الوردية بنجاح');
      } else {
        await db.workShifts.add(formData);
        success('تمت إضافة الوردية بنجاح');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      showError('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async () => {
    if (shiftToDelete) {
      try {
        await db.workShifts.delete(shiftToDelete);
        success('تم حذف الوردية بنجاح');
      } catch (err) {
        console.error(err);
        showError('حدث خطأ أثناء الحذف');
      } finally {
        setIsDeleteModalOpen(false);
        setShiftToDelete(null);
      }
    }
  };

  const handleUpdateRoster = async (
    userId: number,
    dateStr: string,
    shiftId: number | 'off' | 'default'
  ) => {
    try {
      const existing = rosterAssignments.find((r) => r.userId === userId && r.date === dateStr);
      if (shiftId === 'default') {
        if (existing?.id) {
          await db.rosterAssignments.delete(existing.id);
        }
      } else {
        const isDayOff = shiftId === 'off';
        const workShiftId = shiftId === 'off' ? undefined : shiftId;

        const payload: RosterAssignment = {
          userId,
          date: dateStr,
          isDayOff,
          workShiftId,
        };

        if (existing?.id) {
          await db.rosterAssignments.update(existing.id, payload);
        } else {
          await db.rosterAssignments.add(payload);
        }
      }
      success('تم تحديث جدول الورديات بنجاح');
    } catch (err) {
      console.error(err);
      showError('حدث خطأ أثناء تحديث جدول الورديات');
    }
  };

  const getWeekDays = () => {
    const days = [];
    const start = new Date(rosterWeekStart);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const weekDays = getWeekDays();

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">إدارة الورديات وجداول العمل</h1>
            <p className="text-slate-500 text-sm mt-1">تكوين ورديات النظام وتوزيعها على أسبوع العمل</p>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('shifts')}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
              activeTab === 'shifts'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
            }`}
          >
            إعداد الورديات الثابتة
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
              activeTab === 'roster'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
            }`}
          >
            جدول توزيع الورديات (Roster)
          </button>
        </div>
      </div>

      {activeTab === 'shifts' && (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition"
            >
              <Plus className="w-5 h-5" />
              إضافة وردية جديدة
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workShifts.map((shift) => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                onEdit={handleOpenModal}
                onDeleteRequest={(id) => {
                  setShiftToDelete(id);
                  setIsDeleteModalOpen(true);
                }}
                daysOfWeek={DAYS_OF_WEEK}
              />
            ))}
            {workShifts.length === 0 && (
              <div className="col-span-full bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-12 text-center text-slate-50">
                <CalendarDays className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-bold text-slate-400">لم يتم إضافة أي ورديات بعد</p>
                <p className="text-sm text-slate-400 mt-2">
                  قم بإنشاء ورديات لتنظيم أوقات حضور وانصراف الموظفين.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'roster' && (
        <RosterTable
          users={users}
          workShifts={workShifts}
          rosterAssignments={rosterAssignments}
          weekDays={weekDays}
          daysOfWeek={DAYS_OF_WEEK}
          rosterWeekStart={rosterWeekStart}
          setRosterWeekStart={setRosterWeekStart}
          onUpdateRoster={handleUpdateRoster}
        />
      )}

      <ShiftModal
        isOpen={isModalOpen}
        editingShift={editingShift}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        daysOfWeek={DAYS_OF_WEEK}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="حذف الوردية"
        message="هل أنت متأكد من حذف هذه الوردية؟ جميع الموظفين المرتبطين بها سيصبحون بدون وردية وسيحتاجون إلى إعادة التعيين."
      />
    </div>
  );
};
