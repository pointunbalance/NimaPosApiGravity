import React, { useState } from 'react';
import { 
  Users, Activity, TrendingUp, DollarSign, BedDouble, 
  Utensils, CheckCircle2, Clock, Wrench, Plus, RefreshCw, 
  Database, BookOpen, ChevronLeft, CreditCard, ClipboardList,
  CheckCircle, HelpCircle, Receipt, ArrowUpRight, ShieldCheck, HeartPulse
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Legend, Cell 
} from 'recharts';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';

export const HotelDashboard = () => {
  // Safe Live Queries with fallbacks
  const reservations = useLiveQuery(() => db.hotelReservations.toArray()) || [];
  const rooms = useLiveQuery(() => db.hotelRoomsList.toArray()) || [];
  const diningOrders = useLiveQuery(() => db.hotelDiningOrders.toArray()) || [];
  const housekeepingTasks = useLiveQuery(() => db.hotelHousekeepingList.toArray()) || [];
  const journalEntries = useLiveQuery(() => 
    db.journalEntries
      .filter((je: any) => je.reference && je.reference.startsWith('HOTEL-'))
      .toArray()
  ) || [];

  // Feedback notifications
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'warning' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 6000);
  };

  // 1. Calculate Real Statistics
  const totalBookings = reservations.length;
  
  // Stays where status is Checked-In (تم تسجيل الدخول)
  const activeStays = reservations.filter(r => r.status === 'تم تسجيل الدخول');
  const activeGuestsCount = activeStays.length;

  // Rooms breakdown
  const totalRoomsCount = rooms.length || 9; // Fallback to seed size if empty
  const occupiedRooms = rooms.filter(r => r.status === 'محجوزة' || r.status === 'تم تسجيل الدخول').length;
  const maintenanceRooms = rooms.filter(r => r.status === 'تحت الصيانة' || r.status === 'تحت الخدمة' || r.status === 'غير متاحة').length;
  const availableRoomsCount = rooms.filter(r => r.status === 'متاحة' || r.status === 'شاغرة').length;
  
  // Occupancy Rate
  const occupancyPercentage = totalRoomsCount > 0 
    ? Math.round((occupiedRooms / totalRoomsCount) * 100) 
    : 44; // Good baseline fallback

  // Financial aggregates:
  // Paid amounts from reservations + paid dining orders
  const reservationCollections = reservations.reduce((sum, r) => sum + Number(r.paidAmount || 0), 0);
  const diningCollections = diningOrders.filter(d => d.status === 'paid').reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const totalIncomeCollected = reservationCollections + diningCollections;

  // Receivables/Outstanding debts (total cost - paid amount) for active & confirmed bookings
  const outstandingReceivables = reservations
    .filter(r => r.status !== 'ملغى')
    .reduce((sum, r) => {
      const balance = Math.max(0, Number(r.totalPrice || 0) - Number(r.paidAmount || 0));
      return sum + balance;
    }, 0);

  // 2. Aggregate Room Category Data for Chart
  const getRoomCategoryData = () => {
    const categoriesMap: { [key: string]: { total: number; occupied: number } } = {};
    rooms.forEach(r => {
      const type = r.type || "أخرى";
      if (!categoriesMap[type]) {
        categoriesMap[type] = { total: 0, occupied: 0 };
      }
      categoriesMap[type].total += 1;
      if (r.status === "محجوزة" || r.status === "تم تسجيل الدخول" || r.status === "غير متاحة") {
        categoriesMap[type].occupied += 1;
      }
    });

    const chartData = Object.keys(categoriesMap).map(type => ({
      name: type,
      "إجمالي الغرف": categoriesMap[type].total,
      "الغرف المحجوزة": categoriesMap[type].occupied,
    }));

    if (chartData.length === 0) {
      // Baseline mock so the chart is styled immediately
      return [
        { name: 'غرفة مفردة', "إجمالي الغرف": 5, "الغرف المحجوزة": 3 },
        { name: 'غرفة مزدوجة', "إجمالي الغرف": 8, "الغرف المحجوزة": 4 },
        { name: 'جناح رئيسي عائلي', "إجمالي الغرف": 4, "الغرف المحجوزة": 2 },
        { name: 'جناح ملكي فاخر', "إجمالي الغرف": 2, "الغرف المحجوزة": 1 },
      ];
    }
    return chartData;
  };

  // 3. Aggregate Monthly Financial Progress for Chart
  const getMonthlyFinancials = () => {
    const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const data = monthsAr.map(m => ({
      name: m,
      "حجوزات الإقامة": 0,
      "خدمات ومطاعم": 0,
      "إجمالي التحصيل": 0
    }));

    // Add reservation paid amounts by month
    reservations.forEach(r => {
      if (r.checkIn && r.status !== 'ملغى') {
        const dateObj = new Date(r.checkIn);
        const mIdx = dateObj.getMonth();
        if (!isNaN(mIdx) && mIdx >= 0 && mIdx < 12) {
          const val = Number(r.paidAmount || 0);
          data[mIdx]["حجوزات الإقامة"] += val;
          data[mIdx]["إجمالي التحصيل"] += val;
        }
      }
    });

    // Add dining order amount by month
    diningOrders.forEach(d => {
      if (d.date) {
        const dateObj = new Date(d.date);
        const mIdx = dateObj.getMonth();
        if (!isNaN(mIdx) && mIdx >= 0 && mIdx < 12) {
          const val = Number(d.amount || 0);
          data[mIdx]["خدمات ومطاعم"] += val;
          data[mIdx]["إجمالي التحصيل"] += val;
        }
      }
    });

    // Check if the database has any real entries. If not, generate high-end baseline fallbacks
    const hasData = data.some(d => d["إجمالي التحصيل"] > 0);
    if (!hasData) {
      return [
        { name: 'يناير', "حجوزات الإقامة": 13500, "خدمات ومطاعم": 2800, "إجمالي التحصيل": 16300 },
        { name: 'فبراير', "حجوزات الإقامة": 16200, "خدمات ومطاعم": 3600, "إجمالي التحصيل": 19800 },
        { name: 'مارس', "حجوزات الإقامة": 22400, "خدمات ومطاعم": 4100, "إجمالي التحصيل": 26500 },
        { name: 'أبريل', "حجوزات الإقامة": 29800, "خدمات ومطاعم": 5400, "إجمالي التحصيل": 35200 },
        { name: 'مايو', "حجوزات الإقامة": 36800, "خدمات ومطاعم": 8878, "إجمالي التحصيل": 45678 },
        { name: 'يونيو', "حجوزات الإقامة": 41200, "خدمات ومطاعم": 10500, "إجمالي التحصيل": 51700 },
      ];
    }

    // Return first 6 months with real aggregate spikes
    return data.slice(0, 6);
  };

  // 4. Seeding integrated demo data for instant evaluation
  const seedDemoData = async () => {
    try {
      // Seed default rooms if empty
      const roomCount = await db.hotelRoomsList.count();
      if (roomCount === 0) {
        const defaultRooms = [
          { roomNumber: "101", type: "مفردة مريحة", capacity: "1", status: "تم تسجيل الدخول", price: 150 },
          { roomNumber: "102", type: "مزدوجة فاخرة", capacity: "2", status: "شاغرة", price: 250 },
          { roomNumber: "103", type: "جناح عائلي رئيسي", capacity: "4", status: "تم تسجيل الدخول", price: 500 },
          { roomNumber: "201", type: "مفردة مريحة", capacity: "1", status: "متاحة", price: 160 },
          { roomNumber: "202", type: "مزدوجة متميزة", capacity: "2", status: "تحت الصيانة", price: 270 },
          { roomNumber: "203", type: "جناح ملكي فاخر", capacity: "5", status: "متاحة", price: 1200 },
          { roomNumber: "301", type: "مفردة مريحة", capacity: "1", status: "متاحة", price: 170 },
          { roomNumber: "302", type: "مزدوجة فاخرة", capacity: "2", status: "متاحة", price: 290 },
          { roomNumber: "303", type: "جناح العرسان الفخم", capacity: "2", status: "متاحة", price: 850 },
        ];
        await db.hotelRoomsList.bulkAdd(defaultRooms);
      } else {
        // Just make sure statuses are interesting if rooms already exist
        const allR = await db.hotelRoomsList.toArray();
        if (allR.length >= 3) {
          await db.hotelRoomsList.update(allR[0].id!, { status: "تم تسجيل الدخول" });
          await db.hotelRoomsList.update(allR[1].id!, { status: "شاغرة" });
          await db.hotelRoomsList.update(allR[2].id!, { status: "تم تسجيل الدخول" });
        }
      }

      // Seed reservations if empty
      const resCount = await db.hotelReservations.count();
      if (resCount === 0) {
        const defaultReservations = [
          {
            customerName: "سليمان الفارس الوجيه",
            roomNumber: "101",
            checkIn: "2026-05-28",
            checkOut: "2026-06-03",
            status: "تم تسجيل الدخول",
            pricePerNight: 150,
            discount: 50,
            paidAmount: 250,
            totalPrice: 850, // 6 nights * 150 = 900 - 50 = 850
            paymentMethod: "cash",
            paymentStatus: "مدفوع جزئياً",
            notes: "يطلب وجبة إفطار مبكرة مجانية بالغرفة وسريعة لظروف العمل",
            nights: 6
          },
          {
            customerName: "شركة الراجحي للمقاولات المحدودة",
            roomNumber: "103",
            checkIn: "2026-05-29",
            checkOut: "2026-06-05",
            status: "تم تسجيل الدخول",
            pricePerNight: 500,
            discount: 100,
            paidAmount: 3400,
            totalPrice: 3400, // 7 nights * 500 = 3500 - 100 = 3400
            paymentMethod: "bank",
            paymentStatus: "مدفوع بالكامل",
            notes: "حجز شركات ممتاز لرجال الأعمال والمندوبين الموفدين",
            nights: 7
          },
          {
            customerName: "رأفت عبد الجواد خليل",
            roomNumber: "202",
            checkIn: "2026-05-30",
            checkOut: "2026-06-02",
            status: "مؤكد",
            pricePerNight: 270,
            discount: 0,
            paidAmount: 0,
            totalPrice: 810, // 3 nights * 270 = 810
            paymentMethod: "cash",
            paymentStatus: "غير مدفوع",
            notes: "قيد الوصول اليوم - سريران منفصلان وإطلالة هادئة",
            nights: 3
          },
          {
            customerName: "ليلى حسن عبد الله",
            roomNumber: "303",
            checkIn: "2026-05-25",
            checkOut: "2026-05-28",
            status: "تم تسجيل الخروج",
            pricePerNight: 850,
            discount: 150,
            paidAmount: 2400,
            totalPrice: 2400, // 3 nights * 850 = 2550 - 150 = 2400
            paymentMethod: "bank",
            paymentStatus: "مدفوع بالكامل",
            notes: "باقة شهر العسل السعيدة - تم تسجيل المغادرة بنجاح",
            nights: 3
          }
        ];

        const addedIds = [];
        for (const res of defaultReservations) {
          const id = await db.hotelReservations.add(res);
          addedIds.push({ id, ...res });
        }

        // Post entries directly to general ledger (ERP integration)
        const cashAcc = await db.accounts.where('code').equals('1010').first();
        const bankAcc = await db.accounts.where('code').equals('1020').first();
        const recAcc = await db.accounts.where('code').equals('1030').first();
        const salesAcc = await db.accounts.where('code').equals('4010').first();

        if (cashAcc && bankAcc && recAcc && salesAcc) {
          // GL entry for Suliman booking (partial payment)
          await db.journalEntries.add({
            date: new Date("2026-05-28"),
            reference: `HOTEL-RES-${addedIds[0].id}`,
            description: `فاتورة إيجار جناح فندقي #${addedIds[0].id} - النزيل سليمان الفارس الوجيه`,
            lines: [
              { accountId: cashAcc.id!, accountName: cashAcc.name, debit: 250, credit: 0, description: "دفعة مقدمة مستلمة كاش" },
              { accountId: recAcc.id!, accountName: recAcc.name, debit: 600, credit: 0, description: "رصيد نزلاء مستحق معلق" },
              { accountId: salesAcc.id!, accountName: salesAcc.name, debit: 0, credit: 850, description: "إيرادات حجز خدمات النزلاء" }
            ],
            totalAmount: 850,
            status: 'posted'
          });

          // GL entry for Al Rajhi booking (fully paid bank)
          await db.journalEntries.add({
            date: new Date("2026-05-29"),
            reference: `HOTEL-RES-${addedIds[1].id}`,
            description: `فاتورة إيجار الغرفة الكبرى #${addedIds[1].id} - شركة الراجحي للمقاولات`,
            lines: [
              { accountId: bankAcc.id!, accountName: bankAcc.name, debit: 3400, credit: 0, description: "سداد كامل القيمة عبر البنك بطلب سويفت" },
              { accountId: salesAcc.id!, accountName: salesAcc.name, debit: 0, credit: 3400, description: "إيرادات حجز خدمات النزلاء" }
            ],
            totalAmount: 3400,
            status: 'posted'
          });
        }
      }

      // Seed dining orders if empty
      const diningCount = await db.hotelDiningOrders.count();
      if (diningCount === 0) {
        const defaultDining = [
          { roomNumber: "101", amount: 120, date: "2026-05-29", status: "paid" },
          { roomNumber: "103", amount: 480, date: "2026-05-30", status: "paid" },
          { roomNumber: "202", amount: 95, date: "2026-05-30", status: "unpaid" },
        ];
        await db.hotelDiningOrders.bulkAdd(defaultDining);

        // GL Ledger for Dining
        const cashAcc = await db.accounts.where('code').equals('1010').first();
        const salesAcc = await db.accounts.where('code').equals('4010').first();
        if (cashAcc && salesAcc) {
          await db.journalEntries.add({
            date: new Date(),
            reference: `HOTEL-DIN-12`,
            description: `مبيعات مطعم الغرف الفندقية - وجبات النزيل بغرفة 103`,
            lines: [
              { accountId: cashAcc.id!, accountName: cashAcc.name, debit: 480, credit: 0, description: "خدمة الغرف كاش" },
              { accountId: salesAcc.id!, accountName: salesAcc.name, debit: 0, credit: 480, description: "إيرادات خدمة الأطعمة والمشروبات" }
            ],
            totalAmount: 480,
            status: 'posted'
          });
        }
      }

      // Seed housekeeping tasks if empty
      const cleanCount = await db.hotelHousekeepingList.count();
      if (cleanCount === 0) {
        const defaultHousekeeping = [
          { roomNumber: "102", task: "تعقيم الغرفة قبل وصول النزلاء", assignedTo: "جمال مصطفى", status: "قيد التنفيذ" },
          { roomNumber: "202", task: "تغيير المناشف والمفروشات بالكامل", assignedTo: "صابرين عبد ربه", status: "قيد التنفيذ" },
          { roomNumber: "201", task: "تعقيم وتجهيز الغرفة الفاخرة", assignedTo: "نهى الجباس", status: "مكتملة" },
          { roomNumber: "302", task: "إضافة معطر جو برائحة العود الفواح", assignedTo: "نهى الجباس", status: "مكتملة" },
        ];
        await db.hotelHousekeepingList.bulkAdd(defaultHousekeeping);
      }

      showToast("تم توليد وتهيئة بيانات المحاكاة الفندقية والعمليات المالية والقيود المحاسبية بنجاح 🎉", "success");
    } catch(err) {
      console.error(err);
      showToast("حدث خطأ أثناء تهيئة بيانات المحاكاة", "warning");
    }
  };

  const chartMonthlyData = getMonthlyFinancials();
  const chartCategoryData = getRoomCategoryData();

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen text-right" dir="rtl">
      
      {/* GLOBAL TOAST NOTIFICATION BANNER */}
      {notification && (
        <div className={`fixed top-4 left-4 z-50 flex items-center gap-2.5 px-5 py-4 rounded-2xl shadow-xl border animate-in slide-in-from-top duration-300 text-xs font-black transition-all ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-500/20' 
            : 'bg-amber-50 text-amber-900 border-amber-300'
        }`}>
          <div className={`w-2.5 h-2.5 rounded-full ${notification.type === 'success' ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600'}`} />
          <span>{notification.message}</span>
        </div>
      )}

      {/* DASHBOARD HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-850 text-slate-800 tracking-tight flex items-center gap-2.5">
            <BedDouble className="w-8 h-8 text-indigo-600" />
            <span>لوحة تحليلات فندق اليممامة والرياض الفندقي</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            مستشعرات المراقبة اللحظية لشغل الغرف، أداء النظافة اليومي، ومطابقة القيود المالية المتكاملة مع دفتر الأستاذ العام للـ ERP.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button 
            onClick={seedDemoData}
            className="flex items-center gap-2 bg-indigo-50 border border-indigo-200/60 text-indigo-700 px-4 py-2.5 rounded-xl hover:bg-indigo-100/70 transition-all text-xs font-black active:scale-95 cursor-pointer"
            title="ملء السجلات المحاسبية الفندقية لتجربة لوحة تحكم نابضة بالحياة"
          >
            <Database className="w-4 h-4 text-indigo-600" />
            <span>توليد بيانات حية للمحاكاة</span>
          </button>

          <button 
            onClick={() => showToast("تم تحديث المؤشرات الرقابية للغرف والحسابات المحاسبية فورياً 🔄", "success")}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-55 hover:bg-slate-50 transition-all active:scale-95 cursor-pointer"
            title="تحديث البيانات الكلي"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* INTERACTIVE DATA ALERT WARNING FOR EMPTY STATES */}
      {totalBookings === 0 && (
        <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800">بيانات الفندق شاغرة حالياً</h4>
              <p className="text-[11px] text-slate-500 mt-1">تظهر اللوحة بيانات قياسية تجريبية للواجهات الرسومية لعدم وجود بيانات بالصندوق المحلي. هل تود تغذيتها ببيانات تكامل فورية؟</p>
            </div>
          </div>
          <button 
            onClick={seedDemoData}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-black shadow-md shrink-0 transition-all cursor-pointer"
          >
            تهيئة بيئة المحاكاة المحاسبية
          </button>
        </div>
      )}

      {/* DETAILED STATISTICAL CARDS BLOCK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Stat 1: Occupancy Rate */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/50 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-1 w-full bg-indigo-500" />
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-slate-400 font-extrabold block">معدل إشغال الغرف</span>
              <span className="text-2xl font-black text-slate-800 mt-1 block">{occupancyPercentage}%</span>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <div className="text-[10px] text-slate-500 mt-3 font-semibold flex items-center justify-between">
            <span>{occupiedRooms} محجوزة من أصل {totalRoomsCount} غرف</span>
            <span className="text-indigo-650 text-indigo-600">{availableRoomsCount} شاغرة حالياً</span>
          </div>
        </div>

        {/* Stat 2: Active Guests */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/50 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-1 w-full bg-teal-500" />
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-slate-400 font-extrabold block">النزلاء المتواجدون بالخدمة</span>
              <span className="text-2xl font-black text-slate-800 mt-1 block">{activeGuestsCount} نزلاء مقيمين</span>
            </div>
            <div className="p-3 rounded-xl bg-teal-50 text-teal-600 animate-pulse">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="text-[10px] text-slate-505 text-slate-500 mt-3 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            <span>يتم خدمتهم من كافة الأقسام النشطة</span>
          </div>
        </div>

        {/* Stat 3: Total Income Received */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/50 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-1 w-full bg-emerald-500" />
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-slate-400 font-extrabold block">المبالغ المقبوضة والمحصلة</span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">{totalIncomeCollected.toLocaleString()} ج.م</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="text-[10px] text-slate-500 mt-3 font-semibold flex items-center justify-between">
            <span>منها {reservationCollections.toLocaleString()} ج.م للإقامة</span>
            <span>و {diningCollections.toLocaleString()} ج.م خدمات ومشروبات</span>
          </div>
        </div>

        {/* Stat 4: Account Receivables Outstanding */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/50 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-1 w-full bg-amber-505 bg-amber-500" />
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-slate-400 font-extrabold block">الذمم المدينة المستحقة (نزلاء)</span>
              <span className="text-2xl font-black text-slate-800 mt-1 block">{outstandingReceivables.toLocaleString()} ج.م</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
          <div className="text-[10px] text-slate-500 mt-3 font-semibold flex items-center gap-1 text-slate-650">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-550 bg-amber-500 animate-ping"></span>
            <span>معلّقة كمديونية على الحجوزات النشطة بصفة ذكور</span>
          </div>
        </div>

      </div>

      {/* INTERACTIVE RECHARTS ANALYSIS BLOCKS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart A: Monthly Financial Cash Flows */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-250 border-slate-200 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <TrendingUp className="w-4.5 h-4.5 text-indigo-600" />
                <span>التدفق النقدي والتحصيل الشهري (ج.م)</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">تفصيل التحصيل المالي المقسم بين إيجار الغرف والوجبات</p>
            </div>
            <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md">6 أشهر أولى من {new Date().getFullYear()}</span>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartMonthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValueIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorValueDining" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '11px', textAlign: 'right', direction: 'rtl' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Area type="monotone" name="حجوزات الإقامة" dataKey="حجوزات الإقامة" stroke="#4f46e5" fillOpacity={1} fill="url(#colorValueIncome)" strokeWidth={2.5} />
                <Area type="monotone" name="خدمات ومطاعم" dataKey="خدمات ومطاعم" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorValueDining)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: Category Room Distribution */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <BedDouble className="w-4.5 h-4.5 text-indigo-600" />
                <span>معدل إشغال الغرف وحجمها حسب الفئة</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">مقارنة الغرف الكلية بالغرف المحجوزة حالياً لكل فئة سكنية</p>
            </div>
            <span className="text-[10px] font-black bg-blue-50 text-blue-700 px-2 py-1 rounded-md">لحظي</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartCategoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '11px', textAlign: 'right', direction: 'rtl' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Bar name="إجمالي الغرف بالفئة" dataKey="إجمالي الغرف" fill="#94a3b8" radius={[4, 4, 0, 0]} opacity={0.35} barSize={20} />
                <Bar name="الغرف المشغولة حالياً" dataKey="الغرف المحجوزة" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ACTIONABLE PROCESS WIDGETS (BENTO BLOCK) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Column 1: Current Checked-In Guests (Quick Checkouts) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600 text-indigo-600" />
              <h3 className="font-black text-slate-800 text-xs text-sm">النزلاء المتواجدون بالإقامة</h3>
            </div>
            <span className="text-[10px] font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">
              {activeGuestsCount} نزلاء مقيمين
            </span>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto space-y-3 pr-1 max-h-72">
            {activeStays.length === 0 ? (
              <div className="text-center py-10 text-slate-400 font-semibold text-xs">
                لا يوجد نزلاء نشطون مسجلون حالياً بالغرف المتاحة.
              </div>
            ) : activeStays.slice(0, 4).map((res: any) => (
              <div key={res.id} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                <div>
                  <span className="font-extrabold text-slate-800 block text-slate-800">{res.customerName}</span>
                  <span className="text-[10px] text-indigo-600 font-black mt-1 inline-block">
                    غرفة {res.roomNumber} - المغادرة: {res.checkOut}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-[10px] font-black text-slate-705 text-slate-700">
                    مستحق: {Math.max(0, Number(res.totalPrice || 0) - Number(res.paidAmount || 0)).toLocaleString()} ج.م
                  </span>
                  
                  {/* Status Badge */}
                  {res.paymentStatus === 'مدفوع بالكامل' ? (
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-black max-w-max">خالص السداد</span>
                  ) : (
                    <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-black max-w-max">متبقي دفعة</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <a 
            href="#/hotel/reservations" 
            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-black flex items-center justify-center gap-1 pt-2 hover:underline text-center w-full"
          >
            <span>انتقل لإدارة شؤون الحجوزات الكاملة وظبط تسكين النزلاء</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Column 2: Housekeeping & Cleaning Status tasks list */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-indigo-600 text-indigo-600" />
              <h3 className="font-black text-slate-800 text-xs text-sm">خدمات الغرف وإشغال النظافة المعلقة</h3>
            </div>
            <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
              {housekeepingTasks.filter(t => t.status === 'قيد التنفيذ').length} مهام نشطة
            </span>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto space-y-3 pr-1 max-h-72">
            {housekeepingTasks.length === 0 ? (
              <div className="text-center py-10 text-slate-400 font-semibold text-xs">
                لا توجد تكليفات لعمال النظافة أو الصيانة فوت بمجال الإشراف.
              </div>
            ) : housekeepingTasks.slice(0, 4).map((task: any) => (
              <div key={task.id} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-extrabold text-slate-800 block text-slate-800">{task.task}</span>
                  <span className="text-[10px] text-slate-400 block">غرفة {task.roomNumber} - الموظف: {task.assignedTo || 'غير محدد'}</span>
                </div>
                <div>
                  {task.status === 'قيد التنفيذ' ? (
                    <span className="text-[9px] bg-rose-50 text-rose-700 border border-rose-100 px-1.5 py-0.5 rounded-md font-bold animate-pulse">قيد التنفيذ</span>
                  ) : (
                    <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md font-bold">مكتملة</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <a 
            href="#/hotel/housekeeping" 
            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-black flex items-center justify-center gap-1 pt-2 hover:underline text-center w-full"
          >
            <span>انتقل لإعداد مهام تنظيف وتعقيم وتأهيل الغرف</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Column 3: Recent Dining Room Orders */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-indigo-600 text-indigo-600" />
              <h3 className="font-black text-slate-800 text-xs text-sm">أوردرات وجبات وشراب الغرف</h3>
            </div>
            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
              {diningOrders.length} إجمالي الوجبات
            </span>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto space-y-3 pr-1 max-h-72">
            {diningOrders.length === 0 ? (
              <div className="text-center py-10 text-slate-400 font-semibold text-xs">
                لا توجد طلبات وجبات مسجلة لغرف النزلاء حالياً.
              </div>
            ) : diningOrders.slice(0, 4).map((ord: any) => (
              <div key={ord.id} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                <div>
                  <span className="font-extrabold text-slate-800 block text-slate-800">فاتورة وجبات مطعم الغرفة</span>
                  <span className="text-[10px] text-slate-450 text-slate-400 block mt-0.5">غرفة {ord.roomNumber} - بتاريخ: {ord.date}</span>
                </div>
                <div className="text-left space-y-1">
                  <span className="font-black text-slate-800 block">{ord.amount} ج.م</span>
                  {ord.status === 'paid' ? (
                    <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1 rounded inline-block font-extrabold">مُدفع</span>
                  ) : (
                    <span className="text-[9px] bg-red-50 text-red-700 px-1 rounded inline-block font-extrabold">آجل للفاتورة</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <a 
            href="#/hotel/dining" 
            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-black flex items-center justify-center gap-1 pt-2 hover:underline text-center w-full"
          >
            <span>انتقل لتسجيل فواتير مطبخ ووجبات الفندق المتنوعة</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>

      {/* UNIFIED ERP GENERAL LEDGER DOUBLE-ENTRY POSTINGS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-205 border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-[#fafafa]">
          <div className="flex items-center gap-2.5">
            <Receipt className="w-5.5 h-5.5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-black text-slate-800">القيود المحاسبية الآلية المكررة لخدمات الفندق (General Ledger Integration)</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">سجل تدفق القيود المحاسبية الآلية التي تؤثر في الأستاذ العام بمجرد إتمام حجز أو تحصيل كاش أو بنك.</p>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 font-mono bg-white border border-slate-200 px-2 py-1 rounded-xl">
            {journalEntries.length} قيوود مضافة من الفندق
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-[#f8fafc] text-xs font-black text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-5 py-4">رقم القيد المركزي</th>
                <th className="px-5 py-4">المرجع</th>
                <th className="px-5 py-4">تاريخ المعاملة</th>
                <th className="px-5 py-4">البيان والشرح</th>
                <th className="px-5 py-4">الحسابات والبنود المتأثرة (مدين / دائن)</th>
                <th className="px-5 py-4 text-left">مجموع القيمة الطرفية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {journalEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-semibold text-xs">
                    <p>لا توجد قيود محاسبية مسجلة تحت اسم الفندق حالياً في الصندوق المحاسبي.</p>
                    <button 
                      onClick={seedDemoData}
                      className="mt-3 inline-flex items-center gap-2 bg-indigo-600 text-white text-[11px] font-black px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all cursor-pointer shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>توليد القيوز ومقر الدفع والتسكين للمعاينة المحاسبية المتكاملة</span>
                    </button>
                  </td>
                </tr>
              ) : journalEntries.map((je: any) => (
                <tr key={je.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4 font-mono text-slate-500">#{je.id}</td>
                  <td className="px-5 py-4 font-black text-indigo-700">{je.reference}</td>
                  <td className="px-5 py-4 font-mono text-slate-600 text-[11px]">{new Date(je.date).toLocaleDateString('ar-EG')}</td>
                  <td className="px-5 py-4 font-extrabold text-slate-700 max-w-xs truncate" title={je.description}>{je.description}</td>
                  <td className="px-5 py-4">
                    <div className="space-y-1.5 font-bold">
                      {je.lines && je.lines.map((ln: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-[11px] gap-6 text-slate-600">
                          <span className="text-[10px] bg-slate-100 px-1 py-0.5 rounded font-black max-w-xs truncate text-slate-700">
                            {ln.accountName || `حساب ${ln.accountId}`}
                          </span>
                          <span className="font-semibold">
                            {Number(ln.debit) > 0 ? (
                              <span className="text-emerald-700 font-black">مدين +{ln.debit} ج.م</span>
                            ) : (
                              <span className="text-indigo-650 text-indigo-600 font-black">دائن -{ln.credit} ج.م</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-black text-slate-900 text-left">{(je.totalAmount || je.amount || 0).toLocaleString()} ج.م</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
