import React, { useState } from 'react';
import InvoiceModal from '../components/InvoiceModal';
import { useToast } from '../context/ToastContext';

import { 
  calculateLoyaltyPoints, 
  openWhatsApp, 
  handleExportCustomers, 
  handleImportCustomers 
} from '../components/customers/customerHelpers';
import { useCustomersData } from '../components/customers/useCustomersData';
import { useCustomerProfile } from '../components/customers/useCustomerProfile';
import { useCustomerActions } from '../components/customers/useCustomerActions';

import CustomersHeader from '../components/customers/CustomersHeader';
import CustomersList from '../components/customers/CustomersList';
import CustomerProfile from '../components/customers/CustomerProfile';
import CustomerFormModal from '../components/customers/CustomerFormModal';
import CustomerPaymentModal from '../components/customers/CustomerPaymentModal';
import { CustomerSettingsModal } from '../components/customers/CustomerSettingsModal';
import ConfirmModal from '../components/ui/ConfirmModal';

const Customers: React.FC = () => {
  const { success, error } = useToast();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  const {
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    sortBy,
    setSortBy,
    customers,
    settings,
    currencyCode,
    getCustomerStatus,
    filteredCustomers,
    stats,
  } = useCustomersData();

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(amount);

  const {
    selectedProfile,
    setSelectedProfile,
    activeTab,
    setActiveTab,
    profileOrders,
    setProfileOrders,
    profileB2BInvoices,
    setProfileB2BInvoices,
    profilePayments,
    setProfilePayments,
    profileLoyalty,
    setProfileLoyalty,
    viewOrder,
    setViewOrder,
    selectedInvoiceIds,
    setSelectedInvoiceIds,
    customerInsights,
    handleOpenProfile,
    toggleInvoiceSelection,
    selectAllInvoices,
    handlePrintSelected,
    handlePrintStatement
  } = useCustomerProfile(settings, currencyCode, formatCurrency);

  const {
    isModalOpen,
    editingCustomer,
    openModal,
    closeModal,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    paymentType,
    paymentAmount,
    setPaymentAmount,
    paymentNote,
    setPaymentNote,
    quickPayTarget,
    setQuickPayTarget,
    openPaymentModal,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    deleteCustomer,
    executeDeleteCustomer,
    setCustomerToDeleteId,
    handleProcessPayment,
    handleSaveCustomer
  } = useCustomerActions(
    settings,
    selectedProfile,
    setSelectedProfile,
    setProfilePayments,
    success,
    error,
    formatCurrency
  );

  const formatDate = (date: Date) => new Intl.DateTimeFormat('ar-EG', { 
      day: 'numeric', month: 'long', year: 'numeric' 
  }).format(new Date(date));

  const handleExport = () => handleExportCustomers(success, error);
  const handleImport = (file: File) => handleImportCustomers(file, success, error);

  return (
    <div className="flex h-full bg-gradient-to-tr from-sky-50/60 via-indigo-50/40 via-slate-50 to-pink-50/40 overflow-hidden font-['Tajawal'] p-4 md:p-6 gap-6 rounded-2xl">
      
      {/* LEFT: Main List */}
      <div className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ${selectedProfile ? 'w-[40%] hidden xl:flex' : 'w-full'}`}>
          <CustomersHeader
            stats={stats}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            viewMode={viewMode}
            setViewMode={setViewMode}
            filterType={filterType}
            setFilterType={setFilterType}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onOpenModal={() => openModal()}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            formatCurrency={formatCurrency}
            onExport={handleExport}
            onImport={handleImport}
          />

          <CustomersList
            viewMode={viewMode}
            filteredCustomers={filteredCustomers}
            selectedProfileId={selectedProfile?.id}
            showCreditBalance={settings?.customerSettings?.showCreditBalance ?? true}
            onOpenProfile={handleOpenProfile}
            onOpenPaymentModal={openPaymentModal}
            onOpenWhatsApp={openWhatsApp}
            getCustomerStatus={getCustomerStatus}
            formatCurrency={formatCurrency}
          />
      </div>

      {/* RIGHT: Detailed Profile (Drawer) */}
      {selectedProfile && (
          <CustomerProfile
            selectedProfile={selectedProfile}
            profileOrders={profileOrders}
            profileB2BInvoices={profileB2BInvoices}
            profilePayments={profilePayments}
            profileLoyalty={profileLoyalty}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onCloseProfile={() => setSelectedProfile(null)}
            onEditProfile={openModal}
            onOpenPaymentModal={openPaymentModal}
            onOpenWhatsApp={openWhatsApp}
            getCustomerStatus={getCustomerStatus}
            calculateLoyaltyPoints={calculateLoyaltyPoints}
            customerInsights={customerInsights}
            selectedInvoiceIds={selectedInvoiceIds}
            toggleInvoiceSelection={toggleInvoiceSelection}
            selectAllInvoices={selectAllInvoices}
            handlePrintSelected={handlePrintSelected}
            setViewOrder={setViewOrder}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
      )}

      {/* Modals */}
      <CustomerFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        customer={editingCustomer}
        onSave={handleSaveCustomer}
        onDelete={deleteCustomer}
      />

      <CustomerPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => { setIsPaymentModalOpen(false); setQuickPayTarget(null); }}
        paymentType={paymentType}
        targetCustomer={quickPayTarget || selectedProfile}
        paymentAmount={paymentAmount}
        setPaymentAmount={setPaymentAmount}
        paymentNote={paymentNote}
        setPaymentNote={setPaymentNote}
        onProcessPayment={handleProcessPayment}
      />

      <CustomerSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      {/* Invoice Detail Modal */}
      {viewOrder && (
          <InvoiceModal 
              order={viewOrder} 
              settings={settings}
              customer={selectedProfile || undefined}
              onClose={() => setViewOrder(null)} 
          />
      )}

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        title="حذف العميل وسجلاته"
        message="هل أنت متأكد من رغبتك في حذف هذا العميل؟ سيؤدي ذلك إلى حذف سجل العميل وكافة البيانات المرتبطة به بشكل نهائي."
        onConfirm={executeDeleteCustomer}
        onCancel={() => {
          setIsDeleteConfirmOpen(false);
          setCustomerToDeleteId(null);
        }}
        confirmText="نعم، احذف"
        cancelText="تراجع"
      />

    </div>
  );
};

export default Customers;
