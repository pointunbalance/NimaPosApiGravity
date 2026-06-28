import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { MaintenanceOrder, MaintenanceStatus, TemporaryPartIssue, InventoryReservation } from '../../types';
import { 
  Monitor, Smartphone, Laptop, Tablet, Wrench, Search, AlertCircle, CheckCircle2, 
  Clock, X, Edit, Trash2, Printer, Plus, Cpu, HardDrive, Database, ShieldAlert, 
  Lock, DollarSign, UserCog, ClipboardList, Info, FileText, HelpCircle, Eye, RefreshCw,
  TrendingUp, BarChart3, Coins, Users, Award, Percent, Layers, Inbox, Scale, CheckCircle, Play, Droplets, Check, RefreshCcw
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

const ComputerMobileParts: React.FC = () => {
  // Live queries from local database
  const orders = useLiveQuery(() => db.maintenanceOrders.toArray()) || [];
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const temporaryIssues = useLiveQuery(() => db.temporaryPartIssues.toArray()) || [];
  const reservations = useLiveQuery(() => db.inventoryReservations.toArray()) || [];

  // Navigation states
  const [activeTab, setActiveTab] = useState<'inventory' | 'temporary' | 'reservations'>('inventory');

  // Parts filter and search states
  const [partSearch, setPartSearch] = useState('');
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);

  // New part creation states
  const [newPartName, setNewPartName] = useState('');
  const [newPartCategory, setNewPartCategory] = useState<'mobile' | 'pc'>('mobile');
  const [newPartPrice, setNewPartPrice] = useState<number>(0);
  const [newPartCost, setNewPartCost] = useState<number>(0);
  const [newPartStock, setNewPartStock] = useState<number>(10);

  // Temporary issue form states
  const [isTmpIssueModalOpen, setIsTmpIssueModalOpen] = useState(false);
  const [tmpOrderId, setTmpOrderId] = useState<number>(0);
  const [tmpProductId, setTmpProductId] = useState<number>(0);
  const [tmpTechnicianName, setTmpTechnicianName] = useState('أندري شيفشينكو');
  const [tmpQty, setTmpQty] = useState<number>(1);

  // Fail trial modal states
  const [isFailModalOpen, setIsFailModalOpen] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);
  const [returnCondition, setReturnCondition] = useState('مستعملة للتجربة - سليمة وصالحة لإعادة الاستخدام');

  // Reservation form states
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [resOrderId, setResOrderId] = useState<number>(0);
  const [resProductId, setResProductId] = useState<number>(0);
  const [resQty, setResQty] = useState<number>(1);

  // Parse and match components in the product categories list
  const parsedParts = products.filter(p => {
    const nameMatch = p.name.toLowerCase().includes(partSearch.toLowerCase()) || (p.barcode && p.barcode.toLowerCase().includes(partSearch.toLowerCase()));
    const isMntcCat = p.category === 'قطع غيار صيانة' || (p.name.includes('شاشة') || p.name.includes('رام') || p.name.includes('SSD') || p.name.includes('بطارية') || p.name.includes('فلاتة') || p.name.includes('معجون'));
    return nameMatch && isMntcCat;
  });

  // Technician Ukrainian Names for the selection list
  const techOptions = [
    'أندري شيفشينكو',
    'ميكولا بافلوف',
    'رومان كوفالينكو',
    'بوهدان لسينكو',
    'تاراس بوندارينكو',
    'ياروسلاف ميلنيك'
  ];

  const handleAddNewPartToVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartName.trim()) {
      toast.error('ضع اسم قطعة إلكترونية معبر وموديلها المتوافق');
      return;
    }
    if (newPartPrice <= 0) {
      toast.error('أدخل سعر بيع قطعة الغيار');
      return;
    }

    try {
      await db.products.add({
        name: newPartName,
        category: 'قطع غيار صيانة',
        description: `قطعة صيانة مخصصة لهواتف ${newPartCategory === 'mobile' ? 'الموبايل والتابلت' : 'الكمبيوتر واللابتوب'}`,
        stock: newPartStock,
        price: newPartPrice,
        costPrice: newPartCost || Math.floor(newPartPrice * 0.6),
        barcode: `PT-${newPartCategory.toUpperCase()}-${Math.floor(Date.now() / 1000).toString().substring(5)}`
      });

      toast.success('تم فرز قطعة الغيار الجديدة وتزويد مخزن الصيانة بها!');
      setIsPartModalOpen(false);
      setNewPartName('');
      setNewPartPrice(0);
      setNewPartCost(0);
      setNewPartStock(10);
    } catch(err) {
      toast.error('فشل إدراج الصنف');
    }
  };

  // Helper: Adding part structure & tracking cost update to maintenance invoice
  const addPartToMaintenanceOrderBill = async (orderId: number, productItem: any, qty: number) => {
    const order = await db.maintenanceOrders.get(orderId);
    if (!order) return;

    const currentParts = order.parts || [];
    const existingIndex = currentParts.findIndex(p => p.productId === productItem.id || p.name === productItem.name);
    
    if (existingIndex >= 0) {
      currentParts[existingIndex].quantity += qty;
    } else {
      currentParts.push({
        productId: productItem.id,
        name: productItem.name,
        quantity: qty,
        price: productItem.retailPrice || productItem.price || 0,
        cost: productItem.purchasePrice || productItem.costPrice || 0
      });
    }

    // Accumulate actual cost additions
    const addedCost = qty * (productItem.retailPrice || productItem.price || 0);
    const newActualCost = (order.actualCost || order.expectedCost || 0) + addedCost;

    await db.maintenanceOrders.update(orderId, {
      parts: currentParts,
      actualCost: newActualCost,
      status: 'repairing' // Set status to repairing as assembly in progress
    });
  };

  // 1. Temporary Issue Actions
  const handleCreateTmpIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tmpOrderId) {
      toast.error('الرجاء اختيار جهاز / عميل قيد الصيانة');
      return;
    }
    if (!tmpProductId) {
      toast.error('الرجاء اختيار قطعة الغيار المراد سحبها للتجربة');
      return;
    }
    if (tmpQty <= 0) {
      toast.error('الكمية يجب أن تكون أكبر من صفر');
      return;
    }

    const matchedProduct = products.find(p => p.id === tmpProductId);
    const matchedOrder = orders.find(o => o.id === tmpOrderId);

    if (!matchedProduct || !matchedOrder) {
      toast.error('بيانات النظام غير متطابقة ثانية');
      return;
    }

    if (matchedProduct.stock < tmpQty) {
      toast.custom((t) => (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-800 text-xs font-bold font-sans shadow-sm" dir="rtl">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>الرصيد المتاح بالمستودع ({matchedProduct.stock}) أقل من الكمية المطلوبة ({tmpQty}) لتجربة العطل!</span>
        </div>
      ));
      return;
    }

    try {
      // Decrement Inventory to lock it down from other agents
      const nextStock = matchedProduct.stock - tmpQty;
      await db.products.update(tmpProductId, { stock: nextStock });

      // Create Temporary issue record
      await db.temporaryPartIssues.add({
        orderId: tmpOrderId,
        productId: tmpProductId,
        productName: matchedProduct.name,
        quantity: tmpQty,
        technicianName: tmpTechnicianName,
        status: 'under_test',
        issueDate: new Date().toISOString()
      });

      toast.success(`تم سحب ${tmpQty} وحدة من [${matchedProduct.name}] مؤقتاً للتجربة عهدة للفني [${tmpTechnicianName}]`);
      setIsTmpIssueModalOpen(false);
      setTmpOrderId(0);
      setTmpProductId(0);
      setTmpQty(1);
    } catch (err) {
      toast.error('حدث خطأ أثناء تسجيل السحب المؤقت');
    }
  };

  const handleConfirmTmpIssueSuccess = async (issueId: number) => {
    try {
      const issue = await db.temporaryPartIssues.get(issueId);
      if (!issue) return;

      const matchedProduct = products.find(p => p.id === issue.productId);
      if (!matchedProduct) {
        toast.error('رقم الصنف مسح من النظام');
        return;
      }

      // 1. Update issue state
      await db.temporaryPartIssues.update(issueId, {
        status: 'sold',
        resolveDate: new Date().toISOString()
      });

      // 2. Append directly to invoice of order
      await addPartToMaintenanceOrderBill(issue.orderId, matchedProduct, issue.quantity);

      toast.success('تم تأكيد نجاح التجربة! أُدرجت القطعة تلقائياً في فاتورة صيانة العميل وتغير رصيدها لمباع.');
    } catch (err) {
      toast.error('تعذر معالجة نجاح التجربة');
    }
  };

  const handleOpenFailTrialModal = (issueId: number) => {
    setSelectedIssueId(issueId);
    setReturnCondition('مستعملة للتجربة - سليمة وصالحة لإعادة الاستخدام دون تضرر');
    setIsFailModalOpen(true);
  };

  const handleConfirmTmpIssueFail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssueId) return;

    try {
      const issue = await db.temporaryPartIssues.get(selectedIssueId);
      if (!issue) return;

      const matchedProduct = products.find(p => p.id === issue.productId);
      if (!matchedProduct) {
        toast.error('الصنف غير متوفر بالمخزون حالياً');
        return;
      }

      // 1. Return Part to inventory (increase stock back)
      const nextStock = matchedProduct.stock + issue.quantity;
      await db.products.update(issue.productId, { stock: nextStock });

      // 2. Update issue state with returning condition logs
      await db.temporaryPartIssues.update(selectedIssueId, {
        status: 'returned_used',
        conditionOnReturn: returnCondition,
        resolveDate: new Date().toISOString()
      });

      toast.success(`تم تسجيل فشل التجربة وإعادة القطع للمستودع وتحديث الرصيد التراكمي. حالة الإرجاع: ${returnCondition}`);
      setIsFailModalOpen(false);
      setSelectedIssueId(null);
    } catch (err) {
      toast.error('تعذر تسجيل تراجع التجربة');
    }
  };


  // 2. Reservation Actions
  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resOrderId) {
      toast.error('الرجاء اختيار جهاز العميل المراد الحجز لحسابه هاتفياً');
      return;
    }
    if (!resProductId) {
      toast.error('الرجاء اختيار قطعة الغيار الذكية المطلوبة للحجز');
      return;
    }
    if (resQty <= 0) {
      toast.error('أدخل كمية صحيحة للحجز');
      return;
    }

    const matchedProduct = products.find(p => p.id === resProductId);
    const matchedOrder = orders.find(o => o.id === resOrderId);

    if (!matchedProduct || !matchedOrder) {
      toast.error('البيانات غير متطابقة بالأجهزة');
      return;
    }

    if (matchedProduct.stock < resQty) {
      toast.error(`المخزون المتوفر (${matchedProduct.stock}) غير كافٍ للحجز!`);
      return;
    }

    try {
      // Decrement Inventory instantly (so POS or Sales workspace cannot see it or sell it by mistake!)
      const nextStock = matchedProduct.stock - resQty;
      await db.products.update(resProductId, { stock: nextStock });

      // Add Reservation Record
      await db.inventoryReservations.add({
        orderId: resOrderId,
        productId: resProductId,
        productName: matchedProduct.name,
        quantity: resQty,
        status: 'reserved',
        reservedAt: new Date().toISOString()
      });

      toast.success(`تم حجز ${resQty} وحدة من [${matchedProduct.name}] بنجاح، ومؤمنة تماماً ضد بيعها بطريق الخطأ في الصالة!`);
      setIsReserveModalOpen(false);
      setResOrderId(0);
      setResProductId(0);
      setResQty(1);
    } catch (err) {
      toast.error('تعذر تسجيل طلب الحجز الذكي');
    }
  };

  const handleConfirmReservationInstall = async (resId: number) => {
    try {
      const res = await db.inventoryReservations.get(resId);
      if (!res) return;

      const matchedProduct = products.find(p => p.id === res.productId);
      if (!matchedProduct) {
        toast.error('صنف الغيار مفقود');
        return;
      }

      // 1. Update reservation state
      await db.inventoryReservations.update(resId, {
        status: 'completed',
        resolvedAt: new Date().toISOString()
      });

      // 2. Append directly to device bill
      await addPartToMaintenanceOrderBill(res.orderId, matchedProduct, res.quantity);

      toast.success('تم تركيب القطعة المحجوزة وضم تكلفتها للفاتورة بصفة نهائية!');
    } catch (err) {
      toast.error('فشل اعتماد تركيب القطعة المحجوزة');
    }
  };

  const handleCancelReservation = async (resId: number) => {
    try {
      const res = await db.inventoryReservations.get(resId);
      if (!res) return;

      const matchedProduct = products.find(p => p.id === res.productId);
      if (!matchedProduct) {
        toast.error('الصنف غير متطابق');
        return;
      }

      // 1. Return stock
      const nextStock = matchedProduct.stock + res.quantity;
      await db.products.update(res.productId, { stock: nextStock });

      // 2. Mark Cancelled
      await db.inventoryReservations.update(resId, {
        status: 'cancelled',
        resolvedAt: new Date().toISOString()
      });

      toast.success('تم إلغاء الحجز الذكي للقطعة وإعادة الرصيد للمستودع العام فوراً.');
    } catch (err) {
      toast.error('تعذر إلغاء الحجز');
    }
  };


  const getPartVisualIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('رام') || n.includes('ram') || n.includes('ذاكرة')) {
      return (
        <div className="flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-amber-500/10 rounded-2xl mb-2 text-amber-600">
            <Cpu className="w-10 h-10 stroke-[1.25]" />
          </div>
          <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">وحدة ذاكرة عشوائية DDR</span>
        </div>
      );
    }
    if (n.includes('شاشة') || n.includes('screen') || n.includes('عرض')) {
      return (
        <div className="flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-indigo-500/10 rounded-2xl mb-2 text-indigo-600">
            <Smartphone className="w-10 h-10 stroke-[1.25]" />
          </div>
          <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">شاشة عرض وهيكل</span>
        </div>
      );
    }
    if (n.includes('بطارية') || n.includes('battery')) {
      return (
        <div className="flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-emerald-500/10 rounded-2xl mb-2 text-emerald-600">
            <Layers className="w-10 h-10 stroke-[1.25]" />
          </div>
          <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">بطارية ليثيوم هاتف</span>
        </div>
      );
    }
    if (n.includes('ssd') || n.includes('هارد') || n.includes('nv2') || n.includes('وحدة تخزين')) {
      return (
        <div className="flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-blue-500/10 rounded-2xl mb-2 text-blue-600">
            <HardDrive className="w-10 h-10 stroke-[1.25]" />
          </div>
          <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">وحدة تخزين فائقة السرعة</span>
        </div>
      );
    }
    if (n.includes('فلاتة') || n.includes('سوكت') || n.includes('flex') || n.includes('شريط')) {
      return (
        <div className="flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-cyan-500/10 rounded-2xl mb-2 text-cyan-600">
            <Database className="w-10 h-10 stroke-[1.25]" />
          </div>
          <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">فلاتة شحن وتوصيل بورد</span>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center text-center">
        <div className="p-4 bg-slate-500/10 rounded-2xl mb-2 text-slate-500">
          <Database className="w-10 h-10 stroke-[1.25]" />
        </div>
        <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">قطعة غيار دقيقة</span>
      </div>
    );
  };

  return (
    <div className="p-6 select-none max-w-[1600px] mx-auto space-y-8 tech-circuit-bg min-h-screen text-slate-800 relative font-sans" dir="rtl" id="computer-mobile-maintenance-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=Cairo:wght@300;400;500;600;700;800;900&display=swap');

        #computer-mobile-maintenance-root {
          font-family: 'Tajawal', 'Cairo', sans-serif !important;
        }

        .tech-circuit-bg {
          background-color: #f8fafc !important;
          background-image: none !important;
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
              القسم اللوجستي لمخزون الصيانة ومتابعة العهد
            </span>
            <span className="px-3 py-1 text-[10px] font-black text-slate-500 bg-transparent inline-flex items-center gap-1 select-none">
              محاكاة الأداء الفعلي لرقاقات البورد وشاشات الهواتف والكمبيوتر 🛠️📱
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">إدارة مستودع قطع الغيار واللائحة الذكية</h1>
              <p className="text-xs text-slate-500 font-medium">سحب مؤقت لتجربة الأعطال وقطع الغيار عهدة الفنيين مع تتبع الحجوزات الذكية</p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Tabs */}
      <div className="flex border-b border-slate-200 gap-6 mb-6">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-4 px-2 font-black text-sm transition-all relative ${
            activeTab === 'inventory' 
              ? 'text-orange-600 border-b-2 border-orange-600' 
              : 'text-slate-400 hover:text-slate-650'
          }`}
        >
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            <span>مخزون قطع غيار الورشة</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('temporary')}
          className={`pb-4 px-2 font-black text-sm transition-all relative ${
            activeTab === 'temporary' 
              ? 'text-orange-600 border-b-2 border-orange-600' 
              : 'text-slate-400 hover:text-slate-650'
          }`}
        >
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            <span>سحب عينات للتجربة والعهد</span>
            {temporaryIssues.filter(i => i.status === 'under_test').length > 0 && (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                {temporaryIssues.filter(i => i.status === 'under_test').length} قيد التجربة
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('reservations')}
          className={`pb-4 px-2 font-black text-sm transition-all relative ${
            activeTab === 'reservations' 
              ? 'text-orange-600 border-b-2 border-orange-600' 
              : 'text-slate-400 hover:text-slate-650'
          }`}
        >
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>حجز قطع الغيار الذكي</span>
            {reservations.filter(r => r.status === 'reserved').length > 0 && (
              <span className="bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                {reservations.filter(r => r.status === 'reserved').length} محجوز
              </span>
            )}
          </div>
        </button>
      </div>

      {/* 🔴 TAB 1: INVENTORY & WAREHOUSE */}
      {activeTab === 'inventory' && (
        <div className="space-y-8" id="mntc-parts-subpage">
          {/* Controls Bar */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-5 shadow-sm">
            <div className="relative w-full md:w-96">
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 pointer-events-none">
                <Search className="w-4.5 h-4.5 stroke-[1.5]" />
              </span>
              <input 
                type="text"
                placeholder="ابحث ببطاقة الـ IC، أو الشاشة، أو الرام..."
                value={partSearch}
                onChange={(e) => setPartSearch(e.target.value)}
                className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-150 rounded-2xl font-bold text-xs outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-right placeholder-slate-400 text-slate-700"
              />
            </div>

            <button
              onClick={() => setIsPartModalOpen(true)}
              className="w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white font-black text-xs px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-sm hover:shadow"
            >
              <Database className="w-4.5 h-4.5" />
              إدراج صنف غيار جديد للمخزون
            </button>
          </div>

          {/* Parts Grid */}
          {parsedParts.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm">
              <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-slate-800 mb-1.5 font-sans">لم يتم العثور على قطع غيار متوافقة</h3>
              <p className="text-slate-500 text-xs max-w-sm mx-auto leading-relaxed font-semibold">
                يرجى إضافة قطع صيانة جديدة لتغذية مخازن الغيار وتفعيل عمليات السحب والتجربة الذكية للعهد الصادرة للفنيين.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {parsedParts.map((part) => {
                const isLowStock = (part.stock || 0) <= 5;

                return (
                  <div key={part.id} className="group bg-white p-5 rounded-3xl border border-slate-150/85 hover:border-slate-350 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden min-h-[380px]">
                    
                    {/* TOP SECTION */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2.5">
                        <h4 className="font-bold text-slate-900 text-sm leading-snug font-sans tracking-tight block max-w-[70%] text-right font-black" title={part.name}>
                          {part.name}
                        </h4>
                        
                        {/* Low Stock Badge */}
                        <div className="shrink-0">
                          <span className={`px-2.5 py-1 text-[10px] font-black rounded-full inline-flex items-center gap-1 ${isLowStock ? 'bg-red-50 text-red-600 border border-red-100/70' : 'bg-emerald-50 text-emerald-600 border border-emerald-100/70'}`}>
                            {isLowStock && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>}
                            الرصيد: {part.stock || 0}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-[10.5px] text-slate-450 line-clamp-2 leading-relaxed text-right font-semibold">
                        {part.description || 'قطعة غيار برصيد عالي لتأمين عمليات الصيانة الفورية بالأجهزة'}
                      </p>
                    </div>

                    {/* MIDDLE SECTION */}
                    <div className="w-full h-36 bg-slate-50 border border-slate-100/50 rounded-2xl flex items-center justify-center relative overflow-hidden group-hover:bg-slate-100/50 transition-colors my-4">
                      <div className="absolute inset-x-0 bottom-0 top-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#e2e8f0_2px,transparent_2px)] [background-size:12px_12px]"></div>
                      <div className="relative z-10 transition-transform duration-300 group-hover:scale-105">
                        {getPartVisualIcon(part.name)}
                      </div>
                    </div>

                    {/* BOTTOM SECTION */}
                    <div className="space-y-3.5">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="bg-emerald-50 border border-emerald-100/60 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center shadow-3xs hover:bg-emerald-100/20 transition-all">
                          <div className="flex items-center gap-1 mb-1 text-emerald-700">
                            <Coins className="w-3.5 h-3.5 stroke-[1.5]" />
                            <span className="text-[9px] font-black leading-none">سعر بيع للعميل</span>
                          </div>
                          <span className="text-xs sm:text-sm font-black text-emerald-800 font-mono">
                            {(part.price || 0).toLocaleString()} ج.م
                          </span>
                        </div>

                        <div className="bg-zinc-50 border border-zinc-200/50 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center shadow-3xs hover:bg-zinc-100/50 transition-all">
                          <div className="flex items-center gap-1 mb-1 text-zinc-650">
                            <Search className="w-3.5 h-3.5 stroke-[1.5]" />
                            <span className="text-[9px] font-black leading-none">تكلفة الشراء</span>
                          </div>
                          <span className="text-xs sm:text-sm font-black text-zinc-700 font-mono">
                            {(part.costPrice || 0).toLocaleString()} ج.م
                          </span>
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-slate-100/80 flex justify-between items-center text-[10px] font-bold text-slate-400">
                        <div className="flex items-center gap-1 font-semibold">
                          <span>كود الصنف:</span>
                          <span className="font-mono text-slate-600 font-black">{part.barcode || 'PART-N/A'}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 🔵 TAB 2: TEMPORARY PART ISSUES */}
      {activeTab === 'temporary' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-right md:items-center gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-800">تتبع سحب قطع الغيار للتجربة (عهد فنية قيد التدقيق)</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">يضمن النظام عدم خروج أي قطعة غيار دون عهدة مؤقتة فنية مسجلة وموثوقة دون تلاعب.</p>
            </div>
            <button
              onClick={() => {
                if (parsedParts.length === 0) {
                  toast.error('أضف أولاً قطع غيار بالورشة ليتسنى سحب عينة للتجربة!');
                  return;
                }
                setIsTmpIssueModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-6 py-3 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              سحب قطعة غيار مؤقتاً للتجربة
            </button>
          </div>

          {/* List of temporary pulls */}
          {temporaryIssues.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-slate-150 shadow-3xs">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-650 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-8 h-8 animate-spin-slow" />
              </div>
              <h3 className="text-base font-black text-slate-800 mb-1.5">لا توجد قطع غيار مسحوبة للتجربة حالياً</h3>
              <p className="text-slate-400 text-xs font-bold max-w-sm mx-auto leading-relaxed">
                كل السحوبات مؤتمتة ومسجلة باسم الفني مع الموديل المقابل لضمان المزامنة المحاسبية ومخازن رقائق البورد.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto text-right">
                <table className="w-full text-xs font-bold font-sans">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                      <th className="py-4 px-6">قطعة الغيار</th>
                      <th className="py-4 px-6">الكمية المسحوبة</th>
                      <th className="py-4 px-6">اسم الفني العهدة</th>
                      <th className="py-4 px-6">جهاز العميل المستهدف</th>
                      <th className="py-4 px-6">الحالة الحالية</th>
                      <th className="py-4 px-6">تاريخ السحب</th>
                      <th className="py-4 px-6 text-center">الإجراءات والتحويل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {temporaryIssues.map((issue) => {
                      const associatedOrder = orders.find(o => o.id === issue.orderId);
                      return (
                        <tr key={issue.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <Cpu className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-slate-800 font-bold text-xs">{issue.productName}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">ID: {issue.productId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-mono font-bold text-slate-700 text-sm">
                            {issue.quantity} وحدات
                          </td>
                          <td className="py-4 px-6 font-bold text-slate-800">
                            {issue.technicianName}
                          </td>
                          <td className="py-4 px-6">
                            {associatedOrder ? (
                              <div className="text-slate-800">
                                <div className="font-bold">{associatedOrder.customerName}</div>
                                <div className="text-[10px] text-slate-400">{associatedOrder.deviceBrand} {associatedOrder.deviceModel}</div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">عقد صيانة ملغى أو ممسوح</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            {issue.status === 'under_test' ? (
                              <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full inline-flex items-center gap-1 text-[11px] font-black">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                قيد التجربة والفحص
                              </span>
                            ) : issue.status === 'sold' ? (
                              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full inline-flex items-center gap-1 text-[11px] font-black">
                                <Check className="w-3.5 h-3.5" />
                                نجحت (شراء ومباع)
                              </span>
                            ) : (
                              <div className="space-y-1">
                                <span className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full inline-flex items-center gap-1 text-[11px] font-bold">
                                  فشلت (أعيد للمستودع)
                                </span>
                                {issue.conditionOnReturn && (
                                  <div className="text-[10px] text-slate-400 font-semibold" title={issue.conditionOnReturn}>
                                    الحالة: {issue.conditionOnReturn.substring(0, 20)}...
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-6 text-slate-500 font-mono text-[11px]">
                            {new Date(issue.issueDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-4 px-6 text-center">
                            {issue.status === 'under_test' ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleConfirmTmpIssueSuccess(issue.id!)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1 shadow-3xs"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  اعتماد ومبيعات
                                </button>
                                <button
                                  onClick={() => handleOpenFailTrialModal(issue.id!)}
                                  className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-[11px] font-black rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1"
                                >
                                  <RefreshCcw className="w-3.5 h-3.5" />
                                  فشل وإرجاع
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-semibold">
                               Resolved: {issue.resolveDate ? new Date(issue.resolveDate).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '-'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🔮 TAB 3: SMART INVENTORY RESERVATION */}
      {activeTab === 'reservations' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-right md:items-center gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-800 font-sans">حجز قطع الغيار الذكي والموثق تليفونياً (Smart Reservation)</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">يضمن النظام عدم تمكن موظف المبيعات في صالة المعرض من بيع القطعة المحجوزة للعملاء العابرين بالخطأ.</p>
            </div>
            <button
              onClick={() => {
                if (parsedParts.length === 0) {
                  toast.error('أضف أولاً قطع غيار بالورشة ليتسنى تفعيل الحجز الذكي!');
                  return;
                }
                setIsReserveModalOpen(true);
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white font-black text-xs px-6 py-3 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
            >
              <Lock className="w-4 h-4" />
              إنشاء حجز قطعة غيار لجهاز
            </button>
          </div>

          {/* List of active reservations */}
          {reservations.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-slate-150 shadow-3xs">
              <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-slate-800 mb-1.5 font-sans">لا توجد حجوزات قطع غيار نشطة</h3>
              <p className="text-slate-400 text-xs font-bold max-w-sm mx-auto leading-relaxed">
                إنشاء حجز ذكي يسحب فوراً المعين من المستودع ويعلقه لحساب بطاقة الصيانة، تجنباً للأخطاء البشرية بالدوبليكيشن.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto text-right">
                <table className="w-full text-xs font-bold font-sans">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                      <th className="py-4 px-6">قطعة الغيار المحجوزة</th>
                      <th className="py-4 px-6">الكمية مؤمنة كلياً</th>
                      <th className="py-4 px-6">أمر الصيانة / الجهاز المستفيد</th>
                      <th className="py-4 px-6">رقم جوال العميل المتفق هاتفياً</th>
                      <th className="py-4 px-6">الحالة الحالية والتأمين</th>
                      <th className="py-4 px-6">تاريخ الحجز</th>
                      <th className="py-4 px-6 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reservations.map((res) => {
                      const associatedOrder = orders.find(o => o.id === res.orderId);
                      return (
                        <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                                <Database className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-slate-800 font-bold text-xs">{res.productName}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">ID: {res.productId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-mono font-bold text-indigo-700 text-sm">
                            {res.quantity} وحدة (مخصصة)
                          </td>
                          <td className="py-4 px-6">
                            {associatedOrder ? (
                              <div className="text-slate-800">
                                <span className="font-bold">{associatedOrder.customerName}</span>
                                <div className="text-[10px] text-slate-400 font-bold">{associatedOrder.deviceBrand} {associatedOrder.deviceModel}</div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">عقد ممسوح للمقاصة</span>
                            )}
                          </td>
                          <td className="py-4 px-6 font-mono text-slate-700">
                            {associatedOrder?.customerPhone || '-'}
                          </td>
                          <td className="py-4 px-6">
                            {res.status === 'reserved' ? (
                              <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full inline-flex items-center gap-1 text-[11px] font-black">
                                <Lock className="w-3.5 h-3.5" />
                                محجوزة ومؤمنة تماماً
                              </span>
                            ) : res.status === 'completed' ? (
                              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full inline-flex items-center gap-1 text-[11px] font-black">
                                <Check className="w-3.5 h-3.5" />
                                تم التجميع والتركيب
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-red-50 text-red-650 border border-red-200 rounded-full inline-flex items-center gap-1 text-[11px] font-bold">
                                تم إلغاء ومصادرة الحجز
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-slate-500 font-mono text-[11px]">
                            {new Date(res.reservedAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-4 px-6 text-center">
                            {res.status === 'reserved' ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleConfirmReservationInstall(res.id!)}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1 shadow-3xs"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  تركيب وضم للفاتورة
                                </button>
                                <button
                                  onClick={() => handleCancelReservation(res.id!)}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-650 text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                                >
                                  إرجاع وإلغاء
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-semibold font-mono">
                                {res.resolvedAt ? new Date(res.resolvedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '-'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}


      {/* 🔴 Spare Parts Creation Modal (Inside Tab 1) */}
      {isPartModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-3xs flex items-center justify-center z-50 p-4" id="add-part-modal">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border shadow-2xl relative">
            <button 
              onClick={() => setIsPartModalOpen(false)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="text-right space-y-4 font-sans">
              <div className="flex items-center gap-3 border-b pb-3.5">
                <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                  <Database className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">إدخال صنف غيار لمخزن الصيانة</h3>
                  <p className="text-[10px] text-slate-400">تزويد الرفوف بالمعجون الحراري، الشاشات الدقيقة وبطاريات الشحن</p>
                </div>
              </div>

              <form onSubmit={handleAddNewPartToVault} className="space-y-4">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1 font-bold">اسم قطعة الغيار الفني وموديل المقاصة</label>
                  <input
                    type="text"
                    required
                    value={newPartName}
                    onChange={(e) => setNewPartName(e.target.value)}
                    placeholder="مثال: شاشة آيفون 11 برو إصدار أصلي"
                    className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-black outline-none focus:border-orange-500 text-right"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-bold">ملاءمة العائلة</label>
                    <select
                      value={newPartCategory}
                      onChange={(e) => setNewPartCategory(e.target.value as any)}
                      className="w-full px-2 py-2.5 border rounded-xl text-xs font-black cursor-pointer text-right"
                    >
                      <option value="mobile">📱 موبايل وتابلت</option>
                      <option value="pc">💻 لابتوب وكمبيوتر</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-bold">الكمية المتاحة (رصيد)</label>
                    <input
                      type="number"
                      required
                      value={newPartStock}
                      onChange={(e) => setNewPartStock(parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-2 border rounded-xl text-xs text-center font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-bold">سعر بيع التكلفة (للعميل)</label>
                    <input
                      type="number"
                      required
                      value={newPartPrice}
                      onChange={(e) => setNewPartPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-2 border rounded-xl text-xs text-center font-mono font-bold text-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-bold">سعر الشراء (للجرد)</label>
                    <input
                      type="number"
                      value={newPartCost}
                      onChange={(e) => setNewPartCost(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-2 border rounded-xl text-xs text-center font-mono font-bold text-slate-600"
                      placeholder="افتراضياً 60% من البيع"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPartModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    تراجع
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl text-xs cursor-pointer"
                  >
                    تأكيد الفرز والضم مخزنياً
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 🔵 Temporary Pull Selection Modal (Inside Tab 2) */}
      {isTmpIssueModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-3xs flex items-center justify-center z-50 p-4" id="tmp-issue-modal">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border shadow-2xl relative">
            <button 
              onClick={() => setIsTmpIssueModalOpen(false)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-650 rounded-full cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="text-right space-y-4 font-sans">
              <div className="flex items-center gap-3 border-b pb-3.5">
                <div className="p-2 bg-indigo-150 text-indigo-700 rounded-xl">
                  <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">حجز مؤقت للتجربة والفحص الفني</h3>
                  <p className="text-[10px] text-slate-400">سحب غيار من المخازن عهدة للتجربة الفورية لمعرفة العيب</p>
                </div>
              </div>

              <form onSubmit={handleCreateTmpIssue} className="space-y-4">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1 font-bold">1. عهدة الفني المسؤول (أوكراني مسيحي فقط)</label>
                  <select
                    value={tmpTechnicianName}
                    onChange={(e) => setTmpTechnicianName(e.target.value)}
                    className="w-full px-3 py-2.5 border rounded-xl text-xs font-bold text-right"
                  >
                    {techOptions.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1 font-bold">2. اختر جهاز العميل قيد الصيانة المستهدف</label>
                  <select
                    value={tmpOrderId}
                    required
                    onChange={(e) => setTmpOrderId(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 border rounded-xl text-xs font-bold text-right text-slate-700"
                  >
                    <option value="">-- اختر بطاقة فحص قيد الصيانة بالورشة --</option>
                    {orders.filter(o => o.status === 'received' || o.status === 'repairing' || (o as any).status === 'waiting_parts').map(order => (
                      <option key={order.id} value={order.id}>
                        بطاقة العميل: {order.customerName} - {order.deviceBrand} {order.deviceModel} (ID: {order.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1 font-bold">3. اختر قطعة الغيار المسحوبة</label>
                  <select
                    value={tmpProductId}
                    required
                    onChange={(e) => setTmpProductId(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 border rounded-xl text-xs font-bold text-right text-slate-700"
                  >
                    <option value="">-- اختر صنف غيار متوفر --</option>
                    {parsedParts.map(part => (
                      <option key={part.id} value={part.id}>
                        {part.name} (المتوفر: {part.stock}) - {[part.price || 0].toLocaleString()} ج.م
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1 font-bold">4. كمية الوحدات للتنقيب</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={tmpQty}
                    onChange={(e) => setTmpQty(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold text-center"
                  />
                </div>

                <div className="pt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsTmpIssueModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs"
                  >
                    تراجع
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs cursor-pointer shadow-3xs"
                  >
                    تسجيل سحب للتجربة
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 Return and Log Condition Modal (Inside Tab 2) */}
      {isFailModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-3xs flex items-center justify-center z-50 p-4" id="fail-trial-modal">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 border shadow-2xl relative">
            <button 
              onClick={() => setIsFailModalOpen(false)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-655 rounded-full cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="text-right space-y-4 font-sans">
              <div className="flex items-center gap-3 border-b pb-3.5">
                <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">بيان تراجع وفشل تجربة الغيار</h3>
                  <p className="text-[10px] text-slate-400">إرجاع القطعة للمخزون مع إدلاء حالة سلامة الرائحة الفنية</p>
                </div>
              </div>

              <form onSubmit={handleConfirmTmpIssueFail} className="space-y-4">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-2 font-bold">الحالة الفنية والجودة عند الإرجاع والفك</label>
                  <textarea
                    rows={3}
                    required
                    value={returnCondition}
                    onChange={(e) => setReturnCondition(e.target.value)}
                    placeholder="مثال: مستعملة للتجربة - خالية من الخدوش ومضمونة تماماً"
                    className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-black outline-none focus:border-red-500 text-right text-slate-700 leading-relaxed"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                    سيقوم النظام بإرجاع حصتها إلى العداد المخزني وإبقاء تقرير الجودة حياً لضمان عدم تعرض الأصول للتلف.
                  </p>
                </div>

                <div className="pt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFailModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs"
                  >
                    تراجع
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-red-650 hover:bg-red-750 text-white font-black rounded-xl text-xs cursor-pointer shadow-3xs"
                  >
                    تأكيد الإرجاع للمستودع
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 Smart Reservation Modal (Inside Tab 3) */}
      {isReserveModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-3xs flex items-center justify-center z-50 p-4" id="reserve-modal">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border shadow-2xl relative">
            <button 
              onClick={() => setIsReserveModalOpen(false)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-655 rounded-full cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="text-right space-y-4 font-sans">
              <div className="flex items-center gap-3 border-b pb-3.5">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">صياغة حجز مخزني ذكي وموثق</h3>
                  <p className="text-[10px] text-slate-400">تأمين القطعة للعميل وحمايتها تماماً من البيع بالخطأ بصالة العرض</p>
                </div>
              </div>

              <form onSubmit={handleCreateReservation} className="space-y-4">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1 font-bold">1. اختر تذكرة الصيانة المستهدفة بالحجز</label>
                  <select
                    value={resOrderId}
                    required
                    onChange={(e) => setResOrderId(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 border rounded-xl text-xs font-bold text-right text-slate-700"
                  >
                    <option value="">-- اختر بطاقة فحص قيد الصيانة المستهدفة --</option>
                    {orders.filter(o => o.status === 'received' || o.status === 'repairing' || (o as any).status === 'waiting_parts').map(order => (
                      <option key={order.id} value={order.id}>
                        {order.customerName} - {order.deviceBrand} {order.deviceModel} (رقم البطاقة: {order.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1 font-bold">2. اختر صنف غيار الرصيد المحجوز</label>
                  <select
                    value={resProductId}
                    required
                    onChange={(e) => setResProductId(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 border rounded-xl text-xs font-bold text-right text-slate-700"
                  >
                    <option value="">-- اختر قطعة الغيار --</option>
                    {parsedParts.map(part => (
                      <option key={part.id} value={part.id}>
                        {part.name} (المتاح مخزنياً: {part.stock}) - {[part.price || 0].toLocaleString()} ج.م
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1 font-bold">3. كمية حجز القطع التكنيكية</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={resQty}
                    onChange={(e) => setResQty(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold text-center"
                  />
                  <p className="text-[10px] text-slate-450 mt-1">
                    سيتم سحب الرصيد من المخازن وتعليقه بصفة مؤمنة بالكامل كـ "محجوز"، وحجبه من مستخدم الكاشير بالمبيعات العابرة.
                  </p>
                </div>

                <div className="pt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsReserveModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs"
                  >
                    تراجع
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-orange-650 hover:bg-orange-750 text-white font-black rounded-xl text-xs cursor-pointer shadow-3xs"
                  >
                    إنشاء الحجز والتأمين
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComputerMobileParts;
