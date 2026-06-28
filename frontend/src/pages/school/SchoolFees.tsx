import React from 'react';
import { 
  Plus, Search, Filter, Layers, Users 
} from 'lucide-react';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { SchoolFeeTypeModal, SchoolAssignFeeModal } from '../../components/school/fees/SchoolFeeModals';
import { useSchoolFees } from '../../components/school/fees/useSchoolFees';
import { SchoolSubscriptionsTable } from '../../components/school/fees/SchoolSubscriptionsTable';
import { SchoolFeeTypesTable } from '../../components/school/fees/SchoolFeeTypesTable';

export const SchoolFees = () => {
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    feeTypes,
    subscriptions,
    students,
    feeTypeModalOpen,
    setFeeTypeModalOpen,
    subModalOpen,
    setSubModalOpen,
    isEditMode,
    isConfirmOpen,
    setIsConfirmOpen,
    confirmTitle,
    confirmMessage,
    feeTypeForm,
    setFeeTypeForm,
    subForm,
    setSubForm,
    getStudentName,
    getFeeTypeName,
    getFeeTypePrice,
    filteredSubscriptions,
    filteredFeeTypes,
    handleSaveFeeType,
    handleSaveSubscription,
    handleDeleteSub,
    handleDeleteFeeType,
    executeConfirmedAction,
    resetFeeTypeForm,
    resetSubForm,
    openEditFeeType,
  } = useSchoolFees();

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">إدارة الرسوم المدرسية واشتراكات الطلاب</h1>
          <p className="text-slate-500 mt-1 font-medium">هيكلة الرسوم الدراسية، وإسناد الرسوم إلى الطلاب مع الترحيل المحاسبي اللحظي في الأستاذ العام</p>
        </div>
        
        <div className="flex gap-2.5">
          <button 
            onClick={() => {
              resetSubForm();
              setSubModalOpen(true);
            }}
            className="px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/15 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>إسناد رسوم لطالب</span>
          </button>
          <button 
            onClick={() => {
              resetFeeTypeForm();
              setFeeTypeModalOpen(true);
            }}
            className="px-5 py-3 bg-slate-800 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-900 transition shadow-md cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>إعداد نوع رسوم</span>
          </button>
        </div>
      </div>

      <div className="flex border-b border-slate-200 gap-1 bg-white p-1 rounded-2xl border">
        <button 
          onClick={() => {
            setActiveTab('subscriptions');
            setSearchQuery('');
          }}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm tracking-tight transition flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'subscriptions' ? 'bg-indigo-50 text-indigo-700 font-extrabold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
        >
          <Users className="w-4.5 h-4.5" />
          <span>اشتراكات الرسوم للطلاب ({subscriptions.length})</span>
        </button>
        <button 
          onClick={() => {
            setActiveTab('feetypes');
            setSearchQuery('');
          }}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm tracking-tight transition flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'feetypes' ? 'bg-indigo-50 text-indigo-700 font-extrabold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
        >
          <Layers className="w-4.5 h-4.5" />
          <span>هيكلة وباقات الرسوم الدراسية ({feeTypes.length})</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'subscriptions' ? "بحث باسم الطالب أو الرسوم الدراسية..." : "بحث باسم الرسوم..."}
            className="w-full pr-11 pl-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm text-slate-700 bg-slate-50/50"
          />
        </div>

        {activeTab === 'subscriptions' && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-bold text-sm focus:outline-none"
            >
              <option value="all">كل حالات السداد</option>
              <option value="unpaid">غير مسدد</option>
              <option value="partial">مسدد جزئي</option>
              <option value="paid">مسدد بالكامل</option>
            </select>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm/50">
        {activeTab === 'subscriptions' ? (
          <SchoolSubscriptionsTable
            filteredSubscriptions={filteredSubscriptions}
            getStudentName={getStudentName}
            getFeeTypeName={getFeeTypeName}
            handleDeleteSub={handleDeleteSub}
          />
        ) : (
          <SchoolFeeTypesTable
            filteredFeeTypes={filteredFeeTypes}
            openEditFeeType={openEditFeeType}
            handleDeleteFeeType={handleDeleteFeeType}
          />
        )}
      </div>

      <SchoolFeeTypeModal
        isOpen={feeTypeModalOpen}
        onClose={() => setFeeTypeModalOpen(false)}
        isEditMode={isEditMode}
        formData={feeTypeForm}
        setFormData={setFeeTypeForm}
        onSubmit={handleSaveFeeType}
      />
      <SchoolAssignFeeModal
        isOpen={subModalOpen}
        onClose={() => setSubModalOpen(false)}
        students={students}
        feeTypes={feeTypes}
        formData={subForm}
        setFormData={setSubForm}
        getFeeTypePrice={getFeeTypePrice}
        onSubmit={handleSaveSubscription}
      />
      <ConfirmModal
        isOpen={isConfirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        onConfirm={executeConfirmedAction}
        onCancel={() => setIsConfirmOpen(false)}
        confirmText="نعم، تنفيذ الحذف"
        cancelText="تراجع وإلغاء"
      />
    </div>
  );
};

export default SchoolFees;
