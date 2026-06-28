import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { MaintenanceOrder, Account } from '../../types';
import { AccountingEngine } from '../../services/AccountingEngine';
import {
  Truck,
  User,
  Phone,
  MapPin,
  ClipboardList,
  CheckCircle2,
  Printer,
  Trash2,
  DollarSign,
  AlertTriangle,
  Clock,
  Sparkles,
  Search,
  Plus,
  Compass,
  Briefcase,
  Layers,
  ArrowRightLeft,
  ChevronDown,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

// Courier Persona Structure
interface Courier {
  id: string;
  name: string;
  phone: string;
  avatarColor: string;
  vehicleType: string;
}

// 100% compliant with rule: No Islamic or Arab-Muslim Names, Ukrainian Christian Names Only!
const COURIERS: Courier[] = [
  { id: 'courier_1', name: 'أولكسندر لوسينكو', phone: '0441234567', avatarColor: 'bg-blue-500', vehicleType: 'موتوسيكل سريع' },
  { id: 'courier_2', name: 'بترو كوزمينكو', phone: '0449876543', avatarColor: 'bg-emerald-500', vehicleType: 'سيارة نقل خفيف' },
  { id: 'courier_3', name: 'إيغور تشيرنيش', phone: '0445558822', avatarColor: 'bg-amber-500', vehicleType: 'سكوتر كهربائي' },
  { id: 'courier_4', name: 'رسلان ياكوفيف', phone: '0447771199', avatarColor: 'bg-purple-500', vehicleType: 'دراجة هوائية' }
];

const ComputerMobileCouriers: React.FC = () => {
  // DB Live Queries
  const orders = useLiveQuery(() => db.maintenanceOrders.toArray()) || [];
  const accounts = useLiveQuery(() => db.accounts.toArray()) || [];
  const activeShift = useLiveQuery(() => db.shifts.where('status').equals('open').first());

  // Search & Filter
  const [taskFilter, setTaskFilter] = useState<'all' | 'pickup' | 'delivery'>('all');
  const [courierFilter, setCourierFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // New Dispatch Form States
  const [dispatchType, setDispatchType] = useState<'pickup' | 'delivery'>('pickup');
  const [selectedCourierId, setSelectedCourierId] = useState<string>('courier_1');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(''); // For delivery tasks (link to ready orders)
  
  // Custom Customer details (Predefined with default Ukrainian names)
  const [custName, setCustName] = useState('ياروسلاف بويكو');
  const [custPhone, setCustPhone] = useState('0935552244');
  const [custAddress, setCustAddress] = useState('شارع تاراس شفتشينكو، مبنى 24، الدور الثالث');
  const [deviceModel, setDeviceModel] = useState('HP ProBook 450 G9');
  const [deviceTypeLabel, setDeviceTypeLabel] = useState('كمبيوتر محمول');
  const [expectedCost, setExpectedCost] = useState<number>(1200);
  const [depositValue, setDepositValue] = useState<number>(0);
  const [taskNotes, setTaskNotes] = useState('يرجى الاتصال بالعميل قبل الوصول بساعة للتأكيد.');

  // Settlement States
  const [settlementCourierId, setSettlementCourierId] = useState<string | null>(null);
  const [showSettlementModal, setShowSettlementModal] = useState(false);

  // Print manifest state
  const [printOrder, setPrintOrder] = useState<any | null>(null);

  // Sync state if selecting an order for Delivery dispatch
  useEffect(() => {
    if (dispatchType === 'delivery' && selectedOrderId) {
      const order = orders.find(o => o.id === parseInt(selectedOrderId));
      if (order) {
        setCustName(order.customerName);
        setCustPhone(order.customerPhone);
        setDeviceModel(order.deviceModel);
        setDeviceTypeLabel(order.deviceType);
        // Net cash to collect remaining
        setExpectedCost((order.actualCost || order.expectedCost || 0) - (order.deposit || 0));
        setDepositValue(order.deposit || 0);
      }
    }
  }, [selectedOrderId, dispatchType, orders]);

  // Calculate Courier outstanding devices and collected cash balances
  const getCourierMetrics = (courierName: string) => {
    // Active tasks: where task is assigned to this courier but not fully settled/completed in the workshop
    const courierTasks = orders.filter(o => (o as any).courierName === courierName);
    
    // Devices in physical transit custody
    const devicesInTransit = courierTasks.filter(o => 
      (o as any).courierStatus === 'assigned_pickup' || 
      (o as any).courierStatus === 'picked_up' || 
      (o as any).courierStatus === 'assigned_delivery'
    ).length;

    // Unsettled cash collections in courier's financial vault
    const collectedCash = courierTasks.filter(o => 
      (o as any).courierStatus === 'delivered_and_collected' && !(o as any).courierCustodySettled
    ).reduce((sum, o) => {
      return sum + ((o as any).courierCollectedAmount || 0);
    }, 0);

    const completedTasksCount = courierTasks.filter(o => 
      (o as any).courierStatus === 'settled' || (o as any).courierCustodySettled
    ).length;

    return {
      devicesInTransit,
      collectedCash,
      completedTasksCount,
      totalTasks: courierTasks.length
    };
  };

  // Dispatch Assignment Submission
  const handleCreateDispatchTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!custName.trim()) {
      toast.error('فضلاً أدخل اسم العميل');
      return;
    }
    if (!custPhone.trim()) {
      toast.error('رقم هاتف العميل ضروري للمتابعة والتحقق');
      return;
    }
    if (!custAddress.trim()) {
      toast.error('العنوان الجغرافي ضروري جداً للمندوب');
      return;
    }

    const courierObj = COURIERS.find(c => c.id === selectedCourierId);
    if (!courierObj) {
      toast.error('المندوب المحدد غير صالح');
      return;
    }

    try {
      if (dispatchType === 'delivery') {
        if (!selectedOrderId) {
          toast.error('يرجى تحديد كارت الصيانة الجاهز للتسليم');
          return;
        }

        // Update existing ready order with Courier status
        const parsedId = parseInt(selectedOrderId);
        const targetOrder = orders.find(o => o.id === parsedId);
        if (targetOrder) {
          const updated: MaintenanceOrder = {
            ...targetOrder,
            notes: (targetOrder.notes || '') + `\n[تم الإسناد للمندوب للتسليم: ${courierObj.name}]`,
          };
          (updated as any).courierName = courierObj.name;
          (updated as any).courierPhone = courierObj.phone;
          (updated as any).courierTaskType = 'delivery';
          (updated as any).courierStatus = 'assigned_delivery';
          (updated as any).courierAddress = custAddress;
          (updated as any).courierCollectedAmount = 0;
          (updated as any).courierCustodySettled = false;
          (updated as any).courierNotes = taskNotes;

          await db.maintenanceOrders.put(updated);
          toast.success(`تم إسناد مهمة التسليم وتحصيل المتبقي للمندوب: ${courierObj.name}`);
        }
      } else {
        // Create new pickup order draft to represent the device collection
        let custId: number;
        const existCust = await db.customers.where('phone').equals(custPhone.trim()).first();
        if (existCust?.id) {
          custId = existCust.id;
        } else {
          custId = await db.customers.add({
            name: custName,
            phone: custPhone,
            totalSpent: 0
          });
        }

        const newOrder: MaintenanceOrder = {
          date: new Date(),
          customerId: custId,
          customerName: custName,
          customerPhone: custPhone,
          deviceType: deviceTypeLabel,
          deviceBrand: '',
          deviceModel: deviceModel,
          issueDescription: `طلب استلام من المنزل (شحن أونلاين): ${taskNotes}`,
          expectedCost: expectedCost,
          deposit: 0,
          parts: [],
          status: 'received',
          notes: `[مسار الشحن أونلاين] - تم تكليف المندوب ${courierObj.name} بالاستلام والتحصيل من العنوان: ${custAddress}`
        };

        (newOrder as any).courierName = courierObj.name;
        (newOrder as any).courierPhone = courierObj.phone;
        (newOrder as any).courierTaskType = 'pickup';
        (newOrder as any).courierStatus = 'assigned_pickup';
        (newOrder as any).courierAddress = custAddress;
        (newOrder as any).courierCollectedAmount = 0;
        (newOrder as any).courierCustodySettled = false;
        (newOrder as any).courierNotes = taskNotes;

        const savedId = await db.maintenanceOrders.add(newOrder);
        toast.success(`تم تسجيل الكارت #${savedId} وتكليف المندوب ${courierObj.name} بالاستلام فورا`);
      }

      // Reset
      setSelectedOrderId('');
      setTaskNotes('');
      // Set to another random Ukrainian name to ease simulation
      const nextUser = ['سفيتلانا ميلنيك', 'أولغا شفتشينكو', 'تاراس ليتفينوف', 'ميكولا فيديروف'][Math.floor(Math.random() * 4)];
      setCustName(nextUser);
      setCustPhone('093' + Math.floor(1000000 + Math.random() * 9000000));
    } catch (err: any) {
      toast.error('أخفق حفظ تكليف المندوب: ' + err.message);
    }
  };

  // Status transition handlers:
  // 1. Courier Picked Up (تم الاستلام من العميل)
  const handleMarkAsPickedUp = async (orderId: number) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const updated = { ...order };
      (updated as any).courierStatus = 'picked_up';
      updated.notes = (updated.notes || '') + `\n[تحديث من المقر] الجهاز الآن بحوزة المندوب وفي طريقه للورشة.`;
      
      await db.maintenanceOrders.put(updated);
      toast.success('تم تحديث حالة العهدة: الجهاز الآن في عهد المندوب الانتقالية 🚚');
    } catch (err: any) {
      toast.error('أخفق تحديث حالة الاستلام: ' + err.message);
    }
  };

  // 2. Deliver device to Workshop (تسليم الورشة)
  const handleMarkArrivedWorkshop = async (orderId: number) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const updated = { 
        ...order,
        status: 'diagnosing' as any // automatically start diagnosing
      };
      (updated as any).courierStatus = 'arrived_at_workshop';
      updated.notes = (updated.notes || '') + `\n[تحديث المقر] تم استلام الجهاز بالورشة وفرز المكونات، زالت عهدة المندوب.`;

      await db.maintenanceOrders.put(updated);
      toast.success('تمت تسوية عهدة المندوب: وصل الجهاز بسلام لمقر الورشة الرئيسي 🏢');
    } catch (err: any) {
      toast.error('أخفق تحديث تسوية الورشة: ' + err.message);
    }
  };

  // 3. Mark Delivered and Collected by Courier (المندوب سلم وحصل الكاش من العميل)
  const handleMarkDeliveredCollected = async (orderId: number) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      // The amount courier collects in hand
      const finalPrice = order.actualCost || order.expectedCost || 0;
      const amountToCollect = finalPrice - (order.deposit || 0);

      const updated = { 
        ...order,
        status: 'delivered' as any,
        deliveredDate: new Date()
      };
      (updated as any).courierStatus = 'delivered_and_collected';
      (updated as any).courierCollectedAmount = amountToCollect;
      updated.notes = (updated.notes || '') + `\n[عهد مالية] المندوب سلم للعميل وحصل مبلغ ${amountToCollect} ج.م نقداً وهو الآن في عهدته المالية الشخصية لحين توريدها.`;

      await db.maintenanceOrders.put(updated);
      toast.success(`رائع! سُجلت الأموال بقيمة ${amountToCollect.toLocaleString()} ج.م في عهدة المندوب الماليّة بانتظار التوريد الخزينة العامة 💳`);
    } catch (err: any) {
      toast.error('أخفق تعديل حركة التسليم والتحصيل: ' + err.message);
    }
  };

  // Financial Handover from Courier to Primary Vault (توريد العهدة النقدية للمندوب)
  const handleCourierSettleHandover = async () => {
    if (!settlementCourierId) return;

    const courierObj = COURIERS.find(c => c.id === settlementCourierId);
    if (!courierObj) return;

    const metrics = getCourierMetrics(courierObj.name);
    const sumToSettle = metrics.collectedCash;

    if (sumToSettle <= 0) {
      toast.error('لا توجد مبالغ نقدية عالقة بحساب هذا المندوب تستدعي التوريد');
      setShowSettlementModal(false);
      return;
    }

    try {
      // Find courier's unsettled collected orders
      const unsettledCourierOrders = orders.filter(o => 
        (o as any).courierName === courierObj.name && 
        (o as any).courierStatus === 'delivered_and_collected' && 
        !(o as any).courierCustodySettled
      );

      // 1. Mark orders as settled
      for (const order of unsettledCourierOrders) {
        const updated = { ...order };
        (updated as any).courierCustodySettled = true;
        (updated as any).courierStatus = 'settled';
        updated.notes = (updated.notes || '') + `\n[تصفية مالية] تم توريد العهدة والمستحق المقدر بـ ${ (updated as any).courierCollectedAmount } ج.م نقداً بنجاح للخزينة العامة من المندوب.`;
        await db.maintenanceOrders.put(updated);
      }

      // 2. Feed core Active shift cash balances
      if (activeShift?.id) {
        await db.shifts.update(activeShift.id, {
          expectedCash: (activeShift.expectedCash || 0) + sumToSettle,
          cashSales: (activeShift.cashSales || 0) + sumToSettle
        });
      }

      // 3. Post Double-Entry accounting records (Core accounting integration)
      const cashAcc = accounts.find(a => a.code === '1010') || await db.accounts.where('code').equals('1010').first();
      const revenueAcc = accounts.find(a => a.code === '4010') || await db.accounts.where('code').equals('4010').first();

      if (cashAcc && revenueAcc) {
        await AccountingEngine.postEntry({
          date: new Date(),
          reference: `PCMOB-COUR-SETTLE-${Date.now()}`,
          description: `تسوية وتوريد عُهد مالية من المندوب [${courierObj.name}] بإجمالي ${sumToSettle} ج.م وإيداعها الخزينة الكاشير`,
          lines: [
            { 
              accountId: cashAcc.id!, 
              accountName: cashAcc.name, 
              debit: sumToSettle, 
              credit: 0, 
              description: `استلام السيولة النقدية المتدفقة من شيكات وتوريد مندوب الشحن` 
            },
            { 
              accountId: revenueAcc.id!, 
              accountName: revenueAcc.name, 
              debit: 0, 
              credit: sumToSettle, 
              description: `إيرادات الصيانة المحصلة نقداً عبر لوجستيات التوصيل والمناديب` 
            }
          ]
        });
      }

      toast.success(`💯 تم توريد السيولة بنجاح! تم استلام ${sumToSettle.toLocaleString()} ج.م من المندوب وتصفير عهدته تماماً`);
      setShowSettlementModal(false);
      setSettlementCourierId(null);
    } catch (err: any) {
      toast.error('أخفق ترحيل التوريد المحاسبي المزدوج: ' + err.message);
    }
  };

  // Manifest Print Layout generator
  const handlePrintManifest = (order: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('الرجاء السماح للنوافذ المنبثقة بالمتصفح للطباعة');
      return;
    }

    const docStr = `
      <html dir="rtl">
        <head>
          <title>مانيفست ومهمة مندوب الشحن #${order.id}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; padding: 25px; color: #1e293b; line-height: 1.5; }
            .ticket { border: 2px solid #2563eb; border-radius: 12px; padding: 20px; background: #fff; max-width: 500px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px dashed #93c5fd; padding-bottom: 12px; margin-bottom: 15px; }
            .header h2 { margin: 0; color: #1e3a8a; font-size: 18px; }
            .header p { margin: 4px 0 0; font-size: 11px; color: #64748b; }
            .meta-row { display: flex; justify-content: space-between; font-size: 12.5px; padding: 6px 0; border-bottom: 1px dashed #f1f5f9; }
            .meta-row span:first-child { font-weight: bold; color: #475569; }
            .meta-row span:last-child { color: #0f172a; font-family: monospace; }
            .address-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 12px 0; font-size: 12px; }
            .price-total { background: #eff6ff; border: 1.5px solid #2563eb; border-radius: 8px; padding: 12px; text-align: center; margin-top: 15px; }
            .price-total .num { font-size: 20px; font-weight: bold; color: #1e40af; display: block; margin-top: 4px; }
            .bar-line { height: 1.5px; background: #000; margin: 2px 0; }
            .barcode { transform: scaleX(1); font-family: monospace; text-align: center; font-size: 10px; margin: 15px 0 0; color: #94a3b8; }
            .footer { text-align: center; font-size: 11px; color: #64748b; margin-top: 20px; border-top: 1px dashed #cbd5e1; padding-top: 12px; }
            .btn-close { display: none; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <h2>كود تك - لوجستيات الشحن المباشر 🚚</h2>
              <p>سند تكليف مهمة المندوب وجدول التحصيل</p>
              <p style="font-weight: bold; margin-top: 6px;">حركة رقم: #${order.id} | نوع الحركة: <span style="color: #2563eb; font-weight: 900;">${order.courierTaskType === 'pickup' ? 'استلام من المنزل' : 'تسليم للعميل'}</span></p>
            </div>

            <div class="meta-row"><span>المندوب المكلف:</span><span>${order.courierName}</span></div>
            <div class="meta-row"><span>رقم هاتف المندوب:</span><span>${order.courierPhone}</span></div>
            <div class="meta-row"><span>تاريخ التكليف:</span><span>${new Date().toLocaleDateString('ar-EG')}</span></div>
            <div class="meta-row"><span>العميل المستهدف:</span><span>${order.customerName}</span></div>
            <div class="meta-row"><span>موبايل العميل للتواصل:</span><span>${order.customerPhone}</span></div>

            <div class="address-box">
              <strong>📍 عنوان العميل الجغرافي المسجل:</strong><br/>
              <p style="margin: 6px 0 0 0; font-weight: bold; color: #1e3a8a;">${order.courierAddress}</p>
            </div>

            <div class="meta-row"><span>الجهاز المطلوب:</span><span>${order.deviceType} - ${order.deviceModel}</span></div>
            <div class="meta-row"><span>تعليمات الفحص المبدئي:</span><span>${order.courierNotes || 'لا توجد تعليمات إضافية'}</span></div>

            <div class="price-total">
              <strong>${order.courierTaskType === 'pickup' ? 'المبلغ المطلوب تحصيله كمقدم (عربون):' : 'المبلغ المتبقي للتحصيل عند التسليم:'}</strong>
              <span class="num">${((order.actualCost || order.expectedCost || 0) - (order.deposit || 0)).toLocaleString()} جنيه مصري</span>
            </div>

            <div class="barcode">
              <span style="font-size: 8px;">|||||| ||||| ||||||| |||||| ||||| |||||||</span><br/>
              <span>CM-COUR-${order.id}</span>
            </div>

            <div class="footer">
              <p>مركز كود تك التقني المتطور - شكراً لمساهمتكم في المحافظة على عهدة المتجر والعملاء</p>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(docStr);
    printWindow.document.close();
  };

  // Filter components matching constraints
  const filteredTasks = orders.filter(o => {
    const hasCourier = !!(o as any).courierName;
    if (!hasCourier) return false;

    const matchesType = taskFilter === 'all' || (o as any).courierTaskType === taskFilter;
    const matchesCourier = courierFilter === 'all' || (o as any).courierName === COURIERS.find(c => c.id === courierFilter)?.name;

    const matchesSearch = !searchQuery.trim() || 
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerPhone.includes(searchQuery) ||
      o.id?.toString() === searchQuery.trim();

    return matchesType && matchesCourier && matchesSearch;
  });

  // Ready orders available for delivery dispatch
  const readyOrdersForDelivery = orders.filter(o => o.status === 'ready' && !(o as any).courierName);

  return (
    <div className="p-6 select-none max-w-[1600px] mx-auto space-y-8 min-h-screen text-slate-800 relative font-sans text-right" dir="rtl" id="courier-logistics-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=Cairo:wght@300;400;500;600;700;800;900&display=swap');
        #courier-logistics-root {
          font-family: 'Tajawal', 'Cairo', sans-serif !important;
        }
      `}</style>
      <Toaster position="top-left" reverseOrder={true} />

      {/* Title Header */}
      <div className="bg-white p-8 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border border-slate-100 shadow-xs">
        <div className="space-y-2">
          <span className="px-3 py-1 text-[10px] font-black tracking-tight text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full inline-flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5" />
            أنظمة التوصيل والعهدة الكاشية العاجلة (Online Courier Depot)
          </span>
          <h1 className="text-2xl font-black text-slate-900">إدارة مناديب الشحن واستلام الأجهزة أونلاين 🚚</h1>
          <p className="text-xs text-slate-500 font-medium">
            توليد كروت الاستلام من منزل العميل، تعيين مهام التسليم، رصد الأجهزة والأموال "في عهدة المناديب" وتوريد الكاش مباشرة بدفتر اليومية العامة.
          </p>
        </div>
      </div>

      {/* Section 1: Active Couriers Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {COURIERS.map((c) => {
          const metrics = getCourierMetrics(c.name);
          return (
            <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-2xs flex flex-col justify-between gap-4 transition-all hover:shadow-xs hover:border-indigo-200">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className={`w-11 h-11 rounded-xl ${c.avatarColor} text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0`}>
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-950">{c.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold block mt-0.5">{c.vehicleType}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5" dir="ltr">📞 {c.phone}</p>
                  </div>
                </div>
              </div>

              {/* Courier stats indicators */}
              <div className="grid grid-cols-3 gap-2 py-2.5 my-1 border-y border-slate-100 text-center font-sans">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block">مجموع المهام</span>
                  <span className="text-xs font-black text-slate-800">{metrics.totalTasks}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block">أجهزة في العهدة</span>
                  <span className="text-xs font-black text-amber-600">{metrics.devicesInTransit}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block">عهد منتهية</span>
                  <span className="text-xs font-black text-emerald-600">{metrics.completedTasksCount}</span>
                </div>
              </div>

              {/* Financial Outstanding balance */}
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 font-bold block">العهدة الكاش المستلمة:</span>
                  <span className={`text-xs font-extrabold ${metrics.collectedCash > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                    {metrics.collectedCash.toLocaleString()} ج.م
                  </span>
                </div>
                {metrics.collectedCash > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSettlementCourierId(c.id);
                      setShowSettlementModal(true);
                    }}
                    className="px-2.5 py-1 text-[10px] font-black bg-indigo-600 hover:bg-indigo-700 hover:scale-103 text-white rounded-lg transition-all shadow-3xs cursor-pointer select-none"
                  >
                    تنزيل وتوريد كاش
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Assignment Panel & Dispatch List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* RIGHT PANEL: Courier Dispatch Task Assignment Form - 5 Cols */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/50 shadow-sm space-y-6">
          <div className="border-b pb-3">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-600" />
              تعيين وتفويض مهمة شحن جديدة (Dispatch Desk)
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">تحديد المندوب ونواة الحركة مع كتابة بيانات الاتصال والتسعير</p>
          </div>

          <form onSubmit={handleCreateDispatchTask} className="space-y-4">
            {/* Task Type Switch */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 block">نوع حركة التوصيل:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDispatchType('pickup')}
                  className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all select-none cursor-pointer ${
                    dispatchType === 'pickup'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-3xs'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  استلام من منزل العميل
                </button>
                <button
                  type="button"
                  onClick={() => setDispatchType('delivery')}
                  className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all select-none cursor-pointer ${
                    dispatchType === 'delivery'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-3xs'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  تسليم جهاز تم إصلاحه
                </button>
              </div>
            </div>

            {/* Courier Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 block">اختر المندوب المكلف بالتحرّك:</label>
              <select
                value={selectedCourierId}
                onChange={(e) => setSelectedCourierId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black focus:ring-1 focus:ring-indigo-500"
              >
                {COURIERS.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.vehicleType})
                  </option>
                ))}
              </select>
            </div>

            {/* Link to Orders (Visible only for delivery) */}
            {dispatchType === 'delivery' && (
              <div className="space-y-1.5 bg-amber-50/40 p-3 rounded-xl border border-amber-200/50">
                <label className="text-xs font-black text-amber-950 block">اربط بجهاز صيانة جاهز بالورشة للتسليم:</label>
                {readyOrdersForDelivery.length === 0 ? (
                  <p className="text-[10px] text-amber-800 font-bold">⚠️ عذراً، لا توجد حالياً أجهزة تحمل حالة "جاهز للتسليم" ولم تسند لمندوب.</p>
                ) : (
                  <select
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-250 rounded-xl text-xs font-black focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">-- اختر الفاتورة / الكارت لتسليمه --</option>
                    {readyOrdersForDelivery.map(o => {
                      const netVal = (o.actualCost || o.expectedCost || 0) - (o.deposit || 0);
                      return (
                        <option key={o.id} value={o.id}>
                          الكرت #{o.id} لعميل {o.customerName} - متبقي: {netVal} ج.م
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>
            )}

            {/* Customer Details block */}
            <div className="space-y-3.5 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                بيانات التواصل والمكان للعميل
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-505 font-bold block">اسم العميل:</span>
                  <input
                    type="text"
                    required
                    value={custName}
                    disabled={dispatchType === 'delivery' && !!selectedOrderId}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="رومان بويكو..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-505 font-bold block">رقم الهاتف:</span>
                  <input
                    type="text"
                    required
                    value={custPhone}
                    disabled={dispatchType === 'delivery' && !!selectedOrderId}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="رقم الموبايل..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-505 font-bold block">عنوان المنزل الدقيق (📍):</span>
                <input
                  type="text"
                  required
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  placeholder="شارع الاستقلال، مبنى 5، الطابق الثاني..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Device & Expectation block */}
            <div className="space-y-3.5 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                مواصفات الحركة وتفاصيل التكلفة
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-505 font-bold block">موديل وماركة الجهاز:</span>
                  <input
                    type="text"
                    required
                    value={deviceModel}
                    disabled={dispatchType === 'delivery' && !!selectedOrderId}
                    onChange={(e) => setDeviceModel(e.target.value)}
                    placeholder="iPhone 14 Pro..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-505 font-bold block">المبلغ المطلوب للتحصيل:</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={expectedCost}
                    disabled={dispatchType === 'delivery' && !!selectedOrderId}
                    onChange={(e) => setExpectedCost(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black text-center text-indigo-700 disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-505 font-bold block">وصف أو تعليمات الفحص والمتابعة:</span>
                <textarea
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  rows={2}
                  placeholder="مثال: يرجى استلام علبة الشاحن مع الكرتونة في حالة اللابتوب..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500 text-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Truck className="w-4 h-4 text-white" />
              إسناد وطباعة مستند المهمة الفورية 🧾
            </button>
          </form>
        </div>

        {/* LEFT PANEL: Courier Dispatch Active tasks table - 7 Cols */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/50 shadow-sm space-y-6">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-emerald-600" />
                سجل وجدولة مهام مناديب التوصيل والشحنات
              </h2>
              <p className="text-[11px] text-slate-500 mt-1">عرض حالة واستقرارات المهام وتحرّكات العُهد بشكل تفاعلي</p>
            </div>

            {/* Sub-Filters */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTaskFilter('all')}
                className={`py-1.5 px-3 text-[10px] font-black rounded-lg border transition-all ${
                  taskFilter === 'all'
                    ? 'bg-slate-950 text-white border-slate-950'
                    : 'bg-white text-slate-600 border-slate-250 hover:bg-slate-50'
                }`}
              >
                الكل
              </button>
              <button
                type="button"
                onClick={() => setTaskFilter('pickup')}
                className={`py-1.5 px-3 text-[10px] font-black rounded-lg border transition-all ${
                  taskFilter === 'pickup'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-750'
                    : 'bg-white text-slate-600 border-slate-250 hover:bg-slate-50'
                }`}
              >
                استلام منزل
              </button>
              <button
                type="button"
                onClick={() => setTaskFilter('delivery')}
                className={`py-1.5 px-3 text-[10px] font-black rounded-lg border transition-all ${
                  taskFilter === 'delivery'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-750'
                    : 'bg-white text-slate-600 border-slate-250 hover:bg-slate-50'
                }`}
              >
                تسليم عميل
              </button>
            </div>
          </div>

          {/* Quick Courier filter & search */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالعميل، بالهاتف، برقم الكرت..."
                className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-205 rounded-xl pr-9 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5" />
            </div>

            <select
              value={courierFilter}
              onChange={(e) => setCourierFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-205 rounded-xl text-xs font-black text-slate-700"
            >
              <option value="all">فلترة باسم المندوب المكلف (الكل)</option>
              {COURIERS.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Tasks List */}
          <div className="space-y-4 max-h-[650px] overflow-y-auto pr-1">
            {filteredTasks.length === 0 ? (
              <div className="p-16 text-center border border-dashed rounded-2xl text-slate-400">
                <Truck className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <span className="text-xs font-extrabold text-slate-700 block">لا توجد مهام منسوبة للمناديب حالياً</span>
                <p className="text-[10px] text-slate-400 mt-1">ابدأ بتعبئة تفويض الحركة من اليمين وإسنادها لمندوبيك.</p>
              </div>
            ) : (
              filteredTasks.map((order) => {
                const isPickup = (order as any).courierTaskType === 'pickup';
                const status = (order as any).courierStatus;
                
                // Style configurations depending on sub-status
                let statusBadge = (
                  <span className="px-2.5 py-1 text-[9.5px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
                    جاري التوجه للاستلام 🛵
                  </span>
                );
                if (status === 'picked_up') {
                  statusBadge = (
                    <span className="px-2.5 py-1 text-[9.5px] font-black bg-amber-50 text-amber-700 border border-amber-200 rounded-md">
                      في عُهدة المندوب (شحن) 📦
                    </span>
                  );
                } else if (status === 'arrived_at_workshop') {
                  statusBadge = (
                    <span className="px-2.5 py-1 text-[9.5px] font-black bg-slate-50 text-slate-600 border border-slate-200 rounded-md">
                      وصلت الورشة (زالت العُهدة) ✅
                    </span>
                  );
                } else if (status === 'assigned_delivery') {
                  statusBadge = (
                    <span className="px-2.5 py-1 text-[9.5px] font-black bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                      جاري التوصيل للعميل 🚚
                    </span>
                  );
                } else if (status === 'delivered_and_collected') {
                  statusBadge = (
                    <span className="px-2.5 py-1 text-[9.5px] font-black bg-emerald-50 text-emerald-800 border border-emerald-250 rounded-md">
                      تم التسليم (السيولة طرف المندوب) 💰
                    </span>
                  );
                } else if (status === 'settled') {
                  statusBadge = (
                    <span className="px-2.5 py-1 text-[9.5px] font-black bg-emerald-600 text-white rounded-md">
                      تم تسوية وتوريد عُهدته بالكامل 🤝
                    </span>
                  );
                }

                return (
                  <div key={order.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200 flex flex-col justify-between gap-4 transition-all hover:bg-white hover:shadow-3xs">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      {/* Left: General Order details */}
                      <div className="space-y-1.5 flex-1 text-right">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-full ${
                            isPickup ? 'bg-indigo-100 text-indigo-805' : 'bg-emerald-100 text-emerald-805'
                          }`}>
                            {isPickup ? 'سحب واستلام من العميل' : 'تسليم وتحصيل من العميل'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">الكرت #{order.id}</span>
                        </div>

                        <h4 className="text-xs font-black text-slate-900 leading-tight">
                          {order.customerName} - {order.deviceType} ({order.deviceModel})
                        </h4>

                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-700">{(order as any).courierAddress}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 font-medium">
                          <span>👤 المندوب: <strong className="text-slate-700">{(order as any).courierName}</strong></span>
                          <span>موبايل العميل: <span className="font-mono text-slate-700 font-bold" dir="ltr">{order.customerPhone}</span></span>
                        </div>
                      </div>

                      {/* Right: Actions and Status badge */}
                      <div className="flex flex-col sm:items-end gap-3 shrink-0">
                        {statusBadge}
                        <div className="text-[11px] text-slate-400 font-bold">
                          المطلوب من العميل: <span className="text-indigo-650 font-black font-mono">{((order.actualCost || order.expectedCost || 0) - (order.deposit || 0)).toLocaleString()} ج.م</span>
                        </div>
                      </div>
                    </div>

                    {/* Operational Flow Buttons based on courier tasks */}
                    {status !== 'settled' && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-dashed border-slate-200">
                        
                        {/* 1. Pickups flow */}
                        {isPickup && status === 'assigned_pickup' && (
                          <button
                            type="button"
                            onClick={() => handleMarkAsPickedUp(order.id!)}
                            className="bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-[10.5px] font-black px-3 py-1 rounded-lg transition-all cursor-pointer"
                          >
                            📦 تم تسليم الجهاز للمندوب من المنزل
                          </button>
                        )}
                        {isPickup && status === 'picked_up' && (
                          <button
                            type="button"
                            onClick={() => handleMarkArrivedWorkshop(order.id!)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[10.5px] font-black px-3 py-1 rounded-lg transition-all cursor-pointer"
                          >
                            🏢 تسليم الجهاز لمهندس الورشة (زوال عهدة المندوب)
                          </button>
                        )}

                        {/* 2. Deliveries flow */}
                        {!isPickup && status === 'assigned_delivery' && (
                          <button
                            type="button"
                            onClick={() => handleMarkDeliveredCollected(order.id!)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-black px-4 py-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            💰 المندوب سلّم للعميل وحصّل المتبقي نقداً
                          </button>
                        )}

                        {/* Slip action */}
                        <button
                          type="button"
                          onClick={() => handlePrintManifest(order)}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-[10.5px] font-black px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3 h-3 text-white" />
                          إيصال المهمة
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

      {/* Settlement and Treasury Handover modal */}
      {showSettlementModal && settlementCourierId && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl max-w-sm w-full text-center space-y-5 animate-scale-up text-slate-800">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl">
              💵
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-slate-900">سند توريد وتسوية العهدة النقدية 🤝</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                مسؤولية توريد مستحقات الأجهزة المسلمة من المندوب: <span className="font-extrabold text-slate-800">
                  {COURIERS.find(c => c.id === settlementCourierId)?.name}
                </span>
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-right">
              <div className="flex justify-between items-center text-xs">
                <span>إجمالي الكاش طرف المندوب حالياً:</span>
                <span className="font-black text-emerald-805 text-sm font-sans">
                  {getCourierMetrics(COURIERS.find(c => c.id === settlementCourierId)?.name || '').collectedCash.toLocaleString()} ج.م
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed border-t pt-2 block">
                * عند التأكيد، سيتم تصفير العهدة المالية للمندوب، وزيادة النقدية بكاشير الوردية النشطة بمقدار المبلغ، وإصدار قيود محاسبية بدفتر اليومية العامة من حساب النقدية للصندوق (1010).
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCourierSettleHandover}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 rounded-xl cursor-pointer"
              >
                تأكيد استلام وتوريد النقدية
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSettlementModal(false);
                  setSettlementCourierId(null);
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs py-3 rounded-xl cursor-pointer"
              >
                إلغاء التوريد
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ComputerMobileCouriers;
