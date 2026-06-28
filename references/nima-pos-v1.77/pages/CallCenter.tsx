import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';
import { Product, CartItem, Order, Customer } from '../types';
import { 
  Phone, User, MapPin, Search, Plus, Minus, Trash2, 
  ShoppingBag, Truck, Check, AlertTriangle, FileText, 
  MessageSquare, Save, Headset, X, Map as MapIcon,
  UserCheck, UserPlus
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { ProductGrid } from '../components/pos/ProductGrid';
import { ModifierModal } from '../components/pos/ModifierModal';
import { VariantModal } from '../components/pos/VariantModal';
import { generateReferenceNumber } from '../utils/generateReference';

export default function CallCenter() {
  const { success, error } = useToast();
  const navigate = useNavigate();

  // Call Center Order State
  const [phoneSearch, setPhoneSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Customer Form State (for new or editing)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  
  // Order details
  const [cart, setCart] = useState<CartItem[]>([]);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState('');
  
  // Products/Categories
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [productSearch, setProductSearch] = useState('');
  const [debouncedProductSearch, setDebouncedProductSearch] = useState('');

  // Modifiers and Variants
  const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);
  const [selectedProductForModifiers, setSelectedProductForModifiers] = useState<Product | null>(null);
  
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<Product | null>(null);

  // Debouncing for product search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProductSearch(productSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];
  
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter customers by BOTH name and phone
  const matchingCustomers = useMemo(() => {
    if (!phoneSearch || phoneSearch.trim() === '') return [];
    const query = phoneSearch.trim().toLowerCase();
    return customers.filter(c => 
      (c.phone && c.phone.includes(query)) || 
      (c.name && c.name.toLowerCase().includes(query))
    );
  }, [phoneSearch, customers]);

  // Handle typing inside search query box
  const searchCustomer = (val: string) => {
    setPhoneSearch(val);
    setShowDropdown(true);

    // If query is modified and doesn't match selected customer name/phone, reset selectedCustomer
    if (selectedCustomer && val !== selectedCustomer.phone && val !== selectedCustomer.name) {
      setSelectedCustomer(null);
    }
    
    // Sync customer phone number if there is no selected customer (for typing new phones)
    if (!selectedCustomer) {
      setCustomerPhone(val);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
    setCustomerAddress(customer.address || '');
    setPhoneSearch(customer.phone); // populate phone as the search term
    setShowDropdown(false);
    success(`تم اختيار العميل: ${customer.name}`);
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setPhoneSearch('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setShowDropdown(false);
  };

  // Cart Management
  const addToCart = async (product: Product, variant?: any, modifiers?: { modifierName: string; option: any }[]) => {
    let finalPrice = variant ? variant.price : product.price;
    if (modifiers && modifiers.length > 0) {
        const modifiersExtra = modifiers.reduce((sum: number, mod: any) => sum + mod.option.price, 0);
        finalPrice += modifiersExtra;
    }

    const mappedModifiers = modifiers ? modifiers.map(m => ({
        modifierName: m.modifierName,
        optionName: m.option.name,
        price: m.option.price
    })) : undefined;

    setCart(prev => {
      const existing = prev.find(item => 
          item.id === product.id && 
          !item.itemNote &&
          item.variantName === (variant?.name || undefined) &&
          JSON.stringify(item.selectedModifiers) === JSON.stringify(mappedModifiers)
      );
      if (existing) {
        return prev.map(item =>
          item.cartItemId === existing.cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { 
          ...product, 
          price: finalPrice,
          quantity: 1, 
          cartItemId: crypto.randomUUID(),
          variantName: variant?.name,
          selectedModifiers: mappedModifiers
      }];
    });
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

  const updateQuantity = (cartItemId: string, change: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.cartItemId === cartItemId) {
          const newQuantity = item.quantity + change;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      });
    });
  };

  const updateItemNote = (cartItemId: string, note: string) => {
    setCart(prev => prev.map(item => 
      item.cartItemId === cartItemId ? { ...item, itemNote: note } : item
    ));
  };

  const removeItem = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + deliveryFee;

  const dbCategories = useLiveQuery(() => db.categories.toArray(), []) || [];
  const products = useLiveQuery(() => db.products.toArray(), []) || [];
  const orders = useLiveQuery(() => db.orders.toArray(), []) || [];

  const customerOrders = useMemo(() => {
     if (!selectedCustomer) return [];
     return orders.filter(o => o.customerId === selectedCustomer.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, selectedCustomer]);

  const categories = useMemo(() => {
     if (dbCategories && dbCategories.length > 0) {
         const catNames = Array.from(new Set(dbCategories.map(c => c.name.trim()))).filter(name => name !== 'الكل');
         return ['الكل', ...catNames];
     }
     return ['الكل'];
  }, [dbCategories]);

  const filteredProducts = useMemo(() => {
     let result = products;
     if (selectedCategory !== 'الكل') {
        const selected = selectedCategory.trim();
        result = result.filter(p => (p.category || '').trim() === selected);
     }
     if (debouncedProductSearch) {
        result = result.filter(p => 
           (p.name && p.name.includes(debouncedProductSearch)) || 
           (p.barcode && p.barcode.includes(debouncedProductSearch))
        );
     }
     return result;
  }, [products, selectedCategory, debouncedProductSearch]);

  const stockMap = useMemo(() => {
     const map = new Map<number, number>();
     products.forEach(p => map.set(p.id!, 999999));
     return map;
  }, [products]);

  // Submit Order
  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      error('السلة فارغة. يجب إضافة منتجات للطلب.');
      return;
    }
    if (!customerName || !customerPhone || !customerAddress) {
      error('يرجى التأكد من إدخال اسم العميل ورقم الهاتف والعنوان.');
      return;
    }

    try {
      let finalCustomerId = selectedCustomer?.id;
      
      // Save or update customer
      if (!selectedCustomer) {
        finalCustomerId = await db.customers.add({
          name: customerName,
          phone: customerPhone,
          address: customerAddress,
          totalSpent: 0,
        });
      } else if (selectedCustomer.address !== customerAddress || selectedCustomer.name !== customerName) {
         await db.customers.update(selectedCustomer.id!, {
           name: customerName,
           address: customerAddress
         });
      }

      const refNumber = await generateReferenceNumber('orders', 'ORD');

      const newOrder: Order = {
        date: new Date(),
        referenceNumber: refNumber,
        items: cart.map(item => ({
          productId: item.id!,
          name: item.name,
          price: item.price,
          costPrice: item.costPrice,
          quantity: item.quantity,
          total: item.price * item.quantity,
          variantName: item.variantName,
          selectedModifiers: item.selectedModifiers,
          note: item.itemNote,
        })),
        subtotalAmount: subtotal,
        totalAmount: total,
        paymentMethod: 'cash', // Typically cash on delivery
        status: 'draft',
        orderType: 'delivery',
        fulfillmentStatus: 'pending',
        customerId: finalCustomerId,
        deliveryAddress: customerAddress,
        deliveryPhone: customerPhone,
        deliveryFee: deliveryFee,
        note: orderNotes,
      };

      await db.orders.add(newOrder);
      
      success('تم تأكيد طلب الدليفري وإرساله للمطبخ');
      
      // Reset
      setCart([]);
      clearCustomer();
      setDeliveryFee(0);
      setOrderNotes('');
      
    } catch (err) {
      error('حدث خطأ أثناء حفظ الطلب');
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 p-4 gap-4" dir="rtl">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between border border-slate-200">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-3 rounded-xl text-indigo-700">
                    <Headset className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-xl font-bold font-['Tajawal'] text-slate-800">الكول سنتر</h1>
                    <p className="text-sm text-slate-500">استلام طلبات الدليفري وتوجيهها للتحضير</p>
                </div>
            </div>
            <button onClick={() => navigate('/delivery')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors border border-slate-200 flex items-center gap-2">
                 <Truck className="w-5 h-5"/>
                 إدارة الدليفري
            </button>
        </div>

        <div className="flex flex-1 gap-4 overflow-hidden">
            {/* Left Column: Cart & Customer Info */}
            <div className="w-[400px] flex flex-col gap-4">
                {/* Customer Panel */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col shrink-0 relative" ref={dropdownRef}>
                     <div className="bg-amber-50/80 border-b border-amber-100 p-4 pb-4">
                          <h2 className="font-bold text-amber-900 flex items-center justify-between gap-2 mb-3">
                               <div className="flex items-center gap-2">
                                    <Search className="w-5 h-5 text-amber-600" />
                                    <span>البحث الذكي عن عميل</span>
                               </div>
                               {selectedCustomer ? (
                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-black flex items-center gap-1.5 shadow-sm">
                                         <UserCheck className="w-3.5 h-3.5" />
                                         تم الاختيار
                                    </span>
                               ) : (
                                    <span className="text-[10px] bg-amber-150 text-amber-800 px-2.5 py-1 rounded-full font-black">
                                         البحث السريع
                                    </span>
                               )}
                          </h2>
                          <div className="relative overflow-visible">
                               <input 
                                  type="text" 
                                  autoFocus
                                  placeholder="رقم الهاتف أو اسم العميل للبحث السريع..."
                                  className="w-full pr-10 pl-4 py-3 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-bold text-base shadow-sm transition-all outline-none"
                                  value={phoneSearch}
                                  onChange={(e) => searchCustomer(e.target.value)}
                                  onFocus={() => setShowDropdown(true)}
                               />
                               <Phone className="w-5 h-5 text-amber-400 absolute right-3 top-3.5" />

                               {/* Autocomplete Suggestions Dropdown */}
                               {showDropdown && phoneSearch.trim().length > 0 && (
                                    <div className="absolute right-0 left-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden py-1 divide-y divide-slate-100 max-h-[280px] overflow-y-auto">
                                         {matchingCustomers.length > 0 ? (
                                              matchingCustomers.map((customer) => {
                                                   const numOrders = orders.filter(o => o.customerId === customer.id).length;
                                                   return (
                                                        <button
                                                            key={customer.id}
                                                            type="button"
                                                            onClick={() => handleSelectCustomer(customer)}
                                                            className="w-full text-right px-4 py-3 hover:bg-amber-50/40 flex items-center justify-between transition-colors gap-3 group"
                                                        >
                                                            <div className="flex items-center gap-2.5 font-['Tajawal']">
                                                                <div className="w-8 h-8 rounded-xl bg-amber-55 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-200 group-hover:bg-amber-100 transition-colors">
                                                                     {customer.name ? customer.name.charAt(0) : 'ع'}
                                                                </div>
                                                                <div>
                                                                     <h4 className="font-extrabold text-slate-800 text-sm leading-tight group-hover:text-amber-900 transition-colors">{customer.name}</h4>
                                                                     <p className="text-xs text-slate-500 font-bold font-mono mt-0.5">{customer.phone}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end shrink-0 gap-1 font-['Tajawal']">
                                                                {numOrders > 0 ? (
                                                                     <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-md border border-indigo-100/40">
                                                                          {numOrders} طلبات سابقة
                                                                     </span>
                                                                ) : (
                                                                     <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                                                          عميل جديد
                                                                     </span>
                                                                )}
                                                                {customer.address && (
                                                                     <p className="text-[10px] text-slate-400 font-medium max-w-[140px] truncate">{customer.address}</p>
                                                                )}
                                                            </div>
                                                        </button>
                                                   );
                                              })
                                         ) : (
                                              <div className="p-4.5 text-center flex flex-col items-center justify-center text-slate-500 font-['Tajawal']">
                                                   <UserPlus className="w-7 h-7 text-amber-400 mb-1.5 stroke-[1.5]" />
                                                   <p className="text-xs font-black text-slate-700">لا يوجد عميل مطابق للبحث</p>
                                                   <p className="text-[10px] text-slate-400 mt-1 leading-relaxed max-w-[240px] mx-auto">
                                                        اكتب اسم العميل وعنوانه بالأسفل وسوف نقوم بتسجيل هذا العميل تلقائياً عند تأكيد الطلب.
                                                   </p>
                                              </div>
                                         )}
                                    </div>
                               )}
                          </div>
                     </div>
                     <div className="p-4 space-y-3 bg-white">
                         <div className="relative">
                              <input 
                                  type="text"
                                  placeholder="اسم العميل"
                                  className="w-full pr-10 pl-3 py-2.5 border border-slate-200 rounded-xl text-slate-800 focus:border-indigo-500 font-bold outline-none transition-all"
                                  value={customerName}
                                  onChange={e => setCustomerName(e.target.value)}
                                />
                              <User className="w-5 h-5 text-slate-400 absolute right-3 top-3.5" />
                         </div>
                         <div className="relative flex flex-col gap-1">
                              <div className="relative">
                                  <textarea 
                                      placeholder="العنوان التفصيلي (المنطقة، الشارع، المبنى، شقة)"
                                      className="w-full pr-10 pl-3 py-2.5 border border-slate-200 rounded-xl text-slate-805 focus:border-indigo-500 min-h-[80px] resize-none outline-none font-medium transition-all"
                                      value={customerAddress}
                                      onChange={e => setCustomerAddress(e.target.value)}
                                  ></textarea>
                                  <MapPin className="w-5 h-5 text-slate-400 absolute right-3 top-3.5" />
                              </div>
                                  {customerAddress && (
                                     <a 
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customerAddress)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-600 hover:text-indigo-800 text-xs font-bold inline-flex items-center gap-1 w-fit"
                                     >
                                        <MapIcon className="w-3 h-3" />
                                        فتح في خرائط جوجل
                                     </a>
                                  )}
                         </div>
                         {selectedCustomer && (
                              <div className="flex flex-col gap-2 mt-2">
                                <div className="flex justify-between items-center bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-sm font-bold border border-emerald-100">
                                     <span>تم تحديده من السجلات</span>
                                     <button onClick={clearCustomer} className="text-emerald-900 hover:bg-emerald-100 p-1 rounded">
                                          <X className="w-4 h-4"/>
                                     </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                     <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 flex flex-col items-center justify-center">
                                         <span className="text-slate-500 font-bold mb-1">الطلبات السابقة</span>
                                         <span className="text-lg font-black text-slate-800">{customerOrders.length}</span>
                                     </div>
                                     <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-2 flex flex-col items-center justify-center">
                                         <span className="text-indigo-600 font-bold mb-1">آخر طلب</span>
                                         <span className="text-base font-bold text-indigo-900">
                                            {customerOrders.length > 0 ? new Date(customerOrders[0].date).toLocaleDateString('ar-EG') : 'لا يوجد'}
                                         </span>
                                     </div>
                                </div>
                              </div>
                         )}
                     </div>
                </div>

                {/* Cart Panel */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-0 flex-1 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                         <h2 className="font-bold text-slate-800 flex items-center gap-2">
                              <ShoppingBag className="w-5 h-5 text-indigo-600" />
                              ملخص الطلب
                         </h2>
                         <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full text-xs font-bold">{cart.length}</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 flex flex-col">
                        {cart.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4 py-20 text-center">
                                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shadow-3xs animate-pulse">
                                     <ShoppingBag className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                                </div>
                                <div>
                                     <p className="font-extrabold text-slate-600 text-sm leading-normal">إختر المنتجات لإضافتها</p>
                                     <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto leading-relaxed">اختر المنتجات والوجبات اللذيذة من القائمة لإدراجها في السلة</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2 p-2">
                                {cart.map(item => (
                                    <div key={item.cartItemId} className="bg-white border border-slate-100 rounded-xl p-3 flex shadow-sm items-center justify-between group">
                                        <div className="flex-1">
                                            <div className="font-bold text-slate-800">
                                               {item.name}
                                               {item.variantName && <span className="text-xs mr-2 text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">{item.variantName}</span>}
                                            </div>
                                            {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                                <div className="text-[10px] text-slate-500 mt-1 flex flex-wrap gap-1">
                                                    {item.selectedModifiers.map((m, idx) => (
                                                        <span key={idx} className="bg-slate-100 px-1 py-0.5 rounded">+{m.optionName}</span>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="text-sm font-bold text-slate-600 mt-1">{item.price} ج.م</div>
                                            <input 
                                               type="text" 
                                               placeholder="ملاحظات الصنف..." 
                                               className="w-full mt-2 text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-indigo-400"
                                               value={item.itemNote || ''}
                                               onChange={(e) => updateItemNote(item.cartItemId!, e.target.value)}
                                            />
                                        </div>
                                        <div className="flex items-center gap-3">
                                             <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                                                 <button onClick={() => updateQuantity(item.cartItemId!, -1)} className="p-1 hover:bg-white rounded-md transition-colors"><Minus className="w-4 h-4" /></button>
                                                 <span className="w-6 text-center font-bold text-slate-800">{item.quantity}</span>
                                                 <button onClick={() => updateQuantity(item.cartItemId!, 1)} className="p-1 hover:bg-white rounded-md transition-colors"><Plus className="w-4 h-4" /></button>
                                             </div>
                                             <button onClick={() => removeItem(item.cartItemId!)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                 <Trash2 className="w-4 h-4" />
                                             </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-50 border-t border-slate-200 p-4 space-y-3">
                         <div className="flex items-center justify-between text-sm">
                             <span className="text-slate-600">المجموع الفرعي</span>
                             <span className="font-bold">{subtotal} ج.م</span>
                         </div>
                         <div className="flex items-center justify-between text-sm">
                             <span className="text-slate-600 flex items-center gap-1">توصيل <Truck className="w-4 h-4"/></span>
                             <input 
                                 type="number"
                                 className="w-24 px-2 py-1 border border-slate-300 rounded text-center focus:outline-none focus:border-indigo-500"
                                 value={deliveryFee || ''}
                                 onChange={e => setDeliveryFee(parseFloat(e.target.value) || 0)}
                                 placeholder="0"
                             />
                         </div>
                         <div className="flex items-center gap-2 text-sm pt-2">
                             <MessageSquare className="w-4 h-4 text-slate-400" />
                             <input 
                                 type="text"
                                 className="flex-1 bg-transparent border-b border-slate-200 focus:outline-none focus:border-indigo-500 px-1 py-1"
                                 placeholder="ملاحظات الطلب (اختياري)"
                                 value={orderNotes}
                                 onChange={e => setOrderNotes(e.target.value)}
                             />
                         </div>
                         <div className="flex items-center justify-between text-lg font-black pt-2 pb-2 border-t border-slate-200">
                             <span className="text-slate-800">الإجمالي النهائي</span>
                             <span className="text-indigo-700 text-2xl">{total} ج.م</span>
                         </div>
                         <button 
                            onClick={handleSubmitOrder}
                            className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-xl flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={cart.length === 0}
                         >
                             <Save className="w-5 h-5" />
                             إعتماد وإرسال الطلب
                         </button>
                    </div>
                </div>
            </div>

            {/* Right Column: Menu */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                 <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-6 overflow-hidden">
                     <div className="relative w-64 md:w-80 shrink-0">
                         <input 
                            type="text"
                            placeholder="بحث في المنيو..."
                            className="w-full pr-10 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                         />
                         <Search className="w-5 h-5 text-slate-400 absolute right-3 top-3.5" />
                     </div>
                     <div className="flex-1 overflow-x-auto flex items-center gap-2 pb-1">
                         {categories.map((cat, idx) => (
                             <button
                                 key={`${cat}-${idx}`}
                                 onClick={() => setSelectedCategory(cat)}
                                 className={`px-4 py-2 rounded-full whitespace-nowrap font-bold transition-colors ${
                                     selectedCategory === cat 
                                     ? 'bg-indigo-600 text-white shadow-md' 
                                     : 'bg-slate-50 text-slate-700 hover:bg-slate-200 border border-slate-200'
                                 }`}
                             >
                                 {cat}
                             </button>
                         ))}
                     </div>
                 </div>
                 <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50">
                     <ProductGrid
                         filteredProducts={filteredProducts}
                         isRefundMode={false}
                         stockMap={stockMap}
                         handleProductClick={handleProductClick}
                         formatCurrency={(amount) => `${amount} ج.م`}
                         viewMode="grid"
                     />
                 </div>
            </div>

            {/* Modals */}
            <ModifierModal
                isOpen={isModifierModalOpen}
                onClose={() => setIsModifierModalOpen(false)}
                product={selectedProductForModifiers}
                onConfirm={(modifiers) => {
                    if (selectedProductForModifiers) {
                        const variant = (selectedProductForModifiers as any)._tempVariantName 
                             ? { name: (selectedProductForModifiers as any)._tempVariantName, price: selectedProductForModifiers.price, barcode: selectedProductForModifiers.barcode }
                             : undefined;
                        addToCart(selectedProductForModifiers, variant, modifiers);
                        setIsModifierModalOpen(false);
                    }
                }}
                formatCurrency={(amount) => `${amount} ج.م`}
            />

            <VariantModal
                isOpen={isVariantModalOpen}
                onClose={() => setIsVariantModalOpen(false)}
                selectedProductForVariants={selectedProductForVariants}
                handleVariantSelect={(variant) => {
                    if (selectedProductForVariants) {
                        const modifiedProduct = {
                            ...selectedProductForVariants,
                            price: variant.price,
                            barcode: variant.barcode || selectedProductForVariants.barcode,
                            _tempVariantName: variant.name
                        };

                        if (selectedProductForVariants.modifiers && selectedProductForVariants.modifiers.length > 0) {
                           setIsVariantModalOpen(false);
                           setSelectedProductForModifiers(modifiedProduct);
                           setIsModifierModalOpen(true);
                        } else {
                           addToCart(selectedProductForVariants, variant);
                           setIsVariantModalOpen(false);
                        }
                    }
                }}
                formatCurrency={(amount) => `${amount} ج.م`}
            />
        </div>
    </div>
  );
}
