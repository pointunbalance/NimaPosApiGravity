import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { CartItem, Product, Customer, User, Warehouse } from '../../types';
import { 
  FileText, Search, CreditCard, Banknote, HelpCircle, 
  Trash2, Plus, Minus, Calculator, RefreshCw, Barcode, 
  UserCheck, Layers, Clipboard, ShieldCheck, Tag, ArrowLeft, 
  Truck, CornerDownLeft, FileCheck, Landmark, PlayCircle, Settings,
  Eye, AlertTriangle, CheckCircle2, Activity, FileSpreadsheet, PlusCircle
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../ui/ConfirmModal';

interface WholesaleAccountingConsoleProps {
  isAccountingOnly?: boolean;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  updateQuantity: (cartItemId: string, delta: number) => void;
  removeFromCart: (cartItemId: string) => void;
  openLineItemModal: (item: CartItem) => void;
  selectedCustomerId: number | null;
  setSelectedCustomerId: (id: number | null) => void;
  customers: Customer[];
  orderType: string;
  setOrderType: (type: any) => void;
  selectedSalespersonId: number | null;
  setSelectedSalespersonId: (id: number | null) => void;
  selectedWarehouseId: number | null;
  setSelectedWarehouseId: (id: number | null) => void;
  users: User[];
  isRefundMode: boolean;
  setIsRefundMode: (mode: boolean) => void;
  isTaxEnabled: boolean;
  taxRate: number;
  orderNote: string;
  setOrderNote: (note: string) => void;
  promoCode: string;
  setPromoCode: (code: string) => void;
  setDiscountValue: (val: number) => void;
  discountValue: number;
  discountType: 'fixed' | 'percent';
  setDiscountType: (type: 'fixed' | 'percent') => void;
  totals: {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
  };
  handleHoldOrder: (isNew: boolean) => void;
  handleSaveQuotation: () => void;
  handleFastCash: () => void;
  initiatePayment: () => void;
  activeHeldOrderId: number | null;
  heldOrders: any[];
  handleRetrieveOrder: (id: number) => void;
  formatCurrency: (val: number) => string;
  handleProductClick: (product: any) => void;
  checkoutWholesaleOverride?: (data: { journalLines: any[]; downPayment: number; costCenter: string; paymentTerms: string }) => Promise<void>;
}

export const WholesaleAccountingConsole: React.FC<WholesaleAccountingConsoleProps> = ({
  isAccountingOnly = false,
  cart,
  setCart,
  updateQuantity,
  removeFromCart,
  openLineItemModal,
  selectedCustomerId,
  setSelectedCustomerId,
  customers,
  orderType,
  setOrderType,
  selectedSalespersonId,
  setSelectedSalespersonId,
  selectedWarehouseId,
  setSelectedWarehouseId,
  users,
  isRefundMode,
  setIsRefundMode,
  isTaxEnabled,
  taxRate,
  orderNote,
  setOrderNote,
  promoCode,
  setPromoCode,
  setDiscountValue,
  discountValue,
  discountType,
  setDiscountType,
  totals,
  handleHoldOrder,
  handleSaveQuotation,
  handleFastCash,
  initiatePayment,
  activeHeldOrderId,
  heldOrders,
  handleRetrieveOrder,
  formatCurrency,
  handleProductClick,
  checkoutWholesaleOverride
}) => {
  const { success, error: showError } = useToast();

  // Search and Catalog states
  const [catalogueSearch, setCatalogueSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [isCatalogVisible, setIsCatalogVisible] = useState(true);
  
  // Dynamic Pricing Channel State
  const [pricingChannels, setPricingChannels] = useState<{
    id: string;
    name: string;
    discountPercent: number;
    description: string;
  }[]>(() => {
    const saved = localStorage.getItem('nima_wholesale_pricing_channels');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return [
      { id: 'wholesale', name: 'جملة معيارية', discountPercent: 0, description: 'تسعير جملة قياسي (Wholesale)' },
      { id: 'super', name: 'جملة كبرى (-5%)', discountPercent: 5, description: 'جملة الجملة الكبرى (Super Wholesale)' },
      { id: 'distributor', name: 'تسعير وكلاء (-10%)', discountPercent: 10, description: 'تسعير الموزعين الرئيسيين (Distributor)' },
    ];
  });

  const [pricingTier, setPricingTier] = useState<string>('wholesale');

  // Dynamic pricing channel editor fields
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDiscount, setNewChannelDiscount] = useState<number>(0);
  const [newChannelDesc, setNewChannelDesc] = useState('');

  const [costCenter, setCostCenter] = useState('101'); // 101 - Main Costs center
  const [paymentTerms, setPaymentTerms] = useState<'immediate' | '15' | '30' | '60' | '90'>('immediate');
  const [freightCharge, setFreightCharge] = useState<number>(0);
  const [shippingCarrier, setShippingCarrier] = useState('');
  const [driverName, setDriverName] = useState('');
  const [selectedSubAccount, setSelectedSubAccount] = useState('410101'); // 410101 - Domestic Wholesale Sales Account

  // Integrated Accountant States
  const [downPayment, setDownPayment] = useState<number>(0);
  const [isDeliveryNoteOpen, setIsDeliveryNoteOpen] = useState(false);
  const [isJournalPreviewOpen, setIsJournalPreviewOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPrice, setManualPrice] = useState<number>(0);
  const [manualQuantity, setManualQuantity] = useState<number>(1);
  const [manualCategory, setManualCategory] = useState('خدمات تجارية تكميلية');

  // Fetch Database tables via Dexie useLiveQuery
  const dbCategories = useLiveQuery(() => db.categories.toArray(), []);
  const dbWarehouses = useLiveQuery(() => db.warehouses.toArray(), []);

  // Compute calculated values
  const grandTotalWithFreight = useMemo(() => {
    return totals.total + Number(freightCharge || 0);
  }, [totals.total, freightCharge]);

  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId || !customers) return null;
    return customers.find(c => c.id === selectedCustomerId);
  }, [selectedCustomerId, customers]);

  const isCreditLimitExceeded = useMemo(() => {
    if (!selectedCustomer || paymentTerms === 'immediate') return false;
    const limit = selectedCustomer.creditLimit || 50000;
    const currentBalance = selectedCustomer.balance || 0;
    return currentBalance + grandTotalWithFreight > limit;
  }, [selectedCustomer, paymentTerms, grandTotalWithFreight]);

  const subAccounts = [
    { id: '410101', name: '410101 - مبيعات جملة محلية' },
    { id: '410102', name: '410102 - مبيعات جملة تصدير' },
    { id: '410103', name: '410103 - مبيعات عقود القطاع العام' },
    { id: '410104', name: '410104 - عائدات توريد شركات شقيقة' }
  ];

  // Dynamically compile a fully-balancing General Ledger journal entry preview
  const journalLines = useMemo(() => {
    const lines: Array<{
      accountCode: string;
      accountName: string;
      debit: number;
      credit: number;
      type: 'debit' | 'credit';
      notes: string;
    }> = [];

    const selectedCustomerName = selectedCustomerId 
      ? (customers.find(c => c.id === selectedCustomerId)?.name || 'العميل المالي آجل') 
      : 'صندوق المبيعات النقدي المباشر';

    const netSales = totals.subtotal - totals.discount;
    const taxVal = totals.tax;
    const freightVal = Number(freightCharge || 0);
    const totalDue = netSales + taxVal + freightVal;

    if (totalDue <= 0) return [];

    const activeDownPayment = paymentTerms === 'immediate' ? 0 : Math.min(downPayment, totalDue);
    const receivableAmount = totalDue - activeDownPayment;

    // 1. DEBIT - Cashier Asset for the Down Payment (if any)
    if (activeDownPayment > 0) {
      lines.push({
        accountCode: '110101',
        accountName: '110101 - النقدية بالخزينة (الدفعة المقدمة)',
        debit: activeDownPayment,
        credit: 0,
        type: 'debit',
        notes: `الدفعة المقدمة المستلمة نقداً من العميل ${selectedCustomerName}`
      });
    }

    // 2. DEBIT - Remaining Customer Receivable or Cashier asset for immediate payments
    if (receivableAmount > 0) {
      if (paymentTerms === 'immediate') {
        lines.push({
          accountCode: '110101',
          accountName: '110101 - النقدية بالخزينة (مبيعات فوري)',
          debit: receivableAmount,
          credit: 0,
          type: 'debit',
          notes: `تحصيل نقدي مبيعات فورية للعملاء ${orderNote ? `[${orderNote}]` : ''}`
        });
      } else {
        lines.push({
          accountCode: '120101',
          accountName: `120101 - حساب الذمم المدينة (${selectedCustomerName})`,
          debit: receivableAmount,
          credit: 0,
          type: 'debit',
          notes: `قيد الجزء المتبقي كذمم آجل سداد ${paymentTerms} يوم`
        });
      }
    }

    // 3. CREDIT - Sales Revenue (selected Sub-account)
    const subAccObj = subAccounts.find(sa => sa.id === selectedSubAccount);
    lines.push({
      accountCode: selectedSubAccount,
      accountName: subAccObj ? subAccObj.name : '410101 - مبيعات جملة بمستودعات',
      debit: 0,
      credit: netSales,
      type: 'credit',
      notes: 'إثبات قيمة المبيعات السلعية بالدليل الموجه'
    });

    // 4. CREDIT - Sales VAT Liability (if tax enabled)
    if (isTaxEnabled && taxVal > 0) {
      lines.push({
        accountCode: '210501',
        accountName: '210501 - ضريبة القيمة المضافة المحصلة (14%)',
        debit: 0,
        credit: taxVal,
        type: 'credit',
        notes: 'مستقطع القيمة المضافة لخطوط القيد السلعية'
      });
    }

    // 5. CREDIT - Cargo Logistics Carrier Revenue
    if (freightVal > 0) {
      lines.push({
        accountCode: '410205',
        accountName: '410205 - إيرادات النقل والتعبير المبيانية للعملاء',
        debit: 0,
        credit: freightVal,
        type: 'credit',
        notes: `رسوم النقل واللوجستيات لشركة ${shippingCarrier || 'ناقل داخلي'}`
      });
    }

    return lines;
  }, [selectedCustomerId, customers, totals, freightCharge, paymentTerms, selectedSubAccount, orderNote, isTaxEnabled, shippingCarrier, downPayment]);

  const handlePostWholesaleOrder = React.useCallback(() => {
    if (cart.length === 0) {
      showError('سلة المبيعات فارغة، لا يوجد شيء لترحيله');
      return;
    }
    if (checkoutWholesaleOverride) {
      checkoutWholesaleOverride({
        journalLines,
        downPayment,
        costCenter,
        paymentTerms
      });
    } else {
      initiatePayment();
    }
  }, [cart.length, checkoutWholesaleOverride, journalLines, downPayment, costCenter, paymentTerms, initiatePayment, showError]);

  const pricingTiersText = useMemo(() => {
    const textObj: Record<string, string> = {};
    pricingChannels.forEach(c => {
      textObj[c.id] = c.description || `${c.name} (${c.discountPercent}%)`;
    });
    return textObj;
  }, [pricingChannels]);

  const costCenters = [
    { id: '101', name: 'الفرع الرئيسي مبيعات - 101' },
    { id: '102', name: 'مستودعات الشمال التجارية - 102' },
    { id: '103', name: 'المخزن الجغرافي المركزي - 103' },
    { id: '104', name: 'قسم الوكلاء وموردي الطرف الثالث - 104' }
  ];

  // Calculated date due offset based on selected payment terms
  const targetDueDate = useMemo(() => {
    if (paymentTerms === 'immediate') return 'فوري نقدي / شبكة';
    const offset = parseInt(paymentTerms, 10);
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  }, [paymentTerms]);

  // Read inventory data
  const liveProducts = useLiveQuery(async () => {
    let all = await db.products.toArray();
    
    // Apply search filter
    if (catalogueSearch.trim()) {
      const query = catalogueSearch.toLowerCase().trim();
      all = all.filter(p => 
        p.name.toLowerCase().includes(query) || 
        (p.barcode && p.barcode.includes(query)) ||
        (p.category && p.category.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (selectedCategory !== 'الكل') {
      all = all.filter(p => p.category === selectedCategory);
    }
    
    return all;
  }, [catalogueSearch, selectedCategory]);

  const categories = useMemo(() => {
    if (!dbCategories) return ['الكل'];
    return ['الكل', ...dbCategories.map(c => c.name)];
  }, [dbCategories]);

  // Adjust product price in catalogue based on selected accounting tier
  const getTierPrice = (product: Product) => {
    const basePrice = product.wholesalePrice || product.price;
    const activeChannel = pricingChannels.find(c => c.id === pricingTier);
    if (activeChannel) {
      return basePrice * (1 - activeChannel.discountPercent / 100);
    }
    return basePrice;
  };

  // Safe helper to toggle UoM of line item
  const handleToggleUoM = (item: CartItem, uomName: string) => {
    const updatedCart = cart.map(cartItem => {
      if (cartItem.cartItemId === item.cartItemId) {
        // Find UoM details from DB or set unit
        return {
          ...cartItem,
          selectedUnitName: uomName
        };
      }
      return cartItem;
    });
    setCart(updatedCart);
  };

  // Keyboard shortcut system for speed accounting
  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key !== 'F2' && e.key !== 'F3' && e.key !== 'F4' && e.key !== 'F7' && e.key !== 'F8') {
          return;
        }
      }
      
      switch (e.key) {
        case 'F2':
          e.preventDefault();
          handlePostWholesaleOrder();
          break;
        case 'F3':
          e.preventDefault();
          setIsRefundMode(!isRefundMode);
          break;
        case 'F4':
          e.preventDefault();
          handleHoldOrder(true);
          break;
        case 'F7':
          e.preventDefault();
          handleSaveQuotation();
          break;
        case 'F8':
          e.preventDefault();
          setIsClearConfirmOpen(true);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, [handlePostWholesaleOrder, isRefundMode, setIsRefundMode, handleHoldOrder, handleSaveQuotation, setCart, success]);

  // Quick helper to insert from catalog
  const handleInsertProduct = (product: Product) => {
    const adjustedProduct = {
      ...product,
      wholesalePrice: getTierPrice(product),
      price: getTierPrice(product)
    };
    handleProductClick(adjustedProduct);
    success(`تم ترحيل خط القيد لـ ${product.name}`);
  };

  return (
    <div style={{ height: '100vh' }} className="flex flex-col h-screen overflow-hidden bg-white text-slate-800 font-sans">
      
      {/* Top Ledger Ribbon Section */}
      <header className="bg-slate-50 border-b border-slate-200 px-5 py-3 shrink-0 flex flex-wrap gap-4 items-center justify-between shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black shadow-sm">
            <Clipboard className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-slate-900 m-0">
                {isAccountingOnly ? "ترحيل حسابات وقيود مبيعات الجملة" : "شاشة مبيعات الجملة الذكية"}
              </h1>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${isAccountingOnly ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                {isAccountingOnly ? "الوضع المحاسبي البحت" : "جاهز محاسبياً وبيع مباشر"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">جدوله قيود المبيعات الضريبية الفورية • المزامنة مع الدفاتر العامة والذمم الخاملة</p>
          </div>
        </div>

        {/* Corporate Status Indicators */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => setIsCatalogVisible(!isCatalogVisible)}
            className={`px-3 py-1.5 text-[11px] font-black rounded-lg transition-all flex items-center gap-1.5 border shadow-xs ${
              isCatalogVisible 
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300' 
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 animate-pulse'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {isCatalogVisible ? "إخفاء دليل السلع" : "إظهار دليل السلع ونظام الإضافة السريعة"}
          </button>

          <div className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-[11px] flex items-center gap-2 shadow-sm">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="font-semibold text-slate-700">السنة المالية: 2026</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-[11px] flex items-center gap-2 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-slate-700">التدفق التجاري: محلي</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-[11px] flex items-center gap-2 shadow-sm">
            <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
            <span className="text-slate-700">حد المستودعات المتاح: متطابق</span>
          </div>
        </div>
      </header>

      {/* Primary Workspace Panels */}
      <main 
        style={{ paddingBottom: '24px' }}
        className="flex-1 flex flex-col lg:flex-row overflow-hidden relative pb-[24px]"
      >
        
        {/* LEFT WORKSPACE: Interactive Accountant Draft Ledger (62% to 65% width) */}
        <div className={`${!isCatalogVisible ? 'flex-1 w-full' : 'flex-[5]'} flex flex-col bg-white border-l border-slate-200 h-full overflow-hidden`}>
          
          {/* Main Account & Cost Center Headers */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-start shrink-0">
            
            {/* Customer select */}
            <div className="flex flex-col justify-between min-h-[72px]">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1.5">حساب المديونية للمشروع (العميل)</label>
                <div className="relative">
                  <select
                    value={selectedCustomerId || ''}
                    onChange={(e) => setSelectedCustomerId(Number(e.target.value) || null)}
                    className="w-full bg-white border border-slate-300 hover:border-slate-450 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800 rounded-lg px-3 py-2 text-xs font-bold transition-all outline-none shadow-sm"
                  >
                    <option value="">-- نقدي (مبيعات عملاء مباشرة) --</option>
                    {customers?.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''} - رصيد: {formatCurrency(c.balance || 0)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {selectedCustomerId && (
                <div className="flex flex-col gap-1 mt-1.5 px-0.5">
                  <div className="flex justify-between items-center text-[10px]">
                    {isCreditLimitExceeded ? (
                      <span className="text-red-700 font-extrabold flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-650 shrink-0" />
                        تجاوز حد الائتمان!
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        حد الائتمان مصرح
                      </span>
                    )}
                    <a href={`/customers/ledger?id=${selectedCustomerId}`} className="text-blue-600 font-bold hover:underline text-[9px] shrink-0">عرض الدفتر ↗</a>
                  </div>
                  {isCreditLimitExceeded && (
                    <div className="bg-red-50 border border-red-200 text-red-850 rounded p-2 text-[9px] font-bold mt-1 shadow-xs leading-relaxed">
                      تجاوز الضمان الائتماني بـ {formatCurrency((selectedCustomer?.balance || 0) + grandTotalWithFreight - (selectedCustomer?.creditLimit || 50000))}.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sub-ledger and revenue account */}
            <div className="flex flex-col justify-between min-h-[72px]">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1.5">حساب المبيعات الرئيسي الموجه</label>
                <select
                  value={selectedSubAccount}
                  onChange={(e) => setSelectedSubAccount(e.target.value)}
                  className="w-full bg-white border border-slate-300 hover:border-slate-450 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800 rounded-lg px-3 py-2 text-xs font-bold transition-all outline-none shadow-sm"
                >
                  {subAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
              <div className="text-[10px] text-slate-500 mt-1.5 px-0.5 leading-snug">
                توجيه الأرباح لمركز التقرير الضريبي المجمع
              </div>
            </div>

            {/* Cost Center */}
            <div className="flex flex-col justify-between min-h-[72px]">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1.5">مركز التكلفة</label>
                <select
                  value={costCenter}
                  onChange={(e) => setCostCenter(e.target.value)}
                  className="w-full bg-white border border-slate-300 hover:border-slate-450 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800 rounded-lg px-3 py-2 text-xs font-bold transition-all outline-none shadow-sm"
                >
                  {costCenters.map(cc => (
                    <option key={cc.id} value={cc.id}>{cc.id} - مبيعات</option>
                  ))}
                </select>
              </div>
              <div className="text-[10px] text-slate-500 mt-1.5 px-0.5 leading-snug">
                التوزيع التحليلي المباشر للفرع والنشاط
              </div>
            </div>

            {/* Salesperson */}
            <div className="flex flex-col justify-between min-h-[72px]">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1.5">مندوب المبيعات</label>
                <select
                  value={selectedSalespersonId || ''}
                  onChange={(e) => setSelectedSalespersonId(Number(e.target.value) || null)}
                  className="w-full bg-white border border-slate-300 hover:border-slate-450 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800 rounded-lg px-3 py-2 text-xs font-bold transition-all outline-none shadow-sm"
                >
                  <option value="">اختيار المندوب...</option>
                  {users?.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="text-[10px] text-slate-500 mt-1.5 px-0.5 leading-snug">
                تحديد عمولة المبيعات والحصص على السطر
              </div>
            </div>

          </div>

          {/* Quick Info Bar for Refund/Hold */}
          <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex gap-2 items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">حالة المسودة الحالية:</span>
              {activeHeldOrderId ? (
                <span className="bg-amber-100 text-amber-800 border border-amber-250 px-2 py-0.5 rounded text-[10px] font-extrabold flex items-center gap-1">
                  مسترجعة من الانتظار #{activeHeldOrderId}
                </span>
              ) : (
                <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">مسودة قيد جديد</span>
              )}
              {isRefundMode && (
                <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-[10px] font-extrabold flex items-center gap-1 animate-pulse">
                  وضعية مرتجع المبيعات / قيد العكس مفعّل
                </span>
              )}
            </div>

            <div className="flex gap-1.5">
              <button 
                onClick={() => setIsRefundMode(!isRefundMode)}
                className={`px-3 py-1 rounded text-[10px] font-bold border transition-colors ${isRefundMode ? 'bg-red-600 border-red-500 text-white' : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'}`}
              >
                قيد مرتجع [F3]
              </button>
              <button 
                onClick={() => setIsClearConfirmOpen(true)}
                className="px-3 py-1 rounded text-[10px] font-bold bg-slate-950 hover:bg-slate-800 border border-slate-800 text-red-500 hover:text-red-400 transition-colors"
              >
                مسح القاموس [F8]
              </button>
            </div>
          </div>

          {/* Table of Ledger Draft Lines */}
          <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50 mb-[16px]">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mb-4 text-slate-400">
                  <Layers className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-black text-slate-700">لا توجد حركات قيود في المسودة حالياً</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  الرجاء تعبئة الفاتورة بالنقر المباشر على الأدوية أو السلع في الدليل الأيمن، أو استخدام القارئ الباركودي للاستدعاء الفوري والتسجيل. كما يتوفر إدخال كميات وخصومات مخصصة سطرياً.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center font-bold">
                  <span className="bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded text-[10.5px] font-mono shadow-sm">F2: ترحيل للذمم</span>
                  <span className="bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded text-[10.5px] font-mono shadow-sm">F3: فاتورة رد</span>
                  <span className="bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded text-[10.5px] font-mono shadow-sm">F4: حجز مسودة</span>
                </div>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs table-fixed">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold select-none h-11 sticky top-0 bg-slate-100 z-10 shadow-xs">
                      <th className="px-3 text-center w-8">#</th>
                      <th className="px-3 w-auto">أكواد وبطاقات الأصناف مبياناً</th>
                      <th className="px-3 w-28">الحساب الدائني</th>
                      <th className="px-3 w-32">العبوة والوحدة</th>
                      <th className="px-3 w-[120px] text-center">الكمية</th>
                      <th className="px-3 w-24 text-left">سعر جملة الباب</th>
                      <th className="px-3 w-16 text-center">خصم %</th>
                      <th className="px-3 w-20 text-left">الضريبة</th>
                      <th className="px-3 w-32 text-left">أرصدة القيد (صافي)</th>
                      <th className="px-3 text-center w-20">...</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {cart.map((item, index) => {
                      const itemSubtotal = item.price * item.quantity;
                      const hasUnitBarcode = item.selectedUnitName && item.selectedUnitName !== 'الأساسية';
                      
                      return (
                        <tr 
                          key={item.cartItemId} 
                          className={`hover:bg-slate-50 transition-colors h-16 bg-white ${isRefundMode ? 'hover:bg-red-50' : ''}`}
                        >
                          {/* Row Index */}
                          <td className="px-3 text-center font-mono text-slate-400 font-bold py-3">{index + 1}</td>
                          
                          {/* Product details */}
                          <td className="px-3 py-3 truncate">
                            <div className="font-bold text-slate-900 text-[12.5px] truncate">{item.name}</div>
                            <div className="flex gap-2 items-center text-[10px] text-slate-550 mt-0.5">
                              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">
                                {item.barcode || 'عام'}
                              </span>
                              {item.category && (
                                <span className="bg-slate-100 px-1 py-0.5 rounded text-slate-500">
                                  {item.category}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Subledger Destination */}
                          <td className="px-3 py-3 text-slate-600">
                            <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-550 border border-slate-200 text-[10px]">
                              4101 - محلي
                            </span>
                          </td>

                          {/* Editable Packaging Unit dropdown */}
                          <td className="px-3 py-3">
                            {item.units && item.units.length > 0 ? (
                              <select 
                                value={item.selectedUnitName || 'الأساسية'}
                                onChange={(e) => handleToggleUoM(item, e.target.value)}
                                className="bg-white border border-slate-300 hover:border-slate-450 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-705 rounded px-2 py-1 text-[11px] font-bold outline-none w-full shadow-sm transition-all"
                              >
                                <option value="الأساسية">الأساسية (قطعة)</option>
                                {item.units.map((u, ui) => (
                                  <option key={ui} value={u.name}>{u.name} (x{u.conversionFactor})</option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-slate-400 font-semibold px-2">قطعة فردية</span>
                            )}
                          </td>

                          {/* Quantity Controls */}
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button 
                                onClick={() => updateQuantity(item.cartItemId, -1)}
                                className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 hover:text-emerald-700 text-slate-600 border border-slate-200 flex items-center justify-center shadow-xs active:scale-95 transition-all"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-12 py-1 flex items-center justify-center text-center font-mono font-black text-slate-800 text-xs bg-white border border-slate-200 rounded-md">
                                {item.quantity}
                              </span>
                              <button 
                                onClick={() => updateQuantity(item.cartItemId, 1)}
                                className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 hover:text-emerald-700 text-slate-600 border border-slate-200 flex items-center justify-center shadow-xs active:scale-95 transition-all"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </td>

                          {/* Trade Wholesale Unit Price */}
                          <td className="px-3 py-3 text-left font-mono font-bold text-emerald-705">
                            {formatCurrency(item.price)}
                          </td>

                          {/* Commercial line discount */}
                          <td className="px-3 py-3 text-center font-mono font-bold text-amber-600">
                            {item.itemDiscount || 0}%
                          </td>

                          {/* Computed Line tax */}
                          <td className="px-3 py-3 text-left font-mono text-slate-500 text-[10px]">
                            {isTaxEnabled ? `${taxRate}%` : 'سماح معفي'}
                          </td>

                          {/* Subledger row balance - Accent scan highlight */}
                          <td className="px-3 py-3 text-left font-mono font-black text-[13.5px] text-slate-950 bg-slate-50/50">
                            {formatCurrency(itemSubtotal * (1 - (item.itemDiscount || 0) / 100))}
                          </td>

                          {/* Action Items */}
                          <td className="px-3 py-3 text-center">
                            <div className="flex justify-center items-center gap-1.5 font-mono">
                              <button 
                                 onClick={() => openLineItemModal(item)}
                                 className="text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-slate-100 transition-colors"
                                 title="تعديل تفاصيل السطر (خصم خاص / تعديل السعر)"
                              >
                                <Settings className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                 onClick={() => removeFromCart(item.cartItemId)}
                                 className="text-slate-400 hover:text-red-650 p-1 rounded hover:bg-slate-100 transition-colors"
                                 title="حذف القيد السطري"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Ledger Accounting Form: Terms, Shipping, Cost-centers */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-2 gap-[16px] items-start mb-[16px] shrink-0">
            
            {/* Section A: Invoicing settlement terms */}
            <div 
              style={{ height: 'fit-content' }}
              className="space-y-2 bg-white py-[12px] px-[16px] rounded-lg border border-slate-200 shadow-xs"
            >
              <h4 className="text-[11px] font-black text-slate-700 flex items-center gap-1 border-b border-slate-100 pb-1.5">
                <Landmark className="w-3.5 h-3.5 text-blue-600" />
                شروط التسوية وائتمان القيد المفتوح
              </h4>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1">شروط السداد الآجل</label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPaymentTerms(val as any);
                      if (val === 'immediate') {
                        setDownPayment(0);
                      }
                    }}
                    className="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800 rounded px-2.5 py-1 text-xs font-semibold outline-none transition-all shadow-xs"
                  >
                    <option value="immediate">دفع فوري نقدي / مستحق</option>
                    <option value="15">آجل 15 يوم (Net 15)</option>
                    <option value="30">آجل 30 يوم (Net 30)</option>
                    <option value="60">آجل 60 يوم (Net 60)</option>
                    <option value="90">آجل 90 يوم (Net 90)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1">تاريخ الاستحقاق المتوقع</label>
                  <div className="bg-slate-50 text-slate-700 rounded px-2.5 py-1 text-xs font-black border border-slate-200">
                    {targetDueDate}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1">الخصم التجاري الإجمالي (الفاتورة)</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={discountValue || ''}
                      onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value) || 0))}
                      placeholder="0.00"
                      className="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800 text-xs rounded px-2 py-1 outline-none font-mono transition-all shadow-xs"
                    />
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as 'fixed' | 'percent')}
                      className="bg-white border border-slate-300 hover:border-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-705 text-xs rounded px-1 py-1 font-bold outline-none transition-all shadow-xs"
                    >
                      <option value="percent">%</option>
                      <option value="fixed">مبلغ</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1">دفعة مقدمة نقداً (Down Payment)</label>
                  <input
                    type="number"
                    value={downPayment || ''}
                    disabled={paymentTerms === 'immediate'}
                    onChange={(e) => setDownPayment(Math.max(0, Number(e.target.value) || 0))}
                    placeholder={paymentTerms === 'immediate' ? 'غير متاح نقداً' : 'قيمة مقتطعة'}
                    className="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800 text-xs rounded px-2.5 py-1 outline-none font-mono transition-all shadow-xs disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">ملاحظة القيد العام وتوجيه الفاتورة</label>
                <textarea
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="ملاحظات لتسجيل السند المالي، شريك العمل، رقم التصريح الضريبي، تفويض السحب..."
                  rows={1}
                  className="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800 text-xs rounded p-1.5 outline-none resize-none transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Section B: Logistics Freight Charges */}
            <div 
              style={{ height: 'fit-content' }}
              className="space-y-2 bg-white py-[12px] px-[16px] rounded-lg border border-slate-200 shadow-xs"
            >
              <h4 className="text-[11px] font-black text-slate-700 flex items-center gap-1 border-b border-slate-100 pb-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-600" />
                لوجستيات الشحن وتحميل المستودعات
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1">سند التوصيل للشاحن</label>
                  <input
                    type="text"
                    value={shippingCarrier}
                    onChange={(e) => setShippingCarrier(e.target.value)}
                    placeholder="شركة الشحن / لوحة النقل"
                    className="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800 text-xs rounded px-2.5 py-1 outline-none transition-all shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1">اسم السائق المفوض</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="السائق المسؤول عن الاستلام"
                    className="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800 text-xs rounded px-2.5 py-1 outline-none transition-all shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1">تكلفة الشحن لعميل (إيراد نقل)</label>
                  <input
                    type="number"
                    value={freightCharge || ''}
                    onChange={(e) => setFreightCharge(Number(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-emerald-700 text-xs font-bold rounded px-2.5 py-1 outline-none font-mono transition-all shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1">فئة ومستند الضريبة التابع</label>
                  <div className="bg-white text-slate-650 rounded px-2 py-1 text-xs font-semibold border border-slate-200 flex items-center justify-between shadow-xs">
                    <span>قيمة المضافة:</span>
                    <span className="text-slate-950 font-mono font-black">{isTaxEnabled ? `${taxRate}%` : '0%'}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* LEFT AREA FOOTER: Corporate Accounting Voucher Summary Details */}
          <footer 
            style={{ paddingBottom: '24px' }}
            className="bg-slate-100 border border-[#E4E7EB] mx-[20px] mb-[24px] rounded-xl px-[20px] py-[16px] pb-[24px] shrink-0 flex flex-row items-center justify-between gap-4 shadow-sm"
          >
            
            {/* Structured accounting aggregates */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-white/50 p-2 rounded-lg border border-slate-200/60 shadow-xs">
                <span className="text-slate-500 block mb-0.5 font-bold">مجموع البضاعة السلعي:</span>
                <span className="font-mono font-black text-slate-800 block text-[13px]">{formatCurrency(totals.subtotal)}</span>
              </div>
              
              <div className="bg-white/50 p-2 rounded-lg border border-slate-200/60 shadow-xs">
                <span className="text-slate-500 block mb-0.5 font-bold">إجمالي التنزيلات والخصم:</span>
                <span className="font-mono font-black text-amber-600 block text-[13px]">{formatCurrency(totals.discount)}</span>
              </div>

              <div className="bg-white/50 p-2 rounded-lg border border-slate-200/60 shadow-xs">
                <span className="text-slate-500 block mb-0.5 font-bold">ضريبة القيمة المضافة (VAT):</span>
                <span className="font-mono font-black text-slate-700 block text-[13px]">{formatCurrency(totals.tax)}</span>
              </div>

              <div className="bg-white/50 p-2 rounded-lg border border-slate-200/60 shadow-xs">
                <span className="text-slate-500 block mb-0.5 font-bold">تأمين الشحن واللوجستيات:</span>
                <span className="font-mono font-black text-blue-600 block text-[13px]">{formatCurrency(freightCharge)}</span>
              </div>
            </div>

            {/* Total balance due + posting controls */}
            <div className="flex flex-wrap lg:flex-nowrap items-center gap-3">
              
              {/* Grand Total Bal */}
              <div className="text-left py-1 px-3 bg-white border border-slate-200 rounded-xl shadow-xs min-h-[54px] flex flex-col justify-center">
                <span className="text-slate-500 text-[10px] block uppercase font-bold text-right leading-none">رصيد الفاتورة النهائي</span>
                <span className="font-mono font-black text-lg text-slate-950 block mt-1 leading-none text-left">
                  {formatCurrency(grandTotalWithFreight)}
                </span>
              </div>

              {/* POST BTNS */}
              <div className="flex flex-wrap sm:flex-nowrap gap-[12px] items-center">
                
                {/* Save Draft / Hold */}
                <button
                  type="button"
                  onClick={() => handleHoldOrder(true)}
                  className="bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-455 text-slate-705 font-bold py-[8px] px-[12px] rounded-xl text-xs flex flex-col items-center justify-center transition-all shadow-xs min-w-[125px] h-[54px]"
                  title="حفظ المسودة مؤقتاً بالصورة المحاسبية الحالية"
                >
                  <span className="flex items-center gap-1.5"><Clipboard className="w-4 h-4 text-amber-500 shrink-0" /> حفظ كمجهود مؤجل</span>
                  <span className="text-[9px] text-slate-450 font-normal mt-1 leading-none">F4 - مسودة</span>
                </button>

                {/* Gatepass / Warehouses Delivery Note Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (cart.length === 0) {
                      showError('الرجاء إضافة أصناف في القائمة لتوليد ومعاينة إذن الصرف المخزني');
                      return;
                    }
                    setIsDeliveryNoteOpen(true);
                  }}
                  className="bg-amber-50 hover:bg-amber-100 border border-amber-255 text-amber-900 font-bold py-[8px] px-[12px] rounded-xl text-xs flex flex-col items-center justify-center transition-all shadow-xs min-w-[125px] h-[54px]"
                  title="عرض ومراجعة إذن تسليم السلع والمستند اللوجستي مع السائق"
                >
                  <span className="flex items-center gap-1.5"><Truck className="w-4 h-4 text-amber-600 shrink-0" /> إذن عبور مخازن</span>
                  <span className="text-[9px] text-amber-650 font-normal mt-1 leading-none">سند الشحن والتفويض</span>
                </button>

                {/* Journal Preview Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (cart.length === 0) {
                      showError('الرجاء إضافة أصناف في القائمة لتوليد ومعاينة القيود الدفترية');
                      return;
                    }
                    setIsJournalPreviewOpen(true);
                  }}
                  className="bg-sky-50 hover:bg-sky-100 border border-sky-255 text-sky-850 font-bold py-[8px] px-[12px] rounded-xl text-xs flex flex-col items-center justify-center transition-all shadow-xs min-w-[125px] h-[54px]"
                  title="عرض ومراجعة التوجيه المحاسبي وقيد القيمة المزدوج آلياً"
                >
                  <span className="flex items-center gap-1.5"><Eye className="w-4 h-4 text-sky-600 shrink-0" /> معاينة القيد المزدوج</span>
                  <span className="text-[9px] text-sky-600/80 font-normal mt-1 leading-none">سند قيد الميزانية</span>
                </button>

                {/* Main Post Entry Button */}
                <button
                  type="button"
                  onClick={handlePostWholesaleOrder}
                  disabled={cart.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-black py-[8px] px-[12px] rounded-xl text-xs sm:text-sm flex flex-col items-center justify-center transition-all shadow-md hover:shadow-emerald-950/20 h-[54px] min-w-[165px]"
                >
                  <span className="flex items-center gap-1.5"><FileCheck className="w-4 h-4 stroke-[2.5]" /> ترحيل وإصدار القيد</span>
                  <span className="text-[10px] text-emerald-100 font-bold mt-1 leading-none">ترحيل المبيعات F2</span>
                </button>

              </div>

            </div>

          </footer>

        </div>

        {/* RIGHT PANEL: High-density Warehouse Catalog & Live Pricing Sheet (35% to 38% width) */}
        <div className={`${!isCatalogVisible ? 'hidden' : 'flex-[3]'} lg:ml-[20px] flex flex-col bg-slate-50 border-r border-slate-200 h-full overflow-hidden select-none`}>
          
          {/* Index Sidebar Header */}
          <div className="p-4 bg-white border-b border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                سجل السلع وأرصدة المستودعات
              </h3>
              <button
                onClick={() => setShowManualForm(!showManualForm)}
                className={`text-[10px] font-black px-2 py-1 rounded-lg transition-all flex items-center gap-1 border shadow-sm ${showManualForm ? 'bg-indigo-600 text-white border-indigo-600 font-bold' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'}`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                صنف/خدمة يدوي
              </button>
            </div>

            {showManualForm && (
              <div className="mb-3 bg-indigo-50/75 border border-indigo-200 rounded-lg p-3 shadow-sm text-xs transition-all duration-200">
                <span className="font-extrabold text-indigo-900 block mb-2">تسجيل حركة / خدمة تكميلية مباشرة</span>
                <div className="space-y-2">
                  <div>
                    <input
                      type="text"
                      placeholder="اسم الخدمة أو الصنف المحاسبي المطور"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-xs rounded p-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 mb-0.5">السعر الفردي</label>
                      <input
                        type="number"
                        placeholder="السعر"
                        value={manualPrice || ''}
                        onChange={(e) => setManualPrice(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 text-xs rounded p-1.5 focus:border-indigo-550 outline-none font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 mb-0.5">الكمية</label>
                      <input
                        type="number"
                        placeholder="الكمية"
                        value={manualQuantity || ''}
                        onChange={(e) => setManualQuantity(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 text-xs rounded p-1.5 focus:border-indigo-550 outline-none font-mono font-bold"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setShowManualForm(false)}
                      className="text-[10px] text-slate-600 hover:text-slate-800 font-bold px-2 py-1"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!manualName.trim()) {
                          showError('يرجى تحديد اسم للصنف لتسجيل حركة القيد');
                          return;
                        }
                        if (manualPrice <= 0) {
                          showError('يرجى تحديد قيمة سعر بيع صحيحة وبديهية');
                          return;
                        }
                        if (manualQuantity <= 0) {
                          showError('يرجى تحديد كمية صحيحة');
                          return;
                        }
                        
                        const constructedProduct: Product = {
                          id: Date.now(),
                          name: `[صنف تكميلي] ${manualName.trim()}`,
                          barcode: `MANUAL-${Math.floor(100000 + Math.random() * 900000)}`,
                          price: manualPrice,
                          wholesalePrice: manualPrice,
                          category: 'تعديلات تسوية محاسبية',
                          stock: 9999,
                          units: []
                        };
                        
                        for (let i = 0; i < manualQuantity; i++) {
                          handleProductClick(constructedProduct);
                        }
                        
                        setManualName('');
                        setManualPrice(0);
                        setManualQuantity(1);
                        setShowManualForm(false);
                      }}
                      className="text-[10.5px] bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold px-3.5 py-1 rounded-md shadow-sm transition-colors"
                    >
                      إدراج السطر بالفاتورة
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Pricing Tier Option Selector */}
            <div className="mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200.5 shadow-sm flex items-center justify-between gap-2.5 select-none text-right">
              <div className="flex items-center gap-1.5 shrink-0">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[10.5px] font-extrabold text-slate-700">قناة التسعير:</span>
              </div>
              
              <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                <select
                  value={pricingTier}
                  onChange={(e) => setPricingTier(e.target.value)}
                  className="flex-1 max-w-[200px] w-full bg-white border border-slate-300 text-emerald-700 text-xs font-black py-1.5 px-2.5 rounded-lg cursor-pointer outline-none shadow-xs hover:border-slate-400 focus:border-emerald-505 focus:ring-2 focus:ring-emerald-100 transition-all truncate"
                >
                  {pricingChannels.map(channel => (
                    <option key={channel.id} value={channel.id} className="font-bold text-slate-800">
                      {channel.name} ({channel.discountPercent > 0 ? `-${channel.discountPercent}%` : 'سعر أساسي'})
                    </option>
                  ))}
                </select>

                {/* Polished Gear Control with interactive rotate effect and custom premium tooltip */}
                <div className="shrink-0 relative group">
                  <button
                    type="button"
                    onClick={() => setIsPricingModalOpen(true)}
                    id="pricing_channels_control_gear"
                    aria-label="إدارة قنوات التسعير"
                    className="h-8 w-8 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-300 hover:border-emerald-500 rounded-xl flex items-center justify-center transition-all duration-200 shadow-xs active:scale-95 cursor-pointer relative"
                  >
                    <div className="relative flex items-center justify-center">
                      <Settings className="w-4 h-4 transition-transform duration-700 ease-out group-hover:rotate-180" />
                      <Tag className="w-2.5 h-2.5 text-emerald-600 group-hover:text-emerald-200 absolute -bottom-1 -left-1 bg-white group-hover:bg-emerald-700 rounded-full border border-emerald-100 shadow-xs scale-90" />
                    </div>
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-405 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </button>

                  {/* Interactive Floating Tooltip displaying button function on hover */}
                  <div className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 w-56 p-2.5 bg-slate-900 border border-slate-800 text-white text-[10px] font-bold rounded-xl shadow-xl text-center pointer-events-none transition-all duration-200 animate-in fade-in slide-in-from-bottom-2">
                    إدارة قنوات تسعير وخصومات الجملة وتحديد نسب السلع لوكلاء التوزيع
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Catalog search bar */}
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="البحث بالاسم، بباركود، أو بالتصنيفات..."
                value={catalogueSearch}
                onChange={(e) => setCatalogueSearch(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-slate-400 text-xs rounded-lg pl-3 pr-9 py-2 text-slate-800 placeholder-slate-400 font-bold outline-none font-mono shadow-sm"
              />
              <Search className="w-4 h-4 text-slate-400 absolute top-2.5 right-3" />
            </div>

            {/* Category horizontal ribbon */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full custom-scrollbar text-[11px]">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap font-bold transition-all border shrink-0 ${selectedCategory === cat ? 'bg-emerald-600 text-white border-emerald-555 shadow-sm' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 hover:border-slate-400 shadow-sm'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed spreadsheet catalog row elements */}
          <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-slate-100 p-3 bg-white">
            {liveProducts && liveProducts.length > 0 ? (
              liveProducts.map(prod => {
                const stock = prod.stock !== undefined ? prod.stock : 99;
                const tierPrice = getTierPrice(prod);
                
                // Live inventory badges color mapping based on accounting safety threshold
                let stockColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
                if (stock === 0) {
                  stockColor = 'text-slate-600 bg-slate-100 border-slate-350';
                } else if (stock <= 15) {
                  stockColor = 'text-amber-700 bg-amber-50 border-amber-200';
                }

                return (
                  <div
                    key={prod.id}
                    onClick={() => handleInsertProduct(prod)}
                    className="p-2.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors flex items-center justify-between gap-3 group border border-transparent hover:border-slate-200 shadow-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 text-xs truncate group-hover:text-emerald-700 transition-colors">
                        {prod.name}
                      </div>
                      
                      {/* Product descriptors */}
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                        {prod.category && (
                          <span className="bg-slate-100 px-1 py-0.5 rounded select-none text-slate-600 font-bold border border-slate-200/50">
                            {prod.category}
                          </span>
                        )}
                        <span className="font-mono text-[9px] text-slate-400">
                          {prod.barcode || 'عام'}
                        </span>
                        {prod.units && prod.units.length > 0 && (
                          <span className="bg-emerald-50 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded font-mono border border-emerald-200/50">
                            عبوة مخصصة
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-left">
                      {/* Live stock indicator */}
                      <div className={`px-[10px] py-[3px] rounded text-[9.5px] font-black border font-mono ${stockColor}`}>
                        المخزون: {stock}
                      </div>

                      {/* Display price according to select accounting tier */}
                      <div className="text-right font-mono text-xs font-black text-emerald-700 group-hover:scale-105 transition-transform">
                        {formatCurrency(tierPrice)}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <p className="text-xs">لا توجد سلع متوفرة تطابق خيار البحث المحدد.</p>
              </div>
            )}
          </div>

          {/* Quick info panel about selected pricing tier */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-[10.5px] text-slate-500 flex flex-col gap-1 select-none">
            <span className="flex justify-between">
              <span>طريقة حساب التسعير:</span>
              <span className="text-emerald-700 font-black">{pricingTiersText[pricingTier]}</span>
            </span>
            <span className="flex justify-between">
              <span>تصفير الضرائب:</span>
              <span className="text-slate-600">ماتثبت الضريبة سطرياً بنسبة 14% ما لم تعفى</span>
            </span>
          </div>

        </div>

      </main>

      {/* 1. Double-Entry Journal Preview Modal */}
      {isJournalPreviewOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            {/* Header */}
            <div className="p-4 bg-indigo-50 border-b border-indigo-150 text-indigo-900 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <div className="text-right">
                  <h3 className="font-bold text-sm">التوجيه المحاسبي التلقائي - مبيعات الجملة الذكية</h3>
                  <p className="text-[10px] text-indigo-750">مسودة السند وقيد المستحقات المزدوج المتوازن قبل تسجيل الأستاذ العام</p>
                </div>
              </div>
              <button 
                onClick={() => setIsJournalPreviewOpen(false)}
                className="px-3 py-1.5 text-xs bg-white text-indigo-700 hover:text-indigo-800 border border-indigo-200 hover:bg-slate-50 rounded-lg font-bold transition-all"
              >
                إغلاق المعاينة
              </button>
            </div>

            {/* Content info */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-right">
              <div>
                <span className="text-slate-500 block font-bold mb-0.5">الحساب المدين المقابل:</span>
                <span className="text-slate-800 font-black font-mono">
                  {paymentTerms === 'immediate' ? '110101 - نقدية بالصندوق والخزائن' : '120101 - حساب الذمم والعملاء التجاريين'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-bold mb-0.5">قناة الإيراد الموجهة:</span>
                <span className="text-indigo-600 font-black font-mono">{selectedSubAccount}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-bold mb-0.5">المركز التكليفي المعادل:</span>
                <span className="text-slate-800 font-extrabold text-[10.5px]">
                  {costCenters.find(c => c.id === costCenter)?.name || costCenter}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-bold mb-0.5">طريقة وائتمان الحركة:</span>
                <span className="text-emerald-700 font-black">{targetDueDate}</span>
              </div>
            </div>

            {/* General Ledger Table Sheet */}
            <div className="p-5 flex-1 overflow-y-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100 border border-slate-200 text-slate-700 font-extrabold">
                    <th className="p-2.5 rounded-r text-right">رمز الحساب</th>
                    <th className="p-2.5 text-right">اسم الحساب المقابل (دليل فرعي)</th>
                    <th className="p-2.5 text-center">نوع قيد التوجيه</th>
                    <th className="p-2.5 text-left text-emerald-800">مدين (Debits +)</th>
                    <th className="p-2.5 text-left text-indigo-800">دائن (Credits -)</th>
                    <th className="p-2.5 text-right rounded-l hidden lg:table-cell">شرح سطر اليومية التوجيهي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {journalLines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 font-medium text-slate-800">
                      <td className="p-2.5 font-mono font-bold text-slate-500 text-right">{line.accountCode}</td>
                      <td className="p-2.5 font-bold text-right">{line.accountName}</td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${line.type === 'debit' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>
                          {line.type === 'debit' ? 'مدين +' : 'دائن -'}
                        </span>
                      </td>
                      <td className="p-2.5 text-left font-mono font-black text-emerald-700">
                        {line.debit > 0 ? formatCurrency(line.debit) : '0.00'}
                      </td>
                      <td className="p-2.5 text-left font-mono font-black text-indigo-700">
                        {line.credit > 0 ? formatCurrency(line.credit) : '0.00'}
                      </td>
                      <td className="p-2.5 text-slate-500 text-[10.5px] max-w-xs truncate hidden lg:table-cell text-right">{line.notes}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white font-mono font-black text-left">
                    <td colSpan={3} className="p-3 text-right font-sans font-bold text-slate-300">أرصدة القيد المتوازنة للتأكيد المالي:</td>
                    <td className="p-3 text-left">
                      {formatCurrency(journalLines.reduce((acc, l) => acc + l.debit, 0))}
                    </td>
                    <td className="p-3 text-left">
                      {formatCurrency(journalLines.reduce((acc, l) => acc + l.credit, 0))}
                    </td>
                    <td className="hidden lg:table-cell"></td>
                  </tr>
                </tfoot>
              </table>

              <div className="mt-4 flex gap-2.5 items-center text-[10.5px] bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-500 leading-relaxed text-right">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  أكد محرك التوجيه المحاسبي توازن القيد الدفتري المزدوج بنسبة 100%. سيتم إدراج هذا السند تلقائياً في دفتر اليومية العامة وترحيل التأثير على حسابات الأستاذ العام بمجرد ضغط "الترحيل والإصدار".
                </span>
              </div>
            </div>

            {/* Footer btn */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end gap-3 text-xs">
              <button
                onClick={() => setIsJournalPreviewOpen(false)}
                className="px-4 py-2 bg-slate-250 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-all"
              >
                العودة لتعديل الفاتورة
              </button>
              <button
                onClick={() => {
                  setIsJournalPreviewOpen(false);
                  handlePostWholesaleOrder();
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black transition-all shadow-md"
              >
                ترحيل السند المحاسبي الموزون وإصدار الفاتورة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Goods Delivery Pass / Gatepass Modal (إذن صرف مخزني وحركة شحن) */}
      {isDeliveryNoteOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            {/* Header */}
            <div className="p-4 bg-amber-50 border-b border-amber-150 text-amber-900 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-600" />
                <div className="text-right">
                  <h3 className="font-bold text-sm">إذن صرف وتفويض خروج السلع والمخزون</h3>
                  <p className="text-[10px] text-amber-800/80">مستند لوجستي داخلي موجه لحراس البوابات ومسؤولي المستودعات لترخيص عبور الناقلين</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDeliveryNoteOpen(false)}
                className="px-3 py-1.5 text-xs bg-white text-amber-700 hover:text-amber-800 border border-amber-200 hover:bg-slate-50 rounded-lg font-bold transition-all"
              >
                إغلاق المعاينة
              </button>
            </div>

            {/* Document stats */}
            <div className="p-5 bg-amber-50/50 border-b border-amber-100 text-xs text-right space-y-3 relative select-none">
              <div className="absolute top-4 left-6 border-2 border-dashed border-red-350 rounded px-2.5 py-1 text-center rotate-3 opacity-80">
                <span className="text-red-600 font-black text-[11px] block tracking-normal">إذن تسليم بضاعة داخلي</span>
                <span className="text-slate-500 text-[9px] block">غير صالح للفواتير الضريبية</span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <span className="text-slate-500 block font-bold mb-0.5">المرسل (المستودع الرئيسي المرخص):</span>
                  <span className="text-slate-800 font-extrabold">
                    {dbWarehouses?.find(w => w.id === selectedWarehouseId)?.name || 'المستودع الجغرافي المركزي الآمن'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block font-bold mb-0.5">الجهة المستلمة (الوكيل الموجه):</span>
                  <span className="text-slate-800 font-extrabold">
                    {selectedCustomerId 
                      ? (customers.find(c => c.id === selectedCustomerId)?.name || 'أمين عملاء الجملة') 
                      : 'عميل البيع المباشر نقداً'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block font-bold mb-0.5">الناقل المسؤول / الشاحن:</span>
                  <span className="text-amber-800 font-extrabold">{shippingCarrier || 'خدمات النقل واللوجستيات الداخلية'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-bold mb-0.5">السائق المفوض واسمه:</span>
                  <span className="text-amber-800 font-extrabold">{driverName || 'معتمد بمندوب التوزيع والعهد'}</span>
                </div>
              </div>
            </div>

            {/* Goods inventory manifest (NO prices per enterprise requirements) */}
            <div className="p-5 flex-1 overflow-y-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100 border border-slate-205 text-slate-700 font-black">
                    <th className="p-2.5 rounded-r text-right w-12 text-slate-500 font-bold">#</th>
                    <th className="p-2.5 text-right w-36">الباركود الفني</th>
                    <th className="p-2.5 text-right font-black">اسم السلعة / الدواء أو الصنف المحاسبي</th>
                    <th className="p-2.5 text-right w-44">التصنيف والفرز</th>
                    <th className="p-2.5 text-center w-36">عبوة الشحن والوحدة</th>
                    <th className="p-2.5 text-center w-28 rounded-l text-indigo-900 font-black">الكمية المرخصة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 border-b border-slate-200">
                  {cart.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 font-medium text-slate-800 h-11">
                      <td className="p-2.5 font-mono font-bold text-slate-400 text-right">{idx + 1}</td>
                      <td className="p-2.5 font-mono text-slate-505 text-right text-[11px]">{item.barcode || 'N/A'}</td>
                      <td className="p-2.5 font-black text-slate-900 text-[12px] text-right">{item.name}</td>
                      <td className="p-2.5 text-slate-505 text-right">{item.category || 'عام التجارة'}</td>
                      <td className="p-2.5 text-center font-bold text-slate-700">{item.selectedUnitName || 'الأساسية (حبة)'}</td>
                      <td className="p-2.5 text-center font-mono font-black text-[14px] text-indigo-700 bg-indigo-50/40">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Dynamic signatures blocks to match requirements for corporate workflows */}
              <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center text-xs text-slate-600 pt-5 border-t border-slate-200">
                <div className="space-y-6">
                  <span className="block font-black text-slate-700">توقيع أمين المستودع المفوّض:</span>
                  <div className="h-10 border-b border-dashed border-slate-350"></div>
                  <span className="block text-[10px] text-slate-400 font-mono">سجل الأستاذ الموثق</span>
                </div>
                <div className="space-y-6">
                  <span className="block font-black text-slate-700">توقيع سائق الناقل المعتمد:</span>
                  <div className="h-10 border-b border-dashed border-slate-350"></div>
                  <span className="block text-[10px] text-slate-400">رقم الهوية: ____________</span>
                </div>

                <div className="space-y-6">
                  <span className="block font-black text-slate-700">توقيع حارس البوابة والوزن فرزاً:</span>
                  <div className="h-10 border-b border-dashed border-slate-400"></div>
                  <span className="block text-[10px] text-slate-400 font-mono">توقيت المرور والمراجعة</span>
                </div>
                <div className="space-y-6">
                  <span className="block font-black text-slate-700">توقيع المراجع المالي للمبيعات:</span>
                  <div className="h-10 border-b border-dashed border-slate-400"></div>
                  <span className="block text-[10px] text-slate-400">مركز التكلفة المعتمد</span>
                </div>
              </div>

              <div className="mt-6 flex gap-2.5 items-center text-[10px] bg-amber-50/50 p-3 rounded-lg border border-amber-200 text-slate-500 leading-relaxed text-right">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  تنبيه مستودعي: لا يغني هذا المستند عن الفاتورة الضريبية الرسمية لدفاتر العملاء الماليين، وهو مخصص حصرياً للرقابة الداخلية وحماية الأصول التجارية وكميات النقل والجر واللوجستيات لسيارات الشحن والتوصيل.
                </span>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end gap-3 text-xs col-span-full">
              <button
                onClick={() => setIsDeliveryNoteOpen(false)}
                className="px-5 py-2 bg-slate-250 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-all"
              >
                العودة للتوجيه ومسودة القيد
              </button>
              <button
                onClick={() => {
                  window.print();
                  success('جاري توجيه مستند إذن الصوف لطابعة ملصقات ومستندات المستودع اللاسلكية');
                }}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black transition-all shadow-md flex items-center gap-1.5"
              >
                طباعة إذن الصرف اللوجستي
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Custom ConfirmModal for Clearing Invoice */}
      <ConfirmModal
        isOpen={isClearConfirmOpen}
        title="تأكيد تصفير مسودة السند والقاموس"
        message="هل أنت متأكد من رغبتك في تفريغ خطوط قيد الفاتورة والمسودة بالكامل تصفير السلات لتهيئة قيد مبيعات جملة محاسبي جديد تماماً وثني المسيرة؟"
        onConfirm={() => {
          setCart([]);
          setIsClearConfirmOpen(false);
          success('تم بنجاح تفريغ مسودة خطوط الفاتورة الحالية');
        }}
        onCancel={() => setIsClearConfirmOpen(false)}
        confirmText="تصفير وتفريغ المسودة"
        cancelText="الرجوع للتعديل الحذر"
      />

      {/* 4. Manage Pricing Channels (إدارة قنوات التسعير) Modal */}
      {isPricingModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 text-right font-sans">
            {/* Header */}
            <div className="p-4 bg-emerald-50 border-b border-emerald-150 text-emerald-900 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-sm">إدارة قنوات التسعير المخصصة</h3>
                   <p className="text-[10px] text-emerald-800/80">إضافة وتعديل قنوات خصم وتسهيلات السلع لمبيعات الجملة</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPricingModalOpen(false)}
                className="px-3 py-1.5 text-xs bg-white text-emerald-700 hover:text-emerald-800 border border-emerald-200 hover:bg-slate-50 rounded-lg font-bold transition-all"
              >
                إغلاق
              </button>
            </div>

            {/* List of current channels */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 overflow-y-auto max-h-[30vh]">
              <span className="text-[11px] font-extrabold text-slate-600 block mb-2 font-black">قنوات التسعير الفعالة حالياً:</span>
              <div className="space-y-2">
                {pricingChannels.map(ch => (
                  <div key={ch.id} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs shadow-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-slate-800">{ch.name}</span>
                      <span className="text-[10px] text-slate-500">{ch.description || 'لا يوجد وصف'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded border border-emerald-150">
                        {ch.discountPercent}% خصم
                      </span>
                      {ch.id !== 'wholesale' ? (
                        <button
                          onClick={() => {
                            const updated = pricingChannels.filter(c => c.id !== ch.id);
                            // If currently selected channel was deleted, clear selection
                            if (pricingTier === ch.id) {
                              setPricingTier('wholesale');
                            }
                            setPricingChannels(updated);
                            localStorage.setItem('nima_wholesale_pricing_channels', JSON.stringify(updated));
                            success(`تم حذف قناة التسعير [ ${ch.name} ] بنجاح`);
                          }}
                          className="text-red-600 hover:text-red-850 hover:bg-red-50 p-1.5 rounded transition-all"
                          title="حذف القناة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[9.5px] text-slate-400 font-bold px-1.5 bg-slate-100 rounded border border-slate-200">الأساسية</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add New Channel form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!newChannelName.trim()) {
                  showError('الرجاء إدخال اسم القناة');
                  return;
                }
                const slug = 'channel_' + Date.now();
                const newCh = {
                  id: slug,
                  name: newChannelName.trim(),
                  discountPercent: Number(newChannelDiscount || 0),
                  description: newChannelDesc.trim() || `قناة مخصصة بخصم ${newChannelDiscount}%`
                };
                const updated = [...pricingChannels, newCh];
                setPricingChannels(updated);
                localStorage.setItem('nima_wholesale_pricing_channels', JSON.stringify(updated));
                success(`تمت إضافة قناة التسعير [ ${newChannelName} ] بنجاح`);
                // Clear state
                setNewChannelName('');
                setNewChannelDiscount(0);
                setNewChannelDesc('');
              }}
              className="p-4 flex flex-col gap-3"
            >
              <span className="text-[11px] font-extrabold text-slate-700 block font-black">إضافة قناة تسعير جديدة:</span>
              
              <div className="grid grid-cols-2 gap-3 text-right">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 font-bold">اسم القناة بالعربية *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: تسعير وكلاء التوزيع"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    className="bg-white border border-slate-300 focus:border-slate-400 text-xs rounded-lg px-2.5 py-1.5 text-slate-800 font-bold outline-none shadow-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 font-bold">نسبة الخصم السطري (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="مثال: 12"
                    value={newChannelDiscount === 0 ? '' : newChannelDiscount}
                    onChange={(e) => setNewChannelDiscount(Number(e.target.value))}
                    className="bg-white border border-slate-300 focus:border-slate-400 text-xs rounded-lg px-2.5 py-1.5 text-slate-800 font-bold font-mono outline-none shadow-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1 text-right">
                <label className="text-[10px] text-slate-500 font-bold">الوصف التعريفي (اختياري)</label>
                <input
                  type="text"
                  placeholder="وصف تفصيلي للقناة والعملاء المستحقين..."
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  className="bg-white border border-slate-300 focus:border-slate-400 text-xs rounded-lg px-2.5 py-1.5 text-slate-800 font-bold outline-none shadow-sm"
                />
              </div>

              <button
                type="submit"
                className="mt-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                إضافة وحفظ قناة التسعير
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
