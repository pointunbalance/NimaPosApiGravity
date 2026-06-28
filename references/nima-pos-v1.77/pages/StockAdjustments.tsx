import React from 'react';
import { useToast } from '../context/ToastContext';
import StockAdjustmentsHeader from '../components/stock-adjustments/StockAdjustmentsHeader';
import StockAdjustmentsList from '../components/stock-adjustments/StockAdjustmentsList';
import NewAdjustmentModal from '../components/stock-adjustments/NewAdjustmentModal';
import { useStockAdjustmentsData } from '../components/stock-adjustments/useStockAdjustmentsData';
import { useStockAdjustmentsActions, getReasonConfig } from '../components/stock-adjustments/useStockAdjustmentsActions';

const StockAdjustments: React.FC = () => {
  const { success, error } = useToast();
  const data = useStockAdjustmentsData(true);
  
  const actions = useStockAdjustmentsActions(
    data.products,
    data.warehouses,
    data.selectedWarehouseId,
    data.setSelectedWarehouseId,
    data.selectedProductId,
    data.setSelectedProductId,
    data.currentLineStock,
    data.filteredAdjustments,
    success,
    error
  );

  return (
    <div className="p-8 h-full overflow-y-auto bg-gray-50/50 font-['Tajawal']">
      
      <StockAdjustmentsHeader 
        stats={data.stats}
        searchTerm={data.searchTerm}
        setSearchTerm={data.setSearchTerm}
        filterWarehouse={data.filterWarehouse}
        setFilterWarehouse={data.setFilterWarehouse}
        filterReason={data.filterReason}
        setFilterReason={data.setFilterReason}
        dateRange={data.dateRange}
        setDateRange={data.setDateRange}
        warehouses={data.warehouses}
        onExportCSV={actions.handleExportCSV}
        onNewSessionClick={() => actions.setIsModalOpen(true)}
        formatCurrency={data.formatCurrency}
      />

      <StockAdjustmentsList 
        filteredAdjustments={data.filteredAdjustments}
        productMap={data.productMap}
        formatCurrency={data.formatCurrency}
        formatDate={data.formatDate}
        getReasonConfig={getReasonConfig}
      />

      <NewAdjustmentModal 
        isOpen={actions.isModalOpen}
        closeModal={actions.closeModal}
        warehouses={data.warehouses}
        selectedWarehouseId={data.selectedWarehouseId}
        setSelectedWarehouseId={data.setSelectedWarehouseId}
        referenceNote={actions.referenceNote}
        setReferenceNote={actions.setReferenceNote}
        batchItems={actions.batchItems}
        barcodeInput={actions.barcodeInput}
        setBarcodeInput={actions.setBarcodeInput}
        handleBarcodeScan={actions.handleBarcodeScan}
        selectedProductId={data.selectedProductId}
        setSelectedProductId={data.setSelectedProductId}
        products={data.products}
        currentLineStock={data.currentLineStock}
        inputActualQty={actions.inputActualQty}
        setInputActualQty={actions.setInputActualQty}
        itemReason={actions.itemReason}
        setItemReason={actions.setItemReason}
        addLineToBatch={actions.addLineToBatch}
        removeBatchItem={actions.removeBatchItem}
        batchTotals={actions.batchTotals}
        handleSaveBatch={actions.handleSaveBatch}
        formatCurrency={data.formatCurrency}
        getReasonConfig={getReasonConfig}
      />

    </div>
  );
};

export default StockAdjustments;
