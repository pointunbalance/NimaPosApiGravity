import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { MaintenanceOrder, MaintenanceStatus } from '../../types';
import { 
  Monitor, Smartphone, Laptop, Tablet, Wrench, Search, AlertCircle, CheckCircle2, 
  Clock, X, Edit, Trash2, Printer, Plus, Cpu, HardDrive, Database, ShieldAlert, 
  Lock, DollarSign, UserCog, ClipboardList, Info, FileText, HelpCircle, Eye, RefreshCw,
  TrendingUp, BarChart3, Coins, Users, Award, Percent, Layers, Inbox, Scale, CheckCircle, Play, Droplets
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

const statusMap: Record<MaintenanceStatus, { label: string; color: string; bg: string; icon: any }> = {
  received: { label: 'تم الاستلام والدخول للورشة', color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200', icon: Clock },
  diagnosing: { label: 'جاري الفحص الفني والتشخيص', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', icon: Search },
  waiting_parts: { label: 'في انتظار وفرة قطع الغيار', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: AlertCircle },
  repairing: { label: 'على طاولة صيانة المهندسين', color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200', icon: Wrench },
  ready: { label: 'جاهز للاختبار والتسليم', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  delivered: { label: 'تم التسليم وتصفية الحساب', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', icon: CheckCircle2 },
  cancelled: { label: 'ملغي مرتجع بدون صيانة', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200', icon: X },
  waiting_approval: { label: 'بانتظار موافقة العميل والتسعير', color: 'text-rose-500', bg: 'bg-rose-50 border-rose-150', icon: HelpCircle },
  abandoned: { label: 'مهجور/تالف لم يستلم', color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', icon: Trash2 },
};

const ComputerMobileTechnicians: React.FC = () => {
  // Live queries from local database
  const orders = useLiveQuery(() => db.maintenanceOrders.toArray()) || [];
  const products = useLiveQuery(() => db.products.toArray()) || [];

  // Technician Workspace State variables
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<MaintenanceStatus>('diagnosing');
  const [techReport, setTechReport] = useState('');
  const [partSearch, setPartSearch] = useState('');
  const [selectedTechnicianFilter, setSelectedTechnicianFilter] = useState<string>('all');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [customMessageText, setCustomMessageText] = useState('');
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [queueTab, setQueueTab] = useState<'repairing' | 'all'>('repairing');
  const [customPartName, setCustomPartName] = useState('');
  const [customPartPrice, setCustomPartPrice] = useState('');

  // Sync state with selected order
  const activeOrder = orders.find(o => o.id === selectedOrderId) || null;

  useEffect(() => {
    if (activeOrder) {
      setSelectedStatus(activeOrder.status);
      setTechReport(activeOrder.notes || '');
      
      const cost = activeOrder.actualCost || activeOrder.expectedCost || 0;
      setCustomMessageText(`المحترم/المحترمة ${activeOrder.customerName}، يسعدنا إعلامك بأن جهازك ${activeOrder.deviceBrand || ''} ${activeOrder.deviceModel} قد تم صيانة العطل فيه بنجاح بورشة الصيانة الرقمية وهو جاهز للتسليم الآن. التكلفة النهائية المقررة: ${cost.toLocaleString()} ج.م. نسعد بخدمتكم وبانتظار زيارتكم الكريمة!`);
    } else {
      setTechReport('');
      setCustomMessageText('');
    }
  }, [selectedOrderId, activeOrder?.id]);

  // Pre-load mock technicians for visual richness if users lists are blank
  const defaultTechnicians = [
    { name: 'المهندس ميكولا كوفال', specialty: 'صيانة مايكرو بورد وشورت الشحن', phone: '01023940422', tasks: 12, completed: 85, active: true },
    { name: 'المهندس أندري ليسينكو', specialty: 'سوفت وير ورفع حمايات الآي كلاود', phone: '01123495811', tasks: 5, completed: 110, active: true },
    { name: 'المهندس رومان بيليبيينكو', specialty: 'تغيير باغات وشاشات ليزر', phone: '01293848122', tasks: 9, completed: 64, active: true },
    { name: 'البشمهندس تاراس شفتشينكو', specialty: 'ترقية لابتوب وهارد صيانة الـ PC', phone: '01502934812', tasks: 3, completed: 42, active: true }
  ];

  const renderTechAvatar = (techIdx: number) => {
    if (techIdx === 0) {
      return (
        <svg className="w-full h-full object-cover" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="50" fill="#f1f5f9" />
          <circle cx="50" cy="46" r="22" fill="#ffdbb5" />
          <path d="M28 40C28 26 38 20 50 20C62 20 72 26 72 40C72 42 68 34 50 34C32 34 28 42 28 40Z" fill="#1e293b" />
          <circle cx="41" cy="46" r="6" stroke="#0f172a" strokeWidth="2.5" />
          <circle cx="59" cy="46" r="6" stroke="#0f172a" strokeWidth="2.5" />
          <line x1="47" y1="46" x2="53" y2="46" stroke="#0f172a" strokeWidth="2.5" />
          <path d="M15 88C15 72 30 64 50 64C70 64 85 72 85 88" fill="#1e293b" />
          <path d="M50 64L44 76H56L50 64Z" fill="#ffdbb5" />
        </svg>
      );
    }
    if (techIdx === 1) {
      return (
        <svg className="w-full h-full object-cover" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="50" fill="#f1f5f9" />
          <circle cx="50" cy="46" r="22" fill="#fed7aa" />
          <path d="M28 35C28 20 40 18 50 18C60 18 72 20 72 35C72 38 65 30 50 30C35 30 28 38 28 35Z" fill="#0f172a" />
          <circle cx="41" cy="45" r="5" stroke="#0f172a" strokeWidth="2" />
          <circle cx="59" cy="45" r="5" stroke="#0f172a" strokeWidth="2" />
          <path d="M15 88C15 72 30 64 50 64C70 64 85 72 85 88" fill="#334155" />
          <path d="M50 64L45 74H55L50 64Z" fill="#fed7aa" />
        </svg>
      );
    }
    if (techIdx === 2) {
      return (
        <svg className="w-full h-full object-cover" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="50" fill="#f1f5f9" />
          <circle cx="50" cy="46" r="22" fill="#fde047" />
          <path d="M26 38C26 24 36 16 50 16C64 16 74 24 74 38C74 31 68 32 50 32C32 32 26 31 26 38Z" fill="#451a03" />
          <path d="M32 45H68V51H32V45Z" fill="#111827" />
          <path d="M44 58C46 61 54 61 56 58" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M15 88C15 72 30 64 50 64C70 64 85 72 85 88" fill="#111827" />
          <path d="M50 64L45 74H55L50 64Z" fill="#fde047" />
        </svg>
      );
    }
    return (
      <svg className="w-full h-full object-cover" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="#f1f5f9" />
        <circle cx="50" cy="46" r="22" fill="#ffedd5" />
        <path d="M26 36C26 24 38 20 50 20C62 20 74 24 74 36H26Z" fill="#1e3a8a" />
        <path d="M38 52C42 56 58 56 62 52C60 58 40 58 38 52Z" fill="#475569" />
        <circle cx="40" cy="44" r="2" fill="#1e293b" />
        <circle cx="60" cy="44" r="2" fill="#1e293b" />
        <path d="M15 88C15 72 30 64 50 64C70 64 85 72 85 88" fill="#0f172a" />
        <path d="M50 64L45 74H55L50 64Z" fill="#ffedd5" />
      </svg>
    );
  };

  // Helper to handle updating status on selected order
  const handleUpdateStatus = async (newStatus: MaintenanceStatus) => {
    if (!selectedOrderId) return;
    try {
      const orderToUpdate = orders.find(o => o.id === selectedOrderId);
      if (!orderToUpdate) return;
      
      const updated = {
        ...orderToUpdate,
        status: newStatus
      };
      
      await db.maintenanceOrders.put(updated);
      setSelectedStatus(newStatus);
      toast.success(`تم تحديث حالة كرت الصيانة بنجاح إلى: ${statusMap[newStatus]?.label || newStatus}`);

      // Auto-trigger customer notification when status is changed to "ready" (تم الإصلاح بنجاح)
      if (newStatus === 'ready') {
        const cost = updated.actualCost || updated.expectedCost || 0;
        setCustomMessageText(`المحترم/المحترمة ${updated.customerName}، يسعدنا إعلامك بأن جهازك ${updated.deviceBrand || ''} ${updated.deviceModel} قد تم صيانة العطل فيه بنجاح بورشة الصيانة الرقمية وهو جاهز للتسليم الآن. التكلفة النهائية المقررة: ${cost.toLocaleString()} ج.م. نسعد بخدمتكم وبانتظار زيارتكم الكريمة!`);
        setShowNotificationModal(true);
      }

      // Auto-trigger customer notification when status is changed to "waiting_approval" (انتظار الموافقة والتسعير)
      if (newStatus === 'waiting_approval') {
        const cost = updated.actualCost || updated.expectedCost || 0;
        setCustomMessageText(`عزيزنا العميل ${updated.customerName}، تم فحص جهازك ${updated.deviceBrand || ''} ${updated.deviceModel} بورشة الصيانة الرقمية. لكي نبدأ بالعمل الفعلي، يرجى التكرم بفتح الرابط الذكي التالي لمراجعة التقرير الفني والموافقة على التكلفة المقدرة بـ ${cost.toLocaleString()} ج.م: http://approval-link.local/order/${updated.id}`);
        setShowNotificationModal(true);
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء تحديث حالة كرت الصيانة');
    }
  };

  // Helper to add custom spare parts directly to the order
  const handleAddCustomPart = async (name: string, priceStr: string) => {
    if (!selectedOrderId) {
      toast.error('الرجاء اختيار كرت صيانة نشط أولاً لربط قطعة الغيار به');
      return;
    }
    
    const activeOrder = orders.find(o => o.id === selectedOrderId);
    if (!activeOrder) return;

    if (!name.trim()) {
      toast.error('من فضلك أدخل اسم قطعة الغيار');
      return;
    }

    const price = parseFloat(priceStr);
    if (isNaN(price) || price <= 0) {
      toast.error('من فضلك أدخل سعراً صالحاً لقطعة الغيار');
      return;
    }

    try {
      const existingParts = activeOrder.parts || [];
      const updatedParts = [...existingParts];
      
      const partIndex = updatedParts.findIndex(p => p.name === name);
      if (partIndex >= 0) {
        updatedParts[partIndex].quantity += 1;
      } else {
        updatedParts.push({
          name: name,
          quantity: 1,
          price: price,
          cost: Math.floor(price * 0.7)
        });
      }

      const partPrice = price;
      const newExpected = (activeOrder.expectedCost || 0) + partPrice;
      const newActual = (activeOrder.actualCost || 0) + partPrice;

      const updatedOrder = {
        ...activeOrder,
        parts: updatedParts,
        expectedCost: newExpected,
        actualCost: newActual > 0 ? newActual : undefined
      };

      await db.maintenanceOrders.put(updatedOrder);
      setCustomPartName('');
      setCustomPartPrice('');
      toast.success(`🔧 تم ربط قطعة الغيار [${name}] وتحميل مكلفتها (${partPrice} ج.م) للفاتورة بنجاح!`);
    } catch (err) {
      toast.error('حدث عطل فني في ربط القطعة المخصصة بالكرت');
    }
  };

  // Helper to update the final technical report
  const handleSaveReport = async () => {
    if (!selectedOrderId) {
      toast.error('من فضلك حدد كرت الصيانة النشط أولاً');
      return;
    }
    try {
      const orderToUpdate = orders.find(o => o.id === selectedOrderId);
      if (!orderToUpdate) return;

      const updated = {
        ...orderToUpdate,
        notes: techReport
      };

      await db.maintenanceOrders.put(updated);
      toast.success('تم حفظ التقرير الفني النهائي بنجاح وثبّت بالكرت!');
    } catch (err) {
      toast.error('خطأ أثناء حفظ التقرير الفني');
    }
  };

  // Helper to search and pull spare parts directly from products vault storage
  const handleAddPartToOrder = async (product: any) => {
    if (!selectedOrderId) {
      toast.error('الرجاء اختيار كرت صيانة نشط أولاً لربط قطعة الغيار به');
      return;
    }
    
    const activeOrder = orders.find(o => o.id === selectedOrderId);
    if (!activeOrder) return;
    
    const stockQty = product.stock !== undefined ? product.stock : 0;
    if (stockQty <= 0) {
      toast.error('عذراً، هذه القطعة غير متوفرة في مخزن الصيانة حالياً (رصيدها صفر)');
      return;
    }

    try {
      // 1. Deduct stock in DB
      const newStock = Math.max(0, stockQty - 1);
      await db.products.update(product.id, { 
        stock: newStock
      });

      // 2. Add to order parts structure
      const existingParts = activeOrder.parts || [];
      const updatedParts = [...existingParts];
      
      const partIndex = updatedParts.findIndex(p => p.productId === product.id || p.name === product.name);
      if (partIndex >= 0) {
        updatedParts[partIndex].quantity += 1;
      } else {
        updatedParts.push({
          productId: product.id,
          name: product.name,
          quantity: 1,
          price: product.retailPrice || 100,
          cost: product.purchasePrice || 60
        });
      }

      // 3. Update order financial cost properties
      const partPrice = product.retailPrice || 100;
      const newExpected = (activeOrder.expectedCost || 0) + partPrice;
      const newActual = (activeOrder.actualCost || 0) + partPrice;

      const updatedOrder = {
        ...activeOrder,
        parts: updatedParts,
        expectedCost: newExpected,
        actualCost: newActual > 0 ? newActual : undefined
      };

      await db.maintenanceOrders.put(updatedOrder);
      setPartSearch(''); // reset input
      toast.success(`🔧 تم سحب [${product.name}] من المستودع وتحميل مكلفتها (${partPrice} ج.م) للفاتورة بنجاح!`);
    } catch (err) {
      toast.error('حدث عطل فني في ربط القطعة بالكرت');
    }
  };

  // Simulated WhatsApp/SMS Notification System
  const handleSendNotification = () => {
    if (!selectedOrderId) return;
    const activeOrder = orders.find(o => o.id === selectedOrderId);
    if (!activeOrder) return;

    setIsSendingNotification(true);
    setTimeout(() => {
      setIsSendingNotification(false);
      setShowNotificationModal(false);
      toast.success(`📱 تم إرسال رسالة تلقائية بنجاح إلى عميلك (${activeOrder.customerPhone}) عبر WhatsApp & SMS!`);
    }, 1200);
  };

  return (
    <div className="p-6 select-none max-w-[1600px] mx-auto space-y-8 tech-circuit-bg min-h-screen text-slate-800 relative" dir="rtl" id="computer-mobile-maintenance-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=Cairo:wght@300;400;500;600;700;800;900&display=swap');

        #computer-mobile-maintenance-root {
          font-family: 'Tajawal', 'Cairo', sans-serif !important;
        }

        .tech-circuit-bg {
          background-color: #f8fafc !important;
          background-image: none !important;
        }

        #computer-mobile-maintenance-root .neu-pressed {
          background: #f1f5f9 !important;
          box-shadow: 
            inset 2px 2px 5px rgba(165, 180, 200, 0.08), 
            inset -2px -2px 5px rgba(255, 255, 255, 0.8) !important;
          border: 1px solid rgba(226, 232, 240, 0.8) !important;
        }

        #computer-mobile-maintenance-root .neu-raised {
          background: #ffffff !important;
          box-shadow: 
            0 1px 3px rgba(0, 0, 0, 0.02),
            0 4px 12px rgba(163, 177, 198, 0.06) !important;
          border: 1px solid rgba(241, 245, 249, 0.8) !important;
        }

        .neu-nav-item {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid transparent !important;
        }

        .neu-nav-item:hover {
          transform: translateY(-1.5px);
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
          color: #0f172a !important;
          box-shadow: 
            0 4px 12px rgba(148, 163, 184, 0.08),
            0 1px 2px rgba(0, 0, 0, 0.01) !important;
        }

        #computer-mobile-maintenance-root .neu-nav-item-active {
          background: linear-gradient(102deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%) !important;
          color: #ffffff !important;
          border: 1px solid #2563eb !important;
          box-shadow: 
            0 10px 18px -3px rgba(37, 99, 235, 0.3), 
            0 4px 6px -4px rgba(37, 99, 235, 0.3),
            inset 0 1px 1px rgba(255, 255, 255, 0.2) !important;
          transform: translateY(-1.5px) scale(1.015);
        }
      `}</style>
      <Toaster position="top-left" reverseOrder={true} />

      {/* Header Banner */}
      <div className="bg-white p-8 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10 border border-slate-100 shadow-xs transition-all duration-300">
        <div className="space-y-3 text-right w-full font-sans">
          <div className="flex flex-wrap items-center gap-2.5 mb-1 bg-slate-50/50 p-1 rounded-full w-max border border-slate-100/50">
            <span className="px-3.5 py-1 text-[10px] font-black tracking-tight text-blue-755 bg-white border border-blue-100/80 rounded-full inline-flex items-center gap-1.5 shadow-3xs">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-600"></span>
              </span>
              قسم صيانة الإلكترونيات ورقاقة البورد المتقدمة
            </span>
            <span className="px-3 py-1 text-[10px] font-black text-slate-500 bg-transparent inline-flex items-center gap-1 select-none">
              المطابقة المحاسبية والضمانات الفنية 💻📱
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">طاقم مهندسي الورشة ونسبة الكفاءة</h1>
              <p className="text-xs text-slate-500 font-medium">أقسام التخصص الدقيقة، تتبع ضغط التكليفات وهيكل توزيع العمولات</p>
            </div>
          </div>
        </div>
      </div>



      {/* Technicians SubPage Content */}
      <div className="space-y-8" id="mntc-technicians-subpage">
        {/* Intro */}
        <div className="bg-white p-5 rounded-3xl border text-right max-w-5xl mx-auto space-y-2">
          <h3 className="text-sm font-black text-slate-900">مراقبة جودة الضمان وتكليفات فرق الصيانة</h3>
          <p className="text-[11.5px] text-slate-500 font-semibold leading-relaxed">
            يتم حساب نسب عمولات الفنيين بنظام الاستحقاق بمعدل 15% من القيمة الإجمالية عند تغطية أمر الصيانة والتسليم للعميل بشكل فعلي.
          </p>
        </div>

        {/* Engineer Cards Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 w-full max-w-5xl mx-auto justify-center">
          {defaultTechnicians.map((tech, idx) => {
            const activeOrdersForTech = orders.filter(o => o.technicianName === tech.name);
            const completedCount = activeOrdersForTech.filter(o => o.status === 'delivered').length;
            const completedValue = activeOrdersForTech.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.actualCost || 0), 0);
            const estimatedCommission = Math.floor(completedValue * 0.15);

            const activeCount = activeOrdersForTech.filter(o => ['received', 'diagnosing', 'repairing', 'waiting_parts', 'ready'].includes(o.status)).length;
            const totalTasksCombined = activeCount + completedCount;
            const completionRate = totalTasksCombined > 0 ? Math.min(100, Math.round((completedCount / totalTasksCombined) * 100)) : 100;

            return (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group min-h-fit max-w-[280px] w-full mx-auto">
                <div className="absolute right-0 top-0 w-24 h-24 bg-slate-50/65 rounded-full blur-xl opacity-0 group-hover:opacity-100 pointer-events-none -z-10 transition-all duration-300"></div>
                
                {/* TOP SECTION */}
                <div className="flex flex-col items-center text-center pb-3.5 border-b border-slate-100/65">
                  <div className="w-16 h-16 rounded-full border border-slate-150 shadow-3xs overflow-hidden bg-slate-50 relative group-hover:scale-105 transition-transform duration-300 mb-2.5">
                    {renderTechAvatar(idx)}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm tracking-tight leading-snug font-black font-sans">
                      {tech.name}
                    </h4>
                    <div className="mt-1.5 whitespace-normal break-words">
                      <span className="text-[9px] text-indigo-700 font-extrabold tracking-tight bg-indigo-50/85 border border-indigo-100/30 px-2.5 py-0.5 rounded-full inline-block leading-tight select-none">
                        {tech.specialty}
                      </span>
                    </div>
                  </div>
                </div>

                {/* MIDDLE SECTION */}
                <div className="py-3 space-y-3 flex-1 flex flex-col justify-between text-xs">
                  <div className="bg-slate-50/60 border border-slate-100/80 rounded-xl p-2.5 flex items-center justify-between">
                    <span className="text-slate-450 font-bold select-none text-[10px]">الهاتف للتواصل</span>
                    <span className="font-mono text-slate-800 font-extrabold tracking-wider text-xs select-all">{tech.phone}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                    <div className="bg-amber-50/25 border border-amber-100/30 rounded-xl p-3 flex flex-col items-center justify-center text-center relative overflow-hidden group/metric select-none hover:bg-amber-100/5 transition-colors">
                      <div className="flex items-center gap-1 mb-1.5 z-10">
                        <Wrench className="w-3 h-3 text-amber-500 stroke-[2]" />
                        <span className="text-[9px] text-slate-455 font-black leading-none">نشط</span>
                      </div>
                      <span className="text-sm font-black text-amber-650 font-mono z-10 tracking-tight">
                        {activeCount} <span className="text-[8.5px] font-sans font-bold text-slate-400">جهاز</span>
                      </span>
                    </div>

                    <div className="bg-emerald-50/20 border border-emerald-100/30 rounded-xl p-3 flex flex-col items-center justify-center text-center relative overflow-hidden group/metric select-none hover:bg-emerald-100/5 transition-colors">
                      <div className="flex items-center gap-1 mb-1.5 z-10">
                        <CheckCircle className="w-3 h-3 text-teal-600 stroke-[2]" />
                        <span className="text-[9px] text-slate-455 font-black leading-none">سلمت</span>
                      </div>
                      <span className="text-sm font-black text-teal-655 font-mono z-10 tracking-tight">
                        {completedCount} <span className="text-[8.5px] font-sans font-bold text-slate-400">عملية</span>
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50/40 border border-slate-100/55 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="text-right flex-1 select-none">
                      <span className="text-[10px] text-slate-455 font-black block">تسوية المهام</span>
                      <span className="text-[8.5px] text-slate-400 mt-0.5 block leading-relaxed animate-pulse">
                        جاهزية العمليات
                      </span>
                    </div>
                    
                    <div className="relative flex items-center justify-center shrink-0">
                      <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 64 64">
                        <defs>
                          <linearGradient id={`tealRingGrad-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#14b8a6" />
                            <stop offset="100%" stopColor="#0d9488" />
                          </linearGradient>
                        </defs>
                        <circle
                          className="text-slate-100"
                          strokeWidth="4"
                          stroke="currentColor"
                          fill="transparent"
                          r="24"
                          cx="32"
                          cy="32"
                        />
                        <circle
                          className="text-teal-500 transition-all duration-700 ease-out"
                          strokeWidth="4.5"
                          strokeDasharray={2 * Math.PI * 24}
                          strokeDashoffset={2 * Math.PI * 24 - (completionRate / 100) * (2 * Math.PI * 24)}
                          strokeLinecap="round"
                          stroke={`url(#tealRingGrad-${idx})`}
                          fill="transparent"
                          r="24"
                          cx="32"
                          cy="32"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center select-none">
                        <span className="text-[9.5px] font-mono font-black text-slate-700 leading-none">{completionRate}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOTTOM SECTION */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="bg-slate-50 border border-slate-100/80 rounded-xl p-2.5 flex justify-between items-center relative overflow-hidden group/comms">
                    <div className="text-right z-10 select-none">
                      <div className="flex items-center gap-1">
                        <Coins className="w-3 h-3 text-indigo-500 shrink-0 stroke-[2]" />
                        <span className="text-[9px] text-slate-455 font-black block font-sans">عمولة تصفية الصيانة</span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-slate-800 font-mono z-10">
                      {estimatedCommission.toLocaleString()} ج.م
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Dynamic Technician Workspace Panel (ورشة الصيانة والتكليفات المفتوحة) */}
        <div className="bg-slate-50 border border-slate-200/50 p-6 rounded-3xl space-y-6 max-w-5xl mx-auto text-right">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-4 justify-start">
            <div className="space-y-1 text-right">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 justify-start">
                <Wrench className="w-5 h-5 text-indigo-600" />
                شاشة ورشة الصيانة التفاعلية (Technician Workspace)
              </h2>
              <p className="text-[11.5px] text-slate-500 font-semibold">
                تابع مهام الصيانة النشطة، غيّر حالة الأجهزة، اكتب التقرير التقني، واربط قطع الغيار من المستودع مباشرة بالعمولة
              </p>
            </div>
            
            {/* Filter by assigned Engineer */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600 shrink-0">تصنيف المهندس المكلف:</label>
              <select
                value={selectedTechnicianFilter}
                onChange={(e) => setSelectedTechnicianFilter(e.target.value)}
                className="text-xs font-bold bg-white text-slate-700 px-3.5 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              >
                <option value="all">كل المهندسين بالورشة</option>
                {defaultTechnicians.map((t, i) => (
                  <option key={i} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* RIGHT COLUMN: Active Orders Queue */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-indigo-950 flex items-center gap-1">
                    <ClipboardList className="w-4 h-4 text-indigo-700" />
                    جدول المهام المفتوحة بالمعمل
                  </h3>
                  <span className="text-[10px] bg-indigo-550/10 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                    الأقدم استلاماً (أولوية قصوى)
                  </span>
                </div>

                {/* Queue Filter Tabs */}
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setQueueTab('repairing')}
                    className={`py-1.5 px-3 text-xs font-black rounded-lg transition-all ${
                      queueTab === 'repairing'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-650 hover:text-slate-950 bg-transparent'
                    }`}
                  >
                    🛠️ قيد الإصلاح المباشر ({orders.filter(o => o.status === 'repairing').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueueTab('all')}
                    className={`py-1.5 px-3 text-xs font-black rounded-lg transition-all ${
                      queueTab === 'all'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-650 hover:text-slate-950 bg-transparent'
                    }`}
                  >
                    📂 جميع المهام النشطة ({orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length})
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {(() => {
                  let list = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
                  
                  if (queueTab === 'repairing') {
                    list = list.filter(o => o.status === 'repairing');
                  }
                  
                  // Filter by technician if selected
                  if (selectedTechnicianFilter !== 'all') {
                    list = list.filter(o => o.technicianName === selectedTechnicianFilter);
                  }

                  // Sort by receipt date (earliest first = higher priority)
                  list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                  if (list.length === 0) {
                    return (
                      <div className="p-10 text-center bg-white border border-dashed rounded-2xl text-slate-400">
                        <Inbox className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <span className="text-xs font-extrabold block">قائمة العمليات فارغة حالياً</span>
                        <p className="text-[10px] text-slate-400 mt-1">لا توجد أجهزة مطابقة في هذه الفئة.</p>
                      </div>
                    );
                  }

                  return list.map((order, idx) => {
                    const isSelected = order.id === selectedOrderId;
                    const statusOpt = statusMap[order.status] || { label: 'غير محدد', color: 'text-slate-400', bg: 'bg-slate-100', icon: Clock };
                    const StatusIcon = statusOpt.icon;
                    const dateFormatted = new Date(order.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                    return (
                      <div
                        key={order.id}
                        id={`tech-task-card-${order.id}`}
                        onClick={() => setSelectedOrderId(order.id || null)}
                        className={`p-4 rounded-2xl border transition-all duration-350 cursor-pointer text-right ${
                          isSelected 
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-md transform -translate-y-0.5' 
                            : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-indigo-200 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="text-right">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-black ${
                                isSelected ? 'bg-indigo-500 text-white border border-indigo-400' : 'bg-slate-100 text-slate-800'
                              }`}>
                                كرت #{order.id}
                              </span>
                              <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold tracking-tight border ${
                                isSelected ? 'bg-white/10 border-white/20' : 'bg-indigo-50/45 border-indigo-100/30 text-indigo-700'
                              }`}>
                                {order.deviceType}
                              </span>
                              {idx < 2 && (
                                <span className={`text-[8px] font-black tracking-tight px-1.5 py-0.5 rounded-full ${
                                  isSelected ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {idx === 0 ? 'خط حرج (مرتفع)' : 'أولوية متقدمة'}
                                </span>
                              )}
                            </div>
                            
                            <h4 className={`text-xs font-black mt-2 ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                              {order.deviceBrand || ''} {order.deviceModel}
                            </h4>
                            
                            <p className={`text-[10px] mt-1 font-sans ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                              العميل: {order.customerName}
                            </p>
                          </div>

                          <div className="text-left font-mono">
                            <span className={`text-[9px] block ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                              {dateFormatted}
                            </span>
                          </div>
                        </div>

                        {/* Order status pill */}
                        <div className="mt-3 flex items-center justify-between gap-2 text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-full font-extrabold text-[9px] flex items-center gap-1 ${
                              isSelected ? 'bg-white/20 text-white border border-white/20' : `${statusOpt.bg} ${statusOpt.color}`
                            }`}>
                              <StatusIcon className="w-3 h-3 stroke-[2.5]" />
                              {statusOpt.label}
                            </span>
                          </div>
                          
                          <span className={`text-[9px] font-bold ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                            مكلف لـ: <span className="font-extrabold">{order.technicianName || 'غير معين'}</span>
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* LEFT COLUMN: SELECTED ORDER WORK DESK */}
            <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-200/60 shadow-xs space-y-5">
              {!activeOrder ? (
                <div className="py-24 text-center text-slate-400 space-y-4 font-sans max-w-sm mx-auto select-none">
                  <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto shadow-3xs">
                    <Wrench className="w-8 h-8 stroke-[1.25]" />
                  </div>
                  <div className="space-y-1 text-center">
                    <h4 className="text-xs font-black text-slate-850">بانتظار تحديد كارت الصيانة</h4>
                    <span className="text-[10px] text-slate-400 block leading-relaxed">حدد أحد كروت الأجهزة المفتوحة من الجدول الأيمن للبدء في تشخيص وعلاج العطل وصرف قطع الغيار.</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 text-right transition-opacity duration-300">
                  
                  {/* Workspace Card Header */}
                  <div className="border-b border-slate-100 pb-3 flex items-start justify-between">
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black rounded-lg">
                          على مقعد الفني • كرت #{activeOrder.id}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                          مستلم بتاريخ: {new Date(activeOrder.date).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-slate-900 mt-2">
                        {activeOrder.deviceBrand || ''} {activeOrder.deviceModel} ({activeOrder.deviceType})
                      </h3>
                      <p className="text-[11px] text-indigo-650 mt-0.5 font-bold font-sans">
                        عطل العميل: <span className="text-slate-700 font-medium">{activeOrder.issueDescription}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedOrderId(null)}
                      className="p-1 px-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 text-[10px] font-black rounded-lg transition-colors cursor-pointer"
                    >
                      إلغاء ✕
                    </button>
                  </div>

                  {/* 1. Status selector - تغيير حالة الجهاز */}
                  <div className="space-y-2 text-right">
                    <span className="block text-xs font-black text-slate-800">
                      تغيير حالة بطاقة الجهاز بالورشة:
                    </span>
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
                      {(['diagnosing', 'waiting_approval', 'repairing', 'ready', 'cancelled'] as MaintenanceStatus[]).map((statusKey) => {
                        const isCurrent = activeOrder.status === statusKey;
                        const labelMap: Record<string, string> = {
                          diagnosing: 'قيد الفحص',
                          waiting_approval: 'انتظار الموافقة',
                          repairing: 'قيد الإصلاح',
                          ready: 'تم الإصلاح',
                          cancelled: 'لا يمكن إصلاحه'
                        };
                        const colorMap: Record<string, string> = {
                          diagnosing: 'bg-purple-50 hover:bg-purple-105 text-purple-700 border-purple-200',
                          waiting_approval: 'bg-rose-50 hover:bg-rose-105 text-rose-700 border-rose-200',
                          repairing: 'bg-indigo-50 hover:bg-indigo-105 text-indigo-700 border-indigo-200',
                          ready: 'bg-emerald-50 hover:bg-emerald-105 text-emerald-700 border-emerald-200',
                          cancelled: 'bg-rose-50 hover:bg-rose-105 text-rose-700 border-rose-200'
                        };
                        const currentActiveStyle = isCurrent 
                          ? 'ring-2 ring-indigo-600 ring-offset-2 scale-[1.02] shadow-3xs font-black' 
                          : 'opacity-75 hover:opacity-100';

                        return (
                          <button
                            key={statusKey}
                            type="button"
                            onClick={() => handleUpdateStatus(statusKey)}
                            className={`p-2 rounded-xl border text-center text-[10.5px] font-extrabold transition-all duration-205 cursor-pointer ${colorMap[statusKey]} ${currentActiveStyle}`}
                          >
                            {labelMap[statusKey]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Technical report textarea - خانة كتابة التقرير الفني */}
                  <div className="space-y-2 text-right">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-black text-slate-800">
                        التقرير الفني (العطل الفعلي والحل الذي تم):
                      </label>
                      <button
                        type="button"
                        onClick={handleSaveReport}
                        className="text-[9.5px] bg-slate-900 text-white hover:bg-slate-800 px-3.5 py-1 font-black rounded-lg transition-all cursor-pointer shadow-3xs"
                      >
                        حفظ وثبيت التقرير بالكرت ✍️
                      </button>
                    </div>
                    <textarea
                      value={techReport}
                      onChange={(e) => setTechReport(e.target.value)}
                      placeholder="اكتب التقرير الفني النهائي (العطل الفعلي والحل الذي تم) (مثال: تم فحص دائرة الباور وتبين وجود شورت في المكثف وتم استبداله بقطعة غيار جديدة وتجربة الشحن)..."
                      className="w-full text-xs font-medium p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 min-h-[90px] text-slate-800 leading-relaxed text-right"
                    />
                  </div>

                  {/* 3. Linked Spare parts - ربط قطع الغيار وسحب المكلف لصالحه */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-3.5">
                    
                    {/* Linked parts listing */}
                    <div className="space-y-2 text-right">
                      <span className="block text-xs font-black text-indigo-950 flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                        القطع المحسوبة والمخصصة لهذا الكرت المالي ({activeOrder.parts?.length || 0} قطع):
                      </span>
                      
                      {(!activeOrder.parts || activeOrder.parts.length === 0) ? (
                        <span className="text-[10px] text-slate-450 block italic bg-white p-2.5 rounded-lg border border-slate-150 text-right">
                          لم يتم ربط أي قطع غيار إلكترونية من المخزن بهذا الجهاز بعد.
                        </span>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                          {activeOrder.parts.map((p, pIdx) => (
                            <div key={pIdx} className="bg-white p-2.5 border border-slate-150 rounded-xl flex items-center justify-between text-xs">
                              <div className="text-right">
                                <span className="font-extrabold block text-slate-800">{p.name}</span>
                                <span className="font-mono text-[9px] text-slate-450">سعر القطعة: {p.price.toLocaleString()} ج.م x{p.quantity}</span>
                              </div>
                              <span className="text-[10.5px] font-black font-mono text-indigo-650 bg-indigo-50/70 px-2 py-0.5 rounded-md">
                                {(p.price * p.quantity).toLocaleString()} ج.م
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add Part Search tool */}
                    <div className="space-y-2 pt-2 border-t border-slate-200/50 text-right">
                      <label className="block text-[11px] font-black text-slate-700">
                        بحث سريع في مخزن الورش والصيانة لصرف وسحب القطع:
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={partSearch}
                          onChange={(e) => setPartSearch(e.target.value)}
                          placeholder="ابحث باسم الشاشة، أو البطارية، الموديل، الـ SSD (مثال: شاشة ايفون، بطارية ايباد)..."
                          className="w-full text-xs p-2.5 pr-8 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 text-slate-800 text-right"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5" />
                      </div>

                      {/* Live parts search results */}
                      {partSearch.trim().length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-xl max-h-48 overflow-y-auto p-1.5 space-y-1 z-20 relative shadow-md">
                          {(() => {
                            const matched = products.filter(p => {
                              const isMntcCat = p.category === 'قطع غيار صيانة' || (p.name.includes('شاشة') || p.name.includes('رام') || p.name.includes('SSD') || p.name.includes('بطارية') || p.name.includes('فلاتة') || p.name.includes('معجون'));
                              return isMntcCat && p.name.toLowerCase().includes(partSearch.toLowerCase());
                            });

                            if (matched.length === 0) {
                              return (
                                <span className="text-[10px] text-slate-400 block p-3 text-center text-right">
                                  لا توجد قطع غيار مطابقة للبحث في مخزن الصيانة حالياً.
                                </span>
                              );
                            }

                            return matched.map((product) => {
                              const qty = product.stock !== undefined ? product.stock : 0;
                              return (
                                <div
                                  key={product.id}
                                  className="p-2 border-b last:border-0 hover:bg-slate-50 rounded-lg flex items-center justify-between text-xs text-right cursor-pointer"
                                  onClick={() => handleAddPartToOrder(product)}
                                >
                                  <div className="text-right">
                                    <span className="font-extrabold text-slate-800 block">{product.name}</span>
                                    <span className="font-mono text-[9px] text-slate-455">المستودع: {qty} قطع متوفرة</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                                      {product.price?.toLocaleString() || '150'} ج.م
                                    </span>
                                    <span className="text-[10px] text-indigo-650 font-extrabold border border-indigo-200 hover:bg-indigo-600 hover:text-white px-2 py-1 rounded-md transition-all">
                                      صرف وربط ➕
                                    </span>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}

                      {/* Quick Add Shortcuts */}
                      <div className="pt-2">
                        <span className="block text-[10px] text-slate-500 font-bold mb-1.5">أزرار سريعة لصرف قطع غيار شائعة ومباشرة بالفاتورة:</span>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleAddCustomPart('شاشة بديلة', '1500')}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-750 border border-indigo-200/50 px-2.5 py-1 text-[10px] font-black rounded-lg cursor-pointer transition-all"
                          >
                            💻 شاشة جديدة (+1,500 ج.م)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddCustomPart('بطارية عالية الكفاءة', '600')}
                            className="bg-purple-50 hover:bg-purple-100 text-purple-750 border border-purple-200/50 px-2.5 py-1 text-[10px] font-black rounded-lg cursor-pointer transition-all"
                          >
                            🔋 بطارية أصلية (+600 ج.م)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddCustomPart('سوكيت شحن أصلي', '250')}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-750 border border-amber-200/50 px-2.5 py-1 text-[10px] font-black rounded-lg cursor-pointer transition-all"
                          >
                            🔌 سوكيت شحن (+250 ج.م)
                          </button>
                        </div>
                      </div>

                      {/* Manual Custom Spare Part form */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200 text-right space-y-2 mt-2">
                        <span className="block text-[10px] text-indigo-950 font-black">إدخال قطعة غيار مخصصة يدوياً (غير متوفرة بالمستودع):</span>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                          <div className="sm:col-span-6">
                            <input
                              type="text"
                              value={customPartName}
                              onChange={(e) => setCustomPartName(e.target.value)}
                              placeholder="اسم القطعة (مثال: فلاتة باور، ليد شاشة)..."
                              className="w-full text-[11px] p-2 bg-slate-50 border border-slate-250 rounded-lg text-slate-800 focus:outline-none"
                            />
                          </div>
                          <div className="sm:col-span-4">
                            <input
                              type="number"
                              value={customPartPrice}
                              onChange={(e) => setCustomPartPrice(e.target.value)}
                              placeholder="السعر (ج.م)..."
                              className="w-full text-[11px] p-2 bg-slate-50 border border-slate-250 rounded-lg font-mono text-slate-800 focus:outline-none"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <button
                              type="button"
                              onClick={() => {
                                handleAddCustomPart(customPartName, customPartPrice);
                              }}
                              className="w-full text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2 rounded-lg cursor-pointer transition-all"
                            >
                              إضافة ➕
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. Client Notification System - زر لإرسال رسالة تلقائية للعميل */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-indigo-50/40 p-4 rounded-2xl border border-indigo-200/30 text-right">
                    <div className="text-right">
                      <span className="block text-xs font-black text-indigo-950">
                        نظام إشعار العميل بالجهاز (Automated Customer Alerts):
                      </span>
                      <p className="text-[9.5px] text-slate-500 font-medium leading-relaxed mt-0.5">
                        قم بإرسال رسالة فورية ومحسوبة بالكامل عبر SMS أو WhatsApp إلى هاتف العميل تلقائياً عند جاهزية جهازه للتسليم وتحديد التكلفة النهائية لتصفية الحساب.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowNotificationModal(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 font-black text-xs text-white rounded-xl transition-all shadow-3xs flex items-center gap-1.5 shrink-0 self-start md:self-center cursor-pointer font-sans"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      إرسال إشعار الصيانة 📱
                    </button>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>

        {/* WhatsApp & SMS Notification Visual Overlay */}
        {showNotificationModal && activeOrder && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4" dir="rtl">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 max-w-lg w-full space-y-4 shadow-xl text-right">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2 justify-start">
                  <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
                  <h3 className="font-extrabold text-slate-900 text-sm">أداة إرسال إشعار الصيانة الجاهزة إلى العميل</h3>
                </div>
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="text-slate-450 hover:text-slate-650 cursor-pointer text-sm font-black"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3.5 text-right">
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-150 flex items-center justify-between text-xs">
                  <div className="text-right">
                    <span className="text-slate-450 block font-bold">اسم العميل المستلم:</span>
                    <span className="font-extrabold text-slate-800">{activeOrder.customerName}</span>
                  </div>
                  <div className="text-left">
                    <span className="text-slate-450 block font-bold">الهاتف النشط:</span>
                    <span className="font-mono font-extrabold text-slate-800">{activeOrder.customerPhone}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="block text-xs font-black text-slate-800">صيغة إرسال رسالة الواتساب و الـ SMS التلقائية:</label>
                  <textarea
                    value={customMessageText}
                    onChange={(e) => setCustomMessageText(e.target.value)}
                    className="w-full text-xs font-medium p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none min-h-[110px] text-slate-800 leading-relaxed text-right"
                  />
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-start gap-2.5 text-right">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-emerald-800 font-bold leading-relaxed">
                    يسحب هذا النظام بيانات التكلفة النهائية كلياً (بما تشمل قطع الغيار المربوطة) البالغة <span className="font-mono font-black underline">{(activeOrder.actualCost || activeOrder.expectedCost || 0).toLocaleString()} ج.م</span> تلقائياً للشفافية المطلقة.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSendingNotification}
                  onClick={handleSendNotification}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSendingNotification ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      جاري تشغيل خوادم الإرسال التلقائي...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      إرسال الإشعار والرسالة الآن للعميل 📢
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNotificationModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 font-black text-xs rounded-xl transition-colors cursor-pointer"
                >
                  إغلاق نافذة الإرسال
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ComputerMobileTechnicians;
