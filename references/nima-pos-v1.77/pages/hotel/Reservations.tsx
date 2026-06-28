import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Edit2, Trash2, X, 
  Calendar, DollarSign, CreditCard, Users, 
  Clock, AlertTriangle, ArrowRight, 
  Printer, Receipt, BedDouble, Percent, Info, CheckCircle2
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import ConfirmModal from '../../components/ui/ConfirmModal';

export const Reservations = () => {
  // State for search and active filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('الكل');
  const [filterPayment, setFilterPayment] = useState('الكل');

  // Modal control states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  // Billing and Checkout modal states
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [activeBillingRes, setActiveBillingRes] = useState<any>(null);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'cash' | 'bank'>('cash');
  const [checkoutPayAmount, setCheckoutPayAmount] = useState<number>(0);

  // Custom ConfirmModal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Custom notifications and alerts
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);

  // Initial Form Data
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerNationalId: "",
    companionName: "",
    companionId: "",
    roomNumber: "",
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
    status: "مؤكد",
    pricePerNight: 200,
    discount: 0,
    paidAmount: 0,
    paymentMethod: "cash" as 'cash' | 'bank',
    paymentStatus: "غير مدفوع",
    notes: "",
    services: [] as Array<{ id: number; name: string; price: number; quantity: number }>
  });

  // Load reservations, rooms, services and dining orders from Dexie
  const records = useLiveQuery(() => db.hotelReservations.toArray()) || [];
  const roomsList = useLiveQuery(() => db.hotelRoomsList.toArray()) || [];
  const servicesList = useLiveQuery(() => db.hotelServicesList.toArray()) || [];
  const diningOrdersList = useLiveQuery(() => db.hotelDiningOrders.toArray()) || [];

  // Seed default rooms if empty
  useEffect(() => {
    const seedRoomsIfEmpty = async () => {
      try {
        const count = await db.hotelRoomsList.count();
        if (count === 0) {
          const defaultRooms = [
            { roomNumber: "101", type: "مفردة", capacity: "1", status: "متاحة", price: 150 },
            { roomNumber: "102", type: "مزدوجة", capacity: "2", status: "متاحة", price: 250 },
            { roomNumber: "103", type: "جناح رئيسي", capacity: "4", status: "متاحة", price: 500 },
            { roomNumber: "201", type: "مفردة", capacity: "1", status: "متاحة", price: 160 },
            { roomNumber: "202", type: "مزدوجة", capacity: "2", status: "متاحة", price: 270 },
            { roomNumber: "203", type: "جناح عائلي", capacity: "4", status: "متاحة", price: 550 },
            { roomNumber: "301", type: "مفردة متميزة", capacity: "1", status: "متاحة", price: 200 },
            { roomNumber: "302", type: "مزدوجة فاخرة", capacity: "2", status: "متاحة", price: 320 },
            { roomNumber: "303", type: "جناح ملكي فاخر", capacity: "6", status: "متاحة", price: 1200 },
          ];
          await db.hotelRoomsList.bulkAdd(defaultRooms);
          showToast("تم تهيئة قائمة الغرف الافتراضية للفندق بنجاح 🏨", "success");
        }
      } catch (err) {
        console.error("Failed to seed initial hotel rooms:", err);
      }
    };
    seedRoomsIfEmpty();
  }, []);

  // Show customized non-blocking notification toast
  const showToast = (message: string, type: 'success' | 'warning' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Helper code for staying length
  const calculateNights = (inDate: string, outDate: string) => {
    if (!inDate || !outDate) return 1;
    const diff = new Date(outDate).getTime() - new Date(inDate).getTime();
    const nights = Math.round(diff / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 1;
  };

  // Watch stay dates or selected room to auto-adjust total prices
  const servicesSerialized = JSON.stringify(formData.services || []);
  useEffect(() => {
    const selectedRoom = roomsList.find(r => r.roomNumber === formData.roomNumber);
    const roomPrice = selectedRoom ? Number(selectedRoom.price || 150) : formData.pricePerNight;
    const nights = calculateNights(formData.checkIn, formData.checkOut);
    const parsedServices = formData.services || [];
    const servicesCost = parsedServices.reduce((acc: number, s: any) => acc + (Number(srvPrice(s)) * (Number(s.quantity) || 1)), 0);
    const rawTotal = (roomPrice * nights) + servicesCost;
    const netTotal = Math.max(0, rawTotal - Number(formData.discount));
    
    let currentPaymentStatus = "غير مدفوع";
    if (Number(formData.paidAmount) >= netTotal && netTotal > 0) {
      currentPaymentStatus = "مدفوع بالكامل";
    } else if (Number(formData.paidAmount) > 0) {
      currentPaymentStatus = "مدفوع جزئياً";
    }

    if (formData.pricePerNight !== roomPrice || formData.paymentStatus !== currentPaymentStatus) {
      setFormData(prev => ({
        ...prev,
        pricePerNight: roomPrice,
        paymentStatus: currentPaymentStatus
      }));
    }
  }, [formData.roomNumber, formData.checkIn, formData.checkOut, formData.discount, formData.paidAmount, servicesSerialized, roomsList]);

  // Safe helper to extract service price
  const srvPrice = (s: any) => {
    return s ? Number(s.price || 0) : 0;
  };

  // Handle open modal
  const handleOpenModal = (editMode = false, item: any = null) => {
    setIsEdit(editMode);
    if (editMode && item) {
      setCurrentId(item.id!);
      setFormData({
        customerName: item.customerName,
        customerPhone: item.customerPhone || "",
        customerNationalId: item.customerNationalId || "",
        companionName: item.companionName || "",
        companionId: item.companionId || "",
        roomNumber: item.roomNumber,
        checkIn: item.checkIn,
        checkOut: item.checkOut,
        status: item.status,
        pricePerNight: item.pricePerNight || 200,
        discount: item.discount || 0,
        paidAmount: item.paidAmount || 0,
        paymentMethod: item.paymentMethod || "cash",
        paymentStatus: item.paymentStatus || "غير مدفوع",
        notes: item.notes || "",
        services: item.services || []
      });
    } else {
      setCurrentId(null);
      const avail = roomsList.find(r => r.status === 'متاحة') || roomsList[0];
      setFormData({
        customerName: "",
        customerPhone: "",
        customerNationalId: "",
        companionName: "",
        companionId: "",
        roomNumber: avail ? avail.roomNumber : "",
        checkIn: new Date().toISOString().split('T')[0],
        checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        status: "مؤكد",
        pricePerNight: avail ? Number(avail.price || 150) : 200,
        discount: 0,
        paidAmount: 0,
        paymentMethod: "cash",
        paymentStatus: "غير مدفوع",
        notes: "",
        services: []
      });
    }
    setIsModalOpen(true);
  };

  // Safe save handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const nights = calculateNights(formData.checkIn, formData.checkOut);
      const servicesCost = (formData.services || []).reduce((acc: number, s: any) => acc + (Number(s.price) * (Number(s.quantity) || 1)), 0);
      const rawTotal = (formData.pricePerNight * nights) + servicesCost;
      const finalPrice = Math.max(0, rawTotal - Number(formData.discount));

      const savingData = {
        ...formData,
        pricePerNight: Number(formData.pricePerNight),
        discount: Number(formData.discount),
        paidAmount: Number(formData.paidAmount),
        totalPrice: finalPrice,
        nights: nights
      };

      let reservationId = currentId;

      if (isEdit && currentId) {
        await db.hotelReservations.update(currentId, savingData);
        showToast(`تم تحديث حجز النزيل: ${formData.customerName} بنجاح`, "success");
      } else {
        const addedId = await db.hotelReservations.add(savingData);
        reservationId = addedId;
        showToast(`تم تسجيل حجز جديد للنزيل: ${formData.customerName} بنجاح`, "success");

        // Real-time automatic General Ledger Impact for payments (sales & receivables)
        try {
          const cashAcc = await db.accounts.where('code').equals('1010').first();
          const bankAcc = await db.accounts.where('code').equals('1020').first();
          const recAcc = await db.accounts.where('code').equals('1030').first();
          const salesAcc = await db.accounts.where('code').equals('4010').first();

          const debitLines = [];
          const paidVal = Number(formData.paidAmount);
          const unpaidVal = Math.max(0, finalPrice - paidVal);

          let activePaymentAcc = cashAcc;
          if (formData.paymentMethod === 'bank') {
            activePaymentAcc = bankAcc;
          }

          if (paidVal > 0 && activePaymentAcc) {
            debitLines.push({
              accountId: activePaymentAcc.id!,
              accountName: activePaymentAcc.name,
              debit: paidVal,
              credit: 0,
              description: `سداد حجز نزيل: ${formData.customerName}`
            });
          }

          if (unpaidVal > 0 && recAcc) {
            debitLines.push({
              accountId: recAcc.id!,
              accountName: recAcc.name,
              debit: unpaidVal,
              credit: 0,
              description: `متبقي ذمة غير مدفوعة للنزيل: ${formData.customerName}`
            });
          }

          if (salesAcc && debitLines.length > 0) {
            await db.journalEntries.add({
              date: new Date(formData.checkIn),
              reference: `HOTEL-RES-${addedId}`,
              description: `فاتورة حجز فندقي رقم الحجز #${addedId} - النزيل: ${formData.customerName} - غرفة ${formData.roomNumber}`,
              lines: [
                ...debitLines,
                {
                  accountId: salesAcc.id!,
                  accountName: salesAcc.name,
                  debit: 0,
                  credit: finalPrice,
                  description: `مبيعات وإيرادات حجز الغرف الفندقية`
                }
              ],
              totalAmount: finalPrice,
              status: 'posted'
            });

            // Also document in hotelBilling table
            await db.hotelBilling.add({
              reservationId: addedId,
              amount: finalPrice,
              date: new Date().toISOString().split('T')[0],
              status: paidVal >= finalPrice ? "مدفوع بالكامل" : paidVal > 0 ? "مدفوع جزئياً" : "غير مدفوع"
            });
          }
        } catch (glError) {
          console.error("Failed to append journal ledger logs for hotel reservation:", glError);
        }
      }

      // If active status is "تم تسجيل الدخول" (Checked-in), mark the physical room as Occupied (محجوزة)
      const targetStatus = formData.status;
      const targetRoom = roomsList.find(r => r.roomNumber === formData.roomNumber);
      if (targetRoom) {
        let nextRoomStatus = "متاحة";
        if (targetStatus === "تم تسجيل الدخول") {
          nextRoomStatus = "محجوزة";
        } else if (targetStatus === "مؤكد") {
          nextRoomStatus = "متاحة";
        }
        await db.hotelRoomsList.update(targetRoom.id!, { status: nextRoomStatus });
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast('خطأ أثناء حفظ الحجز في قاعدة البيانات المحلية', 'warning');
    }
  };

  // Custom modal open delete
  const triggerDeleteConfirm = (id: number) => {
    setDeleteId(id);
    setIsConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (deleteId) {
      try {
        const res = records.find(r => r.id === deleteId);
        if (res) {
          // Reset room status if checked-in or booked
          const roomObj = roomsList.find(r => r.roomNumber === res.roomNumber);
          if (roomObj) {
            await db.hotelRoomsList.update(roomObj.id!, { status: "متاحة" });
          }
        }

        await db.hotelReservations.delete(deleteId);
        showToast('تم حذف سجل الحجز بنجاح', 'success');
      } catch (err) {
        showToast('فشل حذف سجل الحجز', 'warning');
      }
      setDeleteId(null);
    }
  };

  // Quick Action: Active Checked In (تسجيل دخول فوري)
  const handleQuickCheckin = async (res: any) => {
    try {
      await db.hotelReservations.update(res.id!, { status: "تم تسجيل الدخول" });
      const room = roomsList.find(r => r.roomNumber === res.roomNumber);
      if (room) {
        await db.hotelRoomsList.update(room.id!, { status: "محجوزة" });
      }
      showToast(`تم تسجيل الدخول الفعلي للنزيل: ${res.customerName} وتخصيص الغرفة ${res.roomNumber}`, 'success');
    } catch (e) {
      showToast('خطأ تسجيل الدخول السريع', 'warning');
    }
  };

  // Open Billing settle receipt modal
  const openBillingReceipt = (res: any) => {
    setActiveBillingRes(res);
    
    // Fetch unpaid dining orders for this room
    const roomDining = diningOrdersList.filter(
      (d: any) => String(d.roomNumber) === String(res.roomNumber) && d.status !== 'مدفوع' && d.status !== 'paid'
    );
    const diningTotal = roomDining.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    const baseBalance = Math.max(0, Number(res.totalPrice || 0) - Number(res.paidAmount || 0));
    setCheckoutPayAmount(baseBalance + diningTotal);
    setIsBillingModalOpen(true);
  };

  // Handle Checkout settlement payment
  const handleCheckoutSettle = async () => {
    if (!activeBillingRes) return;
    try {
      const roomDining = diningOrdersList.filter(
        (d: any) => String(d.roomNumber) === String(activeBillingRes.roomNumber) && d.status !== 'مدفوع' && d.status !== 'paid'
      );
      const diningTotal = roomDining.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

      const addedPaidAmount = Number(checkoutPayAmount);
      const prevPaid = Number(activeBillingRes.paidAmount || 0);
      const finalPaid = prevPaid + addedPaidAmount;
      
      const basePrice = Number(activeBillingRes.totalPrice || 0);
      const compositeTotalPrice = basePrice + diningTotal;

      const nextPayStatus = finalPaid >= compositeTotalPrice ? "مدفوع بالكامل" : finalPaid > 0 ? "مدفوع جزئياً" : "غير مدفوع";

      // Update reservation table
      await db.hotelReservations.update(activeBillingRes.id!, {
        totalPrice: compositeTotalPrice,
        paidAmount: finalPaid,
        paymentStatus: nextPayStatus,
        status: "تم تسجيل الخروج"
      });

      // Mark associated dining orders as paid
      if (roomDining.length > 0) {
        await Promise.all(
          roomDining.map(d => db.hotelDiningOrders.update(d.id!, { status: 'مدفوع' }))
        );
      }

      // Free room back to available status
      const room = roomsList.find(r => r.roomNumber === activeBillingRes.roomNumber);
      if (room) {
        await db.hotelRoomsList.update(room.id!, { status: "متاحة" });
      }

      // Record supplementary General Ledger Entry
      if (addedPaidAmount > 0) {
        try {
          const cashAcc = await db.accounts.where('code').equals('1010').first();
          const bankAcc = await db.accounts.where('code').equals('1020').first();
          const recAcc = await db.accounts.where('code').equals('1030').first();

          let selectedAcc = cashAcc;
          if (checkoutPaymentMethod === 'bank') {
            selectedAcc = bankAcc;
          }

          if (selectedAcc && recAcc) {
            const outstandingRoomBalance = Math.max(0, basePrice - prevPaid);
            const creditReceivable = Math.min(addedPaidAmount, outstandingRoomBalance);
            const extraRevenue = Math.max(0, addedPaidAmount - creditReceivable);

            const lines = [
              {
                accountId: selectedAcc.id!,
                accountName: selectedAcc.name,
                debit: addedPaidAmount,
                credit: 0,
                description: `تحصيل نقدي عند مغادرة وتسوية حجز #${activeBillingRes.id}`
              }
            ];

            if (creditReceivable > 0) {
              lines.push({
                accountId: recAcc.id!,
                accountName: recAcc.name,
                debit: 0,
                credit: creditReceivable,
                description: `تسوية وتخفيض ذمة زبون حجز الغرف للنزيل ${activeBillingRes.customerName}`
              });
            }

            if (extraRevenue > 0) {
              const salesAcc = await db.accounts.where('code').equals('4010').first();
              if (salesAcc) {
                lines.push({
                  accountId: salesAcc.id!,
                  accountName: salesAcc.name,
                  debit: 0,
                  credit: extraRevenue,
                  description: `إيرادات خدمات غرف وطعام إضافية للغرفة ${activeBillingRes.roomNumber}`
                });
              }
            }

            await db.journalEntries.add({
              date: new Date(),
              reference: `HOTEL-SETTLE-${activeBillingRes.id}`,
              description: `تحصيل وتسوية حجز #${activeBillingRes.id} للنزيل: ${activeBillingRes.customerName} (شامل خدمات الغرف المطعمية والإضافية)`,
              lines: lines,
              totalAmount: addedPaidAmount,
              status: 'posted'
            });

            // Log supplementary hotelBilling record
            await db.hotelBilling.add({
              reservationId: activeBillingRes.id!,
              amount: addedPaidAmount,
              date: new Date().toISOString().split('T')[0],
              status: finalPaid >= compositeTotalPrice ? "مدفوع بالكامل" : "مدفوع جزئياً"
            });
          }
        } catch (glError) {
          console.error("Failed to append GL logs for hotel check-out settlement:", glError);
        }
      }

      showToast(`تمت تسوية الفاتورة ومغادرة النزيل في الغرفة ${activeBillingRes.roomNumber} بنجاح`, "success");
      setIsBillingModalOpen(false);
      setActiveBillingRes(null);
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء مغادرة النزيل وتسوية الفاتورة', 'warning');
    }
  };

  // Filter records based on search, status and payment
  const filteredRecords = records.filter((item: any) => {
    const matchesSearch = Object.values(item).some(val => 
      String(val).toLowerCase().includes(search.toLowerCase())
    );

    const matchesStatus = filterStatus === 'الكل' || item.status === filterStatus;
    const matchesPayment = filterPayment === 'الكل' || item.paymentStatus === filterPayment;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Calculate live statistical counters
  const totalBookings = records.length;
  const activeStays = records.filter(r => r.status === 'تم تسجيل الدخول').length;
  const pendingBookings = records.filter(r => r.status === 'مؤكد' || r.status === 'قيد الانتظار').length;
  const totalRevenueCollected = records.reduce((sum, r) => sum + Number(r.paidAmount || 0), 0);

  return (
    <div className="p-6 space-y-6 bg-[#f8fafc] min-h-screen text-right" dir="rtl">
      
      {/* GLOBAL TOAST NOTIFICATION BANNER */}
      {notification && (
        <div className={`fixed top-4 left-4 z-50 flex items-center gap-2 px-5 py-3.5 rounded-xl shadow-xl border animate-in slide-in-from-top duration-300 text-xs font-black transition-all ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-500/20' 
            : 'bg-amber-50 text-amber-900 border-amber-300'
        }`}>
          <div className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600'}`} />
          <span>{notification.message}</span>
        </div>
      )}

      {/* HEADER SECTION AND ACTION BUTTON */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <BedDouble className="w-7 h-7 text-indigo-600" />
            <span>مكتب الحجوزات وإقامة النزلاء</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1">تسجيل النزلاء، متابعة الغرف الشاغرة، وتأكيد فواتير الدفع والتسويات المحاسبية المتكاملة.</p>
        </div>
        <button 
          id="btn-add-reservation"
          onClick={() => handleOpenModal(false)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 hover:bg-indigo-700 transition-all font-black text-xs cursor-pointer active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>حجز غرفة جديد</span>
        </button>
      </div>

      {/* STATISTICS OVERVIEW PANELS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50 text-slate-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-extrabold block">إجمالي حركات الحجز</span>
            <span className="text-xl font-black text-slate-800">{totalBookings} حجز</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-indigo-50 text-indigo-600">
            <Users className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-extrabold block">النزلاء المتواجدون حالياً</span>
            <span className="text-xl font-black text-slate-800">{activeStays} مقيمين</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-amber-50 text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-extrabold block">بانتظار تسجيل الوصول</span>
            <span className="text-xl font-black text-slate-800">{pendingBookings} حجز قادم</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-extrabold block">إجمالي التحصيل المالي</span>
            <span className="text-xl font-black text-emerald-700">{totalRevenueCollected.toLocaleString()} ج.م</span>
          </div>
        </div>

      </div>

      {/* FILTER AND SEARCH CONTROLS CONTAINER */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4.5 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث باسم النزيل، رقم الغرفة، أو حالة السداد..." 
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 bg-slate-50/50 text-xs font-bold text-slate-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>حالة الإقامة:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white text-slate-800 font-black cursor-pointer text-xs focus:ring-2 focus:ring-indigo-500/10"
            >
              <option value="الكل">الكل</option>
              <option value="مؤكد">مؤكد</option>
              <option value="تم تسجيل الدخول">تم تسجيل الدخول</option>
              <option value="تم تسجيل الخروج">تم تسجيل الخروج</option>
              <option value="ملغى">ملغى</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span>الدفعة الماليّة:</span>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white text-slate-800 font-black cursor-pointer text-xs focus:ring-2 focus:ring-indigo-500/10"
            >
              <option value="الكل">الكل</option>
              <option value="مدفوع بالكامل">مدفوع بالكامل</option>
              <option value="مدفوع جزئياً">مدفوع جزئياً</option>
              <option value="غير مدفوع">غير مدفوع</option>
            </select>
          </div>

        </div>

      </div>

      {/* RESERVATIONS LOG LIST TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-5 py-4 text-xs font-black">رقم الحجز</th>
                <th className="px-5 py-4 text-xs font-black">النزيل</th>
                <th className="px-5 py-4 text-xs font-black">رقم الغرفة</th>
                <th className="px-5 py-4 text-xs font-black">تاريخ الإقامة</th>
                <th className="px-5 py-4 text-xs font-black">الليالي / السعر</th>
                <th className="px-5 py-4 text-xs font-black">المالية والحسابات</th>
                <th className="px-5 py-4 text-xs font-black">حالة الحجز</th>
                <th className="px-5 py-4 text-xs font-black text-center">الإجراءات والعمليات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-semibold">
                    لا توجد حجوزات تتطابق مع معايير البحث والتصفية المتطابقة.
                  </td>
                </tr>
              ) : filteredRecords.map((item: any) => {
                const balanceOwed = Math.max(0, Number(item.totalPrice || 0) - Number(item.paidAmount || 0));
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 text-slate-500 font-mono">#{item.id}</td>
                    
                    <td className="px-5 py-4">
                      <span className="font-extrabold text-slate-800 block">{item.customerName}</span>
                      {item.notes && <span className="text-[10px] text-slate-400 mt-0.5 block truncate max-w-xs">{item.notes}</span>}
                    </td>
                    
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 font-black text-xs">غرفة {item.roomNumber}</span>
                        {roomsList.find(r => r.roomNumber === item.roomNumber) && (
                          <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md font-bold">
                            {roomsList.find(r => r.roomNumber === item.roomNumber)?.type}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="space-y-0.5">
                        <div className="text-slate-600 flex items-center gap-1 font-mono text-[11px]">
                          <span className="text-[10px] text-slate-400">من:</span> {item.checkIn}
                        </div>
                        <div className="text-slate-600 flex items-center gap-1 font-mono text-[11px]">
                          <span className="text-[10px] text-slate-400">إلى:</span> {item.checkOut}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-700 block">{item.nights || calculateNights(item.checkIn, item.checkOut)} ليالي</span>
                      <span className="text-[10px] text-slate-400 font-bold block">سعر الليلة: {item.pricePerNight} ج.م</span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="font-black text-slate-800">{(item.totalPrice || 0).toLocaleString()} ج.م</span>
                          {Number(item.discount || 0) > 0 && (
                            <span className="text-[10px] font-extrabold text-rose-500 line-through">{(Number(item.totalPrice) + Number(item.discount)).toLocaleString()}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {item.paymentStatus === 'مدفوع بالكامل' && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded-md">خالص السداد</span>
                          )}
                          {item.paymentStatus === 'مدفوع جزئياً' && (
                            <span className="text-[10px] bg-amber-50 text-amber-700 font-extrabold px-2 py-0.5 rounded-md">مدفوع {item.paidAmount} ج.م</span>
                          )}
                          {item.paymentStatus === 'غير مدفوع' && (
                            <span className="text-[10px] bg-red-50 text-red-700 font-extrabold px-2 py-0.5 rounded-md">مستحق {balanceOwed} ج.م</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {item.status === 'مؤكد' && (
                        <span className="px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200/50 rounded-lg font-black inline-block text-[11px]">مؤكد الحجز</span>
                      )}
                      {item.status === 'تم تسجيل الدخول' && (
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200/50 rounded-lg font-black inline-block text-[11px] animate-pulse">مقيم بالغرفة</span>
                      )}
                      {item.status === 'تم تسجيل الخروج' && (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg font-black inline-block text-[11px]">غادر الفندق</span>
                      )}
                      {item.status === 'ملغى' && (
                        <span className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-lg font-black inline-block text-[11px]">ملغي مسبقاً</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-center items-center gap-1.5">
                        
                        {item.status === 'مؤكد' && (
                          <button 
                            onClick={() => handleQuickCheckin(item)}
                            className="bg-sky-50 text-sky-700 hover:bg-sky-100 text-[10px] font-black px-2.5 py-1.5 rounded-lg border border-sky-300/30 transition-colors cursor-pointer"
                          >
                            تسكين / وصول
                          </button>
                        )}

                        {item.status === 'تم تسجيل الدخول' && (
                          <button 
                            onClick={() => openBillingReceipt(item)}
                            className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-[10px] font-black px-2.5 py-1.5 rounded-lg border border-emerald-300/30 transition-colors cursor-pointer"
                          >
                            مغادرة وتسوية فواتير
                          </button>
                        )}

                        {item.status === 'تم تسجيل الخروج' && (
                          <button 
                            onClick={() => openBillingReceipt(item)}
                            className="bg-slate-50 text-slate-600 hover:bg-slate-100 text-[10px] font-black px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>الفاتورة</span>
                          </button>
                        )}

                        <button 
                          onClick={() => handleOpenModal(true, item)} 
                          className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all cursor-pointer"
                          title="تعديل تفاصيل الإقامة"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button 
                          onClick={() => triggerDeleteConfirm(item.id!)} 
                          className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all cursor-pointer"
                          title="حذف السجل"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* BOOKING MODAL (ADD / EDIT) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-[#fafafa]">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <BedDouble className="w-5 h-5 text-indigo-600" />
                <span>{isEdit ? 'تعديل حجز النزيل والإقامة' : 'إضافة حجز فندقي جديد'}</span>
              </h2>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              
              {/* SECTION A: GUEST & ROOM INFO */}
              <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 space-y-4">
                <h3 className="text-xs font-black text-slate-400 tracking-wider">بيانات النزيل والغرفة المخصصة</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">اسم النزيل الثلاثي / الشركة</label>
                    <input 
                      type="text" 
                      value={formData.customerName}
                      onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                      required
                      placeholder="أدخل اسم النزيل بالكامل..."
                      className="w-full px-4 py-2.5 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">اختر الغرفة</label>
                    <select
                      value={formData.roomNumber}
                      onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none text-xs font-black text-slate-800 cursor-pointer"
                    >
                      <option value="" disabled>-- اختر غرفة للنزيل --</option>
                      {roomsList.map((room) => (
                        <option key={room.id} value={room.roomNumber}>
                          غرفة {room.roomNumber} - {room.type} ({room.price} ج.م/ليلة) - {room.status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">رقم الجوال للتواصل</label>
                    <input 
                      type="tel" 
                      value={formData.customerPhone || ""}
                      onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                      placeholder="01xxxxxxxxx"
                      className="w-full px-4 py-2.5 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">رقم الهوية الوطنية / جواز السفر</label>
                    <input 
                      type="text" 
                      value={formData.customerNationalId || ""}
                      onChange={(e) => setFormData({...formData, customerNationalId: e.target.value})}
                      placeholder="أدخل رقم الهوية..."
                      className="w-full px-4 py-2.5 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                {/* SEC A2: COMPANION INFO */}
                <div className="pt-2 border-t border-dashed border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">اسم المرافق (إن وجد)</label>
                    <input 
                      type="text" 
                      value={formData.companionName || ""}
                      onChange={(e) => setFormData({...formData, companionName: e.target.value})}
                      placeholder="اسم المرافق الثنائي أو أكثر..."
                      className="w-full px-4 py-2.5 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">هوية المرافق</label>
                    <input 
                      type="text" 
                      value={formData.companionId || ""}
                      onChange={(e) => setFormData({...formData, companionId: e.target.value})}
                      placeholder="رقم هوية المرافق..."
                      className="w-full px-4 py-2.5 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                {/* REAL-TIME OVERLAPPING WARNING */}
                {(() => {
                  if (!formData.roomNumber) return null;
                  const overlap = records.find((rec: any) => {
                    if (rec.id === currentId) return false;
                    if (rec.roomNumber !== formData.roomNumber) return false;
                    if (rec.status === 'ملغى' || rec.status === 'تم تسجيل الخروج') return false;
                    
                    const in1 = new Date(formData.checkIn).getTime();
                    const out1 = new Date(formData.checkOut).getTime();
                    const in2 = new Date(rec.checkIn).getTime();
                    const out2 = new Date(rec.checkOut).getTime();
                    return in1 < out2 && out1 > in2;
                  });

                  if (overlap) {
                    return (
                      <div className="text-amber-800 bg-amber-50 border border-amber-200/40 p-3 rounded-xl text-xs flex items-center gap-2 mt-2 font-bold animate-pulse">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>انتبه: الغرفة {formData.roomNumber} محجوزة مسبقاً في هذه التواريخ للنزيل ({overlap.customerName})! يرجى مراجعة التموضع لتجنب التعارض.</span>
                      </div>
                    );
                  }
                  return null;
                })()}

              </div>

              {/* SECTION B: STAY DATES */}
              <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 space-y-4">
                <h3 className="text-xs font-black text-slate-400 tracking-wider">تواريخ مدة الإجازة والإقامة</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">تاريخ تسجيل الوصول (Check-in)</label>
                    <input 
                      type="date" 
                      value={formData.checkIn}
                      onChange={(e) => setFormData({...formData, checkIn: e.target.value})}
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">تاريخ تسجيل الاسترداد والمغادرة (Check-out)</label>
                    <input 
                      type="date" 
                      value={formData.checkOut}
                      onChange={(e) => setFormData({...formData, checkOut: e.target.value})}
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B_EXTRA: ADDITIONAL SERVICES SELECTION */}
              <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-400 tracking-wider">تخصيص الضيافة والخدمات الإضافية المختارة</h3>
                  <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-bold">
                    مجموع الخدمات المضافة: {(formData.services || []).reduce((sum, s) => sum + (s.price * s.quantity), 0).toLocaleString()} ج.م
                  </span>
                </div>

                {servicesList.length === 0 ? (
                  <div className="text-slate-400 text-[11px] py-1 text-center font-bold">
                    لا توجد خدمات مضافة في قائمة "الخدمات الإضافية" حالياً.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-36 overflow-y-auto pr-1">
                    {servicesList.map((srv: any) => {
                      const selected = (formData.services || []).find((s: any) => s.id === srv.id);
                      const quantity = selected ? selected.quantity : 1;

                      const toggleService = () => {
                        let nextServices = [...(formData.services || [])];
                        const idx = nextServices.findIndex((s: any) => s.id === srv.id);
                        if (idx > -1) {
                          nextServices.splice(idx, 1);
                        } else {
                          nextServices.push({ id: srv.id!, name: srv.name, price: Number(srv.price), quantity: 1 });
                        }
                        setFormData(prev => ({ ...prev, services: nextServices }));
                      };

                      const changeQty = (amount: number) => {
                        let nextServices = [...(formData.services || [])];
                        const idx = nextServices.findIndex((s: any) => s.id === srv.id);
                        if (idx > -1) {
                          const nextQty = Math.max(1, nextServices[idx].quantity + amount);
                          nextServices[idx].quantity = nextQty;
                          setFormData(prev => ({ ...prev, services: nextServices }));
                        }
                      };

                      return (
                        <div 
                          key={srv.id} 
                          className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                            selected 
                              ? 'border-indigo-500 bg-indigo-50/30' 
                              : 'border-slate-200 bg-white hover:border-indigo-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 max-w-[65%]">
                            <input 
                              type="checkbox" 
                              checked={!!selected}
                              onChange={toggleService}
                              className="w-3.5 h-3.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                            />
                            <div className="text-right">
                              <span className="text-[11px] font-bold text-slate-800 block truncate">{srv.name}</span>
                              <span className="text-[9px] text-slate-400 font-bold">{srv.price} ج.م - {srv.type}</span>
                            </div>
                          </div>

                          {selected && (
                            <div className="flex items-center gap-1 bg-white border border-slate-200 p-0.5 rounded-lg">
                              <button 
                                type="button" 
                                onClick={() => changeQty(-1)}
                                className="w-4 h-4 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-bold text-[10px]"
                              >
                                -
                              </button>
                              <span className="text-[10px] font-bold px-1">{quantity}</span>
                              <button 
                                type="button" 
                                onClick={() => changeQty(1)}
                                className="w-4 h-4 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-bold text-[10px]"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION C: PRICE, DISCOUNT AND PAYMENTS */}
              <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-400 tracking-wider">تفاصيل الحساب النقدي والتحصيل المالي</h3>
                  <div className="text-[11px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    إجمالي الليالي: {calculateNights(formData.checkIn, formData.checkOut)} ليالي
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">سعر الغرفة / ليلة (ج.م)</label>
                    <input 
                      type="number" 
                      value={formData.pricePerNight}
                      onChange={(e) => setFormData({...formData, pricePerNight: Number(e.target.value)})}
                      required
                      min={0}
                      className="w-full px-4 py-2.5 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">خصم ترويجي خاص (ج.م)</label>
                    <div className="relative">
                      <Percent className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="number" 
                        value={formData.discount}
                        onChange={(e) => setFormData({...formData, discount: Number(e.target.value)})}
                        min={0}
                        placeholder="خصم فوري..."
                        className="w-full pr-9 pl-4 py-2.5 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none text-xs font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">المبلغ المحصل حالياً (ج.م)</label>
                    <input 
                      type="number" 
                      value={formData.paidAmount}
                      onChange={(e) => setFormData({...formData, paidAmount: Number(e.target.value)})}
                      min={0}
                      max={(() => {
                        const servicesCost = (formData.services || []).reduce((sum: number, s: any) => sum + (s.price * s.quantity), 0);
                        return Math.max(0, (formData.pricePerNight * calculateNights(formData.checkIn, formData.checkOut)) + servicesCost - formData.discount);
                      })()}
                      placeholder="المقدم المحصل..."
                      className="w-full px-4 py-2.5 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">خزينة التحصيل</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e: any) => setFormData({...formData, paymentMethod: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/15 text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      <option value="cash">الصندوق النقدي العادي (كاش)</option>
                      <option value="bank">الحساب البنكي الرئيسي</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">الحالة عند الحفظ</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/15 text-xs font-black text-slate-800 cursor-pointer"
                    >
                      <option value="مؤكد">مؤكد الحجز (قيد الوصول)</option>
                      <option value="تم تسجيل الدخول">تسجيل دخول فوري (مقيم)</option>
                      <option value="تم تسجيل الخروج">تسجيل خروج (مغادر سابق)</option>
                      <option value="ملغى">ملغى الحجز</option>
                    </select>
                  </div>

                  <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100 flex flex-col justify-center items-center">
                    <span className="text-[10px] text-slate-400 font-extrabold">صافي الفاتورة الكلي (مع الخدمات)</span>
                    <span className="text-sm font-black text-indigo-950 mt-1">
                      {(() => {
                        const servicesCost = (formData.services || []).reduce((sum, s) => sum + (s.price * s.quantity), 0);
                        return Math.max(0, (formData.pricePerNight * calculateNights(formData.checkIn, formData.checkOut)) + servicesCost - formData.discount).toLocaleString();
                      })()} ج.م
                    </span>
                  </div>
                </div>
              </div>

              {/* NOTES */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">ملاحظات إضافية بخصوص النزيل</label>
                <textarea 
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={2}
                  placeholder="ملاحظات حول طلبات خاصة كالإفطار، سرير إضافي، شركة الحجز..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/15 text-xs font-bold text-slate-800"
                />
              </div>

              {/* SAVE & SUBMIT ACTIONS */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-black text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-black text-xs cursor-pointer shadow-md"
                >
                  {isEdit ? 'تحديث وحفظ التعديلات' : 'إتمام الحجز المالي'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DETAILED BILLING STATEMENT & MAGICAL CHECKOUT SYSTEM */}
      {isBillingModalOpen && activeBillingRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-[#fafafa]">
              <h2 className="text-md font-black text-slate-800 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <span>فاتورة تسوية مغادرة النزيل: #{activeBillingRes.id}</span>
              </h2>
              <button 
                onClick={() => {
                  setIsBillingModalOpen(false);
                  setActiveBillingRes(null);
                }}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              
              {/* Hotel Header / Customer info */}
              <div className="text-center space-y-1.5 border-b border-dashed border-slate-200 pb-5">
                <h3 className="text-lg font-black text-slate-900">فندق اليمامة والرياض الفندقي 🏨</h3>
                <p className="text-slate-400 text-[10px] font-bold">فاتورة حساب تفصيلية مبسطة للنزلاء والأعضاء الفاعلين بالمرور</p>
                
                <div className="grid grid-cols-2 gap-4 text-right pt-4 text-[11px] font-bold text-slate-600">
                  <div>
                    <span className="text-slate-400 block">اسم النزيل:</span>
                    <span className="text-slate-800 font-extrabold text-xs">{activeBillingRes.customerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">الغرفة المخصصة:</span>
                    <span className="text-slate-800 font-extrabold text-xs">غرفة {activeBillingRes.roomNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">وصول (Check-in):</span>
                    <span className="text-slate-800 text-[11px] font-mono">{activeBillingRes.checkIn}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">مغادرة (Check-out):</span>
                    <span className="text-slate-800 text-[11px] font-mono">{activeBillingRes.checkOut}</span>
                  </div>
                </div>
              </div>

              {(() => {
                const roomDining = diningOrdersList.filter(
                  (d: any) => String(d.roomNumber) === String(activeBillingRes.roomNumber) && d.status !== 'مدفوع' && d.status !== 'paid'
                );
                const diningTotal = roomDining.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
                const parsedServices = activeBillingRes.services || [];
                const servicesTotal = parsedServices.reduce((sum: number, s: any) => sum + (Number(s.price) * (Number(s.quantity) || 1)), 0);
                const roomStayTotal = (activeBillingRes.pricePerNight || 150) * (activeBillingRes.nights || calculateNights(activeBillingRes.checkIn, activeBillingRes.checkOut));
                const totalInvoiceNet = Math.max(0, roomStayTotal + servicesTotal + diningTotal - Number(activeBillingRes.discount || 0));
                const currentBalance = Math.max(0, totalInvoiceNet - Number(activeBillingRes.paidAmount || 0));

                return (
                  <>
                    {/* Itemized Calculations */}
                    <div className="space-y-2 border-b border-slate-100 pb-4 max-h-48 overflow-y-auto pr-1">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                        <span>البيان / تفصيل حوكمة الحساب</span>
                        <span>المبلغ الفرعي</span>
                      </div>
                      
                      {/* Room stay Line */}
                      <div className="flex justify-between items-center text-xs font-extrabold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
                        <div className="space-y-0.5">
                          <span className="flex items-center gap-1.5"><BedDouble className="w-3.5 h-3.5 text-indigo-500" /> إيجار الغرفة {activeBillingRes.roomNumber}</span>
                          <span className="text-[10px] text-slate-400 block font-normal">
                            سعر الليلة {activeBillingRes.pricePerNight} ج.م × {activeBillingRes.nights || calculateNights(activeBillingRes.checkIn, activeBillingRes.checkOut)} ليالي
                          </span>
                        </div>
                        <span className="font-bold">
                          {roomStayTotal.toLocaleString()} ج.م
                        </span>
                      </div>

                      {/* Consumed Services lines */}
                      {parsedServices.map((srv: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-xs font-bold text-slate-800 bg-indigo-50/25 p-2.5 rounded-xl border border-indigo-100/30">
                          <div className="space-y-0.5">
                            <span className="flex items-center gap-1.5 text-indigo-950 font-black">🌟 {srv.name} (خدمة إضافية)</span>
                            <span className="text-[10px] text-slate-400 block font-normal">
                              سعر الخدمة {srv.price} ج.م × {srv.quantity || 1}
                            </span>
                          </div>
                          <span className="font-bold text-indigo-600">
                            {(srv.price * (srv.quantity || 1)).toLocaleString()} ج.م
                          </span>
                        </div>
                      ))}

                      {/* Unpaid Room service dining lines */}
                      {roomDining.map((din: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-xs font-bold text-slate-800 bg-amber-50/30 p-2.5 rounded-xl border border-amber-100/55">
                          <div className="space-y-0.5">
                            <span className="flex items-center gap-1.5 text-amber-950 font-black">🍽️ طلب طعام للغرفة (خدمة الغرف)</span>
                            <span className="text-[10px] text-slate-400 block font-normal">
                              بتاريخ {din.date ? new Date(din.date).toLocaleDateString('ar-EG') : 'اليوم'}
                            </span>
                          </div>
                          <span className="font-bold text-amber-600">
                            {Number(din.amount).toLocaleString()} ج.م
                          </span>
                        </div>
                      ))}

                      {Number(activeBillingRes.discount || 0) > 0 && (
                        <div className="flex justify-between items-center text-xs font-bold text-rose-600 pl-1 py-1 px-1">
                          <span>خصم ترويجي خاص</span>
                          <span>- {activeBillingRes.discount} ج.م</span>
                        </div>
                      )}
                    </div>

                    {/* Financial Summary Breakdown */}
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-xs font-extrabold text-slate-800">
                        <span>صافي إجمالي الحساب:</span>
                        <span className="font-black text-xs text-slate-900">{totalInvoiceNet.toLocaleString()} ج.م</span>
                      </div>

                      <div className="flex justify-between items-center text-xs font-extrabold text-emerald-700">
                        <span>المسدد مسبقاً (مقدم):</span>
                        <span>{(activeBillingRes.paidAmount || 0).toLocaleString()} ج.م</span>
                      </div>

                      {/* Balance Owed calculation */}
                      {currentBalance > 0 ? (
                        <div className="bg-red-50 rounded-2xl p-4 border border-red-200/50 space-y-3">
                          <div className="flex justify-between items-center text-xs font-black text-red-950">
                            <span>تبقي مديونية مستحقة للاسترداد:</span>
                            <span className="text-sm font-black text-red-700">
                              {currentBalance.toLocaleString()} ج.م
                            </span>
                          </div>

                          <div className="pt-2 border-t border-red-200/50 grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] text-red-900 font-extrabold mb-1">المبلغ المدفوع الآن (ج.م):</label>
                              <input 
                                type="number"
                                value={checkoutPayAmount}
                                onChange={(e) => setCheckoutPayAmount(Number(e.target.value))}
                                max={currentBalance}
                                className="w-full px-3 py-1.5 border border-red-300 rounded-lg bg-white text-xs text-red-950 font-black focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-red-900 font-extrabold mb-1">طريقة السداد المالي:</label>
                              <select
                                value={checkoutPaymentMethod}
                                onChange={(e: any) => setCheckoutPaymentMethod(e.target.value)}
                                className="w-full px-2 py-1.5 border border-red-300 rounded-lg bg-white text-xs font-black text-slate-800"
                              >
                                <option value="cash">الصندوق النقدي</option>
                                <option value="bank">حساب البنك</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-emerald-50 text-emerald-950 rounded-2xl p-4 border border-emerald-200/50 flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span className="text-xs font-black">الفاتورة الإجمالية مسددة بالكامل. يمكنك المغادرة بأمان.</span>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

              {/* ACTION BUTTONS */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => window.print()} 
                  className="px-4 py-2 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الإيصال الرسمي</span>
                </button>

                {activeBillingRes.status !== 'تم تسجيل الخروج' && (
                  <button 
                    onClick={handleCheckoutSettle}
                    className="px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <span>تسوية السداد وتأكيد المغادرة</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION FOR DESTRUCTIVE ACTIONS */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title="تأكيد حذف الحجز"
        message="هل أنت متأكد من رغبتك في حذف هذا الحجز نهائياً؟ ستلغى كل الارتباطات وحسابات الإقامة للنزيل."
        confirmText="حذف الحجز"
        cancelText="إلغاء وتراجع"
        onConfirm={executeDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />

    </div>
  );
};
