import React from 'react';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ui/ConfirmModal';
import PurchasesHeader from '../components/purchases/PurchasesHeader';
import PurchasesList from '../components/purchases/PurchasesList';
import NewPurchaseModal from '../components/purchases/NewPurchaseModal';
import ViewPurchaseModal from '../components/purchases/ViewPurchaseModal';
import { usePurchasesData } from '../components/purchases/usePurchasesData';
import { usePurchasesActions } from '../components/purchases/usePurchasesActions';

const Purchases: React.FC = () => {
  const { success, error } = useToast();
  const data = usePurchasesData();
  const actions = usePurchasesActions(
    data.suppliers,
    data.filteredPurchases,
    data.isDateClosed,
    data.dateRange,
    success,
    error
  );

  return (
    <div className="p-8 h-full overflow-y-auto bg-gradient-to-tr from-sky-50/60 via-indigo-50/40 via-slate-50 to-pink-50/40 font-['Tajawal']" dir="rtl">
      
      <PurchasesHeader 
        stats={data.stats}
        searchTerm={data.searchTerm}
        setSearchTerm={data.setSearchTerm}
        filterSupplier={data.filterSupplier}
        setFilterSupplier={data.setFilterSupplier}
        filterPaymentStatus={data.filterPaymentStatus}
        setFilterPaymentStatus={data.setFilterPaymentStatus}
        dateRange={data.dateRange}
        setDateRange={data.setDateRange}
        suppliers={data.suppliers}
        onExportCSV={actions.handleExportCSV}
        onNewPurchaseClick={() => actions.setIsModalOpen(true)}
        formatCurrency={data.formatCurrency}
      />

      <PurchasesList 
        filteredPurchases={data.filteredPurchases}
        formatCurrency={data.formatCurrency}
        formatDate={data.formatDate}
        setViewPurchase={actions.setViewPurchase}
        handleDeletePurchase={actions.handleDeletePurchase}
        loadMore={data.loadMore}
        hasMore={(data.purchases?.length || 0) < data.totalRecords}
      />

      <NewPurchaseModal 
        isOpen={actions.isModalOpen}
        closeModal={() => actions.setIsModalOpen(false)}
        products={data.products}
        suppliers={data.suppliers}
        handleSavePurchase={actions.handleSavePurchase}
        formatCurrency={data.formatCurrency}
      />

      <ViewPurchaseModal 
        purchase={actions.viewPurchase}
        onClose={() => actions.setViewPurchase(null)}
        formatCurrency={data.formatCurrency}
        formatDate={data.formatDate}
      />

      <ConfirmModal 
        isOpen={actions.isConfirmOpen}
        title="تأكيد حذف الفاتورة"
        message="هل أنت متأكد من رغبتك في حذف فاتورة المشتريات هذه؟ سيتم التراجع تلقائياً عن كميات المخزن والسيريال المضافة لضمان سلامة بيانات المخزون."
        onConfirm={actions.executeDeletePurchase}
        onCancel={() => {
          actions.setIsConfirmOpen(false);
          actions.setPurchaseToDeleteId(null);
        }}
        confirmText="نعم، احذف"
        cancelText="تراجع"
      />

    </div>
  );
};

export default Purchases;
