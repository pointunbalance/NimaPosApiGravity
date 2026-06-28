import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSearchParams } from 'react-router-dom';
import { db } from '../../db';
import { Product, Category, Order } from '../../types';
import { ShoppingBag, ChevronRight, Plus, Minus, Search, Trash2, Utensils, Coffee, Leaf, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const renderCustomerProductImage = (product: Product) => {
    const isImageValid = product.image && (
        product.image.startsWith('http://') || 
        product.image.startsWith('https://') || 
        product.image.startsWith('data:image/') || 
        product.image.startsWith('/')
    );

    if (isImageValid) {
        return (
            <img 
                src={product.image} 
                className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" 
                alt={product.name} 
                referrerPolicy="no-referrer"
            />
        );
    }

    const name = (product.name || '').toLowerCase();
    const cat = (product.category || '').toLowerCase();

    if (name.includes('برجر') || name.includes('burger')) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-amber-50 text-amber-600 transition-transform group-hover:scale-110 duration-500">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 12h20M2 15h20M2 18a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4M3 12a9 9 0 0 1 18 0" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-[10px] font-bold mt-1 text-amber-500/70">برجر طازج</span>
            </div>
        );
    }

    if (name.includes('بيتزا') || name.includes('pizza')) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-orange-50 text-orange-600 transition-transform group-hover:scale-110 duration-500">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M15 11h.01M11 15h.01M16 16h.01M12 11h.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5Z" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 13.5h18" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-[10px] font-bold mt-1 text-orange-500/70">بيتزا إيطالية</span>
            </div>
        );
    }

    if (name.includes('دجاج') || name.includes('لحم') || name.includes('شاورما') || name.includes('وجب') || name.includes('كباب') || name.includes('تكة') || name.includes('بروستد')) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-rose-50 text-rose-600 transition-transform group-hover:scale-110 duration-500">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2v10M12 12a4 4 0 0 0-4-4H4v12h16V8h-4a4 4 0 0 0-4 4Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[10px] font-bold mt-1 text-rose-500/70">وجبة رئيسية</span>
            </div>
        );
    }

    if (name.includes('مقبل') || name.includes('سلط') || name.includes('بطاطس') || name.includes('ثوم') || name.includes('حمص')) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110 duration-500">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    <path d="M2.5 9h19" />
                    <path d="M2.5 15h19" />
                </svg>
                <span className="text-[10px] font-bold mt-1 text-emerald-500/70">مقبلات طازجة</span>
            </div>
        );
    }

    if (name.includes('عصير') || name.includes('كولا') || name.includes('مشروب') || name.includes('بيبسي') || name.includes('ماء') || name.includes('قهوة') || name.includes('شاي') || cat.includes('مشروب') || cat.includes('عصائر')) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-sky-50 text-sky-600 transition-transform group-hover:scale-110 duration-500">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[10px] font-bold mt-1 text-sky-500/70">مشروب بارد</span>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 transition-transform group-hover:scale-110 duration-500">
            <svg className="w-10 h-10 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[10px] font-bold mt-1 text-slate-400/70">طبق خاص</span>
        </div>
    );
};

export default function CustomerMenu() {
    const [searchParams] = useSearchParams();
    const tableNumber = searchParams.get('table') || 'غير محدد';
    
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState<{product: Product, quantity: number, notes: string}[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isOrderSuccess, setIsOrderSuccess] = useState(false);

    const allProducts = useLiveQuery(() => db.products.toArray(), []) || [];
    const allCategories = useLiveQuery(() => db.categories.toArray(), []) || [];
    const settings = useLiveQuery(() => db.settings.toCollection().first());
    
    const restaurantName = settings?.storeName || 'قائمة الطعام';
    const currency = settings?.currencyCode || 'IQD';

    // Unique Categories
    const categories = useMemo(() => {
        const unique = new Map<string, Category>();
        for (const cat of allCategories) {
            if (!unique.has(cat.name)) {
                unique.set(cat.name, cat);
            }
        }
        return Array.from(unique.values());
    }, [allCategories]);

    const filteredProducts = useMemo(() => {
        let items = allProducts;
        if (activeCategory !== 'all') {
            items = items.filter(p => p.category === activeCategory);
        }
        if (searchQuery.trim()) {
            items = items.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        return items;
    }, [allProducts, activeCategory, searchQuery]);

    const handleAddToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item => 
                    item.product.id === product.id 
                    ? { ...item, quantity: item.quantity + 1 } 
                    : item
                );
            }
            return [...prev, { product, quantity: 1, notes: '' }];
        });
    };

    const handleUpdateQuantity = (productId: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) {
                const newQty = Math.max(0, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ar-IQ').format(amount);
    };

    const submitOrder = async () => {
        if (cart.length === 0) return;

        try {
            const mainWarehouse = await db.warehouses.where('type').equals('main').first();
            
            const newOrder: Order = {
                date: new Date(),
                customerId: 0,
                status: 'pending',
                fulfillmentStatus: 'pending',
                orderType: 'dine-in',
                tableNumber: tableNumber !== 'غير محدد' ? tableNumber : undefined,
                items: cart.map(item => ({
                    productId: item.product.id!,
                    name: item.product.name,
                    price: item.product.price,
                    costPrice: item.product.costPrice || 0,
                    quantity: item.quantity,
                    total: item.product.price * item.quantity,
                    notes: item.notes
                })),
                totalAmount: cartTotal,
                subtotalAmount: cartTotal,
                paidAmount: 0,
                paymentMethod: 'cash',
                discountAmount: 0,
                taxAmount: 0,
                serviceChargeAmount: 0,
                warehouseId: mainWarehouse?.id || 1,
                userId: 0, // Using 0 for customer self-orders
            };

            await db.orders.add(newOrder);
            
            setCart([]);
            setIsCartOpen(false);
            setIsOrderSuccess(true);
            setTimeout(() => setIsOrderSuccess(false), 5000);
        } catch (error) {
            console.error('Error submitting order', error);
            alert('حدث خطأ أثناء إرسال الطلب');
        }
    };

    if (isOrderSuccess) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans tracking-tight">
                <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6"
                >
                    <CheckCircle2 className="w-12 h-12" />
                </motion.div>
                <h1 className="text-3xl font-black text-slate-800 mb-2">تم استلام طلبك بنجاح!</h1>
                <p className="text-slate-500 font-medium text-lg">سوف نقوم بتجهيزه لك في أقرب وقت.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 font-sans pb-24" dir="rtl">
            {/* Header */}
            <div className="bg-white sticky top-0 z-40 shadow-sm border-b border-slate-200">
                <div className="px-5 py-4 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight">{restaurantName}</h1>
                            <p className="text-sm font-bold text-slate-500">الطاولة: <span className="text-brand-600">{tableNumber}</span></p>
                        </div>
                        {settings?.logo && (
                            <img src={settings.logo} alt="Logo" className="h-10 w-auto rounded-lg object-contain bg-slate-50 border border-slate-100" />
                        )}
                    </div>
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                            type="text" 
                            placeholder="ابحث عن الأطباق..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-10 pl-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all font-medium"
                        />
                    </div>
                </div>
                
                {/* Categories Scroll */}
                <div className="flex overflow-x-auto gap-2 px-5 py-3 scrollbar-none border-t border-slate-100 bg-slate-50/50">
                    <button 
                        onClick={() => setActiveCategory('all')}
                        className={`shrink-0 px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm border ${activeCategory === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 active:scale-95'}`}
                    >
                        الكل
                    </button>
                    {categories.map((cat, idx) => (
                        <button 
                            key={idx}
                            onClick={() => setActiveCategory(cat.name)}
                            className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm border ${activeCategory === cat.name ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 active:scale-95'}`}
                        >
                            {cat.name.includes('مشروب') ? <Coffee className="w-4 h-4" /> : cat.name.includes('سلط') ? <Leaf className="w-4 h-4" /> : <Utensils className="w-4 h-4" />}
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Grid */}
            <div className="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map(product => {
                    const cartItem = cart.find(i => i.product.id === product.id);
                    return (
                        <div key={product.id} className="bg-white rounded-3xl p-3 shadow-sm border border-slate-100 flex flex-col justify-between group overflow-hidden">
                            <div className="relative rounded-2xl overflow-hidden bg-slate-50 mb-3 aspect-square border border-slate-100 flex items-center justify-center">
                                {renderCustomerProductImage(product)}
                                {cartItem && (
                                    <div className="absolute top-2 left-2 bg-brand-600 text-white text-xs font-black px-2 py-1 rounded-lg border border-brand-500 shadow-md">
                                        {cartItem.quantity}x
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                                <div className="mb-3">
                                    <h3 className="font-bold text-slate-800 leading-snug mb-1">{product.name}</h3>
                                    {product.description && <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{product.description}</p>}
                                </div>
                                <div className="flex items-center justify-between mt-auto">
                                    <span className="font-black text-brand-600 tracking-tight">{formatCurrency(product.price)} <span className="text-[10px] text-slate-400 font-bold ml-1">{currency}</span></span>
                                    {cartItem ? (
                                        <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1 border border-slate-200">
                                            <button onClick={() => handleUpdateQuantity(product.id!, -1)} className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-slate-600 shadow-sm border border-slate-200 hover:text-red-600 active:scale-95 transition-all"><Minus className="w-4 h-4" /></button>
                                            <span className="font-bold text-sm w-4 text-center">{cartItem.quantity}</span>
                                            <button onClick={() => handleUpdateQuantity(product.id!, 1)} className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center text-white shadow-sm hover:bg-brand-700 active:scale-95 transition-all"><Plus className="w-4 h-4" /></button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => handleAddToCart(product)}
                                            className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center hover:bg-brand-600 hover:text-white transition-all active:scale-95 shadow-sm"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {filteredProducts.length === 0 && (
                <div className="text-center py-20 px-6">
                    <div className="bg-slate-200/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-bold text-lg">لم يتم العثور على أي أطباق.</p>
                </div>
            )}

            {/* Floating Cart Button */}
            <AnimatePresence>
                {cart.length > 0 && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-6 inset-x-5 z-40 max-w-lg mx-auto"
                    >
                        <button 
                            onClick={() => setIsCartOpen(true)}
                            className="bg-slate-800 text-white w-full rounded-2xl p-4 shadow-2xl flex items-center justify-between hover:bg-black transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center relative">
                                    <ShoppingBag className="w-5 h-5" />
                                    <span className="absolute -top-2 -right-2 bg-brand-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-slate-800">{cart.reduce((a,c) => a + c.quantity, 0)}</span>
                                </div>
                                <span className="font-bold text-lg">عرض السلة</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-emerald-400 font-black text-xl tracking-tight">{formatCurrency(cartTotal)}</span>
                                <ChevronRight className="w-5 h-5 opacity-70" />
                            </div>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cart Modal */}
            <AnimatePresence>
                {isCartOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCartOpen(false)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50"
                        />
                        <motion.div 
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 inset-x-0 bg-slate-50 rounded-t-[2.5rem] p-6 z-50 max-w-lg mx-auto shadow-[0_-20px_40px_rgba(0,0,0,0.2)] max-h-[85vh] flex flex-col border border-slate-200/50"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">سلة الطلبات</h2>
                                <button onClick={() => setIsCartOpen(false)} className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-300 transition-colors">
                                    <ChevronRight className="w-6 h-6 rotate-90" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                                {cart.map(item => (
                                    <div key={item.product.id} className="bg-white border text-right border-slate-100 p-4 rounded-3xl flex items-center justify-between shadow-sm">
                                        <div className="flex-1 ml-4 text-right">
                                            <h4 className="font-bold text-slate-800 leading-tight mb-1">{item.product.name}</h4>
                                            <span className="font-black text-emerald-600 tracking-tight">{formatCurrency(item.product.price)} {currency}</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                                            <button onClick={() => handleUpdateQuantity(item.product.id!, -1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-xl text-slate-600 shadow-sm border border-slate-200 hover:text-red-600 hover:border-red-200 transition-colors"><Minus className="w-4 h-4" /></button>
                                            <span className="w-6 text-center font-bold text-slate-800">{item.quantity}</span>
                                            <button onClick={() => handleUpdateQuantity(item.product.id!, 1)} className="w-8 h-8 flex items-center justify-center bg-brand-600 rounded-xl text-white shadow-sm hover:bg-brand-700 transition-colors"><Plus className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-slate-200 pt-5 mt-auto">
                                <div className="flex items-center justify-between mb-6 px-2">
                                    <span className="font-bold text-slate-500 text-lg">الإجمالي:</span>
                                    <span className="font-black text-3xl text-slate-800 tracking-tight">{formatCurrency(cartTotal)} <span className="text-sm text-slate-400">{currency}</span></span>
                                </div>
                                <button 
                                    onClick={submitOrder}
                                    className="w-full py-5 bg-brand-600 hover:bg-brand-700 text-white rounded-[2rem] font-black text-xl transition-all shadow-xl shadow-brand-500/20 active:scale-95 flex items-center justify-center gap-3 border border-brand-500"
                                >
                                    <Utensils className="w-6 h-6" />
                                    إرسال الطلب للمطبخ
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
