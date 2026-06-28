import React from 'react';
import { useToast } from '../context/ToastContext';
import { useOrdersState } from '../components/orders/useOrdersState';
import ConfirmModal from '../components/ui/ConfirmModal';
import InvoiceModal from '../components/InvoiceModal';
import OrdersHeader from '../components/orders/OrdersHeader';
import OrdersStats from '../components/orders/OrdersStats';
import OrdersToolbar from '../components/orders/OrdersToolbar';
import OrdersList from '../components/orders/OrdersList';
import OrderDetailsDrawer from '../components/orders/OrderDetailsDrawer';
import RefundModal from '../components/orders/RefundModal';

const Orders: React.FC = () => {
  const { success, error: showError } = useToast();

  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    dateRange,
    setDateRange,
    filterOrderType,
    setFilterOrderType,
    filterPaymentMethod,
    setFilterPaymentMethod,
    filterCashier,
    setFilterCashier,
    selectedOrder,
    setSelectedOrder,
    invoicePreviewOrder,
    setInvoicePreviewOrder,
    isRefundModalOpen,
    setIsRefundModalOpen,
    refundItems,
    refundReason,
    setRefundReason,
    orders,
    isLoading,
    loadMore,
    hasMore,
    stats,
    settings,
    uniqueCashiers,
    customerMap,
    formatCurrency,
    formatDate,
    formatTime,
    openRefundModal,
    handleRefundQtyChange,
    calculateRefundTotal,
    executePartialRefund,
    handlePrintReport,
    handleExportCSV,
    handleDeleteOrder,
    handleSendWhatsApp,
    confirmConfig,
    setConfirmConfig,
  } = useOrdersState(success, showError);

  return (
    <div className="flex h-full bg-gradient-to-tr from-sky-50/60 via-indigo-50/40 via-slate-50 to-pink-50/40 overflow-hidden font-['Tajawal'] p-4 md:p-6 gap-6 rounded-2xl">
      {/* Main Content (Table & Filters) */}
      <div
        className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ${
          selectedOrder ? 'w-[65%] hidden lg:flex' : 'w-full'
        }`}
      >
        <div className="px-8 py-6 bg-white/60 backdrop-blur-md shadow-sm border border-indigo-100/10 rounded-2xl mb-4">
          <OrdersHeader onPrintReport={handlePrintReport} onExportCSV={handleExportCSV} />

          <OrdersStats
            totalRevenue={stats.totalRevenue}
            count={stats.count}
            avgOrder={stats.avgOrder}
            totalRefunded={stats.totalRefunded}
            formatCurrency={formatCurrency}
          />

          <OrdersToolbar
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            dateRange={dateRange}
            setDateRange={setDateRange}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterOrderType={filterOrderType}
            setFilterOrderType={setFilterOrderType}
            filterPaymentMethod={filterPaymentMethod}
            setFilterPaymentMethod={setFilterPaymentMethod}
            filterCashier={filterCashier}
            setFilterCashier={setFilterCashier}
            uniqueCashiers={uniqueCashiers as string[]}
          />
        </div>

        <OrdersList
          orders={orders}
          isLoading={isLoading}
          selectedOrder={selectedOrder}
          setSelectedOrder={setSelectedOrder}
          setInvoicePreviewOrder={setInvoicePreviewOrder}
          customerMap={customerMap}
          formatDate={formatDate}
          formatTime={formatTime}
          formatCurrency={formatCurrency}
          loadMore={loadMore}
          hasMore={hasMore}
        />
      </div>

      {selectedOrder && (
        <OrderDetailsDrawer
          selectedOrder={selectedOrder}
          setSelectedOrder={setSelectedOrder}
          setInvoicePreviewOrder={setInvoicePreviewOrder}
          openRefundModal={openRefundModal}
          handleDeleteOrder={handleDeleteOrder}
          handleSendWhatsApp={handleSendWhatsApp}
          formatCurrency={formatCurrency}
        />
      )}

      {isRefundModalOpen && (
        <RefundModal
          refundItems={refundItems}
          refundReason={refundReason}
          setRefundReason={setRefundReason}
          handleRefundQtyChange={handleRefundQtyChange}
          calculateRefundTotal={calculateRefundTotal}
          executePartialRefund={executePartialRefund}
          setIsRefundModalOpen={setIsRefundModalOpen}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Invoice Modal Preview */}
      {invoicePreviewOrder && (
        <InvoiceModal
          order={invoicePreviewOrder}
          settings={settings}
          customer={
            invoicePreviewOrder.customerId && customerMap.has(invoicePreviewOrder.customerId)
              ? ({
                  id: invoicePreviewOrder.customerId,
                  name: customerMap.get(invoicePreviewOrder.customerId)!,
                } as any)
              : undefined
          }
          onClose={() => setInvoicePreviewOrder(null)}
        />
      )}

      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
        />
      )}
    </div>
  );
};

export default Orders;
