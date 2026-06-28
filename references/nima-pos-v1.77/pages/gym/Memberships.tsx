import React from 'react';
import { 
  Award, 
  Activity, 
  Settings 
} from 'lucide-react';

import ConfirmModal from '../../components/ui/ConfirmModal';

// Modular Imports
import { useMembershipsState } from '../../components/gym/useMembershipsState';
import { MembershipsMetrics } from '../../components/gym/MembershipsMetrics';
import { MembershipsTabRecords } from '../../components/gym/MembershipsTabRecords';
import { MembershipsTabPlans } from '../../components/gym/MembershipsTabPlans';
import { MembershipsFormModal } from '../../components/gym/MembershipsFormModal';
import { MembershipsPlanModal } from '../../components/gym/MembershipsPlanModal';

export const Memberships = () => {
  const {
    activeTab,
    setActiveTab,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    isModalOpen,
    setIsModalOpen,
    isEdit,
    isPlanModalOpen,
    setIsPlanModalOpen,
    isPlanEdit,
    showDeleteConfirm,
    setShowDeleteConfirm,
    showPlanDeleteConfirm,
    setShowPlanDeleteConfirm,
    plansList,
    planFormData,
    setPlanFormData,
    formData,
    setFormData,
    currency,
    records,
    isExpiringSoon,
    metrics,
    handlePresetChange,
    handleStartDateChange,
    filteredRecords,
    handleOpenModal,
    handleSave,
    askDelete,
    confirmDelete,
    handleOpenPlanModal,
    handleSavePlan,
    askDeletePlan,
    confirmDeletePlan
  } = useMembershipsState();

  return (
    <div className="p-6 space-y-7 bg-slate-50/50 min-h-screen font-sans text-right" dir="rtl">
      
      {/* Header Block with navigation tabs */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex-row-reverse">
        {/* Dynamic Navigation Tab Selector */}
        <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-xl border border-slate-200/50 w-full lg:w-auto flex-row-reverse">
          <button
            onClick={() => setActiveTab('records')}
            className={`flex-1 lg:flex-none px-4 py-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'records' 
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/40' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>إدارة الاشتراكات والتنسيق</span>
          </button>
          
          <button
            onClick={() => setActiveTab('plans')}
            className={`flex-1 lg:flex-none px-4 py-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'plans' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>التحكم في أحجام وأسعار الباقات (الأساسية)</span>
          </button>
        </div>

        <div>
          <div className="flex items-center gap-2 justify-start flex-row-reverse">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Award className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">نظام إدارة باقات واشتراكات النادي الرياضي</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            التحكم في أحجام وأسعار الباقات، رصد المشتركين، تواريخ الصلاحية وتسهيل المدفوعات محلياً.
          </p>
        </div>
      </div>

      {/* Conditionally Render Content based on selection tab */}
      {activeTab === 'records' ? (
        <>
          {/* Section 1: Memberships Grid Metrics */}
          <MembershipsMetrics metrics={metrics} currency={currency} />

          {/* Section 2: Members table with advanced filtering */}
          <MembershipsTabRecords
            records={records}
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            filteredRecords={filteredRecords}
            isExpiringSoon={isExpiringSoon}
            currency={currency}
            onOpenModal={handleOpenModal}
            onAskDelete={askDelete}
          />
        </>
      ) : (
        /* Dynamic customizable plans sizes panel */
        <MembershipsTabPlans
          plansList={plansList}
          currency={currency}
          onOpenPlanModal={handleOpenPlanModal}
          onAskDeletePlan={askDeletePlan}
        />
      )}

      {/* Subscription Form Modal */}
      <MembershipsFormModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        isEdit={isEdit}
        formData={formData}
        setFormData={setFormData}
        plansList={plansList}
        currency={currency}
        onPresetChange={handlePresetChange}
        onStartDateChange={handleStartDateChange}
        onSave={handleSave}
      />

      {/* Customizable Plan Creation Modal */}
      <MembershipsPlanModal
        isPlanModalOpen={isPlanModalOpen}
        setIsPlanModalOpen={setIsPlanModalOpen}
        isPlanEdit={isPlanEdit}
        planFormData={planFormData}
        setPlanFormData={setPlanFormData}
        currency={currency}
        onSavePlan={handleSavePlan}
      />

      {/* Subscription Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="تأكيد حذف بيانات المشترك"
        message="هل أنت بالتأكيد بحاجة لإزالة وثيقة اشتراك هذا العضو؟ لن تتمكن من استرجاع البيانات المحذوفة نهائياً بعد الإتمام."
        confirmText="نعم، احذف نهائياً"
        cancelText="تراجع وإلغاء"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Custom Plan / Preset Package Delete Confirmation */}
      <ConfirmModal
        isOpen={showPlanDeleteConfirm}
        title="حذف حجم/باقة مجهزة مسبقاً"
        message="هل تريد إزالة هذا القالب أو الحجم نهائياً؟ هذا لن يؤثر على الاشتراكات النشطة الحالية المسجلة بها، ولكنه سيزيلها من قائمة الخيارات الذكية والسريعة."
        confirmText="نعم، احذف القالب"
        cancelText="إلغاء السحب"
        onConfirm={confirmDeletePlan}
        onCancel={() => setShowPlanDeleteConfirm(false)}
      />

    </div>
  );
};
export default Memberships;
