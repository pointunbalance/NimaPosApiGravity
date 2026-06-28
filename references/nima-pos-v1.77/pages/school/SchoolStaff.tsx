import React from 'react';
import { UserCircle, DollarSign, FileText } from 'lucide-react';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { SchoolStaffDirectoryModal } from '../../components/school/staff/SchoolStaffDirectoryModal';
import { SchoolStaffTransactionModal } from '../../components/school/staff/SchoolStaffTransactionModal';
import { useSchoolStaff, rolesList } from '../../components/school/staff/useSchoolStaff';
import { useToast } from '../../context/ToastContext';
import { StaffDirectoryTab } from '../../components/school/staff/StaffDirectoryTab';
import { StaffTransactionsTab } from '../../components/school/staff/StaffTransactionsTab';
import { StaffPayrollTab } from '../../components/school/staff/StaffPayrollTab';

export const SchoolStaff = () => {
  const { success, error } = useToast();
  const {
    activeTab,
    setActiveTab,
    search,
    setSearch,
    selectedRole,
    setSelectedRole,
    isModalOpen,
    setIsModalOpen,
    isEdit,
    formData,
    setFormData,
    transModalOpen,
    setTransModalOpen,
    transFormData,
    setTransFormData,
    confirmState,
    setConfirmState,
    staff,
    classes,
    transactions,
    payrolls,
    filteredStaff,
    handleOpenModal,
    handleSave,
    handleSaveTrans,
    initiatePayrollGeneration,
    printSlip,
    openConfirm,
  } = useSchoolStaff();

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800">إدارة وشؤون العاملين</h1>
          <p className="text-slate-500 mt-1">البيانات الأساسية، المعاملات المالية، والرواتب</p>
        </div>
      </div>

      <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200 w-fit overflow-x-auto">
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all whitespace-nowrap ${
            activeTab === 'directory' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <UserCircle className="w-5 h-5" /> سجل الموظفين
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all whitespace-nowrap ${
            activeTab === 'transactions' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <DollarSign className="w-5 h-5" /> المكافآت والسلف والخصومات
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all whitespace-nowrap ${
            activeTab === 'payroll' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-5 h-5" /> مسير الرواتب (كشف المرتبات)
        </button>
      </div>

      {activeTab === 'directory' && (
        <StaffDirectoryTab
          filteredStaff={filteredStaff}
          classes={classes}
          search={search}
          setSearch={setSearch}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          rolesList={rolesList}
          handleOpenModal={handleOpenModal}
          openConfirm={openConfirm}
          success={success}
          error={error}
        />
      )}

      {activeTab === 'transactions' && (
        <StaffTransactionsTab
          transactions={transactions}
          staff={staff}
          setTransFormData={setTransFormData}
          setTransModalOpen={setTransModalOpen}
          openConfirm={openConfirm}
          success={success}
          error={error}
        />
      )}

      {activeTab === 'payroll' && (
        <StaffPayrollTab
          payrolls={payrolls}
          staff={staff}
          initiatePayrollGeneration={initiatePayrollGeneration}
          openConfirm={openConfirm}
          printSlip={printSlip}
          success={success}
          error={error}
        />
      )}

      <SchoolStaffDirectoryModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        isEdit={isEdit}
        formData={formData}
        setFormData={setFormData}
        handleSave={handleSave}
      />
      <SchoolStaffTransactionModal
        transModalOpen={transModalOpen}
        setTransModalOpen={setTransModalOpen}
        transFormData={transFormData}
        setTransFormData={setTransFormData}
        handleSaveTrans={handleSaveTrans}
        staff={staff}
      />

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        confirmText="تأكيد ومتابعة"
        cancelText="إلغاء وتراجع"
      />
    </div>
  );
};

export default SchoolStaff;
