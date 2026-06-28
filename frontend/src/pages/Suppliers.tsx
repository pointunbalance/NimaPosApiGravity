import React from 'react';
import { useToast } from '../context/ToastContext';
import SuppliersList from '../components/suppliers/SuppliersList';
import SupplierDetails from '../components/suppliers/SupplierDetails';
import SupplierFormModal from '../components/suppliers/SupplierFormModal';
import SupplierPaymentModal from '../components/suppliers/SupplierPaymentModal';
import SupplierRefundModal from '../components/suppliers/SupplierRefundModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { useSuppliersData } from '../components/suppliers/useSuppliersData';
import { useSuppliersActions } from '../components/suppliers/useSuppliersActions';

const Suppliers: React.FC = () => {
  const { success, error } = useToast();
  const data = useSuppliersData();
  const actions = useSuppliersActions(
    data.selectedSupplier,
    data.setSelectedSupplier,
    data.selectedForOrder,
    success,
    error
  );

  return (
    <div className="flex h-full bg-gradient-to-tr from-sky-50/60 via-indigo-50/40 via-slate-50 to-pink-50/40 overflow-hidden font-['Tajawal'] p-4 md:p-6 gap-6 rounded-2xl">
      
      <SuppliersList 
        searchTerm={data.searchTerm}
        setSearchTerm={data.setSearchTerm}
        filterType={data.filterType}
        setFilterType={data.setFilterType}
        filteredSuppliers={data.filteredSuppliers}
        supplierStats={data.supplierStats}
        selectedSupplier={data.selectedSupplier}
        setSelectedSupplier={data.setSelectedSupplier}
        setActiveDetailTab={data.setActiveDetailTab}
        formatCurrency={data.formatCurrency}
        openModal={() => actions.openModal()}
      />

      {data.selectedSupplier && (
        <SupplierDetails 
          selectedSupplier={data.selectedSupplier}
          setSelectedSupplier={data.setSelectedSupplier}
          selectedSupplierData={data.selectedSupplierData}
          activeDetailTab={data.activeDetailTab}
          setActiveDetailTab={data.setActiveDetailTab}
          openModal={actions.openModal}
          handleDelete={(id) => actions.setSupplierToDeleteId(id)}
          setIsPaymentModalOpen={actions.setIsPaymentModalOpen}
          setIsRefundModalOpen={actions.setIsRefundModalOpen}
          formatCurrency={data.formatCurrency}
          formatDate={data.formatDate}
          selectedForOrder={data.selectedForOrder}
          toggleProductSelection={data.toggleProductSelection}
          sendWhatsAppOrder={actions.sendWhatsAppOrder}
        />
      )}

      <SupplierFormModal 
        isOpen={actions.isModalOpen}
        onClose={actions.closeModal}
        supplier={actions.editingSupplier}
        onSave={actions.handleSaveSupplier}
      />

      {data.selectedSupplier && (
        <SupplierPaymentModal 
          isOpen={actions.isPaymentModalOpen}
          closeModal={() => actions.setIsPaymentModalOpen(false)}
          selectedSupplier={data.selectedSupplier}
          handlePayment={actions.handlePayment}
          formatCurrency={data.formatCurrency}
        />
      )}

      {data.selectedSupplier && (
        <SupplierRefundModal 
          isOpen={actions.isRefundModalOpen}
          closeModal={() => actions.setIsRefundModalOpen(false)}
          selectedSupplier={data.selectedSupplier}
          handleRefund={actions.handleRefund}
          formatCurrency={data.formatCurrency}
        />
      )}

      <ConfirmModal
        isOpen={actions.supplierToDeleteId !== null}
        title="حذف المورد"
        message="هل أنت متأكد من حذف هذا المورد؟ سيتم مسح السجل نهائياً من النظام."
        onConfirm={() => {
          if (actions.supplierToDeleteId !== null) {
            actions.executeDeleteSupplier(actions.supplierToDeleteId);
          }
        }}
        onCancel={() => actions.setSupplierToDeleteId(null)}
        confirmText="نعم، احذف"
        cancelText="تراجع"
      />

    </div>
  );
};

export default Suppliers;
