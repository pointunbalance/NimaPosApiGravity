
import React, { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, performBackupToDirectory } from '../db';
import { 
  LayoutDashboard, ShoppingCart, Package, History, Store, Users, Settings, 
  PieChart, Wallet, Truck, ClipboardList, ClipboardX, 
  LockKeyhole, ShieldCheck, LogOut, Bell, Sparkles,
  AlertTriangle, Calendar, Info, ListChecks, ScanLine, FileText, Landmark, LayoutGrid, ChefHat, Layers, FileClock, BookOpen, ScrollText, BarChart4,
  Banknote, Calculator, Video, Printer, Activity, Zap, Gem, Building2, Power, Shirt,
  Star, Percent, CalendarClock, RotateCcw, ArrowLeftRight, ClipboardCheck, CircleUser, Clock, Utensils, Wrench, Building, Target, WalletCards, Globe, Gift, Repeat,
  ChevronDown, ChevronRight, Sun, Moon, FileSearch, Briefcase, ListTodo, Ticket, Navigation, FileSignature, FileBarChart, Filter, LifeBuoy, Megaphone, Ship, Scale, Folder, Factory, ShieldAlert, UserCheck, DatabaseBackup, HeartHandshake, AlertOctagon, UserPlus, MessageSquare, Receipt, Coins, Laptop, TrendingUp, CalendarDays, MonitorSmartphone, LineChart
} from 'lucide-react';
import { User, AppMode } from '../types';
import { t } from '../utils/i18n';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';

interface LayoutProps {
  onLogout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ onLogout }) => {
  const location = useLocation();
  const { success, error, showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const user: User = JSON.parse(localStorage.getItem('nima_user') || '{}');
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const lang = settings?.language || 'ar';
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const businessType = settings?.businessType || 'retail';
  const accountingEnabled = settings?.enableAccounting || false;
  const currentMode: AppMode = settings?.appMode || 'enterprise'; // Default to enterprise if not set
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupLabel: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupLabel]: !prev[groupLabel]
    }));
  };

  // --- Notifications Logic ---
  const allProducts = useLiveQuery(() => db.products.toArray(), []) || [];
  
  const lowStockProducts = useMemo(() => {
      return allProducts.filter(p => p.stock <= (p.alertThreshold || 5));
  }, [allProducts]);
  
  const expiringContracts = useLiveQuery(async () => {
      const users = await db.users.toArray();
      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setDate(today.getDate() + 30);
      return users.filter(u => u.contractEndDate && new Date(u.contractEndDate) > today && new Date(u.contractEndDate) < nextMonth);
  }, []) || [];

  const notifications = useMemo(() => {
      const list = [];
      lowStockProducts.forEach(p => {
          list.push({
              id: `stock-${p.id}`,
              type: 'stock',
              title: 'تنبيه مخزون',
              message: `المنتج "${p.name}" وصل للحد الأدنى (${p.stock})`,
              time: 'الآن',
              priority: 'high'
          });
      });
      expiringContracts.forEach(u => {
          list.push({
              id: `contract-${u.id}`,
              type: 'contract',
              title: 'انتهاء عقد',
              message: `عقد الموظف "${u.name}" ينتهي قريباً`,
              time: u.contractEndDate ? new Date(u.contractEndDate).toLocaleDateString() : '',
              priority: 'medium'
          });
      });
      return list;
  }, [lowStockProducts, expiringContracts]);

  // --- Reorganized Navigation Menu with Mode Support ---
  const allNavItems = [
    { 
      label: 'نقطة البيع والتشغيل',
      section: 'main', 
      items: [
        { path: '/', label: 'dashboard', icon: LayoutDashboard, roles: ['admin', 'cashier'], modes: ['starter', 'standard', 'service', 'enterprise'] },
        { path: '/pos', label: 'pos', icon: ShoppingCart, roles: ['admin', 'cashier'], modes: ['starter', 'standard', 'service', 'enterprise'] },
        { path: '/rentals', label: 'حجوزات الملابس', icon: Shirt, roles: ['admin', 'cashier'], modes: ['service', 'enterprise'] },
        { path: '/studio', label: 'حجز استوديو', icon: Video, roles: ['admin', 'cashier'], modes: ['service', 'enterprise'] },
        { path: '/tables', label: 'إدارة الطاولات', icon: LayoutGrid, roles: ['admin', 'cashier'], businessTypes: ['restaurant'], modes: ['standard', 'enterprise'] }, 
        { path: '/kitchen', label: 'شاشة المطبخ', icon: ChefHat, roles: ['admin', 'cashier'], businessTypes: ['restaurant'], modes: ['standard', 'enterprise'] }, 
        { path: '/delivery', label: 'إدارة التوصيل', icon: Truck, roles: ['admin', 'cashier'], modes: ['standard', 'enterprise'] },
        { path: '/employee-portal', label: 'بوابة الموظفين', icon: CircleUser, roles: ['admin', 'cashier', 'warehouse', 'waiter', 'kitchen', 'delivery', 'manager'], modes: ['starter', 'standard', 'service', 'enterprise'] },
        { path: '/maintenance', label: 'أوامر الصيانة', icon: Wrench, roles: ['admin', 'cashier'], modes: ['service', 'enterprise'] },
        { path: '/preventive-maintenance', label: 'الصيانة الوقائية', icon: Calendar, roles: ['admin'], modes: ['enterprise'] },
      ]
    },
    { 
      label: 'إدارة المبيعات',
      section: 'sales', 
      items: [
        { path: '/orders', label: 'sales', icon: History, roles: ['admin', 'cashier'], modes: ['starter', 'standard', 'service', 'enterprise'] },
        { path: '/quotations', label: 'عروض الأسعار', icon: FileClock, roles: ['admin', 'cashier'], modes: ['service', 'standard', 'enterprise'] },
        { path: '/b2b-sales', label: 'مبيعات الجملة', icon: FileText, roles: ['admin', 'cashier'], modes: ['standard', 'enterprise'] },
        { path: '/ecommerce', label: 'طلبات المتجر', icon: ShoppingCart, roles: ['admin', 'cashier'], modes: ['standard', 'enterprise'] },
        { path: '/van-sales', label: 'مبيعات المندوبين', icon: Truck, roles: ['admin'], modes: ['enterprise'] },
        { path: '/returns', label: 'المرتجعات', icon: RotateCcw, roles: ['admin', 'cashier'], modes: ['standard', 'enterprise'] },
        { path: '/sales-targets', label: 'أهداف المبيعات', icon: Target, roles: ['admin'], modes: ['enterprise'] },
        { path: '/fulfillment', label: 'fulfillment', icon: ListChecks, roles: ['admin', 'cashier', 'warehouse'], modes: ['enterprise'] }, 
      ]
    },
    { 
      label: 'العملاء والولاء',
      section: 'customers', 
      items: [
        { path: '/customers', label: 'customers', icon: Users, roles: ['admin', 'cashier'], modes: ['standard', 'service', 'enterprise'] },
        { path: '/crm/leads', label: 'الفرص والمبيعات', icon: Filter, roles: ['admin', 'cashier'], modes: ['enterprise'] },
        { path: '/crm/tickets', label: 'الدعم الفني', icon: LifeBuoy, roles: ['admin', 'cashier'], modes: ['standard', 'service', 'enterprise'] },
        { path: '/crm/campaigns', label: 'الحملات التسويقية', icon: Megaphone, roles: ['admin'], modes: ['enterprise'] },
        { path: '/customer-portal', label: 'بوابة العملاء', icon: CircleUser, roles: ['admin', 'cashier'], modes: ['enterprise'] },
        { path: '/loyalty', label: 'برنامج الولاء', icon: Star, roles: ['admin', 'cashier'], modes: ['standard', 'enterprise'] },
        { path: '/gift-cards', label: 'بطاقات الهدايا', icon: Gift, roles: ['admin', 'cashier'], modes: ['standard', 'enterprise'] },
        { path: '/subscriptions', label: 'الاشتراكات', icon: Repeat, roles: ['admin', 'cashier'], modes: ['service', 'enterprise'] },
        { path: '/promotions', label: 'العروض الترويجية', icon: Percent, roles: ['admin', 'cashier'], modes: ['standard', 'enterprise'] },
        { path: '/installments', label: 'إدارة الأقساط', icon: CalendarClock, roles: ['admin', 'cashier'], modes: ['standard', 'enterprise'] },
      ]
    },
    { 
      label: 'المخزون والمنتجات',
      section: 'products', 
      items: [
        { path: '/products', label: 'products', icon: Package, roles: ['admin', 'warehouse'], modes: ['starter', 'standard', 'service', 'enterprise'] },
        { path: '/categories', label: 'التصنيفات', icon: Layers, roles: ['admin', 'warehouse'], modes: ['starter', 'standard', 'service', 'enterprise'] },
        { path: '/pricing-rules', label: 'قواعد التسعير', icon: Percent, roles: ['admin'], modes: ['standard', 'enterprise'] },
        { path: '/recipes', label: 'الوصفات (BOM)', icon: Utensils, roles: ['admin', 'warehouse'], modes: ['standard', 'enterprise'] },
        { path: '/bom', label: 'قائمة المواد (BOM)', icon: Factory, roles: ['admin', 'warehouse'], modes: ['standard', 'enterprise'] },
        { path: '/work-centers', label: 'مراكز العمل', icon: Building2, roles: ['admin', 'warehouse'], modes: ['standard', 'enterprise'] },
        { path: '/work-orders', label: 'أوامر التشغيل', icon: Settings, roles: ['admin', 'warehouse'], modes: ['standard', 'enterprise'] },
        { path: '/quality-control', label: 'مراقبة الجودة', icon: ClipboardCheck, roles: ['admin', 'warehouse'], modes: ['standard', 'enterprise'] },
        { path: '/manufacturing/tqm', label: 'إدارة الجودة (TQM)', icon: ShieldCheck, roles: ['admin', 'warehouse'], modes: ['enterprise'] },
        { path: '/manufacturing/plm', label: 'دورة حياة المنتج (PLM)', icon: Layers, roles: ['admin', 'warehouse'], modes: ['enterprise'] },
        { path: '/production-planning', label: 'تخطيط الإنتاج', icon: Calendar, roles: ['admin', 'warehouse'], modes: ['standard', 'enterprise'] },
        { path: '/inventory/demand-forecasting', label: 'توقعات الطلب (AI)', icon: TrendingUp, roles: ['admin', 'warehouse'], modes: ['enterprise'] },
        { path: '/barcodes', label: 'طباعة الباركود', icon: ScanLine, roles: ['admin', 'warehouse'], modes: ['standard', 'service', 'enterprise'] },
        { path: '/sticker-printing', label: 'ملصقات اللابتوب', icon: Printer, roles: ['admin', 'warehouse'], modes: ['service', 'enterprise'] },
      ]
    },
    { 
      label: 'المستودعات والتوريد',
      section: 'inventory', 
      items: [
        { path: '/warehouse', label: 'warehouse', icon: Store, roles: ['admin', 'warehouse'], modes: ['enterprise'] }, 
        { path: '/advanced-wms', label: 'إدارة المخازن المتقدمة', icon: Package, roles: ['admin', 'warehouse'], modes: ['enterprise'] },
        { path: '/branch-transfers', label: 'تحويلات الفروع', icon: ArrowLeftRight, roles: ['admin', 'warehouse'], modes: ['enterprise'] },
        { path: '/stock-adjustments', label: 'stockAdjustments', icon: ClipboardX, roles: ['admin', 'warehouse'], modes: ['enterprise'] },
        { path: '/inventory-count', label: 'الجرد الدوري', icon: ClipboardCheck, roles: ['admin', 'warehouse'], modes: ['enterprise'] },
        { path: '/purchase-requests', label: 'طلبات الشراء الداخلية', icon: FileText, roles: ['admin', 'warehouse', 'cashier'], modes: ['enterprise'] },
        { path: '/rfqs', label: 'عروض أسعار الموردين', icon: FileSearch, roles: ['admin', 'warehouse'], modes: ['enterprise'] },
        { path: '/purchase-orders', label: 'أوامر الشراء', icon: FileText, roles: ['admin', 'warehouse'], modes: ['enterprise'] },
        { path: '/purchases', label: 'purchases', icon: ClipboardList, roles: ['admin', 'warehouse'], modes: ['standard', 'enterprise'] },
        { path: '/suppliers', label: 'suppliers', icon: Truck, roles: ['admin', 'warehouse'], modes: ['standard', 'enterprise'] },
        { path: '/purchases/supplier-evaluation', label: 'تقييم الموردين', icon: Star, roles: ['admin', 'warehouse'], modes: ['enterprise'] },
        { path: '/vendor-portal', label: 'بوابة الموردين', icon: Store, roles: ['admin', 'warehouse'], modes: ['enterprise'] },
      ]
    },
    {
      label: 'إدارة المشاريع',
      section: 'projects',
      items: [
        { path: '/projects', label: 'المشاريع والمقاولات', icon: Briefcase, roles: ['admin'], modes: ['enterprise', 'service'] },
        { path: '/tasks', label: 'إدارة المهام', icon: ListTodo, roles: ['admin', 'cashier'], modes: ['enterprise', 'service'] },
        { path: '/events', label: 'إدارة الفعاليات', icon: CalendarDays, roles: ['admin'], modes: ['enterprise', 'service'] },
        { path: '/timesheets', label: 'سجلات الوقت', icon: Clock, roles: ['admin', 'cashier'], modes: ['enterprise', 'service'] },
      ]
    },
    {
      label: 'الخدمات اللوجستية',
      section: 'logistics',
      items: [
        { path: '/shipping', label: 'الشحن والتخليص', icon: Ship, roles: ['admin', 'warehouse'], modes: ['enterprise', 'standard'] },
        { path: '/logistics/import-export', label: 'الاستيراد والتصدير', icon: Ship, roles: ['admin', 'warehouse'], modes: ['enterprise'] },
        { path: '/fleet', label: 'إدارة المركبات', icon: Truck, roles: ['admin', 'warehouse'], modes: ['enterprise', 'standard'] },
        { path: '/delivery', label: 'تتبع التوصيل', icon: Navigation, roles: ['admin', 'warehouse', 'cashier'], modes: ['enterprise', 'standard', 'service'] },
      ]
    },
    { 
      label: 'المالية والموارد البشرية',
      section: 'finance', 
      items: [
        { path: '/expenses', label: 'expenses', icon: Wallet, roles: ['admin'], modes: ['standard', 'service', 'enterprise'] },
        { path: '/capital', label: 'رأس المال', icon: Landmark, roles: ['admin'], modes: ['enterprise'] },
        { path: '/currencies', label: 'العملات', icon: Banknote, roles: ['admin'], modes: ['standard', 'enterprise'] },
        { path: '/payroll', label: 'الرواتب والأجور', icon: Banknote, roles: ['admin'], modes: ['standard', 'service', 'enterprise'] }, 
        { path: '/hr/commissions', label: 'العمولات والحوافز', icon: Coins, roles: ['admin'], modes: ['enterprise'] },
        { path: '/employees', label: 'ملفات الموظفين', icon: CircleUser, roles: ['admin'], modes: ['standard', 'enterprise'] },
        { path: '/hr/asset-custody', label: 'العهد العينية', icon: Laptop, roles: ['admin'], modes: ['enterprise'] },
        { path: '/onboarding', label: 'تهيئة الموظفين', icon: UserPlus, roles: ['admin'], modes: ['standard', 'enterprise'] },
        { path: '/benefits', label: 'المزايا والتعويضات', icon: HeartHandshake, roles: ['admin'], modes: ['standard', 'enterprise'] },
        { path: '/disciplinary', label: 'الإجراءات التأديبية', icon: AlertOctagon, roles: ['admin'], modes: ['standard', 'enterprise'] },
        { path: '/attendance', label: 'الحضور والانصراف', icon: Clock, roles: ['admin'], modes: ['standard', 'enterprise'] },
        { path: '/leaves', label: 'الإجازات والمغادرات', icon: Calendar, roles: ['admin', 'cashier'], modes: ['standard', 'enterprise'] },
        { path: '/loans', label: 'السلف والقروض', icon: Banknote, roles: ['admin', 'cashier'], modes: ['standard', 'enterprise'] },
        { path: '/recruitment', label: 'التوظيف', icon: Briefcase, roles: ['admin'], modes: ['standard', 'enterprise'] },
        { path: '/hr/careers-portal', label: 'بوابة التوظيف', icon: Globe, roles: ['admin'], modes: ['enterprise'] },
        { path: '/performance', label: 'تقييم الأداء', icon: Target, roles: ['admin'], modes: ['standard', 'enterprise'] },
        { path: '/training', label: 'التدريب والتطوير', icon: BookOpen, roles: ['admin'], modes: ['standard', 'enterprise'] },
        { path: '/hr/lms', label: 'نظام التعلم (LMS)', icon: BookOpen, roles: ['admin'], modes: ['enterprise'] },
        { path: '/org-chart', label: 'الهيكل التنظيمي', icon: Users, roles: ['admin'], modes: ['standard', 'enterprise'] },
        { path: '/shifts', label: 'shifts', icon: LockKeyhole, roles: ['admin', 'cashier'], modes: ['standard', 'service', 'enterprise'] },
      ]
    },
    { 
      label: 'المحاسبة المتقدمة',
      section: 'accounting', 
      items: [
        { path: '/accounting/coa', label: 'دليل الحسابات', icon: BookOpen, roles: ['admin'], condition: accountingEnabled, modes: ['enterprise'] },
        { path: '/accounting/journal', label: 'قيود اليومية', icon: ScrollText, roles: ['admin'], condition: accountingEnabled, modes: ['enterprise'] },
        { path: '/accounting/general-ledger', label: 'دفتر الأستاذ', icon: FileText, roles: ['admin'], condition: accountingEnabled, modes: ['enterprise'] },
        { path: '/accounting/checks', label: 'إدارة الشيكات', icon: Banknote, roles: ['admin'], condition: accountingEnabled, modes: ['enterprise'] },
        { path: '/accounting/petty-cash', label: 'العهد النقدية', icon: WalletCards, roles: ['admin'], condition: accountingEnabled, modes: ['enterprise'] },
        { path: '/accounting/bank-reconciliation', label: 'مطابقة البنوك', icon: Scale, roles: ['admin'], condition: accountingEnabled, modes: ['enterprise'] },
        { path: '/accounting/assets', label: 'الأصول الثابتة', icon: Calculator, roles: ['admin'], condition: accountingEnabled, modes: ['enterprise'] },
        { path: '/accounting/budgeting', label: 'الموازنات', icon: Target, roles: ['admin'], condition: accountingEnabled, modes: ['enterprise'] },
        { path: '/accounting/cost-centers', label: 'مراكز التكلفة', icon: Layers, roles: ['admin'], condition: accountingEnabled, modes: ['enterprise'] },
        { path: '/accounting/aging', label: 'أعمار الديون', icon: History, roles: ['admin'], condition: accountingEnabled, modes: ['enterprise'] },
        { path: '/accounting/tax', label: 'الضرائب (VAT)', icon: Landmark, roles: ['admin'], condition: accountingEnabled, modes: ['enterprise'] },
        { path: '/accounting/e-invoicing', label: 'الفاتورة الإلكترونية', icon: Receipt, roles: ['admin'], condition: accountingEnabled, modes: ['enterprise'] },
        { path: '/accounting/closing', label: 'إقفال السنة', icon: LockKeyhole, roles: ['admin'], condition: accountingEnabled, modes: ['enterprise'] },
        { path: '/accounting/reports', label: 'التقارير المالية', icon: BarChart4, roles: ['admin'], condition: accountingEnabled, modes: ['enterprise'] },
        { path: '/accounting/treasury', label: 'الخزينة والسيولة', icon: Landmark, roles: ['admin'], condition: accountingEnabled, modes: ['enterprise'] },
      ]
    },
    { 
      label: 'النظام والتقارير',
      section: 'admin', 
      items: [
        { path: '/legal', label: 'الإدارة القانونية', icon: FileSignature, roles: ['admin'], modes: ['enterprise'] },
        { path: '/legal/contracts', label: 'إدارة العقود', icon: FileSignature, roles: ['admin'], modes: ['enterprise'] },
        { path: '/dms', label: 'إدارة الوثائق (DMS)', icon: Folder, roles: ['admin'], modes: ['enterprise'] },
        { path: '/internal-communication', label: 'التواصل الداخلي', icon: MessageSquare, roles: ['admin', 'manager'], modes: ['enterprise'] },
        { path: '/approval-workflows', label: 'مسارات الاعتماد', icon: Settings, roles: ['admin'], modes: ['enterprise'] },
        { path: '/market-monitor', label: 'مراقبة السوق (AI)', icon: Globe, roles: ['admin'], modes: ['enterprise'] },
        { path: '/website-cms', label: 'إدارة محتوى الموقع', icon: Globe, roles: ['admin'], modes: ['enterprise', 'standard', 'service'] },
        { path: '/reports', label: 'reports', icon: PieChart, roles: ['admin'], modes: ['standard', 'service', 'enterprise'] },
        { path: '/custom-reports', label: 'التقارير المخصصة', icon: FileBarChart, roles: ['admin'], modes: ['enterprise'] },
        { path: '/reports/bi-dashboards', label: 'ذكاء الأعمال (BI)', icon: LineChart, roles: ['admin'], modes: ['enterprise'] },
        { path: '/users', label: 'users', icon: ShieldCheck, roles: ['admin'], modes: ['enterprise'] },
        { path: '/role-management', label: 'إدارة الصلاحيات', icon: UserCheck, roles: ['admin'], modes: ['enterprise'] },
        { path: '/audit-logs', label: 'سجل التدقيق', icon: ShieldAlert, roles: ['admin'], modes: ['enterprise'] },
        { path: '/system-backups', label: 'النسخ الاحتياطي', icon: DatabaseBackup, roles: ['admin'], modes: ['enterprise'] },
        { path: '/admin/risk-compliance', label: 'المخاطر والامتثال', icon: ShieldAlert, roles: ['admin'], modes: ['enterprise'] },
        { path: '/property-management', label: 'إدارة الممتلكات', icon: Building2, roles: ['admin'], modes: ['enterprise'] },
        { path: '/branches', label: 'إدارة الفروع', icon: Building, roles: ['admin'], modes: ['enterprise'] },
        { path: '/admin/pos-terminals', label: 'أجهزة نقاط البيع', icon: MonitorSmartphone, roles: ['admin'], modes: ['enterprise'] },
        { path: '/logbook', label: 'سجل العمليات', icon: Activity, roles: ['admin'], modes: ['enterprise'] }, 
        { path: '/settings', label: 'settings', icon: Settings, roles: ['admin'], modes: ['starter', 'standard', 'service', 'enterprise'] },
        { path: '/about', label: 'about', icon: Info, roles: ['admin', 'cashier', 'warehouse'], modes: ['starter', 'standard', 'service', 'enterprise'] },
      ]
    },
  ];

  const filteredNavItems = useMemo(() => {
    const role = user.role || 'cashier';
    const permissions = user.permissions || [];
    const isAdmin = role === 'admin' || permissions.includes('all');

    return allNavItems.map(section => ({
      ...section,
      items: section.items.filter(item => {
          // Role/Permission Check
          const hasPermission = isAdmin || permissions.includes(item.path) || permissions.includes('/');
          // Business Type Check
          const typeMatch = !(item as any).businessTypes || (item as any).businessTypes.includes(businessType);
          // Module Enabled Check
          const conditionCheck = (item as any).condition === undefined || (item as any).condition === true;
          // Mode Check
          const modeCheck = item.modes.includes(currentMode);
          // Hidden Pages Check
          const isHidden = settings?.hiddenPages?.includes(item.path) || false;
          
          return hasPermission && typeMatch && conditionCheck && modeCheck && !isHidden;
      })
    })).filter(section => section.items.length > 0);
  }, [user.role, user.permissions, allNavItems, businessType, accountingEnabled, currentMode, settings?.hiddenPages]);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setIsBackingUp(true);
    
    // Auto Backup Logic
    if (settings?.autoBackupOnClose) {
        try {
            showToast('جاري النسخ الاحتياطي...', 'info');
            const result = await performBackupToDirectory();
            if (result) success('تم النسخ الاحتياطي بنجاح');
            else error('تعذر الوصول لمجلد النسخ. تحقق من الإعدادات.');
        } catch (e) {
            console.error("Backup failed", e);
        }
    }
    
    localStorage.removeItem('nima_user');
    setIsBackingUp(false);
    setShowLogoutConfirm(false);
    
    if (onLogout) {
        onLogout();
    } else {
        window.location.reload();
    }
  };

  // Date Formatter
  const currentDate = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
  }).format(new Date());

  // Get Mode Badge Info
  const getModeBadge = () => {
      switch(currentMode) {
          case 'starter': return { label: 'Basic', color: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30 shadow-[0_0_8px_#34d399]', icon: Zap };
          case 'standard': return { label: 'Standard', color: 'bg-blue-500/20 text-blue-200 border-blue-500/30 shadow-[0_0_8px_#60a5fa]', icon: Store };
          case 'service': return { label: 'Service', color: 'bg-orange-500/20 text-orange-200 border-orange-500/30 shadow-[0_0_8px_#fb923c]', icon: Video };
          case 'enterprise': return { label: 'Enterprise', color: 'bg-purple-500/20 text-purple-200 border-purple-500/30 shadow-[0_0_8px_#a855f7]', icon: Building2 };
          default: return { label: 'Pro', color: 'bg-indigo-500/20 text-indigo-200', icon: Gem };
      }
  };

  const modeInfo = getModeBadge();
  const ModeIcon = modeInfo.icon;

  const totalPages = filteredNavItems.reduce((acc, group) => acc + group.items.length, 0);

  return (
    <div className="flex h-screen bg-[#f3f4f6] dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden font-['Tajawal'] transition-colors duration-300" dir={dir} id="main-app-container">
      
      {/* Logout/Exit Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <Power className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">خروج آمن</h3>
              <p className="text-slate-500 mb-6">
                  {settings?.autoBackupOnClose 
                    ? 'سيتم إجراء نسخ احتياطي تلقائي للبيانات قبل الخروج.' 
                    : 'هل أنت متأكد من رغبتك في تسجيل الخروج؟'
                  }
              </p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  disabled={isBackingUp}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  onClick={confirmLogout}
                  disabled={isBackingUp}
                  className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  {isBackingUp ? (
                      <>جاري الحفظ...</>
                  ) : (
                      <>خروج وحفظ</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-[280px] bg-dark-950 text-white flex flex-col z-30 shadow-2xl relative">
        {/* Decorative Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-brand-600/20 rounded-full blur-[80px]"></div>
            <div className="absolute bottom-[-50px] right-[-50px] w-[200px] h-[200px] bg-purple-600/10 rounded-full blur-[60px]"></div>
        </div>

        {/* Brand Area */}
        <div className="h-24 flex items-center px-6 relative z-10 border-b border-white/5">
          <div className="flex items-center gap-4">
            {settings?.logo ? (
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-glow overflow-hidden p-1">
                    <img src={settings.logo} alt="Logo" className="w-full h-full object-contain" />
                </div>
            ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-glow border border-white/10">
                   <Store className="w-6 h-6 text-white" />
                </div>
            )}
            <div>
                <h1 className="font-extrabold text-xl tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 truncate max-w-[140px]" title={settings?.storeName}>
                    {settings?.storeName || 'Nima POS'}
                </h1>
                <div className="mt-1">
                     <div className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded border ${modeInfo.color}`}>
                        <ModeIcon className="w-3 h-3" />
                        <p className="text-[9px] uppercase tracking-wide font-bold">{modeInfo.label}</p>
                     </div>
                </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-700 relative z-10">
          {filteredNavItems.map((group, idx) => {
            const groupLabel = group.label || group.section;
            const isCollapsed = collapsedGroups[groupLabel];
            return (
            <div key={idx} className="mb-2">
                <button 
                    onClick={() => toggleGroup(groupLabel)}
                    className="w-full px-3 py-2 text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest flex items-center justify-between transition-colors rounded-lg hover:bg-white/5"
                >
                    <span className="flex items-center gap-2">
                        {group.label ? group.label : (
                            <>
                                {group.section === 'main' && (lang === 'en' ? 'Main' : 'الرئيسية')}
                                {group.section === 'sales' && (lang === 'en' ? 'Sales' : 'المبيعات')}
                                {group.section === 'inventory' && (lang === 'en' ? 'Inventory' : 'المخزون')}
                                {group.section === 'finance' && (lang === 'en' ? 'Finance' : 'المالية')}
                                {group.section === 'admin' && (lang === 'en' ? 'System' : 'النظام')}
                            </>
                        )}
                    </span>
                    {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                
                <div className={`space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100 mt-1'}`}>
                    {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden ${
                                isActive
                                ? 'bg-white/10 text-white shadow-lg backdrop-blur-sm border border-white/10'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                            }`
                            }
                        >
                            {isActive && <div className={`absolute top-0 bottom-0 w-1 bg-brand-500 rounded-l-xl ${dir === 'rtl' ? 'left-0' : 'right-0'}`}></div>}
                            <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-brand-300' : 'text-slate-500 group-hover:text-white'}`} />
                            <span className="relative z-10">{t(item.label as any, lang) || item.label}</span>
                            {isActive && <Sparkles className={`w-3 h-3 text-brand-400 absolute opacity-50 ${dir === 'rtl' ? 'right-3' : 'left-3'}`} />}
                        </NavLink>
                        );
                    })}
                </div>
            </div>
          )})}
          
        </nav>

        {/* User Profile */}
        <div className="p-4 relative z-10 border-t border-white/5 bg-black/20 backdrop-blur-md">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-slate-200 font-bold border border-white/10 shadow-inner">
                        {user.name ? user.name[0] : 'U'}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{user.name || 'المستخدم'}</p>
                        <p className="text-sm text-slate-400 truncate capitalize">
                            {user.role === 'admin' ? 'مدير' : user.role === 'warehouse' ? 'مخزن' : 'كاشير'}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={handleLogoutClick}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                    title={t('logout', lang)}
                >
                    <Power className="w-5 h-5" />
                </button>
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-[#f3f4f6] dark:bg-slate-900 transition-colors duration-300">
        {/* Minimal Header */}
        <header className="h-16 px-8 flex items-center justify-between z-20 shrink-0">
            <div className="flex items-center gap-2 text-slate-400">
               <span className="text-sm font-bold text-slate-500 bg-white/50 px-3 py-1 rounded-full border border-white flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {currentDate}
               </span>
               <span className="text-xs font-bold text-slate-500 bg-white/50 px-3 py-1 rounded-full border border-white flex items-center gap-1" title="عدد الصفحات المتاحة">
                <Layers className="w-4 h-4" />
                {totalPages}
               </span>
            </div>

            <div className="flex items-center gap-4 relative">
                {/* Theme Toggle */}
                <button 
                    onClick={toggleTheme}
                    className="w-10 h-10 rounded-full shadow-sm border flex items-center justify-center transition-all bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-brand-600 hover:border-brand-200 hover:shadow-md"
                    title={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
                >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* Notification Bell */}
                <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`w-10 h-10 rounded-full shadow-sm border flex items-center justify-center transition-all relative group ${showNotifications ? 'bg-brand-50 border-brand-200 text-brand-600' : 'bg-white border-slate-200 text-slate-500 hover:text-brand-600 hover:border-brand-200 hover:shadow-md'}`}
                >
                    <Bell className={`w-5 h-5 ${showNotifications ? '' : 'group-hover:rotate-12 transition-transform'}`} />
                    {notifications.length > 0 && (
                        <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
                    )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                        <div className={`absolute top-14 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${dir === 'rtl' ? 'left-0' : 'right-0'}`}>
                            <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                <h3 className="font-bold text-gray-800">التنبيهات</h3>
                                <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${notifications.length > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-500'}`}>
                                    {notifications.length} جديد
                                </span>
                            </div>
                            <div className="max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                                {notifications.length === 0 ? (
                                    <div className="p-10 text-center flex flex-col items-center text-slate-400">
                                        <Bell className="w-8 h-8 mb-2 opacity-20" />
                                        <p className="text-sm font-medium">لا توجد تنبيهات جديدة</p>
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n.id} className="p-4 border-b border-gray-50 hover:bg-slate-50/80 transition-colors flex items-start gap-3 last:border-0">
                                            <div className={`p-2.5 rounded-full shrink-0 ${n.type === 'stock' ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'}`}>
                                                {n.type === 'stock' ? <AlertTriangle size={16} /> : <Calendar size={16} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <p className="text-sm font-bold text-slate-800">{n.title}</p>
                                                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{n.time}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 leading-relaxed">{n.message}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            {notifications.length > 0 && (
                                <div className="p-2 bg-gray-50 border-t border-gray-100 text-center">
                                    <button onClick={() => setShowNotifications(false)} className="text-xs font-bold text-brand-600 hover:text-brand-700 py-1">
                                        إغلاق
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </header>

        {/* Content Viewport */}
        <div className={`flex-1 overflow-hidden relative bg-white shadow-[inset_0_4px_20px_rgba(0,0,0,0.02)] border-t border-slate-200/50 
            ${dir === 'rtl' ? 'rounded-tl-3xl border-l mr-4 md:mr-0 md:ml-0' : 'rounded-tr-3xl border-r ml-4 md:ml-0 md:mr-0'}`}>
             <div className="absolute inset-0 overflow-y-auto scroll-smooth">
                <Outlet />
             </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
