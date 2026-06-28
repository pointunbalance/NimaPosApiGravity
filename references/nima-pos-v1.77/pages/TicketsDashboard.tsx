import React, { useState, useEffect } from 'react';
import { 
    LayoutDashboard, Ticket, DollarSign, Users, AlertTriangle, 
    Calendar, TrendingUp, TrendingDown, Clock, MapPin, CheckCircle
} from 'lucide-react';
import { db } from '../db';
import { TicketBooking } from '../types';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const TicketsDashboard = () => {
    const [bookings, setBookings] = useState<TicketBooking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const allBookings = await db.ticketBookings.toArray();
            setBookings(allBookings);
        } catch (error) {
            console.error("Error loading tickets data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500 font-bold">جاري تحميل بيانات لوحة التحكم...</div>;
    }

    const today = new Date().toISOString().split('T')[0];
    
    // KPIs
    const todaysBookings = bookings.filter(b => b.createdAt.startsWith(today) || b.departureDate === today);
    const todaysSales = todaysBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const activeBookingsToday = todaysBookings.length;
    
    // Calculate Occupancy (Assuming 50 seats per unique destination per day as standard capacity for calculation)
    const uniqueDestinationsToday = new Set(todaysBookings.map(b => b.destination)).size;
    const totalPassengersToday = todaysBookings.reduce((sum, b) => sum + (b.passengers || 1), 0);
    const totalCapacityToday = uniqueDestinationsToday * 50 || 50; 
    const occupancyRate = uniqueDestinationsToday > 0 ? Math.min(100, Math.round((totalPassengersToday / totalCapacityToday) * 100)) : 0;

    // Upcoming Departures
    const upcomingDepartures = bookings.filter(b => b.departureDate === today && b.status !== 'cancelled').length;

    // Charts Data: Weekly Sales
    const last7Days = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
    });

    const weeklySalesData = last7Days.map(date => {
        const dayBookings = bookings.filter(b => b.createdAt.startsWith(date));
        return {
            date: date.substring(5), // Keep MM-DD
            sales: dayBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
            tickets: dayBookings.reduce((sum, b) => sum + (b.passengers || 1), 0)
        };
    });

    // Charts Data: Top Destinations (Pie Chart)
    const destCounts: Record<string, number> = {};
    bookings.forEach(b => {
        if(b.status !== 'cancelled') {
            destCounts[b.destination] = (destCounts[b.destination] || 0) + (b.passengers || 1);
        }
    });
    const pieData = Object.entries(destCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // top 5

    // Alerts
    const unpaidBookings = bookings.filter(b => (b.totalAmount || 0) > (b.paidAmount || 0) && b.status !== 'cancelled');
    
    // Fully booked destinations today
    const destPassengerCountsToday: Record<string, number> = {};
    todaysBookings.forEach(b => {
        destPassengerCountsToday[b.destination] = (destPassengerCountsToday[b.destination] || 0) + (b.passengers || 1);
    });
    const fullyBookedDestinations = Object.entries(destPassengerCountsToday)
        .filter(([_, count]) => count >= 40) // Alert if >= 40 passengers
        .map(([dest, count]) => ({ dest, count }));

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto fade-in">
            {/* Header section with proper bottom spacing */}
            <div style={{ marginBottom: '24px' }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-[24px]">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <LayoutDashboard className="w-8 h-8 text-indigo-600" />
                        لوحة تحكم الحجوزات
                    </h1>
                    <p className="text-slate-500 font-medium mt-2 animate-pure-fade">نظرة عامة على أداء المبيعات والمؤشرات الرئيسية</p>
                </div>
            </div>

            {/* KPI Cards section with exact 16px gap and vertical margins */}
            <div style={{ marginBottom: '32px' }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[16px] mb-[32px]">
                <div style={{ padding: '16px 20px' }} className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-md">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -z-10"></div>
                    <div className="flex justify-between items-center w-full">
                        <div className="flex flex-col">
                            <p className="text-slate-500 text-sm font-bold mb-1">إجمالي مبيعات اليوم</p>
                            <h3 className="text-3xl font-black text-slate-800 tracking-tight">{todaysSales.toLocaleString()} <span className="text-sm font-bold">ج.م</span></h3>
                        </div>
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl shrink-0">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div style={{ padding: '16px 20px' }} className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-md">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-10"></div>
                    <div className="flex justify-between items-center w-full">
                        <div className="flex flex-col">
                            <p className="text-slate-500 text-sm font-bold mb-1">الحجوزات النشطة اليوم</p>
                            <h3 className="text-3xl font-black text-slate-800 tracking-tight">{activeBookingsToday}</h3>
                        </div>
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shrink-0">
                            <Ticket className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div style={{ padding: '16px 20px' }} className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-md">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -z-10"></div>
                    <div className="flex justify-between items-center w-full">
                        <div className="flex flex-col">
                            <p className="text-slate-500 text-sm font-bold mb-1">نسبة إشغال الرحلات</p>
                            <h3 className="text-3xl font-black text-slate-800 tracking-tight">{occupancyRate}%</h3>
                        </div>
                        <div className="p-3 bg-rose-100 text-rose-600 rounded-xl shrink-0">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 mt-3">
                        <div className="bg-rose-500 h-2 rounded-full transition-all duration-500" style={{ width: `${occupancyRate}%` }}></div>
                    </div>
                </div>

                <div style={{ padding: '16px 20px' }} className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-md">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -z-10"></div>
                    <div className="flex justify-between items-center w-full">
                        <div className="flex flex-col">
                            <p className="text-slate-500 text-sm font-bold mb-1">المغادرة اليوم</p>
                            <h3 className="text-3xl font-black text-slate-800 tracking-tight">{upcomingDepartures} <span className="text-sm font-medium text-slate-500">رحلة</span></h3>
                        </div>
                        <div className="p-3 bg-amber-100 text-amber-600 rounded-xl shrink-0">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Grid: Balanced 2fr / 1fr layout with 20px gap */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-[20px]">
                {/* Weekly Sales Chart Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                        <TrendingUp className="w-5 h-5 ml-2 text-indigo-500" />
                        مبيعات آخر 7 أيام
                    </h2>
                    <div style={{ paddingBottom: '12px' }} className="h-72 w-full dir-ltr pb-[12px] flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={weeklySalesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                                <RechartsTooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', fontFamily: 'inherit' }}
                                    formatter={(value: number) => [`${value.toLocaleString()} ج.م`, 'المبيعات']}
                                    labelFormatter={(label) => `التاريخ: ${label}`}
                                />
                                <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Popular Destinations pie card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col justify-between">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                        <MapPin className="w-5 h-5 ml-2 text-rose-500" />
                        أكثر الوجهات طلباً
                    </h2>
                    <div className="flex-1 min-h-[220px] w-full dir-ltr flex items-center justify-center">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip 
                                        formatter={(value: number) => [`${value} مقعد/تذكرة`, 'العدد']}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontFamily: 'inherit' }}/>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-slate-400 font-medium h-full flex items-center justify-center">لا توجد بيانات وجهات كافية</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Alerts Section with proper separation from the charts */}
            <div style={{ marginTop: '24px' }} className="grid grid-cols-1 lg:grid-cols-2 gap-[20px] mt-[24px]">
                {/* Fully Booked Alerts */}
                <div className="bg-white border border-rose-100 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-stretch">
                    <div className="bg-rose-50 p-4 border-b border-rose-100 flex justify-between items-center shrink-0">
                        <h3 className="font-bold text-rose-800 flex items-center">
                            <AlertTriangle className="w-5 h-5 ml-2 text-rose-600" />
                            تنبيهات الرحلات المكتملة
                        </h3>
                        <span className="bg-rose-200 text-rose-800 text-xs font-black px-2 py-1 rounded-full">{fullyBookedDestinations.length}</span>
                    </div>
                    <div className="p-0 flex-1 flex flex-col justify-center">
                        {fullyBookedDestinations.length > 0 ? (
                            <ul className="divide-y divide-slate-100 flex-1">
                                {fullyBookedDestinations.map((d, i) => (
                                    <li key={i} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-slate-800">{d.dest}</p>
                                            <p className="text-xs text-rose-600 font-bold mt-1">الرحلة قاربت على الاكتمال</p>
                                        </div>
                                        <div className="bg-rose-100 text-rose-700 font-black px-3 py-1 rounded-lg">
                                            {d.count} مقعد
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div style={{ minHeight: '240px' }} className="p-8 text-center text-slate-500 flex flex-col items-center justify-center flex-1">
                                <CheckCircle className="w-10 h-10 text-emerald-400 mb-2 shrink-0 animate-bounce" style={{ animationDuration: '3s' }} />
                                <p className="font-medium text-slate-600">لا توجد رحلات مكتملة أو ممتلئة حالياً</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Unpaid Bookings */}
                <div className="bg-white border border-amber-100 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-stretch">
                    <div className="bg-amber-50 p-4 border-b border-amber-100 flex justify-between items-center shrink-0">
                        <h3 className="font-bold text-amber-800 flex items-center">
                            <AlertTriangle className="w-5 h-5 ml-2 text-amber-600" />
                            تنبيهات المبالغ المتبقية للعملاء
                        </h3>
                        <span className="bg-amber-200 text-amber-800 text-xs font-black px-2 py-1 rounded-full">{unpaidBookings.length}</span>
                    </div>
                    <div className="p-0 flex-1 flex flex-col justify-center max-h-80 overflow-y-auto">
                        {unpaidBookings.length > 0 ? (
                            <ul className="divide-y divide-slate-100 flex-1">
                                {unpaidBookings.map((b, i) => {
                                    const remaining = (b.totalAmount || 0) - (b.paidAmount || 0);
                                    return (
                                        <li key={i} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-slate-800">{b.customerName}</p>
                                                <p className="text-xs text-slate-500 font-medium mt-1">حجز {b.bookingRef} • الوجهة: {b.destination}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="bg-rose-100 text-rose-700 font-black px-3 py-1 rounded-lg mb-1 inline-block">
                                                    متبقي: {remaining.toLocaleString()} ج.م
                                                </div>
                                                <p className="text-xs text-slate-400">تاريخ السفر: {b.departureDate}</p>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <div style={{ minHeight: '240px' }} className="p-8 text-center text-slate-500 flex flex-col items-center justify-center flex-1">
                                <CheckCircle className="w-10 h-10 text-emerald-400 mb-2 shrink-0 animate-bounce" style={{ animationDuration: '3s' }} />
                                <p className="font-medium text-slate-600">جميع الحجوزات مسددة بالكامل</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketsDashboard;
