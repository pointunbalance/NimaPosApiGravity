import React, { useState, useEffect, useRef, useMemo } from 'react';
import { QrCode, ClipboardList, CheckCircle2, User, Search, MapPin, Calendar, Clock, CreditCard, Camera, ScanLine, XCircle, FileText, Bus, AlertOctagon, CheckSquare } from 'lucide-react';
import { db } from '../db';
import { TicketBooking, TicketTripSchedule, TicketVehicle, TicketSeatingTemplate, Expense } from '../types';
import toast from 'react-hot-toast';

const TicketDriverManifest = () => {
    const [trips, setTrips] = useState<TicketTripSchedule[]>([]);
    const [bookings, setBookings] = useState<TicketBooking[]>([]);
    const [vehicles, setVehicles] = useState<TicketVehicle[]>([]);
    const [templates, setTemplates] = useState<TicketSeatingTemplate[]>([]);

    const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'boarding' | 'expenses'>('boarding');
    
    // Scanner input state
    const [scanBarcode, setScanBarcode] = useState('');
    const scannerInputRef = useRef<HTMLInputElement>(null);

    // Expense state
    const [expenseForm, setExpenseForm] = useState({
        amount: 0,
        category: 'fuel',
        notes: '',
        attachment: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [t, b, v, tm] = await Promise.all([
            db.ticketTripSchedules.toArray(),
            db.ticketBookings.toArray(),
            db.ticketVehicles.toArray(),
            db.ticketSeatingTemplates.toArray()
        ]);
        setTrips(t.filter(trip => trip.isActive !== false));
        setBookings(b);
        setVehicles(v);
        setTemplates(tm);
    };

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = scanBarcode.trim();
        if (!code) return;

        // Find booking by bookingRef
        const booking = currentTripBookings.find(b => b.bookingRef === code || b.id?.toString() === code || b.identityNumber === code);
        
        if (booking) {
            await handleCheckIn(booking, 'boarded');
            toast.success(`تم تأكيد صعود الراكب ${booking.customerName}`);
        } else {
            toast.error('لم يتم العثور على حجز صالح لهذا الكود في هذه الرحلة');
        }
        setScanBarcode('');
        scannerInputRef.current?.focus();
    };

    const handleCheckIn = async (booking: TicketBooking, newStatus: any) => {
        await db.ticketBookings.update(booking.id!, { checkInStatus: newStatus });
        
        // Update local state
        setBookings(prev => prev.map(b => b.id === booking.id ? {...b, checkInStatus: newStatus} : b));
    };

    const handleSaveExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTripId) return;
        
        if (expenseForm.amount <= 0) {
            toast.error('الرجاء إدخال قيمة صحيحة للمصروف');
            return;
        }

        const trip = trips.find(t => t.id === selectedTripId);

        const newExpense: Expense = {
            title: `مصروف طريق للرحلة ${trip?.tripCode}`,
            amount: expenseForm.amount,
            category: 'مصروفات تشغيل لوجستية', // Mapping to broader category or keep specific
            date: new Date(),
            notes: `[تصنيف الطريق: ${expenseForm.category}] ` + expenseForm.notes,
            paymentMethod: 'cash',
        };

        const expenseId = await db.expenses.add(newExpense);

        // Add Journal Entry directly for petty cash
        const jLines = [
            { accountId: 99, accountName: 'مصروفات تشغيل مركبات', debit: expenseForm.amount, credit: 0 },
            { accountId: 1, accountName: 'الخزينة الرئيسية', debit: 0, credit: expenseForm.amount }
        ];

        await (db as any).journalEntries.add({
            date: new Date().toISOString().split('T')[0],
            description: `تسوية مصروفات رحلة ${trip?.tripCode} - ${expenseForm.category}`,
            reference: `EXP-${expenseId}`,
            lines: jLines,
            totalAmount: expenseForm.amount,
            status: 'posted',
            createdBy: 'تطبيق المشرف',
            createdAt: new Date().toISOString()
        });

        toast.success('تم تسجيل المصروف بنجاح وتسوية العهدة');
        setExpenseForm({ amount: 0, category: 'fuel', notes: '', attachment: '' });
    };

    const selectedTrip = trips.find(t => t.id === selectedTripId);
    
    // Using string matching since selectedTrip.id is number but booking.destination might be string ID.
    const currentTripBookings = useMemo(() => {
        if (!selectedTrip) return [];
        return bookings.filter(b => 
            b.destination === String(selectedTrip.id) &&
            b.departureDate === new Date().toISOString().split('T')[0] && // Only today's bookings for this trip
            b.status !== 'cancelled'
        );
    }, [bookings, selectedTrip]);

    const stats = {
        total: currentTripBookings.length,
        boarded: currentTripBookings.filter(b => b.checkInStatus === 'boarded').length,
        noShow: currentTripBookings.filter(b => b.checkInStatus === 'did_not_attend').length,
        pending: currentTripBookings.filter(b => !b.checkInStatus || b.checkInStatus === 'pending').length,
    };

    const renderSeatLayout = () => {
        if (!selectedTrip || !selectedTrip.vehicleId) return null;
        
        const vehicle = vehicles.find(v => v.id === selectedTrip.vehicleId);
        if (!vehicle || !vehicle.layoutTemplateId) return null;
        
        const template = templates.find(t => t.id === vehicle.layoutTemplateId);
        if (!template) return null;

        return (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 overflow-x-auto dir-ltr">
                <div className="flex gap-3 justify-center mb-4 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600"><div className="w-3.5 h-3.5 bg-emerald-50 border border-emerald-300 rounded-sm"></div> فارغ (متاح للركوب)</div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600"><div className="w-3.5 h-3.5 bg-rose-50 border border-rose-300 rounded-sm"></div> محجوز (لم يصعد)</div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600"><div className="w-3.5 h-3.5 bg-slate-700 border border-slate-800 rounded-sm"></div> متواجد داخل المركبة</div>
                </div>
                <div className="flex flex-col gap-2 min-w-max mx-auto border-2 border-slate-300 p-4 rounded-[40px] bg-slate-100/50 shadow-inner">
                    {/* Simulated driver wheel front */}
                    <div className="flex justify-end mb-4 border-b-2 border-slate-300 pb-2">
                        <div className="w-8 h-8 rounded-full border-4 border-slate-400 opacity-50 ml-10"></div>
                    </div>

                    {(() => {
                        let parsedLayout: any = { layout: [] };
                        try {
                            if (typeof template.layoutData === 'string') {
                                parsedLayout = JSON.parse(template.layoutData);
                            } else {
                                parsedLayout = template.layoutData;
                            }
                        } catch (e) {
                            console.error(e);
                        }
                        
                        return (parsedLayout.grid || parsedLayout.layout || []).map((row: any, rIdx: number) => (
                            <div key={rIdx} className="flex gap-2">
                                {row.map((cell: any, cIdx: number) => {
                                if (cell === 'W') return <div key={cIdx} className="w-10 h-10 flex items-center justify-center font-black text-rose-300/30"></div>; // Aisle/Walkway
                                
                                const bookingForSeat = currentTripBookings.find(b => b.seatNumber === cell);
                                
                                let bg = "bg-emerald-50 border-emerald-300 text-emerald-600 hover:bg-emerald-100 cursor-pointer";
                                let text = cell;
                                let isBoarded = false;

                                if (bookingForSeat) {
                                    if (bookingForSeat.checkInStatus === 'boarded') {
                                        bg = "bg-slate-700 border-slate-800 text-white shadow-md"; // Checked in
                                        isBoarded = true;
                                    } else {
                                        bg = "bg-rose-50 border-rose-300 text-rose-600"; // Reserved but not on board (Red)
                                    }
                                }

                                return (
                                    <button
                                        key={cIdx}
                                        type="button"
                                        onClick={() => {
                                            if (bookingForSeat) {
                                                const toggle = isBoarded ? 'pending' : 'boarded';
                                                handleCheckIn(bookingForSeat, toggle);
                                            } else {
                                                toast("مقعد فارغ - يمكن حجزه", { icon: 'ℹ️' })
                                            }
                                        }}
                                        className={`w-10 h-10 rounded-xl font-black text-sm transition-all border-b-[3px] flex items-center justify-center relative cursor-pointer ${bg}`}
                                    >
                                        {text}
                                    </button>
                                );
                            })}
                        </div>
                        ));
                    })()}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-16 md:pb-6">
            {/* Mobile-friendly Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 flex-shrink-0">
                        <Bus className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-800 leading-tight">تطبيق المشرف / السائق</h1>
                        <p className="text-xs font-bold text-slate-500">Boarding & Manifest</p>
                    </div>
                </div>
            </div>

            <div className="p-4 max-w-lg mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Trip Selection */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">رحلتك اليوم ({new Date().toLocaleDateString('ar-EG')})</label>
                    <select 
                        value={selectedTripId || ''} 
                        onChange={e => setSelectedTripId(parseInt(e.target.value) || null)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-indigo-900 border-b-4 border-b-indigo-200 focus:outline-none focus:border-b-indigo-500"
                    >
                        <option value="">-- اختر رحلتك --</option>
                        {trips.map(t => (
                            <option key={t.id} value={t.id}>
                                {t.tripCode} | {t.departureTime}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedTripId ? (
                    <>
                        {/* Tabs */}
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setActiveTab('boarding')} 
                                className={`flex-1 py-3 px-2 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'boarding' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white border border-slate-200 text-slate-600'}`}
                            >
                                <CheckSquare className="w-4 h-4" /> صعود الركاب
                            </button>
                            <button 
                                onClick={() => setActiveTab('expenses')} 
                                className={`flex-1 py-3 px-2 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'expenses' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white border border-slate-200 text-slate-600'}`}
                            >
                                <CreditCard className="w-4 h-4" /> العهدة والنثريات
                            </button>
                        </div>

                        {activeTab === 'boarding' ? (
                            <div className="space-y-4">
                                {/* Statistics Cards */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-sm">
                                        <p className="text-[10px] sm:text-xs font-bold text-slate-500 mb-1">الإجمالي</p>
                                        <p className="text-xl font-black text-indigo-700">{stats.total}</p>
                                    </div>
                                    <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 text-center shadow-sm">
                                        <p className="text-[10px] sm:text-xs font-bold text-emerald-700 mb-1">صعدوا للآن</p>
                                        <p className="text-xl font-black text-emerald-700">{stats.boarded}</p>
                                    </div>
                                    <div className="bg-rose-50 p-3 rounded-2xl border border-rose-200 text-center shadow-sm">
                                        <p className="text-[10px] sm:text-xs font-bold text-rose-700 mb-1">المتبقي</p>
                                        <p className="text-xl font-black text-rose-700">{stats.pending}</p>
                                    </div>
                                </div>

                                {/* QR Scanner Input */}
                                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full"></div>
                                    
                                    <form onSubmit={handleScan} className="relative z-10">
                                        <label className="block text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                                            <ScanLine className="w-5 h-5 text-indigo-400" />
                                            ماسح التذاكر السريع (Barcode/QR)
                                        </label>
                                        <div className="flex gap-2">
                                            <input 
                                                ref={scannerInputRef}
                                                type="text" 
                                                autoFocus
                                                value={scanBarcode}
                                                onChange={e => setScanBarcode(e.target.value)}
                                                placeholder="انقر هنا للتصويب بالليزر..."
                                                className="flex-1 bg-slate-800/80 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:border-indigo-500 font-mono text-center tracking-widest placeholder:text-slate-500 placeholder:tracking-normal"
                                            />
                                            <button type="submit" className="px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all flex items-center justify-center">
                                                تحقق
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* Seating Map */}
                                {renderSeatLayout()}

                                {/* Passengers List */}
                                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden pb-20 md:pb-4">
                                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                        <h2 className="font-bold text-slate-800 flex items-center gap-2">
                                            <ClipboardList className="w-5 h-5 text-indigo-600" /> الكشف (المانيفست)
                                        </h2>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {currentTripBookings.map(b => (
                                            <div key={b.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-800 text-sm">{b.customerName}</span>
                                                    <span className="text-xs font-bold text-slate-500 mt-0.5">مقعد: {b.seatNumber || 'بدون'} | كود: {b.bookingRef}</span>
                                                </div>
                                                
                                                <button 
                                                    onClick={() => handleCheckIn(b, b.checkInStatus === 'boarded' ? 'pending' : 'boarded')}
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${b.checkInStatus === 'boarded' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                >
                                                    <CheckCircle2 className="w-6 h-6" />
                                                </button>
                                            </div>
                                        ))}
                                        {currentTripBookings.length === 0 && (
                                            <div className="p-8 text-center text-slate-500 font-bold text-sm">لا يوجد ركاب لهذه الرحلة</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Petty Cash Tab
                            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-rose-500" />
                                    تسجيل مصروفات نقدية عاجلة
                                </h3>
                                
                                <form onSubmit={handleSaveExpense} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">حجم المصروف (ج.م)</label>
                                        <input 
                                            type="number" 
                                            required
                                            min="0"
                                            value={expenseForm.amount || ''}
                                            onChange={e => setExpenseForm({...expenseForm, amount: parseFloat(e.target.value) || 0})}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-rose-600 text-lg outline-none focus:border-rose-300 focus:bg-white"
                                            placeholder="0"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">بند الصرف</label>
                                        <select 
                                            value={expenseForm.category}
                                            onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-300"
                                        >
                                            <option value="fuel">وقود / بنزين</option>
                                            <option value="tolls">كارتة طريق / رسوم عبور</option>
                                            <option value="maintenance">صيانة طارئة / كاوتش</option>
                                            <option value="food">ضيافة / وجبات للسائق</option>
                                            <option value="other">أخرى</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">ملاحظات / سبب الصرف</label>
                                        <textarea 
                                            rows={2}
                                            value={expenseForm.notes}
                                            onChange={e => setExpenseForm({...expenseForm, notes: e.target.value})}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm text-slate-700 outline-none focus:border-indigo-300 resize-none"
                                            placeholder="اكتب توضيحاً صغيراً (اختياري)..."
                                        ></textarea>
                                    </div>

                                    <div className="pt-2 border-t border-slate-100 flex gap-3">
                                        <button type="button" className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 border border-slate-200 border-dashed">
                                            <Camera className="w-5 h-5 text-slate-400" /> إرفاق صورة فاتورة
                                        </button>
                                    </div>

                                    <button type="submit" className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black shadow-lg shadow-rose-200 flex items-center justify-center gap-2 transition-all">
                                        <CheckCircle2 className="w-5 h-5" /> خصم و اعتماد المصفوف
                                    </button>
                                </form>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="bg-slate-100/50 border border-slate-200 border-dashed p-8 rounded-3xl text-center">
                        <AlertOctagon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="font-bold text-slate-600">لم تقم باختيار رحلة بعد</h3>
                        <p className="text-sm font-medium text-slate-500 mt-1">يرجى تحديد الرحلة التي ستقوم بالإشراف عليها والبدء في تصعيد الركاب</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketDriverManifest;
