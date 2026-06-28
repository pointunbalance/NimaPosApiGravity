import React, { useState, useEffect } from 'react';
import { 
    Route, MapPin, CalendarClock, DollarSign, Plus, Edit, Trash2, CheckCircle, 
    XCircle, Clock, Save, Building2, Calendar, AlertTriangle
} from 'lucide-react';
import { db } from '../db';
import { TicketRoute, TicketTripSchedule, TicketSeasonPricing, TicketVehicle } from '../types';
import ConfirmModal from '../components/ui/ConfirmModal';

const TicketRoutes = () => {
    const [activeTab, setActiveTab] = useState<'routes' | 'trips' | 'pricing'>('routes');
    
    // Data states
    const [routes, setRoutes] = useState<TicketRoute[]>([]);
    const [trips, setTrips] = useState<TicketTripSchedule[]>([]);
    const [seasons, setSeasons] = useState<TicketSeasonPricing[]>([]);
    const [vehicles, setVehicles] = useState<TicketVehicle[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);

    // Modal states
    const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
    const [isTripModalOpen, setIsTripModalOpen] = useState(false);
    const [isSeasonModalOpen, setIsSeasonModalOpen] = useState(false);
    
    // Form states
    const [routeForm, setRouteForm] = useState<Partial<TicketRoute>>({});
    const [tripForm, setTripForm] = useState<Partial<TicketTripSchedule>>({});
    const [seasonForm, setSeasonForm] = useState<Partial<TicketSeasonPricing>>({});
    
    const [isEdit, setIsEdit] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [r, t, s, v, b] = await Promise.all([
            db.ticketRoutes.toArray(),
            db.ticketTripSchedules.toArray(),
            db.ticketSeasonPricing.toArray(),
            db.ticketVehicles.toArray(),
            db.ticketBookings.toArray()
        ]);
        const emps = [{ id: 1, name: 'ياروسلاف' }, { id: 2, name: 'بوهدان' }]; // Ukrainian Christian Names as per guidelines
        setRoutes(r);
        setTrips(t);
        setSeasons(s);
        setVehicles(v.filter(vehicle => vehicle.status !== 'maintenance'));
        setDrivers(emps); // Usually filtered by role but we use all for now as it's a demo
        setBookings(b || []);
    };

    // --- Routes Actions ---
    const handleSaveRoute = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEdit && routeForm.id) {
                await db.ticketRoutes.update(routeForm.id, routeForm as TicketRoute);
            } else {
                await db.ticketRoutes.add(routeForm as TicketRoute);
            }
            setIsRouteModalOpen(false);
            loadData();
        } catch (error) {
            console.error(error);
        }
    };

    const [confirmDelete, setConfirmDelete] = useState<{
        isOpen: boolean;
        type: 'route' | 'trip' | 'season';
        id: number;
    }>({ isOpen: false, type: 'route', id: 0 });

    const handleDeleteClick = (type: 'route' | 'trip' | 'season', id: number) => {
        setConfirmDelete({
            isOpen: true,
            type,
            id
        });
    };

    const handleConfirmDelete = async () => {
        const { type, id } = confirmDelete;
        if (type === 'route') {
            await db.ticketRoutes.delete(id);
        } else if (type === 'trip') {
            await db.ticketTripSchedules.delete(id);
        } else if (type === 'season') {
            await db.ticketSeasonPricing.delete(id);
        }
        setConfirmDelete({ isOpen: false, type: 'route', id: 0 });
        loadData();
    };

    // --- Trips Actions ---
    const [saveTripError, setSaveTripError] = useState('');

    const handleSaveTrip = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaveTripError('');

        try {
            // Need to check for conflicts
            const allTrips = await db.ticketTripSchedules.toArray();
            
            if (tripForm.vehicleId) {
                const conflictingTrip = allTrips.find(t => 
                    t.id !== tripForm.id && 
                    t.vehicleId === tripForm.vehicleId && 
                    t.departureTime === tripForm.departureTime // Simplistic check for same time
                );
                if (conflictingTrip) {
                    setSaveTripError('المركبة مرتبطة برحلة أخرى في نفس الموعد. يرجى مراجعة الجدول.');
                    return;
                }
            }

            if (tripForm.driver1Id) {
                 const conflictingDriver = allTrips.find(t => 
                    t.id !== tripForm.id && 
                    (t.driver1Id === tripForm.driver1Id || t.driver2Id === tripForm.driver1Id) && 
                    t.departureTime === tripForm.departureTime
                );
                if (conflictingDriver) {
                    setSaveTripError('السائق الأول مرتبط برحلة أخرى في نفس الموعد.');
                    return;
                }
            }

            if (tripForm.driver2Id && tripForm.driver1Id === tripForm.driver2Id) {
                setSaveTripError('لا يمكن اختيار نفس السائق كسائق أول ومساعد!');
                return;
            }

            if (isEdit && tripForm.id) {
                await db.ticketTripSchedules.update(tripForm.id, tripForm as TicketTripSchedule);
            } else {
                await db.ticketTripSchedules.add(tripForm as TicketTripSchedule);
            }
            setIsTripModalOpen(false);
            loadData();
        } catch (error) {
            console.error(error);
        }
    };

    // --- Season Actions ---
    const handleSaveSeason = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEdit && seasonForm.id) {
                await db.ticketSeasonPricing.update(seasonForm.id, seasonForm as TicketSeasonPricing);
            } else {
                await db.ticketSeasonPricing.add(seasonForm as TicketSeasonPricing);
            }
            setIsSeasonModalOpen(false);
            loadData();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-[20px]">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <Route className="w-8 h-8 text-indigo-600" />
                        إدارة الرحلات والخطوط
                    </h1>
                    <p className="text-slate-500 font-medium mt-2">جدولة الرحلات، تعريف المسارات، وتسعير المواسم</p>
                </div>
            </div>

            <div className="flex justify-start w-full">
                <div style={{ padding: '6px 12px' }} className="inline-flex bg-slate-100 rounded-xl mb-[24px] overflow-x-auto gap-2">
                    <button
                        onClick={() => setActiveTab('routes')}
                        className={`flex-grow-0 shrink-0 px-5 py-2.5 font-bold rounded-lg transition-all text-sm flex justify-center items-center gap-2 ${activeTab === 'routes' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                    >
                        <MapPin className="w-4 h-4"/> خطوط السير والوجهات
                    </button>
                    <button
                        onClick={() => setActiveTab('trips')}
                        className={`flex-grow-0 shrink-0 px-5 py-2.5 font-bold rounded-lg transition-all text-sm flex justify-center items-center gap-2 ${activeTab === 'trips' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                    >
                        <CalendarClock className="w-4 h-4"/> جدولة الرحلات
                    </button>
                    <button
                        onClick={() => setActiveTab('pricing')}
                        className={`flex-grow-0 shrink-0 px-5 py-2.5 font-bold rounded-lg transition-all text-sm flex justify-center items-center gap-2 ${activeTab === 'pricing' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                    >
                        <DollarSign className="w-4 h-4"/> التسعير والمواسم
                    </button>
                </div>
            </div>

            {/* Routes Tab */}
            {activeTab === 'routes' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-[16px]">
                        <h2 className="text-xl font-bold text-slate-800">خطوط السير المعرفة</h2>
                        <button onClick={() => { setIsEdit(false); setRouteForm({}); setIsRouteModalOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center hover:bg-indigo-700 transition">
                            <Plus className="w-5 h-5 ml-1" /> إضافة خط سير
                        </button>
                    </div>
                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-right whitespace-nowrap">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-[18px] text-slate-500 font-bold text-sm">نقطة الانطلاق <span className="mx-2">&rarr;</span> الوجهة</th>
                                    <th className="px-6 py-[18px] text-slate-500 font-bold text-sm">المسافة</th>
                                    <th className="px-6 py-[18px] text-slate-500 font-bold text-sm">محطات التوقف</th>
                                    <th className="px-6 py-[18px] text-slate-500 font-bold text-sm">الرحلة القادمة</th>
                                    <th className="px-6 py-[18px] text-slate-500 font-bold text-sm text-center">المقاعد (مباع / كلي)</th>
                                    <th className="px-6 py-[18px] text-emerald-600 font-bold text-sm">الأرباح المتوقعة</th>
                                    <th className="px-6 py-[18px] text-slate-500 font-bold text-sm">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {routes.map(r => {
                                    // Find next trip
                                    const now = new Date();
                                    const nextTrips = trips.filter(t => t.routeId === r.id && new Date(`${t.departureDate}T${t.departureTime}`) >= now).sort((a,b) => new Date(`${a.departureDate}T${a.departureTime}`).getTime() - new Date(`${b.departureDate}T${b.departureTime}`).getTime());
                                    const nextTrip = nextTrips[0];
                                    
                                    let soldSeats = 0;
                                    let capacity = 0;
                                    let expectedProfit = 0;
                                    
                                    if(nextTrip) {
                                        const tripBookings = bookings.filter(b => b.tripId === nextTrip.id && b.status === 'confirmed');
                                        soldSeats = tripBookings.reduce((sum, b) => sum + (b.passengers || 1), 0);
                                        expectedProfit = tripBookings.reduce((sum, b) => sum + ((b as any).expectedCommission || 0) * (b.passengers || 1), 0) || tripBookings.reduce((sum, b) => sum + (b.totalAmount || 0)*0.1, 0); // fallback if no expectedCommission
                                        
                                        const vehicle = vehicles.find(v => v.id === nextTrip.vehicleId);
                                        if(vehicle) {
                                            capacity = vehicle.capacity;
                                        } else {
                                            capacity = 50; // default assumption
                                        }
                                    }

                                    return (
                                    <tr key={r.id} className="hover:bg-slate-50/50 transition">
                                        <td className="px-6 py-4 font-bold text-slate-800">
                                            {r.source} <span className="text-slate-400 mx-2">&larr;</span> {r.destination}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-600">{r.distance || '-'} كم</td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{r.stops || '-'}</td>
                                        <td className="px-6 py-4">
                                            {nextTrip ? (
                                                <div>
                                                    <div className="font-bold text-slate-800 text-sm">{new Date(`${nextTrip.departureDate}T${nextTrip.departureTime}`).toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                                </div>
                                            ) : <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">لا يوجد رحلات مجدولة</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {nextTrip ? (
                                                <div className="flex flex-col items-center">
                                                    <div className="text-sm font-black flex items-center gap-1">
                                                        <span className="text-indigo-600">{soldSeats}</span>
                                                        <span className="text-slate-300">/</span>
                                                        <span className="text-slate-600">{capacity}</span>
                                                    </div>
                                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                                        <div className="h-full bg-indigo-500" style={{ width: `${capacity > 0 ? Math.min(100, Math.round((soldSeats/capacity)*100)) : 0}%`}}></div>
                                                    </div>
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 font-black text-emerald-600">
                                            {nextTrip && expectedProfit > 0 ? `${expectedProfit.toLocaleString()} ج.م` : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => { setIsEdit(true); setRouteForm(r); setIsRouteModalOpen(true); }} className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"><Edit className="w-4 h-4"/></button>
                                                <button onClick={() => r.id && handleDeleteClick('route', r.id)} className="p-2 text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100"><Trash2 className="w-4 h-4"/></button>
                                            </div>
                                        </td>
                                    </tr>
                                )})}
                                {routes.length === 0 && (
                                    <tr>
                                        <td colSpan={7} style={{ padding: '48px 0' }} className="text-center text-slate-400 font-bold">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Route className="w-8 h-8 text-slate-300" />
                                                <span>لا يوجد خطوط سير معرفة</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Trips Tab */}
            {activeTab === 'trips' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-[16px]">
                        <h2 className="text-xl font-bold text-slate-800">جدولة الرحلات</h2>
                        <button onClick={() => { setIsEdit(false); setTripForm({ transportType: 'bus' }); setIsTripModalOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center hover:bg-indigo-700 transition">
                            <Plus className="w-5 h-5 ml-1" /> إضافة رحلة متكررة
                        </button>
                    </div>
                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-right whitespace-nowrap">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-[18px] text-slate-500 font-bold text-sm">كود الرحلة</th>
                                    <th className="px-6 py-[18px] text-slate-500 font-bold text-sm">خط السير / الوجهة</th>
                                    <th className="px-6 py-[18px] text-slate-500 font-bold text-sm">المواعيد</th>
                                    <th className="px-6 py-[18px] text-slate-500 font-bold text-sm">السعر الأساسي</th>
                                    <th className="px-6 py-[18px] text-slate-500 font-bold text-sm">الوسيلة والتكرار</th>
                                    <th className="px-6 py-[18px] text-slate-500 font-bold text-sm">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {trips.map(t => {
                                    const r = routes.find(ro => ro.id === t.routeId);
                                    return (
                                        <tr key={t.id} className="hover:bg-slate-50/50 transition">
                                            <td className="px-6 py-4 font-black text-slate-800">{t.tripCode}</td>
                                            <td className="px-6 py-4 font-bold text-indigo-700">{r ? `${r.source} - ${r.destination}` : '-'}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-600">
                                                <div>إقلاع: <span className="text-slate-800">{t.departureTime}</span></div>
                                                {t.expectedArrivalTime && <div>وصول: <span className="text-slate-800">{t.expectedArrivalTime}</span></div>}
                                            </td>
                                            <td className="px-6 py-4 font-black text-emerald-600">{t.basePrice} <span className="text-xs">ج.م</span></td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-slate-700">{t.transportType === 'bus' ? 'أتوبيس' : t.transportType === 'train' ? 'قطار' : 'أخرى'}</div>
                                                <div className="text-xs text-slate-500">{t.recurringDays ? 'مجدولة أيام محددة' : 'يومياً'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => { setIsEdit(true); setTripForm(t); setIsTripModalOpen(true); }} className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"><Edit className="w-4 h-4"/></button>
                                                    <button onClick={() => t.id && handleDeleteClick('trip', t.id)} className="p-2 text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100"><Trash2 className="w-4 h-4"/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {trips.length === 0 && (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '56px 0' }} className="text-center text-slate-400 font-bold">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <CalendarClock className="w-8 h-8 text-slate-300" />
                                                <span>لا يوجد رحلات مجدولة</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pricing Tab */}
            {activeTab === 'pricing' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-[16px]">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center">أسعار المواسم والمناسبات</h2>
                        <button onClick={() => { setIsEdit(false); setSeasonForm({ adjustmentType: 'increase', isPercentage: true }); setIsSeasonModalOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center hover:bg-indigo-700 transition">
                            <Plus className="w-5 h-5 ml-1" /> إضافة موسم جديد
                        </button>
                    </div>
                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-right whitespace-nowrap">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-[18px] text-slate-500 font-bold text-sm">اسم الموسم / المناسبة</th>
                                    <th className="px-6 py-[18px] text-slate-500 font-bold text-sm">الفترة</th>
                                    <th className="px-6 py-[18px] text-slate-500 font-bold text-sm">نوع التعديل</th>
                                    <th className="px-6 py-[18px] text-slate-500 font-bold text-sm">القيمة</th>
                                    <th className="px-6 py-[18px] text-slate-500 font-bold text-sm">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {seasons.map(s => (
                                    <tr key={s.id} className="hover:bg-slate-50/50 transition">
                                        <td className="px-6 py-4 font-bold text-slate-800">{s.name}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-600">{s.startDate} <span className="mx-1">&larr;</span> {s.endDate}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${s.adjustmentType === 'increase' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                {s.adjustmentType === 'increase' ? 'زيادة (موسم)' : 'تخفيض (عرض)'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-black text-indigo-700">
                                            {s.adjustmentValue}{s.isPercentage ? '%' : ' ج.م'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => { setIsEdit(true); setSeasonForm(s); setIsSeasonModalOpen(true); }} className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"><Edit className="w-4 h-4"/></button>
                                                <button onClick={() => s.id && handleDeleteClick('season', s.id)} className="p-2 text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100"><Trash2 className="w-4 h-4"/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {seasons.length === 0 && (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '48px 0' }} className="text-center text-slate-400 font-bold">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <DollarSign className="w-8 h-8 text-slate-300" />
                                                <span>لا توجد تسعيرات مواسم معرفة</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modals */}
            {/* 1. Route Modal */}
            {isRouteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <form onSubmit={handleSaveRoute} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
                        <div style={{ padding: '24px 32px' }} className="border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-extrabold text-slate-800">{isEdit ? 'تعديل خط السير' : 'إضافة خط سير جديد'}</h2>
                            <button type="button" onClick={() => setIsRouteModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors flex items-center justify-center"><XCircle className="w-6 h-6" /></button>
                        </div>
                        <div className="px-[32px] pt-[24px] pb-[24px] flex flex-col gap-[20px]">
                            <div className="grid grid-cols-2 gap-[16px]">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-[6px]">نقطة الانطلاق *</label>
                                    <input type="text" required value={routeForm.source || ''} onChange={e => setRouteForm({...routeForm, source: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-[6px]">نقطة الوصول (الوجهة) *</label>
                                    <input type="text" required value={routeForm.destination || ''} onChange={e => setRouteForm({...routeForm, destination: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500 transition-colors" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-[6px]">المسافة التقريبية (كم)</label>
                                <input type="number" min="0" value={routeForm.distance || ''} onChange={e => setRouteForm({...routeForm, distance: parseFloat(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500 transition-colors" />
                            </div>
                            <div className="mt-[4px]">
                                <label className="block text-sm font-bold text-slate-700 mb-[6px]">محطات التوقف البينية</label>
                                <input type="text" value={routeForm.stops || ''} onChange={e => setRouteForm({...routeForm, stops: e.target.value})} placeholder="مثال: الإسكندرية، طنطا" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500 transition-colors" />
                            </div>
                        </div>
                        <div className="px-[32px] pt-[20px] pb-[32px] border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                            <button type="button" onClick={() => setIsRouteModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200/50 transition">إلغاء</button>
                            <button type="submit" className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-[8px] shadow-lg"><Save className="w-5 h-5"/> حفظ الخط</button>
                        </div>
                    </form>
                </div>
            )}

            {/* 2. Trip Modal */}
            {isTripModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <form onSubmit={handleSaveTrip} className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in duration-200">
                        <div style={{ padding: '24px 32px' }} className="border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-extrabold text-slate-800">{isEdit ? 'تعديل الرحلة المجدولة' : 'إضافة رحلة جديدة'}</h2>
                            <button type="button" onClick={() => setIsTripModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors flex items-center justify-center"><XCircle className="w-6 h-6" /></button>
                        </div>
                        {saveTripError && (
                            <div className="bg-rose-50 text-rose-700 px-[32px] py-4 border-b border-rose-100 flex items-center font-bold">
                                <AlertTriangle className="w-5 h-5 ml-2" />
                                {saveTripError}
                            </div>
                        )}
                        <div className="px-[32px] pt-[24px] pb-[24px] max-h-[60vh] overflow-y-auto flex flex-col gap-[20px]">
                            <div className="grid grid-cols-2 gap-[16px]">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-[6px]">كود الرحلة *</label>
                                    <input type="text" required value={tripForm.tripCode || ''} onChange={e => setTripForm({...tripForm, tripCode: e.target.value})} placeholder="مثال: TR-202" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-black text-slate-800 focus:border-indigo-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-[6px]">خط السير والوجهة *</label>
                                    <select required value={tripForm.routeId || ''} onChange={e => setTripForm({...tripForm, routeId: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-colors">
                                        <option value="" disabled>اختر خط السير</option>
                                        {routes.map(r => <option key={r.id} value={r.id}>{r.source} - {r.destination}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-[16px]">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-[6px]">موعد التحرك *</label>
                                    <input type="time" required value={tripForm.departureTime || ''} onChange={e => setTripForm({...tripForm, departureTime: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-[6px]">موعد الوصول المتوقع</label>
                                    <input type="time" value={tripForm.expectedArrivalTime || ''} onChange={e => setTripForm({...tripForm, expectedArrivalTime: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500 transition-colors" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-[16px]">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-[6px]">وسيلة النقل *</label>
                                    <select required value={tripForm.transportType || 'bus'} onChange={e => setTripForm({...tripForm, transportType: e.target.value as any})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-colors">
                                        <option value="bus">أتوبيس</option>
                                        <option value="train">قطار</option>
                                        <option value="airplane">طائرة</option>
                                        <option value="ship">سفينة</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-[6px]">السعر الأساسي للتذكرة *</label>
                                    <input type="number" required min="0" value={tripForm.basePrice || ''} onChange={e => setTripForm({...tripForm, basePrice: parseFloat(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-black text-emerald-700 focus:border-emerald-500 transition-colors" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-[16px]">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-[6px]">المركبة</label>
                                    <select value={tripForm.vehicleId || ''} onChange={e => setTripForm({...tripForm, vehicleId: parseInt(e.target.value) || undefined})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-colors">
                                        <option value="">بدون تعيين مركبة</option>
                                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber} ({v.capacity} مقعد)</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-[6px]">نمط الجدولة</label>
                                    <select value={tripForm.schedulePattern || 'daily'} onChange={e => setTripForm({...tripForm, schedulePattern: e.target.value as any})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-colors">
                                        <option value="daily">يومياً</option>
                                        <option value="workdays">أيام العمل فقط</option>
                                        <option value="weekly">أسبوعياً</option>
                                        <option value="custom">مخصص</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-[16px]">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-[6px]">السائق الأول</label>
                                    <select value={tripForm.driver1Id || ''} onChange={e => setTripForm({...tripForm, driver1Id: parseInt(e.target.value) || undefined})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-colors">
                                        <option value="">بدون سائق الأول</option>
                                        {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-[6px]">السائق الثاني (المساعد)</label>
                                    <select value={tripForm.driver2Id || ''} onChange={e => setTripForm({...tripForm, driver2Id: parseInt(e.target.value) || undefined})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-colors">
                                        <option value="">بدون سائق ثاني</option>
                                        {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-[16px]">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-[6px]">أيام التكرار (مخصص - اكتب أرقام الأيام)</label>
                                    <input type="text" placeholder="مثال: يترك فارغاً للرحلات اليومية" value={tripForm.recurringDays || ''} onChange={e => setTripForm({...tripForm, recurringDays: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500 transition-colors" disabled={tripForm.schedulePattern !== 'custom'} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-[6px]">مصاريف الوقود التقديرية (ج.م)</label>
                                    <input type="number" value={tripForm.estimatedFuelCost || ''} onChange={e => setTripForm({...tripForm, estimatedFuelCost: parseFloat(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-black text-rose-700 focus:border-rose-500 transition-colors" placeholder="0" />
                                </div>
                            </div>
                        </div>
                        <div className="px-[32px] pt-[20px] pb-[32px] border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                            <button type="button" onClick={() => setIsTripModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200/50 transition">إلغاء</button>
                            <button type="submit" className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-[8px] shadow-lg"><Save className="w-5 h-5"/> حفظ الرحلة</button>
                        </div>
                    </form>
                </div>
            )}

            {/* 3. Season Modal */}
            {isSeasonModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <form onSubmit={handleSaveSeason} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
                        <div style={{ padding: '24px 32px' }} className="border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-extrabold text-slate-800">{isEdit ? 'تعديل الموسم' : 'إضافة تسعير موسم جديد'}</h2>
                            <button type="button" onClick={() => setIsSeasonModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors flex items-center justify-center"><XCircle className="w-6 h-6" /></button>
                        </div>
                        <div className="px-[32px] pt-[24px] pb-[24px] flex flex-col gap-[20px]">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-[6px]">اسم الموسم / المناسبة *</label>
                                <input type="text" required value={seasonForm.name || ''} onChange={e => setSeasonForm({...seasonForm, name: e.target.value})} placeholder="مثال: إجازة نصف العام" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500 transition-colors" />
                            </div>
                            <div className="grid grid-cols-2 gap-[16px]">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-[6px]">تاريخ البدء *</label>
                                    <input type="date" required value={seasonForm.startDate || ''} onChange={e => setSeasonForm({...seasonForm, startDate: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-[6px]">تاريخ الانتهاء *</label>
                                    <input type="date" required value={seasonForm.endDate || ''} onChange={e => setSeasonForm({...seasonForm, endDate: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500 transition-colors" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-[16px]">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-[6px]">نوع التسعير *</label>
                                    <select required value={seasonForm.adjustmentType || 'increase'} onChange={e => setSeasonForm({...seasonForm, adjustmentType: e.target.value as any})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 focus:border-indigo-500 transition-colors">
                                        <option value="increase">زيادة (موسم مرتفع)</option>
                                        <option value="decrease">تخفيض (عرض / ركود)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-[6px]">القيمة *</label>
                                    <div className="flex bg-slate-50 rounded-xl border border-slate-200 overflow-hidden focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 transition-all">
                                        <input type="number" required min="0" value={seasonForm.adjustmentValue || ''} onChange={e => setSeasonForm({...seasonForm, adjustmentValue: parseFloat(e.target.value)})} className="w-full px-4 py-3 bg-transparent outline-none font-black text-slate-800" />
                                        <button type="button" onClick={() => setSeasonForm({...seasonForm, isPercentage: !seasonForm.isPercentage})} className="px-4 font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 border-r border-slate-200">
                                            {seasonForm.isPercentage ? '%' : 'ج.م'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-[32px] pt-[20px] pb-[32px] border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                            <button type="button" onClick={() => setIsSeasonModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200/50 transition">إلغاء</button>
                            <button type="submit" className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-[8px] shadow-lg"><Save className="w-5 h-5"/> حفظ الموسم</button>
                        </div>
                    </form>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                title="تأكيد الحذف"
                message={
                    confirmDelete.type === 'route'
                        ? 'هل أنت متأكد من حذف خط السير هذا؟'
                        : confirmDelete.type === 'trip'
                        ? 'هل أنت متأكد من حذف هذه الرحلة المجدولة؟'
                        : 'هل أنت متأكد من حذف هذا الموسم؟'
                }
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmDelete({ ...confirmDelete, isOpen: false })}
                confirmText="حذف"
                cancelText="إلغاء"
            />
        </div>
    );
};

export default TicketRoutes;
