import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Contract, B2BInvoice, Account } from '../../types';
import { AccountingEngine } from '../../services/AccountingEngine';
import { notificationService } from '../../utils/notifications';
import {
  FileText,
  Briefcase,
  Users,
  Layers,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Undo2,
  Plus,
  Search,
  Check,
  Percent,
  TrendingUp,
  CreditCard,
  DollarSign,
  Monitor,
  HeartPulse,
  Award,
  BookOpen,
  MapPin,
  CalendarDays,
  Wrench,
  RefreshCw,
  Printer,
  ChevronDown,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

// Extend the existing Contract interface for our local B2B Retainer view
interface B2BRetainerContract extends Contract {
  companyPhone: string;
  companyAddress: string;
  devicesCount: number;
  allowedVisitsPerMonth: number;
  visitsUsedThisMonth: number;
  subscriptionValue: number;
  billingCycle: 'monthly' | 'yearly';
  nextVisitDate: string; // YYYY-MM-DD format
  lastVisitDate?: string; // YYYY-MM-DD
  serviceNotes?: string;
  autoInvoiceGeneratedForCurrentPeriod?: boolean;
}

// 1. Core Rule Constraint: 100% Ukrainian Christian Names Only for corporate personas
const PRESET_B2B_PARTIES = [
  { name: 'شركة بوهدان الرقمية للألعاب (Bohdan Cyber)', phone: '0443015555', address: 'شارع أولغا كوليبا، الطابق الأول' },
  { name: 'مدرسة سفيتلانا الأكاديمية المتقدمة (Svitlana School)', phone: '0449988221', address: 'ميدان تاراس شفتشينكو، مبنى 5' },
  { name: 'عيادة دوبيروف الطبية لتقويم العظام (Doberov Osteo)', phone: '0445554433', address: 'شارع رومان شوخيفيتش، مجمع العيادات' },
  { name: 'مؤسسة ياروسلاف القانونية للاستشارات (Yaroslav Law)', phone: '0447711223', address: 'شارع ميكولا كوزمينكو، مبنى 12 ب' },
  { name: 'سايبر نت أندري للألعاب الإلكترونية (Andriy Cyber)', phone: '0448182838', address: 'شارع كاترينا بيلوكور، الدور الأرضي' }
];

const ComputerMobileB2BContracts: React.FC = () => {
  // Live Queries on DB
  const contractsFromDb = useLiveQuery(() => db.contracts.toArray()) || [];
  const b2bInvoices = useLiveQuery(() => db.b2bInvoices.toArray()) || [];
  const activeShift = useLiveQuery(() => db.shifts.where('status').equals('open').first());
  const accounts = useLiveQuery(() => db.accounts.toArray()) || [];
  const maintenanceOrders = useLiveQuery(() => db.maintenanceOrders.toArray()) || [];

  // Filter our B2B contracts (by title prefix or type constraints)
  const b2bContracts: B2BRetainerContract[] = (contractsFromDb.filter(
    c => c.type === 'customer' && (c as any).devicesCount !== undefined
  ) as any[]);

  // Page level states
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState<number | null>(null);
  const [expandedContractId, setExpandedContractId] = useState<number | null>(null);

  // Form states for Quick-Add
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [customTitle, setCustomTitle] = useState('عقد صيانة لابتوبات وشبكة');
  const [customCompanyName, setCustomCompanyName] = useState(PRESET_B2B_PARTIES[0].name);
  const [companyPhone, setCompanyPhone] = useState(PRESET_B2B_PARTIES[0].phone);
  const [companyAddress, setCompanyAddress] = useState(PRESET_B2B_PARTIES[0].address);
  const [devicesCount, setDevicesCount] = useState<number>(15);
  const [allowedVisitsPerMonth, setAllowedVisitsPerMonth] = useState<number>(4);
  const [subscriptionValue, setSubscriptionValue] = useState<number>(3500);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [serviceNotes, setServiceNotes] = useState('تنظيف غبار الأجهزة، تحديث برامج مضاد الفيروسات، تحديث برمجيات كود تيك POS الدورية وجدولة النسخ الاحتياطي.');
  const [nextVisitDate, setNextVisitDate] = useState<string>(() => {
    // Default next visit: Tomorrow
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    return tmrw.toISOString().split('T')[0];
  });

  // Today Date for alerting engine
  const todayStr = new Date().toISOString().split('T')[0];

  // Sync preset selection helper
  const handlePresetChange = (idx: number) => {
    setSelectedPresetIndex(idx);
    const preset = PRESET_B2B_PARTIES[idx];
    setCustomCompanyName(preset.name);
    setCompanyPhone(preset.phone);
    setCompanyAddress(preset.address);
    if (idx === 0) {
      setCustomTitle('صيانة ومتابعة أجهزة الكمبيوتر لسايبر بوهدان');
      setDevicesCount(25);
      setSubscriptionValue(5000);
    } else if (idx === 1) {
      setCustomTitle('تأمين كمبيوترات معامل طلاب مدرسة سفيتلانا');
      setDevicesCount(40);
      setSubscriptionValue(8000);
    } else if (idx === 2) {
      setCustomTitle('صيانة عقود أنظمة عيادة دوبيروف');
      setDevicesCount(10);
      setSubscriptionValue(3000);
    } else if (idx === 3) {
      setCustomTitle('إدارة البنية التحتية لمكاتب ياروسلاف القانونية');
      setDevicesCount(12);
      setSubscriptionValue(4000);
    } else {
      setCustomTitle('تحديث دوري لـ سايبر نت أندري');
      setDevicesCount(15);
      setSubscriptionValue(4500);
    }
  };

  // Add B2B Contract
  const handleCreateB2BContract = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customCompanyName.trim()) {
      toast.error('أدخل اسم الشركة المتعاقدة');
      return;
    }

    try {
      const startDate = new Date();
      const expirationDate = new Date();
      if (billingCycle === 'monthly') {
        expirationDate.setMonth(startDate.getMonth() + 12); // 1 Year contract
      } else {
        expirationDate.setFullYear(startDate.getFullYear() + 2); // 2 Years contract
      }

      const newContractObj: B2BRetainerContract = {
        title: customTitle,
        type: 'customer',
        partyName: customCompanyName,
        partyId: Math.floor(Math.random() * 900) + 100, // Simulated corporate party identifier
        startDate,
        endDate: expirationDate,
        status: 'active',
        value: subscriptionValue,
        companyPhone,
        companyAddress,
        devicesCount,
        allowedVisitsPerMonth,
        visitsUsedThisMonth: 0,
        subscriptionValue,
        billingCycle,
        nextVisitDate,
        serviceNotes,
        autoInvoiceGeneratedForCurrentPeriod: false
      };

      await db.contracts.add(newContractObj as any);
      toast.success(`🎉 تم تسجيل العقد الوقائي وجدول التنبيه لشركة [${customCompanyName}] بنجاح!`);
      setShowAddModal(false);

      // Instantly check for automatic invoicing for this contract on creation!
      await checkAndGenerateAutoInvoice({
        ...newContractObj,
        id: contractsFromDb.length + 1 // mock ID temporarily if needed, next live query will get actual
      });

    } catch (err: any) {
      toast.error('أخفق في تعيين العقد: ' + err.message);
    }
  };

  // Automated Invoicing & accounting double entry executor
  const checkAndGenerateAutoInvoice = async (contract: any) => {
    try {
      if (!contract.id) return;

      // 1. Check if an invoice was already generated for this contract for current month to avoid duplicate hits
      const currentMonthYear = new Date().toISOString().substring(0, 7); // "YYYY-MM"
      const alreadyHasInvoice = b2bInvoices.some(
        inv => inv.customerId === contract.partyId && 
               inv.notes?.includes(contract.title) &&
               inv.createdAt.toISOString().startsWith(currentMonthYear)
      );

      if (alreadyHasInvoice) {
        return;
      }

      // 2. Generate B2B Invoice
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 15); // Net 15 Payment Terms

      const invoiceRef = `B2B-PCM-${contract.id}-${Math.floor(Math.random() * 899) + 100}`;
      const newInvoice: B2BInvoice = {
        referenceNumber: invoiceRef,
        customerId: contract.partyId,
        totalAmount: contract.subscriptionValue,
        paidAmount: 0,
        dueDate,
        status: 'unpaid',
        items: [
          {
            description: `قيمة الاشتراك الدوري ومتابعة الدعم والزيارات الوقائية لـ (${contract.devicesCount} جهاز) - للباقة ${contract.billingCycle === 'monthly' ? 'الشهرية' : 'السنوية'}`,
            quantity: 1,
            unitPrice: contract.subscriptionValue,
            total: contract.subscriptionValue
          }
        ],
        notes: `مطالبة مالية تلقائية مبنية على العقد الوقائي: ${contract.title}`,
        createdAt: new Date()
      };

      const invId = await db.b2bInvoices.add(newInvoice);

      // 3. Mark the contract as invoiced for this period
      const origContract = await db.contracts.get(contract.id);
      if (origContract) {
        (origContract as any).autoInvoiceGeneratedForCurrentPeriod = true;
        await db.contracts.put(origContract);
      }

      // 4. Double-Entry Accounting Ledger Post!
      // Accounts Receivable (1030) - DEBIT
      // Software/Service Sales Revenue (4010) - CREDIT
      const accountsRec = accounts.find(a => a.code === '1030') || await db.accounts.where('code').equals('1030').first();
      const revenueAcc = accounts.find(a => a.code === '4010') || await db.accounts.where('code').equals('4010').first();

      if (accountsRec && revenueAcc) {
        await AccountingEngine.postEntry({
          date: new Date(),
          reference: invoiceRef,
          description: `إثبات وتوليد مطالبة مالية لعقد الصيانة الوقائية السنوية/الشهرية لـ [${contract.partyName}]`,
          lines: [
            {
              accountId: accountsRec.id!,
              accountName: accountsRec.name,
              debit: contract.subscriptionValue,
              credit: 0,
              description: `استحقاق محاسبي على العميل المتعاقد ${contract.partyName} - مطالبة #${invoiceRef}`
            },
            {
              accountId: revenueAcc.id!,
              accountName: revenueAcc.name,
              debit: 0,
              credit: contract.subscriptionValue,
              description: `إثبات إيرادات عقود الصيانة الدورية للأجهزة والشبكات`
            }
          ]
        });
      }

      // 5. Fire Global Smart Push alert & Offline Sounds
      await notificationService.addNotification(
         `توليد فاتورة مطالبة مالية 🪙`,
         `تم إصدار مطالبة الاشتراك المالي آلياً لشركة "${contract.partyName}" بقيمة ${contract.subscriptionValue} ج.م بدفتر اليومية.`,
         'success'
      );

      toast.success(`📊 توليد محاسبي تلقائي: تم إصدار الفاتورة وتمرير قيد اليومية بقيمة ${contract.subscriptionValue.toLocaleString()} ج.م`);

    } catch (err: any) {
      console.error('Error generating auto contract invoice:', err);
    }
  };

  // Manual Trigger Force Invoice Delivery Action
  const forceInvoiceGeneration = async (id: number) => {
    const contract = b2bContracts.find(c => c.id === id);
    if (!contract) return;
    await checkAndGenerateAutoInvoice(contract);
  };

  // Perform preventive maintenance visit operation
  const handlePerformMaintenanceVisit = async (id: number) => {
    try {
      const contract = await db.contracts.get(id);
      if (!contract) return;

      const currentVisits = (contract as any).visitsUsedThisMonth || 0;
      const allowedVisits = (contract as any).allowedVisitsPerMonth || 1;

      if (currentVisits >= allowedVisits) {
        toast.error('احترس: تم استهلاك كامل الزيارات الوقائية المجانية لـهذا العقد للشهر الحالي!');
      }

      // Track last visit date to today
      (contract as any).visitsUsedThisMonth = currentVisits + 1;
      (contract as any).lastVisitDate = todayStr;

      // Schedule next visit automatically after 30 days (or next month)
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 30);
      (contract as any).nextVisitDate = nextDate.toISOString().split('T')[0];

      await db.contracts.put(contract);

      // Save a log notification
      await notificationService.addNotification(
        'إنجاز زيارة صيانة وقائية 🛠️',
        `تم الانتهاء من فحص وتأمين أجهزة [${contract.partyName}] بنجاح. وسُجلت الزيارة رقم ${(currentVisits + 1)} بالملف.`,
        'info'
      );

      toast.success('تمت جدولة وتأكيد إكمال الزيارة الوقائية وإثباتها بالملف التاريخي!');

    } catch (err: any) {
      toast.error('أخفق حفظ الزيارة: ' + err.message);
    }
  };

  // Handle linking an incoming work order/maintenance ticket to active retainer visits
  const handleLinkTicketToContract = async (contractId: number, orderId: number) => {
    try {
      const contract = await db.contracts.get(contractId);
      const order = await db.maintenanceOrders.get(orderId);
      if (!contract || !order) {
        toast.error('أخفق ربط البطاقة؛ لم يتم العثور على العقد أو بطاقة الصيانة.');
        return;
      }

      const currentVisits = (contract as any).visitsUsedThisMonth || 0;
      const allowedVisits = (contract as any).allowedVisitsPerMonth || 1;

      // Update maintenance order to be associated with this contract
      (order as any).linkedContractId = contractId;
      await db.maintenanceOrders.put(order);

      // Increment used visits
      (contract as any).visitsUsedThisMonth = currentVisits + 1;
      (contract as any).lastVisitDate = todayStr;
      await db.contracts.put(contract);

      // Save a log notification
      await notificationService.addNotification(
        'ربط بطاقة عمل بعقد الشركات 🔀',
        `تم ربط بطاقة اللاب/الكمبيوتر الخاص بالشركة [${contract.partyName}] (رقم #${orderId}) آلياً بالزيارات الوقائية لتخفيض الرسوم.`,
        'success'
      );

      toast.success(`تم بنجاح ربط كارت الصيانة #${orderId}، وخفض عدد الزيارات المتاحة! 🛠️✅`);
    } catch (err: any) {
      toast.error('خطأ أثناء عملية الربط والخصم: ' + err.message);
    }
  };

  // Handle Pay B2B Invoice from corporate client (Receiving cash)
  const handleReceiveInvoicePayment = async (invId: number) => {
    try {
      const invoice = await db.b2bInvoices.get(invId);
      if (!invoice) return;

      if (invoice.status === 'paid') {
        toast.error('الفاتورة مدفوعة ومسددة بالكامل مسبقاً');
        return;
      }

      // Update invoice as paid
      const netAmount = invoice.totalAmount - (invoice.paidAmount || 0);
      invoice.paidAmount = invoice.totalAmount;
      invoice.status = 'paid';
      
      await db.b2bInvoices.put(invoice);

      // Core: Adjust Active shift Expected cash!
      if (activeShift?.id) {
        await db.shifts.update(activeShift.id, {
          expectedCash: (activeShift.expectedCash || 0) + netAmount,
          cashSales: (activeShift.cashSales || 0) + netAmount
        });
      }

      // Double Entry Account Post:
      // Cash (1010) - DEBIT
      // Accounts Receivable (1030) - CREDIT
      const cashAcc = accounts.find(a => a.code === '1010') || await db.accounts.where('code').equals('1010').first();
      const accountsRec = accounts.find(a => a.code === '1030') || await db.accounts.where('code').equals('1030').first();

      if (cashAcc && accountsRec) {
        await AccountingEngine.postEntry({
          date: new Date(),
          reference: invoice.referenceNumber || `B2BPAY-REF-${invoice.id}`,
          description: `سداد مطالبة صيانة وتوريد كاش من حساب العميل ذو الفاتورة #${invoice.referenceNumber}`,
          lines: [
            {
              accountId: cashAcc.id!,
              accountName: cashAcc.name,
              debit: netAmount,
              credit: 0,
              description: `استلام كاش لخزانة الكاشير لتصفية مستحقات B2B`
            },
            {
              accountId: accountsRec.id!,
              accountName: accountsRec.name,
              debit: 0,
              credit: netAmount,
              description: `تسوية حساب الذمم لشركة العقد والاشتراكات`
            }
          ]
        });
      }

      await notificationService.addNotification(
        'تسديد مستحقات B2B 💰',
        `تم استلام مالي بقيمة ${netAmount} ج.م نقداً من العميل وتصفير الفاتورة #${invoice.referenceNumber}.`,
        'success'
      );

      toast.success(`💯 تم استلام الدفع نقداً بقيمة ${netAmount.toLocaleString()} ج.م وتسويتها محاسبياً مع الخزينة والمبيعات!`);

    } catch (err: any) {
      toast.error('فشل سداد المطالبة: ' + err.message);
    }
  };

  // Helper calculation
  const totalB2BExpectedRevenue = b2bContracts.reduce((acc, c) => acc + (c.subscriptionValue || 0), 0);
  const collectedB2BThisMonth = b2bInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
  const outstandingB2PAmount = b2bInvoices
    .filter(inv => inv.status !== 'paid')
    .reduce((acc, inv) => acc + (inv.totalAmount - inv.paidAmount), 0);

  // Active visit alerts today
  const pendingVisitsToday = b2bContracts.filter(c => c.nextVisitDate === todayStr);

  // Filtered lists
  const filteredContracts = b2bContracts.filter(c => 
    c.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 select-none max-w-[1600px] mx-auto space-y-8 min-h-screen text-slate-800 relative font-sans text-right" dir="rtl" id="b2b-contracts-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=Cairo:wght@300;400;500;600;700;800;900&display=swap');
        #b2b-contracts-root {
          font-family: 'Tajawal', 'Cairo', sans-serif !important;
        }
      `}</style>
      <Toaster position="top-left" reverseOrder={true} />

      {/* Main Corporate Header Section */}
      <div className="bg-white p-8 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border border-slate-100 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 w-36 h-36 bg-indigo-50/40 rounded-full blur-2xl transform -translate-x-12 -translate-y-12"></div>
        <div className="space-y-2 relative z-10">
          <span className="px-3 py-1 text-[10px] font-black tracking-tight text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full inline-flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5" />
            أنظمة الصيانة الوقائية السنوية والتعاقدات (B2B Retainer Base)
          </span>
          <h1 className="text-2xl font-black text-slate-900">إدارة باقات اشتراكات وعقود الشركات والمؤسسات 🏢</h1>
          <p className="text-xs text-slate-500 font-medium">
            جدولة عقود الصيانة الدورية، رصد الأجهزة المشمولة، إرسال تذكيرات الصيانة الوقائية وتحديث الأنتي فاير، مع الأتمتة الكاملة للفواتير وتوليد قيود اليومية المحاسبية للشركات الصديقة.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 hover:scale-102 text-white font-black text-xs px-5 py-3 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Corporate Contract / إضافة عقد شراكة
        </button>
      </div>

      {/* Smart Alerts Box when visit date is today */}
      {pendingVisitsToday.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl space-y-3.5 shadow-3xs animate-pulse">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-amber-950">تنبيهات الزيارات الوقائية الفنية النشطة اليوم! 📅</h4>
              <p className="text-[11px] text-amber-800">تنبيه ذكي لمقر الإدارة: يلتزم فني الصيانة ذو الصلة بالمناديب والتحرك الميداني لفحص أجهزة ومكونات الشركاء التاليين:</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingVisitsToday.map(c => (
              <div key={c.id} className="bg-white p-3 rounded-xl border border-amber-200 flex justify-between items-center gap-3">
                <div className="space-y-1 text-right">
                  <span className="text-xs font-black text-slate-900">{c.partyName}</span>
                  <span className="text-[10px] text-slate-500 block">المطلوب: تنظيف الأجهزة وتحديث الأنتي فيرس لـ ({c.devicesCount}) جهاز.</span>
                </div>
                <button
                  type="button"
                  onClick={() => handlePerformMaintenanceVisit(c.id!)}
                  className="bg-amber-600 hover:bg-amber-700 hover:scale-102 text-white text-[10px] font-black px-3 py-1.5 rounded-lg transition-all shadow-3xs cursor-pointer"
                >
                  إجراء الزيارة الآن ✅
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Corporate Dashboard Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block">العقود النشطة القائمة</span>
            <span className="text-xl font-black text-slate-950">{b2bContracts.length} عقد للشركات</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block">الأجهزة المؤمنة المشمولة</span>
            <span className="text-xl font-black text-slate-950">
              {b2bContracts.reduce((acc, current) => acc + (current.devicesCount || 0), 0)} أجهزة بالباقة
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block">إيراد اشتراكات الشركاء السنوية متوقعاً</span>
            <span className="text-xl font-black text-emerald-700">{(totalB2BExpectedRevenue * 12).toLocaleString()} ج.م / سنوي</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block">الفواتير المستحقة بالخارج (unpaid)</span>
            <span className="text-xl font-black text-amber-700">{outstandingB2PAmount.toLocaleString()} ج.م للتحصيل</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Contracts List & Invoices Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* RIGHT BOARD: B2B Retainer Contracts List Table - 8 Cols */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/50 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                سجل وجداول عقود وعلاقات الـ B2B النشطة
              </h2>
              <p className="text-[11px] text-slate-500 mt-1">المراجعة الوقائية والتوجه لخدمة الفروع والأجهزة المتفق عليها</p>
            </div>
            
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="ابحث بالشركة، عنوان العقد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl pr-9 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5" />
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredContracts.length === 0 ? (
              <div className="p-16 text-center border border-dashed rounded-2xl text-slate-400">
                <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <span className="text-xs font-black text-slate-700 block">لم تسجل عقود شركات B2B نشطة بعد</span>
                <p className="text-[10px] text-slate-400 mt-1">اضغط على زر الإضافة من الأعلى للبدء بنماذج الشركات الأوكرانية لخدمة المحلات الكبرى.</p>
              </div>
            ) : (
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 font-extrabold">
                    <th className="p-3 text-right">الشركة المتعاقدة والخدمة</th>
                    <th className="p-3 text-center">عدد الأجهزة بالباقة</th>
                    <th className="p-3 text-center">الاشتراك المالي</th>
                    <th className="p-3 text-center">الزيارات الوقائية شهرياً</th>
                    <th className="p-3 text-center">الموعد القادم</th>
                    <th className="p-3 text-left">الإجراء الفني والفوترة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredContracts.map(c => {
                    const isToday = c.nextVisitDate === todayStr;
                    const isExpanded = expandedContractId === c.id;
                    const linkedOrders = maintenanceOrders.filter(o => (o as any).linkedContractId === c.id);
                    // Filter orders not linked to any contract
                    const unlinkedOrders = maintenanceOrders.filter(o => !(o as any).linkedContractId);

                    return (
                      <React.Fragment key={c.id}>
                        <tr className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3">
                            <div className="space-y-1">
                              <span className="font-extrabold text-slate-900 block">{c.partyName}</span>
                              <span className="text-[10px] text-indigo-700 font-bold block">{c.title}</span>
                              <span className="text-[10px] text-slate-400 block font-mono">📍 {c.companyAddress} | 📞 {c.companyPhone}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center font-black text-slate-800">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                              <Monitor className="w-3 h-3" />
                              {c.devicesCount} أجهزة
                            </div>
                          </td>
                          <td className="p-3 text-center font-extrabold text-indigo-700 font-mono">
                            {c.subscriptionValue.toLocaleString()} ج.م / {c.billingCycle === 'monthly' ? 'شهري' : 'سنوي'}
                          </td>
                          <td className="p-3 text-center font-bold">
                            <span className="text-emerald-700">{c.visitsUsedThisMonth} مستهلك</span>
                            <span className="text-slate-400"> / {c.allowedVisitsPerMonth} كلي </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-1 text-[10.5px] font-black rounded-lg ${
                              isToday ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {c.nextVisitDate} {isToday && '⚠️ اليوم!'}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex justify-end gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => setExpandedContractId(isExpanded ? null : c.id!)}
                                className="bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 text-[10px] font-black px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                                title="ربط ومطابقة الكروت والزيارات بالسيستم"
                              >
                                <span>كروت ({linkedOrders.length}) 🔗</span>
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePerformMaintenanceVisit(c.id!)}
                                className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                                title="تسجيل زيارة فنية وقائية ناجحة"
                              >
                                ⚙️ زيارة وقائية
                              </button>
                              <button
                                type="button"
                                onClick={() => forceInvoiceGeneration(c.id!)}
                                className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                                title="توليد مطالبة مالية فورية نقدا أو ذمة مالية"
                              >
                                🪙 مطالبة مالية
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-slate-50/80">
                            <td colSpan={6} className="p-4 border-t border-b border-indigo-100">
                              <div className="space-y-4 text-right">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-extrabold text-indigo-900 text-xs flex items-center gap-1.5">
                                    <Wrench className="w-4 h-4 text-indigo-600 animate-bounce" />
                                    مذكرات ربط ومطابقة الكروت (تكامل صيانة الـ B2B)
                                  </h4>
                                  <span className="text-[10px] text-slate-400">اربط كارت العميل الفعلي لخصمه آلياً من عدد الزيارات المتعاقد عليها</span>
                                </div>

                                {/* Link New Order Form */}
                                <div className="bg-white p-3.5 rounded-xl border border-indigo-100 flex flex-col sm:flex-row gap-3 items-end justify-between">
                                  <div className="w-full sm:w-2/3">
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">اختر كارت صيانة نشط لربطه بعقد ({c.partyName})</label>
                                    {unlinkedOrders.length === 0 ? (
                                      <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg font-bold">لا توجد كروت صيانة غير مرتبطة حالياً بالسيستم لتصفيتها.</p>
                                    ) : (
                                      <select
                                        id={`select-order-link-${c.id}`}
                                        className="w-full text-xs font-semibold p-2 bg-slate-50 border border-slate-200 rounded-lg"
                                      >
                                        <option value="">-- اختر كارت صيانة معلق بالورشة --</option>
                                        {unlinkedOrders.map(o => (
                                          <option key={o.id} value={o.id}>
                                            كارت #{o.id}: {o.customerName} | جهاز: {o.deviceModel} | العطل: {o.issueDescription} | السعر المتوقع: {o.expectedCost} ج.م
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const selectEl = document.getElementById(`select-order-link-${c.id}`) as HTMLSelectElement;
                                      if (selectEl && selectEl.value) {
                                        handleLinkTicketToContract(c.id!, parseInt(selectEl.value));
                                      } else {
                                        toast.error('من فضلك اختر كارت صيانة صحيح للربط.');
                                      }
                                    }}
                                    disabled={unlinkedOrders.length === 0}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
                                  >
                                    <span>ربط الكارت وخصم زيارة ⚡</span>
                                  </button>
                                </div>

                                {/* Already Linked Orders */}
                                <div className="space-y-2">
                                  <span className="text-[10px] text-slate-500 font-bold block">الكروت المرتبطة بهذا العقد حالياً:</span>
                                  {linkedOrders.length === 0 ? (
                                    <div className="p-4 text-center text-[10.5px] border border-dashed rounded-lg bg-white text-slate-400">
                                      لا توجد كروت صيانة تابعة تم فوترتها تحت مظلة العقد لهذا الموسم الجاري.
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {linkedOrders.map(o => (
                                        <div key={o.id} className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                                          <div>
                                            <span className="font-extrabold text-slate-800">كارت #{o.id} - العميل: {o.customerName}</span>
                                            <p className="text-[10px] text-slate-400 mt-1">جهاز: {o.deviceModel} ({o.notes || ''}) | الورشة</p>
                                          </div>
                                          <div className="text-left">
                                            <span className="text-[10px] text-emerald-700 px-2 py-0.5 bg-emerald-50 rounded-full font-bold">مشمول بالباقة 🎁</span>
                                            <p className="font-mono text-[9.5px] text-slate-400 mt-1">تم الربط بالزيارة</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* LEFT BOARD: Invoices & Receipts Monitor - 4 Cols */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/50 shadow-sm space-y-6">
          <div className="border-b pb-3">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              الفوترة والمطالبات وعقود التسوية
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">تتبع الفواتير الصادرة للشركات وتحصيل السيولة النقدية للخزينة</p>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {b2bInvoices.length === 0 ? (
              <div className="p-12 text-center border border-dashed rounded-xl text-slate-400">
                <FileText className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <span className="text-[11px] font-bold text-slate-600 block">لا ذمم مالية معلقة للشركات</span>
                <p className="text-[9.5px] text-slate-400 mt-0.5">ستصدر الفواتير وتسجل آلياً بمجرد تفعيل وبدء الزيارة.</p>
              </div>
            ) : (
              b2bInvoices.map(inv => {
                const relativeContract = b2bContracts.find(b => b.partyId === inv.customerId);
                return (
                  <div key={inv.id} className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl space-y-3 transition-colors hover:bg-white">
                    <div className="flex justify-between items-start gap-3">
                      <div className="space-y-1">
                        <span className="text-xs font-black text-slate-900 block">
                          {relativeContract?.partyName || `فاتورة #${inv.referenceNumber}`}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">رقم المرجع: {inv.referenceNumber}</span>
                        <span className="text-[10px] text-slate-500 block">موعد الاستحقاق: {new Date(inv.dueDate).toLocaleDateString()}</span>
                      </div>
                      <div>
                        {inv.status === 'paid' ? (
                          <span className="px-2 py-0.5 text-[9.5px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">مـدفـوعة 🤝</span>
                        ) : (
                          <span className="px-2 py-0.5 text-[9.5px] font-black bg-amber-50 text-amber-700 border border-amber-200 rounded-md">بالانتظار ⏳</span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-slate-100 p-2 rounded-lg font-sans">
                      <span className="text-[9.5px] text-slate-400 font-bold">مجموع المطالبة الباقي:</span>
                      <span className="text-xs font-black text-indigo-700">{(inv.totalAmount - (inv.paidAmount || 0)).toLocaleString()} ج.م</span>
                    </div>

                    {inv.status !== 'paid' && (
                      <button
                        type="button"
                        onClick={() => handleReceiveInvoicePayment(inv.id!)}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] py-1.5 rounded-lg transition-all shadow-3xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <DollarSign className="w-3 h-3 text-emerald-400" />
                        سداد نقدي نقداً للخزينة 💵
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* QUICK ADD COOP CONTRACT DIALOG / MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-fade-in relative text-right">
            
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                تسجيل عقد صيانة وقائية B2B للشركات
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-lg"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateB2BContract} className="space-y-4">
              {/* Preset selectors to simplify demo with clean Ukrainian default names */}
              <div className="space-y-1.5 bg-indigo-50/40 p-3 rounded-xl border border-indigo-200/50">
                <label className="text-[11px] font-black text-indigo-950 block">🚀 اختر قالب جاهز للشركة (أسماء مسيحية أوكرانية فقط):</label>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_B2B_PARTIES.map((p, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handlePresetChange(index)}
                      className={`p-2 text-[10.5px] text-right font-bold rounded-lg border transition-all truncate block ${
                        selectedPresetIndex === index
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {p.name.split(' (')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold block">موضوع وتوصيف العقد الرئيسي:</span>
                <input
                  type="text"
                  required
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="عقد صيانة شبكة وسيرفر الفرع..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block">اسم العميل المتسلّم/المؤسسة:</span>
                  <input
                    type="text"
                    required
                    value={customCompanyName}
                    onChange={(e) => setCustomCompanyName(e.target.value)}
                    placeholder="مدرسة تاراس الأوكرانية..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block">رقم هاتف المنشأة:</span>
                  <input
                    type="text"
                    required
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    placeholder="رقم الهاتف للتواصل..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-lg text-xs font-mono focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold block">عنوان مقر الشركة والتوريد:</span>
                <input
                  type="text"
                  required
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="الشارع ورقم البناية الجغرافي..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block">الأجهزة المؤمنة:</span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={devicesCount}
                    onChange={(e) => setDevicesCount(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-lg text-xs text-center font-bold text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block">الزيارات شهرياً:</span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={allowedVisitsPerMonth}
                    onChange={(e) => setAllowedVisitsPerMonth(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-lg text-xs text-center font-bold text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block">الاشتراك (ج.م):</span>
                  <input
                    type="number"
                    min="100"
                    required
                    value={subscriptionValue}
                    onChange={(e) => setSubscriptionValue(Math.max(100, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-lg text-xs text-center font-black text-indigo-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold block">دورة سداد الفواتير:</label>
                  <select
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-lg text-xs font-bold"
                  >
                    <option value="monthly">باقة صيانة واشتراك شهري</option>
                    <option value="yearly">باقة صيانة واشتراك سنوي عريض</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold block">موعد أول زيارة وقائية لجدولها:</label>
                  <input
                    type="date"
                    required
                    value={nextVisitDate}
                    onChange={(e) => setNextVisitDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-lg text-xs font-bold text-center"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold block">توصيات الصيانة الوقائية الإنسانية:</span>
                <textarea
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-lg text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                تنشيط العقد وإصدار قيد الميزانية الفوري 🏢
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default ComputerMobileB2BContracts;
