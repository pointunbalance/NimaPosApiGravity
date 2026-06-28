import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { MaintenanceOrder, Supplier } from '../../types';
import { 
  AlertOctagon, Trash2, Gavel, Archive, DollarSign, Calendar, Clock,
  Search, ShieldAlert, BadgeInfo, Scale, Check, X, FileText, Send, UserCheck, 
  HelpCircle, RefreshCw, BarChart3, Plus, ArrowLeftRight, Landmark, Layers, Info
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

// Web Audio API beep helper to maintain 100% offline-friendly state
const playSound = (type: 'beep_ok' | 'beep_warning' | 'beep_success') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'beep_ok') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'beep_warning') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(293.66, ctx.currentTime); // D4
      osc.frequency.setValueAtTime(146.83, ctx.currentTime + 0.15); // D3
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.08); // G5
      osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.16); // C6
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.45);
    }
  } catch (e) {
    console.warn("Audio Context blocked or unsupported.", e);
  }
};

const ComputerMobileAbandoned: React.FC = () => {
  // Live queries
  const orders = useLiveQuery(() => db.maintenanceOrders.toArray()) || [];
  
  // States
  const [overdueThresholdDays, setOverdueThresholdDays] = useState<number>(90);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'unclaimed' | 'liquidated_sold' | 'liquidated_scrap'>('unclaimed');
  
  // Selection and Modal State
  const [selectedOrderForLiquidation, setSelectedOrderForLiquidation] = useState<MaintenanceOrder | null>(null);
  const [decisionType, setDecisionType] = useState<'sold' | 'scrap'>('sold');
  const [disposalRevenue, setDisposalRevenue] = useState<string>('1200');
  const [disposalNotes, setDisposalNotes] = useState<string>('');
  const [disposerName, setDisposerName] = useState<string>('ميكولا تسيخوتسكي'); // Ukrainian Manager
  
  // Final warning notification modal/state simulator
  const [warningOrder, setWarningOrder] = useState<MaintenanceOrder | null>(null);
  const [smsText, setSmsText] = useState<string>('');

  // Seeds database with sample old devices to demonstrate filter and mechanics
  useEffect(() => {
    const seedOldDevices = async () => {
      const orderCount = await db.maintenanceOrders.count();
      
      // We check if we need to add explicitly old/abandoned devices for demonstration
      const hasOldDevice = orders.some(o => {
        if (!o.date) return false;
        const diff = Date.now() - new Date(o.date).getTime();
        const days = diff / (1000 * 3600 * 24);
        return days > 90;
      });

      if (orderCount === 0 || !hasOldDevice) {
        const date95DaysAgo = new Date();
        date95DaysAgo.setDate(date95DaysAgo.getDate() - 95);

        const date130DaysAgo = new Date();
        date130DaysAgo.setDate(date130DaysAgo.getDate() - 130);

        const date185DaysAgo = new Date();
        date185DaysAgo.setDate(date185DaysAgo.getDate() - 185);

        await db.maintenanceOrders.bulkAdd([
          {
            date: date130DaysAgo,
            customerId: 110,
            customerName: 'ياروسلاف أندرييف',
            customerPhone: '01009955443',
            deviceType: 'mobile',
            deviceBrand: 'Samsung',
            deviceModel: 'Galaxy S21 Ultra',
            deviceSerial: 'SN-SAM-S21-9921',
            expectedCost: 1800,
            actualCost: 1800,
            deposit: 300,
            status: 'ready', // ready for pickup but never picked up!
            shelfCode: 'رف B-2',
            issueDescription: 'شاشة مكسورة تحتاج تغيير وتعديل فلاتة الشحن',
            notes: 'الفني بوهدان لسينكو انتهى من العمل منذ 4 أشهر وحالة الاتصال الهاتفي بالعميل تفيد بأنه يرفض سداد الفاتورة لتركه الدولة.',
            parts: [{ name: 'شاشة بديلة وقاعدة شحن نوع C', quantity: 1, price: 1500, cost: 800 }]
          },
          {
            date: date185DaysAgo,
            customerId: 111,
            customerName: 'أولغا سيريبرينكو',
            customerPhone: '01223399441',
            deviceType: 'computer',
            deviceBrand: 'Lenovo',
            deviceModel: 'IdeaPad 3',
            deviceSerial: 'SN-LENO-88432-UA',
            expectedCost: 2800,
            actualCost: 2500,
            deposit: 0,
            status: 'waiting_parts', // left midway during diagnostic/parts waiting
            shelfCode: 'رف الأجهزة المهملة D',
            issueDescription: 'لوحة أم تالفة وتحتاج صيانة بمسارات الطاقة الحيوية',
            notes: 'العميل تواصل معنا مرة واحدة ثم أغلق خطه منذ نصف سنة تقريباً. تم نقل الجهاز لقسم المهملات القانوني.',
            parts: []
          },
          {
            date: date95DaysAgo,
            customerId: 112,
            customerName: 'بوهدان بافليوك',
            customerPhone: '01199338822',
            deviceType: 'mobile',
            deviceBrand: 'Apple',
            deviceModel: 'iPhone 12 Pro',
            deviceSerial: 'IMEI-88221832128',
            expectedCost: 3200,
            actualCost: 3000,
            deposit: 500,
            status: 'abandoned', // explicitly marked
            shelfCode: 'رف الكهنة خلف الورشة',
            issueDescription: 'تغيير الشاشة الخلفية وهيكل حماية الجهاز',
            notes: 'تم فحص الشاشات والقطع ونقل الجهاز هنا لمرور المدة القانونية للصيانة والبالغة 90 يوماً.',
            parts: []
          }
        ]);
      }
    };
    seedOldDevices();
  }, [orders]);

  // Helper to compute age in days
  const getDeviceAgeInDays = (orderDate: any): number => {
    if (!orderDate) return 0;
    const dateObj = new Date(orderDate);
    const diffTime = Math.abs(Date.now() - dateObj.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  // Main compute and filter of orders
  const filteredOrders = orders.filter(order => {
    const ageInDays = getDeviceAgeInDays(order.date);
    const matchesSearch = 
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.deviceModel && order.deviceModel.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.deviceSerial && order.deviceSerial.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.customerPhone && order.customerPhone.includes(searchQuery));

    // Exclude complete normal cycles unless liquidated
    // Liquidated status is checked via order.disposalStatus
    const isLiquidated = order.disposalStatus && order.disposalStatus !== 'none';
    const isOverdue = ageInDays >= overdueThresholdDays && order.status !== 'delivered' && order.status !== 'cancelled';
    const isExplicitlyAbandoned = order.status === 'abandoned';

    // Apply Filter Type
    if (filterType === 'all') {
      return matchesSearch && (isOverdue || isExplicitlyAbandoned || isLiquidated);
    }
    if (filterType === 'unclaimed') {
      return matchesSearch && (isOverdue || isExplicitlyAbandoned) && !isLiquidated;
    }
    if (filterType === 'liquidated_sold') {
      return matchesSearch && order.disposalStatus === 'sold';
    }
    if (filterType === 'liquidated_scrap') {
      return matchesSearch && order.disposalStatus === 'scrap';
    }

    return false;
  });

  // Calculate stats for KPIs
  const totalUnclaimedOverdue = orders.filter(o => {
    const age = getDeviceAgeInDays(o.date);
    return age >= overdueThresholdDays && o.status !== 'delivered' && o.status !== 'cancelled' && !o.disposalStatus;
  }).length;

  const totalDepositsOnOverdue = orders.filter(o => {
    const age = getDeviceAgeInDays(o.date);
    return age >= overdueThresholdDays && o.status !== 'delivered' && o.status !== 'cancelled' && !o.disposalStatus;
  }).reduce((sum, o) => sum + (o.deposit || 0), 0);

  const potentialRevenueLoss = orders.filter(o => {
    const age = getDeviceAgeInDays(o.date);
    return age >= overdueThresholdDays && o.status !== 'delivered' && o.status !== 'cancelled' && !o.disposalStatus;
  }).reduce((sum, o) => sum + (o.actualCost || o.expectedCost || 0), 0);

  const totalLiquidatedCount = orders.filter(o => o.disposalStatus && o.disposalStatus !== 'none').length;
  const liquidatedRevenueSum = orders.filter(o => o.disposalStatus === 'sold').reduce((sum, o) => sum + (o.disposalRevenue || 0), 0);

  // Trigger Action: Confirm Liquidation of device
  const handleLiquidateConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForLiquidation || !selectedOrderForLiquidation.id) return;

    try {
      const revenue = parseFloat(disposalRevenue) || 0;
      const orderId = selectedOrderForLiquidation.id;

      let accountingStatus = "";
      
      // Update the MaintenanceOrder database entry
      const updateData: Partial<MaintenanceOrder> = {
        status: decisionType === 'sold' ? 'delivered' : 'cancelled', // mark appropriately
        disposalStatus: decisionType,
        disposalRevenue: decisionType === 'sold' ? revenue : 0,
        disposalDate: new Date().toISOString(),
        disposalNotes: `تم اتخاذ قرار التصفية برئاسة المدير ${disposerName}. التفاصيل: ${disposalNotes || 'لا توجد ملاحظات إضافية'}`
      };

      await db.maintenanceOrders.update(orderId, updateData);

      // Financial Integration - Record Journal Entry for outstanding revenue
      if (decisionType === 'sold' && revenue > 0) {
        // Journal entry: Debit Cash (1010), Credit Maintenance Revenue / Extraordinary gain (4050)
        const journalRef = `JV-LIQ-${orderId}`;
        const todayStr = new Date().toISOString().split('T')[0];

        const acc1010 = await db.accounts.where('code').equals('1010').first() || { id: 1010, name: 'الصندوق' };
        const acc4050 = await db.accounts.where('code').equals('4050').first() || { id: 4050, name: 'إيرادات خدمات صيانة' };

        await db.journalEntries.add({
          date: new Date(todayStr),
          reference: journalRef,
          description: `تصفية وبيع الجهاز المهمل #${orderId} للعميل المتهرب ${selectedOrderForLiquidation.customerName} - الموديل: ${selectedOrderForLiquidation.deviceModel}`,
          lines: [
            { accountId: acc1010.id || 1010, accountName: acc1010.name, debit: revenue, credit: 0 },
            { accountId: acc4050.id || 4050, accountName: acc4050.name, debit: 0, credit: revenue }
          ],
          totalAmount: revenue,
          status: 'posted'
        });
        accountingStatus = "✓ تم توليد سند القيد المحاسبي (#" + journalRef + ") وتغذية الخزائن الاستثنائية بنجاح.";
      } else if (decisionType === 'scrap') {
        // Check if user wants to add to scrap components inventory.
        // We log a generic note or journal showing asset write-off / write-in.
        const journalRef = `JV-SCR-${orderId}`;
        const todayStr = new Date().toISOString().split('T')[0];
        
        const acc1040 = await db.accounts.where('code').equals('1040').first() || { id: 1040, name: 'مخزون البضائع' };
        const acc4050 = await db.accounts.where('code').equals('4050').first() || { id: 4050, name: 'إيرادات خدمات صيانة' };

        // Scrap might have zero immediate cash but logs inventory increase for spare parts
        await db.journalEntries.add({
          date: new Date(todayStr),
          reference: journalRef,
          description: `تفكيك الجهاز المهمل لقطع الغيار #${orderId} للعميل ${selectedOrderForLiquidation.customerName}`,
          lines: [
            { accountId: acc1040.id || 1040, accountName: acc1040.name, debit: 150, credit: 0 },
            { accountId: acc4050.id || 4050, accountName: acc4050.name, debit: 0, credit: 150 }
          ],
          totalAmount: 150,
          status: 'posted'
        });
        accountingStatus = "✓ تم نقل المكونات لمخزون القطع المستعملة وتسجيل قيد إيجابي بقيمة تخمينية للأجزاء النافعة.";
      }

      playSound('beep_success');
      toast.success(`✓ تم إنهاء تصفية وتخريد الجهاز بنجاح! ${accountingStatus}`);
      setSelectedOrderForLiquidation(null);
      setDisposalNotes('');
    } catch (err) {
      toast.error('أخفق تحديث وتصفية الجهاز برمجياً');
    }
  };

  // Trigger Action: Final Warning SMS Simulator
  const handleSendWarningSms = (order: MaintenanceOrder) => {
    playSound('beep_ok');
    setWarningOrder(order);
    
    // Auto populate template with Ukrainian Christian customer references
    const text = `عزيزنا العميل ${order.customerName}، نفيدكم بأن جهازكم (${order.deviceBrand || ''} ${order.deviceModel}) مسجل بورشة الصيانة تحت رقم كرت #DEV-${order.id} قد تجاوز فترات الاستلام القانونية البالغة 90 يوماً. يرجى التكرم بزيارة المحل للاستحقاق في غضون 7 أيام وإلا سيضطر المحل لتصفيته قانونياً لتغطية النفقات.`;
    setSmsText(text);
  };

  const executeSendSms = () => {
    playSound('beep_success');
    toast.success(`✓ تم إرسال رسالة الإنذار النهائي بنجاح ومحاكاة التسليم لهاتف العميل: ${warningOrder?.customerPhone}`);
    setWarningOrder(null);
  };

  return (
    <div className="p-6 select-none max-w-[1605px] mx-auto space-y-8 text-slate-800" dir="rtl">
      
      {/* Styles & Cairo font theme integration */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=Cairo:wght@300;400;500;600;700;800;900&display=swap');
        .abandoned-main-font {
          font-family: 'Tajawal', 'Cairo', sans-serif !important;
        }
      `}</style>
      
      <Toaster position="top-left" reverseOrder={false} />

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-rose-200 pb-5 abandoned-main-font">
        <div className="space-y-1 text-right">
          <div className="flex items-center gap-2.5 justify-start">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-200 shadow-3xs">
              <AlertOctagon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">إدارة لوجستيات الأجهزة المهملة والكهنة (Overdue Devices)</h1>
              <p className="text-[11.5px] text-slate-500 font-bold">بوابة حصر الأجهزة متجاوزة السنين والمدد القانونية للاستلام وتصفيتها إيرادياً ومخزنياً لتعويض نفقات الورشة</p>
            </div>
          </div>
        </div>

        {/* Informative Label */}
        <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-2 shrink-0">
          <label className="text-xs font-black text-rose-800 flex items-center gap-1">
            <Scale className="w-4 h-4 text-rose-600" />
            الوضع القانوني الافتراضي للفرز:
          </label>
          <span className="text-xs font-extrabold text-slate-700">تجاوز الورشة بمدة ≥ 90 يوماً</span>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5 abandoned-main-font">
        {/* KPI 1 */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-3xs flex items-center justify-between text-right">
          <div className="space-y-1">
            <span className="text-[11px] font-black text-slate-450 block">الأجهزة المهملة المعلقة حالياً</span>
            <span className="text-2xl font-black text-rose-600 font-mono block">
              {totalUnclaimedOverdue} أجهزة
            </span>
            <span className="text-[9.5px] font-bold text-rose-600 bg-rose-50 p-0.5 px-2 rounded-md w-fit border border-rose-100 block">
              طال انتظارها وبحاجة لقرار
            </span>
          </div>
          <div className="p-4 bg-rose-50 text-rose-500 rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-3xs flex items-center justify-between text-right">
          <div className="space-y-1">
            <span className="text-[11px] font-black text-slate-450 block">تكلفة الصيانة المعطلة والضياع</span>
            <span className="text-2xl font-black text-amber-600 block font-mono">
              {potentialRevenueLoss.toLocaleString()} <span className="text-xs">ج.م</span>
            </span>
            <span className="text-[9.5px] font-bold text-amber-600 bg-amber-50 p-0.5 px-2 rounded-md w-fit border border-amber-100 block">
              مجموع العمل الفني وقطع الرقع
            </span>
          </div>
          <div className="p-4 bg-amber-50 text-amber-500 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-3xs flex items-center justify-between text-right">
          <div className="space-y-1">
            <span className="text-[11px] font-black text-slate-450 block">مجموع العربونات المستلمة والملغاة</span>
            <span className="text-2xl font-black text-indigo-600 font-mono block">
              {totalDepositsOnOverdue.toLocaleString()} <span className="text-xs">ج.م</span>
            </span>
            <span className="text-[9.5px] font-bold text-indigo-600 bg-indigo-50 p-0.5 px-2 rounded-md w-fit border border-indigo-100 block">
              عربونات محتجزة حماية للمحل
            </span>
          </div>
          <div className="p-4 bg-indigo-50 text-indigo-500 rounded-2xl">
            <Landmark className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-3xs flex items-center justify-between text-right">
          <div className="space-y-1">
            <span className="text-[11px] font-black text-slate-450 block">استرداد التصفية والخردة المبيعة</span>
            <span className="text-2xl font-black text-emerald-600 font-mono block">
              {liquidatedRevenueSum.toLocaleString()} <span className="text-xs">ج.م</span>
            </span>
            <span className="text-[9.5px] font-bold text-emerald-600 bg-emerald-50 p-0.5 px-2 rounded-md w-fit border border-emerald-100 block">
              من مبيعات {totalLiquidatedCount} كراسات كهنة
            </span>
          </div>
          <div className="p-4 bg-emerald-50 text-emerald-500 rounded-2xl">
            <Scale className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Control filters panel */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-3xs flex flex-col md:flex-row items-center justify-between gap-4.5 abandoned-main-font">
        
        {/* Toggle Threshold slider */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-black text-slate-700 shrink-0">تحديد حد التجاوز القانوني:</span>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {[30, 60, 90, 180].map((days) => (
              <button
                key={days}
                onClick={() => {
                  setOverdueThresholdDays(days);
                  playSound('beep_ok');
                  toast.success(`✓ تم ضبط الفلترة القانونية للأجهزة المتروكة منذ ${days} يوماً أو أكثر`);
                }}
                className={`p-2 px-3.5 text-[11px] font-black rounded-lg transition-all cursor-pointer ${overdueThresholdDays === days ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                {days} يوماً
              </button>
            ))}
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="بحث باسم العميل، الموديل، السيريال..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-bold p-3 pr-4 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:bg-white focus:ring-1 focus:ring-rose-500 text-right"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
        </div>

        {/* Tab category selector */}
        <div className="flex gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setFilterType('unclaimed')}
            className={`flex-1 md:flex-none p-2.5 px-4 text-xs font-black rounded-xl transition-all cursor-pointer ${filterType === 'unclaimed' ? 'bg-rose-600 text-white' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
          >
            بانتظار القرار والتصرف ({orders.filter(o => {
              const age = getDeviceAgeInDays(o.date);
              return (age >= overdueThresholdDays || o.status === 'abandoned') && o.status !== 'delivered' && o.status !== 'cancelled' && !o.disposalStatus;
            }).length})
          </button>

          <button
            onClick={() => setFilterType('liquidated_sold')}
            className={`flex-1 md:flex-none p-2.5 px-4 text-xs font-black rounded-xl transition-all cursor-pointer ${filterType === 'liquidated_sold' ? 'bg-emerald-600 text-white' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
          >
            تم بيعها لتغطية النفقات ({orders.filter(o => o.disposalStatus === 'sold').length})
          </button>

          <button
            onClick={() => setFilterType('liquidated_scrap')}
            className={`flex-1 md:flex-none p-2.5 px-4 text-xs font-black rounded-xl transition-all cursor-pointer ${filterType === 'liquidated_scrap' ? 'bg-slate-800 text-white' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
          >
            تم تخريدها للاستفادة منها ({orders.filter(o => o.disposalStatus === 'scrap').length})
          </button>

          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 md:flex-none p-2.5 px-4 text-xs font-black rounded-xl transition-all cursor-pointer ${filterType === 'all' ? 'bg-slate-200 text-slate-700' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
          >
            الكل
          </button>
        </div>
      </div>

      {/* Main Table list */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-3xs text-right space-y-4 abandoned-main-font">
        <div className="flex border-b pb-3.5 items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900">سجل جرد كروت الصيانة المهملة وتواريخ العلوق بالورشة</h3>
            <p className="text-[11px] text-slate-400 font-bold">لائحة تفي بجميع متطلبات التتبع العكسي والإنذارات القانونية المنظمة لامتياز إدارة المعمل</p>
          </div>
          <span className="text-[10.5px] bg-slate-50 text-slate-500 font-black p-1 px-3.5 rounded-lg border">
            تم العثور على {filteredOrders.length} كروت صيانة
          </span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-20 text-center border-2 border-dashed border-slate-100 rounded-2xl space-y-3">
            <Archive className="w-12 h-12 text-slate-350 mx-auto opacity-30" />
            <h4 className="text-sm font-black text-slate-650">لا توجد أجهزة متطابقة مع شروط التصفية أو الفلترة</h4>
            <p className="text-[10.5px] text-slate-400 max-w-md mx-auto leading-relaxed">
              تأكد من ضبط السلايدر أو اختيار فئات بانتظار القرار ، لا توجد كروت مستهدفة بالنطاق الزمني الحالي.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-black border-b border-slate-200">
                  <th className="p-3.5">الرقم / كارت رقم</th>
                  <th className="p-3.5">العميل الهاتف</th>
                  <th className="p-3.5">الجهاز المسجل</th>
                  <th className="p-3.5">تاريخ الإيداع بالورشة</th>
                  <th className="p-3.5 text-center">المدة المنقضية</th>
                  <th className="p-3.5 text-left">التكاليف / العربون</th>
                  <th className="p-3.5 text-center">الحالة الإدارية</th>
                  <th className="p-3.5 text-left">إجراءات تصفية الكروت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold">
                {filteredOrders.map((order) => {
                  const age = getDeviceAgeInDays(order.date);
                  const isLiquidated = order.disposalStatus && order.disposalStatus !== 'none';
                  
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* ID */}
                      <td className="p-3.5">
                        <span className="font-extrabold text-slate-900 block">#DEV-{order.id}</span>
                        <span className="text-[10px] bg-slate-100 p-0.5 px-1.5 rounded-md text-slate-550 block w-fit font-mono mt-1">
                          {order.shelfCode || 'برف المهملات'}
                        </span>
                      </td>

                      {/* Customer Info (Ukrainian names priority!) */}
                      <td className="p-3.5 space-y-0.5">
                        <span className="font-black text-slate-800 block">{order.customerName}</span>
                        <span className="text-[10px] text-slate-450 block font-mono">{order.customerPhone}</span>
                      </td>

                      {/* Device model */}
                      <td className="p-3.5">
                        <span className="font-black text-slate-900">{order.deviceBrand} {order.deviceModel}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">{order.deviceSerial || 'بدون سيريال'}</span>
                      </td>

                      {/* Date details */}
                      <td className="p-3.5">
                        <span className="text-slate-700 font-mono block">
                          {new Date(order.date).toLocaleDateString('ar-EG')}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-bold">
                          المستلم عهود الفني: {order.technicianName || 'بوهدان لسينكو'}
                        </span>
                      </td>

                      {/* Code countdown age status */}
                      <td className="p-3.5 text-center font-mono">
                        <span className={`p-1 px-2.5 rounded-lg font-black text-xs ${age >= 180 ? 'bg-red-100 text-red-700' : age >= 90 ? 'bg-rose-100 text-rose-700 text-xs animate-pulse' : 'bg-amber-100 text-amber-700'}`}>
                          {age} يوم بالمتجر ⚠️
                        </span>
                      </td>

                      {/* Cost metrics */}
                      <td className="p-3.5 text-left text-xs space-y-0.5">
                        <div className="font-sans font-black text-slate-800">
                          التكلفة: {(order.actualCost || order.expectedCost || 0).toLocaleString()} ج.م
                        </div>
                        <div className="text-[10.5px] text-emerald-600">
                          عربون مسترد: {order.deposit ? `${order.deposit.toLocaleString()} ج.م` : 'لا يوجد'}
                        </div>
                      </td>

                      {/* Status badge */}
                      <td className="p-3.5 text-center">
                        {isLiquidated ? (
                          <span className={`p-1 px-2.5 rounded-lg border text-[10px] font-black ${order.disposalStatus === 'sold' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                            {order.disposalStatus === 'sold' ? '✓ تم البيع للتسوية' : '✓ تم التخريد قطع غيار'}
                          </span>
                        ) : (
                          <span className="p-1 px-2.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-150 text-[10px] font-black animate-pulse">
                            متروك بلا مطالبة ⚠️
                          </span>
                        )}
                      </td>

                      {/* Decisions Buttons */}
                      <td className="p-3.5 text-left">
                        {isLiquidated ? (
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-450 block font-bold leading-normal">
                              تاريخ القرار: {order.disposalDate ? new Date(order.disposalDate).toLocaleDateString('ar-EG') : 'امس'}
                            </span>
                            <span className="text-[10.5px] text-indigo-700 block max-w-sm ml-auto overflow-hidden text-ellipsis truncate text-right">
                              📝 {order.disposalNotes}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedOrderForLiquidation(order);
                                setDisposalRevenue((order.actualCost || order.expectedCost || 1200).toString());
                                playSound('beep_ok');
                              }}
                              className="p-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] rounded-lg cursor-pointer transition-all flex items-center gap-1"
                            >
                              <Gavel className="w-3.5 h-3.5" />
                              اتخاذ قرار تصفية قانونية للعهود
                            </button>
                            
                            <button
                              onClick={() => handleSendWarningSms(order)}
                              className="p-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] rounded-lg cursor-pointer transition-all flex items-center gap-1"
                            >
                              <Send className="w-3.5 h-3.5 text-amber-400" />
                              إنذار أخير للعميل
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: PRESET FOR DECISION LIQUIDATION */}
      {selectedOrderForLiquidation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 abandoned-main-font" dir="rtl">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 text-right space-y-6 animate-in fade-in-50 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-normal font-black text-rose-700 flex items-center gap-1.5">
                  <Gavel className="w-5 h-5" />
                  محاضر التصفية والتخريد القانوني للجهاز #DEV-{selectedOrderForLiquidation.id}
                </h3>
                <p className="text-[11px] text-slate-450 font-bold">بموجب إيصال الاستلام الموقع للعميل {selectedOrderForLiquidation.customerName} لتجاوز مهلة الـ 90 يوماً</p>
              </div>
              <button
                onClick={() => {
                  setSelectedOrderForLiquidation(null);
                  playSound('beep_warning');
                }}
                className="p-1 bg-slate-100 hover:bg-slate-200 rounded-full cursor-pointer text-slate-500"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Warning guidelines */}
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-start gap-2 text-rose-800 leading-relaxed font-bold text-[11px]">
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600 animate-bounce" />
              <div>
                إقرار المسؤولية القانونية: عند الإثبات البرمجي، يتم إسقاط حق العميل في المطالبة بالجهاز المسلم، ويتم إدراجه بقوائم المحاسبة إما كـ "إيراد استثنائي كلي" أو كـ "حركة خردة وقطع غيار ومكونات ورشة".
              </div>
            </div>

            <form onSubmit={handleLiquidateConfirm} className="space-y-4">
              {/* Decision radio toggle toggle */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-700">نوع وجناح قرار التصفية:</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${decisionType === 'sold' ? 'border-rose-600 bg-rose-50/50' : 'border-slate-150 hover:bg-slate-50'}`}>
                    <div className="space-y-1 text-right">
                      <span className="text-xs font-black text-slate-900 block">عرض وإجراء بيع مباشر</span>
                      <span className="text-[9.5px] text-slate-450 block">لتغطية خسائر وفاتورة التكليفات للورشة</span>
                    </div>
                    <input
                      type="radio"
                      name="decision_type"
                      checked={decisionType === 'sold'}
                      onChange={() => { setDecisionType('sold'); playSound('beep_ok'); }}
                      className="accent-rose-600"
                    />
                  </label>

                  <label className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${decisionType === 'scrap' ? 'border-amber-600 bg-amber-50/50' : 'border-slate-150 hover:bg-slate-50'}`}>
                    <div className="space-y-1 text-right">
                      <span className="text-xs font-black text-slate-900 block">تفكيك خردة وقطع داخلية</span>
                      <span className="text-[9.5px] text-slate-450 block">لتغذية مستودع قطع الغيار المستعملة</span>
                    </div>
                    <input
                      type="radio"
                      name="decision_type"
                      checked={decisionType === 'scrap'}
                      onChange={() => { setDecisionType('scrap'); playSound('beep_ok'); }}
                      className="accent-amber-600"
                    />
                  </label>
                </div>
              </div>

              {/* If type is sold, define price & buyer */}
              {decisionType === 'sold' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 block">قيمة البيع المحصلة نقداً (ج.م):</label>
                    <input
                      type="number"
                      required
                      value={disposalRevenue}
                      onChange={(e) => setDisposalRevenue(e.target.value)}
                      className="w-full text-xs font-bold p-3 border border-slate-200 rounded-xl bg-slate-5 font-mono text-right"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 block">المسؤول عن توقيع القرار:</label>
                    <select
                      value={disposerName}
                      onChange={(e) => setDisposerName(e.target.value)}
                      className="w-full text-[11.5px] font-black p-3 border border-slate-200 rounded-xl bg-slate-5 text-right"
                    >
                      <option value="ميكولا تسيخوتسكي">المدير / ميكولا تسيخوتسكي</option>
                      <option value="بوهدان لسينكو">المشرف الفني / بوهدان لسينكو</option>
                      <option value="تاراس كوزا">مدير الحسابات / تاراس كوزا</option>
                    </select>
                  </div>
                </div>
              )}

              {decisionType === 'scrap' && (
                <div className="bg-slate-50 p-3 rounded-2xl border text-[11px] text-slate-600 leading-relaxed font-bold">
                  ⚠️ سيقوم النظام بتخفيض مديونية العميل إلى الصفر، وتعديل حالة الجهاز إلى ملغى مع تدوين القيمة المستعملة في الحسابات العامة لقطع الصيانة المستفاد بها.
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">ملاحظات ومحضر التصفية (لأغراض الموثوقية والأرشيف):</label>
                <textarea
                  value={disposalNotes}
                  onChange={(e) => setDisposalNotes(e.target.value)}
                  placeholder="مثال: تم بيع اللابتوب كقطع مستعلمة لموديل مماثل لتكرار تهرب العميل لشهور طويلة وعدم الإجابة على الإنذارات."
                  rows={3}
                  className="w-full text-xs font-bold p-3 border border-slate-200 rounded-xl bg-slate-5 text-right focus:outline-none focus:ring-1 focus:ring-rose-500"
                ></textarea>
              </div>

              {/* Actions Footer Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t justify-end">
                <button
                  type="button"
                  onClick={() => { setSelectedOrderForLiquidation(null); playSound('beep_warning'); }}
                  className="p-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs rounded-xl cursor-pointer"
                >
                  إلغاء التراجع
                </button>
                <button
                  type="submit"
                  className="p-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-4 h-4 text-white" />
                  تأكيد توقيع قرار التصفية وإصدار القيد المحاسبي 💰
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: WARNING SMS INITIATOR */}
      {warningOrder && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 abandoned-main-font" dir="rtl">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 text-right space-y-5 animate-in fade-in-50 duration-200">
            
            <div className="flex items-start justify-between border-b pb-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-indigo-750 flex items-center gap-1.5">
                  <Send className="w-5 h-5 text-indigo-500 animate-bounce" />
                  إنذار نهائي ومحاكاة رسائل SMS / WhatsApp للعميل
                </h3>
                <p className="text-[10.5px] text-slate-400 font-bold">إبلاغ العميل بضرورة الاستحقاق لتلافي قرار التصفية القانوني للجهاز المسجل</p>
              </div>
              <button
                onClick={() => setWarningOrder(null)}
                className="p-1 bg-slate-100 hover:bg-slate-200 rounded-full cursor-pointer text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-xs text-slate-600 font-bold bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100">
                <p>هاتف المستلم: <span className="font-mono font-black text-indigo-900">{warningOrder.customerPhone}</span></p>
                <p>صاحب الجهاز: <span className="font-black text-indigo-900">{warningOrder.customerName}</span></p>
                <p>الجهاز العالق بالورشة: <span className="font-extrabold text-slate-900">{warningOrder.deviceBrand} {warningOrder.deviceModel}</span></p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">نص الرسالة التلقائي المولد:</label>
                <textarea
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  rows={5}
                  className="w-full text-xs font-bold p-3.5 border border-indigo-150 rounded-2xl bg-indigo-50/10 focus:outline-none focus:ring-1 focus:ring-indigo-600 leading-relaxed text-right"
                ></textarea>
              </div>
            </div>

            <div className="flex items-center gap-1.5 justify-end pt-2 border-t text-xs">
              <button
                onClick={() => setWarningOrder(null)}
                className="p-2.5 px-4 bg-slate-100 text-slate-600 font-bold rounded-xl cursor-pointer"
              >
                رجوع
              </button>
              <button
                onClick={executeSendSms}
                className="p-2.5 px-5 bg-indigo-650 hover:bg-indigo-700 text-white font-black rounded-xl cursor-pointer flex items-center gap-1 text-center"
              >
                <Check className="w-4 h-4 text-white" />
                إرسال الإنذار النهائي بالـ SMS الآن 📱
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ComputerMobileAbandoned;
