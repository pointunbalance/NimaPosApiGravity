import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { appEventBus } from '../../lib/eventBus';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../db';
import { Product, Order, Category, Table as TableType, AppSettings, CartItem } from '../../types';
import { 
  Utensils, ShoppingBag, Truck, ChefHat, Search, Plus, Minus, Trash2, 
  CreditCard, Banknote, MessageSquare, ChevronRight, X, Clock, Armchair,
  Receipt, LayoutGrid, Coffee, Flame, Info, Printer, Settings as SettingsIcon,
  RotateCcw, Unlock, History, ScanBarcode, Keyboard, PauseCircle, Monitor, Users
} from 'lucide-react';
import { SalesService, CalculationEngine } from '../../services/SalesService';
import { useToast } from '../../context/ToastContext';
import { logActivity } from '../../utils/logger';
import { POSCategoryGrid } from '../../components/pos/POSCategoryGrid';
import { ProductGrid } from '../../components/pos/ProductGrid';
import { RestaurantPOSModalsContainer } from '../../components/restaurant/RestaurantPOSModalsContainer';
import { PrinterMonitor } from '../../components/ui/PrinterMonitor';
import { printQueue } from '../../services/PrintQueueService';
import { menuCache } from '../../services/MenuCacheService';
import { withPermissionCheck, hasPermission } from '../../utils/permissions';
import { generateReferenceNumber } from '../../utils/generateReference';
import InvoiceModal from '../../components/InvoiceModal';

const getProductImage = (product: Product) => {
    if (product.image) return product.image;
    
    const nameStr = product.name || '';
    if (nameStr.includes('برجر')) return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%2394a3b8'%3Eصورة%3C/text%3E%3C/svg%3E`;
}

const RestaurantProductImage = ({ src, alt, renderFallback }: { src: string; alt: string; renderFallback: () => React.ReactNode }) => {
    const [error, setError] = useState(false);
    if (error) return <>{renderFallback()}</>;
    return <img src={src} alt={alt} onError={() => setError(true)} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />;
};

const RestaurantPOS: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const initialTable = location.state?.tableNumber || '';
  const initialOrderType = location.state?.orderType || 'dine-in';

  // --- State ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeHeldOrderId, setActiveHeldOrderId] = useState<number | null>(null);
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway' | 'delivery'>(initialOrderType);
  const [selectedTable, setSelectedTable] = useState<string>(initialTable);
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: number; name: string; phone?: string; loyaltyPoints?: number } | null>(null);

  const handleQuickCustomerAdd = async (data: { name: string; phone: string }) => {
      try {
          // Check if customer exists by phone
          const existing = await db.customers.where('phone').equals(data.phone).first();
          if (existing) {
              setSelectedCustomer({ id: existing.id!, name: existing.name, phone: existing.phone, loyaltyPoints: existing.loyaltyPoints || 0 });
              success('تم العثور على العميل وإضافته للفاتورة');
          } else {
              // Add new customer
              const customerId = await db.customers.add({
                  name: data.name,
                  phone: data.phone,
                  totalSpent: 0,
                  loyaltyPoints: 0,
                  createdAt: new Date(),
              });
              setSelectedCustomer({ id: customerId as number, name: data.name, phone: data.phone, loyaltyPoints: 0 });
              success('تم إنشاء العميل وإضافته للفاتورة');
          }
          setIsQuickCustomerModalOpen(false);
      } catch (e: any) {
          console.error(e);
          error('حدث خطأ أثناء حفظ العميل');
      }
  };
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [existingOrderId, setExistingOrderId] = useState<number | null>(null);
  const [isRefundMode, setIsRefundMode] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'categories' | 'bento' | 'compact'>('bento');

  // Modals
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [activeNoteItem, setActiveNoteItem] = useState<CartItem | null>(null);
  const [tempNote, setTempNote] = useState('');
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [voidItemDetails, setVoidItemDetails] = useState<{ cartItemId: string, quantity: number, name: string } | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProformaInvoiceOpen, setIsProformaInvoiceOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isPOSSettingsModalOpen, setIsPOSSettingsModalOpen] = useState(false);
  
  // Missing Feature Modals from POS
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isPriceCheckModalOpen, setIsPriceCheckModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isCustomItemModalOpen, setIsCustomItemModalOpen] = useState(false);
  const [isHeldOrdersModalOpen, setIsHeldOrdersModalOpen] = useState(false);
  const [isSplitCheckModalOpen, setIsSplitCheckModalOpen] = useState(false);
  const [isQuickCustomerModalOpen, setIsQuickCustomerModalOpen] = useState(false);
  const [loyaltyRedeemedPoints, setLoyaltyRedeemedPoints] = useState(0);

  // Custom visual notification and warning modes
  const [tableRequiredPulse, setTableRequiredPulse] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  // Print state
  const receiptRef = useRef<HTMLDivElement>(null);
  const [lastOrderForPrint, setLastOrderForPrint] = useState<{orderData: any, cart: CartItem[]} | null>(null);

  // Settings Scaling States
  const [overallScale, setOverallScale] = useState(1);
  const [gridScale, setGridScale] = useState(1);
  const [cartScale, setCartScale] = useState(1);

  // --- Data Fetching ---
  const activeShifts = useLiveQuery(() => db.shifts.where('status').equals('open').toArray(), []);
  const currentInventory = useLiveQuery(() => db.inventory.toArray(), []) || [];
  
  const [products, setProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  useEffect(() => {
     menuCache.initialize().then(() => {
         setProducts(menuCache.getAllProducts());
         setAllCategories(menuCache.getCategories());
     });
     
     const unsubscribe = menuCache.subscribe(() => {
         setProducts(menuCache.getAllProducts());
         setAllCategories(menuCache.getCategories());
     });
     return unsubscribe;
  }, []);
  
  // Deduplicate categories by name
  const categories = useMemo(() => {
     const unique = new Map();
     for (const cat of allCategories) {
        if (!unique.has(cat.name)) {
            unique.set(cat.name, cat);
        }
     }
     return ['الكل', ...Array.from(unique.values()).map(c => c.name)];
  }, [allCategories]);

  const stockMap = useMemo(() => {
      const map = new Map<number, number>();
      if (currentInventory) currentInventory.forEach(item => map.set(item.productId, item.quantity));
      return map;
  }, [currentInventory]);

  // Power Outage Protection: Load active cart state
  useEffect(() => {
      try {
          const savedStr = localStorage.getItem('activeCartState_RestaurantPOS');
          if (savedStr) {
              const saved = JSON.parse(savedStr);
              if (saved && saved.cart && saved.cart.length > 0) {
                  setCart(saved.cart);
                  if (saved.orderType) setOrderType(saved.orderType);
                  if (saved.selectedTable) setSelectedTable(saved.selectedTable);
                  if (saved.activeHeldOrderId) setActiveHeldOrderId(saved.activeHeldOrderId);
              }
          }
      } catch(e) {}
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Power Outage Protection: Save active cart state on change
  useEffect(() => {
      try {
          localStorage.setItem('activeCartState_RestaurantPOS', JSON.stringify({
              cart, orderType, selectedTable, activeHeldOrderId
          }));
      } catch(e) {}
  }, [cart, orderType, selectedTable, activeHeldOrderId]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

        switch (e.key) {
            case 'F2':
            case 'F4':
                e.preventDefault();
                handleOpenPaymentModal();
                break;
            case 'F3':
                e.preventDefault();
                document.getElementById('fast-cash-btn')?.click();
                break;
            case 'Escape':
            case 'Esc':
                e.preventDefault();
                if (cart.length > 0) {
                    setIsConfirmClearOpen(true);
                }
                break;
            case 'F5':
                e.preventDefault();
                setCart([]);
                setExistingOrderId(null);
                setSelectedTable('');
                success("تم تفريغ الطلب (F5)");
                break;
            case 'F8':
                 e.preventDefault();
                 setIsTableModalOpen(true);
                 break;
            case 'F9':
                e.preventDefault();
                setIsRefundMode(prev => !prev);
                success(isRefundMode ? "تم إلغاء وضع المرتجع (F9)" : "تم تفعيل وضع المرتجع (F9)");
                break;
            case 'h':
            case 'H':
                if (e.ctrlKey) {
                    e.preventDefault();
                    setIsHistoryModalOpen(true);
                }
                break;
            case 'p':
            case 'P':
                if (e.ctrlKey) {
                    e.preventDefault();
                    setIsPriceCheckModalOpen(true);
                }
                break;
        }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isRefundMode, cart.length]);

  const tables = useLiveQuery(() => db.diningTables.toArray(), []) || [];
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  
  const currency = settings?.currencyCode || 'IQD';
  const taxRate = settings?.taxRate || 0;
  const storeName = settings?.storeName || 'إدارة المطعم';

  const isEnabled = (key: keyof NonNullable<AppSettings['posSettings']>) => {
      if (!settings?.posSettings) return key !== 'wholesaleShowPrices';
      if (settings.posSettings[key] === undefined) return key !== 'wholesaleShowPrices';
      return settings.posSettings[key];
  };

  const handleOpenCashDrawer = () => {
      success('تم إرسال أمر فتح الدرج (محاكاة)');
  };

  const handlePrintLastBill = async () => {
    const orders = await db.orders.orderBy('id').reverse().limit(1).toArray();
    if (orders.length > 0) {
        const order = orders[0];
        setLastOrderForPrint({ orderData: order, cart: order.items as unknown as CartItem[] });
        setTimeout(() => {
            window.print();
        }, 100);
    } else {
        error("لا توجد فواتير سابقة");
    }
  };

  const heldOrders = useLiveQuery(() => db.heldOrders.toArray(), []) || [];

  const handleHoldOrder = async (clearCart = true) => {
      if (cart.length === 0) {
          if (activeHeldOrderId) {
              await db.heldOrders.delete(activeHeldOrderId);
              if (clearCart) setActiveHeldOrderId(null);
          }
          return;
      }
      
      const payload = { 
          date: new Date(), 
          items: cart, 
          orderType,
          tableId: selectedTable || undefined
      };

      if (activeHeldOrderId) {
          await db.heldOrders.update(activeHeldOrderId, payload);
      } else {
          const id = await db.heldOrders.add(payload);
          if (!clearCart) setActiveHeldOrderId(id as number);
      }
      
      if (clearCart) {
          setCart([]);
          setExistingOrderId(null);
          setSelectedTable('');
          setActiveHeldOrderId(null);
          success('تم إضافة فاتورة معلقة جديدة وفتح فاتورة فارغة');
      }
  };

  const handleRetrieveOrder = async (id: number) => {
      const held = await db.heldOrders.get(id);
      if (held) {
          setCart(held.items); 
          setOrderType((held.orderType as any) || 'takeaway');
          setSelectedTable(held.tableId || '');
          setActiveHeldOrderId(id);
          setIsHeldOrdersModalOpen(false);
      }
  };

  const handleDeleteHeldOrder = async (id: number) => {
      if (window.confirm('هل أنت متأكد من حذف هذا الطلب المعلق؟')) {
          await db.heldOrders.delete(id);
      }
  };

  // Load existing order if table is selected
  useEffect(() => {
    if (selectedTable && orderType === 'dine-in') {
      db.orders.where('tableNumber').equals(selectedTable).toArray().then(orders => {
        const activeOrder = orders.find(o => 
          o.orderType === 'dine-in' && 
          o.status !== 'completed' &&
          o.status !== 'refunded' && 
          o.fulfillmentStatus !== 'served'
        );
        if (activeOrder) {
           setCart(activeOrder.items.map((item: any) => ({
               ...item,
               id: item.productId,
               cartItemId: item.cartItemId || Math.random().toString(36).substr(2, 9)
           })));
           setExistingOrderId(activeOrder.id!);
           if (activeOrder.discountAmount) {
             setDiscountValue(activeOrder.discountAmount);
             setDiscountType('fixed');
           } else {
             setDiscountValue(0);
           }
           
           if (location.state?.action === 'pay') {
               setIsPaymentModalOpen(true);
           }
        } else {
           setCart([]);
           setExistingOrderId(null);
           setDiscountValue(0);
        }
      }).catch(err => {
        console.error("Error loading table order:", err);
      });
    }
  }, [selectedTable, orderType, location.state]);

  // Handle Print trigger after state updates
  useEffect(() => {
      if (lastOrderForPrint) {
          // Give React a tick to render the print receipt into DOM
          setTimeout(() => {
              window.print();
              setLastOrderForPrint(null); // Clear after print
          }, 300);
      }
  }, [lastOrderForPrint]);

  // --- Filtering ---
  const filteredProducts = useMemo(() => {
    return menuCache.searchProducts(searchTerm, selectedCategory);
  }, [products, selectedCategory, searchTerm]);

  // Item Selection Details
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<Product | null>(null);
  const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);
  const [selectedProductForModifiers, setSelectedProductForModifiers] = useState<Product | null>(null);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [tempDiscountInput, setTempDiscountInput] = useState('');

  // Brand-new Offers and Promotions state
  const [isOffersModalOpen, setIsOffersModalOpen] = useState(false);
  const offersList = useMemo(() => [
      { id: 'combo_1', name: 'باقة لـمّـة العيلة السعيدة 🍗🍟🥤', desc: 'خصم ٢٠٪ كامل على إجمالي السفرة والطلبات للطاولات الكبيرة والعوائل', discountVal: 20, type: 'percent', code: 'FAMILY20' },
      { id: 'happy_hour', name: 'باقة فطور ساعة السعادة للتحلية 🍰☕', desc: 'خصم ترويجي بقيمة ٥,٠٠٠ ج.م ثابتة لتطوير فترات الصباح وهناء يومك', discountVal: 5000, type: 'fixed', code: 'BREAKFAST5K' },
      { id: 'double_deal', name: 'باقة توفير العشاء المزدوج المقرمش 🍕', desc: 'خصم خاص بمقدار ١٠,٠٠٠ ج.م كاش فوري على جميع الوجبات والكومبوهات السريعة', discountVal: 10000, type: 'fixed', code: 'DINNER10K' },
  ], []);

  // --- Cart Calculations (Delegated to Computation Engine) ---
  const totals = useMemo(() => {
    return CalculationEngine.calculateTotals(
        cart,
        discountType,
        discountValue,
        taxRate,
        orderType,
        0, // No delivery fee here
        settings,
        undefined, // no promoResult object passed in Restaurant mode yet
        0 // No loyalty points used here
    );
  }, [cart, taxRate, discountValue, discountType, orderType, settings]);

  const { subtotal, discountAmount, tax, serviceChargeAmount, total } = totals;

  // --- Broadcast to Customer Display System (CDS) ---
  useEffect(() => {
      const channel = new BroadcastChannel('cds-channel');
      
      const broadcastState = () => {
          channel.postMessage({
              type: 'UPDATE_CDS',
              payload: {
                  cart,
                  subtotal,
                  discount: discountAmount,
                  tax,
                  total,
                  customerName: selectedCustomer ? selectedCustomer.name : null,
                  orderType,
                  selectedTable,
                  serviceCharge: serviceChargeAmount || 0,
                  businessType: 'restaurant'
              }
          });
      };

      broadcastState();

      channel.onmessage = (event) => {
          if (event.data.type === 'REQUEST_CDS_STATE') {
              broadcastState();
          }
      };

      return () => {
          channel.close();
      };
  }, [cart, subtotal, discountAmount, tax, total, selectedCustomer, orderType, selectedTable, serviceChargeAmount]);

  // --- Handlers ---
  const applyDiscount = () => {
      const currentUserData = localStorage.getItem('nima_user');
      const user = currentUserData ? JSON.parse(currentUserData) : { id: 1, name: 'Admin', role: 'admin' };

      if (!hasPermission(user, null, 'pos_discount') && !hasPermission(user, null, 'give_discount')) {
          error("ليس لديك صلاحية لإدراج خصومات يدوية على الفاتورة (pos_discount)");
          setIsDiscountModalOpen(false);
          return;
      }

      const val = parseFloat(tempDiscountInput);
      if (!isNaN(val) && val >= 0) {
          setDiscountValue(val);
          success(`تم تطبيق الخصم اليدوي بقيمة ${val} بنجاح`);
      } else {
          setDiscountValue(0);
      }
      setIsDiscountModalOpen(false);
      setTempDiscountInput('');
  };

  const handleOpenOffersModal = () => {
      const currentUserData = localStorage.getItem('nima_user');
      const user = currentUserData ? JSON.parse(currentUserData) : { id: 1, name: 'Admin', role: 'admin' };

      if (!hasPermission(user, null, 'pos_offers')) {
          error("عذراً! ليس لديك الصلاحية الأمنية الكافية لتقديم العروض الترويجية والكومبو (pos_offers)");
          return;
      }
      setIsOffersModalOpen(true);
  };

  const handleApplyOffer = (offer: any) => {
      setDiscountType(offer.type);
      setDiscountValue(offer.discountVal);
      success(`تم تفعيل العرض الترويجي "${offer.name}" بنجاح!`);
      setIsOffersModalOpen(false);
  };
  const handleProductClick = (product: Product) => {
      if (product.variants && product.variants.length > 0) {
          setSelectedProductForVariants(product);
          setIsVariantModalOpen(true);
          return;
      }
      
      if (product.modifiers && product.modifiers.length > 0) {
          setSelectedProductForModifiers(product);
          setIsModifierModalOpen(true);
          return;
      }

      addToCart(product);
  };

  const addWithDetails = (product: Product, variant?: string, modifiers?: { modifierName: string; option: any }[]) => {
      const qtyChange = isRefundMode ? -1 : 1;
      
      let basePrice = product.price;
      if (product.retailDiscount) {
          if (product.retailDiscountType === 'percentage') {
              basePrice = product.price - (product.price * (product.retailDiscount / 100));
          } else {
              basePrice = product.price - product.retailDiscount;
          }
      }

      let finalPrice = basePrice;
      if (modifiers && modifiers.length > 0) {
          const modifiersExtra = modifiers.reduce((sum: number, mod: any) => sum + mod.option.price, 0);
          finalPrice += modifiersExtra;
      }

      const mappedModifiers = modifiers ? modifiers.map(m => ({
          modifierName: m.modifierName,
          optionName: m.option.name,
          price: m.option.price
      })) : undefined;

      setCart(prevCart => {
          const existing = prevCart.find(item => 
              item.id === product.id && 
              !item.itemNote &&
              (item as any).variantName === variant &&
              JSON.stringify((item as any).selectedModifiers) === JSON.stringify(mappedModifiers)
          );

          if (existing) {
              return prevCart.map(item => item.cartItemId === existing.cartItemId ? { ...item, quantity: item.quantity + qtyChange } : item);
          } else {
              return [...prevCart, { 
                  ...product, 
                  name: variant ? `${product.name} (${variant})` : product.name,
                  price: finalPrice,
                  costPrice: product.costPrice || 0,
                  variantName: variant,
                  selectedModifiers: mappedModifiers,
                  quantity: qtyChange, 
                  cartItemId: Math.random().toString(36).substr(2, 9) 
              }] as any;
          }
      });
  };

  const handleModifierConfirm = (selectedModifiers: { modifierName: string; option: any }[]) => {
      if (!selectedProductForModifiers) return;
      addWithDetails(selectedProductForModifiers, (selectedProductForModifiers as any)._tempVariantName, selectedModifiers);
      setIsModifierModalOpen(false);
      setSelectedProductForModifiers(null);
  };

  const handleVariantConfirm = (variant: any) => {
      if (!selectedProductForVariants) return;
      
      const modifiedProduct = {
          ...selectedProductForVariants,
          price: variant.price > 0 ? variant.price : selectedProductForVariants.price,
          barcode: variant.barcode || selectedProductForVariants.barcode,
          _tempVariantName: variant.name
      };

      if (selectedProductForVariants.modifiers && selectedProductForVariants.modifiers.length > 0) {
          setIsVariantModalOpen(false);
          setSelectedProductForModifiers(modifiedProduct);
          setIsModifierModalOpen(true);
      } else {
          addWithDetails(modifiedProduct, variant.name);
          setIsVariantModalOpen(false);
          setSelectedProductForVariants(null);
      }
  };

  const addToCart = (product: Product) => {
      addWithDetails(product);
  };

  const triggerVoid = (cartItemId: string, quantityToRemove: number) => {
      const item = cart.find(i => i.cartItemId === cartItemId);
      if (!item) return;

      if (existingOrderId) {
          setVoidItemDetails({ cartItemId: item.cartItemId, quantity: quantityToRemove, name: item.name });
          setIsVoidModalOpen(true);
      } else {
          // If no existing order, just remove normally
          executeRemoveItem(cartItemId, quantityToRemove);
      }
  };

  const executeRemoveItem = (cartItemId: string, quantityToRemove: number) => {
      const currentUserData = localStorage.getItem('nima_user');
      const user = currentUserData ? JSON.parse(currentUserData) : { id: 1, name: 'Admin', role: 'admin' };
      
      const itemToLog = cart.find(i => i.cartItemId === cartItemId);
      
      const authorizedRemove = withPermissionCheck(user, null, 'void_item', () => {
          if (itemToLog) {
             const newQ = itemToLog.quantity - quantityToRemove;
             if (newQ <= 0) {
                 logActivity('security', 'إزالة صنف (مطعم)', `قام الموظف ${user.name} بإزالة ${itemToLog.name}`, itemToLog.price * itemToLog.quantity);
             } else {
                 logActivity('security', 'تقليل كمية صنف (مطعم)', `قام الموظف ${user.name} بتقليل كمية ${itemToLog.name} بمقدار ${quantityToRemove}`, itemToLog.price * quantityToRemove);
             }
          }
          setCart(prevCart => prevCart.map(item => {
              if (item.cartItemId === cartItemId) {
                  const newQ = item.quantity - quantityToRemove;
                  if (newQ <= 0) return null as any;
                  return { ...item, quantity: newQ };
              }
              return item;
          }).filter(Boolean));
      });

      try {
          authorizedRemove();
      } catch (err: any) {
          error(err.message);
      }
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
      const currentUserData = localStorage.getItem('nima_user');
      const user = currentUserData ? JSON.parse(currentUserData) : { id: 1, name: 'Admin', role: 'admin' };

      if (delta < 0) {
          const item = cart.find(i => i.cartItemId === cartItemId);
          if (item && item.quantity + delta <= 0 && existingOrderId) {
              triggerVoid(cartItemId, Math.abs(item.quantity));
              return;
          } else if (item && existingOrderId) {
               triggerVoid(cartItemId, Math.abs(delta));
               return;
          } else if (item) {
              // Permission check & Auditing if reducing/removing before order is saved
              try {
                  const authorizedRemove = withPermissionCheck(user, null, 'void_item', () => {
                      const newQ = item.quantity + delta;
                      if (newQ <= 0) {
                          logActivity('security', 'إزالة صنف (مطعم)', `قام الموظف ${user.name} بإزالة ${item.name} قبل الحفظ`, item.price * item.quantity);
                      } else {
                          logActivity('security', 'تقليل كمية صنف (مطعم)', `قام الموظف ${user.name} بتقليل كمية ${item.name} من ${item.quantity} إلى ${newQ} قبل الحفظ`, item.price * Math.abs(delta));
                      }
                  });
                  authorizedRemove();
              } catch (err: any) {
                  error(err.message);
                  return; // Stop update
              }
          }
      } else if (delta > 0) {
          const item = cart.find(i => i.cartItemId === cartItemId);
          if (item) {
              const newQ = item.quantity + delta;
              logActivity('sale', 'زيادة كمية صنف (مطعم)', `قام الموظف ${user.name} بزيادة كمية ${item.name} من ${item.quantity} إلى ${newQ}`, item.price * delta);
          }
      }
      
      setCart(prevCart => prevCart.map(item => {
          if (item.cartItemId === cartItemId) {
              const newQ = item.quantity + delta;
              if (newQ <= 0) return null as any;
              return { ...item, quantity: newQ };
          }
          return item;
      }).filter(Boolean));
  };

  const removeFromCart = (cartItemId: string) => {
      const item = cart.find(i => i.cartItemId === cartItemId);
      if (item) {
          triggerVoid(cartItemId, item.quantity);
      }
  };
  
  const handleVoidConfirm = async (reason: string, managerId?: number, managerName?: string) => {
      if (!voidItemDetails || !existingOrderId) return;
      
      const item = cart.find(i => i.cartItemId === voidItemDetails.cartItemId);
      if (!item) return;

      const order = await db.orders.get(existingOrderId);
      const currentUserData = localStorage.getItem('nima_user');
      const user = currentUserData ? JSON.parse(currentUserData) : { id: 1, name: 'Admin', role: 'admin' };
      
      if (!hasPermission(user, null, 'pos_returns') && !hasPermission(user, null, 'void_item')) {
          error("ليس لديك صلاحية لارتجاع أو إلغاء أو حذف أصناف الطلبات (pos_returns)");
          setIsVoidModalOpen(false);
          setVoidItemDetails(null);
          return;
      }
      
      const voidLog: any = { // Use any temporarily, or import VoidItemLog
          orderId: existingOrderId,
          referenceNumber: order?.referenceNumber || '',
          itemId: item.id || 0,
          itemName: item.name,
          quantity: voidItemDetails.quantity,
          voidReason: reason,
          voidedByUserId: user?.id || 0,
          voidedByUserName: user?.name || 'Unknown',
          approvedByManagerId: managerId,
          approvedByManagerName: managerName,
          date: new Date(),
          amount: item.price * voidItemDetails.quantity
      };
      
      await db.voidLogs.add(voidLog);
      
      if (voidLog.amount > 500) {
          import('../../utils/notifications').then(({ notificationService }) => {
              notificationService.addNotification(
                  "تنبيه إلغاء صنف (Void)", 
                  `تم إلغاء صنف "${item.name}" بقيمة ${voidLog.amount} ج.م. السبب: ${reason}`,
                  "warning"
              );
          });
      }

      // Now actually remove the item
      executeRemoveItem(voidItemDetails.cartItemId, voidItemDetails.quantity);
      setIsVoidModalOpen(false);
      setVoidItemDetails(null);
  };

  const openNotesModal = (item: CartItem) => {
      setActiveNoteItem(item);
      setTempNote(item.itemNote || '');
      setIsNotesModalOpen(true);
  };

  const saveNotes = () => {
      if (activeNoteItem) {
          setCart(prevCart => prevCart.map(item => 
              item.cartItemId === activeNoteItem.cartItemId ? { ...item, itemNote: tempNote } : item
          ));
      }
      setIsNotesModalOpen(false);
  };

  const buildOrderData = (status: 'completed' | 'refunded' | 'partial_refund' | 'draft', paymentMethod: string = 'cash', amountPaid: number = 0, fulfillmentStatus: 'pending'|'ready'|'served' = 'pending'): Partial<Order> => {
      return {
          customerId: selectedCustomer ? selectedCustomer.id : 0, 
          tableNumber: orderType === 'dine-in' ? selectedTable : undefined,
          items: cart.map(item => ({
              productId: item.id!,
              name: item.name,
              price: item.price,
              costPrice: item.costPrice || 0,
              quantity: item.quantity,
              total: item.price * item.quantity,
              discount: item.itemDiscount || 0,
              note: item.itemNote,
              variantName: item.variantName,
              unitName: item.selectedUnit?.name,
              conversionFactor: item.selectedUnit?.conversionFactor,
              serials: item.serials,
              selectedModifiers: item.selectedModifiers
          })), 
          subtotalAmount: subtotal,
          taxAmount: tax,
          discountAmount: discountAmount,
          serviceChargeAmount: serviceChargeAmount,
          totalAmount: total,
          paymentMethod: paymentMethod as any,
          status,
          fulfillmentStatus,
          date: new Date(),
          orderType,
      };
  };

  const handleSendToKitchen = async () => {
      if (cart.length === 0) return;
      const currentUserData = localStorage.getItem('nima_user');
      const user = currentUserData ? JSON.parse(currentUserData) : { id: 1, name: 'Admin', role: 'admin' };
      if (!hasPermission(user, null, 'pos_sales')) {
          error("عذراً، هذا الحساب لا يملك صلاحية البيع وإصدار طلبات المطبخ (pos_sales)!");
          return;
      }

      if (orderType === 'dine-in' && !selectedTable) {
          error("يرجى تحديد الطاولة أولاً للمتابعة");
          setTableRequiredPulse(true);
          setTimeout(() => setTableRequiredPulse(false), 2400);
          setIsTableModalOpen(true);
          return;
      }

      try {
          const orderData = buildOrderData('draft', 'cash', 0, 'pending');
          
          await db.transaction('rw', [db.orders, db.products, db.stockAdjustments], async () => {
              console.log("--- BEGIN KITCHEN TRANSACTION ---");
              let savedOrderId = existingOrderId;
              let isUpdate = false;
              
              if (existingOrderId) {
                  await db.orders.update(existingOrderId, orderData);
                  isUpdate = true;
              } else {
                  const newId = await db.orders.add(orderData as Order);
                  setExistingOrderId(newId as number);
                  savedOrderId = newId as number;
              }

              if (savedOrderId) {
                  const savedOrder = await db.orders.get(savedOrderId);
                  if (savedOrder) {
                      // Publish using Observer Pattern (Decoupled printing/KDS signals)
                      await appEventBus.publish('ORDER_SAVED', { order: savedOrder, settings, isUpdate });
                      
                      if (settings?.autoPrint) {
                          printQueue.addJob({ type: 'kitchen', order: savedOrder, settings: settings as any });
                      }
                  }
              }
              console.log("--- COMMIT KITCHEN TRANSACTION ---");
          });
          
          success(existingOrderId ? "تم تحديث الطلب وإرساله للمطبخ" : "تم إرسال الطلب الجديد للمطبخ");
          
          if (location.state?.tableNumber) {
              navigate('/tables');
          } else {
              setCart([]);
              setExistingOrderId(null);
              setSelectedTable('');
              setDiscountValue(0);
          }
      } catch (e) {
          console.error(e);
          error("حدث خطأ أثناء الإرسال");
      }
  };

  const initiatePayment = () => {
      if (cart.length === 0) return;
      const hasActiveShift = activeShifts && activeShifts.length > 0;
      if (!hasActiveShift && orderType !== 'dine-in') { // Or always require an active shift?
         // Actually we should always require it, but we can't wait so:
      }
      // Let's just do it directly.
  };

  const handleOpenPaymentModal = () => {
       if (cart.length === 0) return;
       const currentUserData = localStorage.getItem('nima_user');
       const user = currentUserData ? JSON.parse(currentUserData) : { id: 1, name: 'Admin', role: 'admin' };
       if (!hasPermission(user, null, 'pos_sales')) {
           error("عذراً! الحساب الحالي لا يملك صلاحية البيع واستعراض نافذة السداد (pos_sales)");
           return;
       }

       if (orderType === 'dine-in' && !selectedTable) {
           error("يرجى تحديد الطاولة أولاً للمتابعة");
           setTableRequiredPulse(true);
           setTimeout(() => setTableRequiredPulse(false), 2400);
           setIsTableModalOpen(true);
           return;
       }

       const hasActiveShift = activeShifts && activeShifts.length > 0;
       if (!hasActiveShift) {
           error('الرجاء فتح وردية جديدة للدرج أولاً');
           setIsShiftModalOpen(true);
           return;
       }
       setIsPaymentModalOpen(true);
  };

  const handleFastCash = async () => {
      if (cart.length === 0) return;
      const currentUserData = localStorage.getItem('nima_user');
      const user = currentUserData ? JSON.parse(currentUserData) : { id: 1, name: 'Admin', role: 'admin' };
      if (!hasPermission(user, null, 'pos_sales')) {
          error("عذراً، هذا الحساب ليس لديه صلاحية البيع المباشر والدفع السريع (pos_sales)!");
          return;
      }

      if (orderType === 'dine-in' && !selectedTable) {
          error("يرجى تحديد الطاولة أولاً للمتابعة");
          setTableRequiredPulse(true);
          setTimeout(() => setTableRequiredPulse(false), 2400);
          setIsTableModalOpen(true);
          return;
      }

      const hasActiveShift = activeShifts && activeShifts.length > 0;
      if (!hasActiveShift) {
           error('الرجاء فتح وردية جديدة للدرج أولاً');
           setIsShiftModalOpen(true);
           return;
      }
      try {
          const currentUserData = localStorage.getItem('nima_user');
          const user = currentUserData ? JSON.parse(currentUserData) : { id: 1, name: 'Admin', role: 'admin' };
          const mainWarehouse = await db.warehouses.where('isMain').equals(1).first() || await db.warehouses.toCollection().first();
          
          if (!mainWarehouse) throw new Error("لا يوجد مخزن رئيسي");

          const ref = await generateReferenceNumber('orders', 'POS');

          const finalOrderId = await SalesService.processSale({
              referenceNumber: ref,
              cart,
              totals: { subtotal, discountAmount: discountAmount, tax, total },
              paymentMethod: 'cash',
              user,
              settings: settings as any,
              orderType,
              tableNumber: orderType === 'dine-in' ? selectedTable : undefined,
              warehouseId: mainWarehouse.id!,
              existingOrderId: existingOrderId || undefined,
              serviceChargeAmount: serviceChargeAmount || undefined,
              customerId: selectedCustomer ? selectedCustomer.id : undefined,
          });

          await db.orders.update(finalOrderId, { fulfillmentStatus: 'served' });

          const savedOrder = await db.orders.get(finalOrderId);
          if (savedOrder && settings?.autoPrint) {
              printQueue.addJob({ type: 'receipt', order: savedOrder, settings: settings as any });
              if (orderType !== 'dine-in') {
                  printQueue.addJob({ type: 'kitchen', order: savedOrder, settings: settings as any });
              }
          }

          if (orderType === 'dine-in' && selectedTable) {
              const tableRecord = await db.diningTables.where('name').equals(selectedTable).first();
              if (tableRecord && tableRecord.id) {
                  await db.diningTables.update(tableRecord.id, { status: 'available' });
              }
          }

          success(`تم الدفع نقداً بنجاح! فاتورة #${finalOrderId}`);
          if (activeHeldOrderId) {
              await db.heldOrders.delete(activeHeldOrderId);
              setActiveHeldOrderId(null);
          }
          if (location.state?.tableNumber) {
              navigate('/tables');
          } else {
              setCart([]);
              setExistingOrderId(null);
              setSelectedTable('');
              setDiscountValue(0);
          }

      } catch (e: any) {
          console.error("Fast Checkout Error:", e);
          error(e.message || "حدث خطأ أثناء حفظ الفاتورة");
      }
  };

  const processPayment = async (method: 'cash' | 'card' | 'credit' | 'wallet' | 'split') => {
      if (cart.length === 0) return;
      const currentUserData = localStorage.getItem('nima_user');
      const user = currentUserData ? JSON.parse(currentUserData) : { id: 1, name: 'Admin', role: 'admin' };
      if (!hasPermission(user, null, 'pos_sales')) {
          error("ليس لديك صلاحية لإتمام الفواتير والمبيعات أو المدفوعات (pos_sales)");
          return;
      }

      if (method === 'credit') {
          if (!selectedCustomer || selectedCustomer.name === 'زبون عام') {
              error("لا يمكن إتمام البيع بالآجل إلا لعميل مسجل ومحدد.");
              return;
          }
      }

      const hasActiveShift = activeShifts && activeShifts.length > 0;
      if (!hasActiveShift) {
          error('الرجاء فتح وردية جديدة للدرج أولاً لتتمكن من التحصيل وتحديث الصندوق');
          setIsShiftModalOpen(true);
          return;
      }

      try {
          const mainWarehouse = await db.warehouses.where('isMain').equals(1).first() || await db.warehouses.toCollection().first();
          
          if (!mainWarehouse) throw new Error("لا يوجد مخزن رئيسي");

          // For RestaurantPOS, table orders are paid at the end, so fulfillment is considered served or keep it what it is logically. Service charge isn't implemented fully here but we pass 0.
          const ref2 = await generateReferenceNumber('orders', 'POS');
          const loyaltyValue = loyaltyRedeemedPoints * (settings?.loyaltySettings?.currencyPerPoint || 1);
          const finalTotal = Math.max(0, total - loyaltyValue);

          const finalOrderId = await SalesService.processSale({
              referenceNumber: ref2,
              cart,
              totals: { subtotal, discountAmount: discountAmount, tax, total: finalTotal }, // Add applied promotions if needed
              paymentMethod: method,
              user,
              settings: settings as any,
              orderType,
              tableNumber: orderType === 'dine-in' ? selectedTable : undefined,
              warehouseId: mainWarehouse.id!,
              existingOrderId: existingOrderId || undefined,
              serviceChargeAmount: serviceChargeAmount || undefined,
              customerId: selectedCustomer ? selectedCustomer.id : undefined,
              loyaltyPointsUsed: loyaltyRedeemedPoints > 0 ? loyaltyRedeemedPoints : undefined,
          });

          // Set fulfillmentStatus to served since they paid (or leave it to kitchen if still pending)
          await db.orders.update(finalOrderId, { fulfillmentStatus: 'served' });

          const savedOrder = await db.orders.get(finalOrderId);
          if (savedOrder && settings?.autoPrint) {
              printQueue.addJob({ type: 'receipt', order: savedOrder, settings: settings as any });
              if (orderType !== 'dine-in') {
                  printQueue.addJob({ type: 'kitchen', order: savedOrder, settings: settings as any });
              }
          }

          if (orderType === 'dine-in' && selectedTable) {
              const tableRecord = await db.diningTables.where('name').equals(selectedTable).first();
              if (tableRecord && tableRecord.id) {
                  await db.diningTables.update(tableRecord.id, { status: 'available' });
              }
          }

          success(`تم الدفع بنجاح.. جاري الطباعة`);
          
          if (activeHeldOrderId) {
              await db.heldOrders.delete(activeHeldOrderId);
              setActiveHeldOrderId(null);
          }

          // Trigger Print
          setLastOrderForPrint({ 
              orderData: { ...buildOrderData('completed', method, total, 'served'), id: finalOrderId }, 
              cart: [...cart] 
          });

          setIsPaymentModalOpen(false);
          setLoyaltyRedeemedPoints(0);
          setSelectedCustomer(null);
          setCart([]);
          setExistingOrderId(null);
          setSelectedTable('');
          
          if (location.state?.tableNumber) {
              navigate('/tables');
          }
      } catch (e: any) {
          console.error(e);
          error(e.message || "حدث خطأ أثناء الدفع");
      }
  };

  const handleSplitPay = async (splitItems: CartItem[], remainingItems: CartItem[], method: 'cash'|'card') => {
      const hasActiveShift = activeShifts && activeShifts.length > 0;
      if (!hasActiveShift) {
          error('الرجاء فتح وردية جديدة للدرج أولاً لإنهاء المعاملات المالية');
          setIsShiftModalOpen(true);
          return;
      }
      try {
          const currentUserData = localStorage.getItem('nima_user');
          const user = currentUserData ? JSON.parse(currentUserData) : { id: 1, name: 'Admin', role: 'admin' };
          const mainWarehouse = await db.warehouses.where('isMain').equals(1).first() || await db.warehouses.toCollection().first();
          if (!mainWarehouse) throw new Error("لا يوجد مخزن رئيسي");

          // Calculate totals for split item
          const splitSubtotal = splitItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
          const splitTax = settings?.taxRate ? (splitSubtotal * settings.taxRate) / 100 : 0;
          const splitTotal = splitSubtotal + splitTax;

          const isFullPayment = remainingItems.length === 0;

          const ref2 = await generateReferenceNumber('orders', 'POS');
          const finalOrderId = await SalesService.processSale({
              referenceNumber: isFullPayment && existingOrderId ? (await db.orders.get(existingOrderId))?.referenceNumber || ref2 : ref2 + '-S',
              cart: splitItems,
              totals: { subtotal: splitSubtotal, discountAmount: 0, tax: splitTax, total: splitTotal },
              paymentMethod: method,
              user,
              settings: settings as any,
              orderType,
              tableNumber: orderType === 'dine-in' ? selectedTable : undefined,
              warehouseId: mainWarehouse.id!,
              serviceChargeAmount: 0,
              existingOrderId: isFullPayment ? (existingOrderId || undefined) : undefined,
              customerId: selectedCustomer ? selectedCustomer.id : undefined,
          });

          await db.orders.update(finalOrderId, { fulfillmentStatus: 'served' });

          const savedOrder = await db.orders.get(finalOrderId);
          if (savedOrder && settings?.autoPrint) {
              printQueue.addJob({ type: 'receipt', order: savedOrder, settings: settings as any });
              if (orderType !== 'dine-in') {
                  printQueue.addJob({ type: 'kitchen', order: savedOrder, settings: settings as any });
              }
          }

          success(`تم دفع الفاتورة المجزأة بنجاح!`);

          if (remainingItems.length > 0) {
              setCart(remainingItems);
              
              if (existingOrderId) {
                  const remSubtotal = remainingItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
                  const remTax = settings?.taxRate ? (remSubtotal * settings.taxRate) / 100 : 0;
                  const remTotal = remSubtotal + remTax;
                  
                  await db.orders.update(existingOrderId, {
                       items: remainingItems.map(i => ({
                           productId: i.id || 0,
                           name: i.name,
                           price: i.price,
                           costPrice: i.costPrice,
                           quantity: i.quantity,
                           total: i.price * i.quantity,
                           variantName: i.variantName || undefined,
                           selectedModifiers: i.selectedModifiers || undefined,
                           notes: i.itemNote || ''
                       })),
                       subtotalAmount: remSubtotal,
                       taxAmount: remTax,
                       totalAmount: remTotal
                  });
              } else if (activeHeldOrderId) {
                 await db.heldOrders.update(activeHeldOrderId, { items: remainingItems });
              }

              setIsSplitCheckModalOpen(false);
          } else {
              if (existingOrderId) {
                   await db.orders.update(existingOrderId, { fulfillmentStatus: 'served', status: 'completed' });
              }
              if (activeHeldOrderId) {
                  await db.heldOrders.delete(activeHeldOrderId);
                  setActiveHeldOrderId(null);
              }
              setIsSplitCheckModalOpen(false);
              setCart([]);
              setExistingOrderId(null);
              setSelectedTable('');
              
              if (location.state?.tableNumber) {
                  navigate('/tables');
              }
          }

      } catch (e: any) {
          console.error(e);
          error(e.message || "حدث خطأ أثناء إجراء عملية الدفع المزدوجة");
      }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('ar-IQ').format(val);

  return (
    <>
    <style>{`
        @media print {
            body * {
                visibility: hidden;
            }
            #print-receipt, #print-receipt * {
                visibility: visible;
            }
            #print-receipt {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 10px;
                color: #000;
                font-family: 'Courier New', Courier, monospace;
            }
            @page {
                size: 80mm auto; /* Standard thermal receipt width */
                margin: 0;
            }
        }
    `}</style>

    <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-slate-50 font-['Tajawal'] no-print" dir="rtl" style={{ zoom: overallScale }}>
        
        {/* Right Panel: Products & Categories */}
        <div className="flex-1 flex flex-col h-[55vh] lg:h-full overflow-hidden" style={{ zoom: gridScale }}>
            {/* Top Bar for Order Type & Search */}
            <div className="bg-white px-4 lg:px-6 py-4 flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-orange-100 z-10 shrink-0">
                <div className="flex w-full sm:w-auto bg-slate-105 p-1.5 rounded-2xl shadow-inner overflow-x-auto scrollbar-none">
                    <button 
                        onClick={() => setOrderType('dine-in')}
                        className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap ${orderType === 'dine-in' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'}`}
                    >
                        <Utensils className="w-4 h-4 shrink-0" /> محلي
                    </button>
                    <button 
                        onClick={() => setOrderType('takeaway')}
                        className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap ${orderType === 'takeaway' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'}`}
                    >
                        <ShoppingBag className="w-4 h-4 shrink-0" /> سفري
                    </button>
                    <button 
                        onClick={() => setOrderType('delivery')}
                        className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap ${orderType === 'delivery' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'}`}
                    >
                        <Truck className="w-4 h-4 shrink-0" /> توصيل
                    </button>
                </div>

                <div className="flex items-center gap-3 relative w-full sm:w-auto shrink-0 flex-wrap justify-end">
                    {/* Search Bar */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                            type="text"
                            placeholder="ابحث عن وجبة أو رمز..."
                            className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 text-xs font-bold transition-all h-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Shift STATUS Badge */}
                    <button 
                        type="button"
                        onClick={() => setIsShiftModalOpen(true)}
                        className={`py-2 h-10 px-3.5 rounded-xl transition-all flex items-center gap-2 text-xs font-black border cursor-pointer shrink-0 select-none shadow-3xs active:scale-95 ${
                            activeShifts && activeShifts.length > 0
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 hover:scale-[1.01]'
                        }`}
                        title="إدارة الوردية وصندوق نقدية الكاشير"
                    >
                        <Banknote className="w-4 h-4 shrink-0 text-current" />
                        <span>{activeShifts && activeShifts.length > 0 ? 'الوردية مفتوحة 🔓' : 'فتح وردية الصندوق 🔒'}</span>
                    </button>

                    <PrinterMonitor />

                    <span className="hidden sm:inline-block border-l border-slate-200 h-7 mx-1 self-center" />

                    {/* Icon Tray for Quick Action Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {isEnabled('showReturns') && (
                            <button 
                                onClick={() => setIsRefundMode(!isRefundMode)} 
                                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-95 shadow-3xs border shrink-0 ${
                                    isRefundMode 
                                        ? 'bg-red-650 text-white border-red-700' 
                                        : 'bg-slate-50 text-slate-500 hover:text-red-500 hover:bg-red-50 hover:border-red-200 border-slate-200'
                                }`} 
                                title="وضع المرتجع (F9)"
                            >
                                <RotateCcw className="w-5 h-5 text-current" />
                            </button>
                        )}

                        {isEnabled('showCashDrawer') && (
                            <button 
                                onClick={handleOpenCashDrawer} 
                                className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-500 hover:text-orange-600 hover:bg-orange-50/50 hover:border-orange-200 border border-slate-200 rounded-xl transition-all shadow-3xs active:scale-95 shrink-0" 
                                title="فتح درج الكاشير"
                            >
                                <Unlock className="w-5 h-5" />
                            </button>
                        )}

                        {isEnabled('showPrintBill') && (
                            <button 
                                onClick={handlePrintLastBill} 
                                className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-500 hover:text-orange-600 hover:bg-orange-50/50 hover:border-orange-200 border border-slate-200 rounded-xl transition-all shadow-3xs active:scale-95 shrink-0" 
                                title="طباعة آخر فاتورة"
                            >
                                <Printer className="w-5 h-5" />
                            </button>
                        )}

                        <button 
                            onClick={() => setIsHeldOrdersModalOpen(true)} 
                            className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-500 hover:text-orange-600 hover:bg-orange-50/50 hover:border-orange-200 border border-slate-200 rounded-xl transition-all shadow-3xs active:scale-95 shrink-0" 
                            title="الطلبات المعلقة"
                        >
                            <PauseCircle className="w-5 h-5" />
                        </button>

                        <button 
                            onClick={() => setIsHistoryModalOpen(true)} 
                            className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-500 hover:text-orange-600 hover:bg-orange-50/50 hover:border-orange-200 border border-slate-200 rounded-xl transition-all shadow-3xs active:scale-95 shrink-0" 
                            title="السجل (Ctrl+H)"
                        >
                            <History className="w-5 h-5" />
                        </button>

                        <button 
                            onClick={() => setIsPriceCheckModalOpen(true)} 
                            className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-500 hover:text-orange-600 hover:bg-orange-50/50 hover:border-orange-200 border border-slate-200 rounded-xl transition-all shadow-3xs active:scale-95 shrink-0" 
                            title="فحص السعر (Ctrl+P)"
                        >
                            <ScanBarcode className="w-5 h-5" />
                        </button>

                        <button 
                            onClick={() => setIsShortcutsModalOpen(true)} 
                            className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-500 hover:text-orange-600 hover:bg-orange-50/50 hover:border-orange-200 border border-slate-200 rounded-xl transition-all shadow-3xs active:scale-95 shrink-0" 
                            title="الاختصارات"
                        >
                            <Keyboard className="w-5 h-5" />
                        </button>

                        <button 
                            onClick={() => setIsCustomItemModalOpen(true)} 
                            className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-500 hover:text-orange-600 hover:bg-orange-50/50 hover:border-orange-200 border border-slate-200 rounded-xl transition-all shadow-3xs active:scale-95 shrink-0" 
                            title="صنف مخصص (F4)"
                        >
                            <Plus className="w-5 h-5" />
                        </button>

                        <button 
                            onClick={() => window.open('#/customer-display', 'cds_window', 'width=1024,height=768')}
                            className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 hover:border-indigo-200 border border-slate-200 rounded-xl transition-all shadow-3xs active:scale-95 shrink-0"
                            title="فتح شاشة العميل (CDS)"
                        >
                            <Monitor className="w-5 h-5" />
                        </button>

                        <button 
                            onClick={() => setIsPOSSettingsModalOpen(true)}
                            className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-500 hover:text-orange-600 hover:bg-orange-50/50 hover:border-orange-200 border border-slate-200 rounded-xl transition-all shadow-3xs active:scale-95 shrink-0"
                            title="إعدادات الكاشير"
                        >
                            <SettingsIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Categories Horizontal Bar & View Toggle */}
            <div className="bg-white px-4 lg:px-6 py-4 border-b border-slate-200 shrink-0 flex flex-col gap-3 shadow-sm relative z-0">
                <div className="flex items-center justify-between gap-4">
                    <div className="overflow-x-auto scrollbar-none flex gap-2 lg:gap-3 flex-1">
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={`px-5 py-2.5 rounded-2xl font-extrabold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                                selectedCategory === 'all' 
                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 ring-2 ring-white ring-offset-2 ring-offset-orange-500' 
                                    : 'bg-slate-50 border border-slate-200 text-slate-600 transition-all duration-200 hover:bg-orange-50/40 hover:border-orange-200 hover:text-orange-600 hover:scale-[1.025] hover:-translate-y-0.5 shadow-3xs hover:shadow-2xs'
                            }`}
                        >
                            <Flame className="w-5 h-5 shrink-0" /> كل القائمة
                        </button>
                        {categories.filter(c => c !== 'الكل' && c !== 'المفضلة').map(cat => {
                            const dbCat = allCategories.find(c => c.name === cat);
                            const Icon = null;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-5 py-2.5 rounded-2xl font-extrabold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                                        selectedCategory === cat 
                                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 ring-2 ring-white ring-offset-2 ring-offset-orange-500' 
                                            : 'bg-slate-50 border border-slate-200 text-slate-600 transition-all duration-200 hover:bg-orange-50/40 hover:border-orange-200 hover:text-orange-600 hover:scale-[1.025] hover:-translate-y-0.5 shadow-3xs hover:shadow-2xs'
                                    }`}
                                >
                                    {Icon && <Icon className="w-4 h-4" />}
                                    {cat}
                                </button>
                            );
                        })}
                    </div>
                    
                    {/* View Mode Toggle */}
                    <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400 hover:text-slate-600'}`} title="شبكة">
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                        <button onClick={() => setViewMode('bento')} className={`p-2 rounded-lg transition-all ${viewMode === 'bento' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400 hover:text-slate-600'}`} title="بينتو (مطعم)">
                            <Coffee className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-100/50">
                <ProductGrid 
                    key={viewMode}
                    filteredProducts={filteredProducts as Product[]}
                    isRefundMode={isRefundMode}
                    stockMap={stockMap}
                    handleProductClick={handleProductClick}
                    formatCurrency={formatCurrency}
                    viewMode={viewMode === 'categories' ? 'bento' : viewMode}
                />
            </div>
        </div>

        {/* Left Panel: Ticket / Cart */}
        <div className="w-full lg:w-[30%] bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.05)] flex flex-col z-20 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 relative h-[45vh] lg:h-full" style={{ zoom: cartScale }}>
            
            {/* Cart Tabs (Multiple Active Carts) */}
            <div className="flex bg-slate-100 px-2 py-1 gap-1 overflow-x-auto scrollbar-none border-b border-slate-200 items-center min-h-[44px]">
                {/* Default/New Cart Tab */}
                {!activeHeldOrderId && (
                    <div className="px-3 py-1.5 bg-slate-800 text-white rounded-t-lg shadow-sm font-bold text-xs whitespace-nowrap min-w-[max-content]">
                        طلب جديد {cart.length > 0 && '*'}
                    </div>
                )}
                
                {/* Held Tabs */}
                {heldOrders && heldOrders.length > 0 && heldOrders.map((order, idx) => {
                    const isActive = activeHeldOrderId === order.id;
                    return (
                        <div key={order.id || idx} className={`flex items-center rounded-t-lg transition-colors min-w-[max-content] overflow-hidden ${isActive ? 'bg-slate-800 shadow-sm' : 'bg-slate-200 hover:bg-slate-300'}`}>
                            <button
                                onClick={async () => {
                                    if (isActive) return;
                                    if (cart.length > 0 || activeHeldOrderId) {
                                        await handleHoldOrder(false); // Save current state to its order
                                    }
                                    if(order.id) await handleRetrieveOrder(order.id);
                                }}
                                className={`px-3 py-1.5 font-bold text-xs flex items-center gap-2
                                    ${isActive ? 'text-white' : 'text-slate-600'}
                                `}
                            >
                                <span>{order.tableId ? `طاولة: ${order.tableId}` : `طلب (${idx + 1})`} {isActive && cart.length > 0 && '*'}</span>
                                <span className={`text-[10px] font-normal ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>{(order.items || []).length} صنف</span>
                            </button>
                            <button
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    if (order.id) {
                                        await handleDeleteHeldOrder(order.id);
                                        if (isActive) {
                                            setCart([]);
                                            setActiveHeldOrderId(null);
                                        }
                                    }
                                }}
                                className={`p-1 hover:bg-red-500 hover:text-white transition-colors ${isActive ? 'text-slate-400' : 'text-slate-500'}`}
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )
                })}

                {/* New Cart Tab */}
                <button
                    onClick={async () => {
                        if (cart.length > 0 || activeHeldOrderId) {
                            await handleHoldOrder(true);
                        }
                    }}
                    className="p-1 text-slate-400 hover:text-orange-600 transition-colors shrink-0 ml-1"
                    title="طلب جديد"
                >
                    <Plus className="w-5 h-5 bg-slate-200 rounded-md p-0.5" />
                </button>
            </div>

            {/* Ticket Header & Table Select */}
            <div className="p-4 lg:p-6 bg-slate-800 text-white relative shrink-0">
                <div className="absolute top-0 right-0 w-full h-1.5 lg:h-2 bg-gradient-to-r from-orange-400 to-orange-600" />
                <div className="flex justify-between items-center mb-3 lg:mb-5 mt-1 lg:mt-2">
                    <h2 className="text-xl lg:text-2xl font-black flex items-center gap-2 lg:gap-3">
                        <Receipt className="w-5 h-5 lg:w-7 lg:h-7 text-orange-400" />
                        الطلب الحالي
                    </h2>
                    {existingOrderId && (
                        <span className="bg-orange-500/20 text-orange-300 text-[10px] lg:text-xs font-bold px-2.5 py-1 rounded-lg border border-orange-500/30 flex items-center gap-1.5">
                            <Clock className="w-3 h-3 lg:w-3.5 lg:h-3.5" /> قيد التحضير
                        </span>
                    )}
                </div>

                {orderType === 'dine-in' && (
                    <button 
                        onClick={() => setIsTableModalOpen(true)}
                        className={`w-full py-3 px-4 lg:py-3.5 lg:px-5 rounded-xl lg:rounded-2xl flex justify-between items-center transition-all border group mb-3 ${
                            tableRequiredPulse 
                                ? 'animate-[bounce_0.5s_infinite] ring-4 ring-orange-500/80 bg-orange-605/30 border-orange-500 text-white' 
                                : !selectedTable 
                                    ? 'bg-amber-500/5 hover:bg-amber-500/15 border-amber-500/35 text-amber-100' 
                                    : 'bg-white/10 hover:bg-white/20 border-white/10 text-white'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <Armchair className={`w-5 h-5 lg:w-6 lg:h-6 ${selectedTable ? 'text-orange-400' : 'text-slate-300 group-hover:text-white transition-colors'}`} />
                            <div className="text-right">
                                <span className={`block font-bold text-sm lg:text-base ${selectedTable ? 'text-white' : 'text-slate-300 group-hover:text-white transition-colors'}`}>
                                    {selectedTable ? `طاولة رقم: ${selectedTable}` : 'تحديد الطاولة'}
                                </span>
                                {!selectedTable && <span className="text-[10px] lg:text-xs text-orange-400">مطلوب لمتابعة الطلب</span>}
                            </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 lg:w-5 lg:h-5 ${selectedTable ? 'text-white opacity-50' : 'text-orange-400'}`} />
                    </button>
                )}

                {/* Customer Selection */}
                <button
                    onClick={() => {
                        if (selectedCustomer) {
                            setSelectedCustomer(null);
                        } else {
                            setIsQuickCustomerModalOpen(true);
                        }
                    }}
                    className={`w-full py-3 px-4 lg:py-3.5 lg:px-5 rounded-xl lg:rounded-2xl flex justify-between items-center transition-all bg-white/10 hover:bg-white/20 border border-white/10 group`}
                >
                    <div className="flex items-center gap-3">
                        <Users className={`w-5 h-5 lg:w-6 lg:h-6 ${selectedCustomer ? 'text-orange-400' : 'text-slate-300 group-hover:text-white transition-colors'}`} />
                        <div className="text-right">
                            <span className={`block font-bold text-sm lg:text-base ${selectedCustomer ? 'text-white' : 'text-slate-300 group-hover:text-white transition-colors'}`}>
                                {selectedCustomer ? selectedCustomer.name : 'إضافة عميل (برنامج الولاء)'}
                            </span>
                            {selectedCustomer && selectedCustomer.loyaltyPoints !== undefined && (
                                <span className="text-[10px] lg:text-xs text-emerald-400">النقاط: {selectedCustomer.loyaltyPoints}</span>
                            )}
                        </div>
                    </div>
                     {selectedCustomer ? (
                         <X className="w-4 h-4 lg:w-5 lg:h-5 text-white opacity-50 hover:opacity-100" />
                     ) : (
                         <ChevronRight className={`w-4 h-4 lg:w-5 lg:h-5 text-slate-300 group-hover:text-white transition-colors`} />
                     )}
                </button>
            </div>

            {/* Cart Items */}
            <div className="flex-grow flex-shrink flex-1 overflow-y-auto min-h-0 px-3 lg:px-4 py-4 lg:py-5 space-y-3 lg:space-y-4 bg-slate-50/50 border-t border-b border-slate-100 scrollbar-thin">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 px-4 lg:px-8 text-center pt-8 lg:pt-0">
                        <div className="w-24 h-24 lg:w-32 lg:h-32 bg-slate-105 rounded-full flex items-center justify-center mb-4 lg:mb-6">
                            <ShoppingBag className="w-12 h-12 lg:w-16 lg:h-16 text-slate-300" />
                        </div>
                        <p className="text-lg lg:text-xl font-bold text-slate-655 mb-1 lg:mb-2">فاتورة فارغة</p>
                        <p className="text-xs lg:text-sm font-medium leading-relaxed max-w-[200px] lg:max-w-none text-slate-450">قم بإضافة الأطباق والمشروبات من القائمة لتكوين الطلب العميل.</p>
                    </div>
                ) : (
                    cart.map((item, index) => (
                        <div key={item.cartItemId} className="bg-white p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-slate-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative group overflow-hidden animate-in slide-in-from-right-4 w-full">
                            <div className="flex justify-between items-start gap-3 lg:gap-4 w-full">
                                <div className="flex bg-slate-100 text-slate-600 font-bold w-6 h-6 lg:w-8 lg:h-8 rounded-full items-center justify-center shrink-0 text-xs lg:text-sm mt-0.5 lg:mt-0">
                                    {index + 1}
                                </div>
                                <div className="flex-1 min-w-0 pt-0.5 lg:pt-1">
                                    <h4 className="font-extrabold text-slate-800 text-sm lg:text-base leading-tight mb-1">{item.name}</h4>
                                    <p className="text-emerald-600 font-black text-xs lg:text-sm font-[Tajawal]">{formatCurrency(item.price)}</p>
                                    {item.itemNote && (
                                        <div className="mt-2 bg-slate-50 border border-slate-100 p-2 lg:p-2.5 rounded-lg lg:rounded-xl flex items-start gap-1.5 lg:gap-2">
                                            <Info className="w-3 h-3 lg:w-4 lg:h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <p className="text-[10px] lg:text-xs font-bold text-slate-600 leading-relaxed">{item.itemNote}</p>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex flex-col items-end gap-2 lg:gap-3 shrink-0">
                                    <p className="font-black text-slate-800 text-base lg:text-lg font-[Tajawal]">{formatCurrency(item.price * item.quantity)}</p>
                                    
                                    {/* Unified Rectangular Quantity Block */}
                                    <div className="flex items-center bg-white border border-slate-200 hover:border-slate-300 rounded-lg overflow-hidden shrink-0 h-9 divide-x divide-x-reverse divide-slate-200 shadow-sm transition-colors">
                                        <button 
                                            onClick={() => updateQuantity(item.cartItemId, -1)} 
                                            className="px-2.5 h-full text-slate-500 hover:text-red-600 hover:bg-slate-50 transition-colors flex items-center justify-center"
                                            title="تقليل الكمية"
                                        >
                                            {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                                        </button>
                                        <span className="w-9 h-full flex items-center justify-center font-extrabold text-sm text-slate-850 font-[Tajawal]">{item.quantity}</span>
                                        <button 
                                            onClick={() => updateQuantity(item.cartItemId, 1)} 
                                            className="px-2.5 h-full text-slate-550 hover:text-emerald-600 hover:bg-slate-50 transition-colors flex items-center justify-center"
                                            title="زيادة الكمية"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Actions area */}
                            <div className="mt-2.5 flex gap-2 w-full">
                                <button 
                                    onClick={() => openNotesModal(item)}
                                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:border-orange-200 rounded-lg text-slate-500 hover:text-orange-600 hover:bg-orange-50/50 transition-all flex items-center gap-1.5 text-xs font-bold"
                                    title="إضافة ملاحظة"
                                >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>ملاحظة أوردر</span>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Ticket Totals & Actions */}
            <div className="p-4 lg:p-6 bg-white border-t border-slate-200 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.06)] relative z-30">
                <div className="space-y-1.5 lg:space-y-2.5 mb-4 lg:mb-6">
                    <div className="flex justify-between text-slate-500 text-sm lg:text-base font-bold">
                        <span>المجموع الفرعي</span>
                        <span className="text-slate-800 font-['Cairo']">{formatCurrency(subtotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                        <div 
                            className="flex justify-between text-slate-500 text-sm lg:text-base font-bold cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors"
                            onClick={() => setIsDiscountModalOpen(true)}
                        >
                            <span>الخصم ({discountType === 'percent' ? `${discountValue}%` : 'ثابت'})</span>
                            <span className="text-red-500 font-['Cairo']">-{formatCurrency(discountAmount)}</span>
                        </div>
                    )}
                    {discountAmount === 0 && (
                        <div 
                            className="flex justify-between text-orange-400 text-sm lg:text-base font-bold cursor-pointer hover:bg-orange-50 p-1 rounded transition-colors border border-dashed border-transparent hover:border-orange-200"
                            onClick={() => setIsDiscountModalOpen(true)}
                        >
                            <span>إضافة خصم</span>
                            <span className="text-orange-500"><Plus className="w-4 h-4 inline-block" /></span>
                        </div>
                    )}
                    <div 
                        className="flex justify-between text-indigo-500 text-xs lg:text-sm font-bold cursor-pointer hover:bg-indigo-50/70 p-1 rounded transition-colors border border-dashed border-indigo-200 hover:border-indigo-400 mt-1"
                        onClick={handleOpenOffersModal}
                    >
                        <span className="flex items-center gap-1">🎁 باقات العروض الترويجية والكومبو</span>
                        <span className="text-indigo-600"><Plus className="w-3.5 h-3.5 inline-block" /></span>
                    </div>
                    {tax > 0 && (
                        <div className="flex justify-between text-slate-500 text-sm lg:text-base font-bold">
                            <span>الضريبة ({taxRate}%)</span>
                            <span className="text-slate-800">{formatCurrency(tax)}</span>
                        </div>
                    )}
                    {serviceChargeAmount > 0 && (
                        <div className="flex justify-between text-slate-500 text-sm lg:text-base font-bold">
                            <span>رسوم الخدمة ({settings?.posSettings?.dineInServiceChargeRate || 0}%)</span>
                            <span className="text-slate-800">{formatCurrency(serviceChargeAmount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-end pt-2 lg:pt-4 mt-2 border-t-2 border-dashed border-slate-200">
                        <span className="text-lg lg:text-xl font-bold text-slate-800">الإجمالي النهائي</span>
                        <div className="text-left font-['Cairo']">
                            <span className="text-2xl lg:text-4xl font-black text-emerald-600 tracking-tight">{formatCurrency(total)}</span>
                            <span className="text-xs lg:text-base font-bold text-slate-400 mr-1.5 lg:mr-2 font-sans">{currency}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2 lg:gap-3">
                    <button 
                        onClick={handleSendToKitchen}
                        disabled={cart.length === 0}
                        className={`w-full py-3 lg:py-4.5 rounded-xl lg:rounded-2xl font-bold text-lg lg:text-xl flex justify-center items-center gap-2 lg:gap-3 transition-all ${
                            cart.length > 0 ? 'bg-slate-800 hover:bg-slate-900 text-white shadow-xl shadow-slate-800/20 active:scale-[0.98]' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        <ChefHat className="w-5 h-5 lg:w-7 lg:h-7" />
                        حفظ الطلب (إلى المطبخ)
                    </button>

                    <div className="grid grid-cols-2 gap-2 lg:gap-3">
                        <button 
                            id="fast-cash-btn"
                            onClick={handleFastCash}
                            disabled={cart.length === 0}
                            className={`py-3 lg:py-4 rounded-xl lg:rounded-2xl font-bold text-base lg:text-lg flex justify-center items-center gap-2 transition-all ${
                                cart.length > 0 ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-[0.98]' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                            title="دفع سريع كاش (F3)"
                        >
                            <Banknote className="w-5 h-5 lg:w-6 lg:h-6" />
                            كاش (F3)
                        </button>
                        <button 
                            onClick={handleOpenPaymentModal}
                            disabled={cart.length === 0}
                            className={`py-3 lg:py-4 rounded-xl lg:rounded-2xl font-bold text-base lg:text-lg flex justify-center items-center gap-2 transition-all ${
                                cart.length > 0 ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-[0.98]' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                            title="دفع وإغلاق (F4)"
                        >
                            <CreditCard className="w-5 h-5 lg:w-6 lg:h-6" />
                            إتمام الطلب (F4)
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 lg:gap-2">
                        <button 
                            onClick={async () => {
                                await handleHoldOrder(true);
                                success("تم تعليق الطلب");
                            }}
                            disabled={cart.length === 0}
                            className={`w-full py-2.5 lg:py-3 rounded-xl font-bold text-xs lg:text-sm flex justify-center items-center gap-1.5 transition-all bg-white border hover:bg-slate-50 active:scale-[0.98] ${
                                cart.length > 0 ? 'border-amber-200 text-amber-605 hover:bg-amber-50' : 'border-slate-150 text-slate-300 cursor-not-allowed'
                            }`}
                        >
                            تأجيل الطلب
                        </button>
                        <button 
                            onClick={() => {
                                const hasActiveShift = activeShifts && activeShifts.length > 0;
                                if (!hasActiveShift) {
                                    error('الرجاء فتح وردية جديدة للدرج أولاً لتتمكن من تجزئة الفواتير والتحصيل');
                                    setIsShiftModalOpen(true);
                                    return;
                                }
                                setIsSplitCheckModalOpen(true);
                            }}
                            disabled={cart.length === 0}
                            className={`w-full py-2.5 lg:py-3 rounded-xl font-bold text-xs lg:text-sm flex justify-center items-center gap-1.5 transition-all bg-white border hover:bg-slate-50 active:scale-[0.98] ${
                                cart.length > 0 ? 'border-indigo-200 text-indigo-650 hover:bg-indigo-50' : 'border-slate-150 text-slate-300 cursor-not-allowed'
                            }`}
                        >
                            تقسيم الطلب
                        </button>
                        <button 
                            onClick={() => {
                                if (cart.length > 0) {
                                    setIsConfirmClearOpen(true);
                                }
                            }}
                            disabled={cart.length === 0}
                            className={`w-full py-2.5 lg:py-3 rounded-xl font-bold text-xs lg:text-sm flex justify-center items-center gap-1.5 transition-all bg-white border hover:bg-slate-50 active:scale-[0.98] ${
                                cart.length > 0 ? 'border-red-205 text-red-650 hover:bg-red-50' : 'border-slate-150 text-slate-350 cursor-not-allowed'
                            }`}
                            title="إلغاء الطلب بالكامل (Esc)"
                        >
                            إلغاء الطلب (Esc)
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* Unified Restaurant Modals Container */}
        <RestaurantPOSModalsContainer
            isPaymentModalOpen={isPaymentModalOpen}
            setIsPaymentModalOpen={setIsPaymentModalOpen}
            selectedCustomer={selectedCustomer}
            settings={settings}
            loyaltyRedeemedPoints={loyaltyRedeemedPoints}
            setLoyaltyRedeemedPoints={setLoyaltyRedeemedPoints}
            total={total}
            currency={currency}
            processPayment={processPayment}
            setIsProformaInvoiceOpen={setIsProformaInvoiceOpen}
            isShiftModalOpen={isShiftModalOpen}
            setIsShiftModalOpen={setIsShiftModalOpen}
            isVoidModalOpen={isVoidModalOpen}
            setIsVoidModalOpen={setIsVoidModalOpen}
            voidItemDetails={voidItemDetails}
            setVoidItemDetails={setVoidItemDetails}
            handleVoidConfirm={handleVoidConfirm}
            isSplitCheckModalOpen={isSplitCheckModalOpen}
            setIsSplitCheckModalOpen={setIsSplitCheckModalOpen}
            cart={cart}
            handleSplitPay={handleSplitPay}
            isQuickCustomerModalOpen={isQuickCustomerModalOpen}
            setIsQuickCustomerModalOpen={setIsQuickCustomerModalOpen}
            handleQuickCustomerAdd={handleQuickCustomerAdd}
            isProformaInvoiceOpen={isProformaInvoiceOpen}
            tax={tax}
            selectedTable={selectedTable}
            isNotesModalOpen={isNotesModalOpen}
            setIsNotesModalOpen={setIsNotesModalOpen}
            activeNoteItem={activeNoteItem}
            tempNote={tempNote}
            setTempNote={setTempNote}
            saveNotes={saveNotes}
            isTableModalOpen={isTableModalOpen}
            setIsTableModalOpen={setIsTableModalOpen}
            tables={tables}
            setSelectedTable={setSelectedTable}
            lastOrderForPrint={lastOrderForPrint}
            storeName={storeName}
            currencyLabel={currency}
            isPOSSettingsModalOpen={isPOSSettingsModalOpen}
            setIsPOSSettingsModalOpen={setIsPOSSettingsModalOpen}
            overallScale={overallScale}
            setOverallScale={setOverallScale}
            gridScale={gridScale}
            setGridScale={setGridScale}
            cartScale={cartScale}
            setCartScale={setCartScale}
            isPriceCheckModalOpen={isPriceCheckModalOpen}
            setIsPriceCheckModalOpen={setIsPriceCheckModalOpen}
            products={products}
            isShortcutsModalOpen={isShortcutsModalOpen}
            setIsShortcutsModalOpen={setIsShortcutsModalOpen}
            isHistoryModalOpen={isHistoryModalOpen}
            setIsHistoryModalOpen={setIsHistoryModalOpen}
            isDiscountModalOpen={isDiscountModalOpen}
            setIsDiscountModalOpen={setIsDiscountModalOpen}
            discountType={discountType}
            setDiscountType={setDiscountType}
            tempDiscountInput={tempDiscountInput}
            setTempDiscountInput={setTempDiscountInput}
            applyDiscount={applyDiscount}
            isCustomItemModalOpen={isCustomItemModalOpen}
            setIsCustomItemModalOpen={setIsCustomItemModalOpen}
            addToCart={addToCart}
            isHeldOrdersModalOpen={isHeldOrdersModalOpen}
            setIsHeldOrdersModalOpen={setIsHeldOrdersModalOpen}
            heldOrders={heldOrders}
            handleRetrieveOrder={handleRetrieveOrder}
            handleDeleteHeldOrder={handleDeleteHeldOrder}
            isVariantModalOpen={isVariantModalOpen}
            setIsVariantModalOpen={setIsVariantModalOpen}
            selectedProductForVariants={selectedProductForVariants}
            setSelectedProductForVariants={setSelectedProductForVariants}
            handleVariantConfirm={handleVariantConfirm}
            isModifierModalOpen={isModifierModalOpen}
            setIsModifierModalOpen={setIsModifierModalOpen}
            selectedProductForModifiers={selectedProductForModifiers}
            setSelectedProductForModifiers={setSelectedProductForModifiers}
            handleModifierConfirm={handleModifierConfirm}
            formatCurrency={formatCurrency}
        />

        {/* Promotional Offers and Combos Selection Modal */}
        {isOffersModalOpen && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" dir="rtl">
                    <div className="p-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex justify-between items-center">
                        <div className="space-y-1">
                            <h3 className="font-extrabold text-xl flex items-center gap-2">
                                <span>🎁 باقات العروض والترويج النشطة</span>
                            </h3>
                            <p className="text-xs text-indigo-100 font-medium">اختر العرض أو الكومبو لتطبيقه فوراً كخصم على الطلب الحالي</p>
                        </div>
                        <button 
                            onClick={() => setIsOffersModalOpen(false)}
                            className="p-1 px-2.5 bg-white/20 hover:bg-white/35 rounded-xl transition-all cursor-pointer font-bold text-sm"
                        >
                            إغلاق ✕
                        </button>
                    </div>

                    <div className="p-6 space-y-4 max-h-[460px] overflow-y-auto">
                        {offersList.map((offer) => (
                            <div 
                                key={offer.id}
                                onClick={() => handleApplyOffer(offer)}
                                className="p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/30 transition-all cursor-pointer text-right flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-150"
                            >
                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl text-xl font-black shrink-0 flex items-center justify-center w-16 h-16">
                                    {offer.type === 'percent' ? `%${offer.discountVal}` : `خصم`}
                                </div>
                                <div className="space-y-1 flex-1 min-w-0">
                                    <div className="flex items-center gap-2 justify-between">
                                        <p className="text-sm font-black text-slate-800 truncate">{offer.name}</p>
                                        <span className="text-[10px] font-mono font-bold bg-slate-200/60 text-slate-600 px-2 py-0.5 rounded-full shrink-0">{offer.code}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-bold leading-normal">{offer.desc}</p>
                                    <p className="text-[11px] text-indigo-600 font-black pt-1">
                                        قيمة الخصم: {offer.type === 'percent' ? `${offer.discountVal}% من المجموع` : `${formatCurrency(offer.discountVal)} كاش فوري`}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 text-xs text-slate-400 font-bold">
                        <span>* لتطبيق خصم يدوي مخصص بنسبة أو قيمة أخرى، يرجى النقر على "إضافة خصم"</span>
                    </div>
                </div>
            </div>
        )}

        {/* Custom Discard/Cancel Transaction Confirmation Dialog Modal */}
        {isConfirmClearOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200 text-center">
                    <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">إلغاء وتصفية الطلب</h3>
                    <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                        هل أنت متأكد من رغبتك في إلغاء وتصفية الطلب الحالي وإفراغ هذه السلة تماماً؟ لا يمكن التراجع عن هذا الإجراء.
                    </p>
                    
                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={() => setIsConfirmClearOpen(false)}
                            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-xs"
                        >
                            التراجع (إبقاء الطلب)
                        </button>
                        <button 
                            onClick={async () => {
                                setCart([]);
                                setExistingOrderId(null);
                                setSelectedTable('');
                                setIsConfirmClearOpen(false);
                                success("تم إلغاء الطلب بنجاح");
                            }}
                            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-650/10"
                        >
                            نعم ، إلغاء السلة
                        </button>
                    </div>
                </div>
            </div>
        )}

    </div>
    </>
  );
};

export default RestaurantPOS;
