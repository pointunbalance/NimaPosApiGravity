import React from 'react';
import { CalendarClock, Search, UserCheck } from 'lucide-react';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useAttendance } from '../../components/school/attendance/useAttendance';
import { PickupPersonModal, AbsencePromptModal } from '../../components/school/attendance/AttendanceModals';
import { DailyAttendanceTab } from '../../components/school/attendance/DailyAttendanceTab';
import { AttendanceRecordsTab } from '../../components/school/attendance/AttendanceRecordsTab';
import { PickupsTab } from '../../components/school/attendance/PickupsTab';

export const Attendance = () => {
  const {
    activeTab,
    setActiveTab,
    students,
    allAttendance,
    allPickups,
    selectedStudentId,
    setSelectedStudentId,
    pickupId,
    setPickupId,
    notes,
    setNotes,
    today,
    pickupModalOpen,
    setPickupModalOpen,
    pickupFormData,
    setPickupFormData,
    confirmOpen,
    setConfirmOpen,
    confirmConfig,
    promptOpen,
    setPromptOpen,
    absenceReasonText,
    setAbsenceReasonText,
    getStudentName,
    handleCheckIn,
    handleCheckOut,
    handleSavePickup,
    handleDeletePickup,
    triggerAbsencePrompt,
    handleAbsencePromptSubmit,
  } = useAttendance();

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">الحضور والانصراف</h1>
          <p className="text-slate-500 mt-1">إدارة حضور وغياب الأطفال، الانصراف، ومفوضي الاستلام</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="flex overflow-x-auto border-b border-slate-200">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-6 py-4 font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'daily'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <CalendarClock className="w-4 h-4" /> حركة اليوم ({today})
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`px-6 py-4 font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'records'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Search className="w-4 h-4" /> التقارير والسجلات
          </button>
          <button
            onClick={() => setActiveTab('pickups')}
            className={`px-6 py-4 font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'pickups'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <UserCheck className="w-4 h-4" /> مفوضي الاستلام
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'daily' && (
            <DailyAttendanceTab
              students={students}
              allAttendance={allAttendance}
              allPickups={allPickups}
              selectedStudentId={selectedStudentId}
              setSelectedStudentId={setSelectedStudentId}
              pickupId={pickupId}
              setPickupId={setPickupId}
              notes={notes}
              setNotes={setNotes}
              today={today}
              handleCheckIn={handleCheckIn}
              handleCheckOut={handleCheckOut}
              triggerAbsencePrompt={triggerAbsencePrompt}
            />
          )}

          {activeTab === 'records' && (
            <AttendanceRecordsTab
              allAttendance={allAttendance}
              allPickups={allPickups}
              getStudentName={getStudentName}
            />
          )}

          {activeTab === 'pickups' && (
            <PickupsTab
              allPickups={allPickups}
              setPickupFormData={setPickupFormData}
              setPickupModalOpen={setPickupModalOpen}
              handleDeletePickup={handleDeletePickup}
              getStudentName={getStudentName}
            />
          )}
        </div>
      </div>

      <PickupPersonModal
        isOpen={pickupModalOpen}
        onClose={() => setPickupModalOpen(false)}
        students={students}
        formData={pickupFormData}
        setFormData={setPickupFormData}
        onSubmit={handleSavePickup}
      />

      <AbsencePromptModal
        isOpen={promptOpen}
        onClose={() => setPromptOpen(false)}
        absenceReasonText={absenceReasonText}
        setAbsenceReasonText={setAbsenceReasonText}
        onSubmit={handleAbsencePromptSubmit}
      />

      <ConfirmModal
        isOpen={confirmOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default Attendance;
