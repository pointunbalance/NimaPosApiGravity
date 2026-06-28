import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, SyncQueueItem } from '../../db';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  DatabaseBackup,
  CheckCircle,
  AlertTriangle,
  Play,
  History,
  HardDrive,
  CloudLightning,
  Clock,
  ExternalLink,
  Laptop,
  Flame,
  X
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

// Default mock Ukrainian customers for demonstration
const OFFLINE_PRESET_CUSTOMERS = [
  { name: 'ياروسلاف بوندس', phone: '0445558822', device: 'MacBook Pro M2' },
  { name: 'بوهدان ميلنيك', phone: '0443015555', device: 'iPhone 15 Pro Max' },
  { name: 'سفيتلانا أولينك', phone: '0449988221', device: 'Asus ROG Strix' },
  { name: 'أولغا كوفالينكو', phone: '0448182838', device: 'iPad Air 5' }
];

const ComputerMobileOfflineSync: React.FC = () => {
  // Live sync queue from Dexie
  const syncQueueItems = useLiveQuery(() => db.syncQueue.toArray()) || [];
  
  // Simulated connection state (stored in localStorage or state to persist easily)
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    const saved = localStorage.getItem('nima_pos_network_mode');
    return saved !== 'offline';
  });

  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [offlineActionCount, setOfflineActionCount] = useState<number>(0);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [conflictPolicy, setConflictPolicy] = useState<'lww' | 'client-wins' | 'server-wins' | 'manual'>('lww');
  const [showConflictSimulator, setShowConflictSimulator] = useState<boolean>(false);
  const [simulatedConflict, setSimulatedConflict] = useState<{ id: string; local: any; remote: any } | null>(null);

  // Connection mode toggle helper
  const handleNetworkToggle = (online: boolean) => {
    setIsOnline(online);
    localStorage.setItem('nima_pos_network_mode', online ? 'online' : 'offline');
    if (online) {
      toast.success('تمت العودة للوضع المتصل! جاري تفعيل المزامنة الصامتة بالخلفية... 🟢');
      triggerBackgroundSync();
    } else {
      toast.error('أنت الآن تعمل بالوضع المحلي الكامل (أوفلاين). كل العمليات ستُحفظ بـ IndexedDB 🔴');
    }
  };

  // Background silence synchronization routine
  const triggerBackgroundSync = async () => {
    const pendings = syncQueueItems.filter(item => item.status === 'pending');
    if (pendings.length === 0) {
      return;
    }

    setSyncing(true);
    setSyncProgress(10);

    // Simulate chunk sync speed
    const total = pendings.length;
    for (let i = 0; i < total; i++) {
      await new Promise(resolve => setTimeout(resolve, 600)); // Simulating network handshake
      const item = pendings[i];
      if (item.id) {
        await db.syncQueue.update(item.id, { status: 'synced' });
      }
      setSyncProgress(Math.round(((i + 1) / total) * 100));
    }

    setSyncing(false);
    toast.success(`اكتملت المزامنة الصامتة في الخلفية! تم ترحيل ${total} مستندات للسيرفر السحابي.`);
  };

  // Simulate an offline receptionist/cashier action (making a maintenance bill or saving a task)
  const handleSimulateOfflineAction = async () => {
    const randomPreset = OFFLINE_PRESET_CUSTOMERS[Math.floor(Math.random() * OFFLINE_PRESET_CUSTOMERS.length)];
    const timestamp = new Date().toISOString();
    
    // Add pending item to dexie sync queue
    const pendingItem: SyncQueueItem = {
      operation: 'create',
      tableName: 'maintenanceOrders',
      timestamp: timestamp,
      status: 'pending',
      data: {
        customerName: randomPreset.name,
        customerPhone: randomPreset.phone,
        deviceModel: randomPreset.device,
        expectedCost: 1500,
        status: 'received_local_offline',
        notes: 'تم الاستلام بالوضع الأوفلاين، محلياً وجاري حجز رف تصفية تلقائي.'
      }
    };

    await db.syncQueue.add(pendingItem);
    setOfflineActionCount(prev => prev + 1);

    if (isOnline) {
      toast.success('تم تسجيل الفاتورة محلياً ورفعها فوراً للسحابة! 🗲');
      // Trigger background sync immediately if we are online
      triggerBackgroundSync();
    } else {
      toast.success(`تم حفظ كارت استلام "${randomPreset.name}" محلياً بالأوفلاين وطابعة الفاتورة جاهزة! 📄💾`);
    }
  };

  // Simulated Master Reset / Force Sync All
  const handleForceCompleteSync = async () => {
    if (!isOnline) {
      toast.error('تعذر تفعيل المزامنة الإجبارية للسيرفرات؛ يرجى فتح حالة الشبكة أولاً!');
      return;
    }
    
    setSyncing(true);
    setSyncProgress(20);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Auto sync any leftovers
    const allQueue = await db.syncQueue.toArray();
    for (const item of allQueue) {
      if (item.status === 'pending') {
        await db.syncQueue.update(item.id!, { status: 'synced' });
      }
    }
    
    setSyncProgress(100);
    await new Promise(resolve => setTimeout(resolve, 400));
    setSyncing(false);
    toast.success('تم إجبار السيرفر السحابي الرئيسي على سحب البيانات وتأكيد سلامة مطابقة الصناديق الفروع.');
  };

  // Simulated queue flushing (Clear queue logs)
  const handleClearQueueLogs = () => {
    const pendings = syncQueueItems.filter(item => item.status === 'pending');
    if (pendings.length > 0) {
      setShowClearConfirm(true);
    } else {
      executeClearQueue();
    }
  };

  const executeClearQueue = async () => {
    await db.syncQueue.clear();
    setOfflineActionCount(0);
    setShowClearConfirm(false);
    toast.success('تم تصفية سجل المزامنة بالكامل بنجاح.');
  };

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen text-right" dir="rtl">
      <Toaster position="top-center" />

      {/* Main Header Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {isOnline ? <Wifi className="w-8 h-8" /> : <WifiOff className="w-8 h-8" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight font-sans">لوجستية المزامنة والعمل الأوفلاين</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-sans ${isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {isOnline ? 'الوضع المتصل • سحابي' : 'أوفلاين • محلي نشط'}
                </span>
              </div>
              <p className="text-gray-500 font-sans mt-1">
                تصفح حالة الإرسال والمزامنة للأجهزة والفواتير المحفوظة في محرك المتصفح المحلي (IndexedDB). يعمل النظام بالكامل حتى في حال انقطاع الكابلات.
              </p>
            </div>
          </div>
        </div>

        {/* Action Toggle Network Simulation */}
        <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200">
          <button
            onClick={() => handleNetworkToggle(true)}
            className={`px-4 py-2 rounded-lg font-sans font-bold text-sm transition cursor-pointer flex items-center gap-2 ${
              isOnline ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wifi className="w-4 h-4" />
            <span>متصل سحابياً (Online)</span>
          </button>
          <button
            onClick={() => handleNetworkToggle(false)}
            className={`px-4 py-2 rounded-lg font-sans font-bold text-sm transition cursor-pointer flex items-center gap-2 ${
              !isOnline ? 'bg-red-500 text-white shadow-xs' : 'text-slate-500 hover:text-red-700'
            }`}
          >
            <WifiOff className="w-4 h-4" />
            <span>انقطاع الإنترنت (Offline)</span>
          </button>
        </div>
      </div>

      {/* Online/Offline Status Banners */}
      {!isOnline && (
        <div className="bg-amber-50 border-r-4 border-amber-500 text-amber-950 p-4 rounded-xl mb-6 font-sans">
          <div className="flex gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
            <div>
              <p className="font-bold text-base">تم تشغيل محرك الطوارئ المحلي (IndexedDB Mode)!</p>
              <p className="text-sm text-amber-800 mt-1">
                يمكن للكاشير وموظف الاستقبال طباعة الفواتير، استلام أجهزة الصيانة، تسجيل التكاليف وعمل فواتير المطالبة المالية بحرية تامة دون الحاجة لإنترنت. بمجرد استقرار الإشارة، سيقوم النظام بمزامنة صامتة في الخلفية دون أي تدخل بشري.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm font-sans">العمليات المحلية المعلقة</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <h3 className="text-3xl font-bold font-mono text-gray-900">
            {syncQueueItems.filter(i => i.status === 'pending').length} مستند
          </h3>
          <p className="text-xs text-gray-400 font-sans mt-2">تنتظر العودة لشبكة الرفع</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm font-sans">العمليات التي تمت مزامنتها</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </span>
          </div>
          <h3 className="text-3xl font-bold font-mono text-emerald-600">
            {syncQueueItems.filter(i => i.status === 'synced').length} مستند
          </h3>
          <p className="text-xs text-gray-400 font-sans mt-2">مؤمنة على السيرفر السحابي</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm font-sans">قاعدة البيانات المحلية (متصفح)</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Database className="w-5 h-5" />
            </span>
          </div>
          <h3 className="text-3xl font-bold font-mono text-blue-600">NimaPosDB</h3>
          <p className="text-xs text-gray-400 font-sans mt-2">IndexedDB • Dexie JS Engine</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm font-sans">محاكاة العمليات الأوفلاين</span>
            <span className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <CloudLightning className="w-5 h-5" />
            </span>
          </div>
          <h3 className="text-3xl font-bold font-mono text-purple-600">
            {offlineActionCount} عملية
          </h3>
          <p className="text-xs text-gray-400 font-sans mt-2">تم إصدارها خلال الجلسة</p>
        </div>
      </div>

      {/* Control panel and Simulators Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs md:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold font-sans text-gray-900 flex items-center gap-2">
              <Play className="w-5 h-5 text-gray-400" />
              لوحة المحاكاة واختبار الاتصال في نقاط البيع
            </h3>
            <span className="text-xs text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full font-bold font-sans">أدوات الكاشير الفورية</span>
          </div>

          <p className="text-gray-500 font-sans text-sm mb-6">
            استعرض كفاءة البرنامج بإغلاق الإنترنت من الزاوية اليسرى، ثم اضغط على "استلام جهاز وتوليد فاتورة بالوضع الأوفلاين". ستلاحظ أن الحركة تظهر باللون الأحمر الفوري، وعندما تفتح الإنترنت مجدداً سيقوم السرفيس السحابي بسحبها خلفياً بنجاح:
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSimulateOfflineAction}
              className="flex items-center gap-2 bg-slate-800 text-white px-5 py-3 rounded-xl hover:bg-slate-900 font-sans cursor-pointer transition shadow-md"
            >
              <DatabaseBackup className="w-5 h-5" />
              <span>استلام جهاز وتوليد فاتورة (مخزن كروت الصيانة) 📟</span>
            </button>

            {syncQueueItems.length > 0 && (
              <button
                onClick={handleForceCompleteSync}
                disabled={syncing}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-3 rounded-xl hover:opacity-95 font-sans cursor-pointer transition shadow-md disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                <span>مزامنة ترحيل يدوي فوري 🔄</span>
              </button>
            )}

            <button
              onClick={handleClearQueueLogs}
              className="px-5 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-sans cursor-pointer transition"
            >
              شطب وتصفية السجلات القديمة 🧹
            </button>
          </div>

          {/* Sync progress bar */}
          {syncing && (
            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex justify-between text-sm font-sans mb-1 font-bold">
                <span className="text-teal-700">جاري ترحيل البيانات صامتاً للشركة الأم الأم...</span>
                <span className="text-slate-600 font-mono">{syncProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                <div className="bg-teal-600 h-full transition-all duration-300" style={{ width: `${syncProgress}%` }}></div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold font-sans text-gray-900 mb-2 flex items-center gap-2">
              <CloudLightning className="w-5 h-5 text-indigo-500" />
              سياسة فض نزاعات البيانات
            </h3>
            <p className="text-gray-500 text-xs font-sans mb-4">
              اختر استراتيجية الحل البرمجية عند تعديل نفس الملف أو الفاتورة محلياً وسحابياً بالتزامن:
            </p>

            <div className="space-y-2 mb-6 text-sm">
              <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent checked:border-indigo-100">
                <input
                  type="radio"
                  name="conflict_policy"
                  checked={conflictPolicy === 'lww'}
                  onChange={() => {
                    setConflictPolicy('lww');
                    toast.success('تم تفعيل سياسة: الكتابة الأخيرة تفوز (Last-Write-Wins) ⏱️');
                  }}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold block text-gray-800 font-sans text-xs">الكتابة الأخيرة تفوز LWW</span>
                  <span className="text-[10px] text-gray-400 block font-sans">تحديث السيرفر مباشرة بالطابع الأحدث</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent">
                <input
                  type="radio"
                  name="conflict_policy"
                  checked={conflictPolicy === 'client-wins'}
                  onChange={() => {
                    setConflictPolicy('client-wins');
                    toast.success('تم تفعيل سياسة: الأولوية لنسخة المتصفح الفرعي 💻');
                  }}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold block text-gray-800 font-sans text-xs">اعتماد العميل الفرعي (Client Wins)</span>
                  <span className="text-[10px] text-gray-400 block font-sans">تجاهل تعديلات السيرفر وتفضيل المدخلات المحلية</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent">
                <input
                  type="radio"
                  name="conflict_policy"
                  checked={conflictPolicy === 'manual'}
                  onChange={() => {
                    setConflictPolicy('manual');
                    toast.success('تم تفعيل سياسة: الحل اليدوي لجميع النزاعات ورصد المراجعة 🕵️');
                  }}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold block text-gray-800 font-sans text-xs">مراجعة بشرية قسرية (Manual Merge)</span>
                  <span className="text-[10px] text-gray-400 block font-sans">تفعيل شباك المقارنة المزدوج في حال التطابق</span>
                </div>
              </label>
            </div>
          </div>

          <div className="border-t pt-4">
            <button
              onClick={() => {
                setSimulatedConflict({
                  id: "ORDER-7712",
                  local: {
                    customerName: "سفيتلانا أولينك (تحديث محلي)",
                    phone: "0449988221",
                    device: "Asus ROG Strix - مفصلة مكسورة 💻",
                    cost: 1850,
                    lastEditBy: "تاراس كاشير (محلي)"
                  },
                  remote: {
                    customerName: "سفيتلانا أولينك (تحديث سحابي)",
                    phone: "0449988221",
                    device: "Asus ROG Strix - شاحن تالف 🔌",
                    cost: 1500,
                    lastEditBy: "ياروسلاف مسؤول سحابي"
                  }
                });
                setShowConflictSimulator(true);
                toast('تم توليد نزاع برمجى اصطناعي للمراجعة اليدوية! 🚨');
              }}
              className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold font-sans transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>محاكاة حدوث نزاع بيانات يدوي 💥</span>
            </button>
          </div>
        </div>
      </div>

      {/* Synced Records Queue Log Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-[#f8fafc]/50 flex justify-between items-center">
          <h4 className="font-bold text-gray-900 font-sans text-lg flex items-center gap-2">
            <History className="w-5 h-5 text-gray-400" />
            سجل العمليات المعلقة وتتبع المزامنة المؤتمتة
          </h4>
          <span className="text-xs text-gray-400 font-mono">العدد الإجمالي: {syncQueueItems.length} معاملة</span>
        </div>

        {syncQueueItems.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-sans">
            <HardDrive className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-xl">سجل المزامنة فارغ تماماً بنجاح.</p>
            <p className="text-sm text-gray-400 mt-1">
              اضغط على "استلام جهاز وتوليد فاتورة" لتوليد حركات محلية معلقة واختبار الكفاءة.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] text-gray-700 text-sm border-b border-gray-100">
                  <th className="p-4 font-bold font-sans">معرف الحركة</th>
                  <th className="p-4 font-bold font-sans">النوع / الجدول</th>
                  <th className="p-4 font-bold font-sans">العملية الإجرائية</th>
                  <th className="p-4 font-bold font-sans">توقيت التسجيل</th>
                  <th className="p-4 font-bold font-sans">البيانات الفنية الفورية</th>
                  <th className="p-4 font-bold font-sans">حالة الإرسال للسحاب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {syncQueueItems.slice().reverse().map(item => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4 font-mono text-sm text-gray-500">#SYNC-{item.id}</td>
                    <td className="p-4 font-mono text-slate-700">{item.tableName}</td>
                    <td className="p-4 font-sans text-sm font-semibold">
                      {item.operation === 'create' ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-xs">إضافة (جديد)</span>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-xs">تحديث كرت</span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-sm text-gray-500">{new Date(item.timestamp).toLocaleString()}</td>
                    <td className="p-4 text-xs font-mono text-gray-600 max-w-xs truncate">
                      {JSON.stringify(item.data)}
                    </td>
                    <td className="p-4">
                      {item.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full font-medium bg-rose-50 text-rose-700 border border-rose-100 animate-pulse">
                          معلق محلياً • أوفلاين 🔴
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                          تم النقل للسحابة بنجاح 🟢
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 1. CUSTOM STATE-BASED CONFIRMATION DIALOG (No native dialogs!) */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 border border-gray-100 shadow-2xl text-right">
            <div className="flex items-center gap-3 mb-4 text-amber-600">
              <AlertTriangle className="w-8 h-8" />
              <h3 className="text-xl font-bold font-sans">تنبيه شطب المسودات المعلقة</h3>
            </div>
            <p className="text-gray-600 text-sm font-sans mb-6 leading-relaxed">
              انتبه! لديك عمليات معلقة باللون الأحمر لم يتم رفعها واستلامها في السحابة بعد. شطب السجل الآن سيؤدي لإزالة المسودات المحلية ولن تتمكن السيرفرات السحابية من مطابقتها.
              هل تريد الاستمرار وشطبها فعلاً؟
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-sans font-bold cursor-pointer transition"
              >
                تراجع وإلغاء
              </button>
              <button
                type="button"
                onClick={executeClearQueue}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-sans font-bold cursor-pointer transition"
              >
                نعم، شطب المسودات 🧹
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MANUAL CONFLICT MERGE WORKSPACE MODAL */}
      {showConflictSimulator && simulatedConflict && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border border-gray-100 text-right my-8">
            <div className="bg-gradient-to-r from-red-600 to-amber-600 text-white p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Flame className="w-6 h-6 animate-pulse" />
                  <h3 className="text-xl font-bold font-sans">شاشة فض التضارب ومطابقة الكروت يدوياً</h3>
                </div>
                <button type="button" onClick={() => { setShowConflictSimulator(false); setSimulatedConflict(null); }} className="text-white hover:text-gray-200">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-red-50 text-xs mt-1 font-sans">
                تم رصد نزاع تزامني على رقم الكارت {simulatedConflict.id} بين التحديث المحلي على الفرع والتعديل الجديد في السحابة:
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Local Branch Version */}
                <div className="bg-indigo-50/40 p-5 rounded-2xl border border-indigo-100 relative">
                  <span className="absolute top-3 left-3 px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full font-sans">نسخة المتصفح المحلي (الفرع)</span>
                  <p className="text-xs text-indigo-800 font-bold mb-3">📍 محطة كاشير الورشة</p>
                  
                  <div className="space-y-2 text-sm font-sans text-right">
                    <div className="flex justify-between border-b border-indigo-100 pb-2">
                      <span className="text-slate-500">اسم العميل (الشركة):</span>
                      <span className="font-bold text-slate-800">{simulatedConflict.local.customerName}</span>
                    </div>
                    <div className="flex justify-between border-b border-indigo-100 pb-2">
                      <span className="text-slate-500">العطل المرصود والمواصفة:</span>
                      <span className="font-bold text-slate-800">{simulatedConflict.local.device}</span>
                    </div>
                    <div className="flex justify-between border-b border-indigo-100 pb-2">
                      <span className="text-slate-500">التكلفة والرسوم المقدرة:</span>
                      <span className="font-mono font-bold text-slate-800">{simulatedConflict.local.cost} ج.م</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-slate-500">المستخدم الأخير بالمسودة:</span>
                      <span className="text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full text-xs font-bold">{simulatedConflict.local.lastEditBy}</span>
                    </div>
                  </div>
                </div>

                {/* Remote Cloud Version */}
                <div className="bg-amber-50/40 p-5 rounded-2xl border border-amber-100 relative">
                  <span className="absolute top-3 left-3 px-2 py-0.5 bg-amber-600 text-white text-[10px] font-bold rounded-full font-sans">نسخة السيرفر السحابي (الرئسية)</span>
                  <p className="text-xs text-amber-800 font-bold mb-3">☁️ الإدارة العامة للشركة</p>
                  
                  <div className="space-y-2 text-sm font-sans text-right">
                    <div className="flex justify-between border-b border-amber-100 pb-2">
                      <span className="text-slate-500">اسم العميل (الشركة):</span>
                      <span className="font-bold text-slate-800">{simulatedConflict.remote.customerName}</span>
                    </div>
                    <div className="flex justify-between border-b border-amber-100 pb-2">
                      <span className="text-slate-500">العطل المرصود والمواصفة:</span>
                      <span className="font-bold text-slate-800">{simulatedConflict.remote.device}</span>
                    </div>
                    <div className="flex justify-between border-b border-amber-100 pb-2">
                      <span className="text-slate-500">التكلفة والرسوم المقدرة:</span>
                      <span className="font-mono font-bold text-slate-800">{simulatedConflict.remote.cost} ج.م</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-slate-500">المستخدم الأخير بالمسودة:</span>
                      <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full text-xs font-bold">{simulatedConflict.remote.lastEditBy}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border text-sm text-slate-600 font-sans space-y-1">
                <span className="font-bold block text-slate-800">💡 توجيهات الجودة والمطابقة:</span>
                <p>يمكن للمشرف الفني أو المدير اختيار اعتماد أحد البيانات كالحق الوحيد للمطابقة، أو معالجة الحقول ودمج القيم محلياً لحماية تماسك الفواتير وحفظاً لقيم القيود المحاسبية بالصناديق.</p>
              </div>
            </div>

            <div className="p-6 bg-slate-100/80 border-t border-slate-200 flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  toast.success(`تم تجاوز النزاع بنجاح واختيار نسخة الورشة المحلية (#${simulatedConflict.id}) ✅`);
                  setShowConflictSimulator(false);
                  setSimulatedConflict(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold font-sans cursor-pointer transition select-none"
              >
                اعتماد نسخة المتصفح المحلي 💻
              </button>
              <button
                type="button"
                onClick={() => {
                  toast.success(`تم تجاوز النزاع بنجاح واختيار نسخة السيرفر السحابي (#${simulatedConflict.id}) ☁️`);
                  setShowConflictSimulator(false);
                  setSimulatedConflict(null);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold font-sans cursor-pointer transition select-none"
              >
                اعتماد نسخة السيرفر السحابي ☁️
              </button>
              <button
                type="button"
                onClick={() => {
                  toast.success(`تم دمج الحقول تلقائياً: العطل المرصود "شاحن تالف + مفصلة مكسورة" بسعر دمج 1850 ج.م 📑`);
                  setShowConflictSimulator(false);
                  setSimulatedConflict(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold font-sans cursor-pointer transition select-none"
              >
                دمج ذكي للقيمتين (Smart Merge) 🧬
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConflictSimulator(false);
                  setSimulatedConflict(null);
                }}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-xl text-xs font-bold font-sans cursor-pointer transition select-none"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ComputerMobileOfflineSync;
