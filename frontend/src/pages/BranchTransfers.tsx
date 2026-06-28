import React from 'react';
import { useToast } from '../context/ToastContext';
import { useBranchTransfersState } from '../components/branch-transfers/useBranchTransfersState';

import BranchTransfersHeader from '../components/branch-transfers/BranchTransfersHeader';
import BranchTransfersList from '../components/branch-transfers/BranchTransfersList';
import NewTransferModal from '../components/branch-transfers/NewTransferModal';
import ViewTransferModal from '../components/branch-transfers/ViewTransferModal';

const BranchTransfers: React.FC = () => {
  const { success, error: showError } = useToast();

  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    isNewModalOpen,
    setIsNewModalOpen,
    isViewModalOpen,
    setIsViewModalOpen,
    selectedTransfer,
    setSelectedTransfer,
    sourceId,
    setSourceId,
    destinationId,
    setDestinationId,
    transferItems,
    setTransferItems,
    notes,
    setNotes,
    selectedProductId,
    setSelectedProductId,
    selectedQty,
    setSelectedQty,
    filteredTransfers,
    warehouses,
    availableProductsForTransfer,
    selectedProductMaxQty,
    handleAddItem,
    handleRemoveItem,
    resetForm,
    handleCreateTransfer,
    handleStatusChange,
    getWarehouseName,
  } = useBranchTransfersState(success, showError);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] font-sans">
      <BranchTransfersHeader 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onNewTransferClick={() => { resetForm(); setIsNewModalOpen(true); }}
      />

      <BranchTransfersList 
        filteredTransfers={filteredTransfers}
        getWarehouseName={getWarehouseName}
        onViewTransfer={(transfer) => { setSelectedTransfer(transfer); setIsViewModalOpen(true); }}
      />

      <NewTransferModal 
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        warehouses={warehouses}
        sourceId={sourceId}
        setSourceId={setSourceId}
        destinationId={destinationId}
        setDestinationId={setDestinationId}
        transferItems={transferItems}
        setTransferItems={setTransferItems}
        notes={notes}
        setNotes={setNotes}
        selectedProductId={selectedProductId}
        setSelectedProductId={setSelectedProductId}
        selectedQty={selectedQty}
        setSelectedQty={setSelectedQty}
        availableProductsForTransfer={availableProductsForTransfer}
        selectedProductMaxQty={selectedProductMaxQty}
        handleAddItem={handleAddItem}
        handleRemoveItem={handleRemoveItem}
        handleCreateTransfer={handleCreateTransfer}
      />

      <ViewTransferModal 
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        selectedTransfer={selectedTransfer}
        getWarehouseName={getWarehouseName}
        handleStatusChange={handleStatusChange}
      />
    </div>
  );
};

export default BranchTransfers;
