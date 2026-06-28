import React from 'react';
import { useStudents } from '../../components/school/students/useStudents';
import { SchoolStudentModal } from '../../components/school/students/SchoolStudentModal';
import { useToast } from '../../context/ToastContext';
import { db } from '../../db';
import { logActivity } from '../../utils/logger';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { StudentsHeader, StudentsFilters, StudentsTable } from '../../components/school/students/StudentsListComponents';

export const Students = () => {
  const { success } = useToast();
  const {
    search,
    setSearch,
    isModalOpen,
    setIsModalOpen,
    activeTab,
    setActiveTab,
    selectedChildId,
    confirmOpen,
    setConfirmOpen,
    confirmParams,
    requestConfirmation,
    filterLevel,
    setFilterLevel,
    filterClass,
    setFilterClass,
    filterStatus,
    setFilterStatus,
    levels,
    classesList,
    guardians,
    childNotes,
    setChildNotes,
    subForm,
    setSubForm,
    paymentForm,
    setPaymentForm,
    evalForm,
    setEvalForm,
    formData,
    setFormData,
    medicalForm,
    setMedicalForm,
    behavioralForm,
    setBehavioralForm,
    parentsForm,
    setParentsForm,
    checklistForm,
    setChecklistForm,
    guardianId,
    setGuardianId,
    newPickup,
    setNewPickup,
    handleSaveMedical,
    handleSaveParents,
    handleSaveBehavioral,
    handleSaveChecklist,
    handleOpenProfile,
    handleClose,
    handleSaveInfo,
    handleLinkGuardian,
    handleAddPickup,
    handleRemovePickup,
    handleAddSubscription,
    handleAddPayment,
    handleAddEvaluation,
    handleSaveNotes,
    filteredChildren
  } = useStudents();

  const handleExportList = () => {
    const headers = "الكود,الاسم,المستوى,الفصل,الحالة\n";
    const rows = filteredChildren.map(c => {
      const lvl = levels.find(l => l.id === c.levelId)?.name || '-';
      const cls = classesList.find(cl => cl.id === c.classroomId)?.name || '-';
      return `"${c.code || ''}","${c.name || ''}","${lvl}","${cls}","${c.status || ''}"`;
    }).join("\n");
    
    const blob = new Blob(["\ufeff" + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `students_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintList = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <StudentsHeader
        onExportList={handleExportList}
        onPrintList={handlePrintList}
        onAddStudent={() => handleOpenProfile(null)}
      />

      {/* Filters & Search */}
      <StudentsFilters
        search={search}
        onSearchChange={setSearch}
        filterLevel={filterLevel}
        onFilterLevelChange={setFilterLevel}
        filterClass={filterClass}
        onFilterClassChange={setFilterClass}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        levels={levels}
        classesList={classesList}
      />

      {/* Children Table */}
      <StudentsTable
        filteredChildren={filteredChildren}
        levels={levels}
        classesList={classesList}
        guardians={guardians}
        search={search}
        onEdit={handleOpenProfile}
        onArchive={(id, name) => {
          requestConfirmation(
            "أرشفة الطفل",
            `هل تريد أرشفة هذا الطفل (${name})؟ (لن يتم حذفه نهائياً)`,
            async () => {
              await db.schoolStudents.update(id, { status: 'منسحب' });
              const childData = await db.schoolStudents.get(id);
              const userStr = localStorage.getItem('nima_user');
              const currentUser = userStr ? JSON.parse(userStr) : { name: 'System' };
              if (childData) {
                await db.recycleBin.add({
                  originalTable: 'schoolStudents',
                  originalId: id,
                  deletedAt: Date.now(),
                  summary: name,
                  data: {
                    ...childData,
                    _deletedBy: currentUser.name || 'System',
                    _reason: 'أرشفة الطفل - بناء على طلب المستخدم'
                  }
                });
              }
              await logActivity('students', 'أرشفة', `تم أرشفة الطفل ${name}`, undefined, id);
              success("تم أرشفة الطفل بنجاح.");
            }
          );
        }}
      />

      {/* Child Profile Modal */}
      <SchoolStudentModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        handleSaveStudent={handleSaveInfo}
        studentFormData={formData}
        setStudentFormData={setFormData}
        parentsForm={parentsForm}
        setParentsForm={setParentsForm}
        handleSaveParents={handleSaveParents}
        levels={levels}
        filteredClassesForSelect={classesList}
        parents={guardians}
        handleClose={handleClose}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleSaveInfo={handleSaveInfo}
        guardianId={guardianId}
        setGuardianId={setGuardianId}
        guardians={guardians}
        handleLinkGuardian={handleLinkGuardian}
        newPickup={newPickup}
        setNewPickup={setNewPickup}
        handleAddPickup={handleAddPickup}
        handleRemovePickup={handleRemovePickup}
        selectedChildId={selectedChildId}
        medicalForm={medicalForm}
        setMedicalForm={setMedicalForm}
        handleSaveMedical={handleSaveMedical}
        behavioralForm={behavioralForm}
        setBehavioralForm={setBehavioralForm}
        handleSaveBehavioral={handleSaveBehavioral}
        checklistForm={checklistForm}
        setChecklistForm={setChecklistForm}
        handleSaveChecklist={handleSaveChecklist}
        childNotes={childNotes}
        setChildNotes={setChildNotes}
        handleSaveNotes={handleSaveNotes}
        handleAddSubscription={handleAddSubscription}
        subForm={subForm}
        setSubForm={setSubForm}
        paymentForm={paymentForm}
        setPaymentForm={setPaymentForm}
        handleAddPayment={handleAddPayment}
        evalForm={evalForm}
        setEvalForm={setEvalForm}
        handleAddEvaluation={handleAddEvaluation}
      />

      <ConfirmModal
        isOpen={confirmOpen}
        title={confirmParams?.title || ""}
        message={confirmParams?.message || ""}
        onConfirm={confirmParams?.onConfirm || (() => {})}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default Students;
