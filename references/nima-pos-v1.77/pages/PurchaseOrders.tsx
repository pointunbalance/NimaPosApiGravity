import React from 'react';
import { useToast } from '../context/ToastContext';
import { usePurchaseOrdersState } from '../components/purchaseOrders/usePurchaseOrdersState';
import { FileText, CheckCircle2, XCircle, Truck } from 'lucide-react';

import PurchaseOrdersHeader from '../components/purchaseOrders/PurchaseOrdersHeader';
import PurchaseOrdersList from '../components/purchaseOrders/PurchaseOrdersList';
import PurchaseOrderModal from '../components/purchaseOrders/PurchaseOrderModal';
import ViewPurchaseOrderModal from '../components/purchaseOrders/ViewPurchaseOrderModal';
import ReceivePurchaseOrderModal from '../components/purchaseOrders/ReceivePurchaseOrderModal';

const PurchaseOrders: React.FC = () => {
  const { success, error: showError } = useToast();

  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    isModalOpen,
    setIsModalOpen,
    isViewModalOpen,
    setIsViewModalOpen,
    isReceiveModalOpen,
    setIsReceiveModalOpen,
    selectedOrder,
    setSelectedOrder,
    supplierId,
    setSupplierId,
    expectedDate,
    setExpectedDate,
    items,
    notes,
    setNotes,
    selectedProductId,
    setSelectedProductId,
    selectedQty,
    setSelectedQty,
    selectedCost,
    setSelectedCost,
    filteredOrders,
    suppliers,
    products,
    currency,
    handleProductSelect,
    handleAddItem,
    handleRemoveItem,
    handleUpdateItemQty,
    handleUpdateItemCost,
    subtotal,
    resetForm,
    handleSaveOrder,
    openEditModal,
    handleStatusChange,
    handleReceiveItems,
  } = usePurchaseOrdersState(success, showError);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': 
        return <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><FileText className="w-3 h-3"/> مسودة</span>;
      case 'sent': 
        return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Truck className="w-3 h-3"/> مرسل للمورد</span>;
      case 'received': 
        return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> مستلم</span>;
      case 'cancelled': 
        return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><XCircle className="w-3 h-3"/> ملغي</span>;
      default: 
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] font-sans">
      <PurchaseOrdersHeader 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onNewOrderClick={() => { resetForm(); setIsModalOpen(true); }}
      />

      <PurchaseOrdersList 
        filteredOrders={filteredOrders}
        currency={currency}
        getStatusBadge={getStatusBadge}
        onViewOrder={(order) => { setSelectedOrder(order); setIsViewModalOpen(true); }}
        onEditOrder={openEditModal}
      />

      <PurchaseOrderModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedOrder={selectedOrder}
        suppliers={suppliers}
        products={products}
        supplierId={supplierId}
        setSupplierId={setSupplierId}
        expectedDate={expectedDate}
        setExpectedDate={setExpectedDate}
        items={items}
        notes={notes}
        setNotes={setNotes}
        selectedProductId={selectedProductId}
        setSelectedProductId={setSelectedProductId}
        selectedQty={selectedQty}
        setSelectedQty={setSelectedQty}
        selectedCost={selectedCost}
        setSelectedCost={setSelectedCost}
        handleProductSelect={handleProductSelect}
        handleAddItem={handleAddItem}
        handleRemoveItem={handleRemoveItem}
        handleUpdateItemQty={handleUpdateItemQty}
        handleUpdateItemCost={handleUpdateItemCost}
        subtotal={subtotal}
        currency={currency}
        handleSaveOrder={handleSaveOrder}
      />

      <ViewPurchaseOrderModal 
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        selectedOrder={selectedOrder}
        getStatusBadge={getStatusBadge}
        currency={currency}
        handleStatusChange={handleStatusChange}
        onOpenReceive={() => setIsReceiveModalOpen(true)}
      />

      <ReceivePurchaseOrderModal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        order={selectedOrder}
        currency={currency}
        onReceive={handleReceiveItems}
      />
    </div>
  );
};

export default PurchaseOrders;
