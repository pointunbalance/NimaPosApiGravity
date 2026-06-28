import React from 'react';
import { ShoppingBag, Plus, ShoppingCart, FileSpreadsheet, ClipboardList, CheckCircle, AlertTriangle, X } from 'lucide-react';

import ConfirmModal from '../../components/ui/ConfirmModal';

// Modular Imports
import { useStoreState } from '../../components/gym/useStoreState';
import { StoreMetrics } from '../../components/gym/StoreMetrics';
import { StoreTabPOS } from '../../components/gym/StoreTabPOS';
import { StoreTabHistory } from '../../components/gym/StoreTabHistory';
import { StoreTabInventory } from '../../components/gym/StoreTabInventory';
import { StoreFormModal } from '../../components/gym/StoreFormModal';
import { StoreSaleDetailModal } from '../../components/gym/StoreSaleDetailModal';

export const GymStore = () => {
  const {
    activeTab,
    setActiveTab,
    posSearch,
    setPosSearch,
    historySearch,
    setHistorySearch,
    inventorySearch,
    setInventorySearch,
    cart,
    customerName,
    setCustomerName,
    paymentMethod,
    setPaymentMethod,
    showMemberDropdown,
    setShowMemberDropdown,
    isModalOpen,
    setIsModalOpen,
    isEdit,
    formData,
    setFormData,
    selectedSaleDetail,
    setSelectedSaleDetail,
    toast,
    confirmDialog,
    setConfirmDialog,
    currency,
    sales,
    filteredProductsPOS,
    filteredInvoices,
    filteredProductsInventory,
    statsCore,
    chartData,
    topProductsChartData,
    matchedMembers,
    handleAddToCart,
    updateCartQuantity,
    removeFromCart,
    handleClearCart,
    handleCheckout,
    handleVoidSale,
    handleOpenProductModal,
    handleSaveProduct,
    askDeleteProduct
  } = useStoreState();

  return (
    <div className="p-6 space-y-6 text-right font-sans bg-slate-50/50 min-h-screen" dir="rtl">
      
      {/* Toast Notification System */}
      {toast && (
        <div className={`fixed top-4 left-4 z-[999] p-4 rounded-xl shadow-lg border flex items-center gap-3 animate-in fade-in slide-in-from-left duration-300 max-w-sm ${
          toast.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-205 font-bold' 
            : toast.type === 'warning' 
            ? 'bg-amber-50 text-amber-805 border-amber-205 font-bold' 
            : 'bg-rose-50 text-rose-805 border-rose-205 font-bold'
        }`}>
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />}
          {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />}
          {toast.type === 'error' && <X className="w-5 h-5 text-rose-600 shrink-0" />}
          <span className="text-xs font-black leading-relaxed">{toast.message}</span>
        </div>
      )}

      {/* Hero Header Area */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex-row-reverse text-right">
        {/* Navigation / Tab Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto flex-row-reverse text-right">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 w-full sm:w-auto flex-row-reverse text-right">
            <button
              onClick={() => setActiveTab('pos')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition-all text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'pos' 
                  ? 'bg-white text-indigo-600 shadow' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>نقطة الحضور والبيع</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition-all text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'history' 
                  ? 'bg-white text-indigo-600 shadow' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>سجل الفواتير والقيود</span>
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition-all text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'inventory' 
                  ? 'bg-white text-indigo-600 shadow' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>المستودع والمخزون</span>
              {statsCore.lowStockCount > 0 && (
                <span className="bg-rose-100 text-rose-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                  {statsCore.lowStockCount}
                </span>
              )}
            </button>
          </div>

          <button 
            onClick={() => handleOpenProductModal(false)}
            className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل منتج جديد</span>
          </button>
        </div>

        <div>
          <div className="flex items-center gap-3 justify-end flex-row-reverse text-right">
            <span className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <ShoppingBag className="w-6 h-6" />
            </span>
            <div className="text-right">
              <h1 className="text-lg font-black text-slate-805 tracking-tight">إدارة مبيعات الجيم ومقصف المنتجات</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                الكاشير المتطور لبروتينات ومكملات الرياضيين بالتكامل مع الحسابات العامة باليومية.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Store metrics panel block */}
      <StoreMetrics statsCore={statsCore} totalSalesCount={sales.length} currency={currency} />

      {/* Tab Switch routers */}
      {activeTab === 'pos' && (
        <StoreTabPOS
          filteredProductsPOS={filteredProductsPOS}
          posSearch={posSearch}
          setPosSearch={setPosSearch}
          cart={cart}
          handleAddToCart={handleAddToCart}
          updateCartQuantity={updateCartQuantity}
          removeFromCart={removeFromCart}
          handleClearCart={handleClearCart}
          customerName={customerName}
          setCustomerName={setCustomerName}
          showMemberDropdown={showMemberDropdown}
          setShowMemberDropdown={setShowMemberDropdown}
          matchedMembers={matchedMembers}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          currency={currency}
          onCheckout={handleCheckout}
        />
      )}

      {activeTab === 'history' && (
        <StoreTabHistory
          chartData={chartData}
          topProductsChartData={topProductsChartData}
          historySearch={historySearch}
          setHistorySearch={setHistorySearch}
          filteredInvoices={filteredInvoices}
          onOpenDetails={(sale) => setSelectedSaleDetail(sale)}
          onVoidSale={handleVoidSale}
          currency={currency}
        />
      )}

      {activeTab === 'inventory' && (
        <StoreTabInventory
          inventorySearch={inventorySearch}
          setInventorySearch={setInventorySearch}
          filteredProductsInventory={filteredProductsInventory}
          onEditProduct={(item) => handleOpenProductModal(true, item)}
          onDeleteProduct={askDeleteProduct}
          currency={currency}
        />
      )}

      {/* Main Product entry form modal */}
      <StoreFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isEdit={isEdit}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSaveProduct}
      />

      {/* Sale detail view modal */}
      <StoreSaleDetailModal
        isOpen={!!selectedSaleDetail}
        onClose={() => setSelectedSaleDetail(null)}
        sale={selectedSaleDetail}
        currency={currency}
      />

      {/* Confirmation modal wrapper dialog */}
      {confirmDialog && confirmDialog.isOpen && (
        <ConfirmModal 
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText="تأكيد ومتابعة الإجراء"
          cancelText="تراجع وإلغاء"
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

    </div>
  );
};
export default GymStore;
