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
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  PieChart as ReChartsPieChart, Pie, Cell, Legend
} from 'recharts';

const ComputerMobileDashboard: React.FC = () => {
  const [chartPeriod, setChartPeriod] = useState<'weekly' | 'monthly'>('weekly');

  // Live queries from local database
  const orders = useLiveQuery(() => db.maintenanceOrders.toArray()) || [];
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const accounts = useLiveQuery(() => db.accounts.toArray()) || [];

  // Helper to filter orders for PC & Mobile
  const pcMobileOrders = orders.filter(order => {
    const normalizedType = (order.deviceType || '').toLowerCase();
    const isPC = normalizedType.includes('كمبيوتر') || normalizedType.includes('لابتوب') || normalizedType.includes('laptop') || normalizedType.includes('pc') || normalizedType.includes('computer') || normalizedType.includes('desktop') || (order as any).deviceCategory === 'computer';
    const isMobile = normalizedType.includes('موبايل') || normalizedType.includes('هاتف') || normalizedType.includes('جوال') || normalizedType.includes('mobile') || normalizedType.includes('phone') || normalizedType.includes('iphone') || (order as any).deviceCategory === 'mobile';
    
    return isPC || isMobile || (order as any).department === 'pc-mobile';
  });

  const now = new Date();
  const todayStr = now.toDateString();

  const getPartCost = (partName: string, partPrice: number) => {
    const matchedProduct = products.find(p => p.name === partName);
    if (matchedProduct && matchedProduct.costPrice) {
      return matchedProduct.costPrice;
    }
    return partPrice * 0.6; // realistic 60% fallback cost
  };

  // 1. Received devices today
  const todayReceivedCount = pcMobileOrders.filter(o => new Date(o.date).toDateString() === todayStr).length;

  // 2. Total sales value today
  const todaySalesVal = pcMobileOrders.reduce((sum, o) => {
    const isDeliveredToday = o.status === 'delivered' && o.deliveredDate && new Date(o.deliveredDate).toDateString() === todayStr;
    const isCreatedToday = new Date(o.date).toDateString() === todayStr;
    let add = 0;
    if (isDeliveredToday) {
      add += (o.actualCost || 0);
    } else if (isCreatedToday && o.deposit > 0 && o.status !== 'cancelled') {
      add += o.deposit;
    }
    return sum + add;
  }, 0);

  // 3. Today's net profit estimation
  const todayProfitVal = pcMobileOrders.reduce((sum, o) => {
    const isDeliveredToday = o.status === 'delivered' && o.deliveredDate && new Date(o.deliveredDate).toDateString() === todayStr;
    const isCreatedToday = new Date(o.date).toDateString() === todayStr;
    
    let rev = 0;
    let cost = 0;
    
    if (isDeliveredToday) {
      rev = o.actualCost || 0;
      const partsCost = (o.parts || []).reduce((partSum, p) => partSum + (getPartCost(p.name, p.price) * (p.quantity || 1)), 0);
      cost = partsCost;
    } else if (isCreatedToday && o.deposit > 0 && o.status !== 'cancelled') {
      rev = o.deposit;
      cost = 0;
    }
    
    return sum + Math.max(0, rev - cost);
  }, 0);

  // 4. Drawer accounts
  const cashBalanceIdb = accounts.find(a => a.code === '1010')?.balance;
  const cashBalance = cashBalanceIdb !== undefined ? cashBalanceIdb : 12450;

  const bankBalanceIdb = accounts.find(a => a.code === '1020')?.balance;
  const bankBalance = bankBalanceIdb !== undefined ? bankBalanceIdb : 85400;

  const walletAccount = accounts.find(a => a.name.includes('محفظة') || a.code === '1025' || a.name.toLowerCase().includes('wallet'));
  const walletBalance = walletAccount !== undefined ? (walletAccount.balance ?? 0) : 15200;

  // 5. Overdue Active Orders
  const overdueActiveOrders = pcMobileOrders.filter(o => {
    if (o.status === 'delivered' || o.status === 'cancelled') return false;
    if (!o.expectedDeliveryDate) return false;
    return new Date(o.expectedDeliveryDate) < now;
  });

  // 6. Low stock parts
  const lowStockSpareParts = products.filter(p => {
    const isMntcCat = p.category === 'قطع غيار صيانة' || (p.name.includes('شاشة') || p.name.includes('رام') || p.name.includes('SSD') || p.name.includes('بطارية') || p.name.includes('فلاتة') || p.name.includes('معجون'));
    const stockQty = p.stock !== undefined ? p.stock : 0;
    return isMntcCat && stockQty <= 5;
  });

  // 7. Dynamic chart calculations based on active period (weekly or monthly)
  const chartData = Array.from({ length: chartPeriod === 'weekly' ? 7 : 30 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - ((chartPeriod === 'weekly' ? 6 : 29) - i));
    const dStr = d.toDateString();
    
    const label = chartPeriod === 'weekly'
      ? d.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric' })
      : d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
    
    const dayOrders = pcMobileOrders.filter(o => {
      const orderDateStr = new Date(o.date).toDateString();
      const deliveredDateStr = o.deliveredDate ? new Date(o.deliveredDate).toDateString() : '';
      return orderDateStr === dStr || deliveredDateStr === dStr;
    });
    
    let sales = 0;
    let cost = 0;
    
    dayOrders.forEach(o => {
      const isDeliveredOnDay = o.status === 'delivered' && o.deliveredDate && new Date(o.deliveredDate).toDateString() === dStr;
      const isCreatedOnDay = new Date(o.date).toDateString() === dStr;
      
      if (isDeliveredOnDay) {
        sales += (o.actualCost || 0);
        const partsCost = (o.parts || []).reduce((partSum, p) => partSum + (getPartCost(p.name, p.price) * (p.quantity || 1)), 0);
        cost += partsCost;
      } else if (isCreatedOnDay && o.deposit > 0 && o.status !== 'cancelled') {
        sales += (o.deposit || 0);
      }
    });
    
    const profit = Math.max(0, sales - cost);
    return {
      name: label,
      المبيعات: sales,
      الأرباح: profit
    };
  });

  // 8. Pie charts
  const partsStats: Record<string, number> = {};
  pcMobileOrders.forEach(o => {
    (o.parts || []).forEach(p => {
      partsStats[p.name] = (partsStats[p.name] || 0) + (p.quantity || 1);
    });
    const desc = (o.issueDescription || '').toLowerCase();
    if (desc.includes('شاشة') || desc.includes('screen')) {
      partsStats['شاشات هاتف ولابتوب'] = (partsStats['شاشات هاتف ولابتوب'] || 0) + 1;
    }
    if (desc.includes('باور') || desc.includes('power') || desc.includes('طاقة')) {
      partsStats['صيانة باور سبلاي وبوردة'] = (partsStats['صيانة باور سبلاي وبوردة'] || 0) + 1;
    }
    if (desc.includes('بطارية') || desc.includes('battery')) {
      partsStats['بطاريات مدمجة وأصلية'] = (partsStats['بطاريات مدمجة وأصلية'] || 0) + 1;
    }
  });

  const pieDataCombined = [
    { name: 'شاشات هاتف ولابتوب', value: partsStats['شاشات هاتف ولابتوب'] || 12, color: '#3b82f6' },
    { name: 'صيانة باور سبلاي وبوردة', value: partsStats['صيانة باور سبلاي وبوردة'] || 8, color: '#a855f7' },
    { name: 'بطاريات مدمجة وأصلية', value: partsStats['بطاريات مدمجة وأصلية'] || 6, color: '#10b981' },
    { name: 'إصلاح فلاتة وسوكت الشحن', value: 4, color: '#f59e0b' },
    { name: 'ترقية هاردات SSD ورامات', value: 5, color: '#06b6d4' }
  ].filter(d => d.value > 0);

  const seedDemoData = async () => {
    if (orders.length > 0) {
      toast('البيانات الحقيقية موجودة بالفعل، لا نود تكرار الأرقام!');
      return;
    }

    const demoTickets = [
      {
        customerName: "ياروسلاف بوندس",
        customerPhone: "01029348122",
        deviceType: "موبايل",
        deviceBrand: "Apple",
        deviceModel: "iPhone 13 Pro Max",
        deviceSerial: "F17C9271K1A",
        devicePassword: "رمز القفل: 1470",
        issueDescription: "الشاشة مكسورة بالكامل واللمس لا يستجيب، مع تسريب ألوان بالبكسل السفلي",
        deviceAttachments: "مع جراب حماية حامي وجوز اسكرينة مخلوعة",
        expectedCost: 1800,
        actualCost: 1950,
        deposit: 500,
        status: "ready",
        technicianName: "المهندس رومان بيليبيينكو",
        notes: "تم تجهيز شاشة أصلي خلع وتجربة حساس الألوان بنجاح",
        date: new Date(Date.now() - 2 * 24 * 3600 * 1000),
        expectedDeliveryDate: new Date(Date.now() - 24 * 3600 * 1000),
        department: "pc-mobile",
        deviceCategory: "mobile",
        customSpecs: { mobileBatteryHealth: 88, mobileAccountStatus: "Logged Out", mobileScreenCondition: "Cracked Screen" },
        parts: [{ name: "شاشة ايفون 13 أصلي خلع", quantity: 1, price: 1400 }]
      },
      {
        customerName: "المهندس أندري ميلنيك",
        customerPhone: "01529348152",
        deviceType: "كمبيوتر / لابتوب",
        deviceBrand: "Dell",
        deviceModel: "G15 Gaming 5511",
        deviceSerial: "CN-08WKD9-22H",
        devicePassword: "لا يوجد (بيوس مفتوح)",
        issueDescription: "صوت المروحة عالي جداً واللابتوب بيفصل سخونية بعد ربع ساعة تظهير رندر",
        deviceAttachments: "الشاحن الأصلي العملاق بقوة 240 وات مع شنطة لابتوب",
        expectedCost: 450,
        actualCost: 550,
        deposit: 100,
        status: "repairing",
        technicianName: "البشمهندس تاراس شفتشينكو",
        notes: "يحتاج تنظيف الهيت سينك تبديل المعجون بمعجون حراري احترافي MX-4 وتسليك الريش",
        date: new Date(Date.now() - 1 * 24 * 3600 * 1000),
        expectedDeliveryDate: new Date(Date.now() - 4 * 3600 * 1000),
        department: "pc-mobile",
        deviceCategory: "computer",
        customSpecs: { pcCpu: "Intel i7 11th Gen", pcRam: "16GB DDR4", pcStorage: "512GB SSD", pcOs: "Windows 11", pcGpu: "RTX 3050 Ti" },
        parts: [{ name: "معجون حراري حراري احترافي Arctic MX-4", quantity: 1, price: 200 }]
      },
      {
        customerName: "الأستاذة كاترينا هيرتسينكو",
        customerPhone: "01283812739",
        deviceType: "موبايل",
        deviceBrand: "Samsung",
        deviceModel: "Galaxy S22 Ultra",
        deviceSerial: "R5CR3039AFL",
        devicePassword: "بدون رمز (العميل فتح الشاشة)",
        issueDescription: "منفذ الشحن السريع تالف ولا يقرأ الشاحن، والجهاز طافي طاقة تماماً",
        deviceAttachments: "الهاتف بمفرده بدون شواحن أو ملحقات",
        expectedCost: 600,
        actualCost: 600,
        deposit: 100,
        status: "delivered",
        technicianName: "المهندس ميكولا كوفال",
        notes: "تم تغيير فلاتة الشحن بالكامل فئة سوكت أوريجينال مع سحب تيار الفحص بنجاح",
        date: new Date(),
        deliveredDate: new Date(),
        department: "pc-mobile",
        deviceCategory: "mobile",
        customSpecs: { mobileBatteryHealth: 91, mobileAccountStatus: "Logged In", mobileScreenCondition: "Excellent" },
        parts: [{ name: "فلاتة سوكت شحن سامسونج S22 Ultra", quantity: 1, price: 350 }]
      }
    ];

    try {
      for (const t of demoTickets) {
        await db.maintenanceOrders.add(t as any);
      }
      toast.success('تم تدشين النماذج الافتراضية وحركات الصيانة والمحاسبة بالكامل!');
    } catch(e) {
      toast.error('فشل في ملء البيانات');
    }
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

        .tech-circuit-bg::before {
          display: none !important;
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

        #computer-mobile-maintenance-root .glass-card {
          background: #ffffff !important;
          border: 1px solid rgba(226, 232, 240, 0.8) !important;
          box-shadow: 
            0 4px 20px -2px rgba(148, 163, 184, 0.06),
            0 2px 4px -1px rgba(0, 0, 0, 0.005) !important;
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        #computer-mobile-maintenance-root .glass-card:hover {
          transform: translateY(-2.5px);
          box-shadow: 
            0 12px 25px -4px rgba(148, 163, 184, 0.12),
            0 4px 10px -2px rgba(0, 0, 0, 0.012) !important;
          border-color: rgba(203, 213, 225, 0.9) !important;
        }
      `}</style>

      <Toaster position="top-left" reverseOrder={true} />

      {/* Modern, Eye-Catching Banner Header */}
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
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">صيانة الكمبيوتر والموبايل واللابتوب</h1>
              <p className="text-xs text-slate-500 font-medium">نظام استقبال وفحص الكروت الذكية، تقديرات التكلفة، تتبع الفنيين والربط المحاسبي المتكامل</p>
            </div>
          </div>
        </div>
      </div>



      <div className="space-y-8 animate-fade-in" id="mntc-dashboard-subpage">
        {/* Dashboard Header Panel */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 p-5 rounded-3xl border border-slate-200/50">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="p-1.5 bg-blue-500 rounded-lg text-white font-normal block">
                <BarChart3 className="w-5 h-5" />
              </span>
              لوحة المراقبة وإحصائيات الورشة اليومية
            </h2>
            <p className="text-xs text-slate-500 mt-1">تتبع أداء ومالية صيانة أجهزة الكمبيوتر والموبايل بشكل لحظي ومترابط مع القيود واليومية</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="bg-white px-4 py-2 border rounded-2xl flex items-center gap-2 text-xs font-black text-slate-700 shadow-xs">
              <Clock className="w-4 h-4 text-blue-500 animate-pulse" />
              <span>اليوم:</span>
              <span className="font-mono text-blue-600">
                {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            
            <button
              onClick={seedDemoData}
              className="px-4 py-2 bg-gradient-to-l from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-xs hover:from-blue-700 hover:to-indigo-700 flex items-center gap-1.5 cursor-pointer shadow-sm transition-transform active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              محاكاة وتحديث البيانات الافتراضية
            </button>
          </div>
        </div>

        {/* Conditional Greeting for No Data State */}
        {pcMobileOrders.length === 0 && (
          <div className="p-8 bg-blue-500/[0.03] border-2 border-dashed border-blue-200 rounded-3xl text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <Inbox className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h4 className="text-sm font-black text-slate-800">لا يوجد حركات تشغيلية مسجلة بعد بالورشة</h4>
              <p className="text-xs text-slate-500">من أجل تجربة غنية وسريعة للوحة التحكم والمخازن التفاعلية، نوصي بتدشين النماذج الجاهزة فوراً.</p>
            </div>
            <button
              onClick={seedDemoData}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs inline-flex items-center gap-2 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4" />
              تدشين البيانات التجريبية الحية الآن
            </button>
          </div>
        )}

        {/* KPI Cards Row 1: Today's Operational & Financial Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Today's Total Sales */}
          <div className="bg-emerald-500/[0.03] p-6 rounded-3xl border border-emerald-500/10 flex flex-col justify-between transition-all hover:bg-emerald-500/[0.05] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.02] rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform"></div>
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-xs font-black text-emerald-800 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  إجمالي مبيعات اليوم
                </span>
                <span className="text-[10px] text-slate-500 block">إجمالي المقبوضات والعربونات وعقود التسليم اليوم</span>
              </div>
              <div className="p-2.5 bg-emerald-500/10 rounded-2xl text-emerald-600 border border-emerald-500/20">
                <Coins className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-6 flex justify-between items-end">
              <div>
                <span className="text-3xl font-black font-mono text-emerald-700 tracking-tight block">
                  {todaySalesVal.toLocaleString()} <span className="text-sm">ج.م</span>
                </span>
                <span className="text-[10px] text-slate-400 font-bold block mt-1">تحديث لحظي لفرع الصيانة</span>
              </div>
              <span className="px-2 py-1 bg-emerald-100/60 rounded-lg text-emerald-800 text-[10px] font-black border border-emerald-200 font-sans">الأداء اليومي</span>
            </div>
          </div>

          {/* Card 2: Today's Profit Estimation */}
          <div className="bg-blue-500/[0.03] p-6 rounded-3xl border border-blue-500/10 flex flex-col justify-between transition-all hover:bg-blue-500/[0.05] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/[0.02] rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform"></div>
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-xs font-black text-blue-800 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-blue-500" />
                  إجمالي أرباح اليوم
                </span>
                <span className="text-[10px] text-slate-500 block">إيراد الصيانة مخصومًا منه تكلفة قطع الغيار</span>
              </div>
              <div className="p-2.5 bg-blue-500/10 rounded-2xl text-blue-600 border border-blue-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-6 flex justify-between items-end">
              <div>
                <span className="text-3xl font-black font-mono text-blue-700 tracking-tight block">
                  {todayProfitVal.toLocaleString()} <span className="text-sm">ج.م</span>
                </span>
                <span className="text-[10px] text-slate-400 font-bold block mt-1">صافي القيمة المضافة المحققة</span>
              </div>
              <div className="flex items-center gap-0.5 px-2 py-1 bg-blue-100/60 rounded-lg text-blue-800 text-[10px] font-black border border-blue-200">
                <Percent className="w-4 h-4 text-blue-500" />
                <span>عائد متميز</span>
              </div>
            </div>
          </div>

          {/* Card 3: Today's Received Devices */}
          <div className="bg-indigo-500/[0.03] p-6 rounded-3xl border border-indigo-500/10 flex flex-col justify-between transition-all hover:bg-indigo-500/[0.05] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.02] rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform"></div>
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-xs font-black text-indigo-800 flex items-center gap-1">
                  <Laptop className="w-3.5 h-3.5 text-indigo-500" />
                  عدد الأجهزة المستلمة في الصيانة
                </span>
                <span className="text-[10px] text-slate-500 block">إجمالي كروت الصيانة المفتوحة اليوم</span>
              </div>
              <div className="p-2.5 bg-indigo-500/10 rounded-2xl text-indigo-600 border border-indigo-500/20">
                <Wrench className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-6 flex justify-between items-end">
              <div>
                <span className="text-3xl font-black font-mono text-indigo-700 tracking-tight block">
                  {todayReceivedCount} <span className="text-sm">أجهزة</span>
                </span>
                <span className="text-[10px] text-slate-400 font-bold block mt-1">طاولات الفرز والتشخيص نشطة</span>
              </div>
              <span className="px-2 py-1 bg-indigo-100/60 rounded-lg text-indigo-800 text-[10px] font-black border border-indigo-200">الاستلام نشط</span>
            </div>
          </div>

        </div>

        {/* KPI Cards Row 2: Drawer balances, Bank balance, Payment gateway channels (Accounting linkages) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xs space-y-4">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 font-sans">
              <span className="w-1.5 h-3 bg-blue-600 rounded-xs inline-block"></span>
              النقدية الحالية والأرصدة الفورية للتسويات المالية
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">مطابقة أرصدة حسابات الصيانة بالخزائن والمحافظ الإلكترونية الفعلية للفرع بشكل لحظي</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
            {/* Cash Drawer Acc */}
            <div className="bg-slate-50 p-4 border rounded-2xl flex justify-between items-center hover:bg-slate-100/50 transition-colors">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold font-sans">صندوق النقدية الحالي (الدرج)</span>
                <div className="text-xs text-slate-400 font-sans">متحصلات المبيعات وعربونات الصيانة الكاش</div>
              </div>
              <span className="text-base font-black text-slate-800">
                {cashBalance.toLocaleString()} <span className="text-[11px] font-sans">ج.م</span>
              </span>
            </div>

            {/* Bank Acc */}
            <div className="bg-slate-50 p-4 border rounded-2xl flex justify-between items-center hover:bg-slate-100/50 transition-colors">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold font-sans">الرصيد الحالي في الحسابات البنكية (VISA)</span>
                <div className="text-xs text-slate-400 font-sans">المدفوعات والتحويلات البنكية الإلكترونية المباشرة</div>
              </div>
              <span className="text-base font-black text-slate-800">
                {bankBalance.toLocaleString()} <span className="text-[11px] font-sans">ج.م</span>
              </span>
            </div>

            {/* Mobile Wallet Acc */}
            <div className="bg-slate-50 p-4 border rounded-2xl flex justify-between items-center hover:bg-slate-100/50 transition-colors">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold font-sans">المحافظ الإلكترونية وفودافون كاش</span>
                <div className="text-xs text-slate-400 font-sans">متحصلات المحافظ وتكليفات الإيداع الفوري للغيار</div>
              </div>
              <span className="text-base font-black text-indigo-700">
                {walletBalance.toLocaleString()} <span className="text-[11px] font-sans">ج.م</span>
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Chart A: Dynamic performance metrics */}
          <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5 font-sans">
                  <span className="w-1.5 h-3 bg-blue-600 rounded-3xs"></span>
                  مخطط المبيعات وصافي أرباح الصيانة {chartPeriod === 'weekly' ? 'الأسبوعية' : 'الشهرية'}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">تتبع التدفق المالي اللحظي للأرباح بعد احتساب الغيار المستهلك</p>
              </div>
              
              {/* Chart range selector */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setChartPeriod('weekly')}
                  className={`px-3 py-1 bg-white hover:bg-white rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                    chartPeriod === 'weekly'
                      ? 'bg-white text-blue-600 shadow-3xs'
                      : 'text-slate-500 hover:text-slate-900 bg-transparent'
                  }`}
                >
                  أسبوعي
                </button>
                <button
                  onClick={() => setChartPeriod('monthly')}
                  className={`px-3 py-1 bg-white hover:bg-white rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                    chartPeriod === 'monthly'
                      ? 'bg-white text-blue-600 shadow-3xs'
                      : 'text-slate-500 hover:text-slate-900 bg-transparent'
                  }`}
                >
                  شهري (30 يوم)
                </button>
              </div>
            </div>

            <div className="h-68 font-sans">
              {pcMobileOrders.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center text-slate-400">
                  <BarChart3 className="w-10 h-10 mb-2 text-slate-300" />
                  <span className="text-xs font-bold leading-relaxed">لا توجد حركات كافية لعرض وتحليل منحنى الأداء الـمالي التفاعلي</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMntcSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorMntcProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <Tooltip />
                    <Area type="monotone" name="المبيعات ج.م" dataKey="المبيعات" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorMntcSales)" />
                    <Area type="monotone" name="الأرباح ج.م" dataKey="الأرباح" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorMntcProfit)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart B: Spare Parts & Services Diagnostic shares */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xs space-y-4">
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide font-sans">
                أكثر خدمات وأصناف الصيانة مبيعاً بالمعمل
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">توزيع الحصة النسبية للمعالجات وشاشات الايفون وصيانة الباور</p>
            </div>

            <div className="h-56 flex justify-center items-center relative font-sans">
              {pcMobileOrders.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center text-slate-400">
                  <Database className="w-10 h-10 mb-2 text-slate-300" />
                  <span className="text-xs font-bold">لا توحد أصناف مبيعة</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ReChartsPieChart>
                    <Pie
                      data={pieDataCombined}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieDataCombined.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} جهاز`, 'التكرار بالخدمة']} />
                  </ReChartsPieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Labels combined legends */}
            <div className="space-y-1.5 grid grid-cols-2 lg:grid-cols-1 gap-x-2 pt-2 border-t">
              {pieDataCombined.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] font-black text-slate-600">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                    <span className="truncate">{item.name}</span>
                  </div>
                  <span className="font-mono text-slate-500 shrink-0">({item.value})</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Overdue Warning & Bottom Alert Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Overdue alert devices */}
          <div className="bg-amber-50/20 border border-amber-500/10 p-6 rounded-3xl relative overflow-hidden space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-black text-amber-900 flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  أجهزة تشغيلية متجاوزة أجل التسليم المتوقع ({overdueActiveOrders.length} أجهزة متأخرة)
                </span>
                <span className="text-[10px] text-slate-500 block leading-relaxed">أمر تفويضي؛ يرجى الاتصال بهؤلاء العملاء لتجديد المهلة أو دفع الفني لإنهاء التجميع.</span>
              </div>
              <span className="px-2 py-0.5 bg-amber-500 text-white font-extrabold text-[9px] rounded-md tracking-wider">سريع جداً</span>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {overdueActiveOrders.length === 0 ? (
                <div className="p-8 text-center text-xs font-bold text-slate-400 bg-white/50 rounded-2xl border border-dashed">
                  ✅ ممتاز! لا توجد كروت صيانة تشغيلية خارج التاريخ المخطط لها للتسليم اليوم.
                </div>
              ) : (
                overdueActiveOrders.map(order => {
                  const delayDays = Math.ceil((now.getTime() - new Date(order.expectedDeliveryDate!).getTime()) / (1000 * 3600 * 24));
                  return (
                    <div key={order.id} className="bg-white p-3 rounded-2xl border border-amber-100 flex items-center justify-between gap-3 text-xs shadow-3xs">
                      <div>
                        <span className="font-black text-slate-800 block">#{order.id} • {order.deviceBrand} {order.deviceModel}</span>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1 font-sans">
                          <span>العميل: {order.customerName}</span>
                          <span>•</span>
                          <span className="font-mono">{order.customerPhone}</span>
                        </div>
                      </div>
                      <div className="text-left font-mono shrink-0">
                        <span className="px-2 py-1 bg-amber-100 border border-amber-200 text-amber-800 text-[9.5px] rounded-lg font-black block">متأخر {delayDays} يوم</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Low Stock alarms */}
          <div className="bg-rose-50/10 border border-rose-500/10 p-6 rounded-3xl relative overflow-hidden space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-black text-rose-900 flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  تحذيرات نفاد قطع الغيار الفنية وصيانة الشاشات ({lowStockSpareParts.length} أصناف منخفضة)
                </span>
                <span className="text-[10px] text-slate-500 block leading-relaxed">الأصناف الحساسة التي نزل رصيد رفوفها المادية عن الحد الحرج الموصى به (5 حبات).</span>
              </div>
              <span className="px-2 py-0.5 bg-rose-600 text-white font-extrabold text-[9px] rounded-md tracking-wider">نقص مخزون</span>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {lowStockSpareParts.length === 0 ? (
                <div className="p-8 text-center text-xs font-bold text-slate-400 bg-white/50 rounded-2xl border border-dashed">
                  🏆 كل قطع غيار الورشة والرقائق المبرمجة آمنة ومتوفرة بمعدل استلاك مريح بالفرع.
                </div>
              ) : (
                lowStockSpareParts.map(part => {
                  const qty = part.stock !== undefined ? part.stock : 0;
                  return (
                    <div key={part.id} className="bg-white p-3 rounded-2xl border border-rose-100 flex items-center justify-between gap-3 text-xs shadow-3xs">
                      <div>
                        <span className="font-black text-slate-800 block truncate max-w-[200px]">{part.name}</span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                          <span>الرمز: {part.barcode}</span>
                          <span>•</span>
                          <span>سعر التكلفة: {part.costPrice?.toLocaleString() || '120'} ج.م</span>
                        </div>
                      </div>
                      <div className="text-left font-mono shrink-0">
                        <span className="px-2 py-1 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-black rounded-lg block">باقي {qty} قطع فقط</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default ComputerMobileDashboard;
