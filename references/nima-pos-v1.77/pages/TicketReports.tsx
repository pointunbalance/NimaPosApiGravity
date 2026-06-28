import React, { useState, useEffect } from 'react';
import { 
    BarChart3, Calendar, Download, Filter, TrendingUp, PieChart as PieChartIcon, 
    Activity, FileText, Bus, DollarSign, ArrowDownRight, ArrowUpRight, Calculator
} from 'lucide-react';
import { db } from '../db';
import { TicketBooking, TicketTripSchedule, User as DBUser, TicketRoute, FinancialVoucher, TicketVendor } from '../types';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const TicketReports = () => {
    const [activeTab, setActiveTab] = useState<'sales' | 'operations' | 'cashflow' | 'vendors' | 'refunds'>('sales');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    
    // Data states
    const [bookings, setBookings] = useState<TicketBooking[]>([]);
    const [trips, setTrips] = useState<TicketTripSchedule[]>([]);
    const [routes, setRoutes] = useState<TicketRoute[]>([]);
    const [users, setUsers] = useState<DBUser[]>([]);
    const [vouchers, setVouchers] = useState<FinancialVoucher[]>([]);
    const [vendors, setVendors] = useState<TicketVendor[]>([]);

    useEffect(() => {
        // Set default date range to current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        setDateRange({
            start: startOfMonth.toISOString().split('T')[0],
            end: now.toISOString().split('T')[0]
        });
        loadData();
    }, []);

    const loadData = async () => {
        const [b, t, r, u, v, vndrs] = await Promise.all([
            db.ticketBookings.toArray(),
            db.ticketTripSchedules.toArray(),
            db.ticketRoutes.toArray(),
            db.users.toArray(),
            db.financialVouchers.toArray(),
            db.ticketVendors.toArray()
        ]);
        setBookings(b);
        setTrips(t);
        setRoutes(r);
        setUsers(u);
        setVouchers(v);
        setVendors(vndrs);
    };

    // Filters
    const filteredBookings = bookings.filter(b => {
        if (!b.createdAt) return false;
        const bDate = new Date(b.createdAt).toISOString().split('T')[0];
        if (dateRange.start && bDate < dateRange.start) return false;
        if (dateRange.end && bDate > dateRange.end) return false;
        return true;
    });

    const confirmedBookings = filteredBookings.filter(b => b.status === 'confirmed');

    // --- Sales Report Logic ---
    const totalSales = confirmedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const totalTickets = confirmedBookings.reduce((sum, b) => sum + (b.passengers || 1), 0);
    
    // Sales by Payment Method
    const salesByPaymentMethod = confirmedBookings.reduce((acc: any, b) => {
        const method = b.paymentMethod || 'cash';
        acc[method] = (acc[method] || 0) + (b.totalAmount || 0);
        return acc;
    }, {});
    const paymentChartData = [
        { name: 'كاش', value: salesByPaymentMethod['cash'] || 0 },
        { name: 'فيزا', value: salesByPaymentMethod['card'] || 0 },
        { name: 'بنكي', value: salesByPaymentMethod['bank'] || 0 },
    ].filter(d => d.value > 0);

    // Sales by Day
    const salesByDayRaw = confirmedBookings.reduce((acc: any, b) => {
        if (!b.createdAt) return acc;
        const date = new Date(b.createdAt).toLocaleDateString('ar-EG');
        acc[date] = (acc[date] || 0) + (b.totalAmount || 0);
        return acc;
    }, {});
    const salesByDayChartData = Object.keys(salesByDayRaw).map(date => ({
        date,
        'المبيعات': salesByDayRaw[date]
    }));

    // --- Operational Report Logic ---
    // Calculate trip occupancy
    const tripOccupancy = trips.map(trip => {
        const route = routes.find(r => r.id === trip.routeId);
        const tripBookings = filteredBookings.filter(b => b.tripId === trip.id && b.status === 'confirmed');
        const bookedSeats = tripBookings.reduce((sum, b) => sum + (b.passengers || 1), 0);
        // Assuming average capacity if not strictly linked to vehicle (e.g. 50 seats)
        const capacity = 50; 
        const occupancyRate = capacity > 0 ? (bookedSeats / capacity) * 100 : 0;
        return {
            ...trip,
            routeName: route ? `${route.source} - ${route.destination}` : 'غير محدد',
            bookedSeats,
            occupancyRate,
            revenue: tripBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)
        };
    }).filter(t => t.bookedSeats > 0); // Only trips that had bookings in this period

    const highestOccupancy = [...tripOccupancy].sort((a,b) => b.occupancyRate - a.occupancyRate).slice(0, 5);
    const lowestOccupancy = [...tripOccupancy].sort((a,b) => a.occupancyRate - b.occupancyRate).slice(0, 5);
    const cancelledTripsCount = filteredBookings.filter(b => b.status === 'cancelled').length;

    // --- Cashflow & Agency Profit Logic ---
    const agencyCommissions = confirmedBookings.reduce((sum, b) => sum + (((b as any).expectedCommission || 0) * (b.passengers || 1)), 0);
    const totalVendorPayables = confirmedBookings.filter(b => b.vendorId).reduce((sum, b) => sum + ((b.totalAmount || 0) - (((b as any).expectedCommission || 0) * (b.passengers || 1))), 0);
    
    // Operational Expenses from Vouchers
    const operationalExpenses = vouchers.filter(v => {
        if (v.type !== 'payment') return false;
        if (!v.date) return false;
        const vDate = new Date(v.date).toISOString().split('T')[0];
        if (dateRange.start && vDate < dateRange.start) return false;
        if (dateRange.end && vDate > dateRange.end) return false;
        // Exclude ticket vendor payments from operational expenses to avoid double counting if they record vendor payouts as vouchers
        if (v.category && v.category.includes('تسديد شركة')) return false; 
        return true;
    });
    
    const totalOperationalExpenses = operationalExpenses.reduce((sum, v) => sum + v.amount, 0);
    const agencyNetProfit = agencyCommissions - totalOperationalExpenses;

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-indigo-600" />
                        التقارير والإحصائيات
                    </h1>
                    <p className="text-slate-500 font-medium mt-2">تحليل المبيعات، ومراقبة التشغيل، والتقارير الضريبية المتقدمة</p>
                </div>
                <div className="flex bg-white p-2 rounded-xl border border-slate-200 shadow-sm items-center gap-3">
                    <Calendar className="w-5 h-5 text-slate-400 ml-2" />
                    <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="bg-transparent font-bold outline-none text-sm text-slate-700" />
                    <span className="text-slate-400">إلى</span>
                    <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="bg-transparent font-bold outline-none text-sm text-slate-700" />
                </div>
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-xl mb-6 overflow-x-auto w-full">
                <button
                    onClick={() => setActiveTab('sales')}
                    className={`flex-1 min-w-[150px] font-bold py-2.5 rounded-lg transition-all text-sm flex justify-center items-center gap-2 ${activeTab === 'sales' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                >
                    <TrendingUp className="w-4 h-4"/> تقارير المبيعات
                </button>
                <button
                    onClick={() => setActiveTab('operations')}
                    className={`flex-1 min-w-[150px] font-bold py-2.5 rounded-lg transition-all text-sm flex justify-center items-center gap-2 ${activeTab === 'operations' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                >
                    <Bus className="w-4 h-4"/> تقارير التشغيل
                </button>
                <button
                    onClick={() => setActiveTab('cashflow')}
                    className={`flex-1 min-w-[150px] font-bold py-2.5 rounded-lg transition-all text-sm flex justify-center items-center gap-2 ${activeTab === 'cashflow' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                >
                    <Calculator className="w-4 h-4"/> الأرباح الحقيقية
                </button>
                <button
                    onClick={() => setActiveTab('vendors')}
                    className={`flex-1 min-w-[150px] font-bold py-2.5 rounded-lg transition-all text-sm flex justify-center items-center gap-2 ${activeTab === 'vendors' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                >
                    <Activity className="w-4 h-4"/> أداء الشركات
                </button>
                <button
                    onClick={() => setActiveTab('refunds')}
                    className={`flex-1 min-w-[150px] font-bold py-2.5 rounded-lg transition-all text-sm flex justify-center items-center gap-2 ${activeTab === 'refunds' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                >
                    <FileText className="w-4 h-4"/> التذاكر الملغاة (Refunds)
                </button>
            </div>

            {/* Sales Tab */}
            {activeTab === 'sales' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600"><DollarSign className="w-8 h-8" /></div>
                            <div>
                                <p className="text-slate-500 font-bold text-sm">إجمالي المبيعات المكتملة</p>
                                <h3 className="text-2xl font-black text-slate-800 mt-1">{totalSales.toLocaleString()} ج.م</h3>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600"><FileText className="w-8 h-8" /></div>
                            <div>
                                <p className="text-slate-500 font-bold text-sm">إجمالي عمليات الحجز</p>
                                <h3 className="text-2xl font-black text-slate-800 mt-1">{confirmedBookings.length} عملية</h3>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="bg-amber-50 p-4 rounded-2xl text-amber-600"><BarChart3 className="w-8 h-8" /></div>
                            <div>
                                <p className="text-slate-500 font-bold text-sm">إجمالي التذاكر المصدرة</p>
                                <h3 className="text-2xl font-black text-slate-800 mt-1">{totalTickets} تذكرة</h3>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-indigo-500"/> منحنى المبيعات اليومية</h3>
                            <div className="h-80 w-full" dir="ltr">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={salesByDayChartData}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                                        <XAxis dataKey="date" tick={{fontSize: 12}} />
                                        <YAxis tick={{fontSize: 12}} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="المبيعات" stroke="#4f46e5" strokeWidth={3} dot={{r: 4}} activeDot={{r: 8}} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><PieChartIcon className="w-5 h-5 text-indigo-500"/> الإيرادات حسب طريقة الدفع</h3>
                            <div className="h-64 w-full" dir="ltr">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={paymentChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {paymentChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `${value.toLocaleString()} ج.م`} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Operations Tab */}
            {activeTab === 'operations' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="bg-blue-50 p-4 rounded-2xl text-blue-600"><Bus className="w-8 h-8" /></div>
                            <div>
                                <p className="text-slate-500 font-bold text-sm">إجمالي الرحلات المسيرة</p>
                                <h3 className="text-2xl font-black text-slate-800 mt-1">{tripOccupancy.length} رحلة</h3>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600"><Activity className="w-8 h-8" /></div>
                            <div>
                                <p className="text-slate-500 font-bold text-sm">متوسط نسبة الإشغال</p>
                                <h3 className="text-2xl font-black text-slate-800 mt-1">
                                    {tripOccupancy.length > 0 ? Math.round(tripOccupancy.reduce((acc, t) => acc + t.occupancyRate, 0) / tripOccupancy.length) : 0}%
                                </h3>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="bg-rose-50 p-4 rounded-2xl text-rose-600"><ArrowDownRight className="w-8 h-8" /></div>
                            <div>
                                <p className="text-slate-500 font-bold text-sm">الحجوزات الملغاة</p>
                                <h3 className="text-2xl font-black text-slate-800 mt-1">{cancelledTripsCount} حجز</h3>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><ArrowUpRight className="w-5 h-5 text-emerald-500"/> أعلى الرحلات إشغالاً وربحية</h3>
                            <div className="space-y-4">
                                {highestOccupancy.map((t, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <div>
                                            <div className="font-bold text-slate-800">{t.routeName}</div>
                                            <div className="text-xs text-slate-500 mt-1 font-mono">{t.tripCode}</div>
                                        </div>
                                        <div className="text-left">
                                            <div className="font-black text-emerald-600 mb-1">{Math.round(t.occupancyRate)}% إشغال</div>
                                            <div className="text-xs font-bold text-slate-500">{t.revenue.toLocaleString()} ج.م</div>
                                        </div>
                                    </div>
                                ))}
                                {highestOccupancy.length === 0 && <p className="text-slate-500 text-sm text-center p-4">لا توجد بيانات تشغيل كافية</p>}
                            </div>
                        </div>
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><ArrowDownRight className="w-5 h-5 text-rose-500"/> أدنى الرحلات إشغالاً</h3>
                            <div className="space-y-4">
                                {lowestOccupancy.map((t, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-rose-50/30 p-3 rounded-xl border border-rose-100/50">
                                        <div>
                                            <div className="font-bold text-slate-800">{t.routeName}</div>
                                            <div className="text-xs text-slate-500 mt-1 font-mono">{t.tripCode}</div>
                                        </div>
                                        <div className="text-left">
                                            <div className="font-black text-rose-600 mb-1">{Math.round(t.occupancyRate)}% إشغال</div>
                                            <div className="text-xs font-bold text-slate-500">{t.revenue.toLocaleString()} ج.م</div>
                                        </div>
                                    </div>
                                ))}
                                {lowestOccupancy.length === 0 && <p className="text-slate-500 text-sm text-center p-4">لا توجد بيانات تشغيل كافية</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cashflow & Agency Profits Tab */}
            {activeTab === 'cashflow' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-indigo-600 p-6 rounded-3xl shadow-lg shadow-indigo-200 text-white flex flex-col justify-center">
                            <p className="text-indigo-100 font-bold text-sm mb-2">إجمالي المبيعات (حجم العمل)</p>
                            <h3 className="text-3xl font-black">{totalSales.toLocaleString()} ج.م</h3>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
                            <p className="text-slate-500 font-bold text-sm mb-2">مستحقات شركات النقل</p>
                            <h3 className="text-2xl font-black text-rose-600">{(totalVendorPayables + confirmedBookings.filter(b => !b.vendorId).reduce((sum, b) => sum + ((b.totalAmount || 0) - (((b as any).expectedCommission || 0) * (b.passengers || 1))), 0)).toLocaleString()} ج.م</h3>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
                            <p className="text-slate-500 font-bold text-sm mb-2">أرباح المحل (إجمالي العمولات)</p>
                            <h3 className="text-2xl font-black text-emerald-600">{agencyCommissions.toLocaleString()} ج.م</h3>
                            <p className="text-xs text-slate-400 mt-1 font-bold">قبل خصم المصروفات التشغيلية</p>
                        </div>
                        <div className="bg-emerald-600 p-6 rounded-3xl shadow-lg shadow-emerald-200 text-white flex flex-col justify-center">
                            <p className="text-emerald-100 font-bold text-sm mb-2">مكسبك الصافي</p>
                            <h3 className="text-3xl font-black">{agencyNetProfit.toLocaleString()} ج.م</h3>
                            <p className="text-xs text-emerald-200 mt-1 font-bold">بعد خصم المصروفات التشغيلية</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Calculator className="w-5 h-5 text-rose-500"/> تقرير المصروفات التشغيلية للمحل</h3>
                            <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-bold flex items-center gap-2 transition text-sm">
                                <Download className="w-4 h-4"/> تصدير Excel
                            </button>
                        </div>
                        
                        {/* Summary of Expenses Categories */}
                        <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
                            {Object.entries(operationalExpenses.reduce((acc: any, v) => {
                                const cat = v.category || 'مصروفات عامة';
                                acc[cat] = (acc[cat] || 0) + v.amount;
                                return acc;
                            }, {})).map(([cat, amount]: [string, any]) => (
                                <div key={cat} className="bg-rose-50 px-4 py-3 rounded-xl border border-rose-100 whitespace-nowrap min-w-[150px]">
                                    <p className="text-slate-500 text-xs font-bold mb-1">{cat}</p>
                                    <p className="text-rose-700 font-black text-lg">{amount.toLocaleString()} ج.م</p>
                                </div>
                            ))}
                            <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 whitespace-nowrap min-w-[150px]">
                                <p className="text-slate-500 text-xs font-bold mb-1">إجمالي المصروفات</p>
                                <p className="text-slate-800 font-black text-lg">{totalOperationalExpenses.toLocaleString()} ج.م</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-right whitespace-nowrap">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-slate-500 font-bold text-sm">التاريخ</th>
                                        <th className="px-4 py-3 text-slate-500 font-bold text-sm">بند المصرف (التصنيف)</th>
                                        <th className="px-4 py-3 text-slate-500 font-bold text-sm">البيان / التفاصيل</th>
                                        <th className="px-4 py-3 text-slate-500 font-bold text-sm">المسجل / المستلم</th>
                                        <th className="px-4 py-3 text-slate-500 font-bold text-sm">القيمة المخصومة</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {operationalExpenses.map(v => (
                                        <tr key={v.id} className="hover:bg-slate-50 transition">
                                            <td className="px-4 py-4 text-slate-600 font-bold">{v.date ? new Date(v.date).toLocaleDateString('ar-EG') : '-'}</td>
                                            <td className="px-4 py-4 font-bold text-slate-700">
                                                <span className="bg-slate-100 px-2 py-1 rounded text-xs">
                                                    {v.category || 'مصروفات عامة'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-slate-700">{v.description}</td>
                                            <td className="px-4 py-4 text-slate-600">{v.partyName || '-'}</td>
                                            <td className="px-4 py-4 text-rose-600 font-black">{v.amount.toLocaleString()} ج.م</td>
                                        </tr>
                                    ))}
                                    {operationalExpenses.length === 0 && (
                                        <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-bold">لا يوجد مصروفات تشغيلية مسجلة في هذه الفترة</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Vendors Tab */}
            {activeTab === 'vendors' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-500"/> تقرير الشركات الأكثر مبيعاً وعمولات</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-right whitespace-nowrap">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-4 text-slate-500 font-bold text-sm">كود الشركة</th>
                                    <th className="px-4 py-4 text-slate-500 font-bold text-sm">اسم شركة النقل</th>
                                    <th className="px-4 py-4 text-slate-500 font-bold text-sm text-center">التذاكر المباعة</th>
                                    <th className="px-4 py-4 text-slate-500 font-bold text-sm text-emerald-600">إجمالي المبيعات للشركة</th>
                                    <th className="px-4 py-4 text-slate-500 font-bold text-base text-indigo-600">صافي العمولات (أرباح المحل)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {vendors.sort((a,b) => {
                                    const aBookings = confirmedBookings.filter(bk => bk.vendorId === a.id);
                                    const bBookings = confirmedBookings.filter(bk => bk.vendorId === b.id);
                                    const aCommission = aBookings.reduce((sum, bk) => sum + ((bk as any).expectedCommission || 0) * (bk.passengers || 1), 0);
                                    const bCommission = bBookings.reduce((sum, bk) => sum + ((bk as any).expectedCommission || 0) * (bk.passengers || 1), 0);
                                    return bCommission - aCommission;
                                }).map(v => {
                                    const vendorBookings = confirmedBookings.filter(bk => bk.vendorId === v.id);
                                    const ticketsSold = vendorBookings.reduce((sum, bk) => sum + (bk.passengers || 1), 0);
                                    const totalSalesValue = vendorBookings.reduce((sum, bk) => sum + (bk.totalAmount || 0), 0);
                                    const totalCommission = vendorBookings.reduce((sum, bk) => sum + ((bk as any).expectedCommission || 0) * (bk.passengers || 1), 0);

                                    return (
                                        <tr key={v.id} className="hover:bg-slate-50 transition">
                                            <td className="px-4 py-4 text-slate-400 font-black uppercase text-sm">{v.vendorCode || '-'}</td>
                                            <td className="px-4 py-4 font-black text-slate-800 text-lg">{v.name}</td>
                                            <td className="px-4 py-4 text-center font-bold text-slate-700 bg-slate-50/50">{ticketsSold}</td>
                                            <td className="px-4 py-4 font-black text-emerald-600">
                                                {totalSalesValue.toLocaleString()} ج.م
                                            </td>
                                            <td className="px-4 py-4 font-black text-indigo-600 text-lg bg-indigo-50/30">
                                                {totalCommission.toLocaleString()} ج.م
                                            </td>
                                        </tr>
                                    );
                                })}
                                {vendors.length === 0 && (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-bold">لا يوجد شركات معرفة</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Refunds Tab */}
            {activeTab === 'refunds' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-rose-800 mb-6 flex items-center gap-2"><FileText className="w-5 h-5 text-rose-500"/> سجل حركة التذاكر الملغاة و المرتجعات (Refunded Tickets)</h3>
                    <div className="overflow-x-auto border border-rose-100 rounded-xl">
                        <table className="w-full text-right whitespace-nowrap">
                            <thead className="bg-rose-50 border-b border-rose-100">
                                <tr>
                                    <th className="px-4 py-4 text-slate-500 font-bold text-sm">مرجع الحجز</th>
                                    <th className="px-4 py-4 text-slate-500 font-bold text-sm">اسم العميل</th>
                                    <th className="px-4 py-4 text-slate-500 font-bold text-sm">شركة النقل / الوجهة</th>
                                    <th className="px-4 py-4 text-slate-500 font-bold text-sm">قيمة التذكرة الأصلية</th>
                                    <th className="px-4 py-4 text-slate-500 font-bold text-sm text-amber-600">غرامة الإلغاء (Penalty)</th>
                                    <th className="px-4 py-4 text-slate-500 font-bold text-sm text-emerald-600">المبلغ المسترد للعميل</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredBookings.filter(b => b.status === 'cancelled').map(b => (
                                    <tr key={b.id} className="hover:bg-rose-50/50 transition">
                                        <td className="px-4 py-4 font-black text-slate-600">{b.bookingRef}</td>
                                        <td className="px-4 py-4 font-bold text-slate-800">{b.customerName || '-'}</td>
                                        <td className="px-4 py-4">
                                            <div className="font-bold text-slate-800">{b.vendorName || 'أسطولنا الداخلي'}</div>
                                            <div className="text-xs font-bold text-slate-500 mt-1">{b.destination}</div>
                                        </td>
                                        <td className="px-4 py-4 font-black text-slate-500 line-through decoration-rose-400">
                                            {b.totalAmount.toLocaleString()} ج.م
                                        </td>
                                        <td className="px-4 py-4 font-black text-amber-600 bg-amber-50/50">
                                            {((b as any).cancellationFee || 0).toLocaleString()} ج.م
                                        </td>
                                        <td className="px-4 py-4 font-black text-emerald-600 bg-emerald-50/50">
                                            {((b as any).refundedAmount || 0).toLocaleString()} ج.م
                                        </td>
                                    </tr>
                                ))}
                                {filteredBookings.filter(b => b.status === 'cancelled').length === 0 && (
                                    <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-bold">لا يوجد تذاكر ملغاة خلال هذه الفترة</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TicketReports;
