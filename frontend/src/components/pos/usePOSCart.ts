import { useState, useMemo, useCallback, useEffect } from 'react';
import { db } from '../../db';
import { CartItem, Product, ProductUnit, ProductSerial, Customer, Promotion, Category } from '../../types';
import { CalculationEngine } from '../../services/SalesService';
import { calculateDiscount } from '../../utils/promotions';
import { withPermissionCheck } from '../../utils/permissions';
import { logActivity } from '../../utils/logger';

export const usePOSCart = (
  isWholesale: boolean,
  selectedCustomerId: number | null,
  selectedWarehouseId: number | null,
  stockMap: Map<number, number>,
  settings: any,
  customers: Customer[] | undefined,
  promotions: Promotion[] | undefined,
  dbCategories: Category[] | undefined,
  promoCode: string,
  orderType: string,
  deliveryFee: number,
  success: (msg: string) => void,
  showError: (msg: string) => void
) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isQuantityMode, setIsQuantityMode] = useState(false);
  const [isQtyModalOpen, setIsQtyModalOpen] = useState(false);
  const [pendingProductToAdd, setPendingProductToAdd] = useState<Product | null>(null);
  const [qtyInput, setQtyInput] = useState<string>('1');

  // Modals States
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<Product | null>(null);
  const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);
  const [selectedProductForModifiers, setSelectedProductForModifiers] = useState<Product | null>(null);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [selectedProductForUnits, setSelectedProductForUnits] = useState<Product | null>(null);
  const [isSerialScanModalOpen, setIsSerialScanModalOpen] = useState(false);
  const [productForSerialScan, setProductForSerialScan] = useState<Product | null>(null);
  const [availableSerials, setAvailableSerials] = useState<ProductSerial[]>([]);
  const [serialScanInput, setSerialScanInput] = useState('');

  // Line Item States
  const [isLineItemModalOpen, setIsLineItemModalOpen] = useState(false);
  const [editingCartItemId, setEditingCartItemId] = useState<string | null>(null);
  const [lineItemDiscount, setLineItemDiscount] = useState<string>('');
  const [lineItemNote, setLineItemNote] = useState<string>('');
  const [lineItemPriceOverride, setLineItemPriceOverride] = useState<string>('');

  // Refund and Tax overrides
  const [isRefundMode, setIsRefundMode] = useState(false); 
  const [isTaxEnabled, setIsTaxEnabled] = useState(true); 
  const [isCustomItemModalOpen, setIsCustomItemModalOpen] = useState(false);

  // Discount options
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [loyaltyPointsUsed, setLoyaltyPointsUsed] = useState(0);

  const taxRate = isTaxEnabled ? (settings?.taxRate || 0) : 0;

  const applyCartPricingRules = useCallback((cartItems: CartItem[]): CartItem[] => {
    const qtyByProduct = cartItems.reduce((acc, item) => {
      if (!item.id) return acc;
      const factor = item.selectedUnit ? item.selectedUnit.conversionFactor : 1;
      acc[item.id] = (acc[item.id] || 0) + (item.quantity * factor);
      return acc;
    }, {} as Record<number, number>);

    return cartItems.map(item => {
      if (!item.id || item.isManuallyPriced) return item;
      let basePrice = item.originalPrice !== undefined ? item.originalPrice : item.price;
      let newPrice = basePrice;
      let newDiscount = item.itemDiscount || 0;
      let appliedNote = '';
      
      if (isWholesale && item.wholesaleDiscount) {
        newDiscount = item.wholesaleDiscountType === 'percentage' 
          ? (basePrice * item.wholesaleDiscount / 100) 
          : item.wholesaleDiscount;
        appliedNote = `خصم جمله: ${item.wholesaleDiscountType === 'percentage' ? item.wholesaleDiscount + '%' : item.wholesaleDiscount}`;
      } else if (!isWholesale && item.retailDiscount) {
        newDiscount = item.retailDiscountType === 'percentage' 
          ? (basePrice * item.retailDiscount / 100) 
          : item.retailDiscount;
        appliedNote = `خصم قطاعي: ${item.retailDiscountType === 'percentage' ? item.retailDiscount + '%' : item.retailDiscount}`;
      }
      
      const totalQty = qtyByProduct[item.id];
      if (item.priceTiers && item.priceTiers.length > 0) {
        const sortedTiers = [...item.priceTiers].sort((a,b) => b.minQuantity - a.minQuantity);
        const appliedTier = sortedTiers.find(t => totalQty >= t.minQuantity);
        if (appliedTier) {
          const factor = item.selectedUnit ? item.selectedUnit.conversionFactor : 1;
          newPrice = appliedTier.price * factor; 
          appliedNote = (appliedNote ? appliedNote + ' | ' : '') + `شريحة: +${appliedTier.minQuantity}`;
        }
      }

      if (item.customerPriceInfo) {
        newPrice = item.customerPriceInfo.price;
        appliedNote = (appliedNote ? appliedNote + ' | ' : '') + `سعر مخصص للعميل`;
      }
      return { ...item, price: newPrice, itemDiscount: newDiscount, offerAppliedNote: appliedNote || undefined };
    });
  }, [isWholesale]);

  const handleSetCart = useCallback((updater: React.SetStateAction<CartItem[]>) => {
    setCart(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (next.length === 0) return next;
      return applyCartPricingRules(next);
    });
  }, [applyCartPricingRules]);

  useEffect(() => {
    handleSetCart(prev => [...prev]);
  }, [selectedCustomerId, handleSetCart]);

  const getAvailableStock = useCallback((product: Product) => {
    if (product.type === 'composite' && product.composition && product.composition.length > 0) {
      const maxQuantities = product.composition.map(comp => {
        const ingredientStock = stockMap.get(comp.productId) || 0;
        return Math.floor(ingredientStock / comp.quantity);
      });
      return Math.min(...maxQuantities);
    }
    return stockMap.get(product.id!) || 0;
  }, [stockMap]);

  const addToCart = useCallback((product: Product, quantityToAdd: number, variantName?: string, unit?: ProductUnit, serials?: string[], modifiers?: { modifierName: string; option: any }[]) => {
    let availableStock = 999999;
    const factor = unit ? unit.conversionFactor : 1;
    const stockDeduction = quantityToAdd * factor;

    if (product.id && product.id > 0) {
      availableStock = getAvailableStock(product);
      const currentCartUsage = cart.reduce((sum, item) => item.id === product.id ? sum + (item.quantity * (item.selectedUnit?.conversionFactor || 1)) : sum, 0);

      if (!settings?.posSettings?.allowNegativeStock && !isRefundMode && product.type === 'simple' && availableStock < currentCartUsage + stockDeduction) {
        showError(`الكمية غير متوفرة. رصيد المخزن (وحدة أساسية): ${availableStock}`);
        return;
      }
    }
    
    const finalQty = isRefundMode ? -Math.abs(quantityToAdd) : quantityToAdd;
    let baseProductPrice = isWholesale && product.wholesalePrice !== undefined && product.wholesalePrice > 0 ? product.wholesalePrice : product.price;

    let defaultPrice = unit ? unit.price : baseProductPrice;
    let finalPrice = defaultPrice;
    let customerPriceInfo: any = null;

    if (settings?.posSettings?.rememberCustomerPrices && selectedCustomerId && product.id) {
      const cust = customers?.find(c => c.id === selectedCustomerId);
      if (cust?.lastPurchasedPrices?.[product.id]) {
        const remembered = cust.lastPurchasedPrices[product.id];
        if (unit ? remembered.unitName === unit.name : (!remembered.unitName)) {
          finalPrice = remembered.price;
          customerPriceInfo = remembered;
        }
      }
    }

    if (modifiers && modifiers.length > 0) {
      finalPrice += modifiers.reduce((sum, mod) => sum + mod.option.price, 0);
    }

    handleSetCart(prev => {
      const mappedModifiers = modifiers ? modifiers.map(m => ({ modifierName: m.modifierName, optionName: m.option.name, price: m.option.price })) : undefined;
      if (product.trackSerial) {
        return [...prev, { ...product, name: variantName ? `${product.name} (${variantName})` : product.name, price: finalPrice, originalPrice: defaultPrice, quantity: finalQty, stock: availableStock, cartItemId: crypto.randomUUID(), itemDiscount: 0, itemNote: '', variantName, selectedUnit: unit, serials, costPrice: product.costPrice || 0, selectedModifiers: mappedModifiers, customerPriceInfo }];
      }

      const existing = prev.find(item => item.id === product.id && (item.variantName || '') === (variantName || '') && (item.selectedUnit?.name || '') === (unit?.name || '') && !item.itemNote);
      if (existing) {
        return prev.map(item => item.cartItemId === existing.cartItemId ? { ...item, quantity: item.quantity + finalQty } : item);
      }
      return [...prev, { ...product, name: variantName ? `${product.name} (${variantName})` : product.name, price: finalPrice, originalPrice: defaultPrice, costPrice: product.costPrice || 0, quantity: finalQty, stock: availableStock, cartItemId: crypto.randomUUID(), itemDiscount: 0, itemNote: '', variantName, selectedUnit: unit, serials, selectedModifiers: mappedModifiers, customerPriceInfo }];
    });
  }, [isWholesale, selectedCustomerId, cart, settings, isRefundMode, customers, getAvailableStock, handleSetCart, showError]);

  const addWithChecks = useCallback((product: Product, qty: number, variant?: string, unit?: ProductUnit, serials?: string[], modifiers?: { modifierName: string; option: any }[]) => {
    if (isQuantityMode && !product.trackSerial) { 
      setPendingProductToAdd(product);
      setQtyInput('1');
      setIsQtyModalOpen(true);
    } else {
      addToCart(product, qty, variant, unit, serials, modifiers);
    }
  }, [isQuantityMode, addToCart]);

  const handleProductClick = async (product: Product) => {
    if (product.trackSerial && !isRefundMode) {
      const serials = await db.productSerials.where({ productId: product.id, status: 'available', warehouseId: selectedWarehouseId }).toArray();
      setProductForSerialScan(product);
      setAvailableSerials(serials);
      setIsSerialScanModalOpen(true);
      setSerialScanInput('');
      return;
    }
    if (product.variants && product.variants.length > 0) {
      setSelectedProductForVariants(product);
      setIsVariantModalOpen(true);
      return;
    }
    if (product.units && product.units.length > 0) {
      setSelectedProductForUnits(product);
      setIsUnitModalOpen(true);
      return;
    }
    if (product.modifiers && product.modifiers.length > 0) {
      setSelectedProductForModifiers(product);
      setIsModifierModalOpen(true);
      return;
    }
    addWithChecks(product, 1);
  };

  const removeFromCart = useCallback((cartItemId: string) => {
    const currentUserData = localStorage.getItem('nima_user');
    const user = currentUserData ? JSON.parse(currentUserData) : { id: 1, name: 'Admin', role: 'admin' };
    const authorizedRemove = withPermissionCheck(user, null, 'void_item', () => {
      handleSetCart(prev => {
        const item = prev.find(i => i.cartItemId === cartItemId);
        if (item && item.id !== 0) logActivity('security', 'Item Removed from Cart', `Removed ${item.name}`, item.price * item.quantity);
        return prev.filter(item => item.cartItemId !== cartItemId);
      });
    });
    try { authorizedRemove(); } catch (err: any) { showError(err.message); }
  }, [handleSetCart, showError]);

  const updateQuantity = useCallback((cartItemId: string, delta: number) => {
    handleSetCart(prev => {
      const item = prev.find(i => i.cartItemId === cartItemId);
      if (!item) return prev;
      if (item.trackSerial) {
        showError("لا يمكن تعديل كمية العناصر ذات الأرقام التسلسلية.");
        return prev;
      }
      const newQty = item.quantity + delta;
      if (newQty === 0) return prev.filter(i => i.cartItemId !== cartItemId);
      return prev.map(item => item.cartItemId === cartItemId ? { ...item, quantity: newQty } : item);
    });
  }, [handleSetCart, showError]);

  // Modal selector confirmations
  const handleVariantSelect = (variant: { name: string, price: number }) => {
    if (!selectedProductForVariants) return;
    const pWithVar = { ...selectedProductForVariants, price: variant.price > 0 ? variant.price : selectedProductForVariants.price, _tempVariantName: variant.name };
    setIsVariantModalOpen(false);
    if (selectedProductForVariants.units?.length) {
      setSelectedProductForUnits(pWithVar);
      setIsUnitModalOpen(true);
    } else {
      addWithChecks(pWithVar, 1, variant.name);
    }
    setSelectedProductForVariants(null);
  };

  const handleUnitSelect = (unit: ProductUnit) => {
    if (!selectedProductForUnits) return;
    setIsUnitModalOpen(false);
    addToCart(selectedProductForUnits, 1, (selectedProductForUnits as any)._tempVariantName, unit);
    setSelectedProductForUnits(null);
  };

  const handleModifierConfirm = (mods: any[]) => {
    if (!selectedProductForModifiers) return;
    addToCart(selectedProductForModifiers, 1, (selectedProductForModifiers as any)._tempVariantName, (selectedProductForModifiers as any)._tempUnit, undefined, mods);
    setIsModifierModalOpen(false);
    setSelectedProductForModifiers(null);
  };

  const handleSerialConfirm = (serial: string) => {
    if (!productForSerialScan) return;
    addToCart(productForSerialScan, 1, undefined, undefined, [serial]);
    setIsSerialScanModalOpen(false);
  };

  const confirmQuantityAdd = () => {
    const qty = parseFloat(qtyInput);
    if (pendingProductToAdd && qty > 0) addToCart(pendingProductToAdd, qty);
    setIsQtyModalOpen(false);
    setPendingProductToAdd(null);
    setQtyInput('1');
  };

  const totals = useMemo(() => {
    const customer = customers?.find(c => c.id === selectedCustomerId);
    const promoResult = calculateDiscount(cart, promotions || [], dbCategories || [], customer, promoCode);
    return CalculationEngine.calculateTotals(cart, discountType, discountValue, taxRate, orderType as any, deliveryFee, settings, promoResult, loyaltyPointsUsed);
  }, [cart, taxRate, discountValue, discountType, loyaltyPointsUsed, orderType, deliveryFee, promotions, selectedCustomerId, customers, promoCode, settings, dbCategories]);

  return {
    cart, setCart, handleSetCart, isQuantityMode, setIsQuantityMode, isQtyModalOpen, setIsQtyModalOpen, pendingProductToAdd, qtyInput, setQtyInput,
    isVariantModalOpen, setIsVariantModalOpen, selectedProductForVariants, isModifierModalOpen, setIsModifierModalOpen,
    selectedProductForModifiers, isUnitModalOpen, setIsUnitModalOpen, selectedProductForUnits, isSerialScanModalOpen,
    setIsSerialScanModalOpen, productForSerialScan, availableSerials, serialScanInput, setSerialScanInput,
    isLineItemModalOpen, setIsLineItemModalOpen, editingCartItemId, setEditingCartItemId,
    lineItemDiscount, setLineItemDiscount, lineItemNote, setLineItemNote, lineItemPriceOverride, setLineItemPriceOverride,
    isRefundMode, setIsRefundMode, isTaxEnabled, setIsTaxEnabled, isCustomItemModalOpen, setIsCustomItemModalOpen,
    discountValue, setDiscountValue, discountType, setDiscountType, loyaltyPointsUsed, setLoyaltyPointsUsed,
    totals, taxRate, addToCart, removeFromCart, updateQuantity, handleProductClick,
    handleVariantSelect, handleUnitSelect, handleModifierConfirm, handleSerialConfirm, confirmQuantityAdd,
    handleBaseUnitSelect: () => { if (selectedProductForUnits) { addToCart(selectedProductForUnits, 1); setIsUnitModalOpen(false); setSelectedProductForUnits(null); } }
  };
};
