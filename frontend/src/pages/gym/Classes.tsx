import React from 'react';
import { 
  Plus, 
  Search, 
  CheckCircle,
  AlertCircle,
  Users
} from 'lucide-react';

import ConfirmModal from '../../components/ui/ConfirmModal';
import { CATEGORIES_OPTIONS } from '../../components/gym/types';
import { useClassesState } from '../../components/gym/useClassesState';
import { ClassesMetrics } from '../../components/gym/ClassesMetrics';
import { ClassesTabGrid } from '../../components/gym/ClassesTabGrid';
import { ClassesTabEnroll } from '../../components/gym/ClassesTabEnroll';
import { ClassesTabList } from '../../components/gym/ClassesTabList';
import { ClassesModals } from '../../components/gym/ClassesModals';

export const Classes = () => {
  const {
    activeTab,
    setActiveTab,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    isModalOpen,
    setIsModalOpen,
    isEdit,
    isTrainerModalOpen,
    setIsTrainerModalOpen,
    trainerNameInput,
    setTrainerNameInput,
    trainerPhoneInput,
    setTrainerPhoneInput,
    trainerSpecInput,
    setTrainerSpecInput,
    showNotification,
    isDeleteOpen,
    setIsDeleteOpen,
    setDeleteId,
    selectedClassForEnroll,
    setSelectedClassForEnroll,
    selectedMemberId,
    setSelectedMemberId,
    isPaidEnroll,
    setIsPaidEnroll,
    enrollPaymentMethod,
    setEnrollPaymentMethod,
    currency,
    originalClasses,
    trainers,
    members,
    filteredRecords,
    metrics,
    classForm,
    setClassForm,
    handleOpenClassModal,
    handleQuickAddTrainer,
    handleSaveClass,
    askDelete,
    confirmDelete,
    activeClassData,
    handleEnrollMember,
    handleCancelEnrollment
  } = useClassesState();

  return (
    <div className="p-6 space-y-7 bg-slate-50/50 min-h-screen font-sans text-right" dir="rtl">
      {/* Toast notifications */}
      {showNotification && (
        <div className="fixed top-24 left-6 z-50 animate-bounce duration-1000">
          <div className={`p-4 rounded-2xl shadow-xl flex items-center gap-3 border ${
            showNotification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            showNotification.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
            'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {showNotification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-xs font-black">{showNotification.text}</span>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex-row-reverse">
        <button 
          onClick={() => handleOpenClassModal(false)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>جدولة تمرين / حصة جديدة</span>
        </button>

        <div className="text-right">
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2 justify-start flex-row-reverse">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>إدارة الحصص والأنشطة الجماعية</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            مراجعة جداول التمارين، تعيين الكباتن والمدربين، وتوثيق حضور الأعضاء المشتركين بمختلف الصالات.
          </p>
        </div>
      </div>

      {/* Metrics board component */}
      <ClassesMetrics metrics={metrics} currency={currency} />

      {/* Search & Tabs Filter bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 flex-row-reverse">
          {/* Quick filters */}
          <div className="flex flex-wrap items-center gap-2.5 flex-row-reverse">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ابحث بالحصة، المدرب، الصالة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-60 pr-8 pl-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold text-right"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold focus:outline-none text-right"
            >
              <option value="all">📁 جميع التصنيفات</option>
              {CATEGORIES_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold focus:outline-none text-right"
            >
              <option value="all">⚡ جميع الحالات</option>
              <option value="نشطة">🟢 نشطة فقط</option>
              <option value="معلقة">🔴 معلقة حالياً</option>
            </select>

            {(search || categoryFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                }}
                className="text-[11px] font-black text-rose-600 hover:underline"
              >
                تصفير المصفاة
              </button>
            )}
          </div>

          {/* Tab buttons */}
          <div className="flex bg-slate-100 p-1 rounded-xl items-center gap-1 max-w-sm flex-row-reverse">
            <button
              onClick={() => setActiveTab('grid')}
              className={`flex-1 text-center py-2 px-4 rounded-lg font-black text-xs transition-all ${
                activeTab === 'grid' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              📊 لوحة البطاقات
            </button>
            <button
              onClick={() => setActiveTab('enroll')}
              className={`flex-1 text-center py-2 px-4 rounded-lg font-black text-xs transition-all ${
                activeTab === 'enroll' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              📝 مكتب الحضور والحجز
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex-1 text-center py-2 px-4 rounded-lg font-black text-xs transition-all ${
                activeTab === 'list' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              📋 القائمة التقنية
            </button>
          </div>
        </div>
      </div>

      {/* Multi-view tab content */}
      {activeTab === 'grid' && (
        <ClassesTabGrid
          filteredRecords={filteredRecords}
          currency={currency}
          onSelectClass={(id) => {
            setSelectedClassForEnroll(id);
            setActiveTab('enroll');
          }}
          onEditClass={(item) => handleOpenClassModal(true, item)}
          onDeleteClass={askDelete}
        />
      )}

      {activeTab === 'enroll' && (
        <ClassesTabEnroll
          originalClasses={originalClasses}
          selectedClassForEnroll={selectedClassForEnroll}
          onSelectClassForEnroll={setSelectedClassForEnroll}
          activeClassData={activeClassData}
          members={members}
          selectedMemberId={selectedMemberId}
          setSelectedMemberId={setSelectedMemberId}
          isPaidEnroll={isPaidEnroll}
          setIsPaidEnroll={setIsPaidEnroll}
          enrollPaymentMethod={enrollPaymentMethod}
          setEnrollPaymentMethod={setEnrollPaymentMethod}
          onEnrollMember={handleEnrollMember}
          onCancelEnrollment={handleCancelEnrollment}
          currency={currency}
        />
      )}

      {activeTab === 'list' && (
        <ClassesTabList
          filteredRecords={filteredRecords}
          originalClasses={originalClasses}
          currency={currency}
          onEditClass={(item) => handleOpenClassModal(true, item)}
          onDeleteClass={askDelete}
        />
      )}

      {/* Main Form Modals & Nesting Popups */}
      <ClassesModals
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        isEdit={isEdit}
        classForm={classForm}
        setClassForm={setClassForm}
        trainers={trainers}
        currency={currency}
        onSaveClass={handleSaveClass}
        isTrainerModalOpen={isTrainerModalOpen}
        setIsTrainerModalOpen={setIsTrainerModalOpen}
        trainerNameInput={trainerNameInput}
        setTrainerNameInput={setTrainerNameInput}
        trainerSpecInput={trainerSpecInput}
        setTrainerSpecInput={setTrainerSpecInput}
        trainerPhoneInput={trainerPhoneInput}
        setTrainerPhoneInput={setTrainerPhoneInput}
        onQuickAddTrainer={handleQuickAddTrainer}
      />

      {/* Delete confirmation modal */}
      <ConfirmModal 
        isOpen={isDeleteOpen}
        title="تأكيد حذف الحصة المجدولة"
        message="هل أنت متأكد من رغبتك في مسح وإلغاء هذه الحصة الرياضية الجماعية نهائياً؟ هذا الإجراء غير قابل للتراجع وسيحذف الحصة وكافة بيانات المتدربين المسجلين بها."
        confirmText="تأكيد الحذف النهائي"
        cancelText="تراجع وإبقاء الجدول"
        onConfirm={confirmDelete}
        onCancel={() => {
          setIsDeleteOpen(false);
          setDeleteId(null);
        }}
      />
    </div>
  );
};
