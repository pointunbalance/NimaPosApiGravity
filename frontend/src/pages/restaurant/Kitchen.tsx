import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Order } from '../../types';
import { 
    ChefHat, 
    CheckCircle, 
    Clock, 
    Hash, 
    StickyNote, 
    AlertCircle, 
    Utensils, 
    ArrowRight, 
    Volume2, 
    VolumeX, 
    Search, 
    Sparkles, 
    TrendingUp, 
    History, 
    Undo, 
    Play, 
    Check, 
    Filter, 
    X, 
    CheckSquare, 
    Square 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Play beautiful offline-synthesized pure-sine/triangle chimes to avoid missing orders in busy environments!
const playKDSChime = (type: 'new' | 'ready' | 'success') => {
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        
        if (type === 'new') {
            // Elegant twin bell ring
            const now = ctx.currentTime;
            
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(587.33, now); // D5
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            gain1.gain.setValueAtTime(0.08, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            osc1.start(now);
            osc1.stop(now + 0.25);
            
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(698.46, now + 0.12); // F5
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            gain2.gain.setValueAtTime(0.08, now + 0.12);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc2.start(now + 0.12);
            osc2.stop(now + 0.4);
        } else if (type === 'ready') {
            // Success chord (C5, E5, G5)
            const now = ctx.currentTime;
            [523.25, 659.25, 783.99].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + idx * 0.04);
                osc.connect(gain);
                gain.connect(ctx.destination);
                gain.gain.setValueAtTime(0.06, now + idx * 0.04);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.35);
                osc.start(now + idx * 0.04);
                osc.stop(now + idx * 0.04 + 0.35);
            });
        } else {
            // Subtle selection sound
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.connect(gain);
            gain.connect(ctx.destination);
            gain.gain.setValueAtTime(0.04, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
            osc.start();
            osc.stop(ctx.currentTime + 0.08);
        }
    } catch (e) {
        // Safe fallback if browser security blocks autoplay before user gesture
    }
};

const ElapsedTime = ({ date, isPreparing }: { date: Date, isPreparing?: boolean }) => {
    const [elapsedMinutes, setElapsedMinutes] = useState(0);

    useEffect(() => {
        const update = () => {
            const now = new Date().getTime();
            const orderTime = new Date(date).getTime();
            setElapsedMinutes(Math.floor((now - orderTime) / 60000));
        };
        update();
        const interval = setInterval(update, 60000);
        return () => clearInterval(interval);
    }, [date]);

    if (elapsedMinutes < 1) return <span className="text-emerald-700 font-black bg-emerald-50 px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-emerald-500" /> الآن</span>;
    if (elapsedMinutes < 10) return <span className="text-emerald-700 font-extrabold bg-emerald-50 px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-emerald-500" /> منذ {elapsedMinutes} د</span>;
    if (elapsedMinutes < 15) return <span className="text-amber-700 font-extrabold bg-amber-50 px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> منذ {elapsedMinutes} د</span>;
    
    // Greater than 15 mins => Overdue!
    return (
        <span className="text-rose-700 font-black bg-rose-100/80 px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1 animate-pulse border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> 
            تأخير ({elapsedMinutes} د)
        </span>
    );
};

const OrderCard = ({ 
    order, 
    status, 
    onAction,
    checkedItems,
    onToggleCheck
}: { 
    order: Order, 
    status: 'pending' | 'preparing' | 'ready', 
    onAction: (id: number, action: 'preparing' | 'ready' | 'served') => void,
    checkedItems: Record<string, boolean>,
    onToggleCheck: (orderId: number, idx: number) => void
}) => {
    const isPending = status === 'pending';
    const isPreparing = status === 'preparing';
    const isReady = status === 'ready';
    
    // Order type badge mapping
    const getOrderTypeInfo = (type?: string) => {
        switch(type) {
            case 'dine-in': return { label: 'محلي (صالة)', color: 'bg-indigo-50 text-indigo-700 border-indigo-150', cardBg: 'bg-white' };
            case 'takeaway': return { label: 'تيك أواي (سفري)', color: 'bg-amber-100 text-amber-800 border-amber-300', cardBg: 'bg-amber-50/20 border-amber-200 shadow-amber-200/5' };
            case 'delivery': return { label: 'توصيل', color: 'bg-rose-50 text-rose-700 border-rose-150', cardBg: 'bg-white' };
            default: return { label: 'طلب خارجي', color: 'bg-teal-50 text-teal-700 border-teal-200', cardBg: 'bg-white' };
        }
    };

    const typeInfo = getOrderTypeInfo(order.orderType);

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`flex flex-col rounded-2xl border border-slate-150 shadow-sm ${typeInfo.cardBg} ${isPreparing ? 'ring-2 ring-orange-500 shadow-xl shadow-orange-500/5' : ''} overflow-hidden relative`}
        >
            {/* Top Border Accent */}
            <div className={`h-2 w-full ${order.orderType === 'takeaway' ? 'bg-amber-500' : isPreparing ? 'bg-orange-500 animate-pulse' : isPending ? 'bg-indigo-400' : 'bg-emerald-500'}`} />

            <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-3 relative">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-xl text-slate-800 flex items-center gap-0.5">
                                <Hash className="w-4 h-4 text-slate-400" />
                                {order.id}
                            </h3>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${typeInfo.color}`}>
                                {typeInfo.label}
                            </span>
                            {order.tableNumber && (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                                    <Utensils className="w-3 h-3 text-slate-500" />
                                    طاولة {order.tableNumber}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1.5">
                        {isPending ? (
                            <span className="bg-orange-50 text-orange-705 text-[10px] font-black px-2.5 py-0.5 rounded-lg flex items-center gap-1 border border-orange-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                قيد الانتظار
                            </span>
                        ) : isPreparing ? (
                            <span className="bg-amber-50 text-amber-750 text-[10px] font-black px-2.5 py-0.5 rounded-lg flex items-center gap-1 border border-amber-200 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                جاري التجهيز
                            </span>
                        ) : (
                            <span className="bg-emerald-50 text-emerald-705 text-[10px] font-black px-2.5 py-0.5 rounded-lg flex items-center gap-1 border border-emerald-150">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                جاهز للتقديم
                            </span>
                        )}
                        <ElapsedTime date={order.date} isPreparing={isPreparing} />
                    </div>
                </div>

                {order.note && (
                    <div className="mb-4 bg-amber-50/50 border border-amber-100 p-3 rounded-xl flex items-start gap-2 text-amber-800 text-xs text-right">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                        <p className="font-bold leading-relaxed">{order.note}</p>
                    </div>
                )}

                {/* Items and ingredients checklist */}
                <div className="space-y-2.5 mb-5 flex-1 text-right">
                    <p className="text-[9px] text-slate-400 font-bold pb-1 border-b border-dotted border-slate-100">تحضير الأصناف (اضغط للتشطيب):</p>
                    
                    {order.items.map((item, idx) => {
                        const isItemChecked = checkedItems[`${order.id}-${idx}`] || false;
                        return (
                            <div 
                                key={idx} 
                                onClick={() => onToggleCheck(order.id!, idx)}
                                className={`flex gap-3 text-xs border-b border-slate-50 pb-2.5 last:border-b-0 last:pb-0 cursor-pointer select-none group transition-all p-1.5 rounded-lg ${
                                    isItemChecked ? 'bg-slate-50' : 'hover:bg-slate-100/50'
                                }`}
                            >
                                <div className="shrink-0 pt-0.5">
                                    {isItemChecked ? (
                                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                                    ) : (
                                        <Square className="w-4 h-4 text-slate-350 group-hover:text-amber-500 transition-colors" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className={`font-black text-[13px] text-slate-800 transition-all ${
                                        isItemChecked ? 'line-through text-slate-400 font-medium decoration-emerald-500 decoration-2' : ''
                                    }`}>
                                        <span className="font-mono text-emerald-700 font-extrabold mr-1 bg-emerald-50/80 px-1.5 py-0.5 rounded text-[11px]">x{item.quantity}</span> {item.name}
                                        {item.variantName && <span className="text-[10px] font-bold text-slate-500 mr-1.5 bg-slate-100 px-1.5 py-0.5 rounded">{item.variantName}</span>}
                                        {item.unitName && <span className="text-[10px] font-bold text-slate-500 mr-1.5 bg-slate-100 px-1.5 py-0.5 rounded">{item.unitName}</span>}
                                    </div>
                                    
                                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                        <div className="relative pl-2 mt-1 space-y-0.5 border-r-2 border-slate-200 pr-2 mr-1">
                                            {item.selectedModifiers.map((mod, i) => (
                                                <div key={i} className={`text-[10px] text-slate-500 font-bold ${isItemChecked ? 'line-through text-slate-400' : ''}`}>
                                                    <span className="text-slate-400">-</span> {mod.modifierName}: {mod.optionName}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {item.note && (
                                        <div className="mt-1 flex items-start gap-1 pb-1 text-[10px] text-amber-700 font-extrabold bg-amber-50/50 p-1.5 rounded-lg border border-amber-100/50">
                                            <StickyNote className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                                            <span>{item.note}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Operations Actions */}
                <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                    {isPending && (
                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onAction(order.id!, 'preparing'); }}
                            className="flex-1 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98] bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/10 border-b-2 border-amber-700"
                        >
                            <ChefHat className="w-4 h-4 animate-bounce" />
                            <span>ابدأ التحضير</span>
                        </button>
                    )}
                    {(isPreparing || isPending) && (
                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onAction(order.id!, 'ready'); }}
                            className="flex-1 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98] bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10 border-b-2 border-emerald-800"
                        >
                            <CheckCircle className="w-4 h-4" />
                            <span>جاهز للتسليم</span>
                        </button>
                    )}
                    {isReady && (
                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onAction(order.id!, 'served'); }}
                            className="flex-1 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98] bg-slate-100 hover:bg-slate-200 text-slate-700 border-b-2 border-slate-300"
                        >
                            <span>تسليم للويتر</span>
                            <ArrowRight className="w-4 h-4 text-emerald-650" />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const Kitchen: React.FC = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'dine-in' | 'takeaway' | 'delivery'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [checkedKdsItems, setCheckedKdsItems] = useState<Record<string, boolean>>({});
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Active / Preparing orders
  const activeOrders = useLiveQuery(async () => {
    const orders = await db.orders.toArray();
    
    return orders
      .filter(o => o.fulfillmentStatus === 'pending' || o.fulfillmentStatus === 'preparing' || o.fulfillmentStatus === 'ready')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, []);

  // Performance/Operations today metrics
  const performanceStats = useLiveQuery(async () => {
    const orders = await db.orders.toArray();
    const todayStr = new Date().toDateString();
    
    const completedToday = orders.filter(o => 
        (o.status === 'completed' || o.fulfillmentStatus === 'served') && 
        o.completedAt && 
        new Date(o.completedAt).toDateString() === todayStr
    );
    
    let totalPrepMs = 0;
    let countedPreps = 0;
    
    completedToday.forEach(o => {
        if (o.completedAt && o.date) {
            totalPrepMs += new Date(o.completedAt).getTime() - new Date(o.date).getTime();
            countedPreps++;
        }
    });

    const avgMinutes = countedPreps > 0 ? Math.round(totalPrepMs / countedPreps / 60000) : 0;
    return {
        completedCount: completedToday.length,
        avgPrepMinutes: avgMinutes,
        efficiencyRate: countedPreps > 0 ? Math.min(100, Math.round((countedPreps / (countedPreps + (activeOrders?.length || 0))) * 100)) : 100
    };
  }, [activeOrders]);

  // Last 8 recallable completed orders
  const recentServedOrders = useLiveQuery(async () => {
      const orders = await db.orders.toArray();
      const todayStr = new Date().toDateString();
      return orders
        .filter(o => o.fulfillmentStatus === 'served' && o.completedAt && new Date(o.completedAt).toDateString() === todayStr)
        .sort((a,b) => new Date(b.completedAt || b.date).getTime() - new Date(a.completedAt || a.date).getTime())
        .slice(0, 8);
  }, [activeOrders]);

  // Sound signal engine watches for new incoming orders
  const prevOrderIdsRef = React.useRef<number[]>([]);
  useEffect(() => {
      if (!activeOrders) return;
      const currentIds = activeOrders.map(o => o.id!).filter(Boolean);
      const prevOrderIds = prevOrderIdsRef.current;
      const hasNew = currentIds.some(id => !prevOrderIds.includes(id));
      if (hasNew && prevOrderIds.length > 0 && soundEnabled) {
          playKDSChime('new');
      }
      prevOrderIdsRef.current = currentIds;
  }, [activeOrders, soundEnabled]);

  const updateStatus = async (orderId: number, status: 'preparing' | 'ready' | 'served') => {
    const updateData: Partial<Order> = { fulfillmentStatus: status };
    if (status === 'served') {
        updateData.completedAt = new Date();
    }
    await db.orders.update(orderId, updateData);
    
    if (soundEnabled) {
        if (status === 'ready') playKDSChime('ready');
        else playKDSChime('success');
    }
  };

  const undoOrderServed = async (orderId: number) => {
      await db.orders.update(orderId, { fulfillmentStatus: 'preparing' });
      if (soundEnabled) playKDSChime('ready');
  };

  const toggleItemChecked = (orderId: number, idx: number) => {
      const key = `${orderId}-${idx}`;
      setCheckedKdsItems(prev => ({
          ...prev,
          [key]: !prev[key]
      }));
      if (soundEnabled) playKDSChime('success');
  };

  // Filtering Logic
  const filteredActiveOrders = React.useMemo(() => {
      if (!activeOrders) return [];
      return activeOrders.filter(order => {
          // Filter by Order Type
          if (orderTypeFilter !== 'all' && order.orderType !== orderTypeFilter) return false;
          
          // Filter by Search Query
          if (searchQuery.trim() !== '') {
              const q = searchQuery.toLowerCase().trim();
              const matchesId = order.id?.toString().includes(q) || false;
              const matchesTable = order.tableNumber?.toLowerCase().includes(q) || false;
              const matchesNote = order.note?.toLowerCase().includes(q) || false;
              const matchesItems = order.items.some(it => it.name.toLowerCase().includes(q)) || false;
              return matchesId || matchesTable || matchesNote || matchesItems;
          }
          
          return true;
      });
  }, [activeOrders, orderTypeFilter, searchQuery]);

  const pendingOrders = filteredActiveOrders.filter(o => o.fulfillmentStatus === 'pending' || o.fulfillmentStatus === 'preparing') || [];
  const readyOrders = filteredActiveOrders.filter(o => o.fulfillmentStatus === 'ready') || [];

  // Consolidated items list for all active preparing orders
  const consolidatedItems = React.useMemo(() => {
    const itemsMap = new Map<string, { name: string, quantity: number, variantName?: string }>();
    // Collect from orders actively in draft/preparing (pending status)
    const preparingList = activeOrders?.filter(o => o.fulfillmentStatus === 'pending' || o.fulfillmentStatus === 'preparing') || [];
    
    preparingList.forEach(order => {
        order.items.forEach(item => {
            // Check if this item is marked checked on KDS
            const isChecked = checkedKdsItems[`${order.id}-${order.items.indexOf(item)}`];
            if (isChecked) return; // Skip if already completed by the chef!

            const key = `${item.productId}-${item.variantName || 'default'}`;
            if (itemsMap.has(key)) {
                itemsMap.get(key)!.quantity += item.quantity;
            } else {
                itemsMap.set(key, { name: item.name, quantity: item.quantity, variantName: item.variantName });
            }
        });
    });
    return Array.from(itemsMap.values()).sort((a,b) => b.quantity - a.quantity);
  }, [activeOrders, checkedKdsItems]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto bg-slate-50 text-right" dir="rtl">
      
      {/* 1. Header Bar with System Info and Real-time controls */}
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/10">
                <ChefHat className="w-6 h-6" />
            </div>
            <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    شاشة المطبخ الذكية
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">KDS v2.0</span>
                </h1>
                <p className="text-slate-550 font-bold text-xs mt-0.5">جدولة وجبات الصالة الزخرفية والتوصيل مع ميزة دمج المكونات</p>
            </div>
        </div>
        
        {/* Realtime Settings Controls */}
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-end">
            {/* Tone signal toggle */}
            <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`py-2 px-3.5 rounded-xl text-xs font-black border flex items-center gap-2 transition-all ${
                    soundEnabled 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-150 shadow-sm' 
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
            >
                {soundEnabled ? (
                    <>
                        <Volume2 className="w-4 h-4 text-emerald-600" />
                        <span>الجرس: فعال</span>
                    </>
                ) : (
                    <>
                        <VolumeX className="w-4 h-4 text-slate-400" />
                        <span>الجرس: صامت</span>
                    </>
                )}
            </button>

            {/* Recalls History drawer toggle */}
            <button
                type="button"
                onClick={() => setShowHistoryModal(true)}
                className="py-2 px-3.5 bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-black flex items-center gap-2 transition-colors relative"
            >
                <History className="w-4 h-4 text-indigo-650" />
                <span>الطلبات المسترجعة</span>
                {recentServedOrders && recentServedOrders.length > 0 && (
                    <span className="w-2.5 h-2.5 bg-indigo-600 border border-white rounded-full absolute -top-1 -left-1 animate-pulse" />
                )}
            </button>
        </div>
      </div>

      {/* 2. Operational Statistics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
         <div className="bg-white border border-slate-150 p-4 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="space-y-0.5">
                <p className="text-[10px] text-slate-400 font-extrabold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    الطلبات المنجزة اليوم
                </p>
                <p className="text-xl font-black text-slate-800 font-sans tracking-tight">
                    {performanceStats?.completedCount || 0} <span className="text-[10px] text-slate-500 font-bold">طبلة</span>
                </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
            </div>
         </div>

         <div className="bg-white border border-slate-150 p-4 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="space-y-0.5">
                <p className="text-[10px] text-slate-400 font-extrabold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    متوسط وقت التجهيز الكلي
                </p>
                <p className="text-xl font-black text-slate-800 font-sans tracking-tight">
                    {performanceStats?.avgPrepMinutes || 0} <span className="text-[10px] text-slate-500 font-bold">دقيقة</span>
                </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
            </div>
         </div>

         <div className="bg-white border border-slate-150 p-4 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="space-y-1 w-full">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-extrabold">
                    <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-505" />
                        معدل الإنجاز وسرعة التقديم
                    </span>
                    <span className="font-sans text-indigo-600 font-black">{performanceStats?.efficiencyRate || 100}%</span>
                </div>
                {/* Visual progress bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                        className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${performanceStats?.efficiencyRate || 100}%` }} 
                    />
                </div>
            </div>
         </div>
      </div>

      {/* 3. Filtering Controls and Search */}
      <div className="bg-white border border-slate-150 p-3.5 rounded-2xl mb-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
             <button
                 type="button"
                 onClick={() => setOrderTypeFilter('all')}
                 className={`py-1.5 px-3.5 rounded-xl text-xs font-black transition-all ${
                     orderTypeFilter === 'all'
                     ? 'bg-slate-800 text-white shadow-xs'
                     : 'bg-slate-50 hover:bg-slate-100/80 text-slate-650'
                 }`}
             >
                 الكل ({activeOrders?.length || 0})
             </button>
             <button
                 type="button"
                 onClick={() => setOrderTypeFilter('dine-in')}
                 className={`py-1.5 px-3.5 rounded-xl text-xs font-black transition-all ${
                     orderTypeFilter === 'dine-in'
                     ? 'bg-indigo-600 text-white shadow-xs'
                     : 'bg-slate-50 hover:bg-slate-100/80 text-slate-650'
                 }`}
             >
                 محلي صالة ({activeOrders?.filter(o => o.orderType === 'dine-in').length || 0})
             </button>
             <button
                 type="button"
                 onClick={() => setOrderTypeFilter('takeaway')}
                 className={`py-1.5 px-3.5 rounded-xl text-xs font-black transition-all ${
                     orderTypeFilter === 'takeaway'
                     ? 'bg-amber-600 text-white shadow-xs'
                     : 'bg-slate-50 hover:bg-slate-100/80 text-slate-650'
                 }`}
             >
                 سفري تيك أواي ({activeOrders?.filter(o => o.orderType === 'takeaway').length || 0})
             </button>
             <button
                 type="button"
                 onClick={() => setOrderTypeFilter('delivery')}
                 className={`py-1.5 px-3.5 rounded-xl text-xs font-black transition-all ${
                     orderTypeFilter === 'delivery'
                     ? 'bg-rose-600 text-white shadow-xs'
                     : 'bg-slate-50 hover:bg-slate-100/80 text-slate-650'
                 }`}
             >
                 توصيل ({activeOrders?.filter(o => o.orderType === 'delivery').length || 0})
             </button>
         </div>

         {/* Search Filter input */}
         <div className="relative w-full md:max-w-xs shrink-0">
             <input
                 type="text"
                 placeholder="البحث برقم طلب، طاولة، أو وجبة..."
                 className="w-full bg-slate-50 hover:bg-slate-100/85 border border-slate-200 focus:border-indigo-500 rounded-xl pl-9 pr-4 py-2 pb-2 font-bold text-xs outline-none transition-all focus:ring-1 focus:ring-indigo-500"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
             />
             <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
             {searchQuery && (
                 <button 
                     type="button" 
                     onClick={() => setSearchQuery('')}
                     className="absolute left-8 top-2.5 text-slate-400 hover:text-rose-500"
                 >
                     <X className="w-3.5 h-3.5" />
                 </button>
             )}
         </div>
      </div>

      {/* 4. Three-Column KDS Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start content-start">
        
        {/* COLUMN A: Ingredient & Items Consolidation Dashboard */}
        <div className="flex flex-col bg-slate-100 rounded-3xl p-4 border border-slate-200 max-h-[calc(100vh-270px)] h-fit overflow-hidden">
            <div className="flex items-center justify-between mb-4 px-1 shrink-0 pb-2 border-b border-slate-200">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-indigo-650" />
                    دمج وجرد الأصناف المطلوبة
                </h2>
                <span className="bg-indigo-600 text-white text-xs px-2.5 py-0.5 rounded-full shadow-sm font-sans font-bold">
                    {consolidatedItems.reduce((acc, curr) => acc + curr.quantity, 0)}
                </span>
            </div>
            
            <div className="overflow-y-auto space-y-2.5 pr-1 pb-4 flex-1">
                {consolidatedItems.length > 0 ? (
                    <div className="grid gap-2">
                        {consolidatedItems.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-150 shadow-xs hover:border-slate-300 transition-colors">
                                <div className="text-right">
                                    <div className="font-extrabold text-[13px] text-slate-800 leading-tight">{item.name}</div>
                                    {item.variantName && (
                                        <div className="text-[10px] text-slate-400 font-bold mt-0.5 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 w-fit">{item.variantName}</div>
                                    )}
                                </div>
                                <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-sans font-black px-3.5 py-1.5 rounded-xl text-lg shrink-0">
                                    x{item.quantity}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-slate-400 bg-white/40 rounded-2xl border border-dashed border-slate-200">
                        <Utensils className="w-10 h-10 text-slate-300 mb-2.5" />
                        <p className="font-extrabold text-sm">ولا فنتق طعام متبقي للبدء</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">كافة الأصناف قيد التحضير تم تشطيبها بنجاح!</p>
                    </div>
                )}
            </div>
        </div>

        {/* COLUMN B: Pending & Preparing Orders Column */}
        <div className="flex flex-col bg-slate-100 rounded-3xl p-4 border border-slate-200 max-h-[calc(100vh-270px)] h-fit overflow-hidden">
            <div className="flex items-center justify-between mb-4 px-1 shrink-0 pb-2 border-b border-slate-200">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-500" />
                    قيد التجهيز بالمطبخ
                </h2>
                <span className="bg-orange-500 text-white text-xs px-2.5 py-0.5 rounded-full shadow-sm font-sans font-bold">
                    {pendingOrders.length}
                </span>
            </div>
            
            <div className="overflow-y-auto space-y-4 pr-1 pb-4 flex-1">
                <AnimatePresence mode="popLayout">
                    {pendingOrders.map(order => (
                        <OrderCard 
                            key={order.id} 
                            order={order} 
                            status={order.fulfillmentStatus === 'preparing' ? 'preparing' : 'pending'} 
                            onAction={updateStatus}
                            checkedItems={checkedKdsItems}
                            onToggleCheck={toggleItemChecked}
                        />
                    ))}
                    
                    {pendingOrders.length === 0 && (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-10 bg-white/45 rounded-2xl border border-dashed border-slate-200 text-slate-400"
                        >
                            <div className="bg-white p-4 rounded-full border border-slate-100 shadow-xs mb-3">
                                <ChefHat className="w-10 h-10 text-slate-300" />
                            </div>
                            <p className="font-extrabold text-sm">المطبخ خالٍ من الطلبات</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">بانتظار استلام طلبات جديدة من طواقم الكاشير والويترز...</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>

        {/* COLUMN C: Ready Orders Column */}
        <div className="flex flex-col bg-slate-100 rounded-3xl p-4 border border-slate-200 max-h-[calc(100vh-270px)] h-fit overflow-hidden">
            <div className="flex items-center justify-between mb-4 px-1 shrink-0 pb-2 border-b border-slate-200">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    جاهز للتقديم والتوصيل
                </h2>
                <span className="bg-emerald-600 text-white text-xs px-2.5 py-0.5 rounded-full shadow-sm font-sans font-bold">
                    {readyOrders.length}
                </span>
            </div>
            
            <div className="overflow-y-auto space-y-4 pr-1 pb-4 flex-1">
                <AnimatePresence mode="popLayout">
                    {readyOrders.map(order => (
                        <OrderCard 
                            key={order.id} 
                            order={order} 
                            status="ready" 
                            onAction={updateStatus}
                            checkedItems={checkedKdsItems}
                            onToggleCheck={toggleItemChecked}
                        />
                    ))}
                    
                    {readyOrders.length === 0 && (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-10 bg-white/45 rounded-2xl border border-dashed border-slate-200 text-slate-400"
                        >
                            <div className="bg-white p-4 rounded-full border border-slate-100 shadow-xs mb-3">
                                <CheckCircle className="w-10 h-10 text-slate-300" />
                            </div>
                            <p className="font-extrabold text-sm">لا يوجد وجبات بالنافذة جاهزة</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">اضغط على "جاهز للتقديم" على بطاقات الطلبات لينتقل الويتر لاستلامها</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>

      </div>

      {/* 5. Recently Completed/Served Orders History Sheet (Modal) */}
      <AnimatePresence>
          {showHistoryModal && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200" dir="rtl">
                  <motion.div 
                      initial={{ scale: 0.95, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.95, opacity: 0, y: 20 }}
                      className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] border border-slate-200/50"
                  >
                      {/* Modal Header */}
                      <div className="bg-slate-50 p-5 border-b border-slate-150 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                              <History className="w-5 h-5 text-indigo-600" />
                              <h3 className="text-lg font-black text-slate-800">الطلبات المنجزة والمُسلمة للزبائن (مؤخراً)</h3>
                          </div>
                          <button
                              type="button"
                              onClick={() => setShowHistoryModal(false)}
                              className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-650 flex items-center justify-center transition-colors"
                          >
                              <X className="w-4 h-4" />
                          </button>
                      </div>

                      {/* Modal Body */}
                      <div className="p-6 overflow-y-auto space-y-4 max-h-[500px]">
                          <p className="text-xs text-slate-405 font-bold pb-2 text-right">في حال قررت إعادة أي طلب إلى لوحة العمليات النشطة، اضغط على زر "تراجع واسترجاع" ليعود للخط الإنتاجي فوراً:</p>

                          {recentServedOrders && recentServedOrders.length > 0 ? (
                              <div className="space-y-3">
                                  {recentServedOrders.map(order => (
                                      <div key={order.id} className="bg-white border border-slate-150 hover:border-slate-300 transition-all p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                                          <div className="space-y-1 text-right flex-1">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                  <span className="font-extrabold text-sm text-slate-800 flex items-center gap-0.5">
                                                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                                                      طلب رقم {order.id}
                                                  </span>
                                                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-100">
                                                      مُسلّم ومكتمل
                                                  </span>
                                                  {order.tableNumber && (
                                                      <span className="text-[10px] font-bold bg-indigo-50 text-indigo-750 px-2 py-0.5 rounded-lg border border-indigo-100">
                                                          طاولة {order.tableNumber}
                                                      </span>
                                                  )}
                                              </div>
                                              
                                              {/* Short preview of items */}
                                              <p className="text-xs text-slate-500 font-extrabold truncate max-w-md">
                                                  {order.items.map(it => `x${it.quantity} ${it.name}`).join(' | ')}
                                              </p>

                                              <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                                  <Clock className="w-3.5 h-3.5" />
                                                  <span>تاريخ تقديم الطلب أولاً: {new Date(order.date).toLocaleTimeString('ar-IQ')}</span>
                                                  {order.completedAt && (
                                                      <span className="mr-2 border-r border-slate-200 pr-2">تاريخ التوصيل: {new Date(order.completedAt).toLocaleTimeString('ar-IQ')}</span>
                                                  )}
                                              </div>
                                          </div>

                                          <button
                                              type="button"
                                              onClick={() => undoOrderServed(order.id!)}
                                              className="py-2 px-4 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-black border border-amber-150 flex items-center gap-1.5 transition-colors self-start md:self-auto"
                                          >
                                              <Undo className="w-3.5 h-3.5 text-amber-700" />
                                              <span>تراجع واسترجاع للمطبخ</span>
                                          </button>
                                      </div>
                                  ))}
                              </div>
                          ) : (
                              <div className="text-center py-16 text-slate-400 space-y-2">
                                  <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                                      <History className="w-6 h-6 stroke-[1.5]" />
                                  </div>
                                  <h4 className="font-extrabold text-sm text-slate-700">لا توجد طلبات تم إنجازها اليوم حتى الآن</h4>
                                  <p className="text-[10px] text-slate-450 max-w-xs mx-auto leading-relaxed">
                                      عند تسليم الطلبات الجاهزة لطواقم الويترز ستظهر هنا لتتمكن من مراجعتها أو استرجاعها للمطبخ عند الضرورة.
                                  </p>
                              </div>
                          )}
                      </div>

                      {/* Modal Footer */}
                      <div className="bg-slate-50 p-4 border-t border-slate-150 flex justify-end">
                          <button
                              type="button"
                              onClick={() => setShowHistoryModal(false)}
                              className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-xs rounded-xl transition-colors"
                          >
                              إغلاق اللوحة
                          </button>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

    </div>
  );
};

export default Kitchen;
