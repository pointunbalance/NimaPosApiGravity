import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ShoppingCart, RotateCcw, Trash2, UserPlus, X, Plus, Minus, PauseCircle, FileSignature, Banknote, ArrowRight, Unlock, Monitor, Users, Search, ChevronDown, ChefHat, History, Clock } from 'lucide-react';
import { DeliveryAddressInput } from './DeliveryAddressInput';
import { CartItem, Customer, OrderType, AppSettings, User } from '../../types';
import { hardwareService } from '../../utils/hardware';
import { useToast } from '../../context/ToastContext';
import { motion } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';

// ... (CustomerSearchableSelect component)

const CustomerSearchableSelect = ({ customers, selectedCustomerId, onSelect }: { customers: Customer[], selectedCustomerId: number | null, onSelect: (id: number | null) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const filteredCustomers = useMemo(() => {
        if (!search) return customers;
        return customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone && c.phone.includes(search)));
    }, [customers, search]);

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

    return (
        <div className="relative flex-1" ref={wrapperRef}>
            <div 
                className="flex flex-between items-center bg-slate-50 hover:bg-slate-100/55 border border-slate-200 rounded-xl px-3 py-1 cursor-pointer text-sm font-extrabold text-slate-700 outline-none focus-within:ring-2 focus-within:ring-brand-550/20 focus-within:border-brand-550 transition-all h-full"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2 truncate flex-1 min-w-0 flex-row-reverse">
                    <Users className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate flex-1 text-right">
                        {selectedCustomer ? selectedCustomer.name : 'بحث واختيار عميل...'}
                    </span>
                </div>
                {selectedCustomer ? (
                    <button onClick={(e) => { e.stopPropagation(); onSelect(null); setSearch(''); }} className="p-1 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg shrink-0 ml-1 transition-colors" title="إزالة العميل">
                        <X className="w-4 h-4" />
                    </button>
                ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden flex flex-col max-h-64">
                    <div className="p-2 border-b border-slate-100 flex items-center gap-2 sticky top-0 bg-white">
                        <Search className="w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            autoFocus
                            placeholder="اكتب اسم أو هاتف العميل..."
                            className="w-full text-sm font-medium bg-transparent border-none outline-none text-slate-700"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="overflow-y-auto w-full p-1 scrollbar-thin">
                        <div 
                            className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm font-medium text-slate-700 rounded-lg transition-colors mb-1"
                            onClick={() => { onSelect(null); setIsOpen(false); }}
                        >
                            اختر العميل...
                        </div>
                        {filteredCustomers.length === 0 ? (
                            <div className="px-3 py-4 text-center text-sm text-slate-400">لا يوجد نتائج</div>
                        ) : (
                            filteredCustomers.map(c => (
                                <div 
                                    key={c.id} 
                                    className="px-3 py-2 hover:bg-brand-50 cursor-pointer text-sm font-bold text-slate-700 rounded-lg transition-colors flex justify-between items-center"
                                    onClick={() => { onSelect(c.id!); setIsOpen(false); setSearch(''); }}
                                >
                                    <span>{c.name}</span>
                                    {c.phone && <span className="text-[10px] text-slate-400 font-normal group-hover:text-brand-500">{c.phone}</span>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

interface CartSidebarProps {
    uiScale?: number;
    cart: CartItem[];
    setCart: (cart: CartItem[] | ((prev: CartItem[]) => CartItem[])) => void;
    users: User[] | undefined;
  selectedSalespersonId: number | null;
  setSelectedSalespersonId: (id: number | null) => void;
  isRefundMode: boolean;
    selectedCustomerId: number | null;
    setSelectedCustomerId: (id: number | null) => void;
    customers: Customer[] | undefined;
    setIsQuickCustomerModalOpen: (isOpen: boolean) => void;
    orderType: OrderType;
    setOrderType: (type: OrderType) => void;
    settings: AppSettings | undefined;
    
    // Delivery
    deliveryAddress: string;
    setDeliveryAddress: (address: string) => void;
    deliveryPhone: string;
    setDeliveryPhone: (phone: string) => void;
    deliveryFee: number;
    setDeliveryFee: (fee: number) => void;
    
    // Maintenance
    deviceSerial: string;
    setDeviceSerial: (serial: string) => void;
    issueDescription: string;
    setIssueDescription: (desc: string) => void;
    deviceAttachments: string;
    setDeviceAttachments: (att: string) => void;

    // Dine-in
    selectedTable: string | null;
    setIsTableSelectionModalOpen: (isOpen: boolean) => void;
    
    // Cart Actions
    openLineItemModal: (item: CartItem) => void;
    updateQuantity: (id: string, delta: number) => void;
    removeFromCart: (id: string) => void;
    
    // Totals & Order Actions
    totals: { subtotal: number; discountAmount: number; tax: number; total: number };
    setIsDiscountModalOpen: (isOpen: boolean) => void;
    isTaxEnabled: boolean;
    taxRate: number;
    orderNote: string;
    setOrderNote: (note: string) => void;
    promoCode: string;
    setPromoCode: (code: string) => void;
    setDiscountValue: (val: number) => void;
    handleHoldOrder: (clear?: boolean) => Promise<void> | void;
    handleSaveQuotation: () => void;
    handleSendToKitchen?: () => void;
    handleFastCash?: () => void;
    initiatePayment: () => void;
    formatCurrency: (amount: number) => string;
    isWholesale?: boolean;
    heldOrders?: any[];
    handleRetrieveOrder?: (id: number) => void;
    activeHeldOrderId?: number | null;
}

export const CartSidebar: React.FC<CartSidebarProps> = React.memo(({
    uiScale = 1,
    cart, setCart, users, selectedSalespersonId, setSelectedSalespersonId, isRefundMode, selectedCustomerId, setSelectedCustomerId, customers, setIsQuickCustomerModalOpen,
    orderType, setOrderType, settings,
    deliveryAddress, setDeliveryAddress, deliveryPhone, setDeliveryPhone, deliveryFee, setDeliveryFee,
    deviceSerial, setDeviceSerial, issueDescription, setIssueDescription, deviceAttachments, setDeviceAttachments,
    selectedTable, setIsTableSelectionModalOpen,
    openLineItemModal, updateQuantity, removeFromCart,
    totals, setIsDiscountModalOpen, isTaxEnabled, taxRate, orderNote, setOrderNote, promoCode, setPromoCode, setDiscountValue,
    handleHoldOrder, handleSaveQuotation, handleSendToKitchen, handleFastCash, initiatePayment, formatCurrency, isWholesale,
    heldOrders, handleRetrieveOrder, activeHeldOrderId
}) => {
    const { success, error } = useToast();

    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    const customerOrders = useLiveQuery(
        async () => {
            if (!selectedCustomerId) return [];
            return await db.orders.where('customerId').equals(selectedCustomerId).reverse().toArray();
        },
        [selectedCustomerId]
    ) || [];

    const customerPayments = useLiveQuery(
        async () => {
            if (!selectedCustomerId) return [];
            return await db.customerPayments.where('customerId').equals(selectedCustomerId).reverse().toArray();
        },
        [selectedCustomerId]
    ) || [];

    const handleOpenDrawer = async () => {
        try {
            await hardwareService.openCashDrawer();
            success('تم إرسال أمر فتح الدرج');
        } catch (e: any) {
            error(e.message || 'فشل فتح الدرج');
        }
    };

    const handleOpenCDS = () => {
        window.open('#/customer-display', 'cds_window', 'width=1024,height=768');
    };

    const isEnabled = (key: keyof NonNullable<AppSettings['posSettings']>) => {
        if (!settings?.posSettings) return true;
        if (settings.posSettings[key] === undefined) return true;
        return settings.posSettings[key];
    };

    const getPriceColorClass = (item: CartItem, isWholesaleView: boolean = false) => {
        if (item.quantity < 0) return 'text-red-600';
        if (item.originalPrice !== undefined && item.originalPrice !== item.price) {
            if (item.price > item.originalPrice) return 'text-blue-600 font-black';
            if (item.price < item.originalPrice) return 'text-red-600 font-black';
        }
        return isWholesaleView ? 'text-slate-600' : 'text-brand-600 font-black';
    };

    const getCartItemPriceClass = (item: CartItem) => {
        if (item.originalPrice !== undefined && item.originalPrice === item.price && item.customerPriceInfo) {
             return 'text-emerald-600 font-black';
        }
        return getPriceColorClass(item, false);
    };
    
    const getCartItemWholesalePriceClass = (item: CartItem) => {
         if (item.originalPrice !== undefined && item.originalPrice === item.price && item.customerPriceInfo) {
             return 'text-emerald-600 font-black';
         }
         return getPriceColorClass(item, true);
    };

    return (
        <div 
            className={`w-full ${isWholesale ? 'md:w-[400px] lg:w-[460px] xl:w-[500px]' : 'md:w-[340px] lg:w-[380px] xl:w-[420px]'} shrink-0 ${isWholesale ? 'bg-slate-50 p-4 md:p-6' : 'bg-white p-0'} border-t md:border-t-0 md:border-r border-transparent shadow-[-4px_0_40px_rgba(0,0,0,0.04)] flex flex-col z-20 h-screen overflow-hidden relative ${isRefundMode ? 'border-t-4 md:border-t-0 md:border-r-4 border-red-500' : ''}`}
            style={{ paddingBottom: '24px' }}
        >
        
        {/* Cart Tabs (Multiple Active Carts) */}
        {isEnabled('showHoldBill') && (
            <div className={`flex ${isWholesale ? 'bg-slate-200/60 rounded-lg p-0.5 mb-2' : 'bg-slate-100 px-2 py-1'} gap-1 overflow-x-auto scrollbar-none border-b border-slate-200/55 items-center min-h-[44px]`}>
                {/* Default/New Cart Tab */}
                {!activeHeldOrderId && (
                    <div className="px-3 py-1.5 bg-white rounded-t-lg shadow-sm font-bold text-xs text-brand-600 whitespace-nowrap min-w-[max-content]">
                        فاتورة جديدة {cart.length > 0 && '*'}
                    </div>
                )}
                
                {/* Held Tabs */}
                {heldOrders && heldOrders.length > 0 && heldOrders.map((order, idx) => {
                    const isActive = activeHeldOrderId === order.id;
                    return (
                        <button
                            key={order.id || idx}
                            onClick={async () => {
                                if (isActive) return;
                                if (cart.length > 0 || activeHeldOrderId) {
                                    if (handleHoldOrder) await handleHoldOrder(false); // Save current state without clearing
                                }
                                if(handleRetrieveOrder && order.id) handleRetrieveOrder(order.id);
                            }}
                            className={`px-3 py-1.5 rounded-t-lg font-bold text-xs transition-colors whitespace-nowrap min-w-[max-content] flex items-center gap-2
                                ${isActive ? 'bg-white text-brand-600 shadow-sm' : 'bg-slate-200 hover:bg-slate-300 text-slate-600'}
                            `}
                        >
                            <span>{order.customerId ? 'عميل مسجل' : `فاتورة (${idx + 1})`} {isActive && cart.length > 0 && '*'}</span>
                            <span className={`text-[10px] font-normal ${isActive ? 'text-brand-400' : 'text-slate-400'}`}>{(order.items || []).length} صنف</span>
                        </button>
                    )
                })}

                {/* New Cart Tab */}
                <button
                    onClick={async () => {
                        if (cart.length > 0 || activeHeldOrderId) {
                            if (handleHoldOrder) handleHoldOrder(true);
                        }
                    }}
                    className="p-1 text-slate-400 hover:text-brand-600 transition-colors shrink-0 ml-1"
                    title="فاتورة جديدة"
                >
                    <Plus className="w-5 h-5 bg-slate-200 rounded-md p-0.5" />
                </button>
            </div>
        )}

        {isWholesale ? (
            /* --- Wholesale Premium Invoice Style Paper Wrapper --- */
            <div className="flex-1 min-h-0 bg-[#FCFCF9] border-2 border-b-0 border-slate-300/85 rounded-t-2xl shadow-xl flex flex-col relative overflow-hidden mb-0" dir="rtl">
                {/* Jagged / Serrated Top Edge */}
                <div className="h-1.5 w-full bg-repeat-x shrink-0" style={{ 
                    backgroundImage: 'linear-gradient(-135deg, #cbd5e1 4px, transparent 0), linear-gradient(135deg, #cbd5e1 4px, transparent 0)',
                    backgroundSize: '10px 10px'
                }} />

                {/* Print Corporate Title */}
                <div className="px-5 pt-4 pb-1 text-center font-sans">
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <h3 className="font-black text-slate-800 text-base leading-tight">
                            {settings?.storeName || 'شركة الميزان للتجارة والتوزيع'}
                        </h3>
                        <span className="text-slate-300 text-xs">•</span>
                        <p className="text-[10px] text-slate-400 font-bold tracking-wide">
                            {settings?.address || 'تجارة الجملة والتوريدات'}
                        </p>
                    </div>
                    
                    <div className="inline-block border border-slate-200 rounded px-2.5 py-0.5 my-2.5 text-slate-500 text-[10px] font-extrabold bg-slate-50 mt-2">
                        مسودة الفاتورة
                    </div>
                    
                    {/* Invoice Meta Grid */}
                    <div className="grid grid-cols-2 gap-y-1 text-[9px] text-slate-400 font-bold bg-slate-50 p-2 rounded-lg mt-1 tracking-tight">
                        <div className="text-right flex items-center justify-between px-2"><span>التاريخ:</span> <span className="font-medium text-slate-500">{new Date().toLocaleDateString('ar-EG', {month: 'numeric', day: 'numeric', year: 'numeric'})}</span></div>
                        <div className="text-left flex items-center justify-between px-2 border-r border-slate-100"><span>الوقت:</span> <span className="font-medium text-slate-500">{new Date().toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'})}</span></div>
                        <div className="text-right flex items-center justify-between px-2"><span>النوع:</span> <span className="font-medium text-slate-500">{orderType === 'direct' ? 'نقدي/فوري' : orderType === 'delivery' ? 'شحن لعميل' : 'حجز أجل'}</span></div>
                        <div className="text-left flex items-center justify-between px-2 border-r border-slate-100"><span>المشغل:</span> <span className="font-medium text-slate-500">أدمن النظام</span></div>
                    </div>
                </div>

                {/* Customer selection area beautifully blended into receipt card */}
                <div className="px-4 py-2 bg-[#F6F5EE]/70 border-b border-dashed border-slate-300 space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-600">بيانات العميل المستلم:</span>
                        <div className="flex gap-1.5">
                            <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[9px] font-bold">
                                {cart.length} أصناف في السلة
                            </span>
                            {cart.length > 0 && (
                                <button onClick={() => { setCart([]); setDiscountValue(0); setOrderNote(''); }} className="p-0.5 hover:bg-red-50 text-red-500 rounded transition-colors" title="إفراغ السلة">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-1.5 h-[34px]">
                        <CustomerSearchableSelect 
                            customers={customers || []} 
                            selectedCustomerId={selectedCustomerId} 
                            onSelect={setSelectedCustomerId} 
                        />
                        <button 
                            onClick={() => setIsQuickCustomerModalOpen(true)}
                            className="bg-white border border-slate-300 text-brand-600 p-2 rounded-xl hover:bg-brand-50 transition-colors shrink-0"
                            title="إضافة عميل سريع"
                        >
                            <UserPlus className="w-4 h-4" />
                        </button>
                    </div>

                    {selectedCustomerId && customers?.find(c => c.id === selectedCustomerId) && (
                        <div className="text-[9.5px] px-2.5 py-1.5 bg-white border border-dashed border-slate-200 rounded-lg flex justify-between items-center">
                            <div>
                                <span className="text-slate-500 font-bold">الحساب الحالي: </span>
                                <span className={`font-black ${customers.find(c => c.id === selectedCustomerId)!.balance! < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                                    {formatCurrency(customers.find(c => c.id === selectedCustomerId)!.balance || 0)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {settings?.loyaltySettings?.enabled && (
                                    <span className="text-[8.5px] text-slate-400">نقاط: {customers.find(c => c.id === selectedCustomerId)!.loyaltyPoints || 0}</span>
                                )}
                                <button 
                                    type="button"
                                    onClick={() => setIsHistoryModalOpen(true)}
                                    className="p-1 bg-slate-50 hover:bg-brand-50 border border-slate-200 text-slate-600 rounded cursor-pointer"
                                    title="كشف الحساب"
                                >
                                    <History className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Delivery & Salesperson option row inside receipt styling */}
                    <div className="flex justify-between items-center text-[10.5px] text-slate-700 font-bold border-t border-dashed border-slate-200/65 pt-2">
                        <div className="flex items-center gap-1">
                            <span className="text-slate-400">طريقة الاستلام:</span>
                            <select 
                                value={orderType} 
                                onChange={(e) => setOrderType(e.target.value as any)}
                                className="bg-transparent border-none py-0.5 px-0.5 font-extrabold text-slate-800 outline-none cursor-pointer"
                            >
                                {settings?.businessType === 'retail' ? (
                                    <>
                                        <option value="direct">مباشر/فوري</option>
                                        <option value="delivery">شحن وتوصيل</option>
                                    </>
                                ) : settings?.businessType === 'service' ? (
                                    <>
                                        <option value="receive">استلام</option>
                                        <option value="deliver">تسليم</option>
                                        <option value="maintenance">صيانة</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="takeaway">سفري</option>
                                        <option value="dine-in">صالة</option>
                                        <option value="delivery">شحن وتوصيل</option>
                                    </>
                                )}
                            </select>
                        </div>

                        {settings?.posSettings?.showSalespersonSelect && (
                            <div className="flex items-center gap-1">
                                <span className="text-slate-400"> مندوب البيع:</span>
                                <select
                                    value={selectedSalespersonId || ''}
                                    onChange={(e) => setSelectedSalespersonId(e.target.value ? Number(e.target.value) : null)}
                                    className="bg-transparent border-none py-0.5 px-0.5 font-extrabold text-slate-800 outline-none cursor-pointer w-24 truncate"
                                >
                                    <option value="">(بدون)</option>
                                    {users?.map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {orderType === 'delivery' && (
                        <div className="relative z-10 bg-white p-2 rounded-xl border border-dashed border-slate-300">
                            <DeliveryAddressInput 
                                deliveryAddress={deliveryAddress}
                                setDeliveryAddress={setDeliveryAddress}
                                deliveryPhone={deliveryPhone}
                                setDeliveryPhone={setDeliveryPhone}
                                deliveryFee={deliveryFee}
                                setDeliveryFee={setDeliveryFee}
                            />
                        </div>
                    )}
                </div>

                {/* Receipt Grid Headers */}
                <div className="grid grid-cols-12 gap-1 bg-slate-200/60 px-3 py-2.5 text-[11px] md:text-xs font-black text-slate-700 uppercase border-y border-dashed border-slate-300 sticky top-0 z-10">
                    <div className="col-span-4 pr-1">الصنف والوصف</div>
                    <div className="col-span-2 text-center">السعر</div>
                    <div className="col-span-3 text-center">الكمية والمقابلة</div>
                    <div className="col-span-3 pl-1 text-left">الإجمالي</div>
                </div>

                {/* Scrolling Cart Items styled exactly like printed thermal rolls */}
                <div className="flex-1 min-h-[150px] overflow-y-auto custom-scrollbar bg-[#FCFCF9] divide-y divide-dashed divide-slate-300">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                            <div className="w-16 h-16 bg-amber-50/80 border border-amber-200 rounded-full flex items-center justify-center shadow-sm">
                                <ShoppingCart className="w-7 h-7 text-amber-600 stroke-[2]" />
                            </div>
                            <div className="text-center">
                                <h3 className="font-extrabold text-xs text-slate-600">الفاتورة فارغة حالياً</h3>
                                <p className="text-[10px] text-slate-450 mt-0.5 font-bold">أضف منتجات من كتالوج الجملة باليمين</p>
                            </div>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.cartItemId} className="grid grid-cols-12 gap-1 px-3 py-3.5 items-center hover:bg-slate-100/50 transition-colors group relative font-mono text-slate-900 leading-tight border-b border-slate-100/50 last:border-0">
                                <div className="col-span-4 pr-1 flex flex-col justify-center">
                                    <div onClick={() => { if (isEnabled('showCustomPrice')) openLineItemModal(item); }} className={`font-black text-xs md:text-sm leading-tight text-slate-900 ${isEnabled('showCustomPrice') ? 'cursor-pointer hover:underline text-blue-800' : ''}`}>
                                        {item.name}
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-1 font-sans">
                                        {item.selectedUnit && (
                                            <span className="text-[8px] bg-slate-200 text-slate-800 px-1 py-0.5 rounded font-black">
                                                {item.selectedUnit.name}
                                            </span>
                                        )}
                                        {item.customerPriceInfo && (
                                            <div className="flex flex-col text-[8px] leading-tight text-amber-700 bg-amber-100/70 p-1 rounded-sm">
                                                <span className="font-bold">سعر معتمد مسبقاً للعميل: {formatCurrency(item.customerPriceInfo.price)}</span>
                                                <span className="opacity-95 text-[7px]" dir="ltr">
                                                    ORD-{item.customerPriceInfo.orderId} ({new Date(item.customerPriceInfo.date).toLocaleDateString('ar-EG')})
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="col-span-2 flex items-center justify-center text-xs md:text-sm">
                                    <span className={`font-mono font-bold whitespace-nowrap ${getCartItemWholesalePriceClass(item)}`}>
                                        {formatCurrency(item.price)}
                                    </span>
                                </div>

                                <div className="col-span-3 flex justify-center">
                                    <div className="flex bg-slate-100/80 rounded-md w-full max-w-[80px] shrink-0 p-0.5">
                                        <button onClick={() => updateQuantity(item.cartItemId!, 1)} className="flex-1 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-white rounded py-1 font-bold transition-all"><Plus className="w-3.5 h-3.5" /></button>
                                        <div className={`w-8 flex items-center justify-center text-[11px] font-black ${item.quantity < 0 ? 'text-red-500' : 'text-slate-700'}`}>
                                            {Math.abs(item.quantity)}
                                        </div>
                                        <button onClick={() => updateQuantity(item.cartItemId!, -1)} className="flex-1 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-white rounded py-1 font-bold transition-all"><Minus className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>

                                <div className="col-span-3 flex justify-between items-center pl-1">
                                    <span className="text-xs md:text-sm font-black text-slate-950 whitespace-nowrap">
                                        {formatCurrency((item.price * item.quantity))}
                                    </span>
                                    {/* Action items */}
                                    <button onClick={() => removeFromCart(item.cartItemId!)} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors" title="إزالة">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Double Dash dividing line between items and totals */}
                <div className="h-0.5 w-full bg-slate-300 border-t border-b border-double border-slate-400 shrink-0" />

                {/* Print Totals inside Receipt Body */}
                <div className="shrink-0 px-4 py-3 bg-[#FCFCF9]/90 border-t border-dashed border-slate-300 flex flex-col justify-between font-mono">
                    <div className="space-y-3">
                        <div className="space-y-1.5 text-[11px] md:text-xs font-bold text-slate-700">
                            <div className="flex justify-between items-center">
                                <span>جملة البضائع المضافة: (بدون خصم)</span>
                                <span className="text-slate-900 font-mono min-w-[100px] text-left">{formatCurrency(totals.subtotal)}</span>
                            </div>
                            
                            <div 
                                className={`flex justify-between items-center transition-colors ${isEnabled('showQuickDiscount') ? 'cursor-pointer hover:text-red-700 hover:underline' : ''}`}
                                onClick={() => { if (isEnabled('showQuickDiscount')) setIsDiscountModalOpen(true); }}
                            >
                                <span className="flex items-center gap-1.5">خصم تجاري خاص الفاتورة: <span className="text-[9px] font-sans bg-rose-50 text-rose-600 px-1 rounded border border-rose-100">تعديل</span></span>
                                <span className="text-rose-600 font-mono min-w-[100px] text-left">-{formatCurrency(totals.discountAmount)}</span>
                            </div>

                            {isTaxEnabled && (
                                <div className="flex justify-between items-center">
                                    <span>ضريبة القيمة المضافة ({taxRate}%):</span>
                                    <span className="text-slate-900 font-mono min-w-[100px] text-left">{formatCurrency(totals.tax)}</span>
                                </div>
                            )}
                        </div>

                        {/* Inputs inside receipt layout */}
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-dashed border-slate-300">
                            <input 
                                type="text" 
                                placeholder="تدوين ملاحظة في الفاتورة..." 
                                value={orderNote}
                                onChange={e => setOrderNote(e.target.value)}
                                className="bg-white border border-slate-300 rounded px-2 py-1.5 text-[11px] md:text-xs font-sans outline-none focus:border-slate-500 focus:ring-0 text-slate-800"
                            />
                            <input 
                                type="text" 
                                placeholder="كود الخصم / الترويجي..." 
                                value={promoCode}
                                onChange={e => setPromoCode(e.target.value.toUpperCase())}
                                className="bg-white border border-slate-300 rounded px-2 py-1.5 text-[11px] md:text-xs font-mono outline-none focus:border-slate-500 focus:ring-0 text-slate-800 uppercase"
                            />
                        </div>
                    </div>

                    {/* Highlighted Net Total with generous padding to give financial section superb vertical breathing room */}
                    <div className="my-3">
                        <div className="bg-brand-50/70 border border-brand-100 rounded-xl py-5 px-4 flex justify-between items-center text-brand-900 shadow-sm shadow-brand-100/50">
                            <span className="text-sm font-black font-sans">الصافي المطلوب سداده:</span>
                            <span className="text-xl lg:text-2xl font-black tracking-tight min-w-[100px] text-left">{formatCurrency(totals.total)}</span>
                        </div>
                    </div>

                    {/* Signatures & Barcode placeholder to make the bill look extremely authentic */}
                    <div className="flex justify-between items-center text-[9px] md:text-[10px] text-slate-400 font-bold border-t border-dashed border-slate-200 pt-3">
                        <div className="space-y-0.5 mt-1">
                            <div>رقم المستند المؤقت: <span className="font-mono text-slate-600">DRAFT-{Date.now().toString().slice(-6)}</span></div>
                            <div>توقيع المستلم: ...............................</div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            {/* Barcode representation */}
                            <div className="h-5 w-20 flex gap-[1.5px] items-stretch bg-white p-0.5 border border-slate-200">
                                <div className="w-[1px] bg-black"></div>
                                <div className="w-[3px] bg-black"></div>
                                <div className="w-[1px] bg-black"></div>
                                <div className="w-[2px] bg-black"></div>
                                <div className="w-[4px] bg-black"></div>
                                <div className="w-[1px] bg-black"></div>
                                <div className="w-[2px] bg-black"></div>
                                <div className="w-[3px] bg-black"></div>
                                <div className="w-[1px] bg-black"></div>
                                <div className="w-[2px] bg-black"></div>
                                <div className="w-[1px] bg-black"></div>
                            </div>
                            <span className="font-mono text-[7px] text-slate-500 tracking-widest leading-none">MEZAN-WHOLESALE</span>
                        </div>
                    </div>
                </div>

                {/* Jagged Bottom Edge */}
                <div className="h-1.5 w-full bg-repeat-x shrink-0" style={{ 
                    backgroundImage: 'linear-gradient(45deg, #cbd5e1 4px, transparent 0), linear-gradient(-45deg, #cbd5e1 4px, transparent 0)',
                    backgroundSize: '10px 10px'
                }} />
            </div>
        ) : (
            /* --- Standard Retail Point of Sale Style --- */
            <>
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-slate-50/50" dir="rtl">
                    {/* --- RETAIL TOP SECTION: Combined Header and Dynamic Selectors Area --- */}
                    <div className="shrink-0 flex flex-col bg-white border-b border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.015)] select-none">
                        {/* Sleek Horizontal Compact Bar for Customer & Invoice Header */}
                        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100 shrink-0 select-none">
                            {/* Left-aligned Order Info and Pills */}
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black text-slate-400">طلب رقم:</span>
                                <span className="text-[11px] font-black text-slate-800 tracking-tight font-sans">
                                    #{activeHeldOrderId ? `HLD-${activeHeldOrderId}` : `R-${Date.now().toString().slice(-4)}`}
                                </span>
                                
                                {/* Status badges */}
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100/70 leading-none">
                                    مفتوحة
                                </span>

                                {orderType === 'delivery' && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-50 text-blue-700 border border-blue-100/70 leading-none">
                                        توصيل
                                    </span>
                                )}
                                {orderType === 'dine-in' && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-50 text-amber-700 border border-amber-100/70 leading-none">
                                        صالة
                                    </span>
                                )}
                                {orderType === 'takeaway' && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-50 text-purple-700 border border-purple-100/70 leading-none">
                                        سفري
                                    </span>
                                )}
                                {orderType === 'direct' && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-teal-50 text-teal-700 border border-teal-100/70 leading-none">
                                        فوري
                                    </span>
                                )}
                            </div>

                            {/* Right-aligned actions */}
                            <div className="flex items-center gap-1.5">
                                <button onClick={handleOpenCDS} className="p-1 px-1.5 text-slate-400 hover:text-indigo-650 hover:bg-slate-100 rounded-lg transition-colors border border-transparent" title="شاشة العميل">
                                    <Monitor className="w-3.5 h-3.5" />
                                </button>
                                {settings?.useHardwarePrinter && (
                                    <button onClick={handleOpenDrawer} className="p-1 px-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors border border-transparent" title="درج الكاشير">
                                        <Unlock className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <span className="bg-slate-200/75 text-slate-700 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-tight">{cart.length} أصناف</span>
                                {cart.length > 0 && (
                                    <button onClick={() => { setCart([]); setDiscountValue(0); setOrderNote(''); }} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="إفراغ السلة">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="hidden">
                     <div className="flex justify-between items-center">
                         <h2 className="font-extrabold text-base text-slate-800 flex items-center gap-1.5">
                            {isRefundMode ? <RotateCcw className="text-red-500 w-4 h-4"/> : <ShoppingCart className="text-brand-600 w-4 h-4"/>}
                            {isRefundMode ? 'وضع المرتجع (F9)' : 'سلة المشتريات'}
                         </h2>
                         <div className="flex items-center gap-2">
                             <button onClick={handleOpenCDS} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors" title="فتح شاشة العميل">
                                 <Monitor className="w-4 h-4" />
                             </button>
                             {settings?.useHardwarePrinter && (
                                 <button onClick={handleOpenDrawer} className="p-1.5 bg-slate-50 text-slate-500 rounded-lg hover:bg-slate-100 transition-colors" title="فتح درج النقود">
                                     <Unlock className="w-4 h-4" />
                                 </button>
                             )}
                             <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">{cart.length} أصناف</span>
                             {cart.length > 0 && (
                                 <button onClick={() => { setCart([]); setDiscountValue(0); setOrderNote(''); }} className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors" title="إفراغ السلة">
                                     <Trash2 className="w-4 h-4" />
                                 </button>
                             )}
                         </div>
                     </div>
                 </div>
                     
                     {/* Customer & Type Selector */}
                     
                     {/* Premium Customer & Type Selector */}
                     <div className="p-3.5 bg-white border-b border-slate-150 flex flex-col gap-2.5 shadow-3xs select-none">
                         <div className="flex gap-2">
                             <div className="flex-1 flex flex-col gap-1">
                                 <div className="flex gap-2 h-[38px] items-center">
                                     <CustomerSearchableSelect 
                                        customers={customers || []} 
                                        selectedCustomerId={selectedCustomerId} 
                                        onSelect={setSelectedCustomerId} 
                                     />
                                     <button 
                                         onClick={() => setIsQuickCustomerModalOpen(true)}
                                         className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 h-[38px] w-[38px] rounded-xl transition-all shrink-0 flex items-center justify-center active:scale-95 shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20"
                                         title="إضافة عميل سريع"
                                     >
                                         <UserPlus className="w-4 h-4 stroke-[2.5]" />
                                     </button>
                                 </div>
                                 {selectedCustomerId && customers?.find(c => c.id === selectedCustomerId) && (
                                     <div className="text-[10px] px-3 py-1.5 bg-slate-50/75 rounded-xl border border-slate-150 mt-1 flex justify-between items-center transition-all">
                                         <div className="flex items-center gap-3.5">
                                             <span className="font-bold text-slate-500 flex items-center gap-1.5">
                                                 <span>الرصيد المستحق:</span>
                                                 <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${customers.find(c => c.id === selectedCustomerId)!.balance! < 0 ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                                                     {formatCurrency(customers.find(c => c.id === selectedCustomerId)!.balance || 0)}
                                                 </span>
                                             </span>
                                             {settings?.loyaltySettings?.enabled && (
                                                 <span className="border-r border-slate-150 pr-3 font-bold text-slate-500 flex items-center gap-1.5">
                                                     <span>الولاء:</span>
                                                     <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-md text-[10px] font-black">
                                                         {customers.find(c => c.id === selectedCustomerId)!.loyaltyPoints || 0}
                                                     </span>
                                                 </span>
                                             )}
                                         </div>
                                         <button 
                                             type="button"
                                             onClick={() => setIsHistoryModalOpen(true)}
                                             className="w-6 h-6 flex items-center justify-center bg-white hover:bg-brand-50 border border-slate-200 hover:border-brand-200 text-slate-500 hover:text-brand-600 rounded-lg transition-all shrink-0 cursor-pointer shadow-3xs"
                                             title="عرض كشف الحساب والمشتريات والمدفوعات السابقة"
                                         >
                                             <History className="w-3.5 h-3.5" />
                                         </button>
                                     </div>
                                 )}
                             </div>
                             <select 
                                value={orderType} 
                                onChange={(e) => setOrderType(e.target.value as any)}
                                className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-black text-slate-600 outline-none h-[38px] cursor-pointer hover:border-slate-300 transition-colors"
                             >
                                 {settings?.businessType === 'retail' ? (
                                     <>
                                         <option value="direct">مباشر</option>
                                         <option value="delivery">توصيل</option>
                                     </>
                                 ) : settings?.businessType === 'service' ? (
                                     <>
                                         <option value="receive">استلام</option>
                                         <option value="deliver">تسليم</option>
                                         <option value="maintenance">صيانة</option>
                                     </>
                                 ) : (
                                     <>
                                         <option value="takeaway">سفري</option>
                                         <option value="dine-in">صالة</option>
                                         <option value="delivery">توصيل</option>
                                     </>
                                 )}
                             </select>
                         </div>
                     </div>
                     
                     {/* Isolate old selectors */}
                     <div className="hidden">
                     {/* Customer & Type Selector */}
                     <div className="flex gap-2">
                         <div className="flex-1 flex flex-col gap-1.5">
                             <div className="flex gap-1.5 h-[34px]">
                                 <CustomerSearchableSelect 
                                    customers={customers || []} 
                                    selectedCustomerId={selectedCustomerId} 
                                    onSelect={setSelectedCustomerId} 
                                 />
                                 <button 
                                     onClick={() => setIsQuickCustomerModalOpen(true)}
                                     className="bg-white border border-slate-200 text-brand-650 p-2 rounded-xl hover:bg-brand-50 hover:border-brand-300 transition-all shrink-0 flex items-center justify-center active:scale-95 shadow-3xs"
                                     title="إضافة عميل سريع"
                                 >
                                     <UserPlus className="w-4 h-4" />
                                 </button>
                             </div>
                             {selectedCustomerId && customers?.find(c => c.id === selectedCustomerId) && (
                                 <div className="text-[10px] px-2.5 py-1 bg-slate-50 rounded-xl border border-slate-200 mt-1.5 flex justify-between items-center transition-all shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                                     <div className="flex items-center gap-3">
                                         <span className="font-bold text-slate-600 flex items-center gap-1.5"><span>الرصيد المستحق:</span><span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black border ${customers.find(c => c.id === selectedCustomerId)!.balance! < 0 ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'}`}>{formatCurrency(customers.find(c => c.id === selectedCustomerId)!.balance || 0)}</span></span>
                                         {settings?.loyaltySettings?.enabled && (
                                             <span className="border-r border-slate-200 pr-2 mr-1 font-bold text-slate-600 flex items-center gap-1.5"><span>الولاء:</span><span className="bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded-md text-[10px] font-black">{customers.find(c => c.id === selectedCustomerId)!.loyaltyPoints || 0}</span></span>
                                         )}
                                     </div>
                                     <button 
                                         type="button"
                                         onClick={() => setIsHistoryModalOpen(true)}
                                         className="w-5.5 h-5.5 flex items-center justify-center bg-white hover:bg-brand-50 border border-slate-200 hover:border-brand-200 text-slate-500 hover:text-brand-600 rounded-lg transition-all shrink-0 cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                                         title="عرض كشف الحساب والمشتريات والمدفوعات السابقة"
                                     >
                                         <History className="w-3.5 h-3.5" />
                                     </button>
                                 </div>
                             )}
                         </div>
                         <select 
                            value={orderType} 
                            onChange={(e) => setOrderType(e.target.value as any)}
                            className="w-20 bg-slate-50 border border-slate-200 rounded-xl px-1.5 py-1 text-xs font-bold text-slate-600 outline-none h-[34px] cursor-pointer"
                         >
                             {settings?.businessType === 'retail' ? (
                                 <>
                                     <option value="direct">مباشر</option>
                                     <option value="delivery">توصيل</option>
                                 </>
                             ) : settings?.businessType === 'service' ? (
                                 <>
                                     <option value="receive">استلام</option>
                                     <option value="deliver">تسليم</option>
                                     <option value="maintenance">صيانة</option>
                                 </>
                             ) : (
                                 <>
                                     <option value="takeaway">سفري</option>
                                     <option value="dine-in">صالة</option>
                                     <option value="delivery">توصيل</option>
                                 </>
                             )}
                         </select>
                     </div>

                     </div>

                     {/* Salesperson Selection */}
                     {settings?.posSettings?.showSalespersonSelect && (
                         <div className="mt-3 flex items-center justify-between p-2 bg-purple-50 rounded-xl border border-purple-100">
                             <div className="flex items-center gap-2 text-purple-700">
                                 <Users className="w-4 h-4" />
                                 <span className="text-xs font-bold">المندوب/البائع:</span>
                             </div>
                             <select
                                 value={selectedSalespersonId || ''}
                                 onChange={(e) => setSelectedSalespersonId(e.target.value ? Number(e.target.value) : null)}
                                 className="bg-white border bg-transparent rounded-lg px-2 py-1 text-xs font-bold text-slate-600 outline-none w-32"
                             >
                                 <option value="">(بدون مندوب)</option>
                                 {users?.map(u => (
                                     <option key={u.id} value={u.id}>{u.name}</option>
                                 ))}
                             </select>
                         </div>
                     )}

                     {/* Dine-in Table Selection */}
                     {orderType === 'dine-in' && (
                         <div className="mt-3">
                             <button 
                                onClick={() => setIsTableSelectionModalOpen(true)}
                                className="w-full flex items-center justify-between bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors"
                             >
                                 <div className="flex items-center gap-2">
                                     <Users className="w-4 h-4" />
                                     <span className="text-sm font-bold">{selectedTable ? `طاولة رقم ${selectedTable}` : 'اختر الطاولة'}</span>
                                 </div>
                                 <span className="text-xs font-bold bg-emerald-200 px-2 py-0.5 rounded-lg">تغيير</span>
                             </button>
                         </div>
                     )}

                     {/* Delivery Details */}
                     {orderType === 'delivery' && (
                         <div className="mt-3 relative z-10">
                             <DeliveryAddressInput 
                                deliveryAddress={deliveryAddress}
                                setDeliveryAddress={setDeliveryAddress}
                                deliveryPhone={deliveryPhone}
                                setDeliveryPhone={setDeliveryPhone}
                                deliveryFee={deliveryFee}
                                setDeliveryFee={setDeliveryFee}
                             />
                         </div>
                     )}

                     {/* Maintenance/Receive Details */}
                     {['receive', 'maintenance'].includes(orderType) && (
                         <div className="mt-3 p-3 bg-orange-50 rounded-xl space-y-2 border border-orange-100">
                             <input 
                                 type="text" 
                                 placeholder="الرقم التسلسلي للجهاز (IMEI/SN)" 
                                 value={deviceSerial}
                                 onChange={e => setDeviceSerial(e.target.value)}
                                 className="w-full bg-white border-none rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200 "
                             />
                             <input 
                                 type="text" 
                                 placeholder="وصف العطل / المشكلة" 
                                 value={issueDescription}
                                 onChange={e => setIssueDescription(e.target.value)}
                                 className="w-full bg-white border-none rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200 "
                             />
                             <input 
                                 type="text" 
                                 placeholder="مرفقات الجهاز (شاحن، كرتونة...)" 
                                 value={deviceAttachments}
                                 onChange={e => setDeviceAttachments(e.target.value)}
                                 className="w-full bg-white border-none rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200 "
                             />
                         </div>
                     )}
                </div>

                {/* Cart Items List */}
                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 bg-slate-50/20 space-y-3 custom-scrollbar" dir="rtl">
                  {cart.length === 0 ? (
                    <motion.div 
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="flex flex-col items-center justify-center text-slate-400 gap-4 py-8"
                    >
                      <div className="w-24 h-24 bg-gradient-to-tr from-indigo-100 to-purple-100 rounded-full flex items-center justify-center shadow-md shadow-indigo-150/20 border border-indigo-200">
                          <ShoppingCart className="w-10 h-10 text-indigo-600 stroke-[1.8] animate-pulse" />
                      </div>
                      <div className="text-center">
                          <h3 className="font-extrabold text-slate-700 mb-1">السلة فارغة</h3>
                          <p className="text-xs text-slate-500 font-bold">قم بإضافة منتجات للبدء</p>
                      </div>
                    </motion.div>
                  ) : (
                    cart.map(item => (
                      <div key={item.cartItemId} className="group flex items-center gap-3 p-3 rounded-xl border border-slate-150 bg-white hover:border-slate-250 hover:shadow-2xs transition-all relative">
                        <div onClick={() => { if (isEnabled('showCustomPrice')) openLineItemModal(item); }} className={`${isEnabled('showCustomPrice') ? 'cursor-pointer' : ''} flex-1 min-w-0 pr-1`}>
                          <h4 className="font-extrabold text-slate-800 text-[13px] truncate tracking-tight">{item.name}</h4>
                          
                          <div className="flex flex-wrap items-center mt-1 gap-1.5">
                              {item.selectedUnit && (
                                  <span className="text-[9px] bg-indigo-50/70 text-indigo-700 px-2 py-0.5 rounded-md font-extrabold border border-indigo-100/40">
                                      {item.selectedUnit.name}
                                  </span>
                              )}
                              {item.serials && item.serials.length > 0 && (
                                  <span className="text-[9px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md font-mono font-black border border-slate-250">
                                      {item.serials[0]} {item.serials.length > 1 ? `(+${item.serials.length - 1})` : ''}
                                  </span>
                              )}
                              {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                      {item.selectedModifiers.map((mod, idx) => (
                                          <span key={idx} className="text-[9px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded-md border border-slate-200">
                                              {mod.optionName} {mod.price > 0 ? `(+${formatCurrency(mod.price)})` : ''}
                                          </span>
                                      ))}
                                  </div>
                              )}
                          </div>
                          
                          {item.customerPriceInfo && (
                              <div className="flex flex-col text-[9px] mt-1 text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-150 w-fit">
                                  <span className="font-bold">سعر سابق: {formatCurrency(item.customerPriceInfo.price)}</span>
                                  <span className="opacity-75">
                                      يوم {new Date(item.customerPriceInfo.date).toLocaleDateString('ar-EG', {month: 'short', day: 'numeric'})} | إجمالي الفاتورة: {formatCurrency(item.customerPriceInfo.orderTotal)}
                                  </span>
                              </div>
                          )}
        
                          <div className="flex items-center gap-1.5 mt-1.5">
                              <p className={`text-xs font-black tracking-tight ${getCartItemPriceClass(item)}`}>{formatCurrency(item.price)}</p>
                              {item.itemDiscount ? <span className="text-[10px] text-red-500 font-bold bg-rose-50 px-1 hover:opacity-90 transition-opacity border border-rose-100/60 rounded-md line-through">{item.itemDiscount}</span> : null}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                            {/* Premium Centered Micro-widget Quantity Selector */}
                            <div className="flex items-center bg-slate-50/85 border border-slate-200 hover:border-slate-300 rounded-lg overflow-hidden h-[30px] shadow-3xs transition-all" dir="ltr">
                                <button 
                                    onClick={() => updateQuantity(item.cartItemId!, -1)} 
                                    className="w-7 h-full text-slate-500 hover:text-red-650 hover:bg-slate-100 transition-colors flex items-center justify-center border-r border-slate-100 active:scale-95"
                                    title="تقليل الكمية"
                                >
                                    {item.quantity === 1 ? <Trash2 className="w-3 h-3 text-red-500/80" /> : <Minus className="w-3 h-3" />}
                                </button>
                                <span className="w-7 h-full flex items-center justify-center font-extrabold text-[11px] text-slate-850 font-sans tracking-tight">{item.quantity}</span>
                                <button 
                                    onClick={() => updateQuantity(item.cartItemId!, 1)} 
                                    className="w-7 h-full text-slate-550 hover:text-emerald-700 hover:bg-slate-100 transition-colors flex items-center justify-center border-l border-slate-100 active:scale-95"
                                    title="زيادة الكمية"
                                >
                                    <Plus className="w-3 h-3" />
                                </button>
                            </div>

                            {/* Minimalist Vector Trash Icon with elegant light red background hover */}
                            <button 
                                onClick={() => removeFromCart(item.cartItemId!)} 
                                className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-rose-50/75 rounded-lg border border-transparent hover:border-rose-100/75 transition-colors shrink-0 cursor-pointer active:scale-95"
                                title="حذف الصنف"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
            </div>

            {/* --- RETAIL BOTTOM SECTION: Clean, Merged, Visually Anchored Container with strict vertical flex spacing gaps and absolute safeguard bottom padding --- */}
            <div className="bg-[#F8F9FA] border-t border-slate-200/85 shadow-[0_-12px_45px_rgba(0,0,0,0.02)] px-4 pt-3 pb-1 shrink-0 z-20 flex flex-col font-['Tajawal'] select-none gap-3">
                     
                     {/* Modern Totals Container with rebalanced spacing and clear borders */}
                     <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-[0_4px_16px_rgba(0,0,0,0.015)] space-y-3 py-4">
                         <div className="flex justify-between text-xs font-bold text-slate-500 py-0.5">
                             <span>المجموع الفرعي</span>
                             <span className="font-mono">{formatCurrency(totals.subtotal)}</span>
                         </div>
                         <div 
                            className={`flex justify-between text-xs font-bold text-slate-500 transition-colors py-0.5 ${isEnabled('showQuickDiscount') ? 'cursor-pointer hover:text-brand-600' : ''}`} 
                            onClick={() => { if (isEnabled('showQuickDiscount')) setIsDiscountModalOpen(true); }}
                         >
                             <span className="flex items-center gap-1">الخصم {isEnabled('showQuickDiscount') && <span className="text-[10px] bg-red-100 text-red-800 border border-red-200 px-1.5 py-0.5 rounded-md font-extrabold select-none">تعديل</span>}</span>
                             <span className="text-red-550 font-extrabold font-mono">-{formatCurrency(totals.discountAmount)}</span>
                         </div>
                         {isTaxEnabled && (
                             <div className="flex justify-between text-xs font-bold text-slate-500">
                                 <span>الضريبة ({taxRate}%)</span>
                                 <span className="font-mono">{formatCurrency(totals.tax)}</span>
                             </div>
                         )}
                         {(totals as any).serviceChargeAmount > 0 && (
                             <div className="flex justify-between text-xs text-indigo-550 font-bold">
                                 <span>رسوم خدمة الصالة</span>
                                 <span className="font-mono">{formatCurrency((totals as any).serviceChargeAmount)}</span>
                             </div>
                         )}
                         
                         <div className="pt-3 border-t border-dashed border-slate-200/80 flex justify-between items-center mt-1.5">
                             <span className="text-[13px] font-bold text-[#1A1A1A]">المبلغ المطلوب (الإجمالي)</span>
                             <span className={`text-2xl md:text-3xl font-black font-[Tajawal] tracking-tight ${totals.total < 0 ? 'text-rose-600' : 'text-[#1A1A1A]'}`}>{formatCurrency(totals.total)}</span>
                         </div>
                     </div>

                     {/* Compact Low-Profile Inputs with fluid visual transitions */}
                     <div className="grid grid-cols-2 gap-2">
                         <input 
                             type="text" 
                             placeholder="ملاحظات التحضير (اختياري)..." 
                             value={orderNote}
                             onChange={e => setOrderNote(e.target.value)}
                             className="w-full bg-white border border-slate-200/60 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500/5 focus:border-brand-500 transition-all text-slate-700 placeholder:text-slate-400"
                         />
                         <input 
                             type="text" 
                             placeholder="كود الخصم الترويجي..." 
                             value={promoCode}
                             onChange={e => setPromoCode(e.target.value.toUpperCase())}
                             className="w-full bg-white border border-slate-200/60 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500/5 focus:border-brand-500 transition-all font-mono uppercase text-slate-700 placeholder:text-slate-400"
                         />
                     </div>

                     {/* Utility Center-aligned Grid of Icon Buttons */}
                     {(() => {
                         const buttonCount = [
                             isEnabled('showHoldBill'),
                             isEnabled('showSendToKitchen') && !!handleSendToKitchen,
                             true,
                             !!handleFastCash
                         ].filter(Boolean).length;
                         
                         const gridColsClass = 
                             buttonCount === 4 ? 'grid-cols-4' : 
                             buttonCount === 3 ? 'grid-cols-3' : 
                             buttonCount === 2 ? 'grid-cols-2' : 'grid-cols-1';

                         return (
                             <div className={`grid ${gridColsClass} gap-2 shrink-0 w-full`}>
                                {isEnabled('showHoldBill') && (
                                    <button 
                                        onClick={() => handleHoldOrder(false)}
                                        className="w-full h-10 md:h-[44px] px-0.5 py-1 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white border border-amber-500/80 hover:from-amber-600 hover:to-orange-600 font-extrabold transition-all flex flex-col items-center justify-center gap-0.5 group shadow-sm hover:shadow-md hover:shadow-amber-500/20 active:scale-98 cursor-pointer"
                                        title="تعليق الطلب (F8)"
                                    >
                                        <PauseCircle className="w-4 h-4 text-white/95 group-hover:scale-110 transition-transform shrink-0" />
                                        <span className="text-[10px] text-white/95 font-bold tracking-wide whitespace-nowrap leading-none select-none">F8</span>
                                    </button>
                                )}
                                {isEnabled('showSendToKitchen') && handleSendToKitchen && (
                                    <button 
                                        onClick={handleSendToKitchen}
                                        className="w-full h-10 md:h-[44px] px-0.5 py-1 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white border border-emerald-500/80 hover:from-emerald-600 hover:to-teal-600 font-extrabold transition-all flex flex-col items-center justify-center gap-0.5 group shadow-sm hover:shadow-md hover:shadow-emerald-500/20 active:scale-98 cursor-pointer"
                                        title="إرسال للمطبخ"
                                    >
                                        <ChefHat className="w-4 h-4 text-white/95 group-hover:scale-110 transition-transform shrink-0" />
                                        <span className="text-[10px] text-white/95 font-bold tracking-wide whitespace-nowrap leading-none select-none">مطبخ</span>
                                    </button>
                                )}
                                <button 
                                    onClick={handleSaveQuotation}
                                    className="w-full h-10 md:h-[44px] px-0.5 py-1 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white border border-purple-500/80 hover:from-purple-600 hover:to-indigo-600 font-extrabold transition-all flex flex-col items-center justify-center gap-0.5 group shadow-sm hover:shadow-md hover:shadow-indigo-500/20 active:scale-98 cursor-pointer"
                                    title="حفظ كعرض سعر"
                                >
                                    <FileSignature className="w-4 h-4 text-white/95 group-hover:scale-110 transition-transform shrink-0" />
                                    <span className="text-[10px] text-white/95 font-bold tracking-wide whitespace-nowrap leading-none select-none">عرض</span>
                                </button>
                                {handleFastCash && (
                                    <button
                                        onClick={handleFastCash}
                                        disabled={cart.length === 0}
                                        className="w-full h-10 md:h-[44px] px-0.5 py-1 rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 text-white border border-sky-500/80 hover:from-sky-600 hover:to-blue-600 font-extrabold transition-all flex flex-col items-center justify-center gap-0.5 group disabled:opacity-30 disabled:cursor-not-allowed shadow-sm hover:shadow-md hover:shadow-sky-500/20 active:scale-98 cursor-pointer"
                                        title="دفع سريع كاش"
                                    >
                                        <Banknote className="w-4 h-4 text-white/95 group-hover:scale-110 transition-transform shrink-0" />
                                        <span className="text-[10px] text-white/95 font-bold tracking-wide whitespace-nowrap leading-none select-none">سريع</span>
                                    </button>
                                )}
                            </div>
                        );
                    })()}

                    {/* Floating Checkout Button with clean bottom padding separation */}
                    <button
                        onClick={initiatePayment}
                        disabled={cart.length === 0}
                        className={`w-full h-14 rounded-2xl font-black text-white shadow-lg active:scale-98 transition-all flex justify-between items-center px-5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none ${
                            isRefundMode 
                            ? 'bg-gradient-to-r from-rose-600 via-pink-600 to-red-650 hover:from-rose-700 hover:to-pink-700 shadow-rose-200' 
                            : 'bg-gradient-to-r from-emerald-600 via-teal-550 to-emerald-500 hover:from-emerald-700 hover:to-teal-600 shadow-emerald-550/20'
                        }`}
                    >
                         <span className="flex items-center gap-2">
                             <ShoppingCart className="w-5 h-5 shrink-0" />
                             <span className="text-sm font-black font-[Tajawal] tracking-wide">
                                 {isRefundMode ? 'تأكيد عملية المرتجع' : 'الانتقال للدفع والسداد'}
                             </span>
                         </span>
                         <span className="text-lg font-black font-[Tajawal] tracking-tight font-mono bg-white/15 px-3 py-1 rounded-xl">
                             {formatCurrency(totals.total)}
                         </span>
                     </button>
                </div>

                {/* Spectacular and Clean Customer History Modal */}
                {isHistoryModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-3xs" dir="rtl">
                        <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-150 max-h-[85vh] border border-slate-100 font-['Tajawal']">
                            {/* Modal Header */}
                            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-brand-100 text-brand-600 rounded-lg">
                                        <History className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-[Tajawal] font-black text-slate-800">
                                            سجل المعاملات وكشف حساب العميل
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            المشتريات السابقة وعمليات التسديد والمدفوعات
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsHistoryModalOpen(false)}
                                    className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-5 overflow-y-auto flex-1 space-y-6 scrollbar-thin">
                                {/* Section 1: Previous Orders */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Clock className="w-4 h-4 text-slate-450" />
                                        <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">
                                            الفواتير والطلبات السابقة
                                        </h4>
                                        <span className="bg-slate-100 text-slate-550 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            {customerOrders.length} طلبات
                                        </span>
                                    </div>
                                    
                                    {customerOrders.length === 0 ? (
                                        <div className="text-center py-6 text-sm text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                            لا يوجد طلبات سابقة لهذا العميل.
                                        </div>
                                    ) : (
                                        <div className="border border-slate-200/60 rounded-xl overflow-hidden shadow-3xs">
                                            <table className="w-full text-right text-xs">
                                                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-150">
                                                    <tr>
                                                        <th className="p-3">رقم الفاتورة</th>
                                                        <th className="p-3">التاريخ</th>
                                                        <th className="p-3">نوع الطلب</th>
                                                        <th className="p-3">طريقة الدفع</th>
                                                        <th className="p-3">الإجمالي</th>
                                                        <th className="p-3 text-left">الحالة</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 text-slate-650">
                                                    {customerOrders.slice(0, 10).map((o) => (
                                                        <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="p-3 font-extrabold text-slate-800">{o.referenceNumber || o.id}</td>
                                                            <td className="p-3 text-slate-550">{new Date(o.date).toLocaleDateString('ar-EG', { dateStyle: 'short' })}</td>
                                                            <td className="p-3 bg-slate-50/30">
                                                                <span className="font-bold">
                                                                    {o.orderType === 'dine-in' ? 'صالة' : o.orderType === 'delivery' ? 'توصيل' : 'سفري'}
                                                                </span>
                                                            </td>
                                                            <td className="p-3 font-semibold text-slate-550">{o.paymentMethod || 'نقداً'}</td>
                                                            <td className="p-3 font-extrabold text-slate-800">{formatCurrency(o.totalAmount)}</td>
                                                            <td className="p-3 text-left">
                                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${
                                                                    o.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                                }`}>
                                                                    {o.status === 'completed' ? 'مكتمل' : 'معلق'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* Section 2: Previous Payments */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Banknote className="w-4 h-4 text-slate-450" />
                                        <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">
                                            سندات المقبوضات وعمليات السداد
                                        </h4>
                                        <span className="bg-slate-100 text-slate-550 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            {customerPayments.length} سندات
                                        </span>
                                    </div>
                                    
                                    {customerPayments.length === 0 ? (
                                        <div className="text-center py-6 text-sm text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                            لا يوجد سندات قبض أو سداد مسجلة.
                                        </div>
                                    ) : (
                                        <div className="border border-slate-200/60 rounded-xl overflow-hidden shadow-3xs">
                                            <table className="w-full text-right text-xs">
                                                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-150">
                                                    <tr>
                                                        <th className="p-3">رقم السند</th>
                                                        <th className="p-3">التاريخ</th>
                                                        <th className="p-3">طريقة الدفع</th>
                                                        <th className="p-3">المبلغ المسدد</th>
                                                        <th className="p-3 text-left">ملاحظات</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 text-slate-650">
                                                    {customerPayments.slice(0, 10).map((p) => (
                                                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="p-3 font-extrabold text-slate-800">#{p.id}</td>
                                                            <td className="p-3 text-slate-550">{new Date(p.date).toLocaleDateString('ar-EG', { dateStyle: 'short' })}</td>
                                                            <td className="p-3 font-bold text-slate-650">{p.type === 'wallet_deposit' ? 'محفظة' : 'نقداً'}</td>
                                                            <td className="p-3 font-extrabold text-emerald-600">{formatCurrency(p.amount)}</td>
                                                            <td className="p-3 text-left text-slate-500 truncate max-w-[150px]">{p.note || '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>

                                                        {/* Modal Footer */}
                            <div className="p-4 bg-slate-50 border-t border-slate-100 text-left shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsHistoryModalOpen(false)}
                                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-[Tajawal] font-bold text-xs transition duration-150 cursor-pointer shadow-sm"
                                >
                                    إغلاق النافذة
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </>
        )}
        </div>
    );
});
