import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { MaintenanceOrder, MaintenanceRma, Supplier, Product } from '../../types';
import { 
  ShieldCheck, RefreshCw, Search, ArrowLeftRight, FileCheck, ClipboardList,
  AlertTriangle, Truck, UserCheck, Calendar, DollarSign, Clock, HelpCircle,
  FileText, Copy, Printer, Check, X, ShieldAlert, BadgeInfo, Building, BarChart3,
  Undo2, Plus, CornerDownLeft, Inbox
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

// Web Audio API beep helper to maintain 100% offline-friendly state
const playSound = (type: 'verify_ok' | 'verify_fail' | 'action_ok') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'verify_ok') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'verify_fail') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220.00, ctx.currentTime); // A3
      osc.frequency.setValueAtTime(130.81, ctx.currentTime + 0.15); // C3
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {
    console.warn("Audio Context blocked or unsupported.", e);
  }
};

const ComputerMobileRMA: React.FC = () => {
  // Live queries
  const rmas = useLiveQuery(() => db.maintenanceRmas.toArray()) || [];
  const orders = useLiveQuery(() => db.maintenanceOrders.toArray()) || [];
  const suppliers = useLiveQuery(() => db.suppliers.toArray()) || [];
  const products = useLiveQuery(() => db.products.filter(p => p.category === 'قطع غيار صيانة').toArray()) || [];

  // Local UI states
  const [activeTab, setActiveTab] = useState<'reverse_tracking' | 'vendor_rma' | 'claim_docs'>('reverse_tracking');
  
  // Reverse tracking states
  const [serialQuery, setSerialQuery] = useState('');
  const [verifiedPart, setVerifiedPart] = useState<{
    found: boolean;
    order?: MaintenanceOrder;
    part?: any;
    supplier?: Supplier;
    warrantyStatus?: 'active' | 'expired' | 'not_found';
    daysLeft?: number;
    daysPassed?: number;
  } | null>(null);

  // Vendor RMA creation states
  const [isRmaModalOpen, setIsRmaModalOpen] = useState(false);
  const [rmaPartName, setRmaPartName] = useState('');
  const [rmaPartSerial, setRmaPartSerial] = useState('');
  const [rmaDefect, setRmaDefect] = useState('');
  const [rmaSupplierId, setRmaSupplierId] = useState<string>('');
  const [rmaCost, setRmaCost] = useState<string>('');
  const [rmaOrderId, setRmaOrderId] = useState<string>('');
  const [tempNotes, setTempNotes] = useState('');

  // Selected claim document for preview/printing
  const [selectedClaimRma, setSelectedClaimRma] = useState<MaintenanceRma | null>(null);

  // Seed default demo data if table is empty
  useEffect(() => {
    const seedRmaData = async () => {
      const rmaCount = await db.maintenanceRmas.count();
      const orderCount = await db.maintenanceOrders.count();
      const supplierCount = await db.suppliers.count();

      // Ensure some suppliers exist (Christian Ukrainian Names)
      let supplier1Id = 1;
      let supplier2Id = 2;
      if (supplierCount === 0) {
        supplier1Id = await db.suppliers.add({
          name: 'روستيسلاف للتوريدات الإلكترونية',
          phone: '+380501112233',
          contactPerson: 'روستيسلاف كوفالينكو',
          address: 'كييف، شارع الاستقلال 45',
          notes: 'المورد الرئيسي لقطع غيار شاشات الموبايل واللابتوب عالية الجودة',
          balance: 0
        });
        supplier2Id = await db.suppliers.add({
          name: 'تاراس تيك لقطع الغيار',
          phone: '+380674445566',
          contactPerson: 'تاراس بافلوف',
          address: 'لفيف، ميدان الحرية د10',
          notes: 'موزع معتمد لبطاريات الهواتف الذكية ومكونات لوحات اللابتوب',
          balance: 0
        });
      } else {
        const allSups = await db.suppliers.toArray();
        supplier1Id = allSups[0]?.id || 1;
        supplier2Id = allSups[1]?.id || 2;
      }

      // Check and seed an order with serial component if missing
      if (orderCount === 0) {
        const dummyOrderDate = new Date();
        dummyOrderDate.setDate(dummyOrderDate.getDate() - 25); // Delivered 25 days ago

        await db.maintenanceOrders.add({
          date: dummyOrderDate,
          customerId: 101,
          customerName: 'ميكولا باشينكو',
          customerPhone: '01099233844',
          deviceType: 'mobile',
          deviceBrand: 'Apple',
          deviceModel: 'iPhone 15 Pro Max',
          deviceSerial: 'IMEI-99231844211',
          issueDescription: 'كسر كامل في الزجاج الخلفي والشاشة الخارجية',
          expectedCost: 3500,
          actualCost: 3400,
          deposit: 500,
          status: 'delivered',
          deliveredDate: dummyOrderDate,
          technicianName: 'بوهدان لسينكو',
          shelfCode: 'رف A-3',
          notes: 'تم فحص مسار الإضاءة بنجاح وتركيب الشاشة الأصلية البديلة بسيريال موثق.',
          parts: [
            {
              name: 'شاشة iPhone 15 Pro Max الأصيلة',
              quantity: 1,
              price: 2900,
              cost: 1700,
              serialNumber: 'SCR-IP15-7731-UKR',
              supplierId: supplier1Id,
              supplierName: 'روستيسلاف للتوريدات الإلكترونية',
              warrantyDays: 90
            }
          ]
        });

        const olderOrderDate = new Date();
        olderOrderDate.setDate(olderOrderDate.getDate() - 110); // Delivered 110 days ago (Warranty expired)
        await db.maintenanceOrders.add({
          date: olderOrderDate,
          customerId: 102,
          customerName: 'أولغا شفتشينكو',
          customerPhone: '01122883344',
          deviceType: 'computer',
          deviceBrand: 'Dell',
          deviceModel: 'Latitude 5420',
          deviceSerial: 'DELL-TAG-X8892',
          issueDescription: 'بطء شديد في إقلاع النظام وتجمد عشوائي عند العمل',
          expectedCost: 1900,
          actualCost: 1900,
          deposit: 0,
          status: 'delivered',
          deliveredDate: olderOrderDate,
          technicianName: 'ياروسلاف ميلنيك',
          shelfCode: 'رف C-1',
          notes: 'تغيير هارد ديسك SSD تالف بهارد جديد فائق السرعة وتثبيت النظام.',
          parts: [
            {
              name: 'قرص تخزين Kingston NVMe SSD 512GB',
              quantity: 1,
              price: 1500,
              cost: 950,
              serialNumber: 'SSD-KING512-4421-UKR',
              supplierId: supplier2Id,
              supplierName: 'تاراس تيك لقطع الغيار',
              warrantyDays: 90
            }
          ]
        });
      }

      // Seed default RMAs if missing
      if (rmaCount === 0) {
        await db.maintenanceRmas.bulkAdd([
          {
            partName: 'شاشة سامسونج OLED S23 Ultra',
            partSerial: 'OLED-SAM-S23-9912',
            defectDescription: 'ظهور خطوط عمودية خضراء بعد التشغيل بـ 10 دقائق (عيب مصنعي واضح بالشريط الداخلي)',
            supplierId: supplier1Id,
            supplierName: 'روستيسلاف للتوريدات الإلكترونية',
            cost: 1450,
            dateCreated: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), // 5 days ago
            status: 'waiting_supplier',
            claimDocumentId: 'RMA-2026-0001',
            notes: 'تم فحص الشاشة بمعرفة روميان كوفالينكو وتم تنزيلها لرف المرتجعات.'
          },
          {
            partName: 'بطارية لابتوب HP EliteBook 840 G5',
            partSerial: 'BATT-HP840-8843',
            defectDescription: 'انتفاخ مبكر في خلايا البطارية ورفض الشحن نهائياً بعد أسبوع من الاستلام',
            supplierId: supplier2Id,
            supplierName: 'تاراس تيك لقطع الغيار',
            cost: 850,
            dateCreated: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(), // 14 days ago
            status: 'replaced',
            claimDocumentId: 'RMA-2026-0002',
            notes: 'قام المورد بتقديم بطارية بديلة جديدة وتم إرجاعها للمستودع وتعديل المخزون.'
          }
        ]);
      }
    };
    seedRmaData();
  }, [orders, rmas, suppliers]);

  // Action: Perform Reverse Serial Lookup
  const handleSerialSearch = () => {
    if (!serialQuery.trim()) {
      toast.error('أدخل رقم السيريال المراد التحقق من ضمانه أولاً');
      return;
    }

    // Search inside delivered maintenance orders for a part matching the serialNumber
    let foundMatch = false;
    
    for (const order of orders) {
      if (order.parts) {
        const matchedPart = order.parts.find(
          p => p.serialNumber?.trim().toLowerCase() === serialQuery.trim().toLowerCase()
        );

        if (matchedPart) {
          foundMatch = true;
          
          // Calculate warranty status
          let warrantyStatus: 'active' | 'expired' | 'not_found' = 'not_found';
          let daysLeft = 0;
          let daysPassed = 0;

          if (order.deliveredDate) {
            const delivered = new Date(order.deliveredDate);
            const today = new Date();
            const diffTime = Math.abs(today.getTime() - delivered.getTime());
            daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            const warrantyLimit = matchedPart.warrantyDays || 90;
            if (daysPassed <= warrantyLimit) {
              warrantyStatus = 'active';
              daysLeft = warrantyLimit - daysPassed;
            } else {
              warrantyStatus = 'expired';
              daysLeft = 0;
            }
          }

          // Fetch supplier info if possible
          const matchedSupplier = suppliers.find(s => s.id === matchedPart.supplierId || s.name === matchedPart.supplierName);

          setVerifiedPart({
            found: true,
            order: order,
            part: matchedPart,
            supplier: matchedSupplier,
            warrantyStatus: warrantyStatus,
            daysLeft: daysLeft,
            daysPassed: daysPassed
          });

          playSound('verify_ok');
          toast.success('✓ تم العثور على قطعة الغيار بنجاح! الضمان ومصدر التوريد موثق.');
          break;
        }
      }
    }

    if (!foundMatch) {
      setVerifiedPart({ found: false, warrantyStatus: 'not_found' });
      playSound('verify_fail');
      toast.error('✕ السيريال غير مسجل! نوصي بفحص ملصق المحل للتأكد من مصدر القطعة.');
    }
  };

  // Action: Add Defective Part to Vendor RMA
  const handleAddRma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rmaPartName.trim()) {
      toast.error('يرجى كتابة اسم قطعة الغيار التالفة');
      return;
    }
    if (!rmaSupplierId) {
      toast.error('يرجى اختيار مورد قطعة الغيار للمطالبة');
      return;
    }

    try {
      const selectedSup = suppliers.find(s => s.id === parseInt(rmaSupplierId));
      const documentNumber = `RMA-2026-${String(rmas.length + 1).padStart(4, '0')}`;

      const newRma: MaintenanceRma = {
        partName: rmaPartName,
        partSerial: rmaPartSerial || `SR-${Math.floor(Math.random() * 900000) + 100000}`,
        defectDescription: rmaDefect || 'عيب صناعي أو عدم استجابة تقنية',
        supplierId: selectedSup ? selectedSup.id : undefined,
        supplierName: selectedSup ? selectedSup.name : 'مورد محلي غير مسجل',
        cost: rmaCost ? parseFloat(rmaCost) : undefined,
        orderId: rmaOrderId ? parseInt(rmaOrderId) : undefined,
        dateCreated: new Date().toISOString(),
        status: 'waiting_supplier',
        claimDocumentId: documentNumber,
        notes: tempNotes || 'مسجل للرجوع لخدمات الإرجاع بالضمان'
      };

      await db.maintenanceRmas.add(newRma);
      playSound('action_ok');
      toast.success('✓ تم نقل القطعة لمخزن معطلات الصيانة وتوليد مستند مسودة المطالبة بنجاح!');
      setIsRmaModalOpen(false);
      
      // Reset State
      setRmaPartName('');
      setRmaPartSerial('');
      setRmaDefect('');
      setRmaSupplierId('');
      setRmaCost('');
      setRmaOrderId('');
      setTempNotes('');
    } catch (err) {
      toast.error('حدث خطأ أثناء حفظ مطالبة RMA للمورد');
    }
  };

  // Action: Update RMA Status from Supplier
  const handleUpdateRmaStatus = async (rmaId: number, status: 'replaced' | 'refunded' | 'rejected', updateNotes: string) => {
    try {
      const rmaItem = rmas.find(r => r.id === rmaId);
      if (!rmaItem) return;

      const updated = {
        ...rmaItem,
        status: status,
        notes: `${rmaItem.notes || ''}\n[تحديث]: تم تغيير الحالة إلى (${status === 'replaced' ? 'تم استبدالها ببديل جديد' : status === 'refunded' ? 'تم تصفية قيمتها نقداً' : 'تم رفض المطالبة'}) - ملاحظة: ${updateNotes}`
      };

      await db.maintenanceRmas.put(updated);

      // Trigger stock modification if replaced or financial logging if refunded
      if (status === 'replaced') {
        const prodMatch = products.find(p => p.name === rmaItem.partName);
        if (prodMatch && prodMatch.id) {
          // Add 1 back to stock
          await db.products.update(prodMatch.id, {
            stock: (prodMatch.stock || 0) + 1
          });
          toast.success('✓ تم زيادة مخزون قطع الغيار بالبديل الجديد تلقائياً بمقدار +1 بقطع الصيانة!');
        }
      } else if (status === 'refunded' && rmaItem.cost && rmaItem.cost > 0) {
        // Register financial entry (accounting integration)
        // Check if there is cash account to credit/debit
        const journalRef = `JV-RMA-${rmaId}`;
        const currentDateStr = new Date().toISOString().split('T')[0];
        
        const acc1010 = await db.accounts.where('code').equals('1010').first() || { id: 1010, name: 'الصندوق' };
        const acc1040 = await db.accounts.where('code').equals('1040').first() || { id: 1040, name: 'مخزون البضائع' };

        await db.journalEntries.add({
          date: new Date(currentDateStr),
          reference: journalRef,
          description: `تصفية مالية مرتجع عيب صناعة RMA #${rmaItem.claimDocumentId} من المورد ${rmaItem.supplierName}`,
          lines: [
            { accountId: acc1010.id || 1010, accountName: acc1010.name, debit: rmaItem.cost, credit: 0 },
            { accountId: acc1040.id || 1040, accountName: acc1040.name, debit: 0, credit: rmaItem.cost }
          ],
          totalAmount: rmaItem.cost,
          status: 'posted'
        });

        toast.success(`✓ تم إيداع ${rmaItem.cost.toLocaleString()} ج.م في حساب الخزينة وقيد محاسبي فوري للعملية!`);
      }

      playSound('action_ok');
      toast.success('✓ تم تحديث سجل المرتجعات للمورد بالقرار النهائي للمناولة بنجاح!');
    } catch (e) {
      toast.error('أخفق تحديث مطالبة المورد');
    }
  };

  // Quick Action Helper from reverse lookup verified card
  const handleInitiateRmaFromWarrantyCheck = () => {
    if (!verifiedPart || !verifiedPart.part) return;
    setRmaPartName(verifiedPart.part.name);
    setRmaPartSerial(verifiedPart.part.serialNumber || '');
    setRmaDefect('شكوى الضمان من العميل: القطعة تالفة ولا تعمل بعد التركيب وتحتاج لاستبدال مصنعي.');
    setRmaOrderId(verifiedPart.order?.id?.toString() || '');
    if (verifiedPart.part.supplierId) {
      setRmaSupplierId(verifiedPart.part.supplierId.toString());
    }
    setRmaCost(verifiedPart.part.cost?.toString() || '');
    setIsRmaModalOpen(true);
  };

  // Calculations for KPI tags
  const pendingSupplierCount = rmas.filter(r => r.status === 'waiting_supplier').length;
  const pendingSupplierValue = rmas.filter(r => r.status === 'waiting_supplier').reduce((sum, r) => sum + (r.cost || 0), 0);
  const resolvedRmasCount = rmas.filter(r => r.status === 'replaced' || r.status === 'refunded').length;

  return (
    <div className="p-6 select-none max-w-[1605px] mx-auto space-y-8 text-slate-800" dir="rtl">
      
      {/* Styles & Theme integrations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=Cairo:wght@300;400;500;600;700;800;900&display=swap');
        .rma-main-font {
          font-family: 'Tajawal', 'Cairo', sans-serif !important;
        }
      `}</style>

      {/* Header and top branding */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-200 pb-5 rma-main-font">
        <div className="space-y-1 text-right">
          <div className="flex items-center gap-2.5 justify-start">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200 shadow-3xs">
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">إدارة اللوجستيات، الضمان ومرتجع الموردين (RMA)</h1>
              <p className="text-[11px] text-slate-500 font-bold">بوابة تتبع السيريالات العكسية وامتيازات قطع غيار الصيانة المطالب بها مع الموردين الكرام</p>
            </div>
          </div>
        </div>

        {/* Action Button and active counters */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRmaModalOpen(true)}
            className="p-3 px-5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-2xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            إصدار مطالبة RMA جديدة لمورد
          </button>
        </div>
      </div>

      {/* Overview stats layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5 rma-main-font">
        {/* KPI 1 */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-3xs flex items-center justify-between text-right">
          <div className="space-y-1">
            <span className="text-[11px] font-black text-slate-450 block">مطالبات بانتظار الموردين</span>
            <span className="text-2xl font-black text-amber-600 font-mono block">
              {pendingSupplierCount} مطالبة
            </span>
            <span className="text-[9.5px] font-bold text-amber-600 block bg-amber-50 p-0.5 px-2 rounded-md w-fit border border-amber-100">
              بمخزون قطع "المعطلات" المعلقة
            </span>
          </div>
          <div className="p-4 bg-amber-50 text-amber-500 rounded-2xl">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-3xs flex items-center justify-between text-right">
          <div className="space-y-1">
            <span className="text-[11px] font-black text-slate-450 block">القيمة المالية المجمدة للمطادرات</span>
            <span className="text-2xl font-black text-rose-600 block font-mono">
              {pendingSupplierValue.toLocaleString()} <span className="text-xs">ج.م</span>
            </span>
            <span className="text-[9.5px] font-bold text-rose-600 block bg-rose-50 p-0.5 px-2 rounded-md w-fit border border-rose-100">
              قيمة معيبة بانتظار استحقاقها
            </span>
          </div>
          <div className="p-4 bg-rose-50 text-rose-500 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-3xs flex items-center justify-between text-right">
          <div className="space-y-1">
            <span className="text-[11px] font-black text-slate-450 block">مطالبات حسمت بنجاح</span>
            <span className="text-2xl font-black text-emerald-600 font-mono block">
              {resolvedRmasCount} مطالبة
            </span>
            <span className="text-[9.5px] font-bold text-emerald-600 block bg-emerald-50 p-0.5 px-2 rounded-md w-fit border border-emerald-100">
              بدلاء مستلمين / تعويضات مالية
            </span>
          </div>
          <div className="p-4 bg-emerald-50 text-emerald-500 rounded-2xl">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-3xs flex items-center justify-between text-right">
          <div className="space-y-1">
            <span className="text-[11px] font-black text-slate-450 block">الضمانات النشطة للعملاء في الورشة</span>
            <span className="text-2xl font-black text-indigo-600 font-mono block">
              {orders.filter(o => o.status === 'delivered').length} أجهزة
            </span>
            <span className="text-[9.5px] font-bold text-indigo-600 block bg-indigo-50 p-0.5 px-2 rounded-md w-fit border border-indigo-100">
              مدعومة بنسبة 100% بسندات السيريال
            </span>
          </div>
          <div className="p-4 bg-indigo-50 text-indigo-500 rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Navigation sub-tabs */}
      <div className="flex border-b border-slate-200 rma-main-font gap-2 bg-white p-2 rounded-2xl shadow-3xs">
        <button
          onClick={() => setActiveTab('reverse_tracking')}
          className={`flex-1 md:flex-none p-3 px-6 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'reverse_tracking' ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-600'}`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          التحقق العكسي من سيريالات القطع وضمان العميل
        </button>

        <button
          onClick={() => setActiveTab('vendor_rma')}
          className={`flex-1 md:flex-none p-3 px-6 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'vendor_rma' ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-600'}`}
        >
          <Truck className="w-4 h-4 animate-bounce" />
          مخزن المعطلات ومطالبات الموردين (Vendor RMA)
        </button>

        <button
          onClick={() => setActiveTab('claim_docs')}
          className={`flex-1 md:flex-none p-3 px-6 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'claim_docs' ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-600'}`}
        >
          <FileText className="w-4 h-4" />
          سندات وتفويض الشحن للموردين
        </button>
      </div>

      {/* TAB 1: REVERSE SERIAL LOOKUP */}
      {activeTab === 'reverse_tracking' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start rma-main-font">
          {/* Lookup Input and Info */}
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-3xs text-right space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-800">جهاز قراءة السيريال وضمان الصيانة</h3>
              <p className="text-[11px] text-slate-400 font-bold">يقوم هذا المحرك بمسح بطاقات الصيانة المغلقة لمقارنة الرقم المتسلسل للقطعة المركبة مع حوزة العميل للتأكد من الموثوقية.</p>
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-black text-slate-700">سيريال القطعة أو الجهاز (Serial / IMEI):</label>
              <div className="relative">
                <input
                  type="text"
                  value={serialQuery}
                  onChange={(e) => setSerialQuery(e.target.value)}
                  placeholder="مثال: SCR-IP15-7731-UKR"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSerialSearch(); }}
                  className="w-full text-xs font-bold p-3.5 pr-4 border border-slate-200 rounded-2xl bg-slate-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 text-right font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-right text-[10.5px]">
                <button
                  onClick={() => setSerialQuery('SCR-IP15-7731-UKR')}
                  className="p-2 border border-slate-250 hover:bg-slate-50 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  تجربة سيريال ساري 🟢
                </button>
                <button
                  onClick={() => setSerialQuery('SSD-KING512-4421-UKR')}
                  className="p-2 border border-slate-250 hover:bg-slate-50 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  تجربة سيريال منتهي 🔴
                </button>
              </div>

              <button
                onClick={handleSerialSearch}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Search className="w-4 h-4 text-amber-400" />
                بحث وتثبيت الحالة بالورشة
              </button>
            </div>

            {/* Visual warning rule */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-1">
              <span className="text-[10px] font-black text-rose-600 block flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                توجيه الرقابة والأمن الفني:
              </span>
              <p className="text-[10px] text-slate-550 font-bold leading-relaxed">
                يجب مطابقة السيريال الملصق خلف الشاشة أو بطارية الهاتف مع البطاقة التقنية المسجلة بالنظام قبل القيام بفتح مطالبة RMA لمورد قطع الغيار.
              </p>
            </div>
          </div>

          {/* Verification Results Panel */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-3xs text-right space-y-4">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 border-b pb-3">
              <BadgeInfo className="w-5 h-5 text-indigo-600" />
              التقرير الفني وموقف الضمان والمنشأ التوريدي
            </h3>

            {verifiedPart ? (
              verifiedPart.found && verifiedPart.part ? (
                <div className="space-y-6">
                  {/* Headline state */}
                  <div className={`p-4.5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${verifiedPart.warrantyStatus === 'active' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                    <div className="space-y-1">
                      <span className="text-[11px] font-black text-slate-450 block">حالة الضمان ومراجعة الصيانة الفنية:</span>
                      <h4 className="text-normal font-black text-slate-900 flex items-center gap-2">
                        {verifiedPart.warrantyStatus === 'active' ? (
                          <>
                            <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                            <span className="text-emerald-700">الضمان ساري المفعول وموثق بالورشة 🟢</span>
                          </>
                        ) : (
                          <>
                            <span className="inline-block w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
                            <span className="text-rose-700">هذه القطعة خارج فترة الضمان المحددة 🔴</span>
                          </>
                        )}
                      </h4>
                    </div>
                    {/* Badge and countdown logs */}
                    {verifiedPart.warrantyStatus === 'active' ? (
                      <div className="text-right">
                        <span className="text-[10px] text-emerald-800 font-extrabold block">متبقي في الضمان الفعلي:</span>
                        <span className="text-lg font-black text-emerald-700 font-mono">{verifiedPart.daysLeft} يوم</span>
                      </div>
                    ) : (
                      <div className="text-right">
                        <span className="text-[10px] text-rose-800 font-extrabold block">تجاوز فترة التغطية بـ:</span>
                        <span className="text-lg font-black text-rose-700 font-mono">{verifiedPart.daysPassed} يوم بعد التسليم</span>
                      </div>
                    )}
                  </div>

                  {/* Detailed Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Customer & Ticket */}
                    <div className="p-4 rounded-2xl border border-slate-150 space-y-3 bg-slate-50/40">
                      <h4 className="text-xs font-black text-slate-900 border-b pb-1.5 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-slate-500" />
                        سند العميل والتسليم بالصيانة:
                      </h4>
                      <div className="space-y-1.5 text-xs text-slate-600 font-bold">
                        <div>العطل / كارت الصيانة: <span className="font-extrabold text-slate-900">#DEV-{verifiedPart.order?.id}</span></div>
                        <div>اسم العميل: <span className="font-black text-slate-800">{verifiedPart.order?.customerName}</span></div>
                        <div>هاتف العميل: <span className="font-mono">{verifiedPart.order?.customerPhone}</span></div>
                        <div>المهندس الفني المنفذ: <span className="font-extrabold text-slate-900">{verifiedPart.order?.technicianName || 'ياروسلاف ميلنيك'}</span></div>
                        <div>تاريخ التسليم الفعلي: <span className="font-mono text-slate-900">{verifiedPart.order?.deliveredDate ? new Date(verifiedPart.order.deliveredDate).toLocaleDateString('ar-EG') : 'غير متوفر'}</span></div>
                      </div>
                    </div>

                    {/* Part & Supplier */}
                    <div className="p-4 rounded-2xl border border-slate-150 space-y-3 bg-slate-50/40">
                      <h4 className="text-xs font-black text-slate-900 border-b pb-1.5 flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-slate-500" />
                        تفاصيل قطعة الغيار والتوريد:
                      </h4>
                      <div className="space-y-1.5 text-xs text-slate-600 font-bold">
                        <div>القطعة: <span className="font-black text-slate-800">{verifiedPart.part.name}</span></div>
                        <div>البار كود / السيريال ممرر: <span className="font-mono font-extrabold text-indigo-700">{verifiedPart.part.serialNumber}</span></div>
                        <div>فترة الضمان المقررة: <span className="text-slate-800 font-extrabold">{verifiedPart.part.warrantyDays || 90} يوم من المتجر</span></div>
                        <div>المورد المعتمد للقطعة: <span className="font-black text-amber-700 underline">{verifiedPart.part.supplierName || 'روستيسلاف كوفالينكو'}</span></div>
                        <div>سعر التكلفة الاستيرادية: <span className="font-black text-slate-800 font-mono">{(verifiedPart.part.cost || 0).toLocaleString()} ج.م</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Actions depending on results */}
                  {verifiedPart.warrantyStatus === 'active' ? (
                    <div className="bg-slate-900 text-white p-4.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4.5">
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-amber-400">إجراء استبدال عيب مصنعي؟</h4>
                        <p className="text-[10px] text-slate-350 font-medium">الضمان سارٍ للعميل، وهو يشتكي من عيب في القطعة؛ يمكنك الآن تمرير هذه القطعة مباشرة لمطالبة (RMA) مع المورد.</p>
                      </div>
                      <button
                        onClick={handleInitiateRmaFromWarrantyCheck}
                        className="p-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black text-xs rounded-xl transition-colors cursor-pointer shrink-0"
                      >
                        نقل القطعة لـ RMA لطلب استبدال من المورد روستيسلاف 🚚
                      </button>
                    </div>
                  ) : (
                    <div className="bg-rose-50 border border-rose-150 p-4 rounded-2xl font-bold text-xs text-rose-800 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      الضمان منتهٍ للعميل. في حال الرغبة في تصليح الجهاز مرة ثانية، يتم إصدار كارت صيانة جديد تماماً بتكلفة إضافية لقطع غيار الصيانة.
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-16 border-2 border-dashed border-red-150 rounded-2xl text-center space-y-3.5">
                  <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mx-auto border border-red-200">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-slate-700">لم يتم العثور على هذا السيريال بالنظام</h4>
                    <p className="text-[10.5px] text-slate-450 font-bold max-w-md mx-auto">
                      يرجى التأكد من كتابة السيريال بشكل صحيح ومطابقة الأحرف، أو تفضل بفحص حوزة العميل للتأكد من قيامه بالإصلاح بداخل ورش الصيانة الرقمية لدينا.
                    </p>
                  </div>
                </div>
              )
            ) : (
              <div className="p-16 border border-dashed border-slate-200 rounded-2xl text-center space-y-3 text-slate-450">
                <ClipboardList className="w-10 h-10 mx-auto opacity-40 text-slate-500" />
                <p className="text-xs font-bold leading-relaxed max-w-md mx-auto">
                  قم بإدخال السيريال الخاص بقطعة الصيانة بالجانب المقابل وانقر على بحث، لتأكيد سلامتها، قراءة منشأها، ومعرفة المورد والمشتري مع حالة الضمان.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: VENDOR RMA LIST */}
      {activeTab === 'vendor_rma' && (
        <div className="space-y-4 rma-main-fontAll">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-3xs text-right space-y-4 rma-main-font">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-3.5">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Inbox className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
                  جرد مخزن "المعطلات في انتظار الاستبدال من المورد"
                </h3>
                <p className="text-[11px] text-slate-400 font-bold">قائمة قطع الغيار المستخرجة ذات العيوب الصناعية لمطالبة الموردين بقيمتها أو استبدالها</p>
              </div>

              <div className="p-1.5 px-3 bg-amber-50 text-amber-800 rounded-xl text-[10.5px] font-black border border-amber-100 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                إجراءات استجابة سريعة لقطع المعطلات
              </div>
            </div>

            {rmas.length === 0 ? (
              <div className="p-20 border-2 border-dashed border-slate-200 rounded-3xl text-center space-y-4">
                <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto border border-slate-200 shadow-sm">
                  <Truck className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-700">لا توجد قطع معيبة معلقة بمخزن RMA</h4>
                  <p className="text-xs text-slate-400 font-bold max-w-md mx-auto mt-1">المستودع خالي تماماً من المطالبات المفتوحة. كل مطالبات الضمان مستلمة ومسواة مالياً ولوجستياً.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
                {rmas.map((rma) => {
                  return (
                    <div key={rma.id} className="p-5 bg-white rounded-2xl border border-slate-205 shadow-3xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all">
                      <div className="space-y-2.5 text-right">
                        
                        {/* Title and RMA document ID */}
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-black p-1 px-2.5 rounded-lg border ${rma.status === 'waiting_supplier' ? 'bg-amber-50 text-amber-700 border-amber-200' : rma.status === 'replaced' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : rma.status === 'refunded' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                            {rma.status === 'waiting_supplier' && 'بانتظار المورد'}
                            {rma.status === 'replaced' && 'تم الاستبدال ✓'}
                            {rma.status === 'refunded' && 'تم تصفية نقدية 💰'}
                            {rma.status === 'rejected' && 'تم الرفض ✕'}
                          </span>
                          
                          <span className="text-[10px] bg-slate-100 p-1 px-2 text-slate-550 font-black rounded-lg border">
                            سند {rma.claimDocumentId}
                          </span>
                        </div>

                        {/* Title part */}
                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-slate-900">{rma.partName}</h4>
                          <span className="text-[10.5px] text-slate-400 font-mono font-bold block">سيريال القطعة المعيبة: {rma.partSerial}</span>
                        </div>

                        {/* Defect Description */}
                        <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-xs text-slate-650 font-bold leading-relaxed">
                          <span className="text-[9px] text-slate-400 font-black block">العيب المصنعي الفعلي:</span>
                          {rma.defectDescription}
                        </div>

                        {/* Supplier Info */}
                        <div className="space-y-1 text-xs text-slate-600 font-bold border-t pt-2.5">
                          <p>المستورد / المورد: <span className="font-extrabold text-slate-900">{rma.supplierName}</span></p>
                          <p>تكلفة الشراء الأصلية: <span className="text-slate-900 font-mono font-extrabold">{rma.cost?.toLocaleString() || 0} ج.م</span></p>
                          <p>تاريخ التسجيل بالمرتجع: <span className="font-mono text-slate-450">{new Date(rma.dateCreated).toLocaleDateString('ar-EG')}</span></p>
                        </div>
                      </div>

                      {/* Supplier notes */}
                      {rma.notes && (
                        <div className="text-[10px] text-indigo-700 bg-indigo-50/50 p-2 rounded-xl border border-indigo-100/60 leading-relaxed font-bold">
                          💡 ملحوظة: {rma.notes}
                        </div>
                      )}

                      {/* Supplier resolve workflow */}
                      {rma.status === 'waiting_supplier' && (
                        <div className="border-t border-dashed pt-3.5 space-y-2">
                          <span className="text-[9.5px] font-black text-slate-500 block">مناولة المورد واستعادة الحق بالضمان:</span>
                          <div className="grid grid-cols-3 gap-1.5 text-[9.5px]">
                            
                            {/* Replaced item */}
                            <button
                              type="button"
                              onClick={() => {
                                const note = prompt('اكتب مواصفات قطعة الغيار البديلة المستلمة:');
                                if (note !== null) handleUpdateRmaStatus(rma.id!, 'replaced', note || 'استلام بديل أصلي');
                              }}
                              className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg transition-colors cursor-pointer text-center"
                            >
                              استلام بديل
                            </button>

                            {/* Refunded */}
                            <button
                              type="button"
                              onClick={() => {
                                const note = prompt('تأكيد استلام المبلغ نقداً من حساب المورد المالي (ملاحظات جردية):');
                                if (note !== null) handleUpdateRmaStatus(rma.id!, 'refunded', note || 'تصفية مالية للخزينة');
                              }}
                              className="p-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg transition-colors cursor-pointer text-center"
                            >
                              تصفية كاش
                            </button>

                            {/* Reject */}
                            <button
                              type="button"
                              onClick={() => {
                                const note = prompt('سبب رفض المورد لطلب الإرجاع والضمان:');
                                if (note !== null) handleUpdateRmaStatus(rma.id!, 'rejected', note || 'رفض المورد للنزاهة');
                              }}
                              className="p-1 px-2.5 bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-200 font-extrabold rounded-lg transition-colors cursor-pointer text-center"
                            >
                              رفض المطالبة
                            </button>

                          </div>
                        </div>
                      )}

                      {/* Claim document option */}
                      <button
                        onClick={() => {
                          setSelectedClaimRma(rma);
                          setActiveTab('claim_docs');
                          toast.success(`✓ تم توجيه السند ${rma.claimDocumentId} شاشة المستندات الرسمية للمورد`);
                        }}
                        className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10.5px] rounded-xl cursor-pointer text-center transition-colors border border-slate-200 mt-2 block"
                      >
                        معاينة وطباعة مستند مطالبة المورد 📄
                      </button>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CLAIM DOCUMENT PREVIEW / PRINT */}
      {activeTab === 'claim_docs' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-3xs text-right space-y-6 rma-main-font">
          <div className="flex border-b pb-3 justify-between items-center">
            <div>
              <h3 className="text-sm font-black text-slate-900">مجمع مستندات المطالبة بملحقات RMA بالضمان المالي للموردين</h3>
              <p className="text-[11px] text-slate-500 font-bold">بإمكانك معاينة المستند المولد تلقائياً، نسخ محتواه أو توجيهه للطباعة لإثبات معلمات العطب للمتورد</p>
            </div>
            
            {/* Quick selector of Claims */}
            {rmas.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-450 shrink-0">اختر مسودة السند:</span>
                <select
                  value={selectedClaimRma?.id || ''}
                  onChange={(e) => {
                    const matched = rmas.find(r => r.id === parseInt(e.target.value));
                    if (matched) setSelectedClaimRma(matched);
                  }}
                  className="p-1.5 pr-6 bg-slate-100 border text-xs font-black rounded-lg text-slate-800"
                >
                  <option value="">-- اختر سنداً لمعاينته طباعياً --</option>
                  {rmas.map(r => (
                    <option key={r.id} value={r.id}>
                      مسودة {r.claimDocumentId} - {r.partName} ({r.supplierName})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {selectedClaimRma ? (
            <div className="space-y-4">
              
              {/* Document actions widget */}
              <div className="flex items-center gap-2 justify-end bg-slate-50 p-2 rounded-xl border">
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                    toast.success('تم إرسال مستند المطالبة بالطابعة!');
                  }}
                  className="p-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shadow-3xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  طباعة السند الورقي للشركة
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const fullText = `
سند مطالبة عيب صناعة رقم: ${selectedClaimRma.claimDocumentId}
تاريخ الإصدار: ${new Date(selectedClaimRma.dateCreated).toLocaleDateString('ar-EG')}
الموجه إلى المورد الكريم: ${selectedClaimRma.supplierName}
القطعة المطلوبة: ${selectedClaimRma.partName}
متطابقة السيريال: ${selectedClaimRma.partSerial}
توصيف عيب المعاينة: ${selectedClaimRma.defectDescription}
القيمة التعويضية للمطالبة: ${selectedClaimRma.cost ? selectedClaimRma.cost.toLocaleString() + ' ج.م' : 'بديل متوافق'}
بوابة الصيانة الرقمية ولائحة الضمانات.
                    `;
                    navigator.clipboard.writeText(fullText);
                    toast.success('✓ تم نسخ تفاصيل مستند المطالبة بنجاح!');
                  }}
                  className="p-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  نسخ نص المطالبة 📋
                </button>
              </div>

              {/* PDF/PRINT standard template design */}
              <div className="border border-slate-250 p-8 rounded-3xl space-y-6 max-w-3xl mx-auto bg-amber-50/5 relative shadow-3xs text-slate-800" id="claim-document-raw">
                
                {/* Decorative background logo */}
                <div className="absolute right-4 top-4 opacity-5 pointer-events-none">
                  <ShieldCheck className="w-48 h-48 text-slate-900" />
                </div>

                {/* Header design */}
                <div className="flex justify-between items-start border-b pb-4">
                  <div className="text-right">
                    <h2 className="text-base font-black text-slate-950">ورشة الصيانة الرقمية وتوكيل اللوجستيات بالرمز</h2>
                    <p className="text-[10px] text-slate-450 font-bold">فرع خدمة الصيانة الذاتية والوطنية للأجهزة</p>
                    <p className="text-[9.5px] text-slate-400 font-mono block">كييف - خاركوف - لفيف للتنقلات المشفرة</p>
                  </div>
                  <div className="text-left font-black text-xs space-y-1 text-slate-900 border-r border-slate-150 pr-4">
                    <div className="text-amber-700 font-extrabold text-sm font-mono underline">{selectedClaimRma.claimDocumentId}</div>
                    <div className="font-mono">تاريخ المطالبة بالضمان: {new Date(selectedClaimRma.dateCreated).toLocaleDateString('ar-EG')}</div>
                    <div>حالة المطالبة: <span className="underline">{selectedClaimRma.status === 'waiting_supplier' ? 'بانتظار موافقة المورد' : 'مغلق ومسجل بالدفاتر'}</span></div>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center bg-slate-900 text-white rounded-xl py-2 px-10 border shadow-3xs">
                  <h3 className="text-xs font-black tracking-widest leading-none">مستند مطالبة RMA واستبدال قطعة عيب صناعي</h3>
                </div>

                {/* Terms and context */}
                <div className="space-y-4">
                  
                  {/* Supplier section */}
                  <div className="grid grid-cols-2 gap-4 border p-4 rounded-2xl bg-white shadow-3xs">
                    <div>
                      <span className="text-[9.5px] text-slate-400 font-black block">موجه إلى السيد المورد:</span>
                      <span className="text-xs font-black text-slate-900">{selectedClaimRma.supplierName}</span>
                    </div>
                    <div className="text-left">
                      <span className="text-[9.5px] text-slate-400 font-black block">مسؤول الاستلام:</span>
                      <span className="text-xs font-extrabold text-slate-705">روستيسلاف كوفالينكو</span>
                    </div>
                  </div>

                  {/* Part defect logs */}
                  <div className="space-y-3.5 border p-5 rounded-2xl bg-white shadow-3xs text-xs font-bold text-slate-700">
                    <div className="flex justify-between border-b pb-1.5">
                      <span>اسم قطعة الصيانة الإلكترونية المطلوبة بالضمان:</span>
                      <span className="text-slate-900 font-black">{selectedClaimRma.partName}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1.5">
                      <span>الرقم المتسلسل (Serial Number) بالقطعة المعيبة:</span>
                      <span className="text-indigo-700 font-mono font-black">{selectedClaimRma.partSerial}</span>
                    </div>
                    {selectedClaimRma.orderId && (
                      <div className="flex justify-between border-b pb-1.5">
                        <span>مرتبط بملف كارت صيانة الورشة الأصلي:</span>
                        <span className="text-slate-905 font-mono font-black">#DEV-{selectedClaimRma.orderId}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-b pb-1.5">
                      <span>تكلفة المطالبة المالية المستحقة للمقاصة السنوية:</span>
                      <span className="text-rose-600 font-mono font-black underline">{(selectedClaimRma.cost || 0).toLocaleString()} ج.م</span>
                    </div>
                  </div>

                  {/* Defect description text layout */}
                  <div className="bg-slate-50 border p-4.5 rounded-xl space-y-1.5 text-xs">
                    <span className="text-[9.5px] font-black text-slate-500 block">شرح وتوصيف عيب التصنيع بمعرفة مهندس الورشة:</span>
                    <p className="text-slate-800 leading-relaxed font-bold">
                      "{selectedClaimRma.defectDescription}"
                    </p>
                  </div>

                  {/* Notice of regulations */}
                  <div className="text-[9.5px] text-slate-450 leading-relaxed font-bold border-t pt-4">
                    تنبيه: يتوجب على السادة الموردين مطابقة هذا المستند والقطع المرتجعة المرفقة بمخفر الضمان لإرسال بدلاء صالحة أو مطاردتها بالرصيد المفتوح بحد أقصى 7 أيام عمل من تاريخ توريد تذكرة الشحن. نشكركم جزيل الشكر لعظيم دعمكم الفني ولوجستياتكم للورش الرقمية.
                  </div>

                  {/* Signature and logs */}
                  <div className="flex justify-between pt-6 text-[10.5px] text-slate-450 font-black border-dashed border-t">
                    <div className="text-right">
                      <span>توقيع وختم ورشة الصيانة الرقمية:</span>
                      <div className="h-10"></div>
                      <p className="text-slate-700">سفيتلانا باشينكو (مديرة المنافذ)</p>
                    </div>
                    <div className="text-left">
                      <span>توقيع وختم المندوب / المورد المستلم:</span>
                      <div className="h-10"></div>
                      <p className="text-slate-700">............................................</p>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          ) : (
            <div className="p-20 text-center text-slate-400 border border-dashed rounded-3xl space-y-2">
              <FileText className="w-10 h-10 mx-auto opacity-35" />
              <p className="text-xs font-bold">
                يرجى تحديد أو اختيار مسودة مطالبة RMA من قائمة الأجهزة بالتبويب السابق، لعرض سند مطالبة الاستبدال والضمان وصيغ الطباعة الموردية.
              </p>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD DEFECTIVE PART RMA CLAIM */}
      {isRmaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 rma-main-font" dir="rtl">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 max-w-lg w-full space-y-4 shadow-xl text-right">
            
            {/* Modal header */}
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <Truck className="w-5 h-5 text-amber-500 shrink-0" />
                تسجيل مطالبة RMA عيب مصنعي ونقل لمخزن المعطلات
              </h3>
              <button
                onClick={() => setIsRmaModalOpen(false)}
                className="text-slate-450 hover:text-slate-650 cursor-pointer text-sm font-black"
              >
                ✕
              </button>
            </div>

            {/* Modal input form */}
            <form onSubmit={handleAddRma} className="space-y-3.5 text-right">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                {/* Part Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700">اسم قطعة الغيار التالفة:</label>
                  <input
                    type="text"
                    value={rmaPartName}
                    onChange={(e) => setRmaPartName(e.target.value)}
                    placeholder="مثال: شاشة Samsung A54 Original"
                    className="w-full text-xs font-bold p-2.5 border rounded-xl bg-slate-50 focus:outline-none focus:bg-white text-right"
                  />
                </div>

                {/* Part Serial */}
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700">رقم السيريال التالف (إن وجد):</label>
                  <input
                    type="text"
                    value={rmaPartSerial}
                    onChange={(e) => setRmaPartSerial(e.target.value)}
                    placeholder="مثال: OLED-SAM-S23-9912"
                    className="w-full text-xs font-bold p-2.5 border rounded-xl bg-slate-50 focus:outline-none focus:bg-white text-right font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                {/* Supplier select (Christian Ukrainian names on system suppliers) */}
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700">مورد قطعة الغيار للمطالبة بضمانها:</label>
                  <select
                    value={rmaSupplierId}
                    onChange={(e) => setRmaSupplierId(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 border rounded-xl bg-slate-50 focus:outline-none focus:bg-white text-right text-slate-800"
                  >
                    <option value="">-- اختر المورد المسؤول --</option>
                    {suppliers.map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                  </select>
                </div>

                {/* Claim purchase cost */}
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700">تكلفة الشراء الاستيرادية المقارنة (ج.م):</label>
                  <input
                    type="number"
                    value={rmaCost}
                    onChange={(e) => setRmaCost(e.target.value)}
                    placeholder="التكلفة بالجنيه"
                    className="w-full text-xs font-bold p-2.5 border rounded-xl bg-slate-50 focus:outline-none focus:bg-white text-right font-mono"
                  />
                </div>
              </div>

              {/* Connected Order Link (Optional) */}
              <div className="space-y-1 text-right">
                <label className="block text-xs font-black text-slate-700">ربط مع تذكرة/كارت صيانة بالورشة (اختياري):</label>
                <input
                  type="number"
                  value={rmaOrderId}
                  onChange={(e) => setRmaOrderId(e.target.value)}
                  placeholder="رقم كارت الصيانة ههنا مثلاً: 101"
                  className="w-full text-xs font-bold p-2.5 border rounded-xl bg-slate-50 focus:outline-none focus:bg-white text-right font-mono"
                />
              </div>

              {/* Defect Description */}
              <div className="space-y-1 text-right">
                <label className="block text-xs font-black text-slate-700">تفصيل ووصف العيب المصنعي والخلل الفني للقطعة:</label>
                <textarea
                  value={rmaDefect}
                  onChange={(e) => setRmaDefect(e.target.value)}
                  placeholder="مثال: ظهور بكسل ميت خط طاقة معطل انتفاخ مبكر بالخلايا..."
                  className="w-full text-xs font-bold p-2 bg-slate-50 border rounded-xl focus:outline-none min-h-[75px] text-right"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1 text-right">
                <label className="block text-xs font-black text-slate-700">ملاحظات إضافية:</label>
                <input
                  type="text"
                  value={tempNotes}
                  onChange={(e) => setTempNotes(e.target.value)}
                  placeholder="موقع تخزينه بالمعطلات ميكولا باشينكو المشرف..."
                  className="w-full text-xs font-bold p-2.5 border rounded-xl bg-slate-50 focus:outline-none focus:bg-white text-right"
                />
              </div>

              {/* Actions buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  حفظ وتسجيل المطالبة بمخزن المرتجعات ✅
                </button>
                <button
                  type="button"
                  onClick={() => setIsRmaModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 font-black text-xs rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء الخروج
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Toast provider */}
      <Toaster position="bottom-left" />

    </div>
  );
};

export default ComputerMobileRMA;
