import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { MaintenanceOrder, MaintenanceStatus } from '../../types';
import { 
  ClipboardCheck, Clock, Check, X, ShieldAlert, Smartphone, CheckSquare, 
  HelpCircle, MessageSquare, Copy, ExternalLink, Printer, Search, Calendar, 
  DollarSign, RefreshCw, AlertCircle, Sparkles, User, Info, SmartphoneIcon,
  Laptop, ChevronRight, Phone, MessageCircle, FileText
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

// Play sound helper using Web Audio API to bypass external dependencies
const playSynthBeep = (type: 'success' | 'cancel') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
      osc.frequency.setValueAtTime(147, ctx.currentTime + 0.15); // D3
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (error) {
    console.warn("Audio context not supported or yet interaction activated.", error);
  }
};

const ComputerMobileApprovals: React.FC = () => {
  // Live queries from local database
  const orders = useLiveQuery(() => db.maintenanceOrders.toArray()) || [];
  
  // Local UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'computer' | 'mobile'>('all');
  const [selectedSimOrder, setSelectedSimOrder] = useState<MaintenanceOrder | null>(null);
  const [isSimulatingLink, setIsSimulatingLink] = useState(false);
  
  // Notification flow modal helper (WhatsApp/SMS mockup)
  const [activeMessageText, setActiveMessageText] = useState('');
  const [activeMessageOrder, setActiveMessageOrder] = useState<MaintenanceOrder | null>(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  // Stats calculation
  const pendingOrders = orders.filter(o => o.status === 'waiting_approval');
  const totalPendingValue = pendingOrders.reduce((sum, o) => sum + (o.actualCost || o.expectedCost || 0), 0);
  const approvedCountToday = orders.filter(o => {
    // If it has a note about approval or in repairing state with cost
    return o.status === 'repairing' && (o.notes?.includes('موافقة') || o.notes?.includes('الرابط الذكي'));
  }).length;

  // Filter orders listing
  const filteredPending = pendingOrders.filter(o => {
    const term = searchTerm.toLowerCase();
    const nameMatch = o.customerName.toLowerCase().includes(term);
    const modelMatch = o.deviceModel.toLowerCase().includes(term);
    const techMatch = (o.notes || '').toLowerCase().includes(term);
    const shelfMatch = (o.shelfCode || '').toLowerCase().includes(term);
    const matchesSearch = nameMatch || modelMatch || techMatch || shelfMatch;
    
    if (deviceFilter === 'computer') {
      return matchesSearch && o.deviceType === 'computer';
    }
    if (deviceFilter === 'mobile') {
      return matchesSearch && o.deviceType === 'mobile';
    }
    return matchesSearch;
  });

  // Action: Manual Force Approve (For technician's dashboard use)
  const handleManualApprove = async (orderId: number) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      
      const updated = {
        ...order,
        status: 'repairing' as MaintenanceStatus,
        notes: `${order.notes || ''}\n[تحديث]: تمت الموافقة اليدوية المباشرة من لوحة التحكم للتسعير المقدر بـ ${(order.actualCost || order.expectedCost || 0).toLocaleString()} ج.م.`
      };
      
      await db.maintenanceOrders.put(updated);
      toast.success('✓ تم تفعيل أمر الصيانة وتعديل حالته إلى قيد الإصلاح مباشرة بنجاح!');
      playSynthBeep('success');
    } catch (e) {
      toast.error('عطل أثناء تحديث حالة كرت الصيانة');
    }
  };

  // Action: Manual Force Cancel
  const handleManualReject = async (orderId: number) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      
      const updated = {
        ...order,
        status: 'cancelled' as MaintenanceStatus,
        notes: `${order.notes || ''}\n[تحديث]: تم الرفض اليدوي المباشر لأمر الصيانة وتصنيفه كمرتجع بدون إصلاح.`
      };
      
      await db.maintenanceOrders.put(updated);
      toast.error('✕ تم تجميد أمر الإصلاح وتوجيهه كمرتجع ملغي بنجاح!');
      playSynthBeep('cancel');
    } catch (e) {
      toast.error('عطل أثناء تحديث حالة كرت الصيانة');
    }
  };

  // Helper to open WhatsApp dialog simulation
  const handleOpenNotificationModal = (order: MaintenanceOrder) => {
    const cost = order.actualCost || order.expectedCost || 0;
    const msg = `عزيزنا العميل ${order.customerName}، تم الانتهاء من الفحص والتشخيص الفني لجهازك (${order.deviceBrand || ''} ${order.deviceModel}) ورقم بطاقته DEV-${order.id}. يرجى التكرم بفتح بوابة عروض الأسعار الذكية أدناه للموافقة على البدء بالصيانة وتأكيد التكلفة البالغة ${cost.toLocaleString()} ج.م: http://approval-link.local/order/${order.id}`;
    setActiveMessageOrder(order);
    setActiveMessageText(msg);
    setIsNotificationModalOpen(true);
  };

  // Helper to copy text to clipboard
  const handleCopyClipboardText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('تم نسخ نص الرسالة والرابط الذكي للحافظة بنجاح! جاهز للإرسال الفوري للعميل.');
  };

  // Simulator Customer Actions
  const handleClientWebApproval = async (orderId: number) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      
      const updated = {
        ...order,
        status: 'repairing' as MaintenanceStatus,
        notes: `${order.notes || ''}\n[بوابة العميل الرقمية]: تم تقديم موافقة تقنية صريحة من العميل الذكي من خلال الرابط الفردي المولد بنجاح. قيمة الصيانة المتفق عليها: ${(order.actualCost || order.expectedCost || 0).toLocaleString()} ج.م.`
      };
      
      await db.maintenanceOrders.put(updated);
      toast.success('📱 رائع! العميل ضغط موافقة بالبوابة، تم نقل الجهاز لـ "قيد الإصلاح" وتحديث الورشة فوراً!', { icon: '🤖' });
      playSynthBeep('success');
      
      // Update selected simulation card to reflect state immediately
      setSelectedSimOrder(updated);
    } catch (e) {
      toast.error('حدث عطل في معالجة الموافقة الآلية');
    }
  };

  const handleClientWebRejection = async (orderId: number) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      
      const updated = {
        ...order,
        status: 'cancelled' as MaintenanceStatus,
        notes: `${order.notes || ''}\n[بوابة العميل الرقمية]: تم تسجيل رفض رسمي للصيانة من العميل عبر الرابط الفردي. طلب تسليم الجهاز مرتجع ومسحوب بدون إصلاح.`
      };
      
      await db.maintenanceOrders.put(updated);
      toast.error('📱 العميل رفض الصيانة بالبوابة التفاعلية. تم تحويل الجهاز إلى مرتجعات ملغاة للورشة فوراً!', { icon: '⚠️' });
      playSynthBeep('cancel');
      
      setSelectedSimOrder(updated);
    } catch (e) {
      toast.error('حدث عطل في معالجة إلغاء الصيانة');
    }
  };

  return (
    <div className="p-6 select-none max-w-[1600px] mx-auto space-y-8 tech-circuit-bg min-h-screen text-slate-800" dir="rtl">
      
      {/* Dynamic styling for modern dashboard ambiance */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=Cairo:wght@300;400;500;600;700;800;900&display=swap');
        .main-approvals-font {
          font-family: 'Tajawal', 'Cairo', sans-serif !important;
        }
      `}</style>

      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-rose-100 pb-5 main-approvals-font">
        <div className="space-y-1.5 text-right">
          <div className="flex items-center gap-2.5 justify-start">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 shadow-3xs">
              <ClipboardCheck className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">نظام عروض الأسعار وموافقة العملاء الرقمي</h1>
              <p className="text-[11px] text-slate-500 font-bold">بوابة ذكية متكاملة لتتبع موافقات العملاء، تسعير الفحص الفني، وإرسال الروابط التفاعلية</p>
            </div>
          </div>
        </div>
        
        {/* Info label */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2.5 px-4 rounded-2xl text-[10.5px] font-black text-slate-600 shadow-3xs">
          <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"></span>
          الربط التلقائي بالورشة: غرف الفحص لوحة الفني المستمر نشطة
        </div>
      </div>

      {/* Metrics Cards Grid - Bento Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5 main-approvals-font">
        {/* Stat 1: Total Waiting */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-3xs flex items-center justify-between text-right relative overflow-hidden">
          <div className="space-y-1 z-10">
            <span className="text-[11.5px] font-black text-slate-450 block">أجهزة بانتظار الموافقة الآن</span>
            <span className="text-3xl font-black text-slate-800 block tracking-tight">{pendingOrders.length} جهاز</span>
            <span className="text-[10px] text-amber-600 font-bold block bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 w-fit">بانتظار تأكيد التسعير الفني</span>
          </div>
          <div className="p-4 bg-amber-50/60 text-amber-500 rounded-3xl z-10">
            <Clock className="w-7 h-7" />
          </div>
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-slate-50/50 rounded-full -mr-10 -mb-10 pointer-events-none"></div>
        </div>

        {/* Stat 2: Quoted Value */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-3xs flex items-center justify-between text-right relative overflow-hidden">
          <div className="space-y-1 z-10">
            <span className="text-[11.5px] font-black text-slate-450 block">إجمالي قيمة عروض الأسعار</span>
            <span className="text-3xl font-black text-rose-600 block tracking-tight font-mono">{totalPendingValue.toLocaleString()} <span className="text-sm font-black">ج.م</span></span>
            <span className="text-[10px] text-rose-600 font-bold block bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100 w-fit">أقساط معلقة في ذمة العملاء</span>
          </div>
          <div className="p-4 bg-rose-50/60 text-rose-500 rounded-3xl z-10">
            <DollarSign className="w-7 h-7" />
          </div>
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-slate-50/50 rounded-full -mr-10 -mb-10 pointer-events-none"></div>
        </div>

        {/* Stat 3: Approved Today */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-3xs flex items-center justify-between text-right relative overflow-hidden">
          <div className="space-y-1 z-10">
            <span className="text-[11.5px] font-black text-slate-450 block">موافقات روابط اليوم</span>
            <span className="text-3xl font-black text-emerald-600 block tracking-tight">{approvedCountToday} موافقة</span>
            <span className="text-[10px] text-emerald-600 font-bold block bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 w-fit">تحويلات ذكية لـ "قيد الإصلاح"</span>
          </div>
          <div className="p-4 bg-emerald-50/60 text-emerald-500 rounded-3xl z-10">
            <CheckSquare className="w-7 h-7" />
          </div>
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-slate-50/50 rounded-full -mr-10 -mb-10 pointer-events-none"></div>
        </div>

        {/* Stat 4: Conversion Rate */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-3xs flex items-center justify-between text-right relative overflow-hidden">
          <div className="space-y-1 z-10">
            <span className="text-[11.5px] font-black text-slate-450 block">معدل قبول التكلفة الذاتي</span>
            <span className="text-3xl font-black text-indigo-600 block tracking-tight">88.5%</span>
            <span className="text-[10px] text-indigo-600 font-bold block bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 w-fit">توفير رائع في مكالمات التأكيد</span>
          </div>
          <div className="p-4 bg-indigo-50/60 text-indigo-500 rounded-3xl z-10">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-slate-50/50 rounded-full -mr-10 -mb-10 pointer-events-none"></div>
        </div>
      </div>

      {/* Filter and search panel */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-3xs space-y-4 main-approvals-font">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث برقم كاب الصيانة، اسم العميل الفردي، الرف المخصص أو الموديل..."
              className="w-full text-xs font-bold p-3 pr-10 border border-slate-200 rounded-2xl bg-slate-50/60 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 transition-all text-right"
            />
          </div>

          {/* Quick tab filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDeviceFilter('all')}
              className={`p-2.5 px-5 text-xs font-black rounded-xl border transition-all cursor-pointer ${deviceFilter === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'}`}
            >
              عرض الكل ({pendingOrders.length})
            </button>
            <button
              onClick={() => setDeviceFilter('computer')}
              className={`p-2.5 px-5 text-xs font-black rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${deviceFilter === 'computer' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'}`}
            >
              <Laptop className="w-3.5 h-3.5" />
              أجهزة الكمبيوتر واللابتوب ({pendingOrders.filter(o => o.deviceType === 'computer').length})
            </button>
            <button
              onClick={() => setDeviceFilter('mobile')}
              className={`p-2.5 px-5 text-xs font-black rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${deviceFilter === 'mobile' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'}`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              الهواتف والأجهزة اللوحية ({pendingOrders.filter(o => o.deviceType === 'mobile').length})
            </button>
          </div>
        </div>
      </div>

      {/* Main layout: Table of waiting devices & simulator on the left */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start main-approvals-font">
        
        {/* RIGHT COLUMN: Devices list waiting for approval (2 spans on xl) */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-3xs text-right space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
                قائمة بطاقات الصيانة قيد "انتظار موافقة العميل والتسعير"
              </h2>
              <span className="text-[10.5px] font-black text-slate-450">مصفاة حالياً: {filteredPending.length} بطاقة نشطة</span>
            </div>

            {filteredPending.length === 0 ? (
              <div className="p-16 border-2 border-dashed border-slate-150 rounded-2xl text-center space-y-3.5">
                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center mx-auto border border-slate-200">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-700">لا توجد بطاقات بانتظار الموافقة المالية حالياً</h3>
                  <p className="text-[10.5px] text-slate-450 font-bold max-w-md mx-auto">
                    بإمكانك التوجه لشاشة "تكليفات الفنيين" وتحويل حالة أي جهاز قيد الفحص إلى "انتظار الموافقة" لتقوم البوابة الرقمية بإدارته فوراً وتوليد الروابط التفاعلية التلقائية له.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPending.map((order) => {
                  const estCost = order.actualCost || order.expectedCost || 0;
                  const partsCount = order.parts?.length || 0;
                  const isSimSelected = selectedSimOrder?.id === order.id;

                  return (
                    <div 
                      key={order.id} 
                      className={`p-5 rounded-2xl border transition-all duration-200 space-y-4 relative ${isSimSelected ? 'border-amber-400 bg-amber-50/10 ring-1 ring-amber-400' : 'border-slate-150 hover:border-slate-300 hover:shadow-2xs bg-white'}`}
                    >
                      {/* Brand Label Accent Header */}
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-black p-1 px-2.5 rounded-lg flex items-center gap-1 ${order.deviceType === 'computer' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-purple-50 text-purple-700 border border-purple-100'}`}>
                          {order.deviceType === 'computer' ? <Laptop className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                          {order.deviceBrand} {order.deviceModel}
                        </span>
                        
                        <span className="text-[10px] bg-slate-100 font-extrabold text-slate-600 py-1 px-2 rounded-lg border border-slate-150">
                          كارت صيانة #DEV-{order.id}
                        </span>
                      </div>

                      {/* Client information & details */}
                      <div className="space-y-2 text-right">
                        <div className="flex items-center gap-1.5 justify-start text-xs font-extrabold text-slate-800">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>العميل: <span className="text-slate-900 font-black">{order.customerName}</span></span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 justify-start text-[11px] text-slate-500 font-bold">
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span>تليفون: <span className="font-mono">{order.customerPhone}</span></span>
                        </div>

                        {order.shelfCode && (
                          <div className="flex items-center gap-1.5 justify-start text-[11px] text-amber-700 font-bold bg-amber-50 rounded-lg p-1.5 px-2.5 border border-amber-100 w-fit">
                            <Info className="w-3.5 h-3.5 shrink-0" />
                            <span>موقع التخزين بالورشة: <span className="font-mono font-black">{order.shelfCode}</span></span>
                          </div>
                        )}
                      </div>

                      {/* Technical Report Inspection */}
                      <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-[10px] font-black text-slate-450 block">تقرير الفحص والتشخيص الفني الأولي:</span>
                        <p className="text-[11px] text-slate-600 font-bold leading-relaxed line-clamp-2">
                          {order.notes || "لا يوجد تقرير فني متاح، تم ترحيل البطاقة بانتظار معاينة المشرف."}
                        </p>
                      </div>

                      {/* Financial Quoted Values */}
                      <div className="flex items-center justify-between border-t border-dashed pt-3">
                        <div className="text-right">
                          <span className="text-[10px] font-black text-slate-450 block">التسعير المالي المقترح:</span>
                          <span className="text-sm font-black text-slate-800 font-mono">
                            {estCost.toLocaleString()} ج.م
                          </span>
                        </div>
                        <div className="text-left text-[10px] font-bold text-slate-450">
                          تشمل {partsCount} من قطع الغيار
                        </div>
                      </div>

                      {/* Interactive Actions Grid */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {/* Simulate Link Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSimOrder(order);
                            setIsSimulatingLink(true);
                            toast.success(`📱 تم تشغيل محاكي الهاتف الذكي لعقد الصيانة DEV-${order.id}`);
                          }}
                          className="p-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10.5px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 hover:shadow-xs shadow-3xs"
                        >
                          <SmartphoneIcon className="w-3.5 h-3.5" />
                          معاينة البوابة الرقمية 📱
                        </button>

                        {/* Send Notification Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenNotificationModal(order)}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 font-black text-[10.5px] rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          إرسال إشعار الرابط 📢
                        </button>
                      </div>

                      {/* Force actions */}
                      <div className="flex gap-2 justify-end border-t border-slate-100 pt-2 text-[10px] font-bold">
                        <span className="text-slate-400 self-center">تحديث يدوي:</span>
                        <button
                          onClick={() => handleManualApprove(order.id!)}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                        >
                          اعتماد موافقة
                        </button>
                        <button
                          onClick={() => handleManualReject(order.id!)}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-105 text-rose-800 rounded-lg border border-rose-150 transition-colors cursor-pointer"
                        >
                          اعتماد رفض
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* LEFT COLUMN: Customer Approval Portal Simulator Mockup */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-3xs text-right space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Smartphone className="w-4.5 h-4.5 text-indigo-600" />
                محاكي بوابة العميل التفاعلية
              </h2>
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            </div>

            {selectedSimOrder ? (
              <div className="space-y-4">
                <p className="text-[10.5px] text-slate-500 font-bold leading-relaxed">
                  هذا هو المظهر والموقع التفاعلي الذكي الذي يفتحه العميل عند النقر على رابط (WhatsApp/SMS). قم بإجراء الاختيار كأنه العميل لتلاحظ تأثير التحديث فوري ومباشر!
                </p>

                {/* Smartphone skin mockup wrapper */}
                <div className="mx-auto max-w-[340px] border-[10px] border-slate-900 rounded-[40px] shadow-2xl relative overflow-hidden bg-slate-50 min-h-[580px] flex flex-col justify-between">
                  {/* Speaker and Camera notch at top */}
                  <div className="absolute top-0 inset-x-0 h-5 bg-slate-900 flex items-center justify-center z-30">
                    <div className="w-16 h-3 bg-slate-800 rounded-full"></div>
                  </div>

                  {/* Client Portal Mobile App Layout Inside the skin */}
                  <div className="flex-1 flex flex-col pt-6 text-right select-text text-slate-800">
                    
                    {/* Brand Banner */}
                    <div className="bg-slate-900 text-white p-4.5 py-4 flex items-center justify-between shadow-xs">
                      <div>
                        <h4 className="text-xs font-black tracking-tight flex items-center gap-1 justify-start">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          ورشة الصيانة الرقمية
                        </h4>
                        <span className="text-[9px] text-slate-350 font-medium block">مركز الصيانة وسلسلة اللوجستيات الذكية</span>
                      </div>
                      <span className="text-[9px] font-black bg-rose-600 text-white p-0.5 px-2 rounded-md">
                        بوابة معتمدة
                      </span>
                    </div>

                    {/* Pending review or status view */}
                    <div className="p-4 space-y-3.5 overflow-y-auto max-h-[460px] leading-relaxed">
                      
                      {/* Greeting with Ukrainian Christian standard name */}
                      <div className="space-y-1 border-b border-slate-200 pb-2">
                        <span className="text-[10px] font-bold text-slate-450 block">مرحباً بك عزيزنا العميل</span>
                        <h3 className="text-xs font-extrabold text-slate-900">المحترم/ {selectedSimOrder.customerName} 👋</h3>
                        <p className="text-[9px] text-slate-650 font-bold">نشكرك على مراجعة حالة إصلاح جهازك على خوادمنا الموثوقة.</p>
                      </div>

                      {/* Device label card */}
                      <div className="bg-white p-3 rounded-xl border border-slate-150 shadow-3xs space-y-2">
                        <div className="flex items-center justify-between text-[9.5px]">
                          <span className="font-bold text-slate-450">الجهاز المسجل للصيانة:</span>
                          <span className="font-extrabold text-indigo-700">DEV-{selectedSimOrder.id}#</span>
                        </div>
                        <div className="flex items-center gap-1.5 justify-start">
                          {selectedSimOrder.deviceType === 'computer' ? <Laptop className="w-4 h-4 text-slate-500" /> : <Smartphone className="w-4 h-4 text-slate-500" />}
                          <span className="text-xs font-black text-slate-800">
                            {selectedSimOrder.deviceBrand} - {selectedSimOrder.deviceModel}
                          </span>
                        </div>
                      </div>

                      {/* Actual Diagnostic Report */}
                      <div className="bg-slate-100/80 p-3.5 rounded-xl border border-slate-205 text-xs text-right space-y-1.5">
                        <span className="text-[9.5px] font-black text-slate-500 flex items-center gap-1 justify-start">
                          <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          تقرير المعاينة وتشخيص مهندس الورشة:
                        </span>
                        <p className="text-[10px] text-slate-750 font-bold leading-relaxed whitespace-pre-line">
                          {selectedSimOrder.notes || "تلف في كابلات الشاشة الرئيسية مع ضرورة تجديد مسار الشحن الكهربي وتغيير مكثف الطاقة."}
                        </p>
                      </div>

                      {/* Pricing list detail */}
                      <div className="space-y-2">
                        <span className="text-[9.5px] font-black text-slate-500 block">تفصيل الفاتورة المالية وعروض قطع الغيار:</span>
                        
                        <div className="bg-white rounded-xl border border-slate-150 p-3 space-y-2 shadow-3xs text-[10px]">
                          {/* Lists attached parts, or mock one if empty */}
                          {selectedSimOrder.parts && selectedSimOrder.parts.length > 0 ? (
                            selectedSimOrder.parts.map((p, idx) => (
                              <div key={idx} className="flex items-center justify-between text-slate-700 border-b pb-1.5">
                                <span className="font-bold">{p.name} (x{p.quantity})</span>
                                <span className="font-mono font-black text-slate-900">{(p.price * p.quantity).toLocaleString()} ج.م</span>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center justify-between text-slate-700 border-b pb-1.5">
                              <span className="font-bold">مكونات الصيانة الشاملة والعمل الفني</span>
                              <span className="font-mono font-black text-slate-900">{(selectedSimOrder.expectedCost || selectedSimOrder.actualCost || 0).toLocaleString()} ج.م</span>
                            </div>
                          )}

                          {/* Workmanship fee and total */}
                          <div className="flex items-center justify-between pt-1 font-bold text-slate-500 text-[9px]">
                            <span>أجور الخدمة والضمان الشامل (90 يوماً):</span>
                            <span>مشمول بالخدمة</span>
                          </div>

                          <div className="flex items-center justify-between pt-1.5 border-t font-black text-slate-900 text-xs text-rose-600">
                            <span>القيمة الإجمالية النهائية المقدرة:</span>
                            <span className="font-mono underline">{(selectedSimOrder.actualCost || selectedSimOrder.expectedCost || 0).toLocaleString()} ج.م</span>
                          </div>
                        </div>
                      </div>

                      {/* Status indicator warning or confirmation depending on state */}
                      {selectedSimOrder.status === 'waiting_approval' ? (
                        <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl text-[9px] text-indigo-800 font-bold space-y-1 text-right">
                          <p>⚠️ ملاحظة هامة: في حال رفض الصيانة، يحق لكم استعادة الجهاز بالكامل من الورشة خلال 48 ساعة دون رسائل صيانة إضافية.</p>
                        </div>
                      ) : selectedSimOrder.status === 'repairing' ? (
                        <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-800 font-black flex flex-col items-center gap-1 text-center">
                          <Check className="w-5 h-5 text-emerald-600 block" />
                          <span>تم اعتماد الميزانية والبدء بالإصلاح الفوري!</span>
                          <p className="text-[10px] text-emerald-700 font-medium leading-relaxed">شكراً جزيلاً لثقتكم الكريمة. تم التوجيه التلقائي للمهندسين المختصين لبدء العمل مباشرة على طاولة صيانة المحترفين.</p>
                        </div>
                      ) : (
                        <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl text-xs text-rose-800 font-black flex flex-col items-center gap-1 text-center">
                          <X className="w-5 h-5 text-rose-600 block" />
                          <span>تم تسجيل رفض كارت الصيانة بنجاح</span>
                          <p className="text-[10px] text-rose-700 font-medium leading-relaxed">وقفت لوجستيات العمل على الجهاز. تم ترقيمه كمرتجع بدون تكلفة صيانة بالمركز، كاب الصيانة DEV-{selectedSimOrder.id} جاهز للاستلام كمرتجع.</p>
                        </div>
                      )}

                      {/* Action trigger buttons inside simulated mobile viewport */}
                      {selectedSimOrder.status === 'waiting_approval' && (
                        <div className="space-y-2 pt-2.5">
                          {/* Approve option */}
                          <button
                            type="button"
                            onClick={() => handleClientWebApproval(selectedSimOrder.id!)}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Check className="w-4 h-4" />
                            موافق على تفاصيل عروض الأسعار ونفقات الصيانة ✓
                          </button>

                          {/* Reject option */}
                          <button
                            type="button"
                            onClick={() => handleClientWebRejection(selectedSimOrder.id!)}
                            className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[10.5px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            أرفض الصيانة ورغبتي استلام الجهاز مرتجع بدون حل
                          </button>
                        </div>
                      )}

                    </div>

                    {/* Mobile Footer branding */}
                    <div className="border-t border-slate-200 p-3 bg-white text-center text-[8.5px] text-slate-400 font-bold mt-auto shrink-0 flex items-center justify-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      بوابة مشفرة رقمياً ببروتوكول تشفير معلمات الصيانة لوجستياً
                    </div>

                  </div>
                </div>

                {/* Cancel Simulator selection button */}
                <button
                  type="button"
                  onClick={() => setSelectedSimOrder(null)}
                  className="w-full text-center text-xs text-slate-400 hover:text-slate-600 font-bold block pt-2"
                >
                  إغلاق جهاز المحاكاة المعروض ✕
                </button>
              </div>
            ) : (
              <div className="p-12 border border-dashed border-slate-200 rounded-2xl text-center space-y-2 text-slate-400">
                <SmartphoneIcon className="w-10 h-10 mx-auto opacity-40 text-slate-500" />
                <p className="text-[11px] font-black leading-relaxed">
                  الرجاء اختيار أحد أجهزة كروت الصيانة المعلقة من القائمة المقابلة عبر زر <span className="font-extrabold text-slate-800">"معاينة البوابة الرقمية 📱"</span> لتفعيل محاكي الجوال ورابط الموافقة التفاعلي تلقائياً.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* MODAL OVERLAY: WhatsApp / SMS Notification Workspace Mockup */}
      {isNotificationModalOpen && activeMessageOrder && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 max-w-lg w-full space-y-4 shadow-xl text-right main-approvals-font">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 justify-start">
                <span className="w-3 h-3 bg-rose-500 rounded-full animate-pulse"></span>
                <h3 className="font-extrabold text-slate-900 text-sm">أداة توليد وإرسال رابط الموافقة الذكي للعملاء</h3>
              </div>
              <button
                onClick={() => setIsNotificationModalOpen(false)}
                className="text-slate-450 hover:text-slate-650 cursor-pointer text-sm font-black"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-right">
              {/* Customer summary */}
              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-150 flex items-center justify-between text-xs">
                <div className="text-right">
                  <span className="text-slate-450 block font-bold">العميل المستلم للرابط:</span>
                  <span className="font-extrabold text-slate-800">{activeMessageOrder.customerName}</span>
                </div>
                <div className="text-left">
                  <span className="text-slate-450 block font-bold">الهاتف النشط:</span>
                  <span className="font-mono font-extrabold text-slate-800">{activeMessageOrder.customerPhone}</span>
                </div>
              </div>

              {/* Message text container */}
              <div className="space-y-1.5 text-right">
                <label className="block text-xs font-black text-slate-800">صيغة إرسال رسالة الواتسآب و الـ SMS التلقائية:</label>
                <textarea
                  value={activeMessageText}
                  onChange={(e) => setActiveMessageText(e.target.value)}
                  className="w-full text-xs font-medium p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none min-h-[110px] text-slate-800 leading-relaxed text-right"
                />
              </div>

              {/* Notice info */}
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl flex items-start gap-2.5 text-right">
                <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-rose-800 font-bold leading-relaxed">
                  يحتوي هذا الإشعار على رمز رابط مشفر فريد <span className="font-mono font-black underline">http://approval-link.local/order/{activeMessageOrder.id}</span> لتتبع قرارات الموافقة والتسعيرة الخاصة بكل عميل وتحديث الورشة فورياً.
                </p>
              </div>
            </div>

            {/* Actions button */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleCopyClipboardText(activeMessageText);
                  setIsNotificationModalOpen(false);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                نسخ نص الرسالة والرابط الذكي وتأكيد مع العميل
              </button>
              <button
                type="button"
                onClick={() => setIsNotificationModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 font-black text-xs rounded-xl transition-colors cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast provider */}
      <Toaster position="bottom-left" />

    </div>
  );
};

export default ComputerMobileApprovals;
