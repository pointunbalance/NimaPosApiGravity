import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { CommodityContract, CommodityDelivery } from '../types';
import { 
    Layers, Search, Plus, Target, CheckCircle2, AlertTriangle, 
    TrendingUp, Truck, Scale, Banknote, Calendar, BarChart4, 
    X, Wallet, FileText, BadgePercent, ArrowUpRight, Clock, AlertCircle, ShoppingCart, Trash2, RefreshCcw
} from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer } from 'recharts';

export const CommodityContracts = () => {
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    
    // Form States
    const [selectedContract, setSelectedContract] = useState<CommodityContract | null>(null);
    const [formData, setFormData] = useState<Partial<CommodityContract>>({
        customerId: 0,
        productId: 0,
        contractDate: Date.now(),
        expectedDeliveryDate: addMonths(Date.now(), 6).getTime(),
        bookedQuantity: 1,
        bookingUnitPrice: 0,
        amountPaid: 0,
        paymentMethod: 'نقد / كاش',
        additionalFees: 0,
        status: 'active'
    });

    const [deliveryData, setDeliveryData] = useState<Partial<CommodityDelivery>>({
        quantity: 1,
        marketPriceAtDelivery: 0,
        driverName: '',
        vehiclePlate: '',
        deliveryCost: 0,
        deliveryMethod: 'pickup',
        deliveryLocation: '',
        weighbridgeTicket: '',
        qualityGrade: '',
        handlingFees: 0,
        notes: ''
    });

    const [paymentAmount, setPaymentAmount] = useState(0);

    // Confirmation Modal States
    const [confirmAction, setConfirmAction] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type: 'danger' | 'warning' | 'info';
    }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'info' });

    // DB Queries
    const contracts = useLiveQuery(() => db.commodityContracts.toArray()) || [];
    const deliveries = useLiveQuery(() => db.commodityDeliveries.toArray()) || [];
    const customers = useLiveQuery(() => db.customers.toArray()) || [];
    const products = useLiveQuery(() => db.products.toArray()) || [];

    // Filtered & Sorted Active Contracts
    const activeContracts = useMemo(() => {
        return contracts
            .filter(c => c.status === 'active')
            .filter(c => {
                const customer = customers.find(cus => cus.id === c.customerId);
                const product = products.find(p => p.id === c.productId);
                return customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       product?.name.toLowerCase().includes(searchQuery.toLowerCase());
            })
            .sort((a, b) => b.contractDate - a.contractDate);
    }, [contracts, customers, products, searchQuery]);

    // Historical Deliveries (for the history tab) - IGNORE CANCELLED
    const validDeliveries = useMemo(() => {
        return deliveries.filter(d => {
            const contract = contracts.find(c => c.id === d.contractId);
            return contract && contract.status !== 'cancelled';
        }).sort((a, b) => b.date - a.date);
    }, [deliveries, contracts]);

    const historicalDeliveries = useMemo(() => {
        return deliveries.sort((a, b) => b.date - a.date);
    }, [deliveries]);

    // Trashed contracts
    const trashedContracts = useMemo(() => {
        return contracts
            .filter(c => c.status === 'cancelled')
            .sort((a, b) => b.contractDate - a.contractDate);
    }, [contracts]);

    // Safety Analytics: Check if we have enough stock to cover all reservations
    const inventoryRisk = useMemo(() => {
        const reservedByProduct: Record<number, number> = {};
        
        contracts.filter(c => c.status === 'active').forEach(c => {
            if (!reservedByProduct[c.productId]) reservedByProduct[c.productId] = 0;
            reservedByProduct[c.productId] += (c.bookedQuantity - c.deliveredQuantity);
        });

        const risks = [];
        for (const [productIdStr, reservedQty] of Object.entries(reservedByProduct)) {
            const productId = parseInt(productIdStr);
            const product = products.find(p => p.id === productId);
            if (product && product.stock < reservedQty) {
                risks.push({
                    product,
                    reservedQty,
                    deficit: reservedQty - product.stock
                });
            }
        }
        return risks;
    }, [contracts, products]);

    // Actions
    const handleSaveContract = async (e: React.FormEvent) => {
        e.preventDefault();
        const totalValue = formData.bookedQuantity! * formData.bookingUnitPrice!;
        
        await db.commodityContracts.add({
            customerId: formData.customerId!,
            productId: formData.productId!,
            contractDate: new Date(formData.contractDate || Date.now()).getTime(),
            expectedDeliveryDate: formData.expectedDeliveryDate ? new Date(formData.expectedDeliveryDate).getTime() : undefined,
            bookedQuantity: formData.bookedQuantity!,
            deliveredQuantity: 0,
            bookingUnitPrice: formData.bookingUnitPrice!,
            totalValue: totalValue,
            amountPaid: formData.amountPaid || 0,
            paymentMethod: formData.paymentMethod || 'نقدي',
            additionalFees: formData.additionalFees || 0,
            status: 'active',
            notes: formData.notes || ''
        });

        setIsModalOpen(false);
    };

    const handleSaveDelivery = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedContract) return;

        const deliverQty = Number(deliveryData.quantity);
        const newDeliveredAmount = selectedContract.deliveredQuantity + deliverQty;
        
        if (deliverQty <= 0) return alert('الكمية يجب أن تكون أكبر من صفر');
        if (newDeliveredAmount > selectedContract.bookedQuantity) return alert('الكمية المسلمة تتجاوز الكمية المحجوزة المتبقية!');

        // Save delivery record
        await db.commodityDeliveries.add({
            contractId: selectedContract.id!,
            date: Date.now(),
            quantity: deliverQty,
            marketPriceAtDelivery: deliveryData.marketPriceAtDelivery!,
            driverName: deliveryData.driverName,
            vehiclePlate: deliveryData.vehiclePlate,
            deliveryCost: deliveryData.deliveryCost || 0,
            deliveryMethod: deliveryData.deliveryMethod,
            deliveryLocation: deliveryData.deliveryLocation,
            weighbridgeTicket: deliveryData.weighbridgeTicket,
            qualityGrade: deliveryData.qualityGrade,
            handlingFees: deliveryData.handlingFees || 0,
            notes: deliveryData.notes
        });

        // Deduct physical inventory stock only at delivery
        const product = await db.products.get(selectedContract.productId);
        if (product) {
            await db.products.update(product.id!, {
                stock: product.stock - deliverQty
            });
        }

        // Update contract status if fully delivered
        await db.commodityContracts.update(selectedContract.id!, {
            deliveredQuantity: newDeliveredAmount,
            status: newDeliveredAmount >= selectedContract.bookedQuantity ? 'completed' : 'active'
        });

        setIsDeliveryModalOpen(false);
        setDeliveryData({ quantity: 1, marketPriceAtDelivery: 0, driverName: '', vehiclePlate: '', deliveryCost: 0, notes: '' });
    };

    const handleSavePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!selectedContract) return;

        const pAmt = Number(paymentAmount);
        if (pAmt <= 0) return alert('المبلغ يجب أن يكون أكبر من صفر');

        const newPaidAmount = selectedContract.amountPaid + pAmt;
        
        await db.commodityContracts.update(selectedContract.id!, {
            amountPaid: newPaidAmount
        });

        setIsPaymentModalOpen(false);
        setPaymentAmount(0);
    };

    const handleDeleteContract = (id: number) => {
        setConfirmAction({
            isOpen: true,
            type: 'warning',
            title: 'تأكيد الحذف والنقل للمهملات',
            message: 'هل أنت متأكد من حذف هذا العقد؟ سيتم إرساله إلى سلة المهملات العامة ويمكنك التراجع من هناك.',
            onConfirm: async () => {
                await db.commodityContracts.delete(id);
                setConfirmAction(prev => ({...prev, isOpen: false}));
            }
        });
    };

    const handleAutoFixDeficit = (risk: any) => {
        setConfirmAction({
            isOpen: true,
            type: 'info',
            title: 'تغطية عجز الطوارئ',
            message: `هل تريد استخراج فاتورة مشتريات نقدية عاجلة لتوفير ${Math.abs(risk.deficit)} وحدة من ${risk.product.name} فوراً لرفع الرصيد وتغطية العجز؟`,
            onConfirm: async () => {
                try {
                    const requiredQty = Math.abs(risk.deficit);
                    
                    // Get or create emergency supplier
                    let supplier = await db.suppliers.toCollection().first();
                    let supplierId = supplier?.id;
                    let supplierName = supplier?.name;

                    if (!supplier) {
                        supplierId = await db.suppliers.add({
                            name: 'مورد تغطية عجز (طوارئ)',
                            phone: '-',
                            balance: 0
                        }) as number;
                        supplierName = 'مورد تغطية عجز (طوارئ)';
                    }

                    const costPrice = risk.product.costPrice || risk.product.price || 0;
                    const total = requiredQty * costPrice;

                    // Update in single transaction
                    await (db as any).transaction('rw', db.purchases, db.products, db.warehouses, db.inventory, db.suppliers, db.expenses, async () => {
                        await db.purchases.add({
                            supplierId: supplierId!,
                            supplierName: supplierName!,
                            date: new Date(),
                            invoiceNumber: `A-FIX-${Date.now().toString().slice(-4)}`,
                            items: [{
                                productId: risk.product.id,
                                name: risk.product.name,
                                quantity: requiredQty,
                                costPrice: costPrice,
                                total: total
                            }],
                            subtotal: total,
                            taxAmount: 0,
                            discountAmount: 0,
                            totalAmount: total,
                            notes: 'فاتورة توليد تلقائية مبرمجة لتغطية عجز العقود الآجلة',
                        });

                        if (total > 0) {
                            await db.expenses.add({
                                title: `تغطية عجز عقود آجلة - ${risk.product.name}`,
                                amount: total,
                                category: 'purchase',
                                date: new Date(),
                                paymentMethod: 'cash',
                                notes: 'تم توليدها تلقائياً مع فاتورة الطوارئ'
                            });
                        }

                        await db.products.update(risk.product.id, {
                            stock: risk.product.stock + requiredQty
                        });

                        const mainWarehouse = await db.warehouses.where('isMain').equals(1).first();
                        if (mainWarehouse && mainWarehouse.id) {
                            const invItem = await db.inventory.where({ warehouseId: mainWarehouse.id, productId: risk.product.id }).first();
                            if (invItem) {
                                await db.inventory.update(invItem.id!, { quantity: invItem.quantity + requiredQty });
                            } else {
                                await db.inventory.add({
                                    warehouseId: mainWarehouse.id,
                                    productId: risk.product.id,
                                    quantity: requiredQty
                                });
                            }
                        }
                    });
                    setConfirmAction(prev => ({...prev, isOpen: false}));
                } catch (error) {
                    console.error("AutoFix Error:", error);
                    alert('حدث خطأ أثناء محاولة تغطية العجز تلقائياً.');
                }
            }
        });
    };

    // Analytics
    const calculateProfitability = () => {
        let totalMarketValue = 0;
        let totalBookedValue = 0;
        let totalCashCollected = 0;
        let totalDeliveryCosts = 0;
        let totalAdditionalFees = 0; // Storage/Admin fees from contracts
        
        validDeliveries.forEach(d => {
            const contract = contracts.find(c => c.id === d.contractId);
            if (contract) {
                totalMarketValue += (d.marketPriceAtDelivery * d.quantity);
                totalBookedValue += (contract.bookingUnitPrice * d.quantity);
                totalDeliveryCosts += (d.deliveryCost || 0);
            }
        });

        contracts.filter(c => c.status !== 'cancelled').forEach(c => {
            totalCashCollected += c.amountPaid;
            totalAdditionalFees += (c.additionalFees || 0);
        });

        // Net Profit Calculation
        // Gross Profit = Market Value - Booked Value
        // Net Profit = Gross Profit + Additional Storage Fees - Delivery Costs
        const grossProfit = totalMarketValue - totalBookedValue;
        const netProfit = grossProfit + totalAdditionalFees - totalDeliveryCosts;

        return {
            totalMarketValue,
            totalBookedValue,
            totalCashCollected,
            grossProfit,
            netProfit,
            totalDeliveryCosts,
            totalAdditionalFees
        };
    };

    const stats = calculateProfitability();

    const chartData = useMemo(() => {
        const groupedMap = new Map();
        
        validDeliveries.forEach(d => {
            const dateStr = format(d.date, 'MMM dd');
            const contract = contracts.find(c => c.id === d.contractId);
            const bookedPrice = contract ? contract.bookingUnitPrice : 0;
            const profit = (d.marketPriceAtDelivery - bookedPrice) * d.quantity;
            
            if(groupedMap.has(dateStr)) {
                const existing = groupedMap.get(dateStr);
                existing.profit += profit;
                existing.marketValue += (d.marketPriceAtDelivery * d.quantity);
            } else {
                groupedMap.set(dateStr, {
                    name: dateStr,
                    profit: profit,
                    marketValue: (d.marketPriceAtDelivery * d.quantity)
                });
            }
        });

        return Array.from(groupedMap.values()).reverse();
    }, [validDeliveries, contracts]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-l from-slate-900 to-indigo-900 p-6 md:p-8 rounded-[2rem] shadow-xl text-white">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                        <Layers className="w-8 h-8 text-indigo-300" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight mb-1">
                            العقود الآجلة وحجوزات البضائع
                        </h1>
                        <p className="text-indigo-200 font-medium text-sm">
                            منظومة الإدارة المتقدمة لتجارة السلع الاستراتيجية والمعادن وتتبع تسليماتها
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setFormData({
                            customerId: customers[0]?.id || 0,
                            productId: products[0]?.id || 0,
                            contractDate: Date.now(),
                            expectedDeliveryDate: addMonths(Date.now(), 6).getTime(),
                            bookedQuantity: 1,
                            bookingUnitPrice: 0,
                            amountPaid: 0,
                            paymentMethod: 'نقد / كاش',
                            additionalFees: 0,
                            status: 'active'
                        });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-indigo-500 text-white px-6 py-4 rounded-2xl font-bold hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/30 w-full md:w-auto hover:-translate-y-1"
                >
                    <Plus className="w-5 h-5" /> بناء عقد حجز جديد
                </button>
            </div>

            {/* Inventory Safety Alerts */}
            {inventoryRisk.length > 0 && activeTab === 'active' && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-rose-800 font-bold mb-3">
                        <AlertTriangle className="w-5 h-5" />
                        <h3 className="text-lg">تنبيه عجز مخزون للعقود المحجوزة!</h3>
                    </div>
                    <div className="space-y-3">
                        {inventoryRisk.map(risk => (
                            <div key={risk.product.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-rose-100 shadow-sm gap-4">
                                <div>
                                    <span className="font-black text-rose-900 block mb-1.5 text-base">{risk.product.name}</span>
                                    <div className="flex flex-wrap gap-2.5 font-mono font-bold text-xs">
                                        <span className="text-slate-500 bg-slate-100 px-2 py-1.5 rounded" title="المخزون الفعلي الحالي">الفعلي: {risk.product.stock}</span>
                                        <span className="text-indigo-600 bg-indigo-50 px-2 py-1.5 rounded" title="إجمالي الكميات المحجوزة المطلوبة">المحجوز: <span dir="ltr">{risk.reservedQty}</span></span>
                                        <span className="text-rose-600 bg-rose-100 px-2 py-1.5 rounded" title="العجز المتوقع للتسليم">عجز: <span dir="ltr">{-risk.deficit}</span></span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleAutoFixDeficit(risk)}
                                    className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white px-5 py-2.5 rounded-xl text-sm font-black shadow-md shadow-rose-500/30 transition-all flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-auto hover:-translate-y-0.5"
                                >
                                    <ShoppingCart className="w-4 h-4"/> 
                                    تغطية فورية (عبر فاتورة طوارئ)
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Global Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                        <Target className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-bold mb-1">العقود النشطة المفتوحة</p>
                        <p className="font-mono text-xl font-black text-slate-800">{activeContracts.length}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                        <Banknote className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-bold mb-1">صافي السيولة المقبوضة</p>
                        <p className="font-mono text-xl font-black text-slate-800">{stats.totalCashCollected.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-sky-50 rounded-2xl p-5 border border-sky-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-white text-sky-600 rounded-xl flex items-center justify-center shrink-0 border border-sky-100">
                        <Truck className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-sky-800 font-bold mb-1">دفعات التسليم السليمة</p>
                        <p className="font-mono text-xl font-black text-sky-600">{validDeliveries.length}</p>
                    </div>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-10">
                        <TrendingUp className="w-24 h-24 text-emerald-500" />
                    </div>
                    <div className="w-12 h-12 border border-emerald-200 bg-white text-emerald-600 rounded-xl flex items-center justify-center shrink-0 relative z-10">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-xs text-emerald-800 font-bold mb-1">صافي الأرباح (شامل الرسوم)</p>
                        <p className="font-mono text-xl font-black text-emerald-600">+{stats.netProfit.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap bg-slate-200/60 p-1.5 rounded-2xl w-fit gap-1">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'active' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Layers className="w-4 h-4" /> العُهد والحجوزات النشطة
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <BarChart4 className="w-4 h-4" /> التقارير المتقدمة للأرباح
                </button>
            </div>

            {activeTab === 'active' && (
                <div className="space-y-6">
                    <div className="relative max-w-md">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="ابحث باسم العميل، المنتج، أو رقم العقد..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pr-12 pl-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium shadow-sm"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {activeContracts.map(contract => {
                            const customer = customers.find(c => c.id === contract.customerId);
                            const product = products.find(p => p.id === contract.productId);
                            const progress = (contract.deliveredQuantity / contract.bookedQuantity) * 100;
                            const remainingQty = contract.bookedQuantity - contract.deliveredQuantity;
                            
                            // Financials
                            const totalContractOwed = contract.totalValue + (contract.additionalFees || 0);
                            const financialBalance = totalContractOwed - contract.amountPaid;
                            const isFullyPaid = financialBalance <= 0;

                            return (
                                <div key={contract.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all overflow-hidden flex flex-col group">
                                    {/* Card Header */}
                                    <div className="p-6 border-b border-slate-100 relative">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-full -z-0"></div>
                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div>
                                                <h3 className="font-black text-xl text-slate-800">{customer?.name}</h3>
                                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                    <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                                                        <Layers className="w-4 h-4" /> {product?.name}
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 rounded-md flex items-center gap-1">
                                                        ت: {format(contract.contractDate, 'yyyy/MM/dd')}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="bg-slate-900 border border-slate-700 text-white text-xs font-black px-3 py-1.5 rounded-xl font-mono">#{contract.id}</span>
                                        </div>
                                        
                                        {/* Progress Bar */}
                                        <div className="space-y-2 mt-6 relative z-10">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500 font-bold">الكمية المحجوزة:</span>
                                                <span className="font-black font-mono text-slate-800 text-base">{contract.bookedQuantity} <span className="text-xs text-slate-500 font-sans">{product?.units?.[0]?.name || 'وحدة'}</span></span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner border border-slate-200/50">
                                                <div className="bg-gradient-to-l from-indigo-500 to-indigo-600 h-full rounded-full transition-all relative overflow-hidden" style={{ width: `${progress}%` }}>
                                                    <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between text-xs font-bold px-1">
                                                <span className="text-indigo-600">تم سحب: {contract.deliveredQuantity}</span>
                                                <span className="text-rose-500">متبقي: {remainingQty}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Financials */}
                                    <div className="p-6 flex-1 bg-slate-50/50 space-y-3 relative">
                                        {contract.expectedDeliveryDate && (
                                            <div className="absolute top-2 right-4 text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                                موعد التسليم المتوقع: <span className="text-slate-600">{format(contract.expectedDeliveryDate, 'yyyy/MM/dd')}</span>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-4 mt-2">
                                            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                                                <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">إجمالي الواجب دفعه</p>
                                                <p className="font-mono font-black text-slate-700 text-base">{(totalContractOwed).toLocaleString()} <span className="text-[10px] text-slate-400 font-sans font-bold">د.ع</span></p>
                                                {contract.additionalFees && contract.additionalFees > 0 ? <p className="text-[9px] text-indigo-500 mt-0.5">(يتضمن رسوم وتخزين)</p> : null}
                                            </div>
                                            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                                                <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">الموقف المالي الُمتبقي</p>
                                                {isFullyPaid ? (
                                                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-black px-2.5 py-1 rounded-md mt-1">
                                                        <CheckCircle2 className="w-3.5 h-3.5"/> خالص الدفع
                                                    </span>
                                                ) : (
                                                    <div>
                                                        <p className="font-mono text-rose-600 font-bold text-base">مطلوب: {financialBalance.toLocaleString()}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Actions */}
                                    <div className="p-3 border-t border-slate-100 flex gap-2 bg-white">
                                        <button 
                                            onClick={() => {
                                                setSelectedContract(contract);
                                                setDeliveryData(prev => ({ 
                                                    ...prev, 
                                                    quantity: remainingQty, 
                                                    marketPriceAtDelivery: contract.bookingUnitPrice 
                                                }));
                                                setIsDeliveryModalOpen(true);
                                            }}
                                            className="flex-1 bg-indigo-600 text-white rounded-xl py-3 text-sm font-bold shadow-md shadow-indigo-600/20 hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all"
                                        >
                                            <Truck className="w-4 h-4"/> سحب البضاعة
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setSelectedContract(contract);
                                                setIsPaymentModalOpen(true);
                                            }}
                                            className="flex-1 bg-slate-100 text-slate-700 rounded-xl py-3 text-sm font-bold hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 flex items-center justify-center gap-2 transition-all"
                                        >
                                            <Wallet className="w-4 h-4"/> قبض دفعة
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setSelectedContract(contract);
                                                setIsDetailsModalOpen(true);
                                            }}
                                            className="px-4 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-200 flex items-center justify-center transition-all bg-gradient-to-t hover:from-slate-200 hover:to-slate-100"
                                            title="تفاصيل الحجز"
                                        >
                                            <FileText className="w-5 h-5"/>
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteContract(contract.id!)}
                                            className="px-4 bg-white text-rose-500 border border-rose-100 rounded-xl font-bold hover:bg-rose-50 hover:text-rose-700 flex items-center justify-center transition-all"
                                            title="حذف العقد"
                                        >
                                            <Trash2 className="w-5 h-5"/>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {activeContracts.length === 0 && (
                            <div className="col-span-full py-32 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-[3rem] border-2 border-slate-200 border-dashed">
                                <FileText className="w-20 h-20 mb-6 text-slate-300 drop-shadow-md" />
                                <h3 className="text-2xl font-black text-slate-600">لا توجد عقود حجز نشطة</h3>
                                <p className="text-sm mt-3 font-medium text-slate-500">قم بإنشاء حجز مستقبلي جديد للبدء في تتبع الكميات والأرباح المخفية</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="space-y-6">
                    {/* Charts Section */}
                    <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-0"></div>
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                    <TrendingUp className="w-6 h-6 text-emerald-500" /> مؤشر الأرباح التراكمية
                                </h2>
                                <p className="text-sm text-slate-500 mt-1 font-medium">مقارنة بين القيمة السوقية الفائتة والقيمة المحجوزة وقت التعاقد</p>
                            </div>
                        </div>
                        <div className="h-80 w-full relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontFamily: 'monospace' }} width={80} />
                                    <RTooltip 
                                        contentStyle={{ borderRadius: '1.25rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                                        formatter={(value: number) => [`${value.toLocaleString()} د.ع`, 'صافي الربح']}
                                    />
                                    <Area type="monotone" dataKey="profit" name="الربح المحقق" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorProfit)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-lg font-black text-slate-800">سجل عمليات التسليم (السحب اللوجستي)</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">التاريخ والبيانات</th>
                                        <th className="px-6 py-4">العميل والمنتج</th>
                                        <th className="px-6 py-4 text-center">الكمية المسحوبة</th>
                                        <th className="px-6 py-4 text-center">الأسعار بالمقارنة</th>
                                        <th className="px-6 py-4 text-center">اللوجستيات</th>
                                        <th className="px-6 py-4 text-center">العائد للمنظمة</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                            {validDeliveries.map(delivery => {
                                        const contract = contracts.find(c => c.id === delivery.contractId);
                                        const customer = customers.find(c => c.id === contract?.customerId);
                                        const product = products.find(p => p.id === contract?.productId);
                                        const profit = (delivery.marketPriceAtDelivery - (contract?.bookingUnitPrice || 0)) * delivery.quantity;

                                        return (
                                            <tr key={delivery.id} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <p className="font-mono text-slate-800 font-bold">{format(delivery.date, 'yyyy/MM/dd')}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">#{delivery.id}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-800">{customer?.name}</div>
                                                    <div className="flex items-center gap-1 text-[11px] text-indigo-600 mt-1 font-bold bg-indigo-50 px-1.5 py-0.5 rounded w-fit"><Layers className="w-3 h-3"/> {product?.name}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-black font-mono text-indigo-700">
                                                    {delivery.quantity} <span className="font-sans text-[10px] text-slate-400">{product?.units?.[0]?.name || 'وحدة'}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col gap-1 items-center">
                                                        <span className="text-[10px] bg-slate-100 px-2 rounded font-mono text-slate-600 line-through">حجز: {contract?.bookingUnitPrice.toLocaleString()}</span>
                                                        <span className="font-mono font-bold text-slate-800">سوق: {delivery.marketPriceAtDelivery.toLocaleString()}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center text-xs space-y-1">
                                                    {delivery.vehiclePlate && <div className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200 font-mono inline-block">مركبة: {delivery.vehiclePlate}</div>}
                                                    {delivery.deliveryCost ? <div className="text-rose-600 font-mono font-bold inline-block mr-2">نولون: {delivery.deliveryCost}</div> : null}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="font-mono font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-block text-lg shadow-sm border border-emerald-100">
                                                        +{profit.toLocaleString()}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {validDeliveries.length === 0 && (
                                        <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-400 font-bold text-lg">لا توجد عمليات سحب مخزنية مسجلة بعد</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODALS --- */}

            {/* 1. Add Contract Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-[2rem] w-full max-w-3xl relative z-10 shadow-2xl flex flex-col max-h-[95vh]">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-white rounded-t-[2rem]">
                            <div>
                                <h2 className="text-2xl font-black text-indigo-900 flex items-center gap-2"><Plus className="w-6 h-6"/> إبرام عقد حجز بضاعة مُمتد</h2>
                                <p className="text-xs text-indigo-500 font-bold mt-1">يُستخدم لتثبيت الأسعار والكميات للمستقبل وتأكيده مالياً.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-indigo-100 text-indigo-500 rounded-full transition-colors"><X className="w-6 h-6"/></button>
                        </div>
                        <form onSubmit={handleSaveContract} className="p-0 overflow-y-auto w-full">
                            <div className="p-6 md:p-8 space-y-8">
                                {/* Section: Basic Info */}
                                <div className="space-y-4 relative">
                                    <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">1. أطراف العقد</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">العميل المشتري <span className="text-rose-500">*</span></label>
                                            <select required value={formData.customerId} onChange={e => setFormData({...formData, customerId: Number(e.target.value)})} className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none">
                                                <option value={0} disabled>-- حدد العميل --</option>
                                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">المنتج (السلعة الأساسية) <span className="text-rose-500">*</span></label>
                                            <select required value={formData.productId} onChange={e => setFormData({...formData, productId: Number(e.target.value)})} className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none">
                                                <option value={0} disabled>-- حدد المخزون --</option>
                                                {products.map(p => <option key={p.id} value={p.id}>{p.name} (متوفر: {p.stock})</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Section: Quantities & Pricing */}
                                <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 relative">
                                    <h3 className="font-bold text-indigo-900 border-b border-indigo-200/50 pb-2 mb-4">2. الكميات والتسعير الدائم</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">الكمية الإجمالية المحجوزة <span className="text-rose-500">*</span></label>
                                            <div className="relative">
                                                <BadgePercent className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300" />
                                                <input required type="number" min="0.01" step="0.01" value={formData.bookedQuantity} onChange={e => setFormData({...formData, bookedQuantity: Number(e.target.value)})} className="w-full pr-10 pl-4 py-3 bg-white border border-indigo-200 rounded-xl text-lg font-black font-mono focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" dir="ltr" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">تثبيت السعر المتفق عليه للوحدة <span className="text-rose-500">*</span></label>
                                            <div className="relative">
                                                <Banknote className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300" />
                                                <input required type="number" step="0.01" value={formData.bookingUnitPrice} onChange={e => setFormData({...formData, bookingUnitPrice: Number(e.target.value)})} className="w-full pr-10 pl-4 py-3 bg-white border border-indigo-200 rounded-xl text-lg font-black font-mono focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" dir="ltr" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Logistics & Fees */}
                                <div className="space-y-4">
                                    <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">3. الشروط المالية واللوجستية</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">موعد التسليم المتوقع (الحد الأقصى)</label>
                                            <input type="date" value={formData.expectedDeliveryDate ? format(new Date(formData.expectedDeliveryDate), 'yyyy-MM-dd') : ''} onChange={e => setFormData({...formData, expectedDeliveryDate: new Date(e.target.value).getTime()})} className="w-full px-4 py-3 border border-slate-200 bg-white rounded-xl text-sm font-bold font-mono focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">رسوم تخزين/خدمات إضافية (اختياري)</label>
                                            <input type="number" step="0.01" value={formData.additionalFees || ''} onChange={e => setFormData({...formData, additionalFees: Number(e.target.value)})} className="w-full px-4 py-3 border border-slate-200 bg-white rounded-xl text-sm font-bold font-mono focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0.00" dir="ltr"/>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">طريقة الدفع (العربون)</label>
                                            <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} className="w-full px-4 py-3 border border-slate-200 bg-white rounded-xl text-sm font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none">
                                                <option>نقد / كاش</option>
                                                <option>حوالة بنكية</option>
                                                <option>شيكات مؤجلة</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2 md:col-span-3 bg-emerald-50 border border-emerald-200 p-4 rounded-xl shadow-inner">
                                            <label className="text-sm font-black text-emerald-800 flex justify-between items-center">
                                                <span>الدفعة المقدمة (المقبوضة الآن) لحفظ العقد</span>
                                                <span className="text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded text-xs font-mono">الإجمالي: {(formData.bookedQuantity! * formData.bookingUnitPrice!).toLocaleString()}</span>
                                            </label>
                                            <input type="number" step="0.01" value={formData.amountPaid} onChange={e => setFormData({...formData, amountPaid: Number(e.target.value)})} className="w-full px-4 py-4 bg-white border-2 border-emerald-300 rounded-xl text-2xl font-black font-mono focus:ring-4 focus:ring-emerald-500/20 outline-none text-emerald-900 transition-all text-center" dir="ltr" />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">ملاحظات وشروط استثنائية</label>
                                    <textarea value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} rows={2} placeholder="نص شروط التعاقد أو شروط غرامات التأخير في السحب..." className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none"></textarea>
                                </div>
                            </div>
                            
                            <div className="p-6 border-t border-slate-100 flex gap-4 bg-slate-50 rounded-b-[2rem]">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 font-bold text-slate-600 bg-white hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors">إلغاء</button>
                                <button type="submit" className="flex-1 py-4 font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2">
                                    إعتماد وتوثيق الحجز في الدفاتر <CheckCircle2 className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 2. Advanced Delivery Modal */}
            {isDeliveryModalOpen && selectedContract && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDeliveryModalOpen(false)}></div>
                    <div className="bg-white rounded-[2rem] w-full max-w-lg relative z-10 shadow-2xl flex flex-col max-h-[95vh]">
                        <div className="p-6 border-b border-emerald-100 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-white rounded-t-[2rem]">
                            <div>
                                <h2 className="text-xl font-black text-emerald-900 flex items-center gap-2"><Truck className="w-6 h-6"/> خروج وتسليم بضاعة للعميل</h2>
                                <p className="text-xs text-emerald-600 font-bold mt-1">يُشترط خروج البضاعة من المخزون الفعلي.</p>
                            </div>
                            <button onClick={() => setIsDeliveryModalOpen(false)} className="p-2 hover:bg-emerald-100 text-emerald-600 rounded-full transition-colors"><X className="w-6 h-6"/></button>
                        </div>
                        <form onSubmit={handleSaveDelivery} className="p-0 overflow-y-auto">
                            <div className="p-6 space-y-6">
                                <div className="bg-amber-50 text-amber-900 p-4 rounded-xl text-sm font-bold flex flex-col gap-2 border border-amber-200/60 shadow-sm relative overflow-hidden">
                                    <AlertTriangle className="absolute -left-2 -bottom-2 w-16 h-16 opacity-10" />
                                    <p className="z-10">الحد الأقصى המسموح بسحبه الآن للصنف:</p>
                                    <p className="font-mono font-black text-3xl text-amber-700 z-10">{selectedContract.bookedQuantity - selectedContract.deliveredQuantity}</p>
                                </div>
                                
                                <div className="space-y-5">
                                    <div className="space-y-2 relative">
                                        <label className="text-sm font-bold text-slate-700">كمية الدفعة المُسلمة فعلياً <span className="text-rose-500">*</span></label>
                                        <input required type="number" min="0.01" step="0.01" max={selectedContract.bookedQuantity - selectedContract.deliveredQuantity} value={deliveryData.quantity} onChange={e => setDeliveryData({...deliveryData, quantity: Number(e.target.value)})} className="w-full px-4 py-4 border-2 border-emerald-300 bg-white rounded-xl text-2xl font-black font-mono focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none text-center shadow-inner" dir="ltr" />
                                    </div>
                                    <div className="space-y-2 relative">
                                        <label className="text-sm font-bold text-slate-700 bg-indigo-50 p-2 rounded-lg block border border-indigo-100 text-indigo-900">حالة السوق: تسعير السلعة في أسواق اليوم <span className="text-rose-500">*</span></label>
                                        <input required type="number" min="0" step="0.01" value={deliveryData.marketPriceAtDelivery} onChange={e => setDeliveryData({...deliveryData, marketPriceAtDelivery: Number(e.target.value)})} className="w-full px-4 py-3 border border-slate-300 bg-white rounded-xl text-lg font-black font-mono focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none text-center" dir="ltr" />
                                        <p className="text-[10px] text-slate-400 font-bold text-center mt-1">القيمة المحجوزة القديمة للوحدة: <span className="font-mono text-indigo-500 font-black">{selectedContract.bookingUnitPrice}</span></p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500">سائق / جهة التسليم</label>
                                            <input type="text" value={deliveryData.driverName} onChange={e => setDeliveryData({...deliveryData, driverName: e.target.value})} className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm font-bold focus:border-emerald-500 outline-none" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500">لوحة المركبة</label>
                                            <input type="text" value={deliveryData.vehiclePlate} onChange={e => setDeliveryData({...deliveryData, vehiclePlate: e.target.value})} className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm font-bold focus:border-emerald-500 outline-none font-mono" />
                                        </div>
                                        <div className="space-y-2 col-span-2">
                                            <label className="text-xs font-bold text-slate-500">نولون/تكلفة الشحن والتوصيل الداخلي</label>
                                            <input type="number" step="0.01" value={deliveryData.deliveryCost || ''} onChange={e => setDeliveryData({...deliveryData, deliveryCost: Number(e.target.value)})} className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm font-bold focus:border-rose-500 outline-none font-mono text-rose-600" dir="ltr"/>
                                        </div>
                                    </div>

                                    {/* Advanced Delivery Scenarios */}
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500">طريقة الاستلام/التسليم</label>
                                            <select value={deliveryData.deliveryMethod} onChange={e => setDeliveryData({...deliveryData, deliveryMethod: e.target.value as any})} className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm font-bold focus:border-emerald-500 outline-none">
                                                <option value="pickup">استلام من المخزن (Pickup)</option>
                                                <option value="fleet">توصيل بأسطول الشركة (Fleet)</option>
                                                <option value="external">توصيل شركة شحن خارجية</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500">موقع الوجهة (الورشة/المصنع)</label>
                                            <input type="text" value={deliveryData.deliveryLocation || ''} onChange={e => setDeliveryData({...deliveryData, deliveryLocation: e.target.value})} className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm font-bold focus:border-emerald-500 outline-none" placeholder="مكان التفريغ..." />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500">رقم بوليصة/تذكرة الميزان (بسكول)</label>
                                            <input type="text" value={deliveryData.weighbridgeTicket || ''} onChange={e => setDeliveryData({...deliveryData, weighbridgeTicket: e.target.value})} className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm font-bold focus:border-emerald-500 outline-none font-mono" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500">درجة فرز/جودة (إن وجدت)</label>
                                            <input type="text" value={deliveryData.qualityGrade || ''} onChange={e => setDeliveryData({...deliveryData, qualityGrade: e.target.value})} className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm font-bold focus:border-emerald-500 outline-none" placeholder="مثال: فرز أول، عيار 21..." />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500">رسوم التحميل والتعتيق (لعمالة المخزن)</label>
                                            <input type="number" step="0.01" value={deliveryData.handlingFees || ''} onChange={e => setDeliveryData({...deliveryData, handlingFees: Number(e.target.value)})} className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm font-bold focus:border-emerald-500 outline-none font-mono" dir="ltr" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500">ملاحظات/شروط إخلاء طرف</label>
                                            <input type="text" value={deliveryData.notes || ''} onChange={e => setDeliveryData({...deliveryData, notes: e.target.value})} className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm font-bold focus:border-emerald-500 outline-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-[2rem]">
                                <button type="submit" className="w-full py-4 font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 text-lg">
                                    <CheckCircle2 className="w-6 h-6"/> تأكيد وتوثيق السحب
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 3. Add Financial Payment Modal */}
            {isPaymentModalOpen && selectedContract && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsPaymentModalOpen(false)}></div>
                    <div className="bg-white rounded-[2rem] w-full max-w-sm relative z-10 shadow-2xl flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-indigo-100 flex justify-between items-center bg-indigo-50/80">
                            <h2 className="text-lg font-black text-indigo-900 flex items-center gap-2"><Wallet className="w-5 h-5"/> قبض دفعة مالية</h2>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-indigo-200 text-indigo-600 rounded-full transition-colors"><X className="w-5 h-5"/></button>
                        </div>
                        <form onSubmit={handleSavePayment} className="p-6 space-y-6 flex flex-col items-center">
                            
                            <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 text-center relative">
                                <p className="text-sm font-bold text-slate-500 mb-1">المتبقي المطلوب سداده</p>
                                <p className="text-3xl font-black font-mono text-rose-600">{((selectedContract.totalValue + (selectedContract.additionalFees || 0)) - selectedContract.amountPaid).toLocaleString()}</p>
                            </div>

                            <div className="w-full space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex justify-center">النقدية المقبوضة الآن <span className="text-rose-500">*</span></label>
                                <input 
                                    required 
                                    type="number" 
                                    min="1" 
                                    step="0.01" 
                                    value={paymentAmount || ''} 
                                    onChange={e => setPaymentAmount(Number(e.target.value))} 
                                    autoFocus
                                    className="w-full px-4 py-5 border-2 border-indigo-300 bg-white rounded-2xl text-3xl font-black font-mono focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/20 outline-none text-center shadow-inner" 
                                    dir="ltr" 
                                    placeholder="0"
                                />
                            </div>

                            <button type="submit" className="w-full py-4 font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-lg">
                                تأكيد استلام النقدية
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 4. Contract Details Modal */}
            {isDetailsModalOpen && selectedContract && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDetailsModalOpen(false)}></div>
                    <div className="bg-white rounded-[2rem] w-full max-w-4xl relative z-10 shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 rounded-t-[2rem]">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-600"/> كشف تفصيلي للعقد المالي واللوجستي #{selectedContract.id}
                            </h2>
                            <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"><X className="w-5 h-5"/></button>
                        </div>
                        <div className="p-6 md:p-8 overflow-y-auto space-y-8 bg-slate-50/30">
                            
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center shadow-sm">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wide">الكمية المحجوزة</p>
                                    <p className="font-mono text-2xl font-black text-slate-800">{selectedContract.bookedQuantity}</p>
                                </div>
                                <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 text-center shadow-sm">
                                    <p className="text-xs font-bold text-indigo-500 uppercase mb-2 tracking-wide">تم سحبه وتسليمه</p>
                                    <p className="font-mono text-2xl font-black text-indigo-700">{selectedContract.deliveredQuantity}</p>
                                </div>
                                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 text-center shadow-sm">
                                    <p className="text-xs font-bold text-emerald-600 uppercase mb-2 tracking-wide">إجمالي المدفوعات الدائنة</p>
                                    <p className="font-mono text-2xl font-black text-emerald-700">{selectedContract.amountPaid.toLocaleString()}</p>
                                </div>
                                <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100 text-center shadow-sm relative overflow-hidden">
                                    <AlertCircle className="absolute -left-2 -bottom-2 w-12 h-12 text-rose-500 opacity-10" />
                                    <p className="text-xs font-bold text-rose-500 uppercase mb-2 tracking-wide">الدين المعلق</p>
                                    <p className="font-mono text-2xl font-black text-rose-700">{((selectedContract.totalValue + (selectedContract.additionalFees || 0)) - selectedContract.amountPaid).toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Additional Info Box */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-sm">
                                <div>
                                    <p className="text-xs text-slate-400 font-bold mb-1">الرسوم الإضافية المطبقة (تخزين)</p>
                                    <p className="font-mono font-bold text-slate-700">{(selectedContract.additionalFees || 0).toLocaleString()} د.ع</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold mb-1">طريقة الدفع المتفق عليها</p>
                                    <p className="font-bold text-slate-700">{selectedContract.paymentMethod}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold mb-1">التسليم المتوقع بحد أقصى</p>
                                    <p className="font-bold font-mono text-slate-700">{selectedContract.expectedDeliveryDate ? format(selectedContract.expectedDeliveryDate, 'yyyy/MM/dd') : 'غير محدد'}</p>
                                </div>
                                {selectedContract.notes && (
                                    <div className="col-span-full border-t border-slate-100 pt-4">
                                        <p className="text-xs text-slate-400 font-bold mb-1">شروط ומلاحظات</p>
                                        <p className="text-sm font-medium text-slate-600">{selectedContract.notes}</p>
                                    </div>
                                )}
                            </div>

                            {/* Delivery Log */}
                            <div>
                                <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                        <Truck className="w-4 h-4"/>
                                    </div>
                                    السجل اللوجستي للسحب
                                </h3>
                                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                    <table className="w-full text-right text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-xs uppercase tracking-wider">
                                            <tr>
                                                <th className="px-5 py-4">التاريخ والوقت</th>
                                                <th className="px-5 py-4 text-center">الكمية المرفوعة</th>
                                                <th className="px-5 py-4 text-center">الموقف السوقي وقتها</th>
                                                <th className="px-5 py-4 text-center">تكلفة الشحن والتعتيق</th>
                                                <th className="px-5 py-4">الوجهة (إقرار استلام)</th>
                                                <th className="px-5 py-4">المستلم والمركبة</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {historicalDeliveries.filter(d => d.contractId === selectedContract.id).map(delivery => (
                                                <tr key={delivery.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-5 py-4">
                                                        <p className="font-mono text-slate-800 font-bold">{format(delivery.date, 'yyyy/MM/dd')}</p>
                                                        <p className="font-mono text-xs text-slate-400">{format(delivery.date, 'HH:mm')}</p>
                                                    </td>
                                                    <td className="px-5 py-4 text-center font-black font-mono text-emerald-600 bg-emerald-50/30 text-base">
                                                        {delivery.quantity}
                                                        {delivery.qualityGrade && <span className="block text-xs font-sans text-slate-500 font-normal mt-1 w-max mx-auto bg-slate-100 px-2 rounded-full">الفرز: {delivery.qualityGrade}</span>}
                                                    </td>
                                                    <td className="px-5 py-4 text-center font-mono font-bold text-indigo-700">{delivery.marketPriceAtDelivery.toLocaleString()}</td>
                                                    <td className="px-5 py-4 text-center">
                                                        <div className="flex flex-col gap-1 items-center">
                                                            {delivery.deliveryCost ? <span className="font-mono font-bold text-rose-600 text-xs">نولون: {(delivery.deliveryCost).toLocaleString()}</span> : null}
                                                            {delivery.handlingFees ? <span className="font-mono font-bold text-amber-600 text-xs">تعتيق: {(delivery.handlingFees).toLocaleString()}</span> : null}
                                                            {!delivery.deliveryCost && !delivery.handlingFees && <span className="text-slate-400 font-normal text-xs">-</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <p className="text-sm font-bold text-slate-700">{delivery.deliveryLocation || <span className="text-slate-400">من المخزن (Pickup)</span>}</p>
                                                        {delivery.weighbridgeTicket && <p className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1 py-0.5 mt-1 rounded w-fit border border-slate-200" title="تذكرة الميزان">⚖️ {delivery.weighbridgeTicket}</p>}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <p className="text-sm font-bold text-slate-700">{delivery.driverName || '-'}</p>
                                                        <p className="font-mono text-xs text-slate-500 mt-1">{delivery.vehiclePlate}</p>
                                                    </td>
                                                </tr>
                                            ))}
                                            {historicalDeliveries.filter(d => d.contractId === selectedContract.id).length === 0 && (
                                                <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400 font-bold text-lg">لم يتم سحب أو خروج أي كميات حتى الآن</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                        <div className="p-5 border-t border-slate-100 bg-white flex justify-between rounded-b-[2rem]">
                            <button onClick={() => {
                                setIsDetailsModalOpen(false);
                                handleDeleteContract(selectedContract.id!);
                            }} className="px-6 py-3 font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all shadow-sm flex items-center gap-2">
                                <X className="w-4 h-4"/> إلغاء وفسخ العقد
                            </button>
                            <button onClick={() => setIsDetailsModalOpen(false)} className="px-10 py-3 font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-sm">إغلاق الكشف</button>
                        </div>
                    </div>
                </div>
            )}
            {/* 5. Custom Confirmation Modal */}
            {confirmAction.isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setConfirmAction(prev => ({...prev, isOpen: false}))}></div>
                    <div className="bg-white rounded-[2rem] w-full max-w-md relative z-10 shadow-2xl p-6 text-center transform transition-all">
                        <div className={`mx-auto flex items-center justify-center h-20 w-20 rounded-full mb-6 ${
                            confirmAction.type === 'danger' ? 'bg-rose-100 text-rose-600' :
                            confirmAction.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                            'bg-indigo-100 text-indigo-600'
                        }`}>
                            {confirmAction.type === 'danger' ? <Trash2 className="h-10 w-10" /> :
                             confirmAction.type === 'warning' ? <AlertTriangle className="h-10 w-10" /> :
                             <AlertCircle className="h-10 w-10" />}
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">{confirmAction.title}</h3>
                        <p className="text-slate-500 font-medium whitespace-pre-line mb-8 leading-relaxed">
                            {confirmAction.message}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmAction(prev => ({...prev, isOpen: false}))}
                                className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                تراجع
                            </button>
                            <button
                                onClick={confirmAction.onConfirm}
                                className={`flex-1 font-bold py-3 rounded-xl text-white shadow-lg transition-all hover:-translate-y-0.5 ${
                                    confirmAction.type === 'danger' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30' :
                                    confirmAction.type === 'warning' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30' :
                                    'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
                                }`}
                            >
                                تأكيد
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
