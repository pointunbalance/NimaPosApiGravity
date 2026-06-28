import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Ticket,
  Plus,
  Search,
  Calendar,
  MapPin,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  User,
  Edit,
  Trash2,
  ShieldCheck,
  Printer,
  Tag,
  AlertTriangle,
} from "lucide-react";
import { db } from "../db";
import {
  TicketBooking,
  Customer,
  TicketTripSchedule,
  TicketVehicle,
  TicketSeatingTemplate,
  TicketVendor,
  TicketVendorRoute,
  TicketRoute,
} from "../types";

const AVAILABLE_SERVICES = [
  { id: "srv_meal_1", name: "وجبة غداء ساخنة", price: 120 },
  { id: "srv_snack_1", name: "سناك بوكس", price: 50 },
  {
    id: "srv_wifi_1",
    name: "تذكرة إنترنت عالي السرعة (طوال الرحلة)",
    price: 30,
  },
  { id: "srv_headphone", name: "سماعات عازلة للصوت (VIP)", price: 40 },
  { id: "srv_blanket", name: "غطاء مريح / بطانية (إعارة)", price: 20 },
];

const TicketBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<TicketBooking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [trips, setTrips] = useState<TicketTripSchedule[]>([]);
  const [vehicles, setVehicles] = useState<TicketVehicle[]>([]);
  const [templates, setTemplates] = useState<TicketSeatingTemplate[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "pending" | "refunds">(
    "active",
  );
  const [selectedRouteKey, setSelectedRouteKey] = useState<string>("");
  const [activeTripLayout, setActiveTripLayout] = useState<{
    grid: string[][];
    seats: Record<string, any>;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<number>(1);

  // Cancellation Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<TicketBooking | null>(
    null,
  );
  const [cancellationFee, setCancellationFee] = useState(0);
  const [refundMethod, setRefundMethod] = useState<
    "cash" | "card" | "wallet" | "transfer"
  >("cash");

  const [isEdit, setIsEdit] = useState(false);
  const [saveError, setSaveError] = useState("");
  const activeShifts = useLiveQuery(
    () => db.shifts.where("status").equals("open").toArray(),
    [],
  );

  const [formData, setFormData] = useState<Partial<TicketBooking>>({
    customerName: "",
    customerPhone: "",
    identityNumber: "",
    destination: "",
    departureDate: new Date().toISOString().split("T")[0],
    departureTime: "10:00",
    ticketType: "standard",
    passengers: 1,
    pricePerTicket: 0,
    paidAmount: 0,
    status: "confirmed",
    checkInStatus: "pending",
    luggageWeight: 0,
    luggageFee: 0,
    ancillaryTotal: 0,
    selectedServices: [],
    notes: "",
  });

  const [seatLockTimeLeft, setSeatLockTimeLeft] = useState<number | null>(null);
  const [isSeatLockedByMe, setIsSeatLockedByMe] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (seatLockTimeLeft !== null && seatLockTimeLeft > 0) {
      interval = setInterval(() => {
        setSeatLockTimeLeft((prev) => (prev ? prev - 1 : 0));
      }, 1000);
    } else if (seatLockTimeLeft === 0) {
      setIsSeatLockedByMe(false);
      setSeatLockTimeLeft(null);
      setSaveError("انتهى وقت حجز المقعد! يرجى اختياره وتأكيده مرة أخرى.");
    }
    return () => clearInterval(interval);
  }, [seatLockTimeLeft]);

  const handleLockSeat = async () => {
    if (!formData.seatNumber || !formData.destination) {
      setSaveError("يجب تحديد الوجهة ورقم المقعد أولاً");
      return;
    }

    setSaveError("");

    // 1. Check if it's already taken in actual bookings
    const isSeatTaken = bookings.some(
      (b) =>
        b.id !== formData.id &&
        b.destination === formData.destination &&
        b.departureDate === formData.departureDate &&
        b.departureTime === formData.departureTime &&
        b.seatNumber === formData.seatNumber &&
        b.status !== "cancelled",
    );

    if (isSeatTaken) {
      setSaveError(
        `المقعد (${formData.seatNumber}) مباع بالفعل في هذه الرحلة.`,
      );
      return;
    }

    // 2. Check if it's locked by another user in the locks table
    const now = new Date().toISOString();
    const existingLocks = await db.ticketSeatLocks
      .where({
        seatNumber: formData.seatNumber,
      })
      .toArray();

    // Very basic locking check since we don't have true tripId mapped in this form perfectly for now we use seatNumber + logic
    const activeLock = existingLocks.find(
      (l) =>
        new Date(l.expiresAt) > new Date() &&
        String(l.tripId) === formData.destination,
    );

    if (activeLock && activeLock.lockedByUserId !== 1) {
      // Assuming our user id is 1
      setSaveError(
        `المقعد (${formData.seatNumber}) معلق حالياً من قبل موظف آخر. حاول بعد 5 دقائق.`,
      );
      return;
    }

    // Create our own lock
    await db.ticketSeatLocks.add({
      tripId: parseInt(formData.destination) || 9999, // Fallback
      seatNumber: formData.seatNumber,
      lockedAt: now,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      lockedByUserId: 1,
    });

    setIsSeatLockedByMe(true);
    setSeatLockTimeLeft(300); // 5 minutes = 300 seconds
  };

  const [pricingNotes, setPricingNotes] = useState<string>("");

  const applyDynamicPricing = (
    tripIdText: string,
    depDateText: string,
    currentBookings: TicketBooking[],
  ) => {
    const trip = trips.find((t) => String(t.id) === tripIdText);
    if (!trip) {
      setPricingNotes("");
      return { price: 0, notes: "" };
    }

    let basePrice = trip.basePrice || 0;
    let surgeNotes = [];

    // 1. Occupancy Rule
    const existingBookings = currentBookings.filter(
      (b) =>
        b.destination === tripIdText &&
        b.departureDate === depDateText &&
        b.status !== "cancelled",
    );
    const bookedCount = existingBookings.reduce(
      (acc, curr) => acc + curr.passengers,
      0,
    );

    let totalSeats = 50; // Fallback
    if (trip.vehicleId) {
      const vehicle = vehicles.find((v) => v.id === trip.vehicleId);
      if (vehicle && vehicle.layoutTemplateId) {
        const template = templates.find(
          (t) => t.id === vehicle.layoutTemplateId,
        );
        if (vehicle.capacity) totalSeats = vehicle.capacity;
      }
    }

    const occupancyRate = bookedCount / totalSeats;
    let occupancySurge = 0;
    if (occupancyRate >= 0.8) {
      occupancySurge = basePrice * 0.15; // 15% increase
      surgeNotes.push("إشغال 80%+ (+15%)");
    }

    // 2. Time Rule
    let timeSurge = 0;
    if (depDateText) {
      const depDate = new Date(depDateText);
      const today = new Date();
      depDate.setHours(0, 0, 0, 0);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      const timeDiff = depDate.getTime() - todayDate.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (daysDiff <= 0) {
        // Same day
        timeSurge = basePrice * 0.2; // 20% increase for same-day
        surgeNotes.push("حجز يوم الرحلة (+20%)");
      } else if (daysDiff <= 2) {
        timeSurge = basePrice * 0.1; // 10% increase for last 2 days
        surgeNotes.push("حجز قبل 48 ساعة (+10%)");
      }
    }

    const finalPrice = Math.floor(basePrice + occupancySurge + timeSurge);
    const finalNotes =
      surgeNotes.length > 0
        ? `🔥 تسعير ديناميكي: ${surgeNotes.join(" ، ")}`
        : "";
    setPricingNotes(finalNotes);
    return { price: finalPrice, notes: finalNotes };
  };

  useEffect(() => {
    loadData();
  }, []);

  const [vendors, setVendors] = useState<TicketVendor[]>([]);
  const [vendorRoutes, setVendorRoutes] = useState<TicketVendorRoute[]>([]);
  const [routes, setRoutes] = useState<TicketRoute[]>([]);

  const loadData = async () => {
    const [blist, clist, tlist, vlist, tmlist, vdlist, vrlist, rlist] =
      await Promise.all([
        db.ticketBookings.orderBy("createdAt").reverse().toArray(),
        db.customers.toArray(),
        db.ticketTripSchedules.toArray(),
        db.ticketVehicles.toArray(),
        db.ticketSeatingTemplates.toArray(),
        (db as any).ticketVendors.toArray(),
        (db as any).ticketVendorRoutes.toArray(),
        db.ticketRoutes.toArray(),
      ]);
    setBookings(blist);
    setCustomers(clist);
    setTrips(tlist);
    setVehicles(vlist);
    setTemplates(tmlist);
    setVendors(vdlist);
    setVendorRoutes(vrlist);
    setRoutes(rlist);
  };

  const handleCustomerSelect = (name: string) => {
    const cust = customers.find((c) => c.name === name);
    if (cust) {
      setFormData((prev) => ({
        ...prev,
        customerName: cust.name,
        customerPhone: cust.phone || "",
        customerId: cust.id,
      }));
    } else {
      setFormData((prev) => ({ ...prev, customerName: name }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError("");
    try {
      // Check Blacklist
      const blacklistedCustomer = customers.find(
        (c) =>
          c.isBanned &&
          ((c.phone &&
            formData.customerPhone &&
            c.phone === formData.customerPhone) ||
            (c.nationalId &&
              formData.identityNumber &&
              c.nationalId === formData.identityNumber) ||
            (c.name &&
              formData.customerName &&
              c.name === formData.customerName)),
      );

      if (blacklistedCustomer) {
        setSaveError(
          `يُمنع حجز تذكرة لهذا العميل. العميل مدرج في القائمة السوداء (السبب: ${blacklistedCustomer.banReason || "غير محدد"}). يرجى مراجعة الإدارة العليا.`,
        );
        return;
      }

      // التحقق من الحجز المزدوج لنفس الشخص ونفس الرحلة/الجهة والتاريخ
      const isDuplicate = bookings.some(
        (b) =>
          b.id !== formData.id && // استثناء الحجز الحالي إذا كان في وضع التعديل
          (b.customerName === formData.customerName ||
            (b.identityNumber &&
              b.identityNumber === formData.identityNumber) ||
            (b.customerId && b.customerId === formData.customerId)) && // نفس الشخص
          b.destination === formData.destination && // نفس الوجهة/الحدث
          b.departureDate === formData.departureDate && // نفس تاريخ السفر
          b.status !== "cancelled",
      );

      if (isDuplicate) {
        setSaveError(
          "حدث خطأ: هذا العميل لديه حجز بالفعل لنفس الوجهة في نفس التاريخ!",
        );
        return;
      }

      // التحقق من أن المقعد لم يتم حجزه مسبقا
      if (formData.seatNumber) {
        const isSeatTaken = bookings.some(
          (b) =>
            b.id !== formData.id &&
            b.destination === formData.destination &&
            b.departureDate === formData.departureDate &&
            b.departureTime === formData.departureTime &&
            b.seatNumber === formData.seatNumber &&
            b.status !== "cancelled",
        );

        if (isSeatTaken) {
          setSaveError(
            `حدث خطأ: المقعد المختار (${formData.seatNumber}) محجوز مسبقاً في هذه الرحلة.`,
          );
          return;
        }
      }

      const baseTotal =
        (formData.passengers || 1) * (formData.pricePerTicket || 0);
      const total =
        baseTotal -
        (formData.discountAmount || 0) +
        (formData.taxAmount || 0) +
        (formData.luggageFee || 0) +
        (formData.ancillaryTotal || 0);

      const bookingToSave = {
        ...formData,
        totalAmount: total,
        createdAt: formData.createdAt || new Date().toISOString(),
        bookingRef:
          formData.bookingRef ||
          `TBK${Math.floor(Date.now() / 1000)
            .toString()
            .substring(4)}`,
      } as TicketBooking;

      if (isEdit && formData.id) {
        await (db as any).ticketBookings.put(bookingToSave);

        // Add an audit log
        await db.auditLogs.add({
          action: "UPDATE",
          module: "tickets",
          details: `تم تعديل حجز تذكرة ${bookingToSave.bookingRef}`,
          userId: 1,
          userName: "مدير النظام",
          timestamp: new Date().toISOString(),
        });
      } else {
        await db.ticketBookings.add(bookingToSave);
        await db.auditLogs.add({
          action: "CREATE",
          module: "tickets",
          details: `تم إضافة حجز تذكرة جديد ${bookingToSave.bookingRef}`,
          userId: 1,
          userName: "مدير النظام",
          timestamp: new Date().toISOString(),
        });
      }

      setIsModalOpen(false);
      loadData();

      // Generate Journal Entry implicitly for new bookings
      if (!isEdit) {
        let jLines = [];
        if (
          bookingToSave.paymentMethod === "split" &&
          bookingToSave.paymentSplits &&
          bookingToSave.paymentSplits.length > 0
        ) {
          bookingToSave.paymentSplits.forEach((split) => {
            let accId = 1; // Cash
            let accName = "الخزينة الرئيسية";
            if (split.method === "card") {
              accId = 2;
              accName = "البنك (فيزا)";
            } else if (split.method === "transfer") {
              accId = 2;
              accName = "البنك (تحويل)";
            } else if (split.method === "wallet") {
              accId = 7;
              accName = "محفظة كاش";
            }
            jLines.push({
              accountId: accId,
              accountName: accName,
              debit: split.amount,
              credit: 0,
            });
          });
        } else if (bookingToSave.paidAmount > 0) {
          let accId = 1; // Cash
          let accName = "الخزينة الرئيسية";
          if (bookingToSave.paymentMethod === "card") {
            accId = 2;
            accName = "البنك (فيزا)";
          } else if (bookingToSave.paymentMethod === "transfer") {
            accId = 2;
            accName = "البنك (تحويل)";
          } else if (bookingToSave.paymentMethod === "wallet") {
            accId = 7;
            accName = "محفظة كاش";
          }
          jLines.push({
            accountId: accId,
            accountName: accName,
            debit: bookingToSave.paidAmount,
            credit: 0,
          });
        }

        // Add revenue lines
        const remainingToPay =
          bookingToSave.totalAmount - bookingToSave.paidAmount;
        if (remainingToPay > 0) {
          jLines.push({
            accountId: 3,
            accountName: `ذمم مدينة - عملاء (${bookingToSave.customerName})`,
            debit: remainingToPay,
            credit: 0,
          });
        }

        if (bookingToSave.vendorId && bookingToSave.expectedCommission) {
          let commTotal =
            bookingToSave.expectedCommission * (bookingToSave.passengers || 1);
          let payableToVendor = bookingToSave.totalAmount - commTotal;
          jLines.push({
            accountId: 8,
            accountName: `ذمم دائنة - ${bookingToSave.vendorName}`,
            debit: 0,
            credit: payableToVendor,
          });
          jLines.push({
            accountId: 4,
            accountName: "إيرادات عمولات نقل",
            debit: 0,
            credit: commTotal,
          });
        } else {
          jLines.push({
            accountId: 4,
            accountName: "إيرادات الحجوزات",
            debit: 0,
            credit: bookingToSave.totalAmount,
          });
        }

        const totalDebit = jLines.reduce((acc, line) => acc + line.debit, 0);

        await (db as any).journalEntries.add({
          date: new Date().toISOString().split("T")[0],
          description: `فاتورة حجز تذاكر - ${bookingToSave.bookingRef}`,
          reference: bookingToSave.bookingRef,
          lines: jLines,
          totalAmount: totalDebit,
          status: "posted",
          createdBy: "النظام",
          createdAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الحجز بشكل نهائي؟")) {
      await db.ticketBookings.delete(id);
      loadData();
    }
  };

  const openCancelModal = (b: TicketBooking) => {
    setBookingToCancel(b);

    let calculatedFee = 0;
    if (b.departureDate && b.departureTime) {
      const departureDateTime = new Date(
        `${b.departureDate}T${b.departureTime}`,
      );
      const now = new Date();
      const hoursDiff =
        (departureDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        calculatedFee = 0; // 0% fee (full refund)
      } else if (hoursDiff > 2 && hoursDiff <= 24) {
        calculatedFee = (b.paidAmount || 0) * 0.25; // 25% fee
      } else {
        calculatedFee = b.paidAmount || 0; // 100% fee if less than 2 hours or no-show
      }
    }

    setCancellationFee(Math.round(calculatedFee));
    setRefundMethod("cash");
    setIsCancelModalOpen(true);
  };

  const confirmCancelBooking = async () => {
    if (!bookingToCancel?.id) return;

    try {
      const refundedAmount =
        (bookingToCancel.paidAmount || 0) - cancellationFee;
      const updatedBooking: TicketBooking = {
        ...bookingToCancel,
        status: "cancelled",
        cancellationFee,
        refundedAmount: Math.max(0, refundedAmount),
        refundMethod,
      };

      await (db as any).ticketBookings.put(updatedBooking);

      if (updatedBooking.refundedAmount && updatedBooking.refundedAmount > 0) {
        await db.ticketRefunds.add({
          refundId: `REF${Math.floor(Date.now() / 1000)
            .toString()
            .substring(4)}`,
          originalBookingId: bookingToCancel.id,
          bookingRef: bookingToCancel.bookingRef,
          cancellationTime: new Date().toISOString(),
          deductedFees: cancellationFee,
          refundedAmount: updatedBooking.refundedAmount,
          refundMethod,
          customerName: bookingToCancel.customerName,
        });
      }

      await db.auditLogs.add({
        action: "UPDATE",
        module: "tickets",
        details: `تم إلغاء حجز تذكرة ${updatedBooking.bookingRef} واسترداد ${Math.max(0, refundedAmount)}`,
        userId: 1,
        userName: "مدير النظام",
        timestamp: new Date().toISOString(),
      });

      setIsCancelModalOpen(false);
      setBookingToCancel(null);
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const openCreate = () => {
    if (!activeShifts || activeShifts.length === 0) {
      navigate("/shifts");
      return;
    }
    setIsEdit(false);
    setIsSeatLockedByMe(false);
    setSeatLockTimeLeft(null);
    setSaveError("");
    setSelectedRouteKey("");
    setFormData({
      customerName: "",
      customerPhone: "",
      identityNumber: "",
      isStudent: false,
      transportType: "bus",
      seatNumber: "",
      destination: "",
      vendorId: undefined,
      vendorName: undefined,
      expectedCommission: 0,
      departureDate: new Date().toISOString().split("T")[0],
      departureTime: "10:00",
      ticketType: "standard",
      passengers: 1,
      pricePerTicket: 0,
      discountAmount: 0,
      taxAmount: 0,
      paidAmount: 0,
      paymentMethod: "cash",
      status: "confirmed",
      checkInStatus: "pending",
      luggageWeight: 0,
      luggageFee: 0,
      ancillaryTotal: 0,
      selectedServices: [],
      notes: "",
    });
    setIsModalOpen(true);
    setModalStep(1);
  };

  const openEdit = (b: TicketBooking) => {
    setIsEdit(true);
    setIsSeatLockedByMe(false);
    setSeatLockTimeLeft(null);
    setSaveError("");
    setFormData(b);
    if (b.tripId) {
      setSelectedRouteKey(`internal_${b.tripId}`);
    } else if (b.vendorId && b.destination) {
      const hasRoute = vendorRoutes.some(
        (vr) => vr.vendorId === b.vendorId && vr.routeName === b.destination,
      );
      setSelectedRouteKey(
        hasRoute
          ? `vendor_${b.vendorId}_${b.destination}`
          : `vendoronly_${b.vendorId}`,
      );
    } else if (b.vendorId) {
      setSelectedRouteKey(`vendoronly_${b.vendorId}`);
    } else if (b.vendorName) {
      setSelectedRouteKey("manual_entry");
    } else {
      setSelectedRouteKey("");
    }
    setIsModalOpen(true);
    setModalStep(1);
  };

  const filtered = bookings.filter((b) => {
    const matchesSearch =
      (b.bookingRef && b.bookingRef.includes(searchTerm)) ||
      (b.customerName && b.customerName.includes(searchTerm)) ||
      (b.destination &&
        b.destination.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeTab === "active") return b.status === "confirmed";
    if (activeTab === "pending") return b.status === "pending";
    if (activeTab === "refunds") return b.status === "cancelled";
    return true;
  });

  const getStatusColor = (s: string) => {
    if (s === "confirmed")
      return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (s === "pending") return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-rose-700 bg-rose-50 border-rose-200";
  };

  const getStatusIcon = (s: string) => {
    if (s === "confirmed")
      return <CheckCircle className="w-4 h-4 mr-1 inline" />;
    if (s === "pending") return <Clock className="w-4 h-4 mr-1 inline" />;
    return <XCircle className="w-4 h-4 mr-1 inline" />;
  };

  const getStatusLabel = (s: string) => {
    if (s === "confirmed") return "مؤكد";
    if (s === "pending") return "قيد الانتظار";
    return "ملغي";
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto" dir="rtl">
      <div style={{ marginBottom: '32px' }} className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center">
            <Ticket className="w-8 h-8 text-indigo-600 ml-3" />
            إدارة حجوزات التذاكر
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            سجل التذاكر، الرحلات، المواعيد والإيرادات
          </p>
        </div>
        <div className="flex gap-[16px] w-full md:w-auto items-center">
          <div className="relative flex-1 md:w-64">
            <Search className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="بحث برقم الحجز أو العميل..."
              className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl outline-none font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={openCreate}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20 whitespace-nowrap"
          >
            <Plus className="w-5 h-5 ml-2" />
            حجز جديد
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px] mb-8">
        <div style={{ padding: '16px 20px' }} className="bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center transition-all duration-300 hover:shadow-md">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center ml-4 shrink-0">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 mb-0.5 leading-none">إجمالي الحجوزات</p>
            <p className="text-2xl font-black text-slate-800 mt-1 leading-none">
              {bookings.length}
            </p>
          </div>
        </div>
        <div style={{ padding: '16px 20px' }} className="bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center transition-all duration-300 hover:shadow-md">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center ml-4 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 mb-0.5 leading-none">الحجوزات المؤكدة</p>
            <p className="text-2xl font-black text-slate-800 mt-1 leading-none">
              {bookings.filter((b) => b.status === "confirmed").length}
            </p>
          </div>
        </div>
        <div style={{ padding: '16px 20px' }} className="bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center transition-all duration-300 hover:shadow-md">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center ml-4 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 mb-0.5 leading-none">إجمالي الركاب</p>
            <p className="text-2xl font-black text-slate-800 mt-1 leading-none">
              {bookings.reduce((sum, b) => sum + (b.passengers || 0), 0)}
            </p>
          </div>
        </div>
        <div style={{ padding: '16px 20px' }} className="bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center transition-all duration-300 hover:shadow-md">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center ml-4 shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 mb-0.5 leading-none">إجمالي الإيرادات</p>
            <p className="text-2xl font-black text-slate-800 mt-1 leading-none">
              {bookings
                .reduce((sum, b) => sum + (b.totalAmount || 0), 0)
                .toLocaleString()}{" "}
              <span className="text-sm font-bold text-slate-500">ج.م</span>
            </p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }} className="flex bg-slate-100 p-1.5 rounded-xl mb-[20px] overflow-x-auto w-full max-w-2xl">
        <button
          onClick={() => setActiveTab("active")}
          className={`flex-1 min-w-[120px] font-bold py-2.5 rounded-lg transition-all text-sm ${activeTab === "active" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:bg-slate-200/50"}`}
        >
          الحجوزات النشطة
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex-1 min-w-[120px] font-bold py-2.5 rounded-lg transition-all text-sm ${activeTab === "pending" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:bg-slate-200/50"}`}
        >
          معلقة / مؤقتة
        </button>
        <button
          onClick={() => setActiveTab("refunds")}
          className={`flex-1 min-w-[120px] font-bold py-2.5 rounded-lg transition-all text-sm ${activeTab === "refunds" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:bg-slate-200/50"}`}
        >
          المرتجعات والمسترد
        </button>
      </div>

      <div style={{ marginBottom: '24px' }} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm mb-[24px]">
        <div className="overflow-x-auto">
          <table className="w-full text-right whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-5 text-slate-500 font-bold text-sm">
                  التفاصيل / العميل
                </th>
                <th className="px-6 py-5 text-slate-500 font-bold text-sm">
                  الوجهة والموعد
                </th>
                {activeTab === "refunds" ? (
                  <>
                    <th className="px-6 py-5 text-slate-500 font-bold text-sm text-center">
                      الرسوم المستقطعة
                    </th>
                    <th className="px-6 py-5 text-slate-500 font-bold text-sm text-center">
                      المسترد
                    </th>
                  </>
                ) : (
                  <th className="px-6 py-5 text-slate-500 font-bold text-sm text-center">
                    المالية
                  </th>
                )}
                <th className="px-6 py-5 text-slate-500 font-bold text-sm text-center">
                  حالة الحجز
                </th>
                <th className="px-6 py-5 text-slate-500 font-bold text-sm text-left">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((booking) => (
                <tr
                  key={booking.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-800">
                        {booking.bookingRef}
                      </span>
                      <span className="font-bold text-slate-600 text-sm mt-0.5">
                        {booking.customerName}
                      </span>
                      {booking.seatNumber && (
                        <span className="text-xs text-slate-500 mt-0.5">
                          مقعد: {booking.seatNumber}
                        </span>
                      )}
                      {booking.checkInStatus === "boarded" && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 rounded-full w-fit mt-1">
                          ✓ صعد للحافلة
                        </span>
                      )}
                      {booking.checkInStatus === "did_not_attend" && (
                        <span className="text-[10px] bg-rose-100 text-rose-700 px-2 rounded-full w-fit mt-1">
                          ✗ لم يحضر
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800 flex items-center mb-1">
                      <MapPin className="w-3.5 h-3.5 ml-1 text-indigo-500" />{" "}
                      {booking.destination}
                    </p>
                    <p className="text-sm font-bold text-slate-500 flex items-center mb-1">
                      <Calendar className="w-3.5 h-3.5 ml-1" />{" "}
                      {booking.departureDate}
                    </p>
                    {activeTab === "pending" && booking.expiresAt && (
                      <p className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md inline-block">
                        صلاحية: {booking.expiresAt}
                      </p>
                    )}
                  </td>

                  {activeTab === "refunds" ? (
                    <>
                      <td className="px-6 py-4 text-center font-bold text-rose-600">
                        {(booking.cancellationFee || 0).toLocaleString()}{" "}
                        <span className="text-xs text-rose-400">ج.م</span>
                      </td>
                      <td className="px-6 py-4 text-center font-black text-slate-800">
                        {(booking.refundedAmount || 0).toLocaleString()}{" "}
                        <span className="text-xs text-slate-400">ج.م</span>
                        {booking.refundMethod && (
                          <p className="text-[10px] text-slate-500 mt-1 uppercase">
                            {booking.refundMethod}
                          </p>
                        )}
                      </td>
                    </>
                  ) : (
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 w-32 mx-auto">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">إجمالي:</span>
                          <span className="font-bold text-slate-800">
                            {(booking.totalAmount || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm border-t border-slate-100 pt-1">
                          <span className="text-slate-500">مدفوع:</span>
                          <span className="font-bold text-emerald-600">
                            {(booking.paidAmount || 0).toLocaleString()}
                          </span>
                        </div>
                        {(booking.totalAmount || 0) -
                          (booking.paidAmount || 0) >
                          0 && (
                          <div className="flex justify-between text-xs text-rose-500 font-bold border-t border-slate-100 pt-1 mt-0.5">
                            <span>متبقي:</span>
                            <span>
                              {(
                                (booking.totalAmount || 0) -
                                (booking.paidAmount || 0)
                              ).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                  )}

                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center justify-center ${getStatusColor(booking.status)}`}
                    >
                      {getStatusIcon(booking.status)}{" "}
                      {getStatusLabel(booking.status)}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-left">
                    <div className="flex items-center justify-end gap-2">
                      {activeTab !== "refunds" && (
                        <>
                          <button
                            onClick={() => window.print()}
                            title="طباعة"
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Printer className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => openEdit(booking)}
                            title="تعديل"
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          {booking.status !== "cancelled" && (
                            <button
                              onClick={() => openCancelModal(booking)}
                              title="إلغاء واسترداد"
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          )}
                        </>
                      )}
                      {activeTab === "refunds" && (
                        <button
                          onClick={() => booking.id && handleDelete(booking.id)}
                          title="حذف نهائي"
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center min-h-[300px]">
                      <Ticket className="w-16 h-16 text-slate-200 mb-4 shrink-0 animate-pulse" />
                      <p className="text-slate-500 font-bold text-lg">
                        لا توجد سجلات مطابقة
                      </p>
                      <p className="text-sm text-slate-400 mt-1 font-medium">ابدأ بإجراء حجز جديد أو عدّل فلاتر البحث</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
            <div style={{ padding: '24px 32px' }} className="border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center">
                <Ticket className="w-5 h-5 ml-2 text-indigo-500" />
                {isEdit ? "تعديل حجز التذكرة" : "إصدار حجز جديد"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form
              onSubmit={handleSave}
              style={{ padding: '24px 32px' }}
              className="max-h-[75vh] overflow-y-auto w-full"
            >
              {saveError && (
                <div className="mb-6 p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-bold flex items-start">
                  <XCircle className="w-5 h-5 ml-2 shrink-0 mt-0.5" />
                  <span>{saveError}</span>
                </div>
              )}

              <div className="flex items-center justify-center mb-[24px] gap-[16px] overflow-x-auto pb-4 w-full">
                <div
                  className={`flex items-center gap-2 shrink-0 ${modalStep >= 1 ? "text-indigo-600" : "text-slate-400"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${modalStep >= 1 ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "bg-slate-200"}`}
                  >
                    1
                  </div>
                  <span className="font-bold text-sm whitespace-nowrap">
                    العميل والمسار
                  </span>
                </div>
                <div
                  className={`h-1 mx-2 w-16 min-w-[16px] rounded-full ${modalStep >= 2 ? "bg-indigo-600" : "bg-slate-200"}`}
                ></div>
                <div
                  className={`flex items-center gap-2 shrink-0 ${modalStep >= 2 ? "text-indigo-600" : "text-slate-400"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${modalStep >= 2 ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "bg-slate-200"}`}
                  >
                    2
                  </div>
                  <span className="font-bold text-sm whitespace-nowrap">
                    الرحلة والمقاعد
                  </span>
                </div>
                <div
                  className={`h-1 mx-2 w-16 min-w-[16px] rounded-full ${modalStep >= 3 ? "bg-indigo-600" : "bg-slate-200"}`}
                ></div>
                <div
                  className={`flex items-center gap-2 shrink-0 ${modalStep >= 3 ? "text-indigo-600" : "text-slate-400"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${modalStep >= 3 ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "bg-slate-200"}`}
                  >
                    3
                  </div>
                  <span className="font-bold text-sm whitespace-nowrap">
                    الدفع والتأكيد
                  </span>
                </div>
              </div>

              {modalStep === 1 && (
                <div className="grid grid-cols-2 gap-x-[16px] gap-y-[20px] mb-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-[6px]">
                      اسم العميل *
                    </label>
                    <input
                      type="text"
                      list="customers-list"
                      required
                      value={formData.customerName || ""}
                      onChange={(e) => handleCustomerSelect(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold"
                    />
                    <datalist id="customers-list">
                      {customers.map((c) => (
                        <option key={c.id} value={c.name} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-[6px]">
                      رقم الهاتف
                    </label>
                    <input
                      type="tel"
                      value={formData.customerPhone || ""}
                      onChange={(e) =>
                      // @ts-ignore
                        setFormData({
                          ...formData,
                          customerPhone: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dir-ltr text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-[6px]">
                      رقم الهوية / البطاقة / الجواز
                    </label>
                    <input
                      type="text"
                      value={formData.identityNumber || ""}
                      onChange={(e) =>
                      // @ts-ignore
                        setFormData({
                          ...formData,
                          identityNumber: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dir-ltr text-right font-mono"
                      placeholder="الرقم القومي أو الجواز"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-[6px]">
                      فئة المسافر
                    </label>
                    <select
                      value={formData.isStudent ? "student" : "traveler"}
                      onChange={(e) =>
                      // @ts-ignore
                        setFormData({
                          ...formData,
                          isStudent: e.target.value === "student",
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="traveler">مسافر عادي</option>
                      <option value="student">طالب (خصم متاح)</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-[6px]">
                      الوجهة المطلوب السفر إليها *
                    </label>
                    <input
                      type="text"
                      required
                      list="dest-list"
                      value={formData.destination || ""}
                      onChange={(e) => {
                        const dest = e.target.value;
                        setFormData({
                          ...formData,
                          destination: dest,
                          vendorId: undefined,
                          tripId: undefined,
                          vendorName: undefined,
                          expectedCommission: 0,
                          pricePerTicket: 0,
                          seatNumber: "",
                        });
                        setSelectedRouteKey("");
                        setActiveTripLayout(null);
                        setIsSeatLockedByMe(false);
                        setSeatLockTimeLeft(null);
                      }}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold"
                      placeholder="بحث بالوجهة (مثال: القاهرة)"
                    />
                    <datalist id="dest-list">
                      {Array.from(
                        new Set([
                          ...routes.map((r) => r.destination),
                          ...vendorRoutes.map((vr) => vr.routeName),
                        ]),
                      ).map((d) => (
                        <option key={d} value={d} />
                      ))}
                    </datalist>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-[6px]">
                      الشركة الناقلة (المتاحة لهذه الوجهة) *
                    </label>
                    <select
                      required
                      value={selectedRouteKey}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedRouteKey(val);
                        if (!val) return;

                        if (val.startsWith("internal_")) {
                          const tripIdText = val.split("_")[1];
                          const tripId = parseInt(tripIdText);
                          const trip = trips.find((t) => t.id === tripId);
                          const { price } = applyDynamicPricing(
                            tripIdText,
                            formData.departureDate ||
                              new Date().toISOString().split("T")[0],
                            bookings,
                          );
                          const routeForTrip = routes.find(
                            (x) => x.id === trip?.routeId,
                          );

                          setFormData({
                            ...formData,
                            tripId: tripId,
                            vendorId: undefined,
                            vendorName: undefined,
                            destination: routeForTrip
                              ? routeForTrip.destination
                              : formData.destination,
                            expectedCommission: 0,
                            pricePerTicket:
                              price > 0 ? price : trip?.basePrice || 0,
                            departureTime: trip?.departureTime || "10:00",
                            transportType: trip?.transportType || "bus",
                            seatNumber: "",
                          });

                          setIsSeatLockedByMe(false);
                          setSeatLockTimeLeft(null);

                          // Handle Seating Layout View
                          if (trip && trip.vehicleId) {
                            const vehicle = vehicles.find(
                              (v) => v.id === trip.vehicleId,
                            );
                            if (vehicle && vehicle.layoutTemplateId) {
                              const template = templates.find(
                                (t) => t.id === vehicle.layoutTemplateId,
                              );
                              if (template && template.layoutData) {
                                try {
                                  const parsed = JSON.parse(
                                    template.layoutData,
                                  );
                                  setActiveTripLayout({
                                    grid: parsed.grid || parsed,
                                    seats: parsed.seats || {},
                                  });
                                } catch (err) {
                                  setActiveTripLayout(null);
                                }
                              } else {
                                setActiveTripLayout(null);
                              }
                            } else {
                              setActiveTripLayout(null);
                            }
                          } else {
                            setActiveTripLayout(null);
                          }
                        } else if (val.startsWith("vendor_")) {
                          const match = val.match(/^vendor_(\d+)_(.*)$/);
                          if (match) {
                            const vId = parseInt(match[1]);
                            const routeNameStr = match[2];
                            const v = vendors.find((x) => x.id === vId);

                            const vrList = vendorRoutes.filter(
                              (x) => x.vendorId === vId,
                            );
                            const vr =
                              vrList.find(
                                (x) => x.routeName === routeNameStr,
                              ) || vrList[0];

                            let comm = 0;
                            if (v && vr) {
                              comm =
                                v.commissionType === "percentage"
                                  ? Math.round(
                                      (vr.officialPrice * v.commissionValue) /
                                        100,
                                    )
                                  : v.commissionValue;
                            }

                            setFormData({
                              ...formData,
                              tripId: undefined,
                              vendorId: vId,
                              vendorName: v?.name,
                              destination: vr
                                ? vr.routeName
                                : formData.destination,
                              expectedCommission: comm,
                              pricePerTicket: vr?.officialPrice || 0,
                              transportType: v?.transportType || "bus",
                              seatNumber: "",
                            });

                            setIsSeatLockedByMe(false);
                            setSeatLockTimeLeft(null);
                            setActiveTripLayout(null);
                          }
                        } else if (val === "manual_entry") {
                          setFormData({
                            ...formData,
                            tripId: undefined,
                            vendorId: undefined,
                            vendorName: "",
                            destination: formData.destination,
                            expectedCommission: 0,
                            pricePerTicket: 0,
                            transportType: "bus",
                            seatNumber: "",
                          });
                          setIsSeatLockedByMe(false);
                          setSeatLockTimeLeft(null);
                          setActiveTripLayout(null);
                        } else if (val.startsWith("vendoronly_")) {
                          const match = val.match(/^vendoronly_(\d+)$/);
                          if (match) {
                            const vId = parseInt(match[1]);
                            const v = vendors.find((x) => x.id === vId);
                            setFormData({
                              ...formData,
                              tripId: undefined,
                              vendorId: vId,
                              vendorName: v?.name,
                              destination: formData.destination, // keep current typed
                              expectedCommission: 0,
                              pricePerTicket: 0,
                              transportType: v?.transportType || "bus",
                              seatNumber: "",
                            });
                            setIsSeatLockedByMe(false);
                            setSeatLockTimeLeft(null);
                            setActiveTripLayout(null);
                          }
                        }
                      }}
                      className="w-full px-4 py-3 bg-indigo-50/30 border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-indigo-800"
                    >
                      <option value="" disabled>
                        اختر الشركة أو الرحلة
                      </option>
                      <optgroup label="أسطولنا الداخلي (رحلات مجدولة)">
                        {trips
                          .filter((t) => {
                            const r = routes.find((x) => x.id === t.routeId);
                            if (!formData.destination) return true;
                            const normSearch = (formData.destination || "")
                              .trim()
                              .replace(/ة/g, "ه")
                              .replace(/[أإآ]/g, "ا")
                              .toLowerCase();
                            const normDest = (r?.destination || "")
                              .replace(/ة/g, "ه")
                              .replace(/[أإآ]/g, "ا")
                              .toLowerCase();
                            return r && normDest.includes(normSearch);
                          })
                          .map((t) => (
                            <option
                              key={`internal_${t.id}`}
                              value={`internal_${t.id}`}
                            >
                              أسطولنا الداخلي - #{t.tripCode} - رسوم:{" "}
                              {t.basePrice} ج.م - الساعة: {t.departureTime}
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="شركات النقل الأخرى (مسارات مسجلة)">
                        {vendorRoutes
                          .filter((vr) => {
                            if (!formData.destination) return true;
                            const normSearch = (formData.destination || "")
                              .trim()
                              .replace(/ة/g, "ه")
                              .replace(/[أإآ]/g, "ا")
                              .toLowerCase();
                            const normDest = (vr.routeName || "")
                              .replace(/ة/g, "ه")
                              .replace(/[أإآ]/g, "ا")
                              .toLowerCase();
                            return normDest.includes(normSearch);
                          })
                          .map((vr) => {
                            const v = vendors.find((x) => x.id === vr.vendorId);
                            return (
                              <option
                                key={`vendor_${vr.vendorId}_${vr.routeName}`}
                                value={`vendor_${vr.vendorId}_${vr.routeName}`}
                              >
                                {v?.name || ""} - مسار: {vr.routeName} -{" "}
                                {vr.officialPrice} ج.م
                              </option>
                            );
                          })}
                      </optgroup>
                      <optgroup label="كل الشركات الناقلة (وجهة حرة)">
                        {vendors.map((v) => (
                          <option
                            key={`vendoronly_${v.id}`}
                            value={`vendoronly_${v.id}`}
                          >
                            شركة: {v.name} (تحديد السعر يدوياً)
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="خيارات إضافية">
                        <option value="manual_entry">
                          شركات التوصيل الأخرى (اكتب اسم الشركة يدوياً)
                        </option>
                      </optgroup>
                    </select>

                    {selectedRouteKey === "manual_entry" && (
                      <div className="mt-3">
                        <label className="block text-sm font-bold text-slate-700 mb-[6px]">
                          اسم الشركة الناقلة (إدخال يدوي) *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.vendorName || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              vendorName: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-slate-800"
                          placeholder="اكتب اسم الشركة الناقلة..."
                        />
                      </div>
                    )}

                    {(formData.vendorId ||
                      (formData.expectedCommission || 0) > 0) && (
                      <div className="mt-3">
                        <label className="block text-sm font-bold text-slate-700 mb-[6px] whitespace-nowrap overflow-visible">
                          عمولة المحل المتوقعة (ربحك){" "}
                          <span className="text-emerald-500">
                            * تلقائي للمقعد الواحد
                          </span>
                        </label>
                        <div className="relative">
                          <Tag className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 w-5 h-5" />
                          <input
                            type="text"
                            readOnly
                            value={`${formData.expectedCommission || 0} ج.م`}
                            className="w-full pl-4 pr-10 py-3 bg-emerald-50/50 border border-emerald-200 text-emerald-700 rounded-xl outline-none font-black cursor-not-allowed"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {modalStep === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-2 gap-x-[16px] gap-y-[20px] mb-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-[6px]">
                        تاريخ المغادرة *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.departureDate || ""}
                        onChange={(e) => {
                          const newDate = e.target.value;
                          const { price } = applyDynamicPricing(
                            formData.destination || "",
                            newDate,
                            bookings,
                          );
                          setFormData({
                            ...formData,
                            departureDate: newDate,
                            pricePerTicket:
                              price > 0 ? price : formData.pricePerTicket,
                          });
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold font-mono text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-[6px]">
                        وقت المغادرة
                      </label>
                      <input
                        type="time"
                        value={formData.departureTime || ""}
                        onChange={(e) =>
                        // @ts-ignore
                          setFormData({
                            ...formData,
                            departureTime: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold font-mono text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-[6px]">
                        الدرجة / نوع التذكرة
                      </label>
                      <select
                        value={formData.ticketType || ""}
                        onChange={(e) =>
                        // @ts-ignore
                          setFormData({
                            ...formData,
                            ticketType: e.target.value as any,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                      >
                        <option value="standard">عادية Standard</option>
                        <option value="vip">مميزة VIP</option>
                        <option value="student">طالب Student</option>
                        <option value="child">طفل Child</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-[6px]">
                        عدد الركاب/التذاكر
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formData.passengers || 1}
                        onChange={(e) =>
                        // @ts-ignore
                          setFormData({
                            ...formData,
                            passengers: Number(e.target.value),
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-black text-indigo-700 bg-indigo-50/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-[6px]">
                        وسيلة المواصلات
                      </label>
                      <select
                        value={formData.transportType || "bus"}
                        onChange={(e) =>
                        // @ts-ignore
                          setFormData({
                            ...formData,
                            transportType: e.target.value as any,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                      >
                        <option value="bus">أتوبيس</option>
                        <option value="train">قطار</option>
                        <option value="airplane">طائرة</option>
                        <option value="ship">سفينة / عبارة</option>
                        <option value="limo">ليموزين / سيارة</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-[6px]">
                        رقم المقعد / الكرسي (اختياري)
                      </label>

                      {activeTripLayout ? (
                        <div className="bg-slate-100 p-4 rounded-2xl mb-3 overflow-x-auto flex flex-col items-center border border-slate-200 shadow-inner">
                          <p className="text-xs font-bold text-slate-500 mb-4">
                            اختر مقعداً من المخطط
                          </p>
                          <div className="bg-slate-300 w-full max-w-[150px] h-1.5 rounded-full mb-6"></div>
                          <div className="flex flex-col gap-2">
                            {activeTripLayout.grid.map((row, rIdx) => (
                              <div
                                key={rIdx}
                                className="flex gap-2 justify-center"
                              >
                                {row.map((cell, cIdx) => {
                                  if (cell === "X")
                                    return (
                                      <div key={cIdx} className="w-10 h-10" />
                                    ); // Empty space

                                  const isSelected =
                                    formData.seatNumber === cell;
                                  const props = activeTripLayout.seats[cell];

                                  let bg =
                                    "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300";
                                  if (props?.type === "vip")
                                    bg =
                                      "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100";
                                  if (props?.type === "window")
                                    bg =
                                      "bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100";

                                  if (isSelected) {
                                    bg =
                                      "bg-indigo-600 border-indigo-700 text-white ring-2 ring-indigo-300 scale-105 z-10";
                                  }

                                  return (
                                    <button
                                      key={cIdx}
                                      type="button"
                                      disabled={isSeatLockedByMe}
                                      onClick={() => {
                                        const fee = props?.extraFee || 0;
                                        const base =
                                          trips.find(
                                            (t) =>
                                              String(t.id) ===
                                              formData.destination,
                                          )?.basePrice || 0;
                                        setFormData({
                                          ...formData,
                                          seatNumber: cell,
                                          pricePerTicket: base + fee,
                                        });
                                        setIsSeatLockedByMe(false);
                                        setSeatLockTimeLeft(null);
                                      }}
                                      className={`w-10 h-10 rounded-xl font-bold text-sm transition-all border-b-[3px] flex flex-col items-center justify-center relative ${bg} ${isSeatLockedByMe && isSelected ? "opacity-100" : isSeatLockedByMe ? "opacity-50" : "cursor-pointer"}`}
                                      title={
                                        props?.type === "vip"
                                          ? "VIP المقعد المميز"
                                          : props?.type === "window"
                                            ? "ثمن النافذة"
                                            : "مقعد عادي"
                                      }
                                    >
                                      {cell}
                                      {props?.extraFee > 0 && !isSelected && (
                                        <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[8px] px-1 rounded-full">
                                          {props.extraFee}+
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                          <div className="bg-slate-300 w-full max-w-[150px] h-1.5 rounded-full mt-6"></div>
                        </div>
                      ) : null}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          disabled={isSeatLockedByMe}
                          value={formData.seatNumber || ""}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              seatNumber: e.target.value,
                            });
                            setIsSeatLockedByMe(false);
                            setSeatLockTimeLeft(null);
                          }}
                          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold"
                          placeholder="مثال: 12A"
                        />
                        <button
                          type="button"
                          onClick={handleLockSeat}
                          disabled={isSeatLockedByMe || !formData.seatNumber}
                          className="bg-slate-800 text-white px-4 rounded-xl font-bold hover:bg-slate-900 disabled:opacity-50 transition-colors whitespace-nowrap"
                        >
                          {isSeatLockedByMe
                            ? `محجوز لك (${Math.floor(seatLockTimeLeft! / 60)}:${(seatLockTimeLeft! % 60).toString().padStart(2, "0")})`
                            : "تأكيد وحجز مؤقت"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Ancillary Services */}
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-slate-700 mb-[6px]">
                      الخدمات الإضافية والضيافة (Ancillary Services)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {AVAILABLE_SERVICES.map((service) => {
                        const isSelected = formData.selectedServices?.find(
                          (s) => s.id === service.id,
                        );
                        return (
                          <div
                            key={service.id}
                            onClick={() => {
                              const srvs = formData.selectedServices || [];
                              const exists = srvs.find(
                                (s) => s.id === service.id,
                              );
                              let newSrvs = [];
                              if (exists) {
                                newSrvs = srvs.filter(
                                  (s) => s.id !== service.id,
                                );
                              } else {
                                newSrvs = [...srvs, service];
                              }

                              const newTotalSrv = newSrvs.reduce(
                                (acc, curr) => acc + curr.price,
                                0,
                              );
                              setFormData({
                                ...formData,
                                selectedServices: newSrvs,
                                ancillaryTotal: newTotalSrv,
                              });
                            }}
                            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${isSelected ? "bg-indigo-50 border-indigo-500" : "bg-white border-slate-200 hover:border-indigo-200"}`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-5 h-5 rounded flex items-center justify-center border ${isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300"}`}
                              >
                                {isSelected && (
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={3}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                              </div>
                              <span
                                className={`font-bold text-sm ${isSelected ? "text-indigo-900" : "text-slate-700"}`}
                              >
                                {service.name}
                              </span>
                            </div>
                            <span
                              className={`font-black text-sm ${isSelected ? "text-indigo-600" : "text-slate-500"}`}
                            >
                              {service.price} ج.م
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {modalStep === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-slate-100 p-5 rounded-2xl mb-6 border border-slate-200/60">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-[16px] gap-y-[20px] mb-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-[6px]">
                          السعر الأساسي للتذكرة
                        </label>
                        <input
                          type="number"
                          readOnly={
                            !(
                              selectedRouteKey.startsWith("vendoronly_") ||
                              selectedRouteKey === "manual_entry"
                            )
                          }
                          min="0"
                          required
                          value={formData.pricePerTicket || 0}
                          onChange={(e) =>
                          // @ts-ignore
                            setFormData({
                              ...formData,
                              pricePerTicket: parseFloat(e.target.value) || 0,
                            })
                          }
                          className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold ${!(selectedRouteKey.startsWith("vendoronly_") || selectedRouteKey === "manual_entry") ? "text-slate-500 cursor-not-allowed" : "text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"}`}
                        />
                        {pricingNotes && (
                          <p className="text-xs font-bold text-amber-600 mt-1">
                            {pricingNotes}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-[6px]">
                          رسوم المحل (إضافية)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.taxAmount || ""}
                          onChange={(e) =>
                          // @ts-ignore
                            setFormData({
                              ...formData,
                              taxAmount: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl outline-none font-black text-indigo-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-[6px]">
                          الخصم (للعميل)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.discountAmount || ""}
                          onChange={(e) =>
                          // @ts-ignore
                            setFormData({
                              ...formData,
                              discountAmount: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-black text-rose-600 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                          placeholder="0"
                        />
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-indigo-100 flex flex-col justify-center shadow-sm col-span-2 lg:col-span-1">
                        <label className="block text-xs font-bold text-indigo-700 mb-1">
                          إجمالي المطلوب من العميل
                        </label>
                        <div className="font-black text-lg text-indigo-900">
                          {(
                            (formData.passengers || 1) *
                              (formData.pricePerTicket || 0) +
                            (formData.taxAmount || 0) +
                            (formData.luggageFee || 0) +
                            (formData.ancillaryTotal || 0) -
                            (formData.discountAmount || 0)
                          ).toLocaleString()}{" "}
                          <span className="text-xs">ج.م</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-[16px] gap-y-[20px] mb-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-[6px]">
                          المبلغ المدفوع (العربون / الكلي)
                        </label>
                        <input
                          type="number"
                          readOnly={formData.paymentMethod === "split"}
                          min="0"
                          value={
                            formData.paidAmount === undefined
                              ? ""
                              : formData.paidAmount
                          }
                          onChange={(e) =>
                          // @ts-ignore
                            setFormData({
                              ...formData,
                              paidAmount:
                                e.target.value === ""
                                  ? undefined
                                  : parseFloat(e.target.value),
                            })
                          }
                          className="w-full px-4 py-3 bg-white border border-emerald-300 shadow-sm rounded-xl outline-none font-black text-emerald-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-lg"
                          placeholder="المبلغ المستلم"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-[6px]">
                          طريقة الدفع
                        </label>
                        <select
                          value={formData.paymentMethod || "cash"}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            if (
                              val === "split" &&
                              (!formData.paymentSplits ||
                                formData.paymentSplits.length === 0)
                            ) {
                              setFormData({
                                ...formData,
                                paymentMethod: val,
                                paymentSplits: [
                                  {
                                    method: "cash",
                                    amount: formData.paidAmount || 0,
                                    reference: "",
                                  },
                                ],
                              });
                            } else {
                              setFormData({ ...formData, paymentMethod: val });
                            }
                          }}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        >
                          <option value="cash">نقداً الكاشير</option>
                          <option value="card">فيزا / بطاقة ائتمان</option>
                          <option value="wallet">
                            محفظة (فودافون كاش الخ)
                          </option>
                          <option value="transfer">تحويل بنكي</option>
                          <option value="split">دفع مركب (متعدد)</option>
                        </select>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-center">
                        <label className="block text-sm font-bold text-slate-600 mb-1">
                          المبلغ المتبقي للعميل (أجل / دين)
                        </label>
                        <div className="font-black text-xl text-rose-600">
                          {Math.max(
                            0,
                            (formData.passengers || 1) *
                              (formData.pricePerTicket || 0) +
                              (formData.taxAmount || 0) +
                              (formData.luggageFee || 0) +
                              (formData.ancillaryTotal || 0) -
                              (formData.discountAmount || 0) -
                              (formData.paidAmount || 0),
                          ).toLocaleString()}{" "}
                          <span className="text-sm">ج.م</span>
                        </div>
                      </div>
                    </div>

                    {formData.paymentMethod === "split" && (
                      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 mt-2">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-bold text-slate-700 text-sm">
                            تفاصيل الدفع المركب
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              const splits = formData.paymentSplits || [];
                              setFormData({
                                ...formData,
                                paymentSplits: [
                                  ...splits,
                                  { method: "card", amount: 0, reference: "" },
                                ],
                              });
                            }}
                            className="text-indigo-600 text-xs font-bold bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100"
                          >
                            + إضافة دفعة
                          </button>
                        </div>
                        <div className="space-y-3">
                          {(formData.paymentSplits || []).map((split, sIdx) => (
                            <div key={sIdx} className="flex gap-2 items-start">
                              <select
                                value={split.method}
                                onChange={(e) => {
                                  const splits = [
                                    ...(formData.paymentSplits || []),
                                  ];
                                  splits[sIdx].method = e.target.value as any;
                                  setFormData({
                                    ...formData,
                                    paymentSplits: splits,
                                  });
                                }}
                                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-sm"
                              >
                                <option value="cash">نقداً</option>
                                <option value="card">فيزا/ماستر</option>
                                <option value="wallet">محفظة</option>
                                <option value="transfer">تحويل</option>
                              </select>
                              <input
                                type="number"
                                min="0"
                                value={split.amount || ""}
                                onChange={(e) => {
                                  const splits = [
                                    ...(formData.paymentSplits || []),
                                  ];
                                  splits[sIdx].amount =
                                    parseFloat(e.target.value) || 0;
                                  const totalPaid = splits.reduce(
                                    (acc, curr) => acc + (curr.amount || 0),
                                    0,
                                  );
                                  setFormData({
                                    ...formData,
                                    paymentSplits: splits,
                                    paidAmount: totalPaid,
                                  });
                                }}
                                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-black text-sm text-emerald-700"
                                placeholder="المبلغ"
                              />
                              <input
                                type="text"
                                value={split.reference || ""}
                                onChange={(e) => {
                                  const splits = [
                                    ...(formData.paymentSplits || []),
                                  ];
                                  splits[sIdx].reference = e.target.value;
                                  setFormData({
                                    ...formData,
                                    paymentSplits: splits,
                                  });
                                }}
                                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-sm"
                                placeholder="رقم المرجع (اختياري)"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const splits = [
                                    ...(formData.paymentSplits || []),
                                  ];
                                  splits.splice(sIdx, 1);
                                  const totalPaid = splits.reduce(
                                    (acc, curr) => acc + (curr.amount || 0),
                                    0,
                                  );
                                  setFormData({
                                    ...formData,
                                    paymentSplits: splits,
                                    paidAmount: totalPaid,
                                  });
                                }}
                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors mt-0.5"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 flex justify-between items-center border-t border-slate-200 border-dashed mt-2">
                      <span className="font-bold text-slate-600">
                        القيمة الإجمالية للحجز
                      </span>
                      <span className="text-2xl font-black text-slate-800">
                        {(
                          (formData.passengers || 1) *
                            (formData.pricePerTicket || 0) +
                          (formData.taxAmount || 0) +
                          (formData.luggageFee || 0) +
                          (formData.ancillaryTotal || 0) -
                          (formData.discountAmount || 0)
                        ).toLocaleString()}{" "}
                        <span className="text-sm">ج.م</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-[16px] gap-y-[20px] mb-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-[6px]">
                        وزن الحقائب الإضافية (كجم)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.luggageWeight || ""}
                        onChange={(e) =>
                        // @ts-ignore
                          setFormData({
                            ...formData,
                            luggageWeight: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-[6px]">
                        رسوم الحقائب الإضافية
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.luggageFee || ""}
                        onChange={(e) =>
                        // @ts-ignore
                          setFormData({
                            ...formData,
                            luggageFee: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-rose-600 focus:border-rose-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-[6px]">
                        حالة الحضور/الصعود
                      </label>
                      <select
                        value={formData.checkInStatus || "pending"}
                        onChange={(e) =>
                        // @ts-ignore
                          setFormData({
                            ...formData,
                            checkInStatus: e.target.value as any,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-indigo-700"
                      >
                        <option value="pending">لم يحضر (قيد الانتظار)</option>
                        <option value="boarded">صعد (Boarded)</option>
                        <option value="did_not_attend">
                          تخلف عن الرحلة (No Show)
                        </option>
                        <option value="cancelled">إلغاء</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-[6px]">
                        حالة الحجز مالیًا
                      </label>
                      <select
                        value={formData.status || ""}
                        onChange={(e) =>
                        // @ts-ignore
                          setFormData({
                            ...formData,
                            status: e.target.value as any,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                      >
                        <option value="confirmed">تم التأكيد</option>
                        <option value="pending">قيد الانتظار</option>
                        <option value="cancelled">ملغي</option>
                      </select>
                    </div>
                    <div className="col-span-2 lg:col-span-4">
                      <label className="block text-sm font-bold text-slate-700 mb-[6px]">
                        ملاحظات إضافية
                      </label>
                      <input
                        type="text"
                        value={formData.notes || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700"
                        placeholder="احتياجات خاصة، أرقام مقاعد..."
                      />
                    </div>
                  </div>
                </div>
              )}

              <div
                style={{ paddingTop: '16px', paddingBottom: '24px' }}
                className="flex justify-between border-t border-slate-100 bg-white sticky bottom-0 -mx-[32px] -mb-[24px] px-[32px] items-center flex-wrap gap-4"
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors"
                >
                  إغلاق وتراجع
                </button>
                <div className="flex gap-3">
                  {modalStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setModalStep((s) => s - 1)}
                      className="px-6 py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors flex items-center gap-2 border border-slate-200"
                    >
                      السابق
                    </button>
                  )}
                  {modalStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (modalStep === 1) {
                          if (!formData.customerName) {
                            setSaveError("يرجى إدخال اسم العميل");
                            return;
                          }
                          if (!formData.destination) {
                            setSaveError("يرجى إدخال الوجهة المطلوبة للسفر");
                            return;
                          }
                          if (
                            !formData.vendorId &&
                            !formData.tripId &&
                            !formData.vendorName
                          ) {
                            setSaveError("يرجى اختيار أو إدخال الشركة الناقلة");
                            return;
                          }
                        }
                        if (modalStep === 2) {
                          if (!formData.departureDate) {
                            setSaveError("يرجى إدخال تاريخ المغادرة");
                            return;
                          }
                          if (!formData.passengers || formData.passengers < 1) {
                            setSaveError(
                              "يرجى تحديد عدد الركاب/التذاكر بشكل صحيح",
                            );
                            return;
                          }
                        }
                        setSaveError("");
                        setModalStep((s) => s + 1);
                      }}
                      className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg flex items-center justify-center gap-2 min-w-[120px]"
                    >
                      التالي
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg flex items-center justify-center min-w-[150px]"
                    >
                      <CheckCircle className="w-5 h-5 ml-2" />
                      {isEdit ? "حفظ التعديلات" : "تأكيد وإصدار التذكرة"}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCancelModalOpen && bookingToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <h2 className="text-xl font-bold text-rose-800 flex items-center">
                <AlertTriangle className="w-5 h-5 ml-2 text-rose-600" />
                إلغاء الحجز واسترداد الأموال
              </h2>
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-full transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                <p className="text-sm font-bold text-slate-500 mb-1">
                  العميل:{" "}
                  <span className="text-slate-800">
                    {bookingToCancel.customerName}
                  </span>
                </p>
                <p className="text-sm font-bold text-slate-500 mb-1">
                  الرحلة:{" "}
                  <span className="text-slate-800">
                    {bookingToCancel.destination}
                  </span>
                </p>
                <p className="text-sm font-bold text-slate-500">
                  المدفوع:{" "}
                  <span className="text-emerald-600">
                    {(bookingToCancel.paidAmount || 0).toLocaleString()} ج.م
                  </span>
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    رسوم الاستقطاع / الإلغاء (إن وجدت)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={cancellationFee}
                    onChange={(e) =>
                      setCancellationFee(parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-black text-rose-600 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    طريقة الاسترداد
                  </label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value as any)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-700"
                  >
                    <option value="cash">نقداً</option>
                    <option value="card">إلى البطاقة</option>
                    <option value="wallet">محفظة إلكترونية</option>
                    <option value="transfer">تحويل بنكي</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 p-4 rounded-xl">
                <span className="font-bold text-slate-600">
                  المبلغ المسترد للعميل
                </span>
                <span className="text-2xl font-black text-slate-800">
                  {Math.max(
                    0,
                    (bookingToCancel.paidAmount || 0) - cancellationFee,
                  ).toLocaleString()}{" "}
                  <span className="text-sm">ج.م</span>
                </span>
              </div>

              <div className="pt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors"
                >
                  تراجع
                </button>
                <button
                  type="button"
                  onClick={confirmCancelBooking}
                  className="px-5 py-2.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/30 flex items-center"
                >
                  <Trash2 className="w-4 h-4 ml-2" />
                  تأكيد الإلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketBookings;
