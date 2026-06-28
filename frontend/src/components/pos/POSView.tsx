import React from 'react';
import { ChevronRight } from 'lucide-react';
import { WholesaleAccountingConsole } from './WholesaleAccountingConsole';
import { CallerIdNotification } from './CallerIdNotification';
import { HeaderAndFilters } from './HeaderAndFilters';
import { POSCategoryGrid } from './POSCategoryGrid';
import { ProductGrid } from './ProductGrid';
import { CartSidebar } from './CartSidebar';
import { POSModalsContainer } from './POSModalsContainer';
import ConfirmModal from '../ui/ConfirmModal';

interface POSViewProps {
  isWholesale: boolean;
  isAccountingOnly: boolean;
  selectedUser: number | null;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  debouncedSearch: string;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  viewMode: 'grid' | 'list' | 'categories';
  setViewMode: (val: 'grid' | 'list' | 'categories') => void;
  autoFocusEnabled: boolean;
  setAutoFocusEnabled: (val: boolean) => void;
  selectedSalespersonId: number | null;
  setSelectedSalespersonId: (val: number | null) => void;
  selectedWarehouseId: number | null;
  setSelectedWarehouseId: (val: number | null) => void;
  pData: any;
  pCart: any;
  pActions: any;
  searchInputRef: React.RefObject<HTMLInputElement>;
  handleSearchSubmit: (e: React.FormEvent) => void;
  handleReadScaleWeight: () => Promise<void>;
  formatCurrency: (val: number) => string;
  filteredProducts: any[];
  success: (msg: string) => void;
}

export const POSView: React.FC<POSViewProps> = ({
  isWholesale,
  isAccountingOnly,
  selectedUser,
  searchTerm,
  setSearchTerm,
  debouncedSearch,
  selectedCategory,
  setSelectedCategory,
  viewMode,
  setViewMode,
  autoFocusEnabled,
  setAutoFocusEnabled,
  selectedSalespersonId,
  setSelectedSalespersonId,
  selectedWarehouseId,
  setSelectedWarehouseId,
  pData,
  pCart,
  pActions,
  searchInputRef,
  handleSearchSubmit,
  handleReadScaleWeight,
  formatCurrency,
  filteredProducts,
  success,
}) => {
  return (
    <div className={`flex flex-col md:flex-row h-full overflow-hidden transition-colors duration-300 ${pCart.isRefundMode ? 'bg-red-50/85' : 'bg-gradient-to-tr from-sky-50/60 via-indigo-50/40 via-slate-50 to-pink-50/40'}`} style={{ zoom: pData.overallScale }}>
      {isAccountingOnly ? (
        <WholesaleAccountingConsole
          isAccountingOnly={isAccountingOnly}
          cart={pCart.cart}
          setCart={pCart.setCart}
          updateQuantity={pCart.updateQuantity}
          removeFromCart={pCart.removeFromCart}
          openLineItemModal={(item) => {
            pCart.setEditingCartItemId(item.cartItemId!);
            pCart.setLineItemDiscount(item.itemDiscount?.toString() || '');
            pCart.setLineItemNote(item.itemNote || '');
            pCart.setLineItemPriceOverride(item.price.toString());
            pCart.setIsLineItemModalOpen(true);
          }}
          selectedCustomerId={pActions.selectedCustomerId}
          setSelectedCustomerId={pActions.setSelectedCustomerId}
          customers={pData.customers}
          orderType={pActions.orderType}
          setOrderType={pActions.setOrderType}
          selectedSalespersonId={selectedSalespersonId}
          setSelectedSalespersonId={setSelectedSalespersonId}
          selectedWarehouseId={selectedWarehouseId}
          setSelectedWarehouseId={setSelectedWarehouseId}
          users={pData.users}
          isRefundMode={pCart.isRefundMode}
          setIsRefundMode={pCart.setIsRefundMode}
          isTaxEnabled={pCart.isTaxEnabled}
          taxRate={pCart.taxRate}
          orderNote={pActions.orderNote}
          setOrderNote={pActions.setOrderNote}
          promoCode={pActions.promoCode}
          setPromoCode={pActions.setPromoCode}
          setDiscountValue={pCart.setDiscountValue}
          discountValue={pCart.discountValue}
          discountType={pCart.discountType}
          setDiscountType={pCart.setDiscountType}
          totals={{ ...pCart.totals, discount: pCart.totals.discountAmount }}
          handleHoldOrder={pActions.handleHoldOrder}
          handleSaveQuotation={async () => {}}
          handleFastCash={() => pActions.handleFastCash(selectedUser)}
          initiatePayment={() => pActions.initiatePayment(selectedUser)}
          activeHeldOrderId={pActions.activeHeldOrderId}
          heldOrders={pData.heldOrders}
          handleRetrieveOrder={pActions.handleRetrieveOrder}
          formatCurrency={formatCurrency}
          handleProductClick={pCart.handleProductClick}
          checkoutWholesaleOverride={(data) => pActions.handleCheckoutWholesale(selectedUser, data)}
        />
      ) : (
        <>
          <CallerIdNotification 
              onAcceptCall={(customer) => {
                  pActions.setSelectedCustomerId(customer.id!);
                  pActions.setOrderType('delivery');
                  success(`تم الاستجابة لطلب العميل: ${customer.name}`);
              }} 
          />
          
          <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0">
            <HeaderAndFilters 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                searchInputRef={searchInputRef}
                handleSearchSubmit={handleSearchSubmit}
                autoFocusEnabled={autoFocusEnabled}
                setAutoFocusEnabled={setAutoFocusEnabled}
                isRefundMode={pCart.isRefundMode}
                setIsRefundMode={pCart.setIsRefundMode}
                setIsCustomItemModalOpen={pCart.setIsCustomItemModalOpen}
                setIsHeldOrdersModalOpen={pActions.setIsPaymentModalOpen}
                setIsShiftModalOpen={() => {}}
                heldOrders={pData.heldOrders}
                categories={pData.categories}
                dbCategories={pData.dbCategories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                viewMode={viewMode}
                setViewMode={setViewMode}
                onOpenCashDrawer={pActions.handleOpenCashDrawer}
                settings={pData.settings}
                onPrintLastBill={async () => {}}
                onOpenSettings={() => {}}
                onOpenPriceCheck={() => {}}
                onOpenShortcuts={() => {}}
                onReadScale={handleReadScaleWeight}
                onOpenHistory={() => {}}
                isWholesale={isWholesale}
                uiScale={pData.overallScale}
                setUiScale={pData.setOverallScale}
            />

            <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col min-h-0 relative" style={{ zoom: pData.gridScale }}>
                {viewMode === 'categories' && selectedCategory !== 'الكل' && (
                    <div className="flex items-center gap-4 mb-6" dir="rtl">
                        <button
                            onClick={() => setSelectedCategory('الكل')}
                            className="flex items-center gap-2 text-slate-500 hover:text-brand-600 font-bold transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100"
                        >
                            <ChevronRight className="w-5 h-5" />
                            العودة للتصنيفات
                        </button>
                        <h2 className="text-xl font-black text-slate-800">{selectedCategory}</h2>
                    </div>
                )}
                
                {viewMode === 'categories' && selectedCategory === 'الكل' && !debouncedSearch ? (
                    <POSCategoryGrid 
                        categories={pData.categories}
                        dbCategories={pData.dbCategories}
                        onSelectCategory={(cat) => setSelectedCategory(cat)}
                    />
                ) : (
                    <ProductGrid 
                        key={viewMode}
                        filteredProducts={filteredProducts}
                        isRefundMode={pCart.isRefundMode}
                        stockMap={pData.stockMap}
                        handleProductClick={pCart.handleProductClick}
                        formatCurrency={formatCurrency}
                        viewMode={viewMode === 'categories' ? 'grid' : viewMode}
                        hidePrices={isWholesale && (pData.settings?.posSettings?.wholesaleShowPrices === false)}
                        isWholesale={isWholesale}
                        handleWholesaleAdd={(product, qty, unit) => pCart.addToCart(product, qty, undefined, unit)}
                    />
                )}
            </div>
          </div>

          <CartSidebar 
              activeHeldOrderId={pActions.activeHeldOrderId}
              uiScale={pData.cartScale}
              cart={pCart.cart}
              setCart={pCart.setCart}
              users={pData.users}
              selectedSalespersonId={selectedSalespersonId}
              setSelectedSalespersonId={setSelectedSalespersonId}
              isRefundMode={pCart.isRefundMode}
              selectedCustomerId={pActions.selectedCustomerId}
              setSelectedCustomerId={pActions.setSelectedCustomerId}
              customers={pData.customers}
              setIsQuickCustomerModalOpen={() => {}}
              orderType={pActions.orderType}
              setOrderType={pActions.setOrderType}
              settings={pData.settings}
              deliveryAddress={pActions.delivery.address}
              setDeliveryAddress={(val) => pActions.setDelivery((prev: any) => ({ ...prev, address: val }))}
              deliveryPhone={pActions.delivery.phone}
              setDeliveryPhone={(val) => pActions.setDelivery((prev: any) => ({ ...prev, phone: val }))}
              deliveryFee={pActions.delivery.fee}
              setDeliveryFee={(val) => pActions.setDelivery((prev: any) => ({ ...prev, fee: val }))}
              deviceSerial={pActions.maintenance.serial}
              setDeviceSerial={(val) => pActions.setMaintenance((prev: any) => ({ ...prev, serial: val }))}
              issueDescription={pActions.maintenance.issue}
              setIssueDescription={(val) => pActions.setMaintenance((prev: any) => ({ ...prev, issue: val }))}
              deviceAttachments={pActions.maintenance.attachments}
              setDeviceAttachments={(val) => pActions.setMaintenance((prev: any) => ({ ...prev, attachments: val }))}
              selectedTable={pActions.selectedTable}
              setIsTableSelectionModalOpen={() => {}}
              openLineItemModal={(item) => {
                pCart.setEditingCartItemId(item.cartItemId!);
                pCart.setLineItemDiscount(item.itemDiscount?.toString() || '');
                pCart.setLineItemNote(item.itemNote || '');
                pCart.setLineItemPriceOverride(item.price.toString());
                pCart.setIsLineItemModalOpen(true);
              }}
              updateQuantity={pCart.updateQuantity}
              removeFromCart={pCart.removeFromCart}
              totals={pCart.totals}
              setIsDiscountModalOpen={pCart.setIsDiscountModalOpen}
              isTaxEnabled={pCart.isTaxEnabled}
              taxRate={pCart.taxRate}
              orderNote={pActions.orderNote}
              setOrderNote={pActions.setOrderNote}
              promoCode={pActions.promoCode}
              setPromoCode={pActions.setPromoCode}
              setDiscountValue={pCart.setDiscountValue}
              handleHoldOrder={pActions.handleHoldOrder}
              handleSendToKitchen={async () => {}}
              handleSaveQuotation={async () => {}}
              handleFastCash={() => pActions.handleFastCash(selectedUser)}
              initiatePayment={() => pActions.initiatePayment(selectedUser)}
              formatCurrency={formatCurrency}
              isWholesale={isWholesale}
              heldOrders={pData.heldOrders}
              handleRetrieveOrder={pActions.handleRetrieveOrder}
          />
        </>
      )}

      <POSModalsContainer
          isShiftModalOpen={false}
          setIsShiftModalOpen={() => {}}
          isTableSelectionModalOpen={false}
          setIsTableSelectionModalOpen={() => {}}
          selectedTable={pActions.selectedTable}
          setSelectedTable={pActions.setSelectedTable}
          isUnitModalOpen={pCart.isUnitModalOpen}
          setIsUnitModalOpen={pCart.setIsUnitModalOpen}
          selectedProductForUnits={pCart.selectedProductForUnits}
          handleUnitSelect={pCart.handleUnitSelect}
          isSerialScanModalOpen={pCart.isSerialScanModalOpen}
          setIsSerialScanModalOpen={pCart.setIsSerialScanModalOpen}
          productForSerialScan={pCart.productForSerialScan}
          serialScanInput={pCart.serialScanInput}
          setSerialScanInput={pCart.setSerialScanInput}
          availableSerials={pCart.availableSerials}
          handleSerialConfirm={pCart.handleSerialConfirm}
          isVariantModalOpen={pCart.isVariantModalOpen}
          setIsVariantModalOpen={pCart.setIsVariantModalOpen}
          selectedProductForVariants={pCart.selectedProductForVariants}
          handleVariantSelect={pCart.handleVariantSelect}
          isModifierModalOpen={pCart.isModifierModalOpen}
          setIsModifierModalOpen={pCart.setIsModifierModalOpen}
          selectedProductForModifiers={pCart.selectedProductForModifiers}
          handleModifierConfirm={pCart.handleModifierConfirm}
          isLineItemModalOpen={pCart.isLineItemModalOpen}
          setIsLineItemModalOpen={pCart.setIsLineItemModalOpen}
          editingCartItemId={pCart.editingCartItemId}
          lineItemDiscount={pCart.lineItemDiscount}
          setLineItemDiscount={pCart.setLineItemDiscount}
          lineItemPriceOverride={pCart.lineItemPriceOverride}
          setLineItemPriceOverride={pCart.setLineItemPriceOverride}
          lineItemNote={pCart.lineItemNote}
          setLineItemNote={pCart.setLineItemNote}
          saveLineItemChanges={() => {
            pCart.handleSetCart((prev: any[]) => prev.map(item => {
              if (item.cartItemId === pCart.editingCartItemId) {
                return {
                  ...item,
                  itemDiscount: parseFloat(pCart.lineItemDiscount) || 0,
                  itemNote: pCart.lineItemNote,
                  price: parseFloat(pCart.lineItemPriceOverride) || item.price,
                  isManuallyPriced: true
                };
              }
              return item;
            }));
            pCart.setIsLineItemModalOpen(false);
          }}
          isPaymentModalOpen={pActions.isPaymentModalOpen}
          setIsPaymentModalOpen={pActions.setIsPaymentModalOpen}
          isRefundMode={pCart.isRefundMode}
          totals={pCart.totals}
          paymentMethod={pActions.paymentMethod}
          setPaymentMethod={pActions.setPaymentMethod}
          amountReceived={pActions.amountReceived}
          setAmountReceived={pActions.setAmountReceived}
          splitCash={pActions.splitCash}
          setSplitCash={pActions.setSplitCash}
          splitCard={pActions.splitCard}
          setSplitCard={pActions.setSplitCard}
          dueDate={pActions.maintenance.dueDate}
          setDueDate={(val) => pActions.setMaintenance((prev: any) => ({ ...prev, dueDate: val }))}
          selectedCustomerId={pActions.selectedCustomerId}
          customers={pData.customers}
          settings={pData.settings}
          loyaltyPointsUsed={pCart.loyaltyPointsUsed}
          setLoyaltyPointsUsed={pCart.setLoyaltyPointsUsed}
          giftCardCode={pActions.giftCardCode}
          setGiftCardCode={pActions.setGiftCardCode}
          giftCardAmount={pActions.giftCardAmount}
          setGiftCardAmount={pActions.setGiftCardAmount}
          checkoutError={pActions.checkoutError}
          handleFinalizeCheckout={() => pActions.handleFinalizeCheckout(selectedUser, pCart.loyaltyPointsUsed)}
          isProformaInvoiceOpen={pActions.isProformaInvoiceOpen}
          setIsProformaInvoiceOpen={pActions.setIsProformaInvoiceOpen}
          isReservation={pActions.isReservation}
          setIsReservation={pActions.setIsReservation}
          reservationDueDate={pActions.reservationDueDate}
          setReservationDueDate={pActions.setReservationDueDate}
          reservationDeliveredItems={pActions.reservationDeliveredItems}
          setReservationDeliveredItems={pActions.setReservationDeliveredItems}
          isCustomItemModalOpen={pCart.isCustomItemModalOpen}
          setIsCustomItemModalOpen={pCart.setIsCustomItemModalOpen}
          addCustomItem={pActions.addCustomItem}
          isQtyModalOpen={pCart.isQtyModalOpen}
          setIsQtyModalOpen={pCart.setIsQtyModalOpen}
          pendingProductToAdd={pCart.pendingProductToAdd}
          qtyInput={pCart.qtyInput}
          setQtyInput={pCart.setQtyInput}
          confirmQuantityAdd={pCart.confirmQuantityAdd}
          isHeldOrdersModalOpen={false}
          setIsHeldOrdersModalOpen={() => {}}
          heldOrders={pData.heldOrders}
          handleRetrieveOrder={pActions.handleRetrieveOrder}
          handleDeleteHeldOrder={(id) => pActions.setHeldOrderDetailToDelete(id)}
          isQuickCustomerModalOpen={false}
          setIsQuickCustomerModalOpen={() => {}}
          handleQuickCustomerAdd={async () => {}}
          isDiscountModalOpen={pCart.isDiscountModalOpen}
          setIsDiscountModalOpen={pCart.setIsDiscountModalOpen}
          discountType={pCart.discountType}
          setDiscountType={pCart.setDiscountType}
          tempDiscountInput={''}
          setTempDiscountInput={() => {}}
          applyDiscount={() => {}}
          lastOrder={pActions.lastOrder}
          setLastOrder={pActions.setLastOrder}
          isPOSSettingsModalOpen={false}
          setIsPOSSettingsModalOpen={() => {}}
          overallScale={pData.overallScale}
          setOverallScale={pData.setOverallScale}
          gridScale={pData.gridScale}
          setGridScale={pData.setGridScale}
          cartScale={pData.cartScale}
          setCartScale={pData.setCartScale}
          isShortcutsModalOpen={false}
          setIsShortcutsModalOpen={() => {}}
          isPriceCheckModalOpen={false}
          setIsPriceCheckModalOpen={() => {}}
          products={pData.products || []}
          isHistoryModalOpen={false}
          setIsHistoryModalOpen={() => {}}
          onRecallOrder={() => {}}
          formatCurrency={formatCurrency}
          cart={pCart.cart}
          orderType={pActions.orderType}
          orderNote={pActions.orderNote}
          users={pData.users}
          selectedUser={selectedUser}
      />

      <ConfirmModal
        isOpen={pActions.heldOrderDetailToDelete !== null}
        title="حذف الطلب المعلق"
        message="هل أنت متأكد من حذف هذا الطلب المعلق بشكل كامل؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={() => {
          if (pActions.heldOrderDetailToDelete !== null) {
            pActions.executeDeleteHeldOrder(pActions.heldOrderDetailToDelete);
          }
        }}
        onCancel={() => pActions.setHeldOrderDetailToDelete(null)}
        confirmText="حذف"
        cancelText="إلغاء"
      />
    </div>
  );
};
