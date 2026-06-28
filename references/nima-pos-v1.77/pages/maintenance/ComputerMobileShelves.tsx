import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { MaintenanceOrder } from '../../types';
import { 
  MapPin, ClipboardList, Database, Laptop, Smartphone, Search, AlertCircle, 
  CheckCircle, Plus, Trash2, Printer, ArrowLeftRight, HelpCircle, Layers, Info, 
  X, Barcode, QrCode, ClipboardCheck, ArrowUpRight, Check, Sparkles, Map, RefreshCw
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

// Define Interface for Shelf Location
interface WorkshopShelf {
  id: string;
  code: string; 
  name: string;
  zone: 'received' | 'testing' | 'repair' | 'ready' | 'delivered';
  capacity: number;
  notes?: string;
}

const ComputerMobileShelves: React.FC = () => {
  // Live queries from local database
  const orders = useLiveQuery(() => db.maintenanceOrders.toArray()) || [];

  // Default shelves seed
  const defaultShelves: WorkshopShelf[] = [
    { id: '1', code: 'SHELF-A1', name: 'رف الاستلام A1 - هواتف', zone: 'received', capacity: 15, notes: 'للأجهزة التي تم استلامها حديثاً وبانتظار معاينة الفني' },
    { id: '2', code: 'SHELF-A2', name: 'رف الاستلام A2 - لابتوب', zone: 'received', capacity: 8, notes: 'أجهزة الكمبيوتر واللابتوب المستلمة للتثبيت الأولي' },
    { id: '3', code: 'SHELF-B1', name: 'رف الفحص والتشخيص B1', zone: 'testing', capacity: 10, notes: 'تحت التشغيل الذكي والفحص التقني' },
    { id: '4', code: 'SHELF-B2', name: 'رف قطع الغيار المعلقة B2', zone: 'repair', capacity: 12, notes: 'قيد انتظار وصول الرقاقات أو قطع الشاشات البديلة' },
    { id: '5', code: 'SHELF-C1', name: 'لجين التجميع والإصلاح C1', zone: 'repair', capacity: 15, notes: 'الأجهزة قيد العمل الفعلي واللحام' },
    { id: '6', code: 'SHELF-C2', name: 'رف الأجهزة الجاهزة للتسليم C2', zone: 'ready', capacity: 20, notes: 'صيانة مكتملة واختبار أمان ناجح 100%' },
    { id: '7', code: 'SHELF-D1', name: 'رف الاسترجاع والأرشيف D1', zone: 'delivered', capacity: 30, notes: 'للأجهزة المسلمة أو المرتجعة للعميل نهائياً' }
  ];

  // Active shelves in state (loaded from localStorage or seeded)
  const [shelves, setShelves] = useState<WorkshopShelf[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('workshop_shelves');
    if (stored) {
      try {
        setShelves(JSON.parse(stored));
      } catch (e) {
        setShelves(defaultShelves);
      }
    } else {
      setShelves(defaultShelves);
      localStorage.setItem('workshop_shelves', JSON.stringify(defaultShelves));
    }
  }, []);

  // Save shelves helper
  const saveShelvesConfig = (updated: WorkshopShelf[]) => {
    setShelves(updated);
    localStorage.setItem('workshop_shelves', JSON.stringify(updated));
  };

  // State
  const [selectedShelf, setSelectedShelf] = useState<string>('SHELF-A1');
  const [isNewShelfModalOpen, setIsNewShelfModalOpen] = useState(false);
  const [subTab, setSubTab] = useState<'map' | 'quick-update' | 'labels'>('map');

  // New Shelf Form State
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newZone, setNewZone] = useState<'received' | 'testing' | 'repair' | 'ready' | 'delivered'>('received');
  const [newCapacity, setNewCapacity] = useState<number>(10);
  const [newNotes, setNewNotes] = useState('');

  // Scanning simulation states
  const [deviceBarcodeIn, setDeviceBarcodeIn] = useState('');
  const [shelfBarcodeIn, setShelfBarcodeIn] = useState('');
  const [scanLogs, setScanLogs] = useState<{ id: string; text: string; time: string; success: boolean }[]>([]);

  // Search filter for fast assignment
  const [deviceSearchText, setDeviceSearchText] = useState('');
  const [selectedDeviceForQuickLink, setSelectedDeviceForQuickLink] = useState<number | null>(null);
  const [targetShelfForQuickLink, setTargetShelfForQuickLink] = useState('');

  // Zone Label Mapping For Arabic
  const zoneMapping = {
    received: { name: 'الأجهزة المستلمة حديثاً', color: 'bg-blue-50 text-blue-750 border-blue-150' },
    testing: { name: 'الفحص والتشخيص الفني', color: 'bg-amber-50 text-amber-700 border-amber-150' },
    repair: { name: 'عنابر ورشة الصيانة والتركيب', color: 'bg-indigo-50 text-indigo-705 border-indigo-150' },
    ready: { name: 'أجهزة جاهزة للتسليم للعميل', color: 'bg-emerald-50 text-emerald-705 border-emerald-150' },
    delivered: { name: 'الأرشيف والتسليمات النهائية', color: 'bg-slate-50 text-slate-700 border-slate-150' }
  };

  // Add Shelf
  const handleAddShelf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) {
      toast.error('أدخل الرمز المعرف والاسم الكامل للرف');
      return;
    }

    const codeFormatted = newCode.toUpperCase().replace(/\s+/g, '-');
    if (shelves.some(s => s.code === codeFormatted)) {
      toast.error('رمز الرف هذا مسجل بالفعل بالمنشأة صيانة!');
      return;
    }

    const item: WorkshopShelf = {
      id: Date.now().toString(),
      code: codeFormatted,
      name: newName,
      zone: newZone,
      capacity: newCapacity || 10,
      notes: newNotes
    };

    const next = [...shelves, item];
    saveShelvesConfig(next);
    toast.success(`تم تكويد ورسم الرف الجديد [${codeFormatted}] بنجاح كجرد لوجستي.`);
    setIsNewShelfModalOpen(false);

    // Reset Form
    setNewCode('');
    setNewName('');
    setNewZone('received');
    setNewCapacity(10);
    setNewNotes('');
  };

  // Delete Shelf
  const handleDeleteShelf = (id: string, code: string) => {
    // Check if any active orders are on this shelf
    const occupied = orders.some(o => o.shelfCode === code && o.status !== 'delivered');
    if (occupied) {
      toast.error(`لا يصح كنس أو إزالة الرف ${code} لوجود أجهزة صيانة نشطة معلقة عليه حالياً!`);
      return;
    }

    const next = shelves.filter(s => s.id !== id);
    saveShelvesConfig(next);
    toast.success('تم إقصاء الرف من التكويد العام للمحل.');
  };

  // Simulated Scanner Beep Sound (HTML5 Web Audio Synthesizer)
  const playBeep = (freq = 800, duration = 0.12) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.value = freq;
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Ignored if browser block
    }
  };

  // Simulated Barcode Match
  const handleSimulateScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceBarcodeIn.trim()) {
      toast.error('من فضلك ادخل أو امسح باركود الجهاز أولاً');
      return;
    }
    if (!shelfBarcodeIn.trim()) {
      toast.error('من فضلك ادخل أو امسح كود الرف المقابل');
      return;
    }

    const dCode = deviceBarcodeIn.toUpperCase().trim();
    const sCode = shelfBarcodeIn.toUpperCase().trim();

    // Try to find the order. Barcode might be DEV-ID (e.g. DEV-1) or just the numeric ID (e.g. 1)
    const orderIdMatch = dCode.replace('DEV-', '');
    const numId = parseInt(orderIdMatch, 10);

    const orderExist = orders.find(o => o.id === numId || (o.deviceSerial && o.deviceSerial.toUpperCase() === dCode));
    const shelfExist = shelves.find(s => s.code === sCode);

    if (!orderExist) {
      playBeep(300, 0.3); // Err tone
      const log = {
        id: Date.now().toString(),
        text: `فشل المسح: لم نجد جهاز معلق بالرقم [${dCode}]`,
        time: new Date().toLocaleTimeString('ar-EG'),
        success: false
      };
      setScanLogs(prev => [log, ...prev].slice(0, 10));
      toast.error(`كود الجهاز غير متطابق مع أي بطاقة صيانة بالمחל: ${dCode}`);
      return;
    }

    if (!shelfExist) {
      playBeep(350, 0.35); // Err tone
      const log = {
        id: Date.now().toString(),
        text: `فشل الرف: الرمز الرفي [${sCode}] غير مسجل بقاعدة التكويد`,
        time: new Date().toLocaleTimeString('ar-EG'),
        success: false
      };
      setScanLogs(prev => [log, ...prev].slice(0, 10));
      toast.error(`أهمل الرف! الرمز اللوجستي غير صحيح: ${sCode}`);
      return;
    }

    // Check shelf capacity
    const currentOnThisShelf = orders.filter(o => o.shelfCode === sCode && o.status !== 'delivered').length;
    if (currentOnThisShelf >= shelfExist.capacity) {
      playBeep(250, 0.4);
      toast.error(`تحذير: الرف [${sCode}] ممتلئ تماماً بالحد الأقصى للمقاعد (${shelfExist.capacity})!`);
    }

    try {
      // Relocate device inside Maintenance database!
      await db.maintenanceOrders.update(orderExist.id!, {
        shelfCode: sCode
      });

      playBeep(1200, 0.08); // Sweet Success Beep
      setTimeout(() => playBeep(1500, 0.08), 90);

      const log = {
        id: Date.now().toString(),
        text: `نجاح: نقل ${orderExist.deviceModel} للعميل (${orderExist.customerName}) إلى الرف [${sCode}]`,
        time: new Date().toLocaleTimeString('ar-EG'),
        success: true
      };
      setScanLogs(prev => [log, ...prev].slice(0, 10));
      toast.success(`تم تخزين ونقل الجهاز بنجاح! الرف الحالي: ${shelfExist.name}`);
      
      // Reset Scanner inputs
      setDeviceBarcodeIn('');
      setShelfBarcodeIn('');
    } catch (e) {
      toast.error('حدث خطأ فني أثناء كتابة موقع الرف بالخادم المحلي');
    }
  };

  // Direct fast selector link
  const handleFastLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeviceForQuickLink) {
      toast.error('الرجاء تعيين جهاز الصيانة المستهدف أولاً للتعديل اللحظي');
      return;
    }
    if (!targetShelfForQuickLink) {
      toast.error('الرجاء اختيار اسم الرف لتسكين الجهاز به');
      return;
    }

    try {
      await db.maintenanceOrders.update(selectedDeviceForQuickLink, {
        shelfCode: targetShelfForQuickLink
      });

      playBeep(900, 0.15);
      toast.success('تم النقل والربط مع الرف المطلوب على التو!');
      setSelectedDeviceForQuickLink(null);
      setTargetShelfForQuickLink('');
    } catch (err) {
      toast.error('حدث خطأ');
    }
  };

  // Printing a visual receipt placeholder
  const handlePrintShelfLabel = (shelf: WorkshopShelf) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${shelf.code} - ملصق الرف الفني</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; padding: 20px; direction: rtl; }
            .badge-container { border: 3px dashed #334155; padding: 25px; border-radius: 12px; max-width: 320px; margin: 0 auto; background: #fff; }
            .header-txt { font-size: 14px; font-weight: bold; color: #475569; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
            .code-txt { font-size: 32px; font-weight: 900; color: #1e293b; margin: 10px 0; font-family: 'Courier New', monospace; letter-spacing: 2px; }
            .desc-txt { font-size: 15px; color: #020617; font-weight: bold; margin-bottom: 12px; }
            .barcode-placeholder { height: 45px; background: repeating-linear-gradient(90deg, #000, #000 3px, #fff 3px, #fff 10px); margin: 15px auto; width: 85%; border: 1px solid #000;}
            .footer-txt { font-size: 10px; color: #94a3b8; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="badge-container">
            <div class="header-txt">نظام الرفوف واللوجستيات لورش الصيانة ⚙️</div>
            <div class="code-txt">${shelf.code}</div>
            <div class="desc-txt">${shelf.name}</div>
            <div class="barcode-placeholder"></div>
            <div class="footer-txt">السعة المعتمدة: ${shelf.capacity} أجهزة • النطاق الممنوح: ${shelf.zone.toUpperCase()}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Printing device barcode sticker
  const handlePrintDeviceLabel = (order: MaintenanceOrder) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>STICKER-DEV-${order.id}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 15px; margin: 0; direction: rtl; }
            .sticker { border: 24px inline-block; padding: 10px; border: 2px solid #000; border-radius: 8px; max-width: 250px; margin: 0 auto; }
            .title { font-size: 16px; font-weight: bold; }
            .subtitle { font-size: 11px; margin-top: 4px; color: #333; }
            .barcode { height: 35px; background: repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 8px); margin: 8px 0; border: 1px solid #111; }
            .num { font-size: 14px; font-weight: bold; font-family: monospace; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="sticker">
            <div class="title">كارت صيانة #${order.id}</div>
            <div class="subtitle">${order.customerName}</div>
            <div class="subtitle">${order.deviceBrand} ${order.deviceModel}</div>
            <div class="barcode"></div>
            <div class="num">DEV-${order.id}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="p-6 select-none max-w-[1600px] mx-auto space-y-8 tech-circuit-bg min-h-screen text-slate-800 relative font-sans" dir="rtl" id="computer-mobile-shelves-root">
      <style>{`
        #computer-mobile-shelves-root {
          font-family: 'Tajawal', 'Cairo', sans-serif !important;
        }
        .tech-circuit-bg {
          background-color: #f8fafc !important;
          background-image: none !important;
        }
      `}</style>
      <Toaster position="top-left" reverseOrder={true} />

      {/* Header Banner */}
      <div className="bg-white p-6.5 rounded-2xl border border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10 shadow-xs transition-all duration-300">
        <div className="space-y-2 text-right w-full">
          <div className="flex flex-wrap items-center gap-2 mb-1 bg-slate-50/50 p-1 rounded-full w-max border border-slate-100/50">
            <span className="px-3.5 py-1 text-[10px] font-black tracking-tight text-indigo-755 bg-white border border-indigo-100 rounded-full inline-flex items-center gap-1.5 shadow-3xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              تتبع الأجهزة اللوجستي وحركية الرفوف والباركود
            </span>
            <span className="px-3 py-1 text-[10px] font-black text-slate-500 inline-flex items-center gap-1 select-none">
              أتمتة كاملة لمنع ضياع الأجهزة وتسريع عمليات التسليم 🚀📱
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">هيكلة مستودعات ومواقع الأجهزة بالخزانة</h1>
              <p className="text-xs text-slate-500 font-medium">نظام تكويد الرفوف الذكي وحركة الأجهزة في الوقت الفعلي مع السحب الفوري بالماسح الضوئي</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-150 gap-4">
        <button
          onClick={() => setSubTab('map')}
          className={`pb-4 px-2 font-black text-sm transition-all relative ${
            subTab === 'map' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-650'
          }`}
        >
          <div className="flex items-center gap-2">
            <Map className="w-4 h-4" />
            <span>خارطة الرفوف وتوزيع المخازن</span>
          </div>
        </button>

        <button
          onClick={() => setSubTab('quick-update')}
          className={`pb-4 px-2 font-black text-sm transition-all relative ${
            subTab === 'quick-update' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-650'
          }`}
        >
          <div className="flex items-center gap-2">
            <Barcode className="w-4 h-4" />
            <span>ماسح الباركود والتحديث السريع لموقع الجهاز</span>
          </div>
        </button>

        <button
          onClick={() => setSubTab('labels')}
          className={`pb-4 px-2 font-black text-sm transition-all relative ${
            subTab === 'labels' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-650'
          }`}
        >
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4" />
            <span>طباعة ترميز الرفوف والأكواد</span>
          </div>
        </button>
      </div>

      {/* 🔴 SUBTAB 1: MAP OF SHELVES */}
      {subTab === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT CONTAINER: LIST / MAP OF SHELVES */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-sm text-slate-800">ترميز أرفف الصيانة بالمنشأة</h3>
                <button
                  onClick={() => setIsNewShelfModalOpen(true)}
                  className="p-1 px-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10.5px] rounded-lg transition-all inline-flex items-center gap-1 border border-indigo-200 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  أرفف جديدة
                </button>
              </div>

              <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
                {shelves.map((shelf) => {
                  const itemsCount = orders.filter(o => o.shelfCode === shelf.code && o.status !== 'delivered').length;
                  const isFull = itemsCount >= shelf.capacity;
                  const isSelected = selectedShelf === shelf.code;

                  return (
                    <div
                      key={shelf.id}
                      onClick={() => setSelectedShelf(shelf.code)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer text-right flex flex-col justify-between ${
                        isSelected 
                          ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/10' 
                          : 'bg-slate-50 border-slate-150 hover:bg-slate-100/40'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[9.5px] font-black font-mono text-slate-400 tracking-wider block mb-0.5">{shelf.code}</span>
                          <span className="font-extrabold text-xs text-slate-800 font-sans block">{shelf.name}</span>
                        </div>
                        <div className="text-left">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            isFull ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {itemsCount}/{shelf.capacity} أجهزة
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-200/50">
                        <span className="text-[10px] text-slate-500 font-extrabold">Zone: {shelf.zone.toUpperCase()}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrintShelfLabel(shelf);
                            }}
                            className="p-1 bg-white hover:bg-slate-100 border text-slate-600 rounded-md cursor-pointer"
                            title="طباعة ملصق الباركود للرف"
                          >
                            <Printer className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteShelf(shelf.id, shelf.code);
                            }}
                            className="p-1 bg-white hover:bg-red-50 border border-red-200 text-red-500 rounded-md cursor-pointer"
                            title="حذف رف"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT CONTAINER: DEVICES CURRENTLY ON SELECTED SHELF */}
          <div className="lg:col-span-8 space-y-5">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden min-h-[500px]">
              
              {/* Animated status overlay matching the current shelf */}
              {(() => {
                const targetShelf = shelves.find(s => s.code === selectedShelf);
                if (!targetShelf) return null;

                const onShelfDevices = orders.filter(o => o.shelfCode === selectedShelf && o.status !== 'delivered');
                const percent = Math.min(100, Math.floor((onShelfDevices.length / targetShelf.capacity) * 100));

                return (
                  <div className="space-y-6">
                    <div className="flex justify-between items-start border-b pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-850 font-black font-mono rounded-lg text-xs">{targetShelf.code}</span>
                          <h2 className="text-base font-black text-slate-800">{targetShelf.name}</h2>
                        </div>
                        {targetShelf.notes && (
                          <p className="text-xs text-slate-450 font-semibold mt-1">{targetShelf.notes}</p>
                        )}
                      </div>

                      <div className="text-left font-sans">
                        <span className="text-sm font-black text-slate-800 block">{percent}% ممتلئ</span>
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1 inline-block">
                          <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Devices list */}
                    {onShelfDevices.length === 0 ? (
                      <div className="p-20 text-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border">
                          <Info className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-black text-slate-700">الرف المختار فارغ حالياً</h3>
                        <p className="text-slate-400 text-xs font-bold max-w-xs mx-auto">
                          لا تتوفر أجهزة صيانة تابعة لنظام الترميز مسكنة على هذا الرف في الوقت الراهن. يمكنك ربط الأجهزة بالرف من شاشة "التحديث السريع".
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {onShelfDevices.map((order) => {
                          const stateCol = order.status === 'ready' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100';
                          return (
                            <div key={order.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-150 relative transition-transform hover:-translate-y-0.5">
                              <div className="flex justify-between items-start gap-2">
                                <div className="space-y-1 text-right">
                                  <span className="text-[10px] font-black font-mono text-indigo-600 block">DEV-{order.id}</span>
                                  <h4 className="font-extrabold text-xs text-slate-800 font-sans block">{order.customerName}</h4>
                                  <p className="text-[11px] text-slate-500 font-medium">الجهاز: {order.deviceBrand} {order.deviceModel}</p>
                                </div>

                                <div className="text-left space-y-1.5">
                                  <span className={`px-2 py-0.5 text-[9px] font-black rounded-lg border block text-center ${stateCol}`}>
                                    {order.status === 'ready' ? 'جاهز للتسليم 🟢' : 'قيد الإصلاح 🟠'}
                                  </span>
                                  <button
                                    onClick={() => handlePrintDeviceLabel(order)}
                                    className="p-1 px-2.5 bg-white hover:bg-slate-100 text-slate-600 border rounded-lg text-[9.5px] inline-flex items-center gap-1 font-bold cursor-pointer"
                                  >
                                    <Printer className="w-3 h-3 text-slate-450" />
                                    باركود كارت الصيانة
                                  </button>
                                </div>
                              </div>

                              <div className="mt-3.5 pt-2.5 border-t border-slate-200/50 flex justify-between items-center text-[10px] text-slate-400 font-semibold font-mono">
                                <span>جوال: {order.customerPhone}</span>
                                <span>مستودع: {targetShelf.zone.toUpperCase()}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>
          </div>

        </div>
      )}

      {/* 🔴 SUBTAB 2: BARCODE SCANNER SIMULATOR & QUICK UPDATE */}
      {subTab === 'quick-update' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* SIMULATION CARD */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Barcode className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-800 font-sans">معاينة مسدس الباركود (Laser Scanner Simulation)</h3>
                  <p className="text-[10.5px] text-slate-450 font-bold">يقوم الفني أو موظف الـ Receipt بعمل سكان لباركود كارت الصيانة ثم سكان للرف لتسكينه فورياً</p>
                </div>
              </div>

              <form onSubmit={handleSimulateScan} className="space-y-4 font-sans">
                <div>
                  <label className="block text-xs font-black text-slate-600 mb-1.5 text-right flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-indigo-500" />
                    امسح باركود بطاقة الصيانة للعميل (Device Barcode)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="مثلاً: DEV-1 أو DEV-2"
                      value={deviceBarcodeIn}
                      onChange={(e) => setDeviceBarcodeIn(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white font-black text-right font-mono text-indigo-750"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[8.5px] text-slate-400 font-bold font-mono">
                      (DEV-ID)
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-450 mt-1 font-semibold">تستطيع كتابة معرف الجهاز مباشرة DEV-1 أو DEV-2 لمحاكاة قراءة كود الليزر الضوئي.</p>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-600 mb-1.5 text-right flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                    امسح باركود الرف المستهدف (Shelf Barcode)
                  </label>
                  <input
                    type="text"
                    placeholder="مثلاً: SHELF-A1, SHELF-C2"
                    value={shelfBarcodeIn}
                    onChange={(e) => setShelfBarcodeIn(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white font-black text-right font-mono text-amber-700"
                  />
                  <p className="text-[10px] text-slate-450 mt-1 font-semibold">يتواجد الترميز على أرفف ورش الموبايل (مثال: SHELF-A1 لرف الاستلام، SHELF-C2 لرف الجاهز للتسليم).</p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ArrowLeftRight className="w-4.5 h-4.5" />
                  محاكاة قراءة الباركود فورياً
                </button>
              </form>
            </div>

            {/* QUICK SELECTOR LINK FORM */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b">
                <div className="p-2 bg-slate-50 text-slate-600 rounded-xl">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-800">تعديل وتحديد الموقع يدوياً (Fast Dropdown Match)</h3>
                  <p className="text-[10.5px] text-slate-450 font-bold">لمحاماة النقل السريع دون الالتجاء لماسح الباركود يدوياً</p>
                </div>
              </div>

              <form onSubmit={handleFastLinkSubmit} className="space-y-4 font-sans text-right">
                <div>
                  <label className="block text-xs font-black text-slate-600 mb-1.5">اختر كارت الصيانة المستهدف</label>
                  <select
                    value={selectedDeviceForQuickLink || ''}
                    onChange={(e) => setSelectedDeviceForQuickLink(e.target.value ? parseInt(e.target.value, 10) : null)}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 font-bold"
                  >
                    <option value="">-- اختر بطاقة فحص نشطة بالورشة --</option>
                    {orders.filter(o => o.status !== 'delivered').map(order => (
                      <option key={order.id} value={order.id}>
                        {order.customerName} - {order.deviceBrand} {order.deviceModel} (ID: {order.id}) [الرف: {order.shelfCode || 'N/A'}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-600 mb-1.5">اختر الرف الجديد</label>
                  <select
                    value={targetShelfForQuickLink}
                    onChange={(e) => setTargetShelfForQuickLink(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 font-bold"
                  >
                    <option value="">-- اختر الرف اللوجستي لتسكين الجهاز به --</option>
                    {shelves.map(shelf => (
                      <option key={shelf.id} value={shelf.code}>
                        {shelf.code} - {shelf.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs rounded-xl transition-all cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <ClipboardCheck className="w-4.5 h-4.5 text-slate-300" />
                  حفظ تعديل الرف
                </button>
              </form>
            </div>
          </div>

          {/* REALTIME SYSTEM SCAN LOGS */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-slate-900 text-slate-100 p-6 rounded-3xl border border-slate-850 shadow-lg min-h-[550px] relative font-mono">
              <div className="absolute top-2.5 left-3.5 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></span>
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
              </div>

              <div className="flex items-center gap-2 text-slate-400 border-b border-slate-800 pb-3 mb-4 text-xs font-bold font-sans justify-between">
                <span>سجل عمليات المسح الضوئي المباشر لقارئ الباركود</span>
                <span className="bg-slate-850 px-2 py-0.5 rounded text-[10px] text-green-400">STATUS: ACTIVE ONLINE</span>
              </div>

              <div className="space-y-3.5 h-[440px] overflow-y-auto pr-1">
                {scanLogs.length === 0 ? (
                  <div className="text-center text-slate-600 py-32 space-y-2.5">
                    <Barcode className="w-10 h-10 mx-auto text-slate-755 animate-pulse" />
                    <p className="text-[11px] font-sans">بانتظار قراءة الليزر للباركودات وتكويد الرفوف...</p>
                  </div>
                ) : (
                  scanLogs.map((log) => (
                    <div key={log.id} className={`p-3 rounded-lg border text-right text-[11px] space-y-1 ${
                      log.success 
                        ? 'bg-slate-850/30 border-green-950 text-green-450' 
                        : 'bg-red-950/20 border-red-950 text-red-400'
                    }`}>
                      <div className="flex justify-between items-center text-[9.5px] text-slate-500 font-bold border-b border-slate-800/40 pb-1 mb-1">
                        <span>{log.time}</span>
                        <span>{log.success ? '✓ SUCCESS' : '𐄂 FAIL'}</span>
                      </div>
                      <p className="font-extrabold font-sans leading-relaxed">{log.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 🔴 SUBTAB 3: SHELF LABELS PRINT PREVIEW */}
      {subTab === 'labels' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-base font-black text-slate-800 mb-1">توليد ملصقات باركود الأرفف في المحل (Barcode Label Generator)</h2>
            <p className="text-xs text-slate-500 font-semibold mb-6">احصل على كود لوجستي مطبوع بجودة عالية لكل رف لتسهيل القراءة بالماسح.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shelves.map((shelf) => (
                <div key={shelf.id} className="bg-slate-50 p-5 rounded-3xl border border-slate-200 flex flex-col justify-between min-h-[220px]">
                  <div>
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="px-2.5 py-1 bg-slate-200 text-slate-800 font-black font-mono text-[11px] rounded-lg">{shelf.code}</span>
                      <span className="text-[10px] text-indigo-700 font-black bg-indigo-50 px-2 py-0.5 rounded border border-indigo-150">
                        {zoneMapping[shelf.zone]?.name || shelf.zone}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-xs text-slate-800 mb-1.5">{shelf.name}</h3>
                    <p className="text-[10.5px] text-slate-500 line-clamp-2 leading-relaxed">{shelf.notes || 'لا يوجد ملاحظات مسجلة لهيكل هذا الرف.'}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-200/60 mt-4 flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 font-extrabold">السعة اللوجستية: {shelf.capacity} أجهزة صيانة</span>
                    <button
                      onClick={() => handlePrintShelfLabel(shelf)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10.5px] rounded-lg inline-flex items-center gap-1 cursor-pointer transition-colors shadow-3xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      طباعة ملصق رف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 🔮 MODAL FOR CREATING SHELVES */}
      {isNewShelfModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-3xs flex items-center justify-center z-50 p-4" id="new-shelf-modal">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border shadow-2xl relative">
            <button 
              onClick={() => setIsNewShelfModalOpen(false)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="text-right space-y-4 font-sans">
              <div className="flex items-center gap-3 border-b pb-3.5">
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                  <MapPin className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 font-sans">تكويد وإضافة رف لوجستي جديد</h3>
                  <p className="text-[10.5px] text-slate-450 font-bold">تسجيل إحداثيات الرف لتسكين هواتف ولابتوبات المعاينة</p>
                </div>
              </div>

              <form onSubmit={handleAddShelf} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-650 mb-1.5">رمز كود الرف (نظام الباركود)</label>
                  <input
                    type="text"
                    required
                    placeholder="مثل: SHELF-E1 أو BIN-A"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 font-mono text-left font-bold"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-655 mb-1.5">اسم أو عنوان الرف الكامل</label>
                  <input
                    type="text"
                    required
                    placeholder="مثلاً: رف حواسب لابتوب معلقة - علوية"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 font-bold text-right"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-655 mb-1.5 text-right">نطاق عمل الرف</label>
                    <select
                      value={newZone}
                      onChange={(e) => setNewZone(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-bold"
                    >
                      <option value="received">مستلمة حديثاً</option>
                      <option value="testing">فحص وتجربة</option>
                      <option value="repair">تحت الإصلاح الفني</option>
                      <option value="ready">جاهزة للتسليم</option>
                      <option value="delivered">مسلمة وأرشيف</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-655 mb-1.5 text-right">سعة الرف الأقصى للأجهزة</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newCapacity}
                      onChange={(e) => setNewCapacity(parseInt(e.target.value, 10))}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-bold text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-650 mb-1.5">وصف أو ملاحظة إضافية</label>
                  <textarea
                    placeholder="ملاحظات توجيهية عن موقع الرف الفيزيائي"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2 text-xs rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 font-semibold text-right"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl cursor-pointer transition-all"
                >
                  حفظ الرف بالترسانة اللوجستية
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ComputerMobileShelves;
