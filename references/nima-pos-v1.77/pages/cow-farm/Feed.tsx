import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { 
  Plus, Save, Calendar, Check, AlertTriangle, Coffee, 
  Trash2, FileText, CheckCircle, Search, Clock, DollarSign, Store, Warehouse,
  SlidersHorizontal, RefreshCw, Layers, ArrowLeftRight, User, CircleAlert, MapPin, Scale, ChevronLeft
} from 'lucide-react';
import { AccountingEngine } from '../../services/AccountingEngine';
import toast, { Toaster } from 'react-hot-toast';

interface FeedStockItem {
  id?: number;
  name: string;
  stock: number; // in kg
  unit: string; // 'كجم'
}

interface FeedingSession {
  id?: number;
  feedId: number;
  feedName: string;
  quantity: number; // deducted in kg
  date: string;
  roomNumber: string; // e.g., عنبر 1
  recordedBy: string;
}

export default function CowFarmFeed() {
  const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
  const [isEatingModalOpen, setIsEatingModalOpen] = useState(false);
  
  // Custom Confirmation Modal State
  const [confirmDeleteId, setConfirmDeleteId] = useState<{ id: number; type: 'feed' | 'session'; label: string } | null>(null);

  // Search & Filter state for Feed Stock Silos
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockFilterStatus, setStockFilterStatus] = useState<'all' | 'low' | 'normal'>('all');

  // Search & Filter state for Feeding Sessions Diary
  const [sessionSearchQuery, setSessionSearchQuery] = useState('');
  const [selectedBarnFilter, setSelectedBarnFilter] = useState('all');
  const [sessionDateFilter, setSessionDateFilter] = useState('');

  // Feeding Form states
  const [selectedFeedId, setSelectedFeedId] = useState<number | ''>('');
  const [feedDate, setFeedDate] = useState(new Date().toISOString().split('T')[0]);
  const [eatQuantity, setEatQuantity] = useState(50);
  const [paddockRoom, setPaddockRoom] = useState('عنبر 1');
  const [feedRecordedBy, setFeedRecordedBy] = useState('مدير الحظيرة');
  const [feedFormError, setFeedFormError] = useState('');

  // New purchase supply feed state
  const [newFeedName, setNewFeedName] = useState('سيلاج ذرة طازج');
  const [purchaseQuantity, setPurchaseQuantity] = useState(500);
  const [punit, setPunit] = useState('كجم');
  const [purchaseCost, setPurchaseCost] = useState(2500);
  const [postPurchaseToLedger, setPostPurchaseToLedger] = useState(true);
  const [selectedDebitAccountId, setSelectedDebitAccountId] = useState<number | ''>('');
  const [selectedCreditAccountId, setSelectedCreditAccountId] = useState<number | ''>('');
  const [purchaseFormError, setPurchaseFormError] = useState('');

  // Queries
  const feedStock = useLiveQuery(() => db.cowFarmFeedStock.toArray()) || [];
  const feedingSessions = useLiveQuery(() => db.cowFarmFeeding.toArray()) || [];
  const accounts = useLiveQuery(() => db.accounts.toArray()) || [];
  const financialLogs = useLiveQuery(() => db.cowFarmFinancials.toArray()) || [];

  // Low Stock Threshold
  const lowStockThreshold = 150;
  const criticalItems = feedStock.filter(f => f.stock < lowStockThreshold);

  // Suggested accounts for expense and assets
  const accountsPreset = useMemo(() => {
    const expenseAccs = accounts.filter(a => a.type?.toLowerCase() === 'expense' || a.code?.startsWith('5') || a.name?.includes('مصروف') || a.name?.includes('مستلزمات') || a.name?.includes('أعلاف'));
    const assetAccs = accounts.filter(a => a.type?.toLowerCase() === 'asset' || a.name?.includes('صندوق') || a.name?.includes('الخزينة') || a.name?.includes('بنك'));
    return { expenseAccs, assetAccs };
  }, [accounts]);

  // Quick stats calculations
  const totalStockKg = useMemo(() => {
    return feedStock.reduce((acc, curr) => acc + curr.stock, 0);
  }, [feedStock]);

  const totalFedTodayKg = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return feedingSessions
      .filter(s => s.date === todayStr)
      .reduce((acc, curr) => acc + curr.quantity, 0);
  }, [feedingSessions]);

  const latestPurchaseCost = useMemo(() => {
    // Find the latest financial log with 'شراء أعلاف وتغذية'
    const purchases = financialLogs.filter(f => f.type === 'شراء أعلاف وتغذية');
    if (purchases.length === 0) return 0;
    // Get absolute amount value
    return Math.abs(purchases[purchases.length - 1].amount);
  }, [financialLogs]);

  // Room Numbers dynamic list populated from feeding sessions for quick filter
  const roomList = useMemo(() => {
    const rooms = new Set<string>();
    feedingSessions.forEach(s => {
      if (s.roomNumber) rooms.add(s.roomNumber);
    });
    return Array.from(rooms);
  }, [feedingSessions]);

  // Open Purchase and preset accounting
  const handleOpenPurchase = () => {
    setNewFeedName('مركزات وتسمين 18%');
    setPurchaseQuantity(1000);
    setPurchaseCost(15050); // Premium feed purchase preset
    setPostPurchaseToLedger(true);
    setPurchaseFormError('');

    // Pre-match standard accounts
    const expAcc = accounts.find(a => a.name?.includes('علف') || a.name?.includes('أعلاف') || a.name?.includes('مستلزمات'));
    const cashAcc = accounts.find(a => a.name?.includes('صندوق') || a.name?.includes('الخزينة'));
    
    if (expAcc) setSelectedDebitAccountId(expAcc.id!);
    else if (accountsPreset.expenseAccs.length > 0) setSelectedDebitAccountId(accountsPreset.expenseAccs[0].id!);

    if (cashAcc) setSelectedCreditAccountId(cashAcc.id!);
    else if (accountsPreset.assetAccs.length > 0) setSelectedCreditAccountId(accountsPreset.assetAccs[0].id!);

    setIsFeedModalOpen(true);
  };

  // Open feeding modal and preset safely
  const handleOpenFeeding = () => {
    setFeedFormError('');
    if (feedStock.length === 0) {
      toast.error('يرجى توريد أو إضافة أصناف أعلاف للمخزن أولاً قبل توزيع الوجبات!');
      return;
    }
    // Auto-select first in stock
    const availableItem = feedStock.find(f => f.stock > 0);
    if (availableItem) {
      setSelectedFeedId(availableItem.id!);
    } else {
      setSelectedFeedId(feedStock[0].id!);
    }
    setEatQuantity(50);
    setPaddockRoom('عنبر 1');
    setFeedDate(new Date().toISOString().split('T')[0]);
    setIsEatingModalOpen(true);
  };

  // Restock log trigger
  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setPurchaseFormError('');

    if (!newFeedName.trim()) {
      setPurchaseFormError('اسم الصنف مطلوب وتوضيحي.');
      return;
    }
    if (purchaseQuantity <= 0) {
      setPurchaseFormError('كمية الشراء تلزم أن تكون كجم واحد فما فوق.');
      return;
    }

    let journalEntryId: number | undefined = undefined;

    // Double entry posting calculation
    if (postPurchaseToLedger && purchaseCost > 0) {
      if (!selectedDebitAccountId || !selectedCreditAccountId) {
        setPurchaseFormError('الرجاء تحديد كلا الحسابين (المصروف المدين وحساب الخزينة الدائن) لإتمام القيد المزدوج ترحيلياً.');
        return;
      }
      try {
        journalEntryId = await AccountingEngine.postEntry({
          date: new Date(),
          reference: `FEED-PURCHASE-${Date.now().toString().slice(-4)}`,
          description: `تأمين وتوريد أعلاف القطيع: ${newFeedName} - كمية ${purchaseQuantity} كجم`,
          lines: [
            {
              accountId: Number(selectedDebitAccountId),
              debit: Number(purchaseCost),
              credit: 0
            },
            {
              accountId: Number(selectedCreditAccountId),
              debit: 0,
              credit: Number(purchaseCost)
            }
          ]
        });

        // Add inside dedicated Cow Farm Financial logs
        await db.cowFarmFinancials.add({
          date: new Date().toISOString().split('T')[0],
          type: 'شراء أعلاف وتغذية',
          amount: -Number(purchaseCost),
          journalEntryId,
          notes: `شراء وتأمين ${purchaseQuantity} كجم من علف [${newFeedName}]`
        });

      } catch (err: any) {
        setPurchaseFormError(`فشل ترحيل قيد التوريد للحسابات: ${err.message || err}`);
        return;
      }
    }

    try {
      // Check if stock already exits by name (case-insensitive and trimmed)
      const existing = feedStock.find(f => f.name.trim().toLowerCase() === newFeedName.trim().toLowerCase());
      if (existing) {
        await db.cowFarmFeedStock.update(existing.id!, {
          stock: existing.stock + Number(purchaseQuantity)
        });
        toast.success(`تم بنجاح تحديث وتوريد الوجبة! رصيد علف ${existing.name} الحالي: ${existing.stock + Number(purchaseQuantity)} كجم.`);
      } else {
        await db.cowFarmFeedStock.add({
          name: newFeedName.trim(),
          stock: Number(purchaseQuantity),
          unit: punit
        });
        toast.success(`تم بنجاح توريد وتسجيل صنف تغذية جديد: [ ${newFeedName} ] بمخزن صوامع الغلال.`);
      }

      setIsFeedModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('حدث عطل فني محلي أثناء حفظ مخزون المزرعة.');
    }
  };

  // Feeding distribution log trigger
  const handleSaveFeeding = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedFormError('');

    if (!selectedFeedId) {
      setFeedFormError('الرجاء اختيار نوع العلف لإفراغ الحصة.');
      return;
    }

    const item = feedStock.find(f => f.id === Number(selectedFeedId));
    if (!item) {
      setFeedFormError('الصنف المختار غير مسجل في بطاقة المستودع.');
      return;
    }

    if (item.stock < eatQuantity) {
      setFeedFormError(`عذراً، الرصيد المتاح من هذا العلف هو (${item.stock} كجم) فقط، وهو أقل من الحصة المطلوبة لتغذية الأبقار (${eatQuantity} كجم).`);
      return;
    }

    try {
      // 1. Deduct stock safely
      await db.cowFarmFeedStock.update(item.id!, {
        stock: Math.max(0, item.stock - Number(eatQuantity))
      });

      // 2. Add feeding session log
      await db.cowFarmFeeding.add({
        feedId: item.id!,
        feedName: item.name,
        quantity: Number(eatQuantity),
        date: feedDate,
        roomNumber: paddockRoom.trim(),
        recordedBy: feedRecordedBy.trim()
      });

      toast.success(`تم صرف وتسجيل الحصة الغذائية للقطيع (${eatQuantity} كجم) داخل ${paddockRoom} بنجاح ✅`);
      setIsEatingModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء الاتصال بقاعدة بيانات الأعلاف المحلية.');
    }
  };

  // Triggers deletion of feed silos or logs using a pretty Custom modal component
  const handleConfirmAction = async () => {
    if (!confirmDeleteId) return;

    try {
      if (confirmDeleteId.type === 'feed') {
        const checkActive = feedingSessions.some(s => s.feedId === confirmDeleteId.id);
        if (checkActive) {
          toast.error('لا يمكن شطب صنف العلف هذا نظراً لوجود سجلات توزيع وجبات مرتبطة به تاريخياً!');
          setConfirmDeleteId(null);
          return;
        }
        await db.cowFarmFeedStock.delete(confirmDeleteId.id);
        toast.success('تم إزالة صنف العلف من قائمة الصوامع والمخازن.');
      } 
      else if (confirmDeleteId.type === 'session') {
        // Find session first
        const sessionToCancel = feedingSessions.find(s => s.id === confirmDeleteId.id);
        if (sessionToCancel) {
          // Find stock item and return back the quantity ! Offline integrity focus.
          const matchingStock = feedStock.find(f => f.name === sessionToCancel.feedName || f.id === sessionToCancel.feedId);
          if (matchingStock) {
            await db.cowFarmFeedStock.update(matchingStock.id!, {
              stock: matchingStock.stock + sessionToCancel.quantity
            });
            toast.success(`تم استرجاع حصة ${sessionToCancel.quantity} كجم وإعادة إيداعها في رصيد [${matchingStock.name}] بنجاح.`);
          }
          await db.cowFarmFeeding.delete(confirmDeleteId.id);
          toast.success('تم التراجع وإلغاء حصة التغذية الملغاة.');
        }
      }
    } catch (err: any) {
      toast.error(`عذراً، حدث خطأ أثناء تنفيذ الحذف: ${err.message || err}`);
    }

    setConfirmDeleteId(null);
  };

  // Filter feed silos
  const filteredFeedStock = useMemo(() => {
    return feedStock.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(stockSearchQuery.toLowerCase());
      const matchesStatus = 
        stockFilterStatus === 'all' ? true :
        stockFilterStatus === 'low' ? item.stock < lowStockThreshold :
        item.stock >= lowStockThreshold;
      return matchesSearch && matchesStatus;
    });
  }, [feedStock, stockSearchQuery, stockFilterStatus]);

  // Filter feeding logs
  const filteredFeedingSessions = useMemo(() => {
    return feedingSessions.filter(session => {
      const matchesSearch = 
        session.feedName.toLowerCase().includes(sessionSearchQuery.toLowerCase()) ||
        session.recordedBy.toLowerCase().includes(sessionSearchQuery.toLowerCase());
      
      const matchesBarn = selectedBarnFilter === 'all' ? true : session.roomNumber === selectedBarnFilter;
      const matchesDate = sessionDateFilter ? session.date === sessionDateFilter : true;

      return matchesSearch && matchesBarn && matchesDate;
    });
  }, [feedingSessions, sessionSearchQuery, selectedBarnFilter, sessionDateFilter]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-7 bg-slate-50/50 min-h-screen text-slate-800" dir="rtl" id="cowfarm-feed">
      <Toaster position="top-left" reverseOrder={true} />

      {/* Header index action bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-slate-200/80 pb-6">
        <div>
          <span className="px-3 py-1 text-xs font-bold text-emerald-850 bg-emerald-100 rounded-full inline-block mb-2">أمن المخزون الزراعي والحيواني 🌾</span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">مخزون الأعلاف والتغذية</h1>
          <p className="text-slate-500 font-semibold mt-1.5 text-sm">متابعة صوامع الغلال والحبوب للقطيع، وجدولة حصص الوجبات وعمليات التوريد المحاسبي.</p>
        </div>
        
        <div className="flex flex-wrap gap-2.5 shrink-0 w-full sm:w-auto">
          <button 
            onClick={handleOpenFeeding}
            className="flex-1 sm:flex-initial px-5 py-3 cursor-pointer bg-amber-600 hover:bg-amber-700 active:scale-[0.98] duration-150 text-white font-extrabold rounded-2xl shadow-sm shadow-amber-600/10 flex items-center justify-center gap-2 text-xs border-none"
          >
            <CheckCircle className="w-4.5 h-4.5 text-white" /> توزيع وجبة حظيرة
          </button>
          
          <button 
            onClick={handleOpenPurchase}
            className="flex-1 sm:flex-initial px-5 py-3 cursor-pointer bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] duration-150 text-white font-extrabold rounded-2xl shadow-sm shadow-emerald-700/10 flex items-center justify-center gap-2 text-xs border-none"
          >
            <Warehouse className="w-4.5 h-4.5 text-white" /> شراء وتوريد أعلاف جديدة
          </button>
        </div>
      </div>

      {/* Analytics widgets Grid bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="accounting-insights">
        
        {/* Total Stock */}
        <div className="bg-white border border-slate-200/85 p-5 rounded-3xl flex items-center gap-4 hover:shadow-sm duration-200">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Warehouse className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-450 block font-bold">إجمالي رصيد الصوامع</span>
            <span className="font-mono font-black text-2xl text-slate-900 leading-tight">
              {totalStockKg.toLocaleString('ar-EG')} <span className="text-sm font-extrabold text-slate-400">كجم</span>
            </span>
          </div>
        </div>

        {/* Total Distributed today */}
        <div className="bg-white border border-slate-200/85 p-5 rounded-3xl flex items-center gap-4 hover:shadow-sm duration-200">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Coffee className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-450 block font-bold">الكميات المستهلكة اليوم</span>
            <span className="font-mono font-black text-2xl text-slate-900 leading-tight">
              {totalFedTodayKg.toLocaleString('ar-EG')} <span className="text-sm font-extrabold text-slate-400">كجم</span>
            </span>
          </div>
        </div>

        {/* Low Stock count indicator */}
        <div className={`border p-5 rounded-3xl flex items-center gap-4 hover:shadow-sm duration-200 ${
          criticalItems.length > 0 ? 'bg-amber-50/40 border-amber-200' : 'bg-white border-slate-200/85'
        }`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            criticalItems.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-600'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-450 block font-bold">أصناف منخفضة (حرجة)</span>
            <span className="font-mono font-black text-2xl text-slate-900 leading-tight">
              {criticalItems.length} <span className="text-xs font-extrabold text-slate-450">تحت الخطر</span>
            </span>
          </div>
        </div>

        {/* Value of last purchase */}
        <div className="bg-white border border-slate-200/85 p-5 rounded-3xl flex items-center gap-4 hover:shadow-sm duration-200">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <DollarSign className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-xs text-slate-450 block font-bold">مشتريات الغذاء الأخيرة</span>
            <span className="font-mono font-black text-2xl text-slate-900 leading-tight">
              {latestPurchaseCost.toLocaleString('ar-EG')} <span className="text-xs font-extrabold text-indigo-700">ج.م</span>
            </span>
          </div>
        </div>

      </div>

      {/* Warnings Header Header Alerts for very low stock levels */}
      {criticalItems.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-4 flex gap-3.5 items-center">
          <CircleAlert className="w-5.5 h-5.5 text-amber-600 shrink-0" />
          <div className="text-xs sm:text-sm text-slate-700 font-semibold leading-relaxed">
            انتباه المربّي: هناك أصناف غذائية منخفضة المخزون: ({criticalItems.map(c => `[${c.name}]`).join(', ')}). الرصيد الحالي أقل من الحد الآمن للوجبات اليومية (<strong className="font-mono text-amber-800">{lowStockThreshold} كجم</strong>). يرجى إصدار أمر توريد.
          </div>
        </div>
      )}

      {/* Grid: Feed stock levels and historical feeds session logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Module Panel: Current Silo Yards (Silos List) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm space-y-5">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h2 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <Warehouse className="w-5.5 h-5.5 text-emerald-700 stroke-[2.2]" />
                موازين ورصيد الأكياس والصوامع
              </h2>
              <p className="text-[11px] text-slate-450 block font-bold">مراقبة كميات الغلال والقمح والسيلاج بالمستودع</p>
            </div>
            <span className="px-2.5 py-1 text-xs font-mono font-semibold bg-slate-100 rounded-lg text-slate-600">
              {filteredFeedStock.length} صنفاً
            </span>
          </div>

          {/* Quick Filters for Silos */}
          <div className="space-y-2.5">
            {/* Search Input for Stocks */}
            <div className="relative">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث عن مخزون علف معين..."
                value={stockSearchQuery}
                onChange={(e) => setStockSearchQuery(e.target.value)}
                className="w-full pr-10 pl-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl outline-none duration-150 font-bold"
              />
            </div>

            {/* Selector Status Chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold">
              <button
                onClick={() => setStockFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg border cursor-pointer duration-100 ${
                  stockFilterStatus === 'all' 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setStockFilterStatus('low')}
                className={`px-3 py-1.5 rounded-lg border cursor-pointer duration-100 ${
                  stockFilterStatus === 'low' 
                    ? 'bg-amber-50 text-amber-805 border-amber-200' 
                    : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50'
                }`}
              >
                تحت حد الخطر ({criticalItems.length})
              </button>
              <button
                onClick={() => setStockFilterStatus('normal')}
                className={`px-3 py-1.5 rounded-lg border cursor-pointer duration-100 ${
                  stockFilterStatus === 'normal' 
                    ? 'bg-sky-50 text-sky-800 border-sky-200' 
                    : 'bg-white text-slate-655 border-slate-200 hover:bg-slate-50'
                }`}
              >
                رصيد آمن وممتلئ
              </button>
            </div>
          </div>

          {/* Feed Silos Visual Progress and Lists */}
          <div className="divide-y divide-slate-100/95 max-h-[460px] overflow-y-auto pr-0.5">
            {filteredFeedStock.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-bold space-y-2">
                <Warehouse className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs">لا توجد أصناف أعلاف تطابق مدخلات البحث الحالية.</p>
              </div>
            ) : (
              filteredFeedStock.map((item) => {
                const isUnderDanger = item.stock < lowStockThreshold;
                // Imagine max capacity of a single silo in this UI representation is 2000 kg
                const maxCapacity = 2000;
                const progressPercentage = Math.min(100, Math.round((item.stock / maxCapacity) * 100));

                return (
                  <div key={item.id} className="py-4.5 space-y-3 block">
                    {/* Header Row */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{item.name}</h3>
                        <span className="text-[11px] text-slate-500 font-bold mt-1 inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg font-mono">
                          <Scale className="w-3.5 h-3.5" /> الرصيد: {item.stock.toLocaleString('ar-EG')} {item.unit}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg ${
                          isUnderDanger 
                            ? 'bg-rose-50 text-rose-700 border border-rose-100/60 animate-pulse' 
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-100/60'
                        }`}>
                          {isUnderDanger ? 'طلب توريد فوري ⚠️' : 'طبيعي ومؤمن ✅'}
                        </span>

                        {/* Direct deletion action safely without browser popups */}
                        <button
                          onClick={() => setConfirmDeleteId({ id: item.id!, type: 'feed', label: `حذف الصنف [${item.name}] من المستودع` })}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer duration-150 border-none"
                          title="حذف صنف العلف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Silo Meter */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-405">
                        <span>سعة الصومعة التقديرية</span>
                        <span>{progressPercentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            isUnderDanger ? 'bg-amber-500' : 'bg-emerald-600'
                          }`} 
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Module Panel: Feeding Sessions Diary Log */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-slate-100">
            <div>
              <h2 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <Clock className="w-5.5 h-5.5 text-sky-600 stroke-[2.2]" />
                سجل يوميات وجسات التغذية الموزّعة
              </h2>
              <p className="text-[11px] text-slate-450 block font-bold">الحصة العلفية المنصرفة للأبقار في العنابر ومقار الحظر</p>
            </div>
            
            <span className="px-2.5 py-1 text-xs font-mono font-semibold bg-sky-50 text-sky-700 rounded-lg shrink-0">
              {filteredFeedingSessions.length} وجبة مسجلة
            </span>
          </div>

          {/* Session Search, Barn Filter & Date Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
            {/* Search sessions */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                value={sessionSearchQuery}
                onChange={(e) => setSessionSearchQuery(e.target.value)}
                placeholder="ابحث بالعلف أو المشرف..."
                className="w-full pr-9 pl-2 py-1.5 text-xs bg-white border border-slate-200 focus:border-indigo-500 rounded-xl outline-none font-semibold text-slate-700 placeholder-slate-400"
              />
            </div>

            {/* Selector Barn */}
            <div>
              <select
                value={selectedBarnFilter}
                onChange={(e) => setSelectedBarnFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl outline-none font-semibold text-slate-700"
              >
                <option value="all">كل العنابر والحظائر</option>
                <option value="عنبر 1">عنبر 1</option>
                <option value="عنبر 2">عنبر 2</option>
                <option value="عنبر 3">عنبر 3</option>
                <option value="محجر العزل">محجر العزل</option>
                {roomList.filter(r => r !== 'عنبر 1' && r !== 'عنبر 2' && r !== 'عنبر 3' && r !== 'محجر العزل').map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Filter Date */}
            <div>
              <input
                type="date"
                value={sessionDateFilter}
                onChange={(e) => setSessionDateFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl outline-none font-semibold text-slate-700"
              />
            </div>
          </div>

          {/* Sessions Diary List Table/Flow */}
          <div className="overflow-x-auto pr-0.5">
            {filteredFeedingSessions.length === 0 ? (
              <div className="py-16 text-center text-slate-400 font-bold space-y-3">
                <Coffee className="w-12 h-12 mx-auto text-slate-300" />
                <p className="text-xs">لا يوجد رصد لوجبات مطابقة لخيارات البحث الحالية اليوم.</p>
                {sessionDateFilter && (
                  <button 
                    onClick={() => setSessionDateFilter('')}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black cursor-pointer border-none"
                  >
                    إعادة تعيين تاريخ التصفية
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-slate-400 text-[10px] font-bold">
                    <th className="p-3 text-right">صنف العلف</th>
                    <th className="p-3 text-right">الكمية المنصرفة</th>
                    <th className="p-3 text-right">التاريخ ووقت الحصة</th>
                    <th className="p-3 text-right">مكان الحظيرة / العنبر</th>
                    <th className="p-3 text-right">المنفذ والمشرف</th>
                    <th className="p-3 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {filteredFeedingSessions.slice().reverse().map((session) => (
                    <tr key={session.id} className="hover:bg-slate-50/45 duration-100">
                      
                      {/* Name */}
                      <td className="p-3 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          {session.feedName}
                        </div>
                      </td>

                      {/* Weight */}
                      <td className="p-3 font-bold">
                        <span className="font-mono text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded-lg border border-slate-200/50">
                          {session.quantity} كجم
                        </span>
                      </td>

                      {/* Date */}
                      <td className="p-3 text-slate-500 font-mono text-[11px]">{session.date}</td>

                      {/* Room */}
                      <td className="p-3">
                        <span className="px-2 py-1 text-[10px] font-bold rounded-lg bg-amber-50 text-amber-800 border border-amber-100/60 inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {session.roomNumber}
                        </span>
                      </td>

                      {/* Supervisor */}
                      <td className="p-3 text-slate-505 text-[11px]">
                        <div className="flex items-center gap-1 font-bold text-slate-800">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {session.recordedBy}
                        </div>
                      </td>

                      {/* Cancellation Action - Safe refunds to stock */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setConfirmDeleteId({ 
                            id: session.id!, 
                            type: 'session', 
                            label: `التراجع وإلغاء حصة التغذية لـ (${session.feedName}) وإرجاع كمية (${session.quantity} كجم) لمستودع الأعلاف` 
                          })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-650 hover:bg-red-50/80 active:scale-95 duration-155 cursor-pointer border-none"
                          title="إلغاء الحصة واسترداد الوزن"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* ⚠️ Custom Offline Confirmation Modal Component for deleting and reversing entries */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm border border-slate-100 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex gap-3.5 items-start">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900 text-lg">تأكيدات المزرعة ومخزونها</h4>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  هل أنت متيقن تماماً من رغبتك في إتمام هذا الإجراء؟
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs font-bold text-slate-700 leading-normal">
              العملية: <span className="text-red-700">{confirmDeleteId.label}</span>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs duration-100 cursor-pointer border-none"
              >
                تراجع وإلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs duration-100 shadow-lg shadow-red-600/10 cursor-pointer border-none"
              >
                تأكيد التنفيذ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feeding distribution modal */}
      {isEatingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSaveFeeding} className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in duration-200 border border-slate-100">
            <div className="p-6 bg-amber-600 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black bg-white/10 px-2 py-0.5 rounded-md uppercase">الوجبات اليومية</span>
                <h3 className="text-xl font-bold mt-1">توزيع حصة حظيرة للقطيع</h3>
                <p className="text-xs text-amber-50 mt-1.5">خصم الوجبة الغذائية من رصيد الصوامع مباشرة.</p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsEatingModalOpen(false)} 
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 duration-100 cursor-pointer border-none text-white"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              {feedFormError && (
                <div className="p-3 bg-red-50 text-red-800 border border-red-150 rounded-2xl text-xs font-bold flex items-center gap-1.5">
                  <CircleAlert className="w-4 h-4 shrink-0" />
                  <span>{feedFormError}</span>
                </div>
              )}

              {/* Select Feed Item */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">العلف المقصود توزيعه الآن *</label>
                <select
                  required
                  value={selectedFeedId}
                  onChange={(e) => {
                    setSelectedFeedId(Number(e.target.value));
                    setFeedFormError('');
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 focus:border-amber-600 focus:bg-white rounded-2xl text-xs sm:text-sm font-extrabold text-slate-800"
                >
                  <option value="">-- اختر من مخزون الغلال المتوفر --</option>
                  {feedStock.map(f => (
                    <option key={f.id} value={f.id}>{f.name} (الرصيد: {f.stock} {f.unit})</option>
                  ))}
                </select>
              </div>

              {/* Eat Quantity */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500">الكمية المصروفة للقطيع (بالكيلو جرام) *</label>
                  {selectedFeedId && (
                    <span className="text-[10px] text-indigo-700 font-bold">
                      الرصيد المتاح: {feedStock.find(f => f.id === Number(selectedFeedId))?.stock || 0} كجم
                    </span>
                  )}
                </div>
                <input 
                  type="number"
                  required
                  min={1}
                  value={eatQuantity}
                  onChange={(e) => {
                    setEatQuantity(Number(e.target.value));
                    setFeedFormError('');
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/90 focus:border-amber-600 focus:bg-white rounded-2xl text-sm font-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {/* Feed Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">تاريخ توزيع الحصة</label>
                  <input 
                    type="date"
                    required
                    value={feedDate}
                    onChange={(e) => setFeedDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/90 focus:bg-white rounded-2xl text-xs font-bold"
                  />
                </div>

                {/* Room Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">مكان الحظر / الحظيرة</label>
                  <select
                    value={paddockRoom}
                    onChange={(e) => setPaddockRoom(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/90 focus:bg-white rounded-2xl text-xs font-bold text-slate-700"
                  >
                    <option value="عنبر 1">عنبر 1</option>
                    <option value="عنبر 2">عنبر 2</option>
                    <option value="عنبر 3">عنبر 3</option>
                    <option value="محجر العزل">محجر العزل</option>
                    <option value="حظيرة التلقيح">حظيرة التلقيح</option>
                    <option value="حوش الفطام">حوش الفطام</option>
                  </select>
                </div>
              </div>

              {/* Recorded By */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">المشرف المنفذ لخدمة التغذية</label>
                <input 
                  type="text"
                  required
                  value={feedRecordedBy}
                  onChange={(e) => setFeedRecordedBy(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/90 focus:bg-white rounded-2xl text-xs font-extrabold text-slate-750"
                  placeholder="اسم المشرف القائم بالتغذية"
                />
              </div>

            </div>

            <div className="p-6 bg-slate-50/70 border-t border-slate-100 flex justify-end gap-2 text-xs font-semibold">
              <button 
                type="button" 
                onClick={() => setIsEatingModalOpen(false)}
                className="px-4 py-2.5 text-slate-500 hover:bg-slate-200 font-extrabold rounded-2xl cursor-pointer duration-100 border-none bg-transparent"
              >
                تراجع
              </button>
              <button 
                type="submit"
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold rounded-2xl cursor-pointer duration-100 shadow-md shadow-amber-600/10 border-none"
              >
                تأكيد الصرف وتوزيع الوجبة
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Purchase feed supply modal dialog (Integrates with core Accounting!) */}
      {isFeedModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSavePurchase} className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in duration-200 border border-slate-100">
            <div className="p-6 bg-emerald-800 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black bg-white/10 px-2 py-0.5 rounded-md">القيد المزدوج التلقائي</span>
                <h3 className="text-xl font-bold mt-1">شراء وتوريد مستلزمات أعلاف</h3>
                <p className="text-xs text-emerald-100 mt-1.5">تأمين حظيرة المخزون الغذائي وتوريد المشتريات للحسابات المحاسبية.</p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsFeedModalOpen(false)} 
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 duration-100 cursor-pointer border-none text-white"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto pr-2">
              
              {purchaseFormError && (
                <div className="p-3 bg-red-50 text-red-800 border border-red-150 rounded-2xl text-xs font-bold flex items-center gap-1.5 animate-pulse">
                  <CircleAlert className="w-4 h-4 shrink-0" />
                  <span>{purchaseFormError}</span>
                </div>
              )}

              {/* Feed Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">اسم صنف العلف / القمح والحبوب المراد شراؤها *</label>
                <input 
                  type="text"
                  required
                  placeholder="مثال: ذرة صفراء مجروشة، سيلاج، مركزات تسمين..."
                  value={newFeedName}
                  onChange={(e) => {
                    setNewFeedName(e.target.value);
                    setPurchaseFormError('');
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-2xl text-xs sm:text-sm font-extrabold text-slate-850"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                
                {/* Quantity */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">كمية التوريد (بالكيلو جرام) *</label>
                  <input 
                    type="number"
                    required
                    min={1}
                    value={purchaseQuantity}
                    onChange={(e) => {
                      setPurchaseQuantity(Number(e.target.value));
                      setPurchaseFormError('');
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/90 focus:bg-white rounded-2xl text-sm font-black text-slate-900"
                  />
                </div>

                {/* Cost */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">التكلفة والمدفوع الإجمالي (ج.م) *</label>
                  <input 
                    type="number"
                    required
                    min={0}
                    value={purchaseCost}
                    onChange={(e) => {
                      setPurchaseCost(Number(e.target.value));
                      setPurchaseFormError('');
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/90 focus:bg-white rounded-2xl text-sm font-black text-emerald-800"
                  />
                </div>

              </div>

              {/* Feed double journaling simulator details */}
              {purchaseCost > 0 && (
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-4">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={postPurchaseToLedger} 
                      onChange={(e) => setPostPurchaseToLedger(e.target.checked)}
                      className="w-4.5 h-4.5 rounded text-indigo-600 focus:ring-indigo-400 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-extrabold text-indigo-950 block">ترحيل كـ "قيد مزدوج" في الدفاتر المحاسبية فوراً</span>
                      <span className="text-[10px] text-indigo-600 font-semibold block mt-0.5">يقوم بإنشاء قيد مالي مدين ودائن تلقائي متوازن بالدفتر العام.</span>
                    </div>
                  </label>

                  {postPurchaseToLedger && (
                    <div className="space-y-3 pt-1">
                      
                      {/* Debit and Credit select */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="font-extrabold text-[10px] text-indigo-900 block">1. حساب المصروف المدين (+Dr) *</label>
                          <select
                            required
                            value={selectedDebitAccountId}
                            onChange={(e) => {
                              setSelectedDebitAccountId(Number(e.target.value));
                              setPurchaseFormError('');
                            }}
                            className="w-full px-2.5 py-2 bg-white border border-slate-250 rounded-xl text-slate-700 text-xs font-extrabold"
                          >
                            <option value="">-- اختر حساب الأعلاف --</option>
                            {accountsPreset.expenseAccs.map(a => (
                              <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-extrabold text-[10px] text-indigo-900 block">2. حساب الخزينة الدائن (-Cr) *</label>
                          <select
                            required
                            value={selectedCreditAccountId}
                            onChange={(e) => {
                              setSelectedCreditAccountId(Number(e.target.value));
                              setPurchaseFormError('');
                            }}
                            className="w-full px-2.5 py-2 bg-white border border-slate-250 rounded-xl text-slate-700 text-xs font-extrabold"
                          >
                            <option value="">-- اختر الحافظة/الخزينة --</option>
                            {accountsPreset.assetAccs.map(a => (
                              <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Visual Ledger Entry Simulation */}
                      {selectedDebitAccountId && selectedCreditAccountId && (
                        <div className="bg-white/95 rounded-xl border border-indigo-100 p-3 space-y-2 text-[10px] font-mono shadow-3xs">
                          <span className="font-bold text-slate-400 block pb-1 border-b border-rose-50/50">محاكاة القيد المحاسبي التلقائي:</span>
                          <div className="flex justify-between font-bold text-amber-900">
                            <span>جـ.م {purchaseCost.toLocaleString('ar-EG')} Dr - حساب المصروف</span>
                            <span>[{accounts.find(a => a.id === selectedDebitAccountId)?.name || 'المدين'}]</span>
                          </div>
                          <div className="flex justify-between font-bold text-slate-500 pr-4">
                            <span>جـ.م {purchaseCost.toLocaleString('ar-EG')} Cr - حساب النقدية</span>
                            <span>[{accounts.find(a => a.id === selectedCreditAccountId)?.name || 'الدائن'}]</span>
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              )}

            </div>

            <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-2.5 text-xs font-bold">
              <button 
                type="button" 
                onClick={() => setIsFeedModalOpen(false)}
                className="px-4 py-2.5 text-slate-505 hover:bg-slate-250 rounded-2xl cursor-pointer duration-100 border-none bg-transparent font-extrabold"
              >
                تحديث وتراجع
              </button>
              <button 
                type="submit"
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-2xl cursor-pointer duration-100 flex items-center gap-1.5 shadow-lg shadow-emerald-700/10 border-none"
              >
                <Save className="w-4 h-4 text-white" /> حفظ وإيداع المخالفة
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
