import type { ReactNode } from "react";
import {
  BarChart3,
  BellRing,
  BookOpen,
  Boxes,
  Briefcase,
  Building2,
  Calculator,
  CalendarCheck2,
  CalendarClock,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Coins,
  FileBarChart,
  FileClock,
  FileSearch,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  Gift,
  HandCoins,
  HeartHandshake,
  LayoutDashboard,
  LifeBuoy,
  LineChart,
  Map,
  Megaphone,
  MonitorSmartphone,
  Package,
  Percent,
  Receipt,
  RotateCcw,
  ScanLine,
  ScrollText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  ShoppingBag,
  Store,
  Truck,
  UserCircle2,
  UserCog,
  Users,
  Wallet,
  Warehouse,
  Wrench
} from "lucide-react";

import type { AppMode } from "./appMode";

export type RouteGroupId =
  | "main"
  | "sales"
  | "customers"
  | "products"
  | "inventory"
  | "projects"
  | "logistics"
  | "finance"
  | "accounting"
  | "admin";

export type RouteDefinition = {
  path: string;
  label: string;
  description: string;
  group: RouteGroupId;
  icon: ReactNode;
  modes: AppMode[];
  implemented?: boolean;
};

export const routeCatalog: RouteDefinition[] = [
  { path: "/", label: "لوحة التحكم", description: "نظرة تشغيلية على مؤشرات اليوم.", group: "main", icon: <LayoutDashboard size={18} />, modes: ["starter", "standard", "service", "enterprise"], implemented: true },
  { path: "/pos", label: "نقطة البيع", description: "شاشة البيع المباشر وإنشاء الفواتير.", group: "main", icon: <ShoppingCart size={18} />, modes: ["starter", "standard", "service", "enterprise"], implemented: true },
  { path: "/employee-portal", label: "بوابة الموظفين", description: "تجربة داخلية للموظفين والخدمات الذاتية.", group: "main", icon: <UserCircle2 size={18} />, modes: ["starter", "standard", "service", "enterprise"], implemented: true },
  { path: "/delivery", label: "إدارة التوصيل", description: "متابعة التوصيل والمهام المرتبطة به.", group: "main", icon: <Truck size={18} />, modes: ["standard", "service", "enterprise"], implemented: true },
  { path: "/maintenance", label: "أوامر الصيانة", description: "واجهة تشغيل للصيانة والخدمة.", group: "main", icon: <Wrench size={18} />, modes: ["service", "enterprise"], implemented: true },
  { path: "/preventive-maintenance", label: "الصيانة الوقائية", description: "خطط الصيانة المجدولة والتنبيهات.", group: "main", icon: <CalendarCheck2 size={18} />, modes: ["enterprise"] },
  { path: "/rentals", label: "التأجير", description: "إدارة الحجوزات والتأجير الدوري.", group: "main", icon: <Store size={18} />, modes: ["service", "enterprise"], implemented: true },
  { path: "/studio", label: "الاستوديو", description: "الحجوزات والمواعيد في بيئات الخدمة.", group: "main", icon: <MonitorSmartphone size={18} />, modes: ["service", "enterprise"], implemented: true },
  { path: "/tables", label: "الطاولات", description: "إدارة الطاولات والضيافة.", group: "main", icon: <Store size={18} />, modes: ["standard", "enterprise"], implemented: true },
  { path: "/kitchen", label: "المطبخ", description: "شاشة تنفيذ أوامر المطبخ.", group: "main", icon: <ClipboardCheck size={18} />, modes: ["standard", "enterprise"], implemented: true },

  { path: "/orders", label: "الطلبات", description: "سجل الفواتير مع التفاصيل والإلغاء.", group: "sales", icon: <Receipt size={18} />, modes: ["starter", "standard", "service", "enterprise"], implemented: true },
  { path: "/held-orders", label: "الطلبات المعلقة", description: "حفظ الطلبات غير المكتملة واستعادتها.", group: "sales", icon: <FileClock size={18} />, modes: ["standard", "service", "enterprise"], implemented: true },
  { path: "/quotations", label: "عروض الأسعار", description: "العروض التجارية والطلبات المسبقة.", group: "sales", icon: <FileClock size={18} />, modes: ["standard", "service", "enterprise"], implemented: true },
  { path: "/b2b-sales", label: "مبيعات الجملة", description: "واجهات البيع للشركات والعملاء التجاريين.", group: "sales", icon: <ShoppingBag size={18} />, modes: ["standard", "enterprise"], implemented: true },
  { path: "/ecommerce", label: "طلبات المتجر", description: "القناة الإلكترونية والطلبات القادمة منها.", group: "sales", icon: <ShoppingCart size={18} />, modes: ["standard", "enterprise"], implemented: true },
  { path: "/van-sales", label: "مبيعات المندوبين", description: "المبيعات الميدانية والموزعين.", group: "sales", icon: <Truck size={18} />, modes: ["enterprise"] },
  { path: "/returns", label: "المرتجعات", description: "إنشاء ومتابعة المرتجعات.", group: "sales", icon: <RotateCcw size={18} />, modes: ["starter", "standard", "service", "enterprise"], implemented: true },
  { path: "/sales-targets", label: "أهداف المبيعات", description: "متابعة الأهداف والأداء البيعي.", group: "sales", icon: <LineChart size={18} />, modes: ["enterprise"] },
  { path: "/fulfillment", label: "التنفيذ", description: "متابعة تجهيز الطلبات والتنفيذ.", group: "sales", icon: <ClipboardList size={18} />, modes: ["enterprise"] },
  { path: "/shifts", label: "الورديات", description: "الجلسات النقدية وورديات الكاشير.", group: "sales", icon: <Clock3 size={18} />, modes: ["standard", "service", "enterprise"], implemented: true },

  { path: "/customers", label: "العملاء", description: "إدارة قاعدة العملاء وتحديثهم.", group: "customers", icon: <Users size={18} />, modes: ["starter", "standard", "service", "enterprise"], implemented: true },
  { path: "/customer-payments", label: "مدفوعات العملاء", description: "سداد المديونية وشحن المحافظ ومتابعة الحركات.", group: "customers", icon: <Wallet size={18} />, modes: ["standard", "service", "enterprise"], implemented: true },
  { path: "/crm", label: "CRM", description: "محور موحد لإدارة علاقات العملاء.", group: "customers", icon: <UserCog size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/crm/leads", label: "الفرص والمبيعات", description: "خط المبيعات والفرص التجارية.", group: "customers", icon: <FolderKanban size={18} />, modes: ["enterprise"] },
  { path: "/crm/tickets", label: "الدعم الفني", description: "التذاكر والدعم وخدمة العملاء.", group: "customers", icon: <LifeBuoy size={18} />, modes: ["standard", "service", "enterprise"], implemented: true },
  { path: "/crm/campaigns", label: "الحملات التسويقية", description: "حملات التسويق وإدارة التفاعل.", group: "customers", icon: <Megaphone size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/customer-portal", label: "بوابة العملاء", description: "واجهة خارجية للعملاء.", group: "customers", icon: <UserCircle2 size={18} />, modes: ["enterprise"] },
  { path: "/loyalty", label: "الولاء", description: "إدارة النقاط وبرامج الولاء.", group: "customers", icon: <HeartHandshake size={18} />, modes: ["standard", "enterprise"], implemented: true },
  { path: "/gift-cards", label: "بطاقات الهدايا", description: "إصدار واسترداد بطاقات الهدايا.", group: "customers", icon: <Gift size={18} />, modes: ["standard", "enterprise"] },
  { path: "/subscriptions", label: "الاشتراكات", description: "المبيعات المتكررة والاشتراكات.", group: "customers", icon: <CalendarClock size={18} />, modes: ["service", "enterprise"], implemented: true },
  { path: "/promotions", label: "العروض الترويجية", description: "إدارة العروض والخصومات.", group: "customers", icon: <Percent size={18} />, modes: ["standard", "enterprise"] },
  { path: "/installments", label: "الأقساط", description: "خطط السداد والتقسيط.", group: "customers", icon: <HandCoins size={18} />, modes: ["standard", "enterprise"], implemented: true },

  { path: "/products", label: "المنتجات", description: "إدارة المنتجات وإنشاؤها وتحديثها.", group: "products", icon: <Package size={18} />, modes: ["starter", "standard", "service", "enterprise"], implemented: true },
  { path: "/categories", label: "التصنيفات", description: "هيكلة الكتالوج وتنظيمه.", group: "products", icon: <Boxes size={18} />, modes: ["starter", "standard", "service", "enterprise"], implemented: true },
  { path: "/pricing-rules", label: "قواعد التسعير", description: "السياسات والعروض والتسعير المتقدم.", group: "products", icon: <Percent size={18} />, modes: ["standard", "enterprise"], implemented: true },
  { path: "/recipes", label: "الوصفات", description: "المكونات والوصفات التشغيلية.", group: "products", icon: <ClipboardList size={18} />, modes: ["standard", "enterprise"] },
  { path: "/bom", label: "قائمة المواد", description: "Bill of Materials للمنتجات.", group: "products", icon: <FileText size={18} />, modes: ["standard", "enterprise"], implemented: true },
  { path: "/work-centers", label: "مراكز العمل", description: "خطوط الإنتاج والعمل التشغيلي.", group: "products", icon: <Building2 size={18} />, modes: ["standard", "enterprise"], implemented: true },
  { path: "/work-orders", label: "أوامر التشغيل", description: "تنفيذ أوامر الإنتاج والخدمة.", group: "products", icon: <ClipboardCheck size={18} />, modes: ["standard", "enterprise"], implemented: true },
  { path: "/quality-control", label: "مراقبة الجودة", description: "اختبارات الجودة والمطابقة.", group: "products", icon: <ShieldCheck size={18} />, modes: ["standard", "enterprise"], implemented: true },
  { path: "/manufacturing/tqm", label: "TQM", description: "الجودة الشاملة ومؤشراتها.", group: "products", icon: <ShieldCheck size={18} />, modes: ["enterprise"] },
  { path: "/manufacturing/plm", label: "PLM", description: "دورة حياة المنتج.", group: "products", icon: <Boxes size={18} />, modes: ["enterprise"] },
  { path: "/production-planning", label: "تخطيط الإنتاج", description: "التخطيط والتوقعات التشغيلية.", group: "products", icon: <CalendarCheck2 size={18} />, modes: ["standard", "enterprise"], implemented: true },
  { path: "/inventory/demand-forecasting", label: "توقعات الطلب", description: "التوقعات والتحليل الاستباقي.", group: "products", icon: <LineChart size={18} />, modes: ["enterprise"] },
  { path: "/barcodes", label: "الباركود", description: "طباعة وإدارة الباركود.", group: "products", icon: <ScanLine size={18} />, modes: ["standard", "service", "enterprise"], implemented: true },
  { path: "/sticker-printing", label: "الملصقات", description: "طباعة الملصقات والعناوين.", group: "products", icon: <FileSpreadsheet size={18} />, modes: ["service", "enterprise"], implemented: true },

  { path: "/warehouse", label: "المستودع", description: "متابعة حركات المستودعات.", group: "inventory", icon: <Warehouse size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/advanced-wms", label: "WMS المتقدم", description: "إدارة مستودعات متقدمة.", group: "inventory", icon: <Warehouse size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/branch-transfers", label: "تحويلات الفروع", description: "نقل المخزون بين الفروع.", group: "inventory", icon: <Truck size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/stock-adjustments", label: "تسويات المخزون", description: "معالجة الفروقات والتسويات.", group: "inventory", icon: <ClipboardCheck size={18} />, modes: ["standard", "enterprise"], implemented: true },
  { path: "/inventory-count", label: "الجرد الدوري", description: "إحصاء المخزون ومطابقته.", group: "inventory", icon: <ClipboardList size={18} />, modes: ["standard", "enterprise"], implemented: true },
  { path: "/purchase-requests", label: "طلبات الشراء", description: "طلبات الشراء الداخلية.", group: "inventory", icon: <FileText size={18} />, modes: ["enterprise"] },
  { path: "/rfqs", label: "عروض الموردين", description: "RFQ وإدارة عروض الشراء.", group: "inventory", icon: <FileSearch size={18} />, modes: ["enterprise"] },
  { path: "/purchase-orders", label: "أوامر الشراء", description: "Purchase Orders ومساراتها.", group: "inventory", icon: <Receipt size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/purchases", label: "المشتريات", description: "الفواتير الشرائية والتوريد.", group: "inventory", icon: <ShoppingBag size={18} />, modes: ["standard", "enterprise"], implemented: true },
  { path: "/suppliers", label: "الموردون", description: "سجل الموردين وتعاملاتهم.", group: "inventory", icon: <Truck size={18} />, modes: ["standard", "enterprise"], implemented: true },
  { path: "/purchases/supplier-evaluation", label: "تقييم الموردين", description: "قياس أداء الموردين.", group: "inventory", icon: <LineChart size={18} />, modes: ["enterprise"] },
  { path: "/vendor-portal", label: "بوابة الموردين", description: "واجهة للموردين والتعامل الخارجي.", group: "inventory", icon: <Store size={18} />, modes: ["enterprise"], implemented: true },

  { path: "/projects", label: "المشاريع", description: "إدارة المشاريع والأعمال التعاقدية.", group: "projects", icon: <Briefcase size={18} />, modes: ["service", "enterprise"], implemented: true },
  { path: "/tasks", label: "المهام", description: "متابعة المهام الداخلية.", group: "projects", icon: <ClipboardList size={18} />, modes: ["service", "enterprise"], implemented: true },
  { path: "/events", label: "الفعاليات", description: "إدارة الفعاليات والخدمات المصاحبة.", group: "projects", icon: <CalendarCheck2 size={18} />, modes: ["service", "enterprise"] },
  { path: "/timesheets", label: "سجلات الوقت", description: "تتبع وقت العمل والمشاريع.", group: "projects", icon: <Clock3 size={18} />, modes: ["service", "enterprise"], implemented: true },

  { path: "/shipping", label: "الشحن", description: "العمليات اللوجستية والشحن.", group: "logistics", icon: <Truck size={18} />, modes: ["standard", "enterprise"], implemented: true },
  { path: "/logistics/import-export", label: "الاستيراد والتصدير", description: "سير العمل الدولي والجمركي.", group: "logistics", icon: <Map size={18} />, modes: ["enterprise"] },
  { path: "/fleet", label: "الأسطول", description: "إدارة المركبات والحركة.", group: "logistics", icon: <Truck size={18} />, modes: ["standard", "enterprise"], implemented: true },

  { path: "/expenses", label: "المصروفات", description: "تسجيل المصروفات والتحكم فيها.", group: "finance", icon: <Wallet size={18} />, modes: ["standard", "service", "enterprise"], implemented: true },
  { path: "/capital", label: "رأس المال", description: "مصادر رأس المال وحركته.", group: "finance", icon: <CircleDollarSign size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/currencies", label: "العملات", description: "إدارة العملات وأسعار الصرف.", group: "finance", icon: <Coins size={18} />, modes: ["standard", "enterprise"], implemented: true },
  { path: "/payroll", label: "الرواتب", description: "الرواتب والحوافز والأجور.", group: "finance", icon: <Coins size={18} />, modes: ["standard", "service", "enterprise"], implemented: true },
  { path: "/hr/commissions", label: "العمولات", description: "عمولات المبيعات والحوافز.", group: "finance", icon: <CircleDollarSign size={18} />, modes: ["enterprise"] },
  { path: "/employees", label: "الموظفون", description: "ملفات العاملين.", group: "finance", icon: <Users size={18} />, modes: ["standard", "enterprise"], implemented: true },
  { path: "/hr/asset-custody", label: "العهد", description: "العهد والأصول المسلمة للموظفين.", group: "finance", icon: <Package size={18} />, modes: ["enterprise"] },
  { path: "/onboarding", label: "التهيئة", description: "تجهيز الموظفين الجدد.", group: "finance", icon: <UserCog size={18} />, modes: ["standard", "enterprise"], implemented: true },
  { path: "/benefits", label: "المزايا", description: "المزايا والتعويضات.", group: "finance", icon: <HeartHandshake size={18} />, modes: ["standard", "enterprise"] },
  { path: "/disciplinary", label: "الإجراءات التأديبية", description: "الحوكمة والإجراءات الداخلية.", group: "finance", icon: <BellRing size={18} />, modes: ["standard", "enterprise"] },
  { path: "/attendance", label: "الحضور والانصراف", description: "دوام الموظفين وحضورهم.", group: "finance", icon: <Clock3 size={18} />, modes: ["standard", "enterprise"], implemented: true },
  { path: "/leaves", label: "الإجازات", description: "طلبات الإجازة وإدارتها.", group: "finance", icon: <CalendarCheck2 size={18} />, modes: ["standard", "enterprise"] },
  { path: "/loans", label: "السلف والقروض", description: "القروض الداخلية للموظفين.", group: "finance", icon: <HandCoins size={18} />, modes: ["standard", "enterprise"] },
  { path: "/recruitment", label: "التوظيف", description: "الاستقطاب والتعيين.", group: "finance", icon: <Briefcase size={18} />, modes: ["standard", "enterprise"], implemented: true },
  { path: "/hr/careers-portal", label: "بوابة التوظيف", description: "التوظيف الخارجي والوظائف المفتوحة.", group: "finance", icon: <UserCircle2 size={18} />, modes: ["enterprise"] },
  { path: "/performance", label: "تقييم الأداء", description: "متابعة الأداء والـ KPIs البشرية.", group: "finance", icon: <BarChart3 size={18} />, modes: ["standard", "enterprise"] },
  { path: "/training", label: "التدريب", description: "التدريب والتطوير المؤسسي.", group: "finance", icon: <BookOpen size={18} />, modes: ["standard", "enterprise"], implemented: true },
  { path: "/hr/lms", label: "LMS", description: "التعلم الداخلي والمحتوى التدريبي.", group: "finance", icon: <BookOpen size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/org-chart", label: "الهيكل التنظيمي", description: "خريطة المؤسسة والهيكل الإداري.", group: "finance", icon: <Users size={18} />, modes: ["standard", "enterprise"], implemented: true },

  { path: "/accounting/coa", label: "دليل الحسابات", description: "شجرة الحسابات.", group: "accounting", icon: <BookOpen size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/accounting/journal", label: "قيود اليومية", description: "اليومية العامة والقيود.", group: "accounting", icon: <ScrollText size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/accounting/general-ledger", label: "دفتر الأستاذ", description: "الحركة التفصيلية للحسابات.", group: "accounting", icon: <FileText size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/accounting/checks", label: "الشيكات", description: "إدارة الشيكات والتحصيل.", group: "accounting", icon: <Receipt size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/accounting/petty-cash", label: "العهدة النقدية", description: "المصروفات النقدية الصغيرة.", group: "accounting", icon: <Wallet size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/accounting/bank-reconciliation", label: "التسوية البنكية", description: "مطابقة البنك مع الحركة.", group: "accounting", icon: <Calculator size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/accounting/assets", label: "الأصول", description: "الأصول الثابتة ومتابعتها.", group: "accounting", icon: <Building2 size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/accounting/budgeting", label: "الموازنات", description: "التخطيط والميزانيات.", group: "accounting", icon: <FileBarChart size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/accounting/cost-centers", label: "مراكز التكلفة", description: "التوزيع المحاسبي ومراكز التكلفة.", group: "accounting", icon: <Map size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/accounting/aging", label: "تقارير الأعمار", description: "Aging للمستحقات والذمم.", group: "accounting", icon: <Clock3 size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/accounting/tax", label: "الضرائب", description: "VAT والالتزامات الضريبية.", group: "accounting", icon: <Percent size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/accounting/e-invoicing", label: "الفوترة الإلكترونية", description: "المطابقة والمتطلبات النظامية.", group: "accounting", icon: <Receipt size={18} />, modes: ["enterprise"] },
  { path: "/accounting/closing", label: "الإقفال المالي", description: "إغلاق الفترات والسنوات.", group: "accounting", icon: <CalendarClock size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/accounting/reports", label: "التقارير المالية", description: "القوائم والتقارير المالية.", group: "accounting", icon: <BarChart3 size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/accounting/treasury", label: "الخزينة", description: "إدارة النقد والسيولة.", group: "accounting", icon: <Wallet size={18} />, modes: ["enterprise"], implemented: true },

  { path: "/reports", label: "التقارير", description: "ملخصات الإدارة والتشغيل.", group: "admin", icon: <BarChart3 size={18} />, modes: ["starter", "standard", "service", "enterprise"], implemented: true },
  { path: "/custom-reports", label: "التقارير المخصصة", description: "بناء تقارير مرنة.", group: "admin", icon: <FileBarChart size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/reports/bi-dashboards", label: "لوحات BI", description: "لوحات تحليلية تنفيذية.", group: "admin", icon: <BarChart3 size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/market-monitor", label: "مراقب السوق", description: "مؤشرات خارجية وتحليل السوق.", group: "admin", icon: <LineChart size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/approval-workflows", label: "الموافقات", description: "تدفقات الموافقة والاعتماد.", group: "admin", icon: <ClipboardCheck size={18} />, modes: ["enterprise"] },
  { path: "/dms", label: "إدارة المستندات", description: "الأرشفة والمستندات.", group: "admin", icon: <FileText size={18} />, modes: ["enterprise"] },
  { path: "/internal-communication", label: "التواصل الداخلي", description: "إعلانات وتواصل داخلي.", group: "admin", icon: <BellRing size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/audit-logs", label: "سجلات التدقيق", description: "Audit logs وتتبع العمليات.", group: "admin", icon: <ScrollText size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/role-management", label: "إدارة الأدوار", description: "الصلاحيات والأدوار.", group: "admin", icon: <UserCog size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/system-backups", label: "النسخ الاحتياطية", description: "إدارة النسخ والاستعادة.", group: "admin", icon: <FileSpreadsheet size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/admin/risk-compliance", label: "المخاطر والالتزام", description: "الحوكمة والامتثال.", group: "admin", icon: <ShieldCheck size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/users", label: "المستخدمون", description: "إدارة مستخدمي النظام.", group: "admin", icon: <Users size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/branches", label: "الفروع", description: "إدارة الفروع والانتشار.", group: "admin", icon: <Building2 size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/admin/pos-terminals", label: "أجهزة نقاط البيع", description: "محطات البيع والأجهزة.", group: "admin", icon: <MonitorSmartphone size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/logbook", label: "سجل العمليات", description: "سجل عام للتشغيل والإجراءات.", group: "admin", icon: <ScrollText size={18} />, modes: ["enterprise"], implemented: true },
  { path: "/settings", label: "الإعدادات", description: "إعدادات النسخة والاتصال.", group: "admin", icon: <Settings size={18} />, modes: ["starter", "standard", "service", "enterprise"], implemented: true },
  { path: "/about", label: "حول النظام", description: "معلومات هذه النسخة المرجعية.", group: "admin", icon: <FileText size={18} />, modes: ["starter", "standard", "service", "enterprise"], implemented: true }
];

export function toChildPath(path: string) {
  return path === "/" ? "/" : path.replace(/^\//, "");
}
