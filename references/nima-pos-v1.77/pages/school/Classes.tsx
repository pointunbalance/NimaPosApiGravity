import React from 'react';
import { Plus, Search, Layers, Users } from 'lucide-react';
import { LevelModal } from '../../components/school/classes/LevelModal';
import { ClassModal } from '../../components/school/classes/ClassModal';
import { ClassProfileModal } from '../../components/school/classes/ClassProfileModal';
import { ClassTransferModal } from '../../components/school/classes/ClassTransferModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useClasses } from '../../components/school/classes/useClasses';
import { LevelsTable } from '../../components/school/classes/LevelsTable';
import { ClassesTable } from '../../components/school/classes/ClassesTable';

export const Classes = () => {
  const {
    activeTab,
    setActiveTab,
    search,
    setSearch,
    isLevelModalOpen,
    setIsLevelModalOpen,
    isClassModalOpen,
    setIsClassModalOpen,
    isEdit,
    isClassProfileOpen,
    setIsClassProfileOpen,
    profileTab,
    setProfileTab,
    transferModalOpen,
    setTransferModalOpen,
    selectedStudentsToTransfer,
    transferTargetClass,
    setTransferTargetClass,
    isConfirmOpen,
    setIsConfirmOpen,
    confirmConfig,
    levelFormData,
    setLevelFormData,
    classFormData,
    setClassFormData,
    levels,
    classesList,
    filteredLevels,
    filteredClasses,
    handleOpenLevelModal,
    handleOpenClassModal,
    handleSaveLevel,
    handleSaveClass,
    handleDeleteLevel,
    handleDeleteClass,
    getClassStudentsCount,
    getLevelName,
    handleOpenClassProfile,
    selectedClass,
    classStudents,
    selectedLevel,
    toggleStudentSelection,
    handleSelectAllStudents,
    executeTransfer,
    handlePromoteStudents
  } = useClasses();

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">إدارة الفصول والمستويات</h1>
          <p className="text-slate-500 mt-1">إعداد الهيكل الأكاديمي للحضانة</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'levels' ? (
            <button 
              onClick={() => handleOpenLevelModal(false)}
              className="bg-brand-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-brand-700 font-bold shadow-sm transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>إضافة مستوى جديد</span>
            </button>
          ) : (
            <button 
              onClick={() => handleOpenClassModal(false)}
              className="bg-brand-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-brand-700 font-bold shadow-sm transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>إضافة فصل جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Custom Tabs */}
      <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200 w-fit">
        <button
          onClick={() => setActiveTab('levels')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${
            activeTab === 'levels' 
            ? 'bg-brand-50 text-brand-700' 
            : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-5 h-5" />
          المستويات التعليمية
        </button>
        <button
          onClick={() => setActiveTab('classes')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${
            activeTab === 'classes' 
            ? 'bg-brand-50 text-brand-700' 
            : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Users className="w-5 h-5" />
          الفصول الدراسية
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 bg-slate-50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`بحث في ${activeTab === 'levels' ? 'المستويات' : 'الفصول'}...`}
              className="w-full pr-10 pl-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium"
            />
          </div>
        </div>
        
        {activeTab === 'levels' && (
          <LevelsTable
            filteredLevels={filteredLevels}
            classesList={classesList}
            handlePromoteStudents={handlePromoteStudents}
            handleOpenLevelModal={handleOpenLevelModal}
            handleDeleteLevel={handleDeleteLevel}
          />
        )}

        {activeTab === 'classes' && (
          <ClassesTable
            filteredClasses={filteredClasses}
            getClassStudentsCount={getClassStudentsCount}
            getLevelName={getLevelName}
            handleOpenClassProfile={handleOpenClassProfile}
            handleOpenClassModal={handleOpenClassModal}
            handleDeleteClass={handleDeleteClass}
          />
        )}
      </div>

      <LevelModal 
        isLevelModalOpen={isLevelModalOpen} setIsLevelModalOpen={setIsLevelModalOpen}
        handleSaveLevel={handleSaveLevel} levelForm={levelFormData} setLevelForm={setLevelFormData} isEdit={isEdit}
      />
      
      <ClassModal 
        isClassModalOpen={isClassModalOpen} setIsClassModalOpen={setIsClassModalOpen}
        handleSaveClass={handleSaveClass} classForm={classFormData} setClassForm={setClassFormData}
        levelsList={levels} teachersList={[]} isEdit={isEdit}
      />
      
      <ClassProfileModal 
        isClassProfileOpen={isClassProfileOpen} setIsClassProfileOpen={setIsClassProfileOpen}
        selectedClass={selectedClass} classStudents={classStudents} selectedLevel={selectedLevel}
        setTransferModalOpen={setTransferModalOpen}
        profileTab={profileTab} setProfileTab={setProfileTab}
      />
      
      <ClassTransferModal 
        transferModalOpen={transferModalOpen} setTransferModalOpen={setTransferModalOpen}
        executeTransfer={executeTransfer} transferTargetClass={transferTargetClass}
        setTransferTargetClass={setTransferTargetClass} classesList={classesList} selectedClassId={selectedClass?.id}
        selectedClass={selectedClass} classStudents={classStudents} selectedStudentsToTransfer={selectedStudentsToTransfer}
        handleSelectAllStudents={handleSelectAllStudents} toggleStudentSelection={toggleStudentSelection}
        getLevelName={getLevelName} getClassStudentsCount={getClassStudentsCount}
      />

      <ConfirmModal
        isOpen={isConfirmOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
};

export default Classes;
