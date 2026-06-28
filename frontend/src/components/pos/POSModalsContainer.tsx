import React from 'react';
import { ShiftModal } from './ShiftModal';
import { TableSelectionModal } from './TableSelectionModal';
import { UnitModal } from './UnitModal';
import { SerialScanModal } from './SerialScanModal';
import { VariantModal } from './VariantModal';
import { ModifierModal } from './ModifierModal';
import { LineItemEditModal } from './LineItemEditModal';
import { PaymentModal } from './PaymentModal';
import InvoiceModal from '../InvoiceModal';
import { CustomItemModal } from './CustomItemModal';
import { QuantityModal } from './QuantityModal';
import { HeldOrdersModal } from './HeldOrdersModal';
import { QuickCustomerModal } from './QuickCustomerModal';
import { DiscountModal } from './DiscountModal';
import { POSSettingsDrawer } from './POSSettingsDrawer';
import { ShortcutsModal } from './ShortcutsModal';
import { PriceCheckModal } from './PriceCheckModal';
import { OrdersHistoryModal } from './OrdersHistoryModal';
import { Product, CartItem, Order, User, Customer, ProductSerial, ProductUnit } from '../../types';
import { printQueue } from '../../services/PrintQueueService';

interface POSModalsContainerProps {
  // Shift Modal
  isShiftModalOpen: boolean;
  setIsShiftModalOpen: (open: boolean) => void;
  
  // Table Selection Modal
  isTableSelectionModalOpen: boolean;
  setIsTableSelectionModalOpen: (open: boolean) => void;
  selectedTable: string | null;
  setSelectedTable: (table: string | null) => void;

  // Unit Modal
  isUnitModalOpen: boolean;
  setIsUnitModalOpen: (open: boolean) => void;
  selectedProductForUnits: Product | null;
  handleUnitSelect: (unit: any) => void;

  // Serial Scan Modal
  isSerialScanModalOpen: boolean;
  setIsSerialScanModalOpen: (open: boolean) => void;
  productForSerialScan: Product | null;
  serialScanInput: string;
  setSerialScanInput: (input: string) => void;
  availableSerials: ProductSerial[];
  handleSerialConfirm: (serial: string) => void;

  // Variant Modal
  isVariantModalOpen: boolean;
  setIsVariantModalOpen: (open: boolean) => void;
  selectedProductForVariants: Product | null;
  handleVariantSelect: (variant: { name: string; price: number }) => void;

  // Modifier Modal
  isModifierModalOpen: boolean;
  setIsModifierModalOpen: (open: boolean) => void;
  selectedProductForModifiers: Product | null;
  handleModifierConfirm: (selectedModifiers: any[]) => void;

  // Line Item Edit Modal
  isLineItemModalOpen: boolean;
  setIsLineItemModalOpen: (open: boolean) => void;
  editingCartItemId: string | null;
  lineItemDiscount: string;
  setLineItemDiscount: (discount: string) => void;
  lineItemPriceOverride: string;
  setLineItemPriceOverride: (price: string) => void;
  lineItemNote: string;
  setLineItemNote: (note: string) => void;
  saveLineItemChanges: () => void;

  // Payment Modal
  isPaymentModalOpen: boolean;
  setIsPaymentModalOpen: (open: boolean) => void;
  isRefundMode: boolean;
  totals: any;
  paymentMethod: 'cash' | 'card' | 'credit' | 'wallet' | 'split';
  setPaymentMethod: (method: 'cash' | 'card' | 'credit' | 'wallet' | 'split') => void;
  amountReceived: number;
  setAmountReceived: (amount: number) => void;
  splitCash: number;
  setSplitCash: (amount: number) => void;
  splitCard: number;
  setSplitCard: (amount: number) => void;
  dueDate: string;
  setDueDate: (date: string) => void;
  selectedCustomerId: number | null;
  customers: Customer[] | undefined;
  settings: any;
  loyaltyPointsUsed: number;
  setLoyaltyPointsUsed: (points: number) => void;
  giftCardCode: string;
  setGiftCardCode: (code: string) => void;
  giftCardAmount: number;
  setGiftCardAmount: (amount: number) => void;
  checkoutError: string | null;
  handleFinalizeCheckout: () => void;
  isProformaInvoiceOpen: boolean;
  setIsProformaInvoiceOpen: (open: boolean) => void;
  isReservation: boolean;
  setIsReservation: (res: boolean) => void;
  reservationDueDate: string;
  setReservationDueDate: (date: string) => void;
  reservationDeliveredItems: { productId: number; quantity: number }[];
  setReservationDeliveredItems: (items: any[]) => void;

  // Custom Item Modal
  isCustomItemModalOpen: boolean;
  setIsCustomItemModalOpen: (open: boolean) => void;
  addCustomItem: (data: { name: string; price: number }) => void;

  // Quantity Modal
  isQtyModalOpen: boolean;
  setIsQtyModalOpen: (open: boolean) => void;
  pendingProductToAdd: Product | null;
  qtyInput: string;
  setQtyInput: (qty: string) => void;
  confirmQuantityAdd: () => void;

  // Held Orders Modal
  isHeldOrdersModalOpen: boolean;
  setIsHeldOrdersModalOpen: (open: boolean) => void;
  heldOrders: any[] | undefined;
  handleRetrieveOrder: (id: number) => void;
  handleDeleteHeldOrder: (id: number) => void;

  // Quick Customer Modal
  isQuickCustomerModalOpen: boolean;
  setIsQuickCustomerModalOpen: (open: boolean) => void;
  handleQuickCustomerAdd: (data: { name: string; phone: string }) => void;

  // Discount Modal
  isDiscountModalOpen: boolean;
  setIsDiscountModalOpen: (open: boolean) => void;
  discountType: 'fixed' | 'percent';
  setDiscountType: (type: 'fixed' | 'percent') => void;
  tempDiscountInput: string;
  setTempDiscountInput: (input: string) => void;
  applyDiscount: () => void;

  // Last Order Invoice
  lastOrder: Order | null;
  setLastOrder: (order: Order | null) => void;

  // POS Settings Drawer
  isPOSSettingsModalOpen: boolean;
  setIsPOSSettingsModalOpen: (open: boolean) => void;
  overallScale: number;
  setOverallScale: (scale: number) => void;
  gridScale: number;
  setGridScale: (scale: number) => void;
  cartScale: number;
  setCartScale: (scale: number) => void;

  // Shortcuts Modal
  isShortcutsModalOpen: boolean;
  setIsShortcutsModalOpen: (open: boolean) => void;

  // Price Checker Modal
  isPriceCheckModalOpen: boolean;
  setIsPriceCheckModalOpen: (open: boolean) => void;
  products: Product[] | undefined;

  // Orders History Modal
  isHistoryModalOpen: boolean;
  setIsHistoryModalOpen: (open: boolean) => void;
  onRecallOrder: (order: Order) => void;

  // Global Helpers
  formatCurrency: (amount: number) => string;
  cart: CartItem[];
  orderType: string;
  orderNote: string;
  users: User[] | undefined;
  selectedUser: number | null;
}

export const POSModalsContainer: React.FC<POSModalsContainerProps> = ({
  isShiftModalOpen,
  setIsShiftModalOpen,
  isTableSelectionModalOpen,
  setIsTableSelectionModalOpen,
  selectedTable,
  setSelectedTable,
  isUnitModalOpen,
  setIsUnitModalOpen,
  selectedProductForUnits,
  handleUnitSelect,
  isSerialScanModalOpen,
  setIsSerialScanModalOpen,
  productForSerialScan,
  serialScanInput,
  setSerialScanInput,
  availableSerials,
  handleSerialConfirm,
  isVariantModalOpen,
  setIsVariantModalOpen,
  selectedProductForVariants,
  handleVariantSelect,
  isModifierModalOpen,
  setIsModifierModalOpen,
  selectedProductForModifiers,
  handleModifierConfirm,
  isLineItemModalOpen,
  setIsLineItemModalOpen,
  editingCartItemId,
  lineItemDiscount,
  setLineItemDiscount,
  lineItemPriceOverride,
  setLineItemPriceOverride,
  lineItemNote,
  setLineItemNote,
  saveLineItemChanges,
  isPaymentModalOpen,
  setIsPaymentModalOpen,
  isRefundMode,
  totals,
  paymentMethod,
  setPaymentMethod,
  amountReceived,
  setAmountReceived,
  splitCash,
  setSplitCash,
  splitCard,
  setSplitCard,
  dueDate,
  setDueDate,
  selectedCustomerId,
  customers,
  settings,
  loyaltyPointsUsed,
  setLoyaltyPointsUsed,
  giftCardCode,
  setGiftCardCode,
  giftCardAmount,
  setGiftCardAmount,
  checkoutError,
  handleFinalizeCheckout,
  isProformaInvoiceOpen,
  setIsProformaInvoiceOpen,
  isReservation,
  setIsReservation,
  reservationDueDate,
  setReservationDueDate,
  reservationDeliveredItems,
  setReservationDeliveredItems,
  isCustomItemModalOpen,
  setIsCustomItemModalOpen,
  addCustomItem,
  isQtyModalOpen,
  setIsQtyModalOpen,
  pendingProductToAdd,
  qtyInput,
  setQtyInput,
  confirmQuantityAdd,
  isHeldOrdersModalOpen,
  setIsHeldOrdersModalOpen,
  heldOrders,
  handleRetrieveOrder,
  handleDeleteHeldOrder,
  isQuickCustomerModalOpen,
  setIsQuickCustomerModalOpen,
  handleQuickCustomerAdd,
  isDiscountModalOpen,
  setIsDiscountModalOpen,
  discountType,
  setDiscountType,
  tempDiscountInput,
  setTempDiscountInput,
  applyDiscount,
  lastOrder,
  setLastOrder,
  isPOSSettingsModalOpen,
  setIsPOSSettingsModalOpen,
  overallScale,
  setOverallScale,
  gridScale,
  setGridScale,
  cartScale,
  setCartScale,
  isShortcutsModalOpen,
  setIsShortcutsModalOpen,
  isPriceCheckModalOpen,
  setIsPriceCheckModalOpen,
  products,
  isHistoryModalOpen,
  setIsHistoryModalOpen,
  onRecallOrder,
  formatCurrency,
  cart,
  orderType,
  orderNote,
  users,
  selectedUser,
}) => {
  return (
    <>
      {/* Shift Modal */}
      <ShiftModal 
          isOpen={isShiftModalOpen}
          onClose={() => setIsShiftModalOpen(false)}
          formatCurrency={formatCurrency}
      />

      {/* Table Selection Modal */}
      <TableSelectionModal 
          isOpen={isTableSelectionModalOpen}
          onClose={() => setIsTableSelectionModalOpen(false)}
          selectedTable={selectedTable}
          onSelectTable={(tableId) => {
              setSelectedTable(tableId);
              setIsTableSelectionModalOpen(false);
          }}
      />

      {/* Units Selection Modal */}
      <UnitModal 
          isOpen={isUnitModalOpen}
          onClose={() => setIsUnitModalOpen(false)}
          selectedProductForUnits={selectedProductForUnits}
          handleUnitSelect={handleUnitSelect}
          formatCurrency={formatCurrency}
      />
      
      {/* Serial Scan Modal */}
      <SerialScanModal 
          isOpen={isSerialScanModalOpen}
          onClose={() => setIsSerialScanModalOpen(false)}
          productForSerialScan={productForSerialScan}
          serialScanInput={serialScanInput}
          setSerialScanInput={setSerialScanInput}
          availableSerials={availableSerials}
          handleSerialConfirm={handleSerialConfirm}
      />

      {/* Variant Modal */}
      <VariantModal 
          isOpen={isVariantModalOpen}
          onClose={() => setIsVariantModalOpen(false)}
          selectedProductForVariants={selectedProductForVariants}
          handleVariantSelect={handleVariantSelect}
          formatCurrency={formatCurrency}
      />

      {/* Modifier Modal */}
      <ModifierModal
          isOpen={isModifierModalOpen}
          onClose={() => setIsModifierModalOpen(false)}
          product={selectedProductForModifiers}
          onConfirm={handleModifierConfirm}
          formatCurrency={formatCurrency}
      />

      {/* Line Item Edit Modal */}
      <LineItemEditModal 
          isOpen={isLineItemModalOpen}
          onClose={() => setIsLineItemModalOpen(false)}
          editingCartItemId={editingCartItemId}
          lineItemDiscount={lineItemDiscount}
          setLineItemDiscount={setLineItemDiscount}
          lineItemPriceOverride={lineItemPriceOverride}
          setLineItemPriceOverride={setLineItemPriceOverride}
          lineItemNote={lineItemNote}
          setLineItemNote={setLineItemNote}
          saveLineItemChanges={saveLineItemChanges}
      />

      {/* Payment Modal */}
      <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          isRefundMode={isRefundMode}
          totals={totals}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          amountReceived={amountReceived}
          setAmountReceived={setAmountReceived}
          splitCash={splitCash}
          setSplitCash={setSplitCash}
          splitCard={splitCard}
          setSplitCard={setSplitCard}
          dueDate={dueDate}
          setDueDate={setDueDate}
          selectedCustomerId={selectedCustomerId}
          customers={customers}
          settings={settings}
          loyaltyPointsUsed={loyaltyPointsUsed}
          setLoyaltyPointsUsed={setLoyaltyPointsUsed}
          giftCardCode={giftCardCode}
          setGiftCardCode={setGiftCardCode}
          giftCardAmount={giftCardAmount}
          setGiftCardAmount={setGiftCardAmount}
          checkoutError={checkoutError}
          handleFinalizeCheckout={handleFinalizeCheckout}
          formatCurrency={formatCurrency}
          onPreview={() => setIsProformaInvoiceOpen(true)}
          isReservation={isReservation}
          setIsReservation={setIsReservation}
          reservationDueDate={reservationDueDate}
          setReservationDueDate={setReservationDueDate}
          reservationDeliveredItems={reservationDeliveredItems}
          setReservationDeliveredItems={setReservationDeliveredItems}
          cart={cart}
      />

      {/* Proforma Invoice Modal Preview */}
      {isProformaInvoiceOpen && (
        <InvoiceModal 
            order={{
                id: 0,
                items: cart,
                subtotalAmount: totals.subtotal,
                taxAmount: totals.tax,
                discountAmount: totals.discountAmount,
                totalAmount: totals.total,
                paymentMethod: paymentMethod,
                amountReceived: amountReceived,
                changeAmount: Math.max(0, amountReceived - totals.total),
                status: 'pending',
                date: new Date(),
                orderType: orderType,
                isRefund: isRefundMode,
                customerId: selectedCustomerId || undefined,
                notes: orderNote,
                cashierId: users?.find(u => u.id === selectedUser)?.id || 1,
                cashierName: users?.find(u => u.id === selectedUser)?.name || 'Current User'
            } as any}
            settings={settings}
            customer={customers?.find(c => c.id === selectedCustomerId)}
            onClose={() => setIsProformaInvoiceOpen(false)}
            isProforma={true}
        />
      )}
      
      {/* Custom Item Modal */}
      <CustomItemModal 
          isOpen={isCustomItemModalOpen}
          onClose={() => setIsCustomItemModalOpen(false)}
          addCustomItem={addCustomItem}
      />
      
      {/* Quantity Modal */}
      <QuantityModal 
          isOpen={isQtyModalOpen}
          onClose={() => setIsQtyModalOpen(false)}
          pendingProductToAdd={pendingProductToAdd}
          qtyInput={qtyInput}
          setQtyInput={setQtyInput}
          confirmQuantityAdd={confirmQuantityAdd}
      />

      {/* Held Orders Modal */}
      <HeldOrdersModal 
          isOpen={isHeldOrdersModalOpen}
          onClose={() => setIsHeldOrdersModalOpen(false)}
          heldOrders={heldOrders}
          restoreHeldOrder={handleRetrieveOrder}
          deleteHeldOrder={handleDeleteHeldOrder}
          formatCurrency={formatCurrency}
      />
      
      {/* Quick Customer Modal */}
      <QuickCustomerModal 
          isOpen={isQuickCustomerModalOpen}
          onClose={() => setIsQuickCustomerModalOpen(false)}
          handleQuickCustomerAdd={handleQuickCustomerAdd}
      />

      {/* Discount Modal */}
      <DiscountModal 
          isOpen={isDiscountModalOpen}
          onClose={() => setIsDiscountModalOpen(false)}
          discountType={discountType}
          setDiscountType={setDiscountType}
          tempDiscountInput={tempDiscountInput}
          setTempDiscountInput={setTempDiscountInput}
          applyDiscount={applyDiscount}
      />

      {/* Invoice Modal for Last Order */}
      {lastOrder && (
          <InvoiceModal 
              order={lastOrder}
              settings={settings}
              customer={customers?.find(c => c.id === lastOrder.customerId)}
              onClose={() => setLastOrder(null)}
          />
      )}

      {/* POS Settings Drawer */}
      <POSSettingsDrawer
          isOpen={isPOSSettingsModalOpen}
          onClose={() => setIsPOSSettingsModalOpen(false)}
          settings={settings}
          overallScale={overallScale}
          setOverallScale={setOverallScale}
          gridScale={gridScale}
          setGridScale={setGridScale}
          cartScale={cartScale}
          setCartScale={setCartScale}
      />

      {/* Shortcuts Modal (F1 Help) */}
      <ShortcutsModal 
          isOpen={isShortcutsModalOpen}
          onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* Price Checker Modal (F10) */}
      <PriceCheckModal 
          isOpen={isPriceCheckModalOpen}
          onClose={() => setIsPriceCheckModalOpen(false)}
          products={products}
          formatCurrency={formatCurrency}
      />

      {/* Orders History Modal */}
      <OrdersHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          onPrintReceipt={order => printQueue.addJob({ type: 'receipt', order, settings: (settings || {}) as any })}
          formatCurrency={formatCurrency}
          onRecallOrder={onRecallOrder}
      />
    </>
  );
};
