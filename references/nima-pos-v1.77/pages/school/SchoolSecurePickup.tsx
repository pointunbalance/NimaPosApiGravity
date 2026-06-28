import React from "react";
import { ShieldCheck, Search, QrCode } from "lucide-react";
import { useSchoolSecurePickup } from "../../components/school/secure_pickup/useSchoolSecurePickup";
import { TodayPickupLog } from "../../components/school/secure_pickup/TodayPickupLog";
import { PickupStudentCard } from "../../components/school/secure_pickup/PickupStudentCard";
import { PickupModal } from "../../components/school/PickupModal";
import { ManageAuthModal } from "../../components/school/ManageAuthModal";
import { ConfirmModal } from "../../components/ui/ConfirmModal";

export const SchoolSecurePickup = () => {
  const {
    searchQuery,
    setSearchQuery,
    selectedStudent,
    setSelectedStudent,
    isPickupModalOpen,
    setIsPickupModalOpen,
    isManageAuthModalOpen,
    setIsManageAuthModalOpen,
    isConfirmDeleteOpen,
    setIsConfirmDeleteOpen,
    students,
    classes,
    authorizedPickups,
    pickupLogs,
    filteredStudents,
    activeStudents,
    handleLogPickup,
    handleAddAuthPerson,
    triggerDeleteAuth,
    confirmDeleteAuth,
    openPickupModal,
    openManageAuthModal,
  } = useSchoolSecurePickup();

  // Handle exact code match (e.g. from QR Scanner)
  React.useEffect(() => {
    if (searchQuery.length > 2) {
      const exactCodeMatch = activeStudents.find(
        (s) => s.code?.toLowerCase() === searchQuery.toLowerCase()
      );
      if (exactCodeMatch && !isPickupModalOpen && !isManageAuthModalOpen) {
        const hasPickedUpToday = pickupLogs.some(
          (log) => log.studentId === exactCodeMatch.id
        );
        if (!hasPickedUpToday) {
          openPickupModal(exactCodeMatch);
          setSearchQuery(""); // clear after triggering
        }
      }
    }
  }, [searchQuery, activeStudents, pickupLogs, isPickupModalOpen, isManageAuthModalOpen, openPickupModal, setSearchQuery]);

  return (
    <div className="p-6" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-100 p-3 rounded-2xl">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800">الاستلام الآمن</h1>
            <p className="text-slate-500 font-medium">
              تسجيل استلام الأطفال والتحقق من الأشخاص المصرح لهم
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Students List for Pickup */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="ابحث باسم الطالب أو كود الطالب (QR)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium outline-none"
                autoFocus
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStudents.map((student) => {
              const studentClass = classes.find((c) => c.id === student.classroomId);
              const studentPickups = authorizedPickups.filter((ap) => ap.studentId === student.id);
              const hasPickedUpToday = pickupLogs.some((log) => log.studentId === student.id);

              return (
                <PickupStudentCard
                  key={student.id}
                  student={student}
                  studentClass={studentClass}
                  studentPickups={studentPickups}
                  hasPickedUpToday={hasPickedUpToday}
                  openPickupModal={openPickupModal}
                  openManageAuthModal={openManageAuthModal}
                />
              );
            })}
            {filteredStudents.length === 0 && (
              <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border border-slate-200 border-dashed">
                <QrCode className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-bold text-slate-500">لا يوجد طلاب مطابقون للبحث</p>
              </div>
            )}
          </div>
        </div>

        {/* Today's Log */}
        <div className="space-y-6">
          <TodayPickupLog pickupLogs={pickupLogs} students={students} />
        </div>
      </div>

      <PickupModal
        isOpen={isPickupModalOpen}
        onClose={() => {
          setIsPickupModalOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        authorizedPickups={authorizedPickups}
        onLogPickup={handleLogPickup}
      />

      <ManageAuthModal
        isOpen={isManageAuthModalOpen}
        onClose={() => {
          setIsManageAuthModalOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        authorizedPickups={authorizedPickups}
        onAddAuth={handleAddAuthPerson}
        onDeleteAuth={triggerDeleteAuth}
      />

      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        title="حذف شخص مصرح له"
        message="هل أنت متأكد من حذف هذا الشخص المصرح له من قائمة الاستلام؟"
        onConfirm={confirmDeleteAuth}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />
    </div>
  );
};

export default SchoolSecurePickup;
