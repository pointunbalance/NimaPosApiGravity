import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { MaintenanceOrder, Product, MaintenancePart } from '../../types';
import { AccountingEngine } from '../../services/AccountingEngine';
import {
  Zap,
  User,
  Phone,
  Smartphone,
  Monitor,
  Search,
  CheckCircle2,
  Printer,
  Trash2,
  DollarSign,
  AlertTriangle,
  FileText,
  Clock,
  Sparkles,
  ChevronDown,
  Info
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

// Instant Service Presets
interface ExpressServicePreset {
  id: string;
  name: string;
  price: number;
  category: 'mobile' | 'computer' | 'both';
  description: string;
}

const INSTANT_SERVICES: ExpressServicePreset[] = [
  {
    id: 'screen_protector',
    name: 'تغيير لاصقة حماية "اسكرينة" جيلاتين نانو نيو',
    price: 150,
    category: 'mobile',
    description: 'تركيب اسكرينة نانو مرنة عالية الحماية لشاشة الهاتف لحمايتها من الخدوش والكسور.'
  },
  {
    id: 'battery_iphone_instant',
    name: 'تغيير بطارية هاتف ذكي (أمام العميل)',
    price: 900,
    category: 'mobile',
    description: 'استبدال خلية البطارية التالفة ببطارية أصلية عالية السعة مع تصفير دورات الشحن.'
  },
  {
    id: 'port_cleaning',
    name: 'تنظيف سوكيت الشحن ومخارج الصوت المكبرة وتطهيرها',
    price: 100,
    category: 'mobile',
    description: 'إزالة الأتربة والوبر العالق بمنفذ الشحن لضمان استقرار فولتية التماس وتدفق الشحن.'
  },
  {
    id: 'glass_glass_shock',
    name: 'لاصقة حماية زجاج حراري ثلاثي الأبعاد 3D مقاوم للصدمات',
    price: 200,
    category: 'mobile',
    description: 'تركيب درع حماية زجاجي فائق المقاومة مع طبقة حجب البصمات والمحافظة على اللمس.'
  },
  {
    id: 'os_software_flash',
    name: 'تنزيل سوفتوير فلاش وإعادة ضبط المصنع واسترجاع البيانات المستودعة',
    price: 300,
    category: 'both',
    description: 'تثبيت نظام التشغيل الأحدث بأدوات الفلاش الرسمية وحل مشاكل التعليق والتوقف.'
  },
  {
    id: 'ram_paste_cleaning',
    name: 'تنظيف مروحة تبريد اللابتوب وتغيير المعجون الحراري كولينر',
    price: 450,
    category: 'computer',
    description: 'تفكيك الجهاز لتطهير دورة التهوية والردياتير وحقن معجون تبريد فائق الناقلية مع الفحص.'
  },
  {
    id: 'custom_spot_repair',
    name: 'صيانة سريعة مخصصة / خدمة فورية مضافة',
    price: 0,
    category: 'both',
    description: 'صيانة فورية مخصصة بحسب اتفاق الفني مع العميل مع إمكانية تعديل السعر يدوياً.'
  }
];

const ComputerMobileExpress: React.FC = () => {
  // DB Queries
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const customers = useLiveQuery(() => db.customers.toArray()) || [];
  const accounts = useLiveQuery(() => db.accounts.toArray()) || [];

  // Form States - Customer Info (Pre-filled with Ukrainian names as required)
  const [customerName, setCustomerName] = useState('رومان كوفالينكو');
  const [customerPhone, setCustomerPhone] = useState('0124356789');
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [showCustSugg, setShowCustSugg] = useState(false);

  // Form States - Device Info
  const [deviceCategory, setDeviceCategory] = useState<'mobile' | 'computer'>('mobile');
  const [deviceBrand, setDeviceBrand] = useState('Apple');
  const [deviceModel, setDeviceModel] = useState('iPhone 15 Pro');
  const [devicePassword, setDevicePassword] = useState('');

  // Form States - Service Setup
  const [selectedPresetId, setSelectedPresetId] = useState<string>('screen_protector');
  const [customPrice, setCustomPrice] = useState<number>(150);
  const [customServiceName, setCustomServiceName] = useState('');
  const [technicianName, setTechnicianName] = useState('تاراس هورتسا'); // Ukrainian name

  // Inventory Integration
  const [partSearch, setPartSearch] = useState('');
  const [selectedPart, setSelectedPart] = useState<Product | null>(null);
  const [showPartDropdown, setShowPartDropdown] = useState(false);

  // Printer Receipt States
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [lastSavedOrder, setLastSavedOrder] = useState<MaintenanceOrder | null>(null);

  // Auto-set price according to selected preset
  useEffect(() => {
    const preset = INSTANT_SERVICES.find(p => p.id === selectedPresetId);
    if (preset) {
      if (preset.id === 'custom_spot_repair') {
        setCustomPrice(preset.price || 200);
        setCustomServiceName('خدمة صيانة مخصصة فورية بانتظار العميل');
      } else {
        setCustomPrice(preset.price);
        setCustomServiceName(preset.name);
      }
    }
  }, [selectedPresetId]);

  // Handle Customer Name change & Suggestion lookup
  const handleNameChange = (val: string) => {
    setCustomerName(val);
    if (!val.trim()) {
      setCustomerSuggestions([]);
      return;
    }
    const matched = customers.filter(c =>
      c.name.includes(val) || (c.phone && c.phone.includes(val))
    );
    setCustomerSuggestions(matched.slice(0, 5));
    setShowCustSugg(true);
  };

  const selectCustomer = (c: any) => {
    setCustomerName(c.name);
    setCustomerPhone(c.phone || '');
    setShowCustSugg(false);
    toast.success(`تم ربط حركة العميل الدائم: ${c.name}`);
  };

  // Filter parts for repair category
  const filteredParts = products.filter(p => {
    const isMntcCat = p.category === 'قطع غيار صيانة' || p.category?.includes('صيانة') || p.name?.includes('غيار') || p.name?.includes('شاشة') || p.name?.includes('بطارية');
    const matchesSearch = p.name.toLowerCase().includes(partSearch.toLowerCase()) || 
                          p.barcode?.toLowerCase().includes(partSearch.toLowerCase());
    return isMntcCat && matchesSearch;
  });

  // Financial calculations
  const serviceCharge = customPrice;
  const partCharge = selectedPart ? (selectedPart.price || 0) : 0;
  const totalAmount = serviceCharge + partCharge;

  // Process the Express Instant Repair
  const handleCheckoutExpress = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error('فضلاً أدخل اسم العميل المستلم لتسجيل الفاتورة السريعة');
      return;
    }
    if (!customerPhone.trim()) {
      toast.error('رقم هاتف العميل ضروري للمتابعة والتحقق المحاسبي');
      return;
    }
    if (totalAmount <= 0) {
      toast.error('تكلفة الفاتورة الإجمالية يجب أن تكون مبدئياً أكبر من الصفر');
      return;
    }

    try {
      // 1. Double check / register Customer
      let custId: number;
      const exist = customers.find(c => c.phone === customerPhone.trim());
      if (exist?.id) {
        custId = exist.id;
        // Update customer totalSpent
        await db.customers.update(custId, {
          totalSpent: (exist.totalSpent || 0) + totalAmount
        });
      } else {
        custId = await db.customers.add({
          name: customerName,
          phone: customerPhone,
          totalSpent: totalAmount
        });
      }

      // Prepare Consumed Parts array
      const consumedParts: MaintenancePart[] = [];
      if (selectedPart?.id) {
        consumedParts.push({
          productId: selectedPart.id,
          name: selectedPart.name,
          quantity: 1,
          price: selectedPart.price || 0,
          cost: selectedPart.costPrice || 0
        });

        // 2. Subtract Product stock immediately
        const prevStock = selectedPart.stock || 0;
        const newStock = Math.max(0, prevStock - 1);
        await db.products.update(selectedPart.id, {
          stock: newStock
        });
        toast.success(`تم سحب قطعة [${selectedPart.name}] وتخفيض المخزن بمقدار 1 وحدة`);
      }

      // 3. Create Delivered / Closed Maintenance Order matching Express Protocol
      const newOrderObj: MaintenanceOrder = {
        date: new Date(),
        customerId: custId,
        customerName: customerName,
        customerPhone: customerPhone,
        deviceType: deviceCategory === 'mobile' ? 'موبايل/تابلت' : 'كمبيوتر/لابتوب',
        deviceBrand: deviceBrand,
        deviceModel: deviceModel,
        devicePassword: devicePassword,
        issueDescription: `صيانة فورية عاجلة (انتظار العميل) - ${customServiceName}`,
        expectedCost: totalAmount,
        actualCost: totalAmount,
        deposit: totalAmount, // fully paid
        parts: consumedParts,
        status: 'delivered', // fast-track is instantly delivered
        technicianName: technicianName,
        notes: `مسار الصيانة السريعة - استلام وإصلاح وتسليم ودفع كاش فوري متزامن. تفاصيل الخدمة: ${customServiceName}`,
        deliveredDate: new Date(),
        isExpress: true,
        expressActionDetails: customServiceName
      };

      const savedOrderId = await db.maintenanceOrders.add(newOrderObj);
      newOrderObj.id = savedOrderId;
      setLastSavedOrder(newOrderObj);

      // 4. Update core current shift cash balances if shift exists
      const currentShift = await db.shifts.where('status').equals('open').first();
      if (currentShift?.id) {
        await db.shifts.update(currentShift.id, {
          expectedCash: (currentShift.expectedCash || 0) + totalAmount,
          cashSales: (currentShift.cashSales || 0) + totalAmount
        });
        toast.success('تم تغذية خزينة الوردية النشطة بمستحقات الفاتورة الفورية بالتزامن');
      }

      // 5. Write double-entry Accounting Journal records
      try {
        const cashAcc = accounts.find(a => a.code === '1010') || await db.accounts.where('code').equals('1010').first();
        const revAcc = accounts.find(a => a.code === '4010') || await db.accounts.where('code').equals('4010').first();
        
        if (cashAcc && revAcc) {
          await AccountingEngine.postEntry({
            date: new Date(),
            reference: `PCMOB-EXP-${savedOrderId}`,
            description: `فاتورة صيانة فورية عاجلة #${savedOrderId} بانتظار العميل - خدمة ${customServiceName}`,
            lines: [
              { 
                accountId: cashAcc.id!, 
                accountName: cashAcc.name, 
                debit: totalAmount, 
                credit: 0, 
                description: `استلام قيمة الفاتورة الفورية والقطع بالكامل` 
              },
              { 
                accountId: revAcc.id!, 
                accountName: revAcc.name, 
                debit: 0, 
                credit: totalAmount, 
                description: `إثبات إيراد الخدمة الفورية السريعة للعميل` 
              }
            ]
          });
          toast.success('تمت كتابة قيود الاستحقاق المحاسبي ونقل الأرصدة بدفتر اليومية بنجاح');
        }
      } catch (accountingError) {
        console.warn("Express accounting ledger post error: ", accountingError);
      }

      toast.success(`تمت عملية الفاتورة الفورية بنجاح! كود الحركة #${savedOrderId}`);
      
      // Auto open receipt print dialog/modal
      setShowPrintModal(true);

      // Reset parts list & options
      setPartSearch('');
      setSelectedPart(null);
      setDevicePassword('');
      // Keep customer details initialized with random Ukrainian name to ease tests
      const nextUser = ['أندري شفتشينكو', 'ميكولا فيديروف', 'ياروسلاف بويكو', 'رومان ميلنيك', 'تاراس ليتفينوف'][Math.floor(Math.random() * 5)];
      setCustomerName(nextUser);
      setCustomerPhone('012' + Math.floor(1000000 + Math.random() * 9000000));
    } catch (err: any) {
      toast.error('أخفق حفظ الحركة بالخوادم المفتوحة محلياً: ' + err.message);
    }
  };

  // Raw printable invoice previewer
  const launchPrintWindow = () => {
    if (!lastSavedOrder) return;
    const order = lastSavedOrder;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('أخفق فتح السقف المنبثق للطباعة، يرجى تفعيل فتح النوافذ المنبثقة بالمتصفح');
      return;
    }

    const docStr = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="utf-8">
          <title>فاتورة صيانة فورية #${order.id}</title>
          <style>
            body { font-family: sans-serif; direction: rtl; padding: 30px; color: #2c3e50; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #2c3e50; padding-bottom: 12px; margin-bottom: 20px; }
            .header h1 { font-size: 22px; margin: 0; color: #1e3a8a; }
            .header p { margin: 4px 0; font-size: 12px; color: #7f8c8d; }
            .meta-box { border: 1.5px solid #dcdde1; padding: 15px; border-radius: 8px; margin-bottom: 20px; background: #fdfefe; }
            .meta-item { display: flex; justify-content: space-between; font-size: 13.5px; padding: 5px 0; border-bottom: 1px dashed #eee; }
            .meta-item:last-child { border-bottom: none; }
            .title-bold { font-weight: bold; color: #1e293b; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
            th, td { border: 1px solid #bdc3c7; padding: 8px; text-align: right; }
            th { background-color: #f1f5f9; color: #475569; font-weight: bold; }
            .badge-express { display: inline-block; background-color: #f59e0b; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
            .financial-summary { background: #ecfdf5; border: 1px solid #a7f3d0; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: right; }
            .f-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px; }
            .f-total { font-size: 16px; font-weight: bold; color: #065f46; border-top: 2px solid #a7f3d0; padding-top: 5px; margin-top: 5px; }
            .regulatory-alert { background: #fffcf0; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px; margin-top: 20px; font-size: 11px; color: #b45309; }
            .sigs { display: flex; justify-content: space-between; margin-top: 40px; font-size: 12px; font-weight: bold; }
            .footer { text-align: center; margin-top: 35px; font-size: 11px; color: #7f8c8d; border-top: 1px dashed #eee; padding-top: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>مركز كود تك لصيانة الكمبيوتر والموبايل 💻📱</h1>
            <p>سند وفاتورة صيانة فورية عاجلة "On-the-Spot Ticket"</p>
            <p style="font-weight: bold; margin-top: 8px;">حركة رقم: #${order.id} | <span class="badge-express">خدمة فورية - انتظار العميل</span></p>
          </div>

          <div class="meta-box">
            <div class="meta-item"><span class="title-bold">اسم العميل المستلم:</span><span>${order.customerName}</span></div>
            <div class="meta-item"><span class="title-bold">رقم الهاتف:</span><span>${order.customerPhone}</span></div>
            <div class="meta-item"><span class="title-bold">فئة وتصنيف الجهاز:</span><span>${order.deviceType}</span></div>
            <div class="meta-item"><span class="title-bold">موديل وماركة الجهاز:</span><span>${order.deviceBrand || ''} ${order.deviceModel}</span></div>
            <div class="meta-item"><span class="title-bold">رقم الرمز والسر:</span><span>${order.devicePassword || 'بدون قفل'}</span></div>
            <div class="meta-item"><span class="title-bold">المهندس القائم بالإصلاح:</span><span>${order.technicianName}</span></div>
            <div class="meta-item"><span class="title-bold">تاريخ المعاملة والتشغيل:</span><span>${new Date(order.date).toLocaleString('ar-EG')}</span></div>
          </div>

          <h3>تفاصيل الخدمات والأعمال التي تم الانتهاء منها فوراً:</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 60%;">الخدمة / الإجراء الفني السريع</th>
                <th style="width: 20%;">التصنيف والتكلفة</th>
                <th style="width: 20%;">المخطط الزمني</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${order.expressActionDetails}</strong></td>
                <td>رسوم خدمة الصيانة المباشرة</td>
                <td>فوري (نفس اللحظة)</td>
              </tr>
            </tbody>
          </table>

          ${order.parts && order.parts.length > 0 ? `
            <h3>قطع الغيار والمستلزمات المسحوبة من المخزن:</h3>
            <table>
              <thead>
                <tr>
                  <th>اسم القطعة الإلكترونية</th>
                  <th>الكمية</th>
                  <th>السعر الفردي</th>
                  <th>الإجمالي لقطع الغيار</th>
                </tr>
              </thead>
              <tbody>
                ${order.parts.map(p => `
                  <tr>
                    <td>${p.name}</td>
                    <td>${p.quantity}</td>
                    <td>${p.price.toLocaleString()} ج.م</td>
                    <td>${(p.price * p.quantity).toLocaleString()} ج.م</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}

          <div class="financial-summary">
            <div class="f-row">
              <span>قيمة الخدمة والأعمال اليدوية:</span>
              <span>${serviceCharge.toLocaleString()} ج.م</span>
            </div>
            ${order.parts && order.parts.length > 0 ? `
              <div class="f-row">
                <span>إجمالي قيمة قطع الغيار المدمجة:</span>
                <span>${partCharge.toLocaleString()} ج.م</span>
              </div>
            ` : ''}
            <div class="f-row f-total">
              <span>إجمالي قيمة الفاتورة سداد فوري كامل:</span>
              <span>${order.actualCost?.toLocaleString()} ج.م</span>
            </div>
          </div>

          <div class="regulatory-alert">
            🚨 <strong>شروط الضمان وسياسة الاستلام:</strong><br/>
            - يسري ضمان قطع الغيار والخدمات الفورية المنجزة بانتظار العميل لمدة 14 يوماً من تاريخ الطباعة في هذا السند.<br/>
            - يسقط الضمان في حال العبث بالجهاز داخلياً أو تعرضه للصدمات والارتطام العنيف أو التعرض للسوائل بالهاتف.
          </div>

          <div class="sigs">
            <span>توقيع موظف الاستقبال الفني: .......................</span>
            <span>توقيع العميل المستلم بالرضا والقبول: .......................</span>
          </div>

          <div class="footer">
            <p>سعداء بثقتكم الدائمة ونتطلع لخدمتكم دائمًا بأرقى معايير الاتقان والسرعة!</p>
          </div>

          <script>
            window.onload = () => { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(docStr);
    printWindow.document.close();
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

      {/* Title & Banner area */}
      <div className="bg-white p-8 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border border-slate-100 shadow-xs">
        <div className="space-y-2 text-right">
          <span className="px-3.5 py-1 text-[10px] font-black tracking-tight text-amber-700 bg-amber-50 border border-amber-200/60 rounded-full inline-flex items-center gap-1.5 shadow-3xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            لوجستيات الخدمة الفورية العاجلة (On-the-spot Service)
          </span>
          <h1 className="text-2xl font-black text-slate-900">مسار الصيانة السريعة - انتظار العميل ⚡</h1>
          <p className="text-xs text-slate-500 font-medium">
            دمج مراحل الاستلام، السحب الفوري لقطع الغيار، والتوثيق والقيود المحاسبية وتسليم الفاتورة في "خطوة واحدة" دون إدراج الجهاز برفوف الانتظار.
          </p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Form Input Panel - 7 Cols */}
        <form onSubmit={handleCheckoutExpress} className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/50 shadow-xs space-y-6 text-right">
          
          {/* Section 1: Customer Data */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2">
              <User className="w-4 h-4 text-blue-500" />
              بيانات العميل المستلم والاتصال
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Customer Name */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-black text-slate-700 block">اسم العميل بالكامل:</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 pointer-events-none">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onFocus={() => setShowCustSugg(true)}
                    placeholder="رومان ميلنيك..."
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-right"
                  />
                  {showCustSugg && customerSuggestions.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {customerSuggestions.map((cu, i) => (
                        <div
                          key={i}
                          onClick={() => selectCustomer(cu)}
                          className="p-2.5 hover:bg-slate-50 cursor-pointer text-xs font-bold text-slate-700 flex justify-between items-center transition-all"
                        >
                          <span>{cu.name}</span>
                          <span className="text-[10px] text-slate-450 font-mono" dir="ltr">{cu.phone}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">رقم هاتف العميل للتواصل:</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 pointer-events-none">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="رقم الهاتف (مثل: 0102345678)..."
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-right"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Device Specs */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2">
              <Smartphone className="w-4 h-4 text-emerald-500" />
              مواصفات وتصنيف جهاز العميل
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">فئة ونوع الجهاز:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeviceCategory('mobile');
                      setDeviceBrand('Apple');
                      setDeviceModel('iPhone 15 Pro');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all select-none cursor-pointer ${
                      deviceCategory === 'mobile'
                        ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-3xs'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    موبايل / هاتف ذكي
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeviceCategory('computer');
                      setDeviceBrand('Dell');
                      setDeviceModel('Latitude 5420');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all select-none cursor-pointer ${
                      deviceCategory === 'computer'
                        ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-3xs'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    لابتوب / كمبيوتر
                  </button>
                </div>
              </div>

              {/* Password pattern */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">رمز قفل الشاشة (إن وجد للفحص):</label>
                <input
                  type="text"
                  value={devicePassword}
                  onChange={(e) => setDevicePassword(e.target.value)}
                  placeholder="مثال: 1234 أو نمط أو بدون قفل..."
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Brand and Model */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">ماركة الجهاز (تثبيت):</label>
                <input
                  type="text"
                  required
                  value={deviceBrand}
                  onChange={(e) => setDeviceBrand(e.target.value)}
                  placeholder="مثال: Apple / Samsung / HP / Asus..."
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-right"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">موديل الجهاز الدقيق:</label>
                <input
                  type="text"
                  required
                  value={deviceModel}
                  onChange={(e) => setDeviceModel(e.target.value)}
                  placeholder="مثال: iPhone 13 Pro Max / ThinkPad L14..."
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-right"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Preset Rapid Service Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              الخدمة الفورية المطلوبة (انتظار العميل)
            </h3>

            {/* Presets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INSTANT_SERVICES.map((p) => {
                const isSelected = selectedPresetId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPresetId(p.id)}
                    className={`p-3.5 rounded-xl border text-right transition-all select-none cursor-pointer flex flex-col justify-between h-28 ${
                      isSelected
                        ? 'bg-amber-50/70 border-amber-300 text-amber-950 shadow-3xs hover:bg-amber-100/50 ring-2 ring-amber-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-black block leading-tight">{p.name}</span>
                      <span className="text-[10px] text-slate-500 block line-clamp-2 leading-relaxed font-bold">{p.description}</span>
                    </div>
                    <div className="flex justify-between items-center w-full mt-2 pt-1 border-t border-dashed border-slate-200">
                      <span className="text-[10px] text-slate-450 font-bold">رسوم الخدمة فورا</span>
                      <span className="text-xs font-black text-emerald-600">
                        {p.id === 'custom_spot_repair' ? 'مخصص/متغير' : `${p.price} ج.م`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Price control - visible for custom price modification */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-right w-full sm:w-auto">
                <span className="text-xs font-black text-slate-700 block">تكلفة الخدمة اليدوية والعمل الفني:</span>
                <p className="text-[10px] text-slate-400 font-bold">يمكنك تعديل رسوم الخدمة المتفق عليها يدوياً عبر هذا الصندوق.</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  required
                  value={customPrice}
                  onChange={(e) => setCustomPrice(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-28 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black text-center text-blue-600 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-slate-500 font-sans">جنيه مصري</span>
              </div>
            </div>

            {/* Custom service description if selected 'custom' preset */}
            {selectedPresetId === 'custom_spot_repair' && (
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">وصف الخدمة والصيانة الفورية المحددة:</label>
                <input
                  type="text"
                  required
                  value={customServiceName}
                  onChange={(e) => setCustomServiceName(e.target.value)}
                  placeholder="اكتب وصفاً مختصراً للعمل الفني المنجز (مثال: صيانة ميكروسكوب ومقوي إشارة)..."
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-right"
                />
              </div>
            )}
          </div>

          {/* Section 4: Optional Inventory Spare Part Pulling */}
          <div className="space-y-4">
            <div className="border-b pb-2 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                سحب قطعة غيار من الرف/المخزن بالتزامن (اختياري)
              </h3>
              {selectedPart && (
                <button
                  type="button"
                  onClick={() => setSelectedPart(null)}
                  className="text-[10px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 select-none transition-all cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> إلغاء ربط القطعة
                </button>
              )}
            </div>

            {selectedPart ? (
              <div className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-black text-indigo-950 block">✨ تم دمج وسحب قطعة غيار:</span>
                  <p className="text-[11px] text-indigo-800 font-bold">
                    {selectedPart.name} | المتبقي بالمستودع: <span className="text-amber-700 font-mono font-bold">{(selectedPart.stock || 0) - 1} قطع</span> (سينخفض فورا عند الحفظ)
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] bg-indigo-100/60 text-indigo-800 border border-indigo-200 font-black px-2.5 py-1 rounded-md text-xs">
                    {(selectedPart.price || 0).toLocaleString()} ج.م
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 relative">
                <label className="text-xs font-black text-slate-700 block">ابحث عن قطعة صيانة لموديل هذا الجهاز:</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 pointer-events-none">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={partSearch}
                    onChange={(e) => {
                      setPartSearch(e.target.value);
                      setShowPartDropdown(true);
                    }}
                    onFocus={() => setShowPartDropdown(true)}
                    placeholder="كتب اسم قطعة الغيار أو ابحث بالـ SKU الخاص بها..."
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-right"
                  />
                  {showPartDropdown && partSearch.trim().length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {filteredParts.length > 0 ? (
                        filteredParts.map((p, i) => (
                          <div
                            key={i}
                            onClick={() => {
                              if ((p.stock || 0) <= 0) {
                                toast.error('نفذت كمية قطعة الغيار هذه من مستودعات الصيانة');
                                return;
                              }
                              setSelectedPart(p);
                              setShowPartDropdown(false);
                            }}
                            className="p-2.5 hover:bg-slate-50 cursor-pointer text-xs font-bold text-slate-700 flex justify-between items-center transition-all"
                          >
                            <div className="text-right">
                              <span className="block font-black">{p.name}</span>
                              <span className="text-[10px] text-slate-400 font-bold block">متوفر: {p.stock || 0} قطع</span>
                            </div>
                            <span className="text-emerald-600 font-black">{(p.price || 0).toLocaleString()} ج.م</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-[11px] text-slate-400 font-bold">
                          لم يتم العثور على قطع غيار صيانة مطابقة في مخزن كود تك
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Tech assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 block">فني الصيانة السريعة القائم بالإصلاح:</label>
              <select
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-extrabold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-right cursor-pointer"
              >
                <option value="تاراس هورتسا">تاراس هورتسا (فني الكترونيات وموبايل)</option>
                <option value="بوهدان كوفال">بوهدان كوفال (فني بوردة وميكروسكوب)</option>
                <option value="ميكولا شفتش">ميكولا شفتش (فني سوفتوير وتهيئة)</option>
                <option value="ياروسلاف هرين">ياروسلاف هرين (مدير استقبال وصيانة سريعة)</option>
              </select>
            </div>

            <div className="flex items-end justify-start p-3 bg-slate-50 rounded-xl border border-slate-100 gap-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0 self-center" />
              <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                يصنف هذا الفني كمشرف للعملية الفورية وسيتم تسجيل عمولته المحتسبة بالتزامن بمجرد حفظ الفاتورة مباشرة بممتلكاته القياسية.
              </p>
            </div>
          </div>

        </form>

        {/* Live POS Bill Preview & Trigger Button - 5 Cols */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white text-right font-sans flex flex-col justify-between min-h-[550px] shadow-lg shadow-slate-950/20 relative overflow-hidden">
          
          {/* Top aesthetic accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-emerald-500 to-indigo-500"></div>

          <div className="space-y-6">
            
            {/* Ticket Header Preview */}
            <div className="text-center border-b border-dashed border-slate-700/60 pb-4 space-y-1.5">
              <h2 className="text-sm font-black tracking-tight text-amber-400 font-mono">⚡ LIVE CASHER TICKET PREVIEW ⚡</h2>
              <p className="text-[11px] text-slate-400 font-bold">معاينة مباشرة لشريط الإيصال الفوري (On-the-Spot)</p>
            </div>

            {/* Ticket Content Receipt Style */}
            <div className="bg-slate-950/60 border border-slate-800/80 p-5 rounded-2xl relative space-y-4">
              
              {/* Receipt Circles Aesthetic */}
              <div className="absolute -top-1.5 left-6 right-6 h-3 flex justify-between overflow-hidden">
                {Array.from({ length: 15 }).map((_, i) => (
                  <span key={i} className="w-2 h-2 rounded-full bg-slate-900 shrink-0"></span>
                ))}
              </div>

              {/* Company Banner inside receipt */}
              <div className="text-center space-y-1 border-b border-slate-850 pb-3">
                <span className="text-xs font-black text-slate-300">مركز كود تك لصيانة الإلكترونيات</span>
                <p className="text-[9px] text-slate-500 font-medium">سند استلام واستبدال وتسليم متزامن (فوري للعميل)</p>
              </div>

              {/* Row: Customer */}
              <div className="space-y-1.5 text-xs border-b border-slate-850 pb-3 font-semibold">
                <div className="flex justify-between items-center text-slate-400">
                  <span>العميل:</span>
                  <span className="text-slate-200 font-extrabold">{customerName || 'يرجى كتابة الاسم'}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>هاتف رئيسي:</span>
                  <span className="text-slate-200 font-mono">{customerPhone || 'يرجى كتابة الهاتف'}</span>
                </div>
              </div>

              {/* Row: Device */}
              <div className="space-y-1.5 text-xs border-b border-slate-850 pb-3">
                <div className="flex justify-between items-center text-slate-400">
                  <span>نوع وماركة الجهاز:</span>
                  <span className="text-slate-200 font-bold">{deviceCategory === 'mobile' ? 'هاتف موبايل' : 'لابتوب/كمبيوتر'} - {deviceBrand}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>الموديل المحسوب:</span>
                  <span className="text-slate-200 font-bold">{deviceModel || 'يرجى التحديد'}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>قفل الفحص المبدئي:</span>
                  <span className="text-slate-200 font-mono">{devicePassword || 'بدون قفل'}</span>
                </div>
              </div>

              {/* Row: Task details */}
              <div className="space-y-2 text-xs border-b border-slate-850 pb-3">
                <span className="text-[10px] text-slate-500 font-extrabold block">الأعمال الفنية وقطع الغيار المشمولة:</span>
                
                {/* Custom Service */}
                <div className="flex justify-between items-start gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-850">
                  <div className="space-y-0.5 text-right flex-1">
                    <span className="block text-[11px] font-black text-slate-200">{customServiceName || 'يرجى كتابة الخدمة'}</span>
                    <span className="text-[9px] text-slate-500 font-bold block">شغل يد ومصنعية فنية سريعة</span>
                  </div>
                  <span className="text-xs font-black text-emerald-400 shrink-0">{serviceCharge} ج.م</span>
                </div>

                {/* Subscribed Part */}
                {selectedPart && (
                  <div className="flex justify-between items-start gap-2 bg-indigo-950/40 p-2 rounded-lg border border-indigo-900/30">
                    <div className="space-y-0.5 text-right flex-1">
                      <span className="block text-[11px] font-black text-indigo-200">{selectedPart.name}</span>
                      <span className="text-[9px] text-indigo-400 font-bold block">سحب وسحب فوري من مخزن الرفوف</span>
                    </div>
                    <span className="text-xs font-black text-indigo-400 shrink-0">{partCharge} ج.م</span>
                  </div>
                )}
              </div>

              {/* Row: Financial totals breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>مصنعية الخدمة السريعة:</span>
                  <span>{serviceCharge.toLocaleString()} ج.م</span>
                </div>
                {selectedPart && (
                  <div className="flex justify-between items-center text-slate-400">
                    <span>ثمن قطع الغيار المسحوبة:</span>
                    <span>{partCharge.toLocaleString()} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2.5 border-t border-dashed border-slate-800 text-sm font-black text-emerald-400">
                  <span>💳 إجمالي قيمة الفاتورة الصافية:</span>
                  <span>{totalAmount.toLocaleString()} ج.م</span>
                </div>
              </div>

              {/* Bottom barcode decoration */}
              <div className="pt-3 border-t border-slate-850 flex flex-col items-center justify-center gap-1">
                <span className="text-[10px] text-slate-500 font-bold text-center">** تم الفحص الفني المباشر وسلم للعميل باليد **</span>
                <div className="h-6 w-32 bg-slate-800 flex items-center justify-center rounded-sm overflow-hidden opacity-60">
                  <div className="flex gap-0.5 pointer-events-none">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <span
                        key={i}
                        className="bg-slate-200 shrink-0"
                        style={{
                          width: `${(i % 5 === 0 ? 3 : i % 3 === 0 ? 1 : 2)}px`,
                          height: '24px'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Note of Instant Regulatory Protection */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 self-center" />
              <div className="text-right">
                <span className="text-[11px] font-black text-amber-400 block pb-0.5">⚠️ بروتوكول سلامة الاستلام الفوري (Spot Clean):</span>
                <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                  يقر العميل باستلام جهازه وفحصه كاملاً بالمركز والتشغيل السليم أمامه وصحة عمل قطعة الغيار، ويسقط السند أي مطالبات بأعطال ظهرت بعد المغادرة.
                </p>
              </div>
            </div>

          </div>

          {/* Checkout Submit Trigger */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <button
              onClick={handleCheckoutExpress}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 border border-emerald-700 shadow-md shadow-emerald-900/10 cursor-pointer select-none"
            >
              <Zap className="w-4 h-4" />
              تأكيد وإصدار الفاتورة الفورية (نقرة واحدة)
            </button>
            <p className="text-[9.5px] text-slate-500 text-center font-bold">
              * بمجرد النقر، سيتم سحب قطعة غيار وتغذية الوردية، وتسجيل المبيعات باليومية، وتجهيز شاشة الطباعة للمستلم فورا.
            </p>
          </div>

        </div>

      </div>

      {/* Printing & Action Completion Success Modal (Custom Modal - No standard window.prompt or confirms!) */}
      {showPrintModal && lastSavedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 text-right space-y-6 shadow-xl">
            
            <div className="flex items-center gap-3 border-b pb-3 text-emerald-600">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-slate-900">تمت معالجة وإقفال الفاتورة الفورية بنجاح!</h3>
                <p className="text-[11px] text-slate-500 font-bold">رقم كود الصيانة المستند رقم #{lastSavedOrder.id}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-bold">
              تم بنجاح تسجيل الحركة بالخوادم الموزعة محلياً، وتحديث مخزن وقطع غيار الصيانة، مع ترحيل قيد الحركة المزدوجة بدفتر اليومية وإيداع المبلغ بالخزينة لـ الوردية الحالية.
            </p>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/50 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                <span>اسم العميل المستلم:</span>
                <span className="text-slate-800 font-bold">{lastSavedOrder.customerName}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                <span>إجمالي التكلفة المدفوعة:</span>
                <span className="text-emerald-700 font-black">{lastSavedOrder.actualCost?.toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                <span>فني الصيانة السريع:</span>
                <span className="text-slate-800 font-bold">{lastSavedOrder.technicianName}</span>
              </div>
            </div>

            {/* Action buttons inside custom modal */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={launchPrintWindow}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                طبع إيصال العميل الفوري
              </button>
              <button
                onClick={() => {
                  setShowPrintModal(false);
                  setLastSavedOrder(null);
                }}
                className="px-4 bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer text-center"
              >
                إغلاق وخدمة جديدة
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ComputerMobileExpress;
