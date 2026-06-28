import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { CartItem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShoppingBag, 
    Sparkles, 
    Clock, 
    Calendar, 
    Percent, 
    Award, 
    Gift, 
    User,
    MapPin,
    Phone,
    Coins,
    Armchair,
    Utensils,
    Coffee,
    Flame,
    Clipboard,
    Receipt,
    ForkKnife,
    Image as ImageIcon
} from 'lucide-react';

interface CDSState {
    cart: CartItem[];
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    customerName?: string | null;
    orderType?: string | null;
    selectedTable?: string | null;
    serviceCharge?: number;
    deliveryFee?: number;
    businessType?: string;
}

const ActiveShoppingCartShowcase: React.FC<{ cart: CartItem[]; currencyCode: string; isRestaurant: boolean }> = ({ cart, currencyCode, isRestaurant }) => {
    // Collect all cart items that have images
    const itemsWithImages = cart.filter(item => item.image || (item.images && item.images.length > 0));
    const [itemIdx, setItemIdx] = useState(0);
    const [imageIdx, setImageIdx] = useState(0);

    const hasAnyImages = itemsWithImages.length > 0;

    useEffect(() => {
        if (itemsWithImages.length <= 1) return;
        const timer = setInterval(() => {
            setItemIdx((prev) => (prev + 1) % itemsWithImages.length);
            setImageIdx(0);
        }, 8000);
        return () => clearInterval(timer);
    }, [itemsWithImages.length]);

    const activeItem = itemsWithImages[itemIdx];
    const images = activeItem ? (activeItem.images && activeItem.images.length > 0 ? activeItem.images : [activeItem.image!]) : [];

    useEffect(() => {
        if (images.length <= 1) return;
        const imgTimer = setInterval(() => {
            setImageIdx((prev) => (prev + 1) % images.length);
        }, 3000);
        return () => clearInterval(imgTimer);
    }, [images.length, itemIdx]);

    if (!hasAnyImages) {
        return (
            <div className="w-full max-w-xl p-8 bg-white/85 backdrop-blur-md rounded-[32px] border border-white shadow-xl text-center flex flex-col items-center justify-center space-y-6">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg pointer-events-none ${
                    isRestaurant ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                }`}>
                    <ShoppingBag className="w-10 h-10 animate-pulse" />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-slate-800">قائمة مشترياتك المفضلة</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1.5 max-w-sm mx-auto leading-relaxed">
                        يتم الآن تجهيز وتسجيل أصنافك بعناية. نسعد دائماً بخدمة شركاء نجاحنا الكرام وتوفير أفضل تجربة إطلاقاً!
                    </p>
                </div>
                <div className="w-full max-w-xs bg-slate-50/70 rounded-2xl p-4 border border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>عدد مواد السلة الحالية:</span>
                    <span className="font-mono text-base font-black text-slate-900">{cart.length} أصناف</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-xl bg-white/95 backdrop-blur-md rounded-[32px] border border-white/50 shadow-2xl overflow-hidden flex flex-col p-6 animate-in zoom-in-95 duration-500 relative">
            <div className={`absolute top-6 left-6 px-3.5 py-1.5 rounded-full text-[10px] font-black shadow-sm border flex items-center gap-1.5 z-10 ${
                isRestaurant ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
            }`}>
                <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                <span>معاينة طلبك الحالي</span>
            </div>

            <div className="relative aspect-video w-full rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center">
                <AnimatePresence mode="wait">
                    <motion.img
                        key={`${itemIdx}-${imageIdx}`}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.4 }}
                        src={images[imageIdx]}
                        className="w-full h-full object-contain"
                        alt={activeItem.name}
                    />
                </AnimatePresence>

                {images.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-slate-950/85 backdrop-blur-sm text-white font-mono text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-md font-bold">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>{imageIdx + 1} / {images.length}</span>
                    </div>
                )}
            </div>

            <div className="mt-5 text-right flex flex-col items-start w-full">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mb-2 ${
                    isRestaurant ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                }`}>
                    {activeItem.category || 'مواد الطلب'}
                </span>
                
                <h3 className="text-2xl font-black text-slate-800 leading-tight mb-2 w-full truncate">
                    {activeItem.name}
                </h3>
                
                <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-slate-400 text-xs font-medium">سعر الصنف الحالي:</span>
                    <span className="text-xl font-bold font-mono text-slate-900">
                        {activeItem.price.toLocaleString()} {currencyCode}
                    </span>
                </div>
            </div>

            {images.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-5">
                    {images.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1 rounded-full transition-all duration-300 ${
                                idx === imageIdx 
                                    ? `w-6 ${isRestaurant ? 'bg-amber-500' : 'bg-indigo-600'}` 
                                    : 'w-1 bg-slate-200'
                            }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const CustomerDisplay: React.FC = () => {
    const [state, setState] = useState<CDSState>({
        cart: [],
        subtotal: 0,
        discount: 0,
        tax: 0,
        total: 0,
        customerName: null,
        orderType: null,
        selectedTable: null,
        serviceCharge: 0,
        deliveryFee: 0,
        businessType: 'retail'
    });

    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const [activeSlide, setActiveSlide] = useState<number>(0);

    const settings = useLiveQuery(() => db.settings.toCollection().first());
    const currencyCode = settings?.currencyCode || 'IQD';
    const storeName = settings?.storeName || 'نيما تك';
    const storePhone = (settings as any)?.storePhone || '';
    const storeAddress = (settings as any)?.storeAddress || '';

    // Determine context dynamically
    const isRestaurant = state.businessType === 'restaurant' || !!state.selectedTable || ['dine-in', 'takeaway'].includes(state.orderType || '');

    // Live clock update
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Regular retail/service slides
    const regularPromoSlides = [
        {
            icon: <Sparkles className="w-12 h-12 text-indigo-500" />,
            title: `مرحباً بكم في ${storeName}`,
            description: "نسعد دائماً بخدمتكم وتوفير أجود المنتجات الموثوقة بأفضل الأسعار على الإطلاق وبجودة فائقة.",
            bg: "bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/70",
            badge: "المتجر الرسمي"
        },
        {
            icon: <Award className="w-12 h-12 text-emerald-500" />,
            title: "عروض الولاء والنقاط الذكية",
            description: "اطلب من الكاشير تسجيل رقم هاتفك للاستفادة من برنامج تجميع النقاط والخصومات الحصرية الفورية في الزيارة المقبلة!",
            bg: "bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/70",
            badge: "برنامج الولاء"
        },
        {
            icon: <Gift className="w-12 h-12 text-amber-500" />,
            title: "خدمة توصيل سريعة ومميزة",
            description: "نقوم بتوصيل طلباتكم إلى باب المنزل بكل سهولة وسرعة وبأعلى درجات الأمان والسرعة.",
            bg: "bg-gradient-to-br from-amber-50/70 via-white to-orange-50/70",
            badge: "خدمات مميزة"
        }
    ];

    // Culinary-focused cozy slides for restaurant mode
    const restaurantPromoSlides = [
        {
            icon: <Utensils className="w-12 h-12 text-amber-500 animate-bounce" />,
            title: `عش متعة التذوق مع ${storeName}`,
            description: "نسعد دائماً بتقديم أشهى المأكولات والمشروبات المحضرة بحب وعناية فائقة من أجود المكونات الطازجة يومياً.",
            bg: "bg-gradient-to-br from-amber-50/70 via-white to-orange-50/70",
            badge: "وجبات طازجة يومياً"
        },
        {
            icon: <Coffee className="w-12 h-12 text-orange-500" />,
            title: "جلسات هادئة وضيافة مميزة جداً",
            description: "اختر طاولة مفضلة لديك واستمتع بجلسات عائلية مريحة ودافئة مع خدمة متميزة تلبي جميع تطلعاتكم العائلية.",
            bg: "bg-gradient-to-br from-orange-50/70 via-white to-rose-50/70",
            badge: "كرم الضيافة"
        },
        {
            icon: <Flame className="w-12 h-12 text-rose-500" />,
            title: "قائمة طعام واسعة لتناسب كل الأذواق",
            description: "من المشويات اللذيذة والوجبات السريعة إلى الحلويات والمقبلات الشهية، نحضر طعامك المفضل بالخلطة والسرية الخاصة بنا.",
            bg: "bg-gradient-to-br from-rose-50/70 via-white to-amber-50/70",
            badge: "قائمة طعام فاخرة"
        }
    ];

    const currentPromoSlides = isRestaurant ? restaurantPromoSlides : regularPromoSlides;

    // Auto rotate slides
    useEffect(() => {
        const slideTimer = setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % currentPromoSlides.length);
        }, 8000);
        return () => clearInterval(slideTimer);
    }, [currentPromoSlides.length]);

    useEffect(() => {
        const channel = new BroadcastChannel('cds-channel');
        
        channel.onmessage = (event) => {
            if (event.data.type === 'UPDATE_CDS') {
                setState(event.data.payload);
            }
        };

        // Request initial state when opened
        channel.postMessage({ type: 'REQUEST_CDS_STATE' });

        return () => {
            channel.close();
        };
    }, []);

    // Format Date beautifully
    const formatDay = (date: Date) => {
        return date.toLocaleDateString('ar-EG', { weekday: 'long' });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    // Helper to map order status type to beautiful Arabic text and color
    const getOrderTypeDetails = (type?: string | null) => {
        if (!type) return null;
        switch (type) {
            case 'dine-in':
                return { label: 'طلب محلي (صالة)', color: 'bg-orange-500 text-white', icon: <Armchair className="w-4 h-4" /> };
            case 'takeaway':
                return { label: 'طلب خارجي (سفري)', color: 'bg-emerald-600 text-white', icon: <ShoppingBag className="w-4 h-4" /> };
            case 'delivery':
                return { label: 'طلب توصيل (دليفري)', color: 'bg-indigo-600 text-white', icon: <MapPin className="w-4 h-4" /> };
            default:
                return { label: 'طلب مباشر', color: 'bg-slate-600 text-white', icon: <Receipt className="w-4 h-4" /> };
        }
    };

    const orderTypeCard = getOrderTypeDetails(state.orderType);

    return (
        <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden" dir="rtl">
            {/* Right Side / Sidebar: Bill details & Cart (taking 30% of page) */}
            <div className="w-[30%] min-w-[380px] shrink-0 bg-white shadow-[0_0_40px_rgba(0,0,0,0.06)] flex flex-col h-full border-l border-slate-100 z-10">
                {/* Store Branding Header (Adaptive Theme Colored) */}
                <div className={`p-6 transition-colors duration-500 text-white relative overflow-hidden ${
                    isRestaurant ? 'bg-gradient-to-l from-amber-950 via-slate-900 to-amber-950' : 'bg-slate-900'
                }`}>
                    {/* Background decorations */}
                    {isRestaurant ? (
                        <>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
                            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-orange-500/10 rounded-full blur-xl"></div>
                        </>
                    ) : (
                        <>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
                            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl"></div>
                        </>
                    )}

                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                                {settings?.logo ? (
                                    <img src={settings.logo} alt="Logo" className="w-8 h-8 object-contain animate-pulse" />
                                ) : isRestaurant ? (
                                    <ForkKnife className="w-6 h-6 text-amber-400" />
                                ) : (
                                    <ShoppingBag className="w-6 h-6 text-indigo-400" />
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight leading-tight">{storeName}</h1>
                                <p className="text-xs text-slate-400 font-medium">
                                    {isRestaurant ? 'تفاصيل فاتورة الطعام العائلي' : 'فاتورة مشتريات العميل الكريم'}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-end text-right">
                            <span className="text-xs text-slate-400 font-mono">{formatDay(currentTime)}</span>
                            <span className={`text-sm font-bold font-mono ${isRestaurant ? 'text-amber-300' : 'text-indigo-300'}`}>
                                {formatTime(currentTime)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Info Bar Context Section: Tables, Loyalties, Order types */}
                <div className="flex flex-col gap-2 px-6 py-4 bg-slate-50 border-b border-slate-100">
                    <div className="flex flex-wrap gap-2">
                        {/* Order Type Badge */}
                        {orderTypeCard && (
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs ${orderTypeCard.color} shadow-sm animate-in fade-in duration-300`}>
                                {orderTypeCard.icon}
                                <span>{orderTypeCard.label}</span>
                            </div>
                        )}

                        {/* Dining Table Info Badge */}
                        {isRestaurant && state.selectedTable && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-amber-500 text-white shadow-sm animate-in fade-in duration-300">
                                <Armchair className="w-4 h-4" />
                                <span>طاولة رقم: {state.selectedTable}</span>
                            </div>
                        )}
                    </div>

                    {/* Active Customer Welcome Banner */}
                    {state.customerName && (
                        <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-150 border border-emerald-100/90 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-3 duration-500">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                                    <User className="w-4.5 h-4.5" />
                                </div>
                                <div>
                                    <span className="text-[10px] text-emerald-600 block font-medium">العميل الحالي والمميز</span>
                                    <h4 className="font-bold text-xs text-emerald-950">{state.customerName}</h4>
                                </div>
                            </div>
                            <div className="bg-emerald-500/10 text-emerald-700 text-[10px] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                                <Coins className="w-3 h-3" />
                                ولاء نشط
                            </div>
                        </div>
                    )}
                </div>

                {/* Cart Header Panel */}
                <div className="px-6 py-3.5 flex items-center justify-between border-b border-slate-100 bg-white">
                    <span className="text-sm font-bold text-slate-500">مكونات الطلب الحالي</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        isRestaurant ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                        {state.cart.length} أصناف
                    </span>
                </div>

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-slate-50/50">
                    {state.cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 border shadow-inner ${
                                isRestaurant ? 'bg-amber-50 border-amber-100' : 'bg-slate-100 border-slate-200/50'
                            }`}>
                                {isRestaurant ? (
                                    <Utensils className="w-10 h-10 text-amber-600/80 animate-pulse" />
                                ) : (
                                    <ShoppingBag className="w-10 h-10 text-slate-400/80" />
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-slate-700">
                                {isRestaurant ? 'جاهزون لاستقبال طلباتكم اللذيذة' : 'مرحباً بجناح الدفع الخاص بنا'}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1 max-w-[265px] leading-relaxed">
                                {isRestaurant 
                                    ? 'اختر وجباتك ومشروباتك الشهية، وستظهر أصنافك هنا فوراً مع تحديد ملاحظات الطهي الخاصة بك.' 
                                    : 'أصناف مشترياتك ستظهر بشكل فوري وواضح هنا بمجرد إضافتها من قبل الكاشير.'
                                }
                            </p>
                        </div>
                    ) : (
                        state.cart.map((item, index) => (
                            <div 
                                key={index} 
                                className="flex flex-col p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 animate-in slide-in-from-right-4 fade-in duration-300"
                            >
                                <div className="flex justify-between items-center w-full">
                                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                        {/* Qty pill */}
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg border shadow-sm relative shrink-0 ${
                                            isRestaurant ? 'bg-amber-50 text-amber-800 border-amber-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100/80'
                                        }`}>
                                            <span className={`text-xs font-normal absolute -top-1.5 -right-1.5 text-white w-5 h-5 rounded-full flex items-center justify-center border-2 border-white font-bold ${
                                                isRestaurant ? 'bg-amber-600' : 'bg-indigo-600'
                                            }`}>
                                                {item.quantity}
                                            </span>
                                            ×
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-bold text-slate-800 text-base truncate leading-snug">{item.name}</h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`text-xs font-mono font-medium ${item.itemDiscount ? 'text-slate-400 line-through' : 'text-slate-500'}`}>
                                                    {item.price.toLocaleString()} {currencyCode}
                                                </span>
                                                {item.itemDiscount ? (
                                                    <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                                        <Percent className="w-3 h-3" />
                                                        {(item.price - (item.itemDiscount / item.quantity)).toLocaleString()} {currencyCode}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="font-black text-lg text-slate-900 font-mono text-left mr-3 whitespace-nowrap">
                                        {((item.price * item.quantity) - (item.itemDiscount || 0)).toLocaleString()} <span className="text-xs font-normal text-slate-500 font-sans">{currencyCode}</span>
                                    </div>
                                </div>

                                {/* Custom Notes/Toppings for Restaurant Mode */}
                                {item.itemNote && (
                                    <div className="mt-2.5 mx-1 p-2 bg-amber-50/50 border border-amber-100/40 rounded-xl flex items-start gap-1.5 text-xs text-amber-800 font-medium">
                                        <Clipboard className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                        <span>ملاحظات التحضير: {item.itemNote}</span>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Totals Section */}
                <div 
                    style={{ paddingBottom: '24px' }}
                    className="px-6 py-5 pb-[24px] bg-white border-t border-slate-100 shadow-[0_-15px_30px_rgba(0,0,0,0.02)] shrink-0"
                >
                    <div className="space-y-2 mb-[12px] px-1">
                        <div className="flex justify-between text-slate-500 text-sm font-medium">
                            <span>المجموع الفرعي</span>
                            <span className="font-bold font-mono text-slate-800">{state.subtotal.toLocaleString()} {currencyCode}</span>
                        </div>

                        {/* Restaurant Service Charge */}
                        {state.serviceCharge !== undefined && state.serviceCharge > 0 && (
                            <div className="flex justify-between text-slate-500 text-sm font-medium">
                                <span>رسوم الخدمة والصالة</span>
                                <span className="font-bold font-mono text-slate-800">+ {state.serviceCharge.toLocaleString()} {currencyCode}</span>
                            </div>
                        )}

                        {/* Delivery fee optionally */}
                        {state.deliveryFee !== undefined && state.deliveryFee > 0 && (
                            <div className="flex justify-between text-slate-500 text-sm font-medium">
                                <span>أجور التوصيل</span>
                                <span className="font-bold font-mono text-slate-800">+ {state.deliveryFee.toLocaleString()} {currencyCode}</span>
                            </div>
                        )}

                        {state.discount > 0 && (
                            <div className="flex justify-between text-emerald-700 text-sm font-bold bg-emerald-50/75 p-2 rounded-xl border border-emerald-100/50">
                                <span className="flex items-center gap-1">
                                    <Percent className="w-4 h-4 text-emerald-600" />
                                    مجمَل الخصومات والعروض
                                </span>
                                <span className="font-mono text-emerald-700">- {state.discount.toLocaleString()} {currencyCode}</span>
                            </div>
                        )}
                        {state.tax > 0 && (
                            <div className="flex justify-between text-slate-500 text-sm font-medium">
                                <span>الضريبة المضافة</span>
                                <span className="font-bold font-mono text-slate-800">+ {state.tax.toLocaleString()} {currencyCode}</span>
                            </div>
                        )}
                    </div>
                    
                    <div className={`flex justify-between items-center p-4 text-white rounded-2xl shadow-lg border relative overflow-hidden transition-all duration-500 ${
                        isRestaurant 
                            ? 'bg-gradient-to-r from-amber-600 to-orange-500 border-orange-600/40 shadow-orange-500/10' 
                            : 'bg-indigo-600 border-indigo-700/50 shadow-indigo-600/10'
                    }`}>
                        {/* Shimmer effect / Glow background */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-xl translate-x-8 -translate-y-8 pointer-events-none"></div>

                        <div className="relative z-10 w-full flex justify-between items-center">
                            <div>
                                <span className={`text-[10px] block font-bold mb-0.5 ${isRestaurant ? 'text-amber-100' : 'text-indigo-200'}`}>
                                    المبلغ الإجمالي للدفع
                                </span>
                                <span className="text-xl font-black">المطلوب سداده</span>
                            </div>
                            <div className="text-left font-mono">
                                <span className="text-3xl font-black tracking-tight">{state.total.toLocaleString()}</span>
                                <span className="text-xs font-bold mr-1 opacity-90">{currencyCode}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Left Side: Welcoming, Interactive Carousel & Store Promo Grid (visually left, 60% width) */}
            <div className="flex-1 bg-slate-100 relative overflow-hidden flex flex-col justify-between p-8">
                {/* Decorative background elements that adjust colors according to restaurant context */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    {isRestaurant ? (
                        <>
                            <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-amber-200/40 rounded-full mix-blend-multiply filter blur-[120px]"></div>
                            <div className="absolute top-60 -left-40 w-[500px] h-[500px] bg-orange-200/30 rounded-full mix-blend-multiply filter blur-[100px]"></div>
                            <div className="absolute -bottom-40 left-20 w-[600px] h-[600px] bg-red-200/20 rounded-full mix-blend-multiply filter blur-[120px]"></div>
                        </>
                    ) : (
                        <>
                            <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-indigo-200/40 rounded-full mix-blend-multiply filter blur-[120px]"></div>
                            <div className="absolute top-60 -left-40 w-[500px] h-[500px] bg-emerald-200/30 rounded-full mix-blend-multiply filter blur-[100px]"></div>
                            <div className="absolute -bottom-40 left-20 w-[600px] h-[600px] bg-pink-200/30 rounded-full mix-blend-multiply filter blur-[120px]"></div>
                        </>
                    )}
                </div>

                {/* Top Greeting Navigation Frame */}
                <div className="relative z-10 flex items-center justify-between">
                    {/* Time & Big Live Clock Widget */}
                    <div className="flex items-center gap-3.5 bg-white/65 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/85 shadow-sm transition-colors">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${
                            isRestaurant ? 'bg-amber-600 animate-pulse' : 'bg-indigo-600 animate-pulse'
                        }`}>
                            <Clock className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col justify-center">
                            <span className="text-[10px] text-slate-400 block font-bold leading-tight mb-0.5">التوقيت المحلي لخدمتكم</span>
                            <div className="flex items-center gap-2 leading-none">
                                <span className="font-black text-slate-800 font-mono tracking-tight text-base">
                                    {currentTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="text-slate-300 text-xs">|</span>
                                <span className="text-xs font-bold text-slate-600">{formatDate(currentTime)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Store Contact Meta details */}
                    {(storePhone || storeAddress) && (
                        <div className="flex items-center gap-5 bg-white/55 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/65 text-xs text-slate-600 font-bold transition-all">
                            {storePhone && (
                                <span className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                                    {storePhone}
                                </span>
                            )}
                            {storeAddress && (
                                <span className="flex items-center gap-1.5 border-r border-slate-300/60 pr-4">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                    {storeAddress}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                
                {/* Main Dynamic Promo Slideshow Card */}
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center py-8 max-w-4xl mx-auto w-full">
                    {state.cart && state.cart.length > 0 ? (
                        <ActiveShoppingCartShowcase cart={state.cart} currencyCode={currencyCode} isRestaurant={isRestaurant} />
                    ) : (
                        <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
                            <div className="relative w-full h-[400px] flex items-center justify-center">
                                {currentPromoSlides.map((slide, idx) => {
                                    const isActive = idx === activeSlide;
                                    return (
                                        <div 
                                            key={idx}
                                            className={`w-full transform transition-all duration-700 absolute top-0 left-0 right-0 bottom-0 ${
                                                isActive 
                                                    ? 'opacity-100 scale-100 pointer-events-auto z-10' 
                                                    : 'opacity-0 scale-95 pointer-events-none z-0'
                                            }`}
                                        >
                                            <div className={`h-full p-10 ${slide.bg} rounded-[32px] border border-white shadow-2xl shadow-indigo-100/25 relative overflow-hidden backdrop-blur-md flex flex-col justify-center`}>
                                                {/* Starry highlight */}
                                                <div className={`absolute top-4 left-4 bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold shadow-sm border border-slate-100/50 flex items-center gap-1 ${
                                                    isRestaurant ? 'text-amber-700' : 'text-indigo-700'
                                                }`}>
                                                    <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                                                    {slide.badge}
                                                </div>
                                                
                                                {/* Outer decoration circle */}
                                                <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>

                                                <div className="flex flex-col items-center text-center space-y-4">
                                                    <div className="w-18 h-18 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-50 shrink-0">
                                                        {slide.icon}
                                                    </div>
                                                    
                                                    <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-800 tracking-tight leading-tight">
                                                        {slide.title}
                                                    </h2>
                                                    
                                                    <p className="text-sm lg:text-base text-slate-500 font-medium leading-relaxed max-w-lg px-2">
                                                        {slide.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Dots indicators (connected inside the card's vertical flow) */}
                            <div className="flex items-center gap-2.5 bg-white/60 backdrop-blur-md p-1.5 rounded-full border border-white shadow-xs z-20">
                                {currentPromoSlides.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveSlide(idx)}
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                            idx === activeSlide 
                                                ? `w-6 ${isRestaurant ? 'bg-amber-600' : 'bg-indigo-600'}` 
                                                : 'w-2 bg-slate-300 hover:bg-slate-500'
                                        }`}
                                        title={`شريحة رقم ${idx + 1}`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Thank You Note Frame */}
                <div className="relative z-10 flex flex-col items-center shrink-0">
                    <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">
                        {settings?.cdsSettings?.welcomeTitle || (isRestaurant ? 'مذاق طيب وصحبة دافئة تجمعنا' : 'خدمة عملاء ممتازة وذكية')} • {storeName}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CustomerDisplay;
