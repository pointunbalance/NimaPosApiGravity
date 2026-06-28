import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Utensils, Users, DollarSign, TrendingUp, ChefHat, LayoutGrid, ShoppingCart, Printer, Package, UserCheck, ShieldCheck, Calculator, Store, CalendarClock, LockKeyhole, ArrowLeftRight, BarChart3, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis, CartesianGrid, Legend } from 'recharts';
import { RemoteManagementWidget } from '../../components/restaurant/RemoteManagementWidget';

export const RestaurantDashboard: React.FC = () => {
    const orders = useLiveQuery(() => db.orders.toArray()) || [];
    const tables = useLiveQuery(() => db.diningTables.toArray()) || [];
    const staff = useLiveQuery(() => db.users.filter(u => u.department === 'restaurant').toArray()) || [];
    const expenses = useLiveQuery(() => db.expenses.toArray()) || [];
    const products = useLiveQuery(() => db.products.toArray()) || [];
    const stockAdjustments = useLiveQuery(() => db.stockAdjustments.toArray()) || [];
    const voidLogs = useLiveQuery(() => db.voidLogs.toArray()) || [];

    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => o.date.toISOString().split('T')[0] === today);
    const todaySales = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    
    // KPIs Calculation
    const todayCOGS = todayOrders.reduce((sum, o) => sum + o.items.reduce((itemSum, item) => itemSum + ((item.costPrice || 0) * item.quantity), 0), 0);
    const todayExpenses = expenses.filter(e => e.date.toISOString().split('T')[0] === today && e.category === 'مشتريات/مصروفات تشغيلية').reduce((sum, e) => sum + e.amount, 0); // Simplified operational expenses
    const instantNetProfit = todaySales - todayCOGS - todayExpenses;

    const averageTicketSize = todayOrders.length > 0 ? (todaySales / todayOrders.length) : 0;
    
    const todayDineInOrders = todayOrders.filter(o => o.orderType === 'dine-in');
    const tableTurnoverRate = tables.length > 0 ? (todayDineInOrders.length / tables.length) : 0;

    const todayVoidLogs = voidLogs.filter(v => new Date(v.date).toISOString().split('T')[0] === today);
    const todayStockAdjustments = stockAdjustments.filter(a => new Date(a.date).toISOString().split('T')[0] === today);
    
    const voidWasteValue = todayVoidLogs.reduce((sum, v) => {
        const product = products.find(p => p.id === v.itemId);
        return sum + ((product?.costPrice || 0) * v.quantity);
    }, 0);
    
    const adjustmentWasteValue = todayStockAdjustments.filter(a => a.type === 'decrease' && a.reason === 'damage').reduce((sum, a) => {
         const product = products.find(p => p.id === a.productId);
         return sum + ((product?.costPrice || 0) * a.quantity);
    }, 0);

    const totalWasteValue = voidWasteValue + adjustmentWasteValue;

    const occupiedTables = tables.filter(t => t.status === 'occupied').length;

    // Advanced Data Aggregation
    // 1. Heat Map (Hourly Sales)
    const hourlyData = Array.from({ length: 24 }).map((_, i) => ({ hour: i, orders: 0, revenue: 0 }));
    todayOrders.forEach(o => {
        const h = new Date(o.date).getHours();
        hourlyData[h].orders += 1;
        hourlyData[h].revenue += o.totalAmount;
    });

    // Filtering out hours with 0 orders for a cleaner visual or just showing 9 AM to 12 AM
    const heatMapData = hourlyData.filter(d => d.hour >= 8 || d.orders > 0).map(d => ({
        time: `${d.hour}:00`,
        orders: d.orders,
        revenue: d.revenue
    }));

    // 2. Period Comparison (Last 7 Days)
    const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
            dateStr: d.toISOString().split('T')[0],
            dayName: d.toLocaleDateString('ar-EG', { weekday: 'short' }),
            sales: 0
        };
    });

    const last14Days = new Date();
    last14Days.setDate(last14Days.getDate() - 14);
    
    // We compare this week with last week (same day)
    const comparisonData = last7DaysData.map(day => {
        const currentOrders = orders.filter(o => o.date.toISOString().split('T')[0] === day.dateStr);
        const currentSales = currentOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        
        const lastWeekDate = new Date(day.dateStr);
        lastWeekDate.setDate(lastWeekDate.getDate() - 7);
        const lastWeekDateStr = lastWeekDate.toISOString().split('T')[0];
        
        const pastOrders = orders.filter(o => o.date.toISOString().split('T')[0] === lastWeekDateStr);
        const pastSales = pastOrders.reduce((sum, o) => sum + o.totalAmount, 0);

        return {
            name: day.dayName,
            'هذا الأسبوع': currentSales,
            'الأسبوع الماضي': pastSales
        };
    });

    // 3. ABC Analysis
    const itemAnalysis: Record<string, { qty: number, revenue: number, cost: number }> = {};
    orders.forEach(o => {
        o.items.forEach(item => {
            if (!itemAnalysis[item.name]) itemAnalysis[item.name] = { qty: 0, revenue: 0, cost: 0 };
            itemAnalysis[item.name].qty += item.quantity;
            itemAnalysis[item.name].revenue += (item.price * item.quantity);
            itemAnalysis[item.name].cost += ((item.costPrice || 0) * item.quantity);
        });
    });

    const abcData = Object.entries(itemAnalysis).map(([name, data]) => {
        const profit = data.revenue - data.cost;
        const profitMargin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;
        
        let category = 'Dogs (خاسرة)';
        let color = '#C7D2FE'; // soft lavender
        if (data.qty > 10 && profitMargin > 40) {
            category = 'Stars (نجوم)';
            color = '#312E81'; // deep royal indigo
        } else if (data.qty > 20 && profitMargin <= 40) {
            category = 'Workhorses (حصان)';
            color = '#6366F1'; // primary indigo
        }

        return {
            name,
            qty: data.qty,
            profit,
            profitMargin,
            revenue: data.revenue,
            category,
            fill: color
        };
    }).sort((a,b) => b.revenue - a.revenue).slice(0, 30); // Top 30 items

    // Top Sold Items (Menu analysis)
    const itemSales: Record<string, { qty: number, revenue: number }> = {};
    todayOrders.forEach(o => {
        o.items.forEach(item => {
            if (!itemSales[item.name]) itemSales[item.name] = { qty: 0, revenue: 0 };
            itemSales[item.name].qty += item.quantity;
            itemSales[item.name].revenue += (item.price * item.quantity);
        });
    });

    const topItemsData = Object.entries(itemSales)
        .map(([name, data]) => ({ name, qty: data.qty, revenue: data.revenue }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);

    const modules = [
        {
            title: "Sales Module",
            subtitle: "إدارة البيع المباشر",
            icon: <ShoppingCart className="w-6 h-6 text-indigo-600" />,
            bgColor: "bg-indigo-50",
            borderColor: "border-indigo-100",
            links: [
                { name: "POS (نقطة البيع)", path: "/restaurant-pos" },
                { name: "Tables Map (الطاولات)", path: "/tables" },
                { name: "Order Tracking (تتبع الطلبات)", path: "/delivery" }
            ]
        },
        {
            title: "Kitchen Module",
            subtitle: "توجيه وتحضير الطعام",
            icon: <ChefHat className="w-6 h-6 text-orange-600" />,
            bgColor: "bg-orange-50",
            borderColor: "border-orange-100",
            links: [
                { name: "KDS (شاشة المطبخ)", path: "/kitchen" },
                { name: "Printer Router (توجيه الطابعات)", path: "/admin/pos-terminals" }
            ]
        },
        {
            title: "Inventory Module",
            subtitle: "التحكم في المخازن",
            icon: <Package className="w-6 h-6 text-emerald-600" />,
            bgColor: "bg-emerald-50",
            borderColor: "border-emerald-100",
            links: [
                { name: "Items (الأصناف)", path: "/restaurant/inventory" },
                { name: "Recipes (الوصفات)", path: "/recipes" },
                { name: "Suppliers (الموردين)", path: "/suppliers" },
                { name: "Wastage (الهالك)", path: "/stock-adjustments" }
            ]
        },
        {
            title: "HR Module",
            subtitle: "إدارة الموظفين",
            icon: <Users className="w-6 h-6 text-blue-600" />,
            bgColor: "bg-blue-50",
            borderColor: "border-blue-100",
            links: [
                { name: "Attendance (الحضور)", path: "/attendance" },
                { name: "Shift Log (الورديات)", path: "/shifts" },
                { name: "Permissions (الصلاحيات)", path: "/role-management" }
            ]
        },
        {
            title: "Accounting Module",
            subtitle: "الأمور المالية",
            icon: <Calculator className="w-6 h-6 text-purple-600" />,
            bgColor: "bg-purple-50",
            borderColor: "border-purple-100",
            links: [
                { name: "Expenses (المصروفات)", path: "/expenses" },
                { name: "Daily Close (إقفال اليومية)", path: "/accounting/closing" },
                { name: "Tax Reports (الضرائب)", path: "/accounting/tax" }
            ]
        }
    ];

    return (
        <div className="p-6 pb-[32px] space-y-6 text-right min-h-screen bg-[#F4F5F7]" dir="rtl" style={{ paddingBottom: '32px', backgroundColor: '#F4F5F7' }}>
            <h1 className="text-2xl font-black text-[#111827] flex items-center gap-3 mb-[20px]" style={{ marginBottom: '20px' }}>
                <Utensils className="w-8 h-8 text-orange-600" />
                هيكلة وترتيب النظام (Restaurant Services Structure)
            </h1>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-[16px]">
                {modules.map((mod, idx) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: idx * 0.1 }}
                        key={idx} 
                        className={`p-5 bg-white rounded-2xl border border-[#E4E7EB] shadow-sm hover:shadow-md transition-shadow flex flex-col`}
                    >
                        <div className="flex items-center gap-3 mb-[8px]" style={{ marginBottom: '8px' }}>
                            <div className={`p-3 rounded-xl ${mod.bgColor}`}>
                                {mod.icon}
                            </div>
                            <div>
                                <h3 className="font-bold text-[#111827] leading-tight mb-[4px]">{mod.title}</h3>
                                <div className="text-xs font-bold text-[#6B7280]">{mod.subtitle}</div>
                            </div>
                        </div>
                        <div className="flex-1 mt-2 flex flex-col gap-[10px]">
                            {mod.links.map((link, lidx) => (
                                <Link 
                                    key={lidx} 
                                    to={link.path}
                                    className={`block text-sm font-bold p-2 px-3 rounded-lg border border-[#E4E7EB] hover:border-indigo-200 hover:bg-slate-50 text-[#4B5563] hover:text-indigo-700 transition-all text-right`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>

            <div style={{ margin: '24px 0' }}>
                <RemoteManagementWidget />
            </div>

            <h2 className="text-xl font-bold text-[#111827] mt-8 mb-[16px]">مؤشرات الأداء اللحظية (KPIs)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px]">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-[#E4E7EB] shadow-sm relative overflow-hidden" style={{ padding: '16px 20px' }}>
                    <div className="absolute top-0 right-0 bg-[#E6F4EA] text-[#137333] text-[10px] font-bold px-2 py-1 rounded-bl-xl">صافي الأرباح اللحظي</div>
                    <div className="flex justify-between items-start mb-4 mt-[24px]" style={{ marginTop: '24px' }}>
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="text-sm font-bold text-[#4B5563] mb-1">الأرباح (مبيعات - تكلفة)</div>
                    <div className={`text-2xl font-black ${instantNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{instantNetProfit.toLocaleString()} <span className="text-sm font-bold">ج.م</span></div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-[#E4E7EB] shadow-sm relative overflow-hidden" style={{ padding: '16px 20px' }}>
                    <div className="absolute top-0 right-0 bg-[#E8F0FE] text-[#1A73E8] text-[10px] font-bold px-2 py-1 rounded-bl-xl">متوسط قيمة الفاتورة</div>
                    <div className="flex justify-between items-start mb-4 mt-[24px]" style={{ marginTop: '24px' }}>
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="text-sm font-bold text-[#4B5563] mb-1">(Average Ticket Size)</div>
                    <div className="text-2xl font-black text-[#111827]">{Math.round(averageTicketSize).toLocaleString()} <span className="text-sm font-bold text-[#4B5563]">ج.م/طلب</span></div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-[#E4E7EB] shadow-sm relative overflow-hidden" style={{ padding: '16px 20px' }}>
                    <div className="absolute top-0 right-0 bg-[#E8F0FE] text-[#1A73E8] text-[10px] font-bold px-2 py-1 rounded-bl-xl">معدل دوران الطاولات</div>
                    <div className="flex justify-between items-start mb-4 mt-[24px]" style={{ marginTop: '24px' }}>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <ArrowLeftRight className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="text-sm font-bold text-[#4B5563] mb-1">(Table Turnover Rate)</div>
                    <div className="text-2xl font-black text-[#111827]">{tableTurnoverRate.toFixed(1)} <span className="text-sm text-blue-500">مرات/يوم</span></div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl border border-[#E4E7EB] shadow-sm relative overflow-hidden" style={{ padding: '16px 20px' }}>
                    <div className="absolute top-0 right-0 bg-[#FCE8E6] text-[#C5221F] text-[10px] font-bold px-2 py-1 rounded-bl-xl">إجمالي الهالك المالي</div>
                    <div className="flex justify-between items-start mb-4 mt-[24px]" style={{ marginTop: '24px' }}>
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shadow-sm">
                            <i className="not-italic text-2xl w-6 h-6 flex items-center justify-center">🗑️</i>
                        </div>
                    </div>
                    <div className="text-sm font-bold text-rose-800 mb-1">قيمة المفقود والتالف اليوم</div>
                    <div className="text-2xl font-black text-[#C5221F]">{totalWasteValue.toLocaleString()} <span className="text-sm font-bold">ج.م</span></div>
                </motion.div>
                
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-[#E4E7EB] shadow-sm" style={{ padding: '16px 20px' }}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
                            <Store className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="text-sm font-bold text-[#4B5563] mb-1">إجمالي المبيعات</div>
                    <div className="text-2xl font-black text-[#111827]">{todaySales.toLocaleString()}</div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-[#E4E7EB] shadow-sm" style={{ padding: '16px 20px' }}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                            <ChefHat className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="text-sm font-bold text-[#4B5563] mb-1">طلبات المطبخ اليوم</div>
                    <div className="text-2xl font-black text-[#111827]">{todayOrders.length}</div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-[#E4E7EB] shadow-sm" style={{ padding: '16px 20px' }}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <LayoutGrid className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="text-sm font-bold text-[#4B5563] mb-1">الطاولات المشغولة حالياً</div>
                    <div className="text-2xl font-black text-[#111827]">{occupiedTables} <span className="text-sm text-slate-400">/ {tables.length}</span></div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl border border-[#E4E7EB] shadow-sm" style={{ padding: '16px 20px' }}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="text-sm font-bold text-[#4B5563] mb-1">موظفين المطعم</div>
                    <div className="text-2xl font-black text-[#111827]">{staff.length}</div>
                </motion.div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1.5fr_1fr] gap-[20px]">
                <div className="bg-white p-6 rounded-2xl border border-[#E4E7EB] shadow-sm lg:col-span-1 border-t-4 border-t-orange-500 flex flex-col justify-between">
                    <h3 className="font-bold text-[#111827] mb-4 border-b border-[#E4E7EB] pb-2 flex items-center justify-between">
                        <span>الخريطة الحرارية (Heat Map)</span>
                        <span className="text-xs font-normal text-[#6B7280] bg-slate-100 px-2 py-1 rounded-md">الأكثر إشغالاً وطلباً</span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-[12px]">
                        {tables.map(t => {
                            const activeOrderForTable = orders.find(o => o.tableNumber === t.name && (o.fulfillmentStatus === 'pending' || o.fulfillmentStatus === 'preparing' || o.fulfillmentStatus === 'ready'));
                            
                            let styleObj = {};
                            if (t.status === 'requesting_bill') {
                                styleObj = { backgroundColor: '#FEF7E0', color: '#B06000', borderColor: '#FDE293' };
                            } else if (t.status === 'occupied') {
                                styleObj = { backgroundColor: '#FFEFE3', color: '#B06000', borderColor: '#FAD2B2' };
                            } else {
                                styleObj = { backgroundColor: '#E6F4EA', color: '#137333', borderColor: '#C4EAD3' };
                            }
                            
                            return (
                                <div key={t.id} style={styleObj} className="p-4 rounded-xl border flex flex-col items-center justify-center w-24 h-24 transition-all">
                                    <div className="font-black text-lg">{t.name}</div>
                                    <div className="text-xs font-bold mt-1 text-center leading-tight">
                                        {t.status === 'requesting_bill' ? 'طلب الفاتورة' : t.status === 'occupied' ? (activeOrderForTable ? `${activeOrderForTable.totalAmount.toLocaleString()}` : 'مشغولة') : 'متاحة'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-2xl border border-[#E4E7EB] shadow-sm border-t-4 border-t-blue-500 flex flex-col justify-between">
                    <h3 className="font-bold text-[#111827] mb-4 border-b border-[#E4E7EB] pb-2 flex items-center justify-between shrink-0">
                        <span>مؤشر أداء الموظفين</span>
                        <span className="text-xs font-normal text-[#6B7280] bg-slate-100 px-2 py-1 rounded-md">اليوم</span>
                    </h3>
                    <div className="space-y-4 flex-1 flex flex-col justify-center">
                        {/* Calculate simple metrics locally for illustration */}
                        {(() => {
                            const userSales: Record<number, number> = {};
                            const userOrderCount: Record<number, number> = {};
                            todayOrders.forEach(o => {
                                if (o.userId) {
                                    userSales[o.userId] = (userSales[o.userId] || 0) + o.totalAmount;
                                    userOrderCount[o.userId] = (userOrderCount[o.userId] || 0) + 1;
                                }
                            });
                            
                            const topCashierId = Object.keys(userSales).sort((a,b) => userSales[Number(b)] - userSales[Number(a)])[0];
                            const topCashier = staff.find(u => u.id === Number(topCashierId));
                            
                            const topWaiterId = Object.keys(userOrderCount).sort((a,b) => userOrderCount[Number(b)] - userOrderCount[Number(a)])[0];
                            const topWaiter = staff.find(u => u.id === Number(topWaiterId));
 
                            return (
                                <>
                                    <div className="flex items-center gap-4 p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">أعلى Up-selling</div>
                                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
                                            {topCashier ? topCashier.name.charAt(0).toUpperCase() : '؟'}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-[#4B5563]">نجم الكاشير</div>
                                            <div className="font-black text-[#111827] text-lg">{topCashier ? topCashier.name : 'لا يوجد مبيعات'}</div>
                                            {topCashier && <div className="text-xs text-indigo-600 font-bold mt-0.5">مبيعات: {userSales[Number(topCashierId)].toLocaleString()}</div>}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">الويتر الأسرع والأكثر نشاطاً</div>
                                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xl">
                                            {topWaiter ? topWaiter.name.charAt(0).toUpperCase() : '؟'}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-[#4B5563]">نجم الصالة</div>
                                            <div className="font-black text-[#111827] text-lg">{topWaiter ? topWaiter.name : 'لا يوجد طلبات'}</div>
                                            {topWaiter && <div className="text-xs text-emerald-600 font-bold mt-0.5">خدمة: {userOrderCount[Number(topWaiterId)]} طاولات/طلبات</div>}
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
 
                <div className="bg-white p-6 rounded-2xl border border-[#E4E7EB] shadow-sm border-t-4 border-t-emerald-500 flex flex-col justify-between">
                    <h3 className="font-bold text-[#111827] mb-4 border-b border-[#E4E7EB] pb-2 shrink-0">الأصناف الأكثر مبيعاً اليوم</h3>
                    <div className="space-y-4 flex-1 flex flex-col justify-center">
                        {topItemsData.map((item, i) => (
                            <div key={i} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[#4B5563] text-xs shrink-0">
                                        #{i+1}
                                    </div>
                                    <div className="font-bold text-[#111827]">{item.name}</div>
                                </div>
                                <div className="text-left shrink-0">
                                    <div className="font-black text-emerald-600">{item.qty} وحدة</div>
                                </div>
                            </div>
                        ))}
                        {topItemsData.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 px-4 text-center text-[#6B7280] font-bold bg-slate-50/50 rounded-xl border border-dashed border-[#E4E7EB] min-h-[160px] my-auto">
                                <span className="text-2xl mb-2">🍽️</span>
                                <div>لم يتم بيع أصناف اليوم</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
 
            <h2 className="text-xl font-bold text-[#111827] flex items-center gap-2" style={{ marginTop: '32px', marginBottom: '24px' }}>
                <BarChart3 className="w-6 h-6 text-indigo-600" />
                التحليلات البصرية المتقدمة (Visual Analytics)
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[20px]">
                
                {/* 1. Heat Map Time */}
                <div className="bg-white p-6 pb-[32px] rounded-2xl border border-[#E4E7EB] shadow-sm">
                    <h3 className="font-bold text-[#111827] mb-4 border-b border-[#E4E7EB] pb-2 flex items-center justify-between">
                        <span>مخطط ذروة العمل (Heat Map Time)</span>
                        <span className="text-xs font-normal text-[#6B7280] bg-slate-100 px-2 py-1 rounded-md">مبيعات اليوم بالساعة</span>
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={heatMapData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '10px' }} />
                                <Bar dataKey="orders" name="عدد الطلبات" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
 
                {/* 2. Period Comparison */}
                <div className="bg-white p-6 pb-[32px] rounded-2xl border border-[#E4E7EB] shadow-sm">
                    <h3 className="font-bold text-[#111827] mb-4 border-b border-[#E4E7EB] pb-2 flex items-center justify-between">
                        <span>مقارنة المبيعات (Period Comparison)</span>
                        <span className="text-xs font-normal text-[#6B7280] bg-slate-100 px-2 py-1 rounded-md">الأسبوع الحالي مقابل الماضي</span>
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '10px' }} />
                                <Legend />
                                <Bar dataKey="هذا الأسبوع" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="الأسبوع الماضي" fill="#c7d2fe" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
 
                {/* 3. ABC Analysis */}
                <div className="bg-white p-6 pb-[32px] rounded-2xl border border-[#E4E7EB] shadow-sm lg:col-span-2">
                    <h3 className="font-bold text-[#111827] mb-4 border-b border-[#E4E7EB] pb-2 flex items-center justify-between">
                        <span>تحليل الأصناف (ABC Analysis)</span>
                        <span className="text-xs font-normal text-[#6B7280] bg-slate-100 px-2 py-1 rounded-md">النجوم، الحصان، الخاسرة</span>
                    </h3>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 32, right: 32, bottom: 32, left: 32 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" dataKey="qty" name="الكمية المباعة" />
                                <YAxis type="number" dataKey="profitMargin" name="هامش الربح %" unit="%" />
                                <ZAxis type="number" dataKey="revenue" range={[100, 1000]} name="العوائد" />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} 
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-white p-3 border border-[#E4E7EB] shadow-lg rounded-xl">
                                                    <p className="font-bold text-[#111827] mb-1">{data.name}</p>
                                                    <p className="text-sm text-[#4B5563]">الفئة: <span className="font-bold" style={{color: data.fill}}>{data.category}</span></p>
                                                    <p className="text-sm text-[#4B5563]">الكمية المباعة: {data.qty}</p>
                                                    <p className="text-sm text-[#4B5563]">هامش الربح: {data.profitMargin.toFixed(1)}%</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Scatter name="الأصناف" data={abcData} fill="#8884d8">
                                    {abcData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>
 
            </div>
        </div>
    );
};
