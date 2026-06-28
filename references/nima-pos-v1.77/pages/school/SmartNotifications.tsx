import React, { useState, useEffect } from "react";
import {
  Bell,
  AlertTriangle,
  Clock,
  Target,
  CalendarDays,
  Key,
  HeartPulse,
  HardDrive,
  Filter,
  CheckCircle2,
  ShieldAlert,
  PackageX,
  X,
  ArrowUpLeft,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";
import { useNavigate } from "react-router-dom";

interface NotificationItem {
  id: string;
  type: "attendance" | "finance" | "health" | "inventory" | "system";
  icon: React.ElementType;
  color: string;
  bg: string;
  title: string;
  message: string;
  date: Date;
  link?: string;
}

export const SmartNotifications = () => {
  const navigate = useNavigate();
  const students = useLiveQuery(() => db.schoolStudents.toArray()) || [];
  const attendance =
    useLiveQuery(() => db.schoolAttendanceList?.toArray()) || [];
  const inventory = useLiveQuery(() => db.schoolInventory?.toArray()) || [];
  const fees = useLiveQuery(() => db.schoolFees?.toArray()) || [];

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [dismissedNotifs, setDismissedNotifs] = useState<string[]>(() => {
    const saved = localStorage.getItem("school_dismissed_notifs");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const notifs: NotificationItem[] = [];

    // 1. Health Alerts (Allergies)
    const kidsWithAllergies = students.filter(
      (s) =>
        s.allergies ||
        s.medicalProfile?.foodAllergies ||
        s.medicalProfile?.medicineAllergies ||
        s.medicalProfile?.chronicDiseases,
    );

    if (kidsWithAllergies.length > 0) {
      notifs.push({
        id: "health_allergies",
        type: "health",
        icon: HeartPulse,
        color: "text-rose-600",
        bg: "bg-rose-100",
        title: "تنبيهات الحساسية والأمراض المزمنة",
        message: `يوجد ${kidsWithAllergies.length} طفل مسجلين بملفات طبية تتطلب رعاية خاصة (حساسية أو أمراض مزمنة). يرجى إبلاغ المعلمين والمشرفين.`,
        date: new Date(),
        link: "/school/students",
      });
    }

    // 2. Unpaid Fees
    const pendingFees = fees.filter((f) => f.status === "pending");
    if (pendingFees.length > 0) {
      const overdueSum = pendingFees.reduce(
        (sum, f) => sum + (f.amount || 0),
        0,
      );
      notifs.push({
        id: "finance_due_fees",
        type: "finance",
        icon: Clock,
        color: "text-amber-600",
        bg: "bg-amber-100",
        title: "أقساط ومستحقات غير مسددة",
        message: `يوجد ${pendingFees.length} استحقاق مالي غير مدفوع بإجمالي ${overdueSum.toLocaleString()} ج.م للطلاب.`,
        date: new Date(),
        link: "/school/fees",
      });
    }

    // 3. Attendance - Repeated Absences (Mocked detection based on attendance array size for demo, actually filter absent students)
    const dateString = new Date().toISOString().split("T")[0];
    const absentToday = attendance.filter(
      (a) => a.date === dateString && a.status === "absent",
    );
    if (absentToday.length > 0) {
      notifs.push({
        id: `attendance_absent_${dateString}`,
        type: "attendance",
        icon: AlertTriangle,
        color: "text-indigo-600",
        bg: "bg-indigo-100",
        title: "غياب الطلاب اليوم",
        message: `تم تسجيل غياب ${absentToday.length} طالب(ة) لليوم الحالي. يرجى مراجعة سجل الغياب والتواصل مع أولياء الأمور إن لزم الأمر.`,
        date: new Date(),
        link: "/school/attendance",
      });
    }

    // 4. Low Inventory / Stock
    const lowStock = inventory.filter((i) => {
      const qty = Number(i.quantity) || 0;
      const min = Number(i.minStock) || 5;
      return qty <= min;
    });

    if (lowStock.length > 0) {
      notifs.push({
        id: "inventory_low_stock",
        type: "inventory",
        icon: PackageX,
        color: "text-orange-500",
        bg: "bg-orange-100",
        title: "نقص في مخزون الأدوات/المستلزمات",
        message: `يوجد ${lowStock.length} صنف/أصناف وصلت للحد الأدنى المتطلب إعاده طلبه (مثل: ${lowStock[0]?.name || "بعض المستلزمات"}).`,
        date: new Date(),
        link: "/school/inventory",
      });
    }

    // 5. System notification (always there)
    notifs.push({
      id: "system_backup",
      type: "system",
      icon: HardDrive,
      color: "text-slate-500",
      bg: "bg-slate-100",
      title: "حالة النظام التلقائية",
      message:
        "مرحباً بك في مركز الإشعارات الذكية! يتم تحديث هذا المركز تلقائياً بناءً على بيانات المدرسه والحضانه والتقارير المرفوعة.",
      date: new Date(),
    });

    const activeNotifs = notifs.filter((n) => !dismissedNotifs.includes(n.id));
    setNotifications(activeNotifs);
  }, [students, attendance, inventory, fees, dismissedNotifs]);

  const handleDismiss = (id: string) => {
    const newDismissed = [...dismissedNotifs, id];
    setDismissedNotifs(newDismissed);
    localStorage.setItem(
      "school_dismissed_notifs",
      JSON.stringify(newDismissed),
    );
  };

  const handleResetAll = () => {
    setDismissedNotifs([]);
    localStorage.removeItem("school_dismissed_notifs");
  };

  const filters = [
    { id: "all", label: "الكل الإشعارات" },
    { id: "health", label: "صحية وطبية" },
    { id: "finance", label: "مالية وأقساط" },
    { id: "attendance", label: "غياب ومتابعة" },
    { id: "inventory", label: "مخزون ومستلزمات" },
  ];

  const displayNotifs =
    activeFilter === "all"
      ? notifications
      : notifications.filter((n) => n.type === activeFilter);

  return (
    <div className="p-4 sm:p-6 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-100 p-3 rounded-2xl shadow-inner">
            <Bell className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              الإشعارات الذكية
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              متابعة آلية للتنبيهات الحيوية وبوابة الاستجابة السريعة
            </p>
          </div>
        </div>

        {dismissedNotifs.length > 0 && (
          <button
            onClick={handleResetAll}
            className="text-sm font-bold text-slate-500 hover:text-indigo-600 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm transition-all"
          >
            استعادة الإشعارات المخفية
          </button>
        )}
      </div>

      <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 mb-6 overflow-x-auto mx-1 hide-scrollbar max-w-fit">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all duration-200 ${
              activeFilter === filter.id
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {displayNotifs.map((n) => (
          <div
            key={n.id}
            className="relative bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-200 transition-all group overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50/50 to-transparent -mr-10 -mt-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-start gap-4">
              <div className={`${n.bg} p-3 sm:p-4 rounded-2xl shrink-0`}>
                <n.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${n.color}`} />
              </div>
              <div className="flex-1 w-full">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-black text-slate-800 text-lg">
                    {n.title}
                  </h3>
                  <button
                    onClick={() => handleDismiss(n.id)}
                    className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-slate-600 text-sm font-medium leading-relaxed mb-5 min-h-[40px]">
                  {n.message}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">
                    تحديث تلقائي
                  </span>
                  {n.link && (
                    <button
                      onClick={() => navigate(n.link!)}
                      className="text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition-colors flex items-center group/btn"
                    >
                      <ArrowUpLeft className="w-4 h-4 ml-1.5 group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5 transition-transform" />
                      الذهاب للمتابعة
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {displayNotifs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
          <div className="bg-slate-50 p-4 rounded-full mb-4">
            <CheckCircle2 className="w-12 h-12 text-indigo-400" />
          </div>
          <p className="text-xl font-black text-slate-800 mb-2">
            ممتاز! لا توجد إشعارات حالية
          </p>
          <p className="text-slate-500 font-medium">
            تم التعامل مع جميع التنبيهات الذكية الخاصة بهذا القسم.
          </p>
        </div>
      )}
    </div>
  );
};

export default SmartNotifications;
