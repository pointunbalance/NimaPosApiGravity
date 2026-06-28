import React from 'react';
import { Store, CheckCircle, Plus } from 'lucide-react';
import { useSchoolSuppliers, CATEGORIES } from '../../components/school/suppliers/useSchoolSuppliers';
import { SupplierSidebar } from '../../components/school/suppliers/SupplierSidebar';
import { SupplierDetailPanel } from '../../components/school/suppliers/SupplierDetailPanel';
import { CreateSupplierModal } from '../../components/school/suppliers/CreateSupplierModal';

export const SchoolSuppliers = () => {
  const {
    isCreateModalOpen,
    setIsCreateModalOpen,
    selectedSupplier,
    setSelectedSupplier,
    activeTab,
    setActiveTab,
    filterCategory,
    setFilterCategory,
    searchQuery,
    setSearchQuery,
    form,
    setForm,
    paymentForm,
    setPaymentForm,
    handleCreate,
    handleAddPayment,
    filteredSuppliers,
    getCategoryLabel,
    getSupplierInvoices,
    getSupplierPayments,
    successMessage,
  } = useSchoolSuppliers();

  return (
    <div className="p-6" dir="rtl">
      {/* Toast Notification */}
      {successMessage && (
        <div className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-100 p-3 rounded-2xl">
            <Store className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800">الموردين</h1>
            <p className="text-slate-500 font-medium">إدارة بيانات الموردين، الحسابات، الدفعات، الفواتير</p>
          </div>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition shadow-sm shadow-emerald-200 cursor-pointer"
        >
          <Plus className="w-5 h-5" /> إضافة مورد جديد
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Suppliers List Sidebar */}
        <SupplierSidebar
          filteredSuppliers={filteredSuppliers}
          selectedSupplier={selectedSupplier}
          setSelectedSupplier={setSelectedSupplier}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          getCategoryLabel={getCategoryLabel}
          categories={CATEGORIES}
          setActiveTab={setActiveTab}
        />

        {/* Selected Supplier Details Panel */}
        <div className="lg:col-span-2">
          <SupplierDetailPanel
            selectedSupplier={selectedSupplier}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            getSupplierInvoices={getSupplierInvoices}
            getSupplierPayments={getSupplierPayments}
            paymentForm={paymentForm}
            setPaymentForm={setPaymentForm}
            handleAddPayment={handleAddPayment}
          />
        </div>
      </div>

      {/* Create Supplier Modal */}
      <CreateSupplierModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        form={form}
        setForm={setForm}
        handleCreate={handleCreate}
        categories={CATEGORIES}
      />
    </div>
  );
};

export default SchoolSuppliers;
