import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { usePOSData } from '../components/pos/usePOSData';
import { usePOSCart } from '../components/pos/usePOSCart';
import { usePOSActions } from '../components/pos/usePOSActions';
import { POSView } from '../components/pos/POSView';

const POS: React.FC = () => {
  const { success, error: showError } = useToast();
  const location = useLocation();
  const isWholesale = location.pathname.includes('/wholesale');
  const isAccountingOnly = location.pathname.includes('/accounting-wholesale');

  // Input states
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'categories'>('grid');
  const [autoFocusEnabled, setAutoFocusEnabled] = useState(true);

  // Search references & input debouncing
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 220);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleReadScaleWeight = async () => {
    success("تم قراءة الوزن بنجاح من الميزان الإلكتروني");
  };

  // Shared States for real-time reactivity between POS hooks
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);
  const [selectedSalespersonId, setSelectedSalespersonId] = useState<number | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [orderType, setOrderType] = useState<'takeaway' | 'dine-in' | 'delivery' | 'direct' | 'receive' | 'deliver' | 'maintenance'>('takeaway');
  const [promoCode, setPromoCode] = useState('');
  const [delivery, setDelivery] = useState({ address: '', phone: '', fee: 0 });
  const [maintenance, setMaintenance] = useState({ serial: '', issue: '', attachments: '', dueDate: '' });
  const [activeHeldOrderId, setActiveHeldOrderId] = useState<number | null>(null);

  // 1. Data Loading Hook
  const pData = usePOSData(
    isWholesale,
    false,
    '',
    debouncedSearch,
    selectedCategory,
    selectedWarehouseId,
    setSelectedWarehouseId,
    selectedUser,
    setSelectedUser,
    success,
    showError
  );

  // 2. State & Cart operations Hook
  const pCart = usePOSCart(
    isWholesale,
    selectedCustomerId,
    selectedWarehouseId,
    pData.stockMap,
    pData.settings,
    pData.customers,
    pData.promotions,
    pData.dbCategories,
    promoCode,
    orderType,
    delivery.fee,
    success,
    showError
  );

  // 3. User & Checkout actions Hook
  const pActions = usePOSActions(
    pCart.cart,
    pCart.handleSetCart,
    pCart.totals,
    isWholesale,
    pCart.isRefundMode,
    pCart.setIsRefundMode,
    pData.settings,
    pData.customers,
    pData.users,
    pData.activeShifts,
    activeHeldOrderId,
    setActiveHeldOrderId,
    selectedCustomerId,
    setSelectedCustomerId,
    selectedSalespersonId,
    setSelectedSalespersonId,
    selectedWarehouseId,
    setSelectedWarehouseId,
    orderType,
    setOrderType,
    promoCode,
    setPromoCode,
    delivery,
    setDelivery,
    maintenance,
    setMaintenance,
    success,
    showError
  );

  const filteredProducts = pData.products || [];

  const formatCurrency = (amount: number) => {
    const currencyCode = pData.settings?.currency || 'EGP';
    return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount)} ${currencyCode === 'EGP' ? 'ج.م' : currencyCode}`;
  };

  // Hotkey keyboard handler hook
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2' && pCart.cart.length > 0 && !pActions.isPaymentModalOpen) {
        e.preventDefault();
        pActions.initiatePayment(selectedUser);
      }
      if (e.key === 'F3' && pCart.cart.length > 0 && !pActions.isPaymentModalOpen) {
        e.preventDefault();
        pActions.handleFastCash(selectedUser);
      }
      if (e.key === 'F4') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'F8' && pCart.cart.length > 0) {
        e.preventDefault();
        pActions.handleHoldOrder();
      }
      if (e.key === 'F9') {
        e.preventDefault();
        pCart.setIsRefundMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [pCart.cart, pActions, selectedUser]);

  return (
    <POSView
      isWholesale={isWholesale}
      isAccountingOnly={isAccountingOnly}
      selectedUser={selectedUser}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      debouncedSearch={debouncedSearch}
      selectedCategory={selectedCategory}
      setSelectedCategory={setSelectedCategory}
      viewMode={viewMode}
      setViewMode={setViewMode}
      autoFocusEnabled={autoFocusEnabled}
      setAutoFocusEnabled={setAutoFocusEnabled}
      selectedSalespersonId={selectedSalespersonId}
      setSelectedSalespersonId={setSelectedSalespersonId}
      selectedWarehouseId={selectedWarehouseId}
      setSelectedWarehouseId={setSelectedWarehouseId}
      pData={pData}
      pCart={pCart}
      pActions={pActions}
      searchInputRef={searchInputRef}
      handleSearchSubmit={handleSearchSubmit}
      handleReadScaleWeight={handleReadScaleWeight}
      formatCurrency={formatCurrency}
      filteredProducts={filteredProducts}
      success={success}
    />
  );
};

export default POS;
