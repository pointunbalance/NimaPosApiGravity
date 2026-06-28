import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Product, Table as TableType, Order, OrderItem } from '../../types';
import { 
  Utensils, Plus, Minus, Trash2, ChevronRight, ChevronLeft, ChefHat, Armchair, 
  AlertCircle, ShoppingBag, Search, Sparkles, Filter, Layers, CheckSquare, 
  X, Clipboard, Clock, Coins, User, Smile, PlusCircle, CheckCircle2,
  BookOpen, SlidersHorizontal, ArrowLeftRight, Trash, Info, Check, RotateCcw
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { generateReferenceNumber } from '../../utils/generateReference';

export const WaiterApp = () => {
    const { success, error } = useToast();
    const [activeTab, setActiveTab] = useState<'tables' | 'kitchen_status' | 'menu_explorer'>('tables');
    
    // Core state
    const [selectedTable, setSelectedTable] = useState<TableType | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [tableSearchQuery, setTableSearchQuery] = useState('');
    const [zoneFilter, setZoneFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [cart, setCart] = useState<OrderItem[]>([]);
    
    // Focused states for table operations
    const [focusedTable, setFocusedTable] = useState<TableType | null>(null);
    const [showTableOptions, setShowTableOptions] = useState(false);
    const [selectedModalTab, setSelectedModalTab] = useState<'controls' | 'history'>('controls');
    const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
    const [splittingMode, setSplittingMode] = useState<'none' | 'equal' | 'items'>('none');
    const [splitPeopleCount, setSplitPeopleCount] = useState<number>(2);
    const [selectedSplitItems, setSelectedSplitItems] = useState<Record<number, number>>({});
    const [splitPaymentMethod, setSplitPaymentMethod] = useState<'cash' | 'card'>('cash');
    
    // Quick Note editing in the Cart
    const [editingNoteItemId, setEditingNoteItemId] = useState<number | null>(null);
    const [tempItemNote, setTempItemNote] = useState('');

    // Real-time ticking for active calculation
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(interval);
    }, []);

    // Live Dexie queries
    const tables = useLiveQuery(() => db.diningTables?.toArray() || Promise.resolve([])) || [];
    const products = useLiveQuery(async () => {
        const allProducts = await db.products.toArray();
        return allProducts.filter(p => !p.isService);
    }) || [];
    const categories = useLiveQuery(() => db.categories.toArray()) || [];
    const allKitchenOrders = useLiveQuery(() => db.orders.toArray()) || [];

    // Derive active dine-in orders dynamically just like in POS and Table Management
    const activeOrders = useMemo(() => {
        return allKitchenOrders.filter(o => 
            o.orderType === 'dine-in' && 
            o.status !== 'completed' &&
            o.status !== 'refunded' && 
            o.fulfillmentStatus !== 'served'
        );
    }, [allKitchenOrders]);

    // Map orders to their respective tables for quick lookup on table list
    const tableOrdersMap = useMemo(() => {
        const map: Record<string, Order> = {};
        activeOrders.forEach(o => {
            if (o.tableNumber) {
                map[o.tableNumber] = o;
            }
        });
        return map;
    }, [activeOrders]);

    // Unique Zones derived from tables
    const uniqueZones = useMemo(() => {
        const zones = tables.map(t => t.zone);
        return Array.from(new Set(zones.filter(Boolean)));
    }, [tables]);

    // Derive Table Statuses and active orders to align with POS & Table Management
    const derivedTables = useMemo(() => {
        return tables.map(table => {
            const activeOrder = tableOrdersMap[table.name];
            const baseStatus = table.status;
            let derivedStatus = baseStatus;
            
            if (activeOrder) {
                if (baseStatus !== 'requesting_bill') {
                    derivedStatus = 'occupied';
                }
            } else {
                derivedStatus = (baseStatus === 'reserved' || baseStatus === 'requesting_bill') ? baseStatus : 'available';
            }
            return {
                ...table,
                status: derivedStatus,
                activeOrder,
                // If there's an active order, use its date as seating/reservation start
                reservedAt: activeOrder ? activeOrder.date : table.reservedAt
            };
        });
    }, [tables, tableOrdersMap]);

    // Derived statistics for table list using derived table statuses
    const stats = useMemo(() => {
        const total = derivedTables.length;
        const available = derivedTables.filter(t => t.status === 'available' || !t.status).length;
        const occupied = derivedTables.filter(t => t.status === 'occupied').length;
        const billing = derivedTables.filter(t => t.status === 'requesting_bill').length;
        const totalRevenue = activeOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        return { total, available, occupied, billing, totalRevenue };
    }, [derivedTables, activeOrders]);

    // Select past orders history for the focused table
    const tablePastOrders = useMemo(() => {
        if (!focusedTable) return [];
        return allKitchenOrders.filter(o => 
            o.tableNumber === focusedTable.name && 
            o.status !== 'draft' &&
            // Exclude currently active dine-in orders from history
            !(o.orderType === 'dine-in' && o.status !== 'completed' && o.status !== 'refunded' && o.fulfillmentStatus !== 'served')
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [focusedTable, allKitchenOrders]);

    // Format active order start hour
    const formatOrderTime = (dateInput?: Date | string) => {
        if (!dateInput) return '--:--';
        const d = new Date(dateInput);
        return d.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    // Calculate sitting/seating indicator severity color & text
    const getDurationBadgeColor = (reservedAt?: Date | string) => {
        if (!reservedAt) return { bgIcon: 'bg-slate-100 border-slate-200', textIcon: 'text-slate-400', badgeBgText: 'bg-slate-100 text-slate-550', label: 'غير نشط' };
        const start = new Date(reservedAt);
        const diffMs = now.getTime() - start.getTime();
        const diffMin = Math.max(0, Math.floor(diffMs / 60000));

        if (diffMin < 45) {
            return {
                bgIcon: 'bg-emerald-50 border-emerald-100/60',
                textIcon: 'text-emerald-600',
                badgeBgText: 'bg-emerald-100 text-emerald-800',
                label: 'جلسة حديثة 🟢'
            };
        } else if (diffMin < 90) {
            return {
                bgIcon: 'bg-amber-50 border-amber-200/60',
                textIcon: 'text-amber-600',
                badgeBgText: 'bg-amber-100 text-amber-850',
                label: 'جلسة متوسطة 🟡'
            };
        } else {
            return {
                bgIcon: 'bg-rose-50 border-rose-200',
                textIcon: 'text-rose-600',
                badgeBgText: 'bg-rose-100 text-rose-800',
                label: 'جلسة طويلة 🔴'
            };
        }
    };

    // Filtered Tables using derived tables
    const filteredTables = useMemo(() => {
        return derivedTables.filter(t => {
            const matchesZone = zoneFilter === 'all' || t.zone === zoneFilter;
            const matchesStatus = statusFilter === 'all' || 
                                  (statusFilter === 'available' && (t.status === 'available' || !t.status)) ||
                                  (statusFilter === 'occupied' && t.status === 'occupied') ||
                                  (statusFilter === 'requesting_bill' && t.status === 'requesting_bill');
            const matchesSearch = t.name.toLowerCase().includes(tableSearchQuery.toLowerCase()) || 
                                  (t.zone && t.zone.toLowerCase().includes(tableSearchQuery.toLowerCase()));
            return matchesZone && matchesStatus && matchesSearch;
        });
    }, [derivedTables, zoneFilter, statusFilter, tableSearchQuery]);

    // Category with Dynamic Icon Picker
    const getCategoryIcon = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('مشروب') || lower.includes('عصير') || lower.includes('drink') || lower.includes('juice')) {
            return '🥤';
        }
        if (lower.includes('بيتزا') || lower.includes('pizza')) {
            return '🍕';
        }
        if (lower.includes('برغر') || lower.includes('burger')) {
            return '🍔';
        }
        if (lower.includes('كباب') || lower.includes('لحم') || lower.includes('شاورما') || lower.includes('meat') || lower.includes('grill')) {
            return '🍖';
        }
        if (lower.includes('سلط') || lower.includes('salad') || lower.includes('مقبلات')) {
            return '🥗';
        }
        if (lower.includes('حلو') || lower.includes('dessert') || lower.includes('كيك') || lower.includes('cake')) {
            return '🍰';
        }
        if (lower.includes('شيش') || lower.includes('معسل') || lower.includes('ارجيلا')) {
            return '💨';
        }
        return '🍽️';
    };

    // Filtered Products
    const filteredProducts = products.filter(p => 
        (selectedCategory === 'all' || p.category === selectedCategory) &&
        (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode?.includes(searchQuery))
    );

    // Initial table selection
    const handleSelectTable = async (table: TableType) => {
        setSelectedTable(table);
        setCart([]); 
        
        if (table.status === 'occupied' || table.status === 'requesting_bill') {
            const active = tableOrdersMap[table.name];
            if (active) {
                setCart(active.items || []);
            }
        }
    };

    // Cart Handlers
    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id);
            if (existing) {
                return prev.map(item => 
                    item.productId === product.id 
                    ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
                    : item
                );
            }
            return [...prev, {
                productId: product.id!,
                name: product.name,
                price: product.price,
                costPrice: product.costPrice || 0,
                quantity: 1,
                total: product.price,
                note: ''
            }];
        });
        success(`تم إضافة ${product.name}`);
    };

    const updateQuantity = (productId: number, delta: number) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.productId === productId) {
                    const newQty = item.quantity + delta;
                    if (newQty <= 0) return item; 
                    return { ...item, quantity: newQty, total: newQty * item.price };
                }
                return item;
            }).filter(item => item.productId !== productId || item.quantity + delta > 0);
        });
    };

    const handleSaveItemNote = (productId: number) => {
        setCart(prev => prev.map(item => 
            item.productId === productId 
            ? { ...item, note: tempItemNote } 
            : item
        ));
        setEditingNoteItemId(null);
        success("تم حفظ الملاحظة بنجاح");
    };

    const startEditingNote = (item: OrderItem) => {
        setEditingNoteItemId(item.productId);
        setTempItemNote(item.note || '');
    };

    // Kitchen dispatch/update database
    const sendToKitchen = async () => {
        if (!selectedTable || cart.length === 0) return;
        
        try {
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const currentUserData = localStorage.getItem('nima_user');
            const user = currentUserData ? JSON.parse(currentUserData) : { id: 1, name: 'Waiter' };
            
            const existingOrder = tableOrdersMap[selectedTable.name];

            if (existingOrder) {
                await db.orders.update(existingOrder.id!, {
                    items: cart,
                    subtotalAmount: subtotal,
                    totalAmount: subtotal,
                    fulfillmentStatus: 'pending' // trigger kitchen updates
                });
            } else {
                const ref = await generateReferenceNumber('orders', 'POS');
                const newOrder: Order = {
                    referenceNumber: ref,
                    date: new Date(),
                    items: cart,
                    subtotalAmount: subtotal,
                    totalAmount: subtotal,
                    paymentMethod: 'cash',
                    status: 'draft',
                    fulfillmentStatus: 'pending',
                    orderType: 'dine-in',
                    tableNumber: selectedTable.name,
                    userId: user.id
                };
                await db.orders.add(newOrder);
                if (db.diningTables) {
                    await db.diningTables.update(selectedTable.id!, { status: 'occupied', reservedAt: new Date() });
                }
            }
            
            success("تم إرسال الطلب وحفظه للتحضير بنجاح");
            setSelectedTable(null);
            setCart([]);
            
        } catch (err: any) {
            error("حدث خطأ أثناء الإرسال");
            console.error(err);
        }
    };

    const requestBill = async (table: TableType) => {
        try {
            if (db.diningTables) {
                await db.diningTables.update(table.id!, { status: 'requesting_bill' });
            }
            success(`تم طلب طباعة الفاتورة للطاولة ${table.name}`);
            if (focusedTable?.id === table.id) {
                setFocusedTable(prev => prev ? { ...prev, status: 'requesting_bill' } : null);
            }
            setShowTableOptions(false);
        } catch (err) {
            error("حدث خطأ");
        }
    };

    const freeTable = async (table: TableType) => {
        try {
            const activeOrder = tableOrdersMap[table.name];
            
            // Mark draft order as completed/paid to keep billing report exact
            if (activeOrder) {
                await db.orders.update(activeOrder.id!, {
                    status: 'completed',
                    completedAt: new Date()
                });
            }

            if (db.diningTables) {
                await db.diningTables.update(table.id!, { 
                    status: 'available',
                    reservedAt: undefined 
                });
            }
            success(`تم تحرير وإخلاء طاولة ${table.name} بنجاح`);
            setShowTableOptions(false);
            setFocusedTable(null);
        } catch (err) {
            error("حدث خطأ أثناء إخلاء الطاولة");
        }
    };

    const payEqualShare = async (table: TableType, totalAmount: number, sharesCount: number) => {
        try {
            const activeOrder = tableOrdersMap[table.name];
            if (!activeOrder) return;

            const shareAmount = Math.round(totalAmount / sharesCount);
            const ref = await generateReferenceNumber('orders', 'POS');
            const currentUserData = localStorage.getItem('nima_user');
            const user = currentUserData ? JSON.parse(currentUserData) : { id: 1, name: 'Waiter' };

            // Create completed order for the split share
            const newOrder: Order = {
                referenceNumber: ref,
                date: new Date(),
                completedAt: new Date(),
                items: [{
                    productId: 9999, // generic split bill item id
                    name: `حصة (1 من ${sharesCount}) من فاتورة طاولة ${table.name}`,
                    price: shareAmount,
                    quantity: 1,
                    total: shareAmount
                }],
                subtotalAmount: shareAmount,
                totalAmount: shareAmount,
                paymentMethod: splitPaymentMethod,
                status: 'completed',
                fulfillmentStatus: 'served',
                orderType: 'dine-in',
                tableNumber: table.name,
                userId: user.id,
                cashierName: user.name
            };

            await db.orders.add(newOrder);

            // Update remaining draft order
            const remainingTotal = Math.max(0, activeOrder.totalAmount - shareAmount);
            if (remainingTotal <= 100 || sharesCount <= 1) { // practically zero or last share
                // Mark original draft completed
                await db.orders.update(activeOrder.id!, {
                    status: 'completed',
                    completedAt: new Date()
                });

                if (db.diningTables) {
                    await db.diningTables.update(table.id!, { 
                        status: 'available',
                        reservedAt: undefined 
                    });
                }
                success(`تم تسديد الحصة الأخيرة بقيمة ${shareAmount.toLocaleString()} د.ع وتفريغ الطاولة ${table.name}`);
                setFocusedTable(null);
                setShowTableOptions(false);
            } else {
                // Keep draft order open with a decreased remaining total and increment custom note
                await db.orders.update(activeOrder.id!, {
                    totalAmount: remainingTotal,
                    subtotalAmount: remainingTotal,
                    note: (activeOrder.note || '') + ` (تم دفع حصة بقيمة ${shareAmount.toLocaleString()} د.ع)`
                });
                success(`تم تسديد حصة بقيمة ${shareAmount.toLocaleString()} د.ع بنجاح. المتبقي: ${remainingTotal.toLocaleString()} د.ع`);
            }
            
            // Reset splitting states
            setSplittingMode('none');
            setSelectedSplitItems({});
            
            // Re-fetch focused table updates
            if (focusedTable?.id === table.id) {
                const updatedTable = await db.diningTables.get(table.id!);
                if (updatedTable) {
                    setFocusedTable(updatedTable);
                }
            }
        } catch (err) {
            console.error(err);
            error("حدث خطأ أثناء تقسيم وتسديد الفاتورة");
        }
    };

    const payItemSplit = async (table: TableType) => {
        try {
            const activeOrder = tableOrdersMap[table.name];
            if (!activeOrder || !activeOrder.items) return;

            // Compile the split items
            const splitItems: OrderItem[] = [];
            const remainingItems: OrderItem[] = [];

            activeOrder.items.forEach((item, index) => {
                const qtyToSplit = selectedSplitItems[index] || 0;
                if (qtyToSplit > 0) {
                    splitItems.push({
                        ...item,
                        quantity: qtyToSplit,
                        total: item.price * qtyToSplit
                    });
                }
                
                const qtyRemaining = item.quantity - qtyToSplit;
                if (qtyRemaining > 0) {
                    remainingItems.push({
                        ...item,
                        quantity: qtyRemaining,
                        total: item.price * qtyRemaining
                    });
                }
            });

            if (splitItems.length === 0) {
                error("يرجى تحديد أصناف ليتم تقسيمها أولاً");
                return;
            }

            const splitSubtotal = splitItems.reduce((sum, item) => sum + item.total, 0);
            const ref = await generateReferenceNumber('orders', 'POS');
            const currentUserData = localStorage.getItem('nima_user');
            const user = currentUserData ? JSON.parse(currentUserData) : { id: 1, name: 'Waiter' };

            // Create completed order for these split items
            const newOrder: Order = {
                referenceNumber: ref,
                date: new Date(),
                completedAt: new Date(),
                items: splitItems,
                subtotalAmount: splitSubtotal,
                totalAmount: splitSubtotal,
                paymentMethod: splitPaymentMethod,
                status: 'completed',
                fulfillmentStatus: 'served',
                orderType: 'dine-in',
                tableNumber: table.name,
                userId: user.id,
                cashierName: user.name
            };

            await db.orders.add(newOrder);

            if (remainingItems.length === 0) {
                // No items left on table -> complete original draft order and free table
                await db.orders.update(activeOrder.id!, {
                    status: 'completed',
                    completedAt: new Date()
                });

                if (db.diningTables) {
                    await db.diningTables.update(table.id!, { 
                        status: 'available',
                        reservedAt: undefined 
                    });
                }
                success(`تم تسديد الفاتورة الفرعية بالكامل بقيمة ${splitSubtotal.toLocaleString()} د.ع وتفريغ الطاولة`);
                setFocusedTable(null);
                setShowTableOptions(false);
            } else {
                // Update the original draft order with remaining items
                const remainingTotal = remainingItems.reduce((sum, item) => sum + item.total, 0);
                await db.orders.update(activeOrder.id!, {
                    items: remainingItems,
                    subtotalAmount: remainingTotal,
                    totalAmount: remainingTotal
                });
                success(`تم تسديد الفاتورة الفرعية بقيمة ${splitSubtotal.toLocaleString()} د.ع. المتبقي على الطاولة: ${remainingTotal.toLocaleString()} د.ع`);
            }

            // Reset splitting states
            setSplittingMode('none');
            setSelectedSplitItems({});

            // Re-fetch focused table updates
            if (focusedTable?.id === table.id) {
                const updatedTable = await db.diningTables.get(table.id!);
                if (updatedTable) {
                    setFocusedTable(updatedTable);
                }
            }
        } catch (err) {
            console.error(err);
            error("حدث خطأ أثناء تقسيم وتسديد الفاتورة بالأصناف");
        }
    };

    // Automated Seed / Onboarding Generation for Development
    const handleSeedData = async () => {
        try {
            // Seed Categories first if empty
            if (categories.length === 0) {
                const defaultCats = [
                    { name: "وجبات رئيسية" },
                    { name: "مقبلات وسلطات" },
                    { name: "مشروبات وعصائر" },
                    { name: "حلويات" },
                    { name: "أرجيلة ومعسل" }
                ];
                for (const c of defaultCats) {
                    await db.categories.add(c);
                }
            }

            // Seed Products if empty
            if (products.length === 0) {
                const defaultProds = [
                    { name: "شاورما لحم دبل", category: "وجبات رئيسية", price: 8500, costPrice: 4000, isActive: true },
                    { name: "برغر لحم دبل فاخر", category: "وجبات رئيسية", price: 9000, costPrice: 4500, isActive: true },
                    { name: "بيتزا مارغريتا إيطالية", category: "وجبات رئيسية", price: 12000, costPrice: 5000, isActive: true },
                    { name: "كباب لحم عراقي بالرز", category: "وجبات رئيسية", price: 15000, costPrice: 7000, isActive: true },
                    { name: "وجبة تواصي نصف دجاجة", category: "وجبات رئيسية", price: 11000, costPrice: 5500, isActive: true },
                    { name: "حمص ملوكي باللحم", category: "مقبلات وسلطات", price: 5000, costPrice: 2000, isActive: true },
                    { name: "سلطة سيزر بالدجاج", category: "مقبلات وسلطات", price: 6500, costPrice: 2500, isActive: true },
                    { name: "عصير ليمون نعناع منعش", category: "مشروبات وعصائر", price: 3500, costPrice: 1000, isActive: true },
                    { name: "ميلك شيك نوتيلا", category: "مشروبات وعصائر", price: 4500, costPrice: 1500, isActive: true },
                    { name: "مشروب كوكا كولا بارد", category: "مشروبات وعصائر", price: 1000, costPrice: 400, isActive: true },
                    { name: "كنافة نابلسية خشنة بالجبن", category: "حلويات", price: 6000, costPrice: 2500, isActive: true },
                    { name: "كيك بركان الشوكولاتة", category: "حلويات", price: 5500, costPrice: 2000, isActive: true },
                    { name: "معسل تفاحتين فاخر", category: "أرجيلة ومعسل", price: 7000, costPrice: 2000, isActive: true }
                ];
                for (const p of defaultProds) {
                    await db.products.add(p as any);
                }
            }

            // Seed Tables
            const defaultTables = [
                { name: "طاولة 1", zone: "الصالة الرئيسية", seats: 4, status: "available" },
                { name: "طاولة 2", zone: "الصالة الرئيسية", seats: 2, status: "available" },
                { name: "طاولة 3", zone: "الصالة الرئيسية", seats: 6, status: "available" },
                { name: "طاولة 4", zone: "الصالة الرئيسية", seats: 4, status: "available" },
                { name: "طاولة 5", zone: "الصالة الرئيسية", seats: 8, status: "available" },
                { name: "طاولة 6 عائلية", zone: "القسم العائلي", seats: 6, status: "available" },
                { name: "طاولة 7 عائلية", zone: "القسم العائلي", seats: 10, status: "available" },
                { name: "طاولة 8 عائلية", zone: "القسم العائلي", seats: 8, status: "available" },
                { name: "طاولة 9 خارجية", zone: "الحديقة الخارجية", seats: 4, status: "available" },
                { name: "طاولة 10 خارجية", zone: "الحديقة الخارجية", seats: 2, status: "available" },
                { name: "طاولة 11 ملكية", zone: "جناح VIP", seats: 6, status: "available" },
                { name: "طاولة 12 ذهبية", zone: "جناح VIP", seats: 4, status: "available" }
            ];

            for (const t of defaultTables) {
                await db.diningTables.add(t as any);
            }
            success("تم تهيئة طاولات المطعم الافتراضية بنجاح ومواد المنيو!");
        } catch (err) {
            error("حدث خطأ أثناء تهيئة البيانات الافتراضية");
        }
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Calculate elapsed time formatted
    const getElapsedStr = (reservedAt?: Date | string) => {
        if (!reservedAt) return '';
        const start = new Date(reservedAt);
        const diffMs = now.getTime() - start.getTime();
        const diffMin = Math.max(0, Math.floor(diffMs / 60000));
        
        if (diffMin < 60) {
            return `منذ ${diffMin} دقيقة`;
        }
        const hours = Math.floor(diffMin / 60);
        const mins = diffMin % 60;
        return `منذ ${hours} س و ${mins} د`;
    };

    // Sub-view: Active Kitchen Monitor
    const activeKitchenOrdersList = useMemo(() => {
        // filter orders that have table reference and pending/preparing status
        return allKitchenOrders.filter(o => 
            o.orderType === 'dine-in' && 
            (o.fulfillmentStatus === 'pending' || o.fulfillmentStatus === 'preparing' || o.fulfillmentStatus === 'ready')
        ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [allKitchenOrders]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-['Tajawal'] antialiased select-none" dir="rtl">
            
            {/* Main Waiter Navbar */}
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white shadow-xl px-4 py-3 shrink-0 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center border border-white/15 animate-pulse">
                        <Utensils className="w-5.5 h-5.5 text-amber-400" />
                    </div>
                    <div>
                        <h1 className="text-base md:text-lg font-black tracking-tight flex items-center gap-1.5">
                            تطبيق النادل الالكتروني
                            <span className="text-[10px] bg-amber-400 text-slate-900 font-extrabold px-1.5 py-0.5 rounded-md uppercase">المطعم</span>
                        </h1>
                        <p className="text-[10px] text-indigo-200">إدارة وخدمة صالة العملاء الفورية</p>
                    </div>
                </div>

                {/* Sub-view Navigation Control Tabs */}
                <div className="flex items-center gap-1.5">
                    <button 
                        onClick={() => { setActiveTab('tables'); setSelectedTable(null); }}
                        className={`px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 transition-all ${
                            activeTab === 'tables' && !selectedTable 
                            ? 'bg-amber-400 text-slate-900 shadow-md scale-102' 
                            : 'hover:bg-white/10 text-slate-300 hover:text-white'
                        }`}
                    >
                        <Armchair className="w-4 h-4" />
                        <span className="hidden sm:inline">حالة الطاولات</span>
                    </button>

                    <button 
                        onClick={() => { setActiveTab('kitchen_status'); setSelectedTable(null); }}
                        className={`px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 transition-all relative ${
                            activeTab === 'kitchen_status' 
                            ? 'bg-amber-400 text-slate-900 shadow-md scale-102' 
                            : 'hover:bg-white/10 text-slate-300 hover:text-white'
                        }`}
                    >
                        <ChefHat className="w-4 h-4" />
                        <span className="hidden sm:inline">متابعة المطبخ</span>
                        {activeKitchenOrdersList.filter(o => o.fulfillmentStatus === 'pending').length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white w-4.5 h-4.5 rounded-full text-[9px] font-black flex items-center justify-center animate-bounce border border-slate-900">
                                {activeKitchenOrdersList.filter(o => o.fulfillmentStatus === 'pending').length}
                            </span>
                        )}
                    </button>

                    <button 
                        onClick={() => { setActiveTab('menu_explorer'); setSelectedTable(null); }}
                        className={`px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 transition-all ${
                            activeTab === 'menu_explorer' 
                            ? 'bg-amber-400 text-slate-900 shadow-md scale-102' 
                            : 'hover:bg-white/10 text-slate-300 hover:text-white'
                        }`}
                    >
                        <BookOpen className="w-4 h-4" />
                        <span className="hidden sm:inline">تصفح المنيو</span>
                    </button>
                </div>
            </div>

            {/* MAIN CONTAINER */}
            <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col p-4 md:p-6 overflow-hidden">
                
                {/* CASE A: No table selected and we are in Tables tab */}
                {activeTab === 'tables' && !selectedTable && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        
                        {/* Statistics Metrics Panel */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-4.5">
                                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                                    <Armchair className="w-6 h-6" />
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400 font-bold">إجمالي الطاولات</p>
                                    <h3 className="text-xl font-black text-slate-800 font-sans tracking-tight mt-0.5">{stats.total} طاولات</h3>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-4.5">
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping absolute" />
                                    <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full relative" />
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400 font-bold">المتاحة للجلوس</p>
                                    <h3 className="text-xl font-black text-emerald-700 font-sans tracking-tight mt-0.5">{stats.available} طاولات</h3>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-4.5">
                                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                                    <div className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400 font-bold">المشغولة الآن</p>
                                    <h3 className="text-xl font-black text-rose-700 font-sans tracking-tight mt-0.5">{stats.occupied} طاولات</h3>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-4.5">
                                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                                    <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400 font-bold">تطلب الحساب</p>
                                    <h3 className="text-xl font-black text-amber-700 font-sans tracking-tight mt-0.5">{stats.billing} طاولات</h3>
                                </div>
                            </div>
                        </div>

                        {/* Search & Advanced Filters */}
                        <div className="bg-white rounded-3xl border border-slate-100 p-4.5 shadow-sm space-y-4">
                            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                <div className="relative w-full md:max-w-md">
                                    <input 
                                        type="text"
                                        placeholder="ابحث عن رقم الطاولة أو منطقتها..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 pb-3 pr-11 font-bold text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                        value={tableSearchQuery}
                                        onChange={(e) => setTableSearchQuery(e.target.value)}
                                    />
                                    <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5" />
                                    {tableSearchQuery && (
                                        <button 
                                            onClick={() => setTableSearchQuery('')}
                                            className="absolute left-3.5 top-3.5 p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                <div className="flex gap-2 flex-wrap items-center">
                                    {/* Status Filter */}
                                    <span className="text-xs font-black text-slate-400 flex items-center gap-1">
                                        <Filter className="w-3.5 h-3.5" />
                                        تصفية الحالة:
                                    </span>
                                    {['all', 'available', 'occupied', 'requesting_bill'].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setStatusFilter(s)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                                statusFilter === s
                                                ? 'bg-slate-800 border-slate-800 text-white shadow-sm'
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                            }`}
                                        >
                                            {s === 'all' ? 'الكل' :
                                             s === 'available' ? 'الفارغة' :
                                             s === 'occupied' ? 'المشغولة' : 'تطلب الحساب'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Zone selection filter */}
                            <div className="flex gap-1.5 items-center overflow-x-auto py-1 scrollbar-none border-t border-slate-100 pt-3">
                                <span className="text-xs font-black text-slate-400 flex items-center gap-1 pl-2 shrink-0">
                                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                                    المناطق:
                                </span>
                                <button
                                    onClick={() => setZoneFilter('all')}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border ${
                                        zoneFilter === 'all'
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                        : 'bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 border-indigo-100/60'
                                    }`}
                                >
                                    كافة المناطق والصالات ({tables.length})
                                </button>
                                {uniqueZones.map((zone) => (
                                    <button
                                        key={zone}
                                        onClick={() => setZoneFilter(zone)}
                                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border ${
                                            zoneFilter === zone
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        {zone} ({tables.filter(t => t.zone === zone).length})
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* EMPTY STATE OR SEED ONBOARDING */}
                        {tables.length === 0 ? (
                            <div className="bg-white rounded-[32px] border border-slate-200/60 p-12 shadow-md text-center max-w-2xl mx-auto flex flex-col items-center justify-center space-y-6">
                                <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center border border-amber-100 text-amber-500 animate-pulse">
                                    <Armchair className="w-12 h-12" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-slate-800">قائمة الطاولات فارغة تماماً</h3>
                                    <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                                        لم يتم العثور على أي طاولات مطعم مهيأة في قاعدة البيانات المحلية الخاصة بك. يمكنك تهيئة 12 طاولة نموذجية موزعة ومصنفة لتجربة التطبيق فوراً.
                                    </p>
                                </div>
                                <button
                                    onClick={handleSeedData}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-8 py-3.5 rounded-2xl flex items-center gap-2.5 transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
                                >
                                    <Sparkles className="w-5 h-5 text-amber-300" />
                                    <span>تهيئة الطاولات والمواد الافتراضية الآن</span>
                                </button>
                                <p className="text-[10px] text-slate-400 font-bold">هذا الإجراء آمن وسيقوم بإدخال الطاولات والمنيو تلقائياً إلى قاعدة البيانات المحلية.</p>
                            </div>
                        ) : (
                            /* CARD GRID */
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {filteredTables.map(table => {
                                    const activeOrder = tableOrdersMap[table.name];
                                    const hasDraft = !!activeOrder;
                                    
                                    let statusColor = "border-slate-100 hover:border-indigo-200 bg-white";
                                    let statusDot = "bg-slate-300";
                                    let statusBadge = "متاحة";
                                    let badgeStyle = "bg-slate-100 text-slate-600";

                                    if (table.status === 'occupied') {
                                        statusColor = "border-red-200 shadow-sm bg-red-50/15";
                                        statusDot = "bg-red-500";
                                        statusBadge = "مشغولة";
                                        badgeStyle = "bg-rose-100 text-rose-800";
                                    } else if (table.status === 'requesting_bill') {
                                        statusColor = "border-amber-200 shadow-sm bg-amber-50/15 animate-pulse";
                                        statusDot = "bg-amber-500";
                                        statusBadge = "تطلب الفاتورة";
                                        badgeStyle = "bg-amber-100 text-amber-800";
                                    } else if (table.status === 'reserved') {
                                        statusColor = "border-orange-200 bg-orange-50/10";
                                        statusDot = "bg-orange-500";
                                        statusBadge = "محجوزة";
                                        badgeStyle = "bg-orange-100 text-orange-800";
                                    }

                                    return (
                                        <div
                                            key={table.id}
                                            className={`rounded-2xl border-2 p-5 flex flex-col justify-between min-h-[170px] relative transition-all group ${statusColor}`}
                                        >
                                            {/* Header */}
                                            <div className="flex items-start justify-between">
                                                <span className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg font-bold border border-slate-200/40">
                                                    {table.zone || 'الصالة الرئيسية'}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {table.seats || 4} كراسي
                                                </span>
                                            </div>

                                            {/* Table Name */}
                                            <div className="my-4">
                                                <h3 className="font-black text-slate-800 text-xl tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
                                                    {table.name}
                                                </h3>
                                                {(table.status === 'occupied' || table.status === 'requesting_bill') && (
                                                    <p className="text-[10px] text-rose-600 font-bold mt-1.5 flex items-center gap-1.5 justify-start bg-rose-50/60 py-1 px-2.5 rounded-lg border border-rose-100/40 w-fit">
                                                        <Clock className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                                                        <span>وقت الجلوس: </span>
                                                        <span className="font-sans font-extrabold text-rose-700">{getElapsedStr(table.reservedAt || activeOrder?.date)}</span>
                                                    </p>
                                                )}
                                            </div>

                                            {/* Bottom Details */}
                                            <div className="border-t border-slate-50 pt-3.5 flex items-center justify-between">
                                                <span className="flex items-center gap-1.5">
                                                    <div className={`w-2.2 h-2.2 rounded-full ${statusDot}`} />
                                                    <span className="text-xs font-black text-slate-600">{statusBadge}</span>
                                                </span>

                                                {hasDraft ? (
                                                    <span className="text-sm font-extrabold text-indigo-600 font-sans tracking-tight">
                                                        {activeOrder.totalAmount?.toLocaleString()} د.ع
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400 font-bold">فارغة</span>
                                                )}
                                            </div>

                                            {/* Hover Action Overlays / Click Action trigger */}
                                            <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur-sm rounded-xl py-2 px-1 flex justify-center gap-1.5 border border-slate-100 shadow-lg">
                                                <button
                                                    onClick={() => handleSelectTable(table)}
                                                    className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 text-[10px] font-black py-2 px-2.5 rounded-lg flex items-center justify-center gap-1 shadow-sm shadow-indigo-600/10"
                                                >
                                                    <PlusCircle className="w-3.5 h-3.5" />
                                                    <span>{hasDraft ? 'تعديل وطلب' : 'طلب جديد'}</span>
                                                </button>

                                                {hasDraft && (
                                                    <button
                                                        onClick={() => { setFocusedTable(table); setShowTableOptions(true); }}
                                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1"
                                                    >
                                                        <SlidersHorizontal className="w-3.5 h-3.5" />
                                                        <span>إدارة</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* MODAL SYSTEM: Table Actions Drawer */}
                {showTableOptions && focusedTable && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl p-6 max-w-lg w-full animate-in zoom-in-95 duration-200">
                            
                            {/* Modal Header */}
                            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                                <div className="text-right">
                                    <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-md font-bold text-center">
                                         طاولات صالة صالتك
                                    </span>
                                    <h3 className="text-xl font-black text-slate-800 leading-tight mt-1">{focusedTable.name}</h3>
                                </div>
                                <button
                                    onClick={() => { setShowTableOptions(false); setFocusedTable(null); }}
                                    className="w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Tabs Switcher */}
                            <div className="flex border-b border-slate-100 my-4">
                                <button
                                    onClick={() => setSelectedModalTab('controls')}
                                    className={`flex-1 pb-3 text-xs font-black transition-all border-b-2 text-center flex items-center justify-center gap-1.5 ${
                                        selectedModalTab === 'controls' 
                                        ? 'border-indigo-600 text-indigo-600 font-black' 
                                        : 'border-transparent text-slate-400 hover:text-slate-600 font-bold'
                                    }`}
                                >
                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                    <span>التحكم ووقت الجلوس الحالي</span>
                                </button>
                                <button
                                    onClick={() => setSelectedModalTab('history')}
                                    className={`flex-1 pb-3 text-xs font-black transition-all border-b-2 text-center flex items-center justify-center gap-1.5 ${
                                        selectedModalTab === 'history' 
                                        ? 'border-indigo-600 text-indigo-600 font-black' 
                                        : 'border-transparent text-slate-400 hover:text-slate-600 font-bold'
                                    }`}
                                >
                                    <BookOpen className="w-3.5 h-3.5" />
                                    <span>سجل الزيارات والطلبات ({tablePastOrders.length})</span>
                                </button>
                            </div>

                            {/* TAB 1: CONTROLS & SEATING SESSION TRACKER */}
                            {selectedModalTab === 'controls' && (
                                <div className="space-y-4 animate-in fade-in duration-200">
                                    
                                    {/* Seating detail & stats block */}
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3.5">
                                        
                                        <div className="flex items-center justify-between pb-1">
                                            <span className="text-xs font-bold text-slate-550">الحالة حالياً:</span>
                                            <span className={`text-xs font-black px-2.5 py-1 rounded-md flex items-center gap-1.5 ${
                                                focusedTable.status === 'occupied' 
                                                ? 'bg-rose-50 text-rose-700' 
                                                : focusedTable.status === 'requesting_bill'
                                                ? 'bg-amber-50 text-amber-800 animate-pulse'
                                                : 'bg-emerald-50 text-emerald-700'
                                            }`}>
                                                <span className={`w-2 h-2 rounded-full ${
                                                    focusedTable.status === 'occupied' ? 'bg-rose-500' : 
                                                    focusedTable.status === 'requesting_bill' ? 'bg-amber-500' : 'bg-emerald-500'
                                                }`} />
                                                {focusedTable.status === 'occupied' ? 'مشغولة بالخدمة' :
                                                 focusedTable.status === 'requesting_bill' ? 'تطلب الفاتورة (قيد الحساب)' : 'متاحة وفارغة'}
                                            </span>
                                        </div>

                                        {/* Sitting Timer Gauge */}
                                        <div className="bg-white border border-slate-200/60 p-3 rounded-xl flex items-center gap-3 shadow-none">
                                            <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 border ${
                                                getDurationBadgeColor(focusedTable.reservedAt || tableOrdersMap[focusedTable.name]?.date).bgIcon
                                            }`}>
                                                <Clock className={`w-5 h-5 ${getDurationBadgeColor(focusedTable.reservedAt || tableOrdersMap[focusedTable.name]?.date).textIcon}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] text-slate-400 font-extrabold pb-0.5">مدة الجلوس المستمرة للزبون</p>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <h4 className="text-base font-black text-slate-800 tracking-tight font-sans leading-none">
                                                        {focusedTable.status === 'occupied' || focusedTable.status === 'requesting_bill' ? (
                                                            getElapsedStr(focusedTable.reservedAt || tableOrdersMap[focusedTable.name]?.date)
                                                        ) : 'الطاولة فارغة'}
                                                    </h4>
                                                    {(focusedTable.status === 'occupied' || focusedTable.status === 'requesting_bill') && (
                                                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                                            getDurationBadgeColor(focusedTable.reservedAt || tableOrdersMap[focusedTable.name]?.date).badgeBgText
                                                        }`}>
                                                            {getDurationBadgeColor(focusedTable.reservedAt || tableOrdersMap[focusedTable.name]?.date).label}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Time stamps & active orders */}
                                        <div className="grid grid-cols-2 gap-2 border-t border-slate-200/40 pt-3">
                                            <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                                                <p className="text-[9px] text-slate-400 font-bold">توقيت الدخول وحجز الجلسة</p>
                                                <p className="text-xs font-black text-slate-700 font-sans tracking-tight mt-0.5">
                                                    {focusedTable.status === 'occupied' || focusedTable.status === 'requesting_bill' ? (
                                                        formatOrderTime(focusedTable.reservedAt || tableOrdersMap[focusedTable.name]?.date)
                                                    ) : '--:--'}
                                                </p>
                                            </div>
                                            <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                                                <p className="text-[9px] text-slate-400 font-bold">مجموع الفاتورة النشطة حالياً</p>
                                                <p className="text-xs font-black text-indigo-600 font-sans tracking-tight mt-0.5">
                                                    {tableOrdersMap[focusedTable.name]?.totalAmount ? (
                                                        `${tableOrdersMap[focusedTable.name].totalAmount.toLocaleString()} د.ع`
                                                    ) : '0 د.ع'}
                                                </p>
                                            </div>
                                        </div>

                                        {tableOrdersMap[focusedTable.name] && (
                                            <div className="bg-indigo-50/20 border border-indigo-100/45 p-2.5 rounded-xl flex items-center justify-between text-xs">
                                                <span className="font-bold text-slate-500">أصناف الفاتورة النشطة:</span>
                                                <span className="font-black text-indigo-700">{tableOrdersMap[focusedTable.name].items?.length || 0} مواد مغذية بالطلب</span>
                                            </div>
                                        )}

                                        {/* Splitting module inside the Controls tab */}
                                        {focusedTable.status !== 'available' && tableOrdersMap[focusedTable.name] && (
                                            <div className="border-t border-slate-200/50 pt-3 shadow-none">
                                                {splittingMode === 'none' ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSplittingMode('equal')}
                                                        className="w-full bg-indigo-50/60 hover:bg-indigo-100/70 text-indigo-700 border border-indigo-100/70 font-extrabold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors"
                                                    >
                                                        <ArrowLeftRight className="w-4 h-4 text-indigo-600 animate-pulse" />
                                                        <span>تقسيم وتجزئة الفاتورة الحالية</span>
                                                    </button>
                                                ) : (
                                                    <div className="bg-white border border-indigo-150 p-3.5 rounded-xl space-y-3">
                                                        <div className="flex items-center justify-between border-b border-indigo-50 pb-2">
                                                            <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5 font-sans">
                                                                <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />
                                                                أدوات تقسيم الحساب
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => { setSplittingMode('none'); setSelectedSplitItems({}); }}
                                                                className="text-[10px] text-rose-600 hover:text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded transition-colors"
                                                            >
                                                                إلغاء التجزئة
                                                            </button>
                                                        </div>

                                                        {/* Segmented control for splitting style */}
                                                        <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100 rounded-lg">
                                                            <button
                                                                type="button"
                                                                onClick={() => { setSplittingMode('equal'); setSelectedSplitItems({}); }}
                                                                className={`py-1 text-[10px] font-black rounded-md transition-all text-center ${
                                                                    splittingMode === 'equal'
                                                                    ? 'bg-white text-indigo-700 shadow-xs'
                                                                    : 'text-slate-500 hover:text-slate-700'
                                                                }`}
                                                            >
                                                                تقسيم بالتساوي (حصص)
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => { setSplittingMode('items'); setSelectedSplitItems({}); }}
                                                                className={`py-1 text-[10px] font-black rounded-md transition-all text-center ${
                                                                    splittingMode === 'items'
                                                                    ? 'bg-white text-indigo-700 shadow-xs'
                                                                    : 'text-slate-500 hover:text-slate-700'
                                                                }`}
                                                            >
                                                                تقسيم بالأصناف (انتقائي)
                                                            </button>
                                                        </div>

                                                        {/* Choose payment method */}
                                                        <div className="flex items-center justify-between py-1 border-b border-slate-100">
                                                            <span className="text-[10px] font-bold text-slate-500">طريقة الدفع الحالية:</span>
                                                            <div className="flex gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSplitPaymentMethod('cash')}
                                                                    className={`px-2 py-0.5 text-[9px] font-black rounded transition-all ${
                                                                        splitPaymentMethod === 'cash' 
                                                                        ? 'bg-emerald-600 text-white font-black' 
                                                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                                    }`}
                                                                >
                                                                    نقدي (كاش)
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSplitPaymentMethod('card')}
                                                                    className={`px-2 py-0.5 text-[9px] font-black rounded transition-all ${
                                                                        splitPaymentMethod === 'card' 
                                                                        ? 'bg-blue-600 text-white font-black' 
                                                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                                    }`}
                                                                >
                                                                    بطاقة (شبكة)
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {splittingMode === 'equal' ? (
                                                            <div className="space-y-2.5 pt-1 animate-in fade-in duration-200">
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span className="text-[10px] text-slate-550 font-bold">عدد الزبائن (المقسوم عليهم):</span>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setSplitPeopleCount(prev => Math.max(2, prev - 1))}
                                                                            className="w-5.5 h-5.5 border border-slate-200 hover:bg-slate-50 rounded flex items-center justify-center font-sans font-black text-slate-650 text-[11px]"
                                                                        >
                                                                            -
                                                                        </button>
                                                                        <span className="font-sans font-black text-xs text-slate-800 w-4.5 text-center">{splitPeopleCount}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setSplitPeopleCount(prev => Math.min(12, prev + 1))}
                                                                            className="w-5.5 h-5.5 border border-slate-200 hover:bg-slate-50 rounded flex items-center justify-center font-sans font-black text-slate-650 text-[11px]"
                                                                        >
                                                                            +
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex justify-between items-center gap-2">
                                                                    <div className="space-y-0.5">
                                                                        <p className="text-[9px] text-slate-400 font-bold">مبلغ الحصة الفردية:</p>
                                                                        <p className="text-[13px] font-black text-indigo-600 font-sans tracking-tight leading-none">
                                                                            {Math.round(tableOrdersMap[focusedTable.name].totalAmount / splitPeopleCount).toLocaleString()} د.ع
                                                                        </p>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => payEqualShare(focusedTable, tableOrdersMap[focusedTable.name].totalAmount, splitPeopleCount)}
                                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black py-1.5 px-3 rounded-lg transition-all shadow-md shadow-emerald-600/15"
                                                                    >
                                                                        تسديد حصة
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                                                                <p className="text-[9px] text-slate-400 font-bold pb-1 text-right">حدد الكميات التي يدفعها العميل الحالي:</p>
                                                                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                                                                    {tableOrdersMap[focusedTable.name].items?.map((item, idx) => {
                                                                        const selectedQty = selectedSplitItems[idx] || 0;
                                                                        return (
                                                                            <div key={idx} className="bg-slate-50 border border-slate-100/70 p-1.5 rounded-lg flex items-center justify-between">
                                                                                <div className="space-y-0.5 min-w-0 flex-1 pl-1.5 text-right">
                                                                                    <h5 className="text-[10px] font-black text-slate-800 truncate">{item.name}</h5>
                                                                                    <p className="text-[8px] font-bold text-slate-400 font-sans">{(item.price || 0).toLocaleString()} د.ع | المجموع: {(item.total || 0).toLocaleString()} د.ع</p>
                                                                                </div>
                                                                                
                                                                                <div className="flex items-center gap-1 shrink-0 flex-row-reverse">
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => setSelectedSplitItems(prev => {
                                                                                            const curr = prev[idx] || 0;
                                                                                            if (curr <= 0) return prev;
                                                                                            const next = { ...prev };
                                                                                            next[idx] = curr - 1;
                                                                                            return next;
                                                                                        })}
                                                                                        className="w-4.5 h-4.5 border border-slate-200 hover:bg-white text-slate-650 rounded flex items-center justify-center font-sans font-black text-[9px]"
                                                                                    >
                                                                                        -
                                                                                    </button>
                                                                                    <span className="font-sans font-black text-[10px] text-slate-800 w-4.5 text-center">
                                                                                        {selectedQty} / {item.quantity}
                                                                                    </span>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => setSelectedSplitItems(prev => {
                                                                                            const curr = prev[idx] || 0;
                                                                                            if (curr >= item.quantity) return prev;
                                                                                            return { ...prev, [idx]: curr + 1 };
                                                                                        })}
                                                                                        className="w-4.5 h-4.5 border border-slate-200 hover:bg-white text-slate-650 rounded flex items-center justify-center font-sans font-black text-[9px]"
                                                                                    >
                                                                                        +
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>

                                                                {(() => {
                                                                    const activeItems = tableOrdersMap[focusedTable.name].items || [];
                                                                    const splitSum = activeItems.reduce((sum, item, idx) => sum + (item.price * (selectedSplitItems[idx] || 0)), 0);
                                                                    return (
                                                                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-150 flex justify-between items-center gap-2 mt-1">
                                                                            <div className="space-y-0.5 text-right">
                                                                                <p className="text-[8px] text-slate-450 font-bold">مجموع الفاتورة الفرعية الحالية:</p>
                                                                                <p className="text-xs font-black text-indigo-700 font-sans tracking-tight leading-none mt-0.5">
                                                                                    {splitSum.toLocaleString()} د.ع
                                                                                </p>
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                disabled={splitSum === 0}
                                                                                onClick={() => payItemSplit(focusedTable)}
                                                                                className={`text-[10px] font-black py-1.5 px-3 rounded-lg transition-all ${
                                                                                    splitSum > 0
                                                                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-600/15'
                                                                                    : 'bg-slate-100 text-slate-350 cursor-not-allowed'
                                                                                }`}
                                                                            >
                                                                                تسديد الأصناف المختارة
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action operations buttons */}
                                    <div className="space-y-2 pt-1">
                                        <button
                                            onClick={() => {
                                                handleSelectTable(focusedTable);
                                                setShowTableOptions(false);
                                            }}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm shadow-md shadow-indigo-600/10"
                                        >
                                            <PlusCircle className="w-4 h-4 text-amber-300" />
                                            <span>تعديل الطلب وإضافة وجبات ومشاريب جديدة</span>
                                        </button>

                                        {focusedTable.status !== 'requesting_bill' && (
                                            <button
                                                onClick={() => requestBill(focusedTable)}
                                                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors"
                                            >
                                                <Coins className="w-4 h-4" />
                                                <span>إرسال طلب الحساب (طباعة الفاتورة للزبون)</span>
                                            </button>
                                        )}

                                        <button
                                            onClick={() => freeTable(focusedTable)}
                                            className="w-full bg-rose-50 hover:bg-rose-100 text-red-700 font-extrabold py-3 px-4 rounded-xl border border-red-200 flex items-center justify-center gap-2 text-sm transition-all"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            <span>إخلاء وتحرير الطاولة فوراً (تسديد الحساب)</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: HISTORIC TABLE ORDERS LOG */}
                            {selectedModalTab === 'history' && (
                                <div className="space-y-4 animate-in fade-in duration-200">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black text-slate-500">الزيارات والفواتير السابقة للطاولة</span>
                                        <span className="text-[10px] text-slate-400">مرتبة من الأحدث للأقدم</span>
                                    </div>

                                    {tablePastOrders.length === 0 ? (
                                        <div className="py-12 border border-dashed border-slate-200 rounded-2xl text-center space-y-3">
                                            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                                                <BookOpen className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h5 className="text-xs font-black text-slate-700">لا توجد زيارات سابقة مسجلة</h5>
                                                <p className="text-[10px] text-slate-400 mt-1 max-w-[220px] mx-auto leading-relaxed">سيظهر سجل استهلاك هذه الطاولة هنا بمجرد إخلاء وتحرير الجلسات المكتملة.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                                            {tablePastOrders.map((order) => {
                                                const isExpanded = expandedOrderId === order.id;
                                                return (
                                                    <div key={order.id} className="bg-slate-50 border border-slate-200/50 rounded-xl overflow-hidden transition-all">
                                                        {/* Summary header */}
                                                        <div 
                                                            onClick={() => setExpandedOrderId(isExpanded ? null : (order.id || null))}
                                                            className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors"
                                                        >
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-bold text-slate-800 font-sans tracking-tight">
                                                                        {order.referenceNumber || `#POS-${order.id}`}
                                                                    </span>
                                                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                                                        order.status === 'completed'
                                                                        ? 'bg-emerald-100 text-emerald-800'
                                                                        : order.status === 'cancelled'
                                                                        ? 'bg-rose-100 text-rose-800'
                                                                        : 'bg-amber-100 text-amber-800'
                                                                    }`}>
                                                                        {order.status === 'completed' ? 'تم تحصيل الحساب' :
                                                                         order.status === 'cancelled' ? 'ملغي' : 'مستحق'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                                                    <Clock className="w-3 h-3 text-slate-450" />
                                                                    <span>{new Date(order.date).toLocaleDateString('ar-IQ')}</span>
                                                                    <span>-</span>
                                                                    <span>{new Date(order.date).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</span>
                                                                </p>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <div className="text-left font-sans text-xs">
                                                                    <p className="font-black text-slate-800">{(order.totalAmount || 0).toLocaleString()} د.ع</p>
                                                                    <p className="text-[9px] text-slate-450 font-bold">{order.items?.length || 0} مواد</p>
                                                                </div>
                                                                <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-450">
                                                                    {isExpanded ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Collapsible detail box */}
                                                        {isExpanded && (
                                                            <div className="border-t border-slate-200/50 bg-white p-3 space-y-2 animate-in slide-in-from-top-1 duration-150">
                                                                <p className="text-[10px] text-slate-400 font-black border-b border-slate-100 pb-1.5">مكونات الطلب بالتفصيل:</p>
                                                                <div className="space-y-2">
                                                                    {order.items?.map((item, idx) => (
                                                                        <div key={idx} className="flex justify-between items-center text-xs">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <span className="w-4.5 h-4.5 rounded bg-slate-100 text-slate-700 font-sans font-black flex items-center justify-center text-[10px]">
                                                                                    {item.quantity}x
                                                                                </span>
                                                                                <span className="font-extrabold text-slate-700">{item.name}</span>
                                                                            </div>
                                                                            <span className="font-bold text-slate-500 font-sans tracking-tight">
                                                                                {(item.price * item.quantity).toLocaleString()} د.ع
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                {order.cashierName && (
                                                                    <div className="border-t border-slate-100 pt-2 mt-2 flex items-center justify-between text-[10px] font-bold text-slate-400">
                                                                        <span>أمين الصندوق:</span>
                                                                        <span>{order.cashierName}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                )}

                {/* CASE B: ACTIVE MENU ORDER PLACEMENT FLOW */}
                {selectedTable && (
                    <div className="flex-1 bg-white rounded-3xl border border-slate-200/50 shadow-lg overflow-hidden flex flex-col lg:flex-row h-[78vh] animate-in slide-in-from-bottom duration-300 relative">
                        
                        {/* Products / Search Left side (or Categories side) */}
                        <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
                            
                            {/* Product Menu Header Info */}
                            <div className="bg-white p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => { setSelectedTable(null); setCart([]); }}
                                        className="w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center transition-colors shadow-xs"
                                        title="الرجوع لقائمة الطاولات"
                                    >
                                        <ChevronRight className="w-5 h-5 rtl:hidden" />
                                        <ChevronLeft className="w-5 h-5 ltr:hidden" style={{ transform: 'scaleX(-1)' }} />
                                    </button>
                                    <div>
                                        <h2 className="text-base md:text-lg font-black text-slate-800 flex items-center gap-1.5 leading-none">
                                            طاولة {selectedTable.name}
                                            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                                                {selectedTable.zone} • {selectedTable.seats} مقاعد
                                            </span>
                                        </h2>
                                        <p className="text-[10px] text-slate-400 font-bold mt-1">اختر الأصناف اللذيذة لإضافتها لطلب الطاولة</p>
                                    </div>
                                </div>

                                {/* Menu search query bar */}
                                <div className="relative w-full sm:max-w-[240px]">
                                    <input 
                                        type="text" 
                                        placeholder="ابحث عن وجبة أو شراب..."
                                        className="w-full bg-slate-100 border border-slate-200/80 rounded-xl pl-8 pr-4 py-2 pb-2 font-bold text-xs focus:ring-1 focus:ring-indigo-500 focus:bg-white outline-none"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                                    {searchQuery && (
                                        <button 
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-2.5 top-2.5 p-0.5 hover:bg-slate-200 rounded text-slate-400"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Category selector slides */}
                            <div className="bg-slate-100/55 p-3 flex gap-2 items-center overflow-x-auto scrollbar-none shrink-0 border-b border-slate-100">
                                <button
                                    onClick={() => setSelectedCategory('all')}
                                    className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all shadow-xs flex items-center gap-1.5 ${
                                        selectedCategory === 'all'
                                        ? 'bg-slate-850 text-white'
                                        : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
                                    }`}
                                >
                                    <span>🍽️ الكل</span>
                                    <span className="text-[9px] px-1.5 py-0.5 bg-black/10 rounded-full font-sans">{products.length}</span>
                                </button>
                                {categories.map(cat => {
                                    const catProdCount = products.filter(p => p.category === cat.name).length;
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat.name)}
                                            className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all shadow-xs flex items-center gap-1.5 ${
                                                selectedCategory === cat.name
                                                ? 'bg-slate-850 text-white animate-in zoom-in-95 duration-100'
                                                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
                                            }`}
                                        >
                                            <span>{getCategoryIcon(cat.name)} {cat.name}</span>
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-sans ${selectedCategory === cat.name ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                                                {catProdCount}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Products Grid list */}
                            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-slate-50 align-top content-start pb-12">
                                {filteredProducts.length === 0 ? (
                                    <div className="col-span-full py-16 text-center flex flex-col items-center justify-center text-slate-400 space-y-2">
                                        <Utensils className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                                        <p className="text-sm font-extrabold text-slate-600">لا يوجد وجبات مطابقة للبحث حالياً</p>
                                        <p className="text-xs text-slate-400">تأكد من اختيار الفئة الصحيحة أو كتابة الكلمات المفاتيحية للطلب.</p>
                                    </div>
                                ) : (
                                    filteredProducts.map(product => {
                                        const cartItem = cart.find(item => item.productId === product.id);
                                        const countInCart = cartItem ? cartItem.quantity : 0;
                                        
                                        return (
                                            <button
                                                key={product.id}
                                                onClick={() => addToCart(product)}
                                                className={`bg-white p-3 rounded-2xl border-2 shadow-xs hover:shadow-md hover:border-indigo-400 transition-all text-right flex flex-col justify-between relative group ${
                                                    countInCart > 0 ? 'border-indigo-500/80 ring-2 ring-indigo-500/5 shadow-sm' : 'border-slate-100'
                                                }`}
                                            >
                                                {/* Category mini badge */}
                                                <span className="text-[9px] bg-slate-100 text-slate-500 rounded px-1.5 py-0.5 font-bold self-start mb-2">
                                                    {product.category}
                                                </span>

                                                {/* Dish Item name */}
                                                <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors mb-4">
                                                    {product.name}
                                                </h3>

                                                {/* Price block */}
                                                <div className="flex items-end justify-between border-t border-slate-50/80 pt-2 shrink-0">
                                                    <span className="text-xs font-black text-indigo-600 font-sans tracking-tight">
                                                        {product.price.toLocaleString()} د.ع
                                                    </span>
                                                    <div className="w-6.5 h-6.5 bg-indigo-50 text-indigo-700 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                        <Plus className="w-4 h-4 stroke-[2.5]" />
                                                    </div>
                                                </div>

                                                {/* Floating Counter Badge */}
                                                {countInCart > 0 && (
                                                    <span className="absolute -top-1.5 -left-1.5 bg-indigo-600 text-white w-5.5 h-5.5 rounded-full text-xs font-bold font-sans flex items-center justify-center border-2 border-white shadow-sm">
                                                        {countInCart}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Cart Sidebar Details Panel */}
                        <div className="w-full lg:w-[360px] bg-white border-t lg:border-t-0 lg:border-r border-slate-200 shrink-0 flex flex-col h-[48vh] lg:h-full relative overflow-hidden z-20 shadow-[0_-12px_42px_rgba(0,0,0,0.06)]">
                            {/* Sidebar Header */}
                            <div className="p-4 border-b border-slate-100 bg-slate-50/60 hidden lg:flex items-center justify-between">
                                <h3 className="font-black text-slate-800 flex items-center gap-2">
                                    <ShoppingBag className="w-5 h-5 text-indigo-600" />
                                    الأصناف المضافة للطلب
                                </h3>
                                <span className="text-[10px] bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full font-black">
                                    {cart.length} وجبات
                                </span>
                            </div>

                            {/* Cart List of Items */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {cart.length === 0 ? (
                                    <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400 space-y-3 h-full">
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                                            <ShoppingBag className="w-7 h-7" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-extrabold text-slate-700">سلة الطلبات فارغة</p>
                                            <p className="text-xs text-slate-400 mt-1 max-w-[210px] mx-auto leading-relaxed">قم بإضافة الأطباق والمشروبات اللذيذة من المنيو بالجانب!</p>
                                        </div>
                                    </div>
                                ) : (
                                    cart.map(item => (
                                        <div 
                                            key={item.productId} 
                                            className="bg-white border border-slate-150 p-3 rounded-2xl shadow-xs space-y-2 flex flex-col transition-all hover:shadow-xs group"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm truncate leading-tight">
                                                        {item.name}
                                                    </h4>
                                                    <span className="text-indigo-600 font-extrabold text-xs font-sans mt-1 block">
                                                        {(item.price * item.quantity).toLocaleString()} د.ع
                                                    </span>
                                                </div>
                                                <button 
                                                    onClick={() => updateQuantity(item.productId, -999)}
                                                    className="w-7 h-7 bg-red-50 text-red-600 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="إزالة الوجبة"
                                                >
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Note Block editable */}
                                            <div className="bg-slate-50 rounded-xl p-2 border border-slate-100 flex items-center justify-between text-[11px] gap-2">
                                                {editingNoteItemId === item.productId ? (
                                                    <div className="flex items-center gap-1.5 w-full">
                                                        <input 
                                                            type="text"
                                                            placeholder="ملاحظات الطباخ..."
                                                            className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-700 text-[10px] outline-none"
                                                            value={tempItemNote}
                                                            onChange={(e) => setTempItemNote(e.target.value)}
                                                            autoFocus
                                                        />
                                                        <button 
                                                            onClick={() => handleSaveItemNote(item.productId)}
                                                            className="bg-indigo-600 text-white px-2 py-1 rounded-lg font-black text-[9px]"
                                                        >
                                                            حفظ
                                                        </button>
                                                        <button 
                                                            onClick={() => setEditingNoteItemId(null)}
                                                            className="text-slate-500"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p className="text-slate-500 font-medium truncate flex-1 pl-1">
                                                            {item.note ? `الملاحظة: ${item.note}` : "لا يوجد تخصيص أو ملاحظة طباخ"}
                                                        </p>
                                                        <button 
                                                            onClick={() => startEditingNote(item)}
                                                            className="text-indigo-600 hover:text-indigo-800 font-black shrink-0 text-[10px]"
                                                        >
                                                            {item.note ? 'تعديل' : 'إضافة ملاحظة'}
                                                        </button>
                                                    </>
                                                )}
                                            </div>

                                            {/* Counter Buttons */}
                                            <div className="flex items-center justify-between border-t border-slate-50 pt-2 shadow-none">
                                                <span className="text-[10px] text-slate-400 font-bold">الكمية:</span>
                                                <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-xl border border-slate-200/40 shrink-0">
                                                    <button 
                                                        onClick={() => updateQuantity(item.productId, -1)} 
                                                        className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-xs text-slate-600 hover:text-red-500 hover:bg-slate-50 active:scale-95"
                                                    >
                                                        {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-red-500" /> : <Minus className="w-3.5 h-3.5" />}
                                                    </button>
                                                    <span className="w-7 text-center font-black text-xs sm:text-sm font-sans">{item.quantity}</span>
                                                    <button 
                                                        onClick={() => updateQuantity(item.productId, 1)} 
                                                        className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-xs text-slate-600 hover:text-indigo-600 hover:bg-slate-50 active:scale-95"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Sidebar Footer checkout actions */}
                            <div className="p-4 bg-white border-t border-slate-100 shadow-[0_-5px_15px_rgba(0,0,0,0.03)] shrink-0">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-slate-500 font-black text-sm">المجموع الكلي للطاولة</span>
                                    <span className="text-xl lg:text-2xl font-black text-indigo-700 font-sans tracking-tight">
                                        {cartTotal.toLocaleString()} د.ع
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2.5">
                                    <button 
                                        onClick={() => { setSelectedTable(null); setCart([]); }}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-black text-xs flex flex-col items-center justify-center gap-1 transition-colors"
                                    >
                                        <X className="w-4 h-4 text-slate-500" />
                                        <span>إلغاء والعودة</span>
                                    </button>
                                    <button 
                                        onClick={sendToKitchen}
                                        disabled={cart.length === 0}
                                        className={`py-3 rounded-xl font-black text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                                            cart.length > 0 
                                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 active:scale-[0.98]' 
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        }`}
                                    >
                                        <ChefHat className="w-4 h-4 text-amber-300" />
                                        <span>إرسال للتحضير (المطبخ)</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* CASE C: KITCHEN ORDER TRACKING AND STATUS MONITOR */}
                {activeTab === 'kitchen_status' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
                            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <ChefHat className="w-5 h-5 text-indigo-600 animate-bounce" />
                                <span>شاشة مراقبة طهي وتحضير الطلبات</span>
                            </h2>
                            <p className="text-slate-400 font-bold text-xs mt-1">تتبع كافّة طلبات صالتك الحالية التي يتم طبخها أو تم إشعار المطبخ بتجهيزها مباشرة.</p>
                        </div>

                        {activeKitchenOrdersList.length === 0 ? (
                            <div className="bg-white rounded-[32px] border border-slate-150 p-12 text-center max-w-xl mx-auto flex flex-col items-center justify-center space-y-5">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 border border-slate-100">
                                    <Clipboard className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800">لا يوجد طلبات نشطة حالياً</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed mt-1 max-w-sm mx-auto">عندما يقوم النوادل بإرسال الطلبات للتحضير، ستظهر حالاتها المباشرة كالتجهيز، التحضير والتسليم هنا.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
                                {activeKitchenOrdersList.map(order => {
                                    let statusBadge = "بانتظار التحضير";
                                    let statusColor = "bg-orange-50 text-orange-700 border-orange-100";
                                    
                                    if (order.fulfillmentStatus === 'preparing') {
                                        statusBadge = "يتم التحضير الآن";
                                        statusColor = "bg-indigo-50 text-indigo-700 border-indigo-100 animate-pulse";
                                    } else if (order.fulfillmentStatus === 'ready') {
                                        statusBadge = "جاهز للتسليم 😋";
                                        statusColor = "bg-emerald-50 text-emerald-700 border-emerald-100 font-extrabold";
                                    }

                                    return (
                                        <div key={order.id} className="bg-white rounded-2xl border border-slate-150 shadow-xs p-5 flex flex-col justify-between">
                                            {/* Header */}
                                            <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                                                <div>
                                                    <h3 className="font-extrabold text-slate-800 text-sm">
                                                        طاولة {order.tableNumber || 'سفري'}
                                                    </h3>
                                                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                                                        Ref: {order.referenceNumber}
                                                    </span>
                                                </div>
                                                <span className={`text-[10px] px-2.5 py-1 rounded-full font-black border ${statusColor}`}>
                                                    {statusBadge}
                                                </span>
                                            </div>

                                            {/* Items List */}
                                            <div className="py-3.5 space-y-1.5 flex-1 max-h-[160px] overflow-y-auto">
                                                {order.items?.map((item, idx) => (
                                                    <div key={idx} className="flex items-start justify-between text-xs gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-black text-slate-700 truncate">{item.name}</p>
                                                            {item.note && (
                                                                <p className="text-[10px] text-rose-500 font-black mt-0.5">⚠️ {item.note}</p>
                                                            )}
                                                        </div>
                                                        <span className="font-sans font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                                                            x{item.quantity}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Total and Date */}
                                            <div className="border-t border-slate-50 pt-3.5 flex items-center justify-between text-xs text-slate-400 font-bold shrink-0">
                                                <span>{new Date(order.date).toLocaleTimeString('ar-IQ')}</span>
                                                <span className="font-black text-indigo-600 font-sans">
                                                    إجمالي: {order.totalAmount?.toLocaleString()} د.ع
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* CASE D: STANDARD MENU EXPLORER FOR QUICK LOOKUPS */}
                {activeTab === 'menu_explorer' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Header card with summary metrics & Search bar */}
                        <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <BookOpen className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <span>قائمة المنيو العام واستعراض الأسعار</span>
                                </h2>
                                <p className="text-slate-400 font-bold text-xs">تصفّح الوجبات، المواد، والمشروبات المتاحة حالياً مع الأسعار المعتمدة دون الحاجة لحجز طاولة.</p>
                                
                                {/* Metrics Indicators */}
                                <div className="flex gap-4 pt-1.5 flex-wrap">
                                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-600">
                                        <span className="w-2 h-2 rounded-full bg-indigo-650" />
                                        <span>إجمالي الوجبات:</span>
                                        <span className="font-sans text-indigo-600 font-extrabold">{products.length}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-600">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span>عدد الفئات:</span>
                                        <span className="font-sans text-emerald-600 font-extrabold">{categories.length}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-600">
                                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                                        <span>المطابقة للبحث:</span>
                                        <span className="font-sans text-amber-600 font-extrabold">{filteredProducts.length}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Search bar inside header */}
                            <div className="relative w-full lg:max-w-sm">
                                <input 
                                    type="text" 
                                    placeholder="ابحث باسم الوجبة، الفئة، أو الرمز الداخلي..."
                                    className="w-full bg-slate-50 hover:bg-slate-100/75 border border-slate-200 focus:border-indigo-500 rounded-2xl pl-10 pr-4 py-3 pb-3 font-extrabold text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3 top-3.5" />
                                
                                {searchQuery && (
                                    <button 
                                        type="button" 
                                        onClick={() => setSearchQuery('')}
                                        className="absolute left-9 top-3.5 text-slate-400 hover:text-rose-500 font-bold text-xs"
                                        title="مسح البحث"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Interactive Category Tabs row inside the Explorer page */}
                        <div className="flex gap-2 items-center overflow-x-auto scrollbar-none pb-2">
                            <button
                                type="button"
                                onClick={() => setSelectedCategory('all')}
                                className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all shadow-xs flex items-center gap-2 ${
                                    selectedCategory === 'all'
                                    ? 'bg-indigo-650 text-white shadow-md shadow-indigo-600/15'
                                    : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
                                }`}
                            >
                                <span className="text-sm">🍽️</span>
                                <span>الكل</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-sans ${selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    {products.length}
                                </span>
                            </button>
                            {categories.map(cat => {
                                const count = products.filter(p => p.category === cat.name).length;
                                const lowerCat = cat.name.toLowerCase();
                                let emoji = '🍽️';
                                if (lowerCat.includes('مشروب') || lowerCat.includes('عصير') || lowerCat.includes('drink')) emoji = '🥤';
                                else if (lowerCat.includes('بيتزا') || lowerCat.includes('pizza')) emoji = '🍕';
                                else if (lowerCat.includes('برغر') || lowerCat.includes('burger')) emoji = '🍔';
                                else if (lowerCat.includes('كباب') || lowerCat.includes('لحم') || lowerCat.includes('شاورما') || lowerCat.includes('meat')) emoji = '🍖';
                                else if (lowerCat.includes('سلط') || lowerCat.includes('salad') || lowerCat.includes('مقبلات')) emoji = '🥗';
                                else if (lowerCat.includes('حلو') || lowerCat.includes('dessert') || lowerCat.includes('كيك')) emoji = '🍰';
                                
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setSelectedCategory(cat.name)}
                                        className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all shadow-xs flex items-center gap-2 ${
                                            selectedCategory === cat.name
                                            ? 'bg-indigo-650 text-white shadow-md shadow-indigo-600/15 animate-in zoom-in-95 duration-100'
                                            : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
                                        }`}
                                    >
                                        <span className="text-sm">{emoji}</span>
                                        <span>{cat.name}</span>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-sans ${selectedCategory === cat.name ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Display list of dishes with visual representations */}
                        {filteredProducts.length === 0 ? (
                            <div className="bg-white rounded-3xl border border-dashed border-slate-200 text-center py-20 px-4 space-y-4 max-w-lg mx-auto">
                                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                                    <Search className="w-7 h-7 stroke-[1.5]" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-base font-black text-slate-700">لم نجد أي وجبة مطابقة!</h4>
                                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                                        لا توجد عناصر مطابقة لبحثك: <span className="font-extrabold text-indigo-600 font-sans">"{searchQuery}"</span> في القسم المحدد. يرجى تجربة كلمات بحث أخرى أو إعادة تهيئة الفئات.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                                    className="px-5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-xs rounded-xl border border-indigo-100 transition-colors"
                                >
                                    عرض جميع الأصناف والوجبات
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 align-top">
                                {filteredProducts.map(product => {
                                    // Calculate dynamic category styling
                                    const lower = (product.category || '').toLowerCase();
                                    let style = {
                                        gradient: "from-indigo-500/5 to-purple-500/5",
                                        border: "border-indigo-50",
                                        text: "text-indigo-700",
                                        bg: "bg-indigo-50",
                                        emoji: "🍽️"
                                    };
                                    if (lower.includes('مشروب') || lower.includes('عصير') || lower.includes('drink') || lower.includes('juice')) {
                                        style = { gradient: "from-cyan-500/10 to-blue-500/10", border: "border-blue-100", text: "text-blue-700", bg: "bg-blue-50/70", emoji: "🥤" };
                                    } else if (lower.includes('بيتزا') || lower.includes('pizza')) {
                                        style = { gradient: "from-amber-500/10 to-orange-500/10", border: "border-orange-100", text: "text-orange-700", bg: "bg-orange-50/70", emoji: "🍕" };
                                    } else if (lower.includes('برغر') || lower.includes('burger')) {
                                        style = { gradient: "from-red-500/10 to-amber-500/10", border: "border-amber-100", text: "text-amber-800", bg: "bg-amber-50/70", emoji: "🍔" };
                                    } else if (lower.includes('كباب') || lower.includes('لحم') || lower.includes('شاورما') || lower.includes('meat') || lower.includes('grill') || lower.includes('وجب')) {
                                        style = { gradient: "from-rose-500/10 to-red-500/10", border: "border-rose-100", text: "text-rose-700", bg: "bg-rose-50/70", emoji: "🍖" };
                                    } else if (lower.includes('سلط') || lower.includes('salad') || lower.includes('مقبلات')) {
                                        style = { gradient: "from-emerald-500/10 to-green-500/10", border: "border-green-100", text: "text-emerald-700", bg: "bg-emerald-50/70", emoji: "🥗" };
                                    } else if (lower.includes('حلو') || lower.includes('dessert') || lower.includes('كيك') || lower.includes('cake')) {
                                        style = { gradient: "from-pink-500/10 to-rose-500/10", border: "border-pink-100", text: "text-pink-700", bg: "bg-pink-50/70", emoji: "🍰" };
                                    } else if (lower.includes('شيش') || lower.includes('معسل') || lower.includes('ارجيلا')) {
                                        style = { gradient: "from-slate-500/10 to-indigo-500/10", border: "border-slate-200", text: "text-slate-700", bg: "bg-slate-100/70", emoji: "💨" };
                                    }

                                    return (
                                        <div key={product.id} className="bg-white rounded-[24px] border border-slate-150 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1 group flex flex-col justify-between">
                                            
                                            {/* Beautiful cover design (vector gradient stage) */}
                                            <div className={`h-28 bg-gradient-to-br ${style.gradient} relative flex items-center justify-center overflow-hidden border-b border-dashed border-slate-150`}>
                                                
                                                {/* Category Pill Tag */}
                                                <span className={`text-[9px] ${style.bg} ${style.text} font-black rounded-lg px-2 py-0.5 border border-white/50 absolute top-2.5 right-2.5 shadow-xs z-10`}>
                                                    {product.category || 'عام'}
                                                </span>

                                                {/* Floating animated emoji backdrop representation */}
                                                <span className="text-4xl filter drop-shadow-md select-none transform transition-transform group-hover:scale-125 duration-300">
                                                    {style.emoji}
                                                </span>

                                                {/* Abstract geometric glass circles overlay */}
                                                <div className="absolute -bottom-8 -left-8 w-20 h-20 rounded-full bg-white/20 backdrop-blur-3xl" />
                                                <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-white/10 backdrop-blur-3xl" />
                                            </div>

                                            {/* Details & description padding */}
                                            <div className="p-4 flex-1 flex flex-col justify-between min-h-[140px] space-y-4">
                                                
                                                <div className="space-y-1.5 text-right">
                                                    <h3 className="font-extrabold text-slate-800 text-[13px] leading-tight line-clamp-2 tracking-tight group-hover:text-indigo-650 transition-colors">
                                                        {product.name}
                                                    </h3>
                                                    {product.barcode ? (
                                                        <span className="inline-block text-[9px] font-mono text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                                                            {product.barcode}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-block text-[8px] font-bold text-slate-400">
                                                            منتج المطبخ الداخلي
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Price block bottom */}
                                                <div className="border-t border-slate-100/70 pt-3 flex items-center justify-between text-xs shrink-0">
                                                    <span className="text-[10px] font-black text-slate-400">السعر الصافي:</span>
                                                    <span className="font-black text-indigo-600 font-sans text-sm tracking-tight">
                                                        {product.price.toLocaleString()} د.ع
                                                    </span>
                                                </div>

                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
                
            </div>
        </div>
    );
};

export default WaiterApp;
