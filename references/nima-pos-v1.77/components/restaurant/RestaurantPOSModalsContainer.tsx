import React from 'react';
import { RestaurantPaymentModal } from './RestaurantPaymentModal';
import { ShiftModal } from '../pos/ShiftModal';
import { VoidItemModal } from '../pos/VoidItemModal';
import { SplitCheckModal } from '../pos/SplitCheckModal';
import { QuickCustomerModal } from '../pos/QuickCustomerModal';
import InvoiceModal from '../InvoiceModal';
import { RestaurantNotesModal } from './RestaurantNotesModal';
import { TableModal } from './TableModal';
import { POSSettingsDrawer } from '../pos/POSSettingsDrawer';
import { PriceCheckModal } from '../pos/PriceCheckModal';
import { ShortcutsModal } from '../pos/ShortcutsModal';
import { OrdersHistoryModal } from '../pos/OrdersHistoryModal';
import { DiscountModal } from '../pos/DiscountModal';
import { CustomItemModal } from '../pos/CustomItemModal';
import { HeldOrdersModal } from '../pos/HeldOrdersModal';
import { VariantModal } from '../pos/VariantModal';
import { ModifierModal } from '../pos/ModifierModal';
import { Product, Order, Category, Table as TableType, CartItem } from '../../types';

interface RestaurantPOSModalsContainerProps {
  // Payment Modal
  isPaymentModalOpen: boolean;
  setIsPaymentModalOpen: (open: boolean) => void;
  selectedCustomer: { id: number; name: string; phone?: string; loyaltyPoints?: number } | null;
  settings: any;
  loyaltyRedeemedPoints: number;
  setLoyaltyRedeemedPoints: (pts: number) => void;
  total: number;
  currency: string;
  processPayment: (method: 'cash' | 'card' | 'credit' | 'wallet') => void;
  setIsProformaInvoiceOpen: (open: boolean) => void;

  // Shift Modal
  isShiftModalOpen: boolean;
  setIsShiftModalOpen: (open: boolean) => void;

  // Void Modal
  isVoidModalOpen: boolean;
  setIsVoidModalOpen: (open: boolean) => void;
  voidItemDetails: { cartItemId: string; quantity: number; name: string } | null;
  setVoidItemDetails: (details: any | null) => void;
  handleVoidConfirm: (reason: string, managerId?: number, managerName?: string) => Promise<void>;

  // Split Check Modal
  isSplitCheckModalOpen: boolean;
  setIsSplitCheckModalOpen: (open: boolean) => void;
  cart: CartItem[];
  handleSplitPay: (splitItems: CartItem[], remainingItems: CartItem[], method: 'cash' | 'card') => void | Promise<void>;

  // Quick Customer Modal
  isQuickCustomerModalOpen: boolean;
  setIsQuickCustomerModalOpen: (open: boolean) => void;
  handleQuickCustomerAdd: (data: { name: string; phone: string }) => void;

  // Proforma Invoice Preview
  isProformaInvoiceOpen: boolean;
  tax: number;
  selectedTable: string;

  // Item Notes Modal
  isNotesModalOpen: boolean;
  setIsNotesModalOpen: (open: boolean) => void;
  activeNoteItem: CartItem | null;
  tempNote: string;
  setTempNote: (note: string) => void;
  saveNotes: () => void;

  // Table Modal
  isTableModalOpen: boolean;
  setIsTableModalOpen: (open: boolean) => void;
  tables: TableType[] | undefined;
  setSelectedTable: (table: string) => void;

  // Print Receipt Hidden Block
  lastOrderForPrint: { orderData: any; cart: CartItem[] } | null;
  storeName: string;
  currencyLabel: string;

  // POS Settings Drawer
  isPOSSettingsModalOpen: boolean;
  setIsPOSSettingsModalOpen: (open: boolean) => void;
  overallScale: number;
  setOverallScale: (scale: number) => void;
  gridScale: number;
  setGridScale: (scale: number) => void;
  cartScale: number;
  setCartScale: (scale: number) => void;

  // Price Checker Modal
  isPriceCheckModalOpen: boolean;
  setIsPriceCheckModalOpen: (open: boolean) => void;
  products: Product[];

  // Shortcuts Modal
  isShortcutsModalOpen: boolean;
  setIsShortcutsModalOpen: (open: boolean) => void;

  // Orders History Modal
  isHistoryModalOpen: boolean;
  setIsHistoryModalOpen: (open: boolean) => void;

  // Discount Modal
  isDiscountModalOpen: boolean;
  setIsDiscountModalOpen: (open: boolean) => void;
  discountType: 'fixed' | 'percent';
  setDiscountType: (type: 'fixed' | 'percent') => void;
  tempDiscountInput: string;
  setTempDiscountInput: (input: string) => void;
  applyDiscount: () => void;

  // Custom Item Modal
  isCustomItemModalOpen: boolean;
  setIsCustomItemModalOpen: (open: boolean) => void;
  addToCart: (product: Product) => void;

  // Held Orders Modal
  isHeldOrdersModalOpen: boolean;
  setIsHeldOrdersModalOpen: (open: boolean) => void;
  heldOrders: any[] | undefined;
  handleRetrieveOrder: (id: number) => void;
  handleDeleteHeldOrder: (id: number) => void;

  // Variant Modal
  isVariantModalOpen: boolean;
  setIsVariantModalOpen: (open: boolean) => void;
  selectedProductForVariants: Product | null;
  setSelectedProductForVariants: (p: Product | null) => void;
  handleVariantConfirm: (variantIndex: number) => void;

  // Modifier Modal
  isModifierModalOpen: boolean;
  setIsModifierModalOpen: (open: boolean) => void;
  selectedProductForModifiers: Product | null;
  setSelectedProductForModifiers: (p: Product | null) => void;
  handleModifierConfirm: (selectedModifiers: any[]) => void;

  // General helpers
  formatCurrency: (amount: number) => string;
}

export const RestaurantPOSModalsContainer: React.FC<RestaurantPOSModalsContainerProps> = ({
  isPaymentModalOpen,
  setIsPaymentModalOpen,
  selectedCustomer,
  settings,
  loyaltyRedeemedPoints,
  setLoyaltyRedeemedPoints,
  total,
  currency,
  processPayment,
  setIsProformaInvoiceOpen,
  isShiftModalOpen,
  setIsShiftModalOpen,
  isVoidModalOpen,
  setIsVoidModalOpen,
  voidItemDetails,
  setVoidItemDetails,
  handleVoidConfirm,
  isSplitCheckModalOpen,
  setIsSplitCheckModalOpen,
  cart,
  handleSplitPay,
  isQuickCustomerModalOpen,
  setIsQuickCustomerModalOpen,
  handleQuickCustomerAdd,
  isProformaInvoiceOpen,
  tax,
  selectedTable,
  isNotesModalOpen,
  setIsNotesModalOpen,
  activeNoteItem,
  tempNote,
  setTempNote,
  saveNotes,
  isTableModalOpen,
  setIsTableModalOpen,
  tables,
  setSelectedTable,
  lastOrderForPrint,
  storeName,
  currencyLabel,
  isPOSSettingsModalOpen,
  setIsPOSSettingsModalOpen,
  overallScale,
  setOverallScale,
  gridScale,
  setGridScale,
  cartScale,
  setCartScale,
  isPriceCheckModalOpen,
  setIsPriceCheckModalOpen,
  products,
  isShortcutsModalOpen,
  setIsShortcutsModalOpen,
  isHistoryModalOpen,
  setIsHistoryModalOpen,
  isDiscountModalOpen,
  setIsDiscountModalOpen,
  discountType,
  setDiscountType,
  tempDiscountInput,
  setTempDiscountInput,
  applyDiscount,
  isCustomItemModalOpen,
  setIsCustomItemModalOpen,
  addToCart,
  isHeldOrdersModalOpen,
  setIsHeldOrdersModalOpen,
  heldOrders,
  handleRetrieveOrder,
  handleDeleteHeldOrder,
  isVariantModalOpen,
  setIsVariantModalOpen,
  selectedProductForVariants,
  setSelectedProductForVariants,
  handleVariantConfirm,
  isModifierModalOpen,
  setIsModifierModalOpen,
  selectedProductForModifiers,
  setSelectedProductForModifiers,
  handleModifierConfirm,
  formatCurrency,
}) => {
  return (
    <>
      {/* Payment Modal */}
      <RestaurantPaymentModal 
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          selectedCustomer={selectedCustomer}
          settings={settings}
          loyaltyRedeemedPoints={loyaltyRedeemedPoints}
          setLoyaltyRedeemedPoints={setLoyaltyRedeemedPoints}
          total={total}
          currency={currency}
          formatCurrency={formatCurrency}
          processPayment={processPayment}
          setIsProformaInvoiceOpen={setIsProformaInvoiceOpen}
      />

      {/* Shift Modal */}
      <ShiftModal 
          isOpen={isShiftModalOpen}
          onClose={() => setIsShiftModalOpen(false)}
          formatCurrency={formatCurrency}
      />

      {/* Void Modal */}
      <VoidItemModal 
          isOpen={isVoidModalOpen}
          onClose={() => {
              setIsVoidModalOpen(false);
              setVoidItemDetails(null);
          }}
          onConfirm={handleVoidConfirm}
          itemName={voidItemDetails?.name || ''}
      />

      {/* Split Check Modal */}
      <SplitCheckModal 
          isOpen={isSplitCheckModalOpen}
          onClose={() => setIsSplitCheckModalOpen(false)}
          cart={cart}
          onPaySplit={handleSplitPay}
          formatCurrency={formatCurrency}
      />

      {/* Quick Customer Modal */}
      <QuickCustomerModal
          isOpen={isQuickCustomerModalOpen}
          onClose={() => setIsQuickCustomerModalOpen(false)}
          handleQuickCustomerAdd={handleQuickCustomerAdd}
      />

      {/* Proforma Invoice Modal Preview */}
      {isProformaInvoiceOpen && (
          <InvoiceModal 
              order={{
                  id: 0,
                  items: cart,
                  subtotalAmount: total - tax,
                  taxAmount: tax,
                  discountAmount: 0,
                  totalAmount: total,
                  paymentMethod: 'cash',
                  amountReceived: total,
                  changeAmount: 0,
                  status: 'pending',
                  date: new Date(),
                  orderType: selectedTable ? 'dine-in' : 'takeaway',
                  isRefund: false,
                  tableNumber: selectedTable,
                  cashierId: 1,
                  cashierName: 'الكاشير'
              } as any}
              settings={settings}
              onClose={() => setIsProformaInvoiceOpen(false)}
              isProforma={true}
          />
      )}

      {/* Item Notes Modal */}
      <RestaurantNotesModal
          isOpen={isNotesModalOpen}
          onClose={() => setIsNotesModalOpen(false)}
          activeNoteItem={activeNoteItem}
          tempNote={tempNote}
          setTempNote={setTempNote}
          saveNotes={saveNotes}
      />

      {/* Table Slection Modal */}
      <TableModal 
          isOpen={isTableModalOpen}
          onClose={() => setIsTableModalOpen(false)}
          tables={tables}
          selectedTable={selectedTable}
          setSelectedTable={setSelectedTable}
      />

      {/* --- Print Receipt (Hidden on Screen, shown on print) --- */}
      {lastOrderForPrint && (
          <div id="print-receipt" className="only-print relative bg-white text-black p-4 text-sm break-words mx-auto pb-10" style={{maxWidth: '80mm'}}>
              <div className="text-center mb-4">
                  <h2 className="text-xl font-bold mb-1">{storeName || 'إدارة الكاشير'}</h2>
                  <p className="text-xs mb-1">تاريخ ووقت الفاتورة: {new Date(lastOrderForPrint.orderData.date).toLocaleString('ar-EG')}</p>
                  <p className="text-xs font-bold border-b border-black pb-2">
                      رقم الفاتورة: #{lastOrderForPrint.orderData.referenceNumber || lastOrderForPrint.orderData.id} - 
                      {lastOrderForPrint.orderData.orderType === 'dine-in' ? ` محلي (طاولة ${lastOrderForPrint.orderData.tableNumber})` : lastOrderForPrint.orderData.orderType === 'takeaway' ? ' سفري' : ' توصيل'}
                  </p>
              </div>
              
              <table className="w-full text-xs text-right mb-4">
                  <thead>
                      <tr className="border-b border-black">
                          <th className="py-1">الصنف</th>
                          <th className="py-1 text-center">الكمية</th>
                          <th className="py-1 text-left">السعر</th>
                      </tr>
                  </thead>
                  <tbody>
                      {lastOrderForPrint.cart.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-300 border-dashed">
                              <td className="py-1">
                                  <div>{item.name}</div>
                                  {item.variantName && <div className="text-[10px] text-gray-700">النوع: {item.variantName}</div>}
                                  {item.selectedModifiers && item.selectedModifiers.map((mod, midx) => (
                                      <div key={midx} className="text-[10px] text-gray-700">- {mod.modifierName}: {mod.optionName}</div>
                                  ))}
                                  {item.itemNote && <div className="text-[10px] text-gray-600">*{item.itemNote}</div>}
                              </td>
                              <td className="py-1 text-center">{item.quantity}</td>
                              <td className="py-1 text-left">{formatCurrency(item.price * item.quantity)}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>

              <div className="border-t border-black pt-2 mb-4 text-sm font-bold">
                  <div className="flex justify-between mb-1">
                      <span>المجموع:</span>
                      <span>{formatCurrency(lastOrderForPrint.orderData.subtotalAmount || 0)}</span>
                  </div>
                  {lastOrderForPrint.orderData.taxAmount > 0 && (
                      <div className="flex justify-between mb-1">
                          <span>الضريبة:</span>
                          <span>{formatCurrency(lastOrderForPrint.orderData.taxAmount)}</span>
                      </div>
                  )}
                  <div className="flex justify-between text-base mt-2 pt-2 border-t border-black">
                      <span>الإجمالي المطلوب:</span>
                      <span>{formatCurrency(lastOrderForPrint.orderData.totalAmount)} {currencyLabel}</span>
                  </div>
              </div>

              <div className="text-center text-xs mt-6 pt-4 border-t border-black border-dashed">
                  <p>طريقة الدفع: {lastOrderForPrint.orderData.paymentMethod === 'cash' ? 'نقدي' : 'بطاقة'}</p>
                  <p className="font-bold mt-2">شكراً لزيارتكم!</p>
              </div>
          </div>
      )}

      {/* POS Settings Drawer */}
      <POSSettingsDrawer 
          isOpen={isPOSSettingsModalOpen}
          onClose={() => setIsPOSSettingsModalOpen(false)}
          settings={settings as any}
          overallScale={overallScale} setOverallScale={setOverallScale}
          gridScale={gridScale} setGridScale={setGridScale}
          cartScale={cartScale} setCartScale={setCartScale}
      />

      {/* Price Checker Modal */}
      <PriceCheckModal 
          isOpen={isPriceCheckModalOpen}
          onClose={() => setIsPriceCheckModalOpen(false)}
          products={products}
          formatCurrency={formatCurrency}
      />
      
      {/* Shortcuts Modal */}
      <ShortcutsModal 
          isOpen={isShortcutsModalOpen}
          onClose={() => setIsShortcutsModalOpen(false)}
      />
      
      {/* Orders History Modal */}
      <OrdersHistoryModal 
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          onRecallOrder={() => {}}
          onPrintReceipt={() => {}}
          formatCurrency={formatCurrency}
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

      {/* Custom Item Modal */}
      <CustomItemModal 
          isOpen={isCustomItemModalOpen}
          onClose={() => setIsCustomItemModalOpen(false)}
          addCustomItem={(item: any) => addToCart({ ...item, id: Math.random() } as unknown as Product)}
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

      {selectedProductForVariants && (
          <VariantModal
              isOpen={isVariantModalOpen}
              onClose={() => {
                  setIsVariantModalOpen(false);
                  setSelectedProductForVariants(null);
              }}
              selectedProductForVariants={selectedProductForVariants}
              handleVariantSelect={handleVariantConfirm}
              formatCurrency={formatCurrency}
          />
      )}
      
      {selectedProductForModifiers && (
          <ModifierModal
              isOpen={isModifierModalOpen}
              onClose={() => {
                  setIsModifierModalOpen(false);
                  setSelectedProductForModifiers(null);
              }}
              product={selectedProductForModifiers}
              onConfirm={handleModifierConfirm}
              formatCurrency={formatCurrency}
          />
      )}
    </>
  );
};
