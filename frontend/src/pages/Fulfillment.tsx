
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Order } from '../types';
import { Store, Truck, Package } from 'lucide-react';

import OrderTicket from '../components/fulfillment/OrderTicket';
import FulfillmentToolbar from '../components/fulfillment/FulfillmentToolbar';
import FulfillmentSummary from '../components/fulfillment/FulfillmentSummary';
import PendingOrdersColumn from '../components/fulfillment/PendingOrdersColumn';
import ReadyOrdersColumn from '../components/fulfillment/ReadyOrdersColumn';
import FulfillmentHistoryModal from '../components/fulfillment/FulfillmentHistoryModal';

const Fulfillment: React.FC = () => {
  const [now, setNow] = useState(new Date());
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [lastPendingCount, setLastPendingCount] = useState(0);
  const [filterType, setFilterType] = useState<'all' | 'dine-in' | 'takeaway' | 'delivery'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New States for Features
  const [showSummary, setShowSummary] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('kds_checked_items');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem('kds_checked_items', JSON.stringify(Array.from(checkedItems)));
  }, [checkedItems]);

  const printRef = useRef<HTMLDivElement>(null);

  // Timer Update every 10s
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Query Active Orders
  const activeOrders = useLiveQuery(async () => {
    const orders = await db.orders.toArray();
    return orders
      .filter(o => o.fulfillmentStatus === 'pending' || o.fulfillmentStatus === 'ready')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, []);

  // Query History
  const servedOrdersHistory = useLiveQuery(async () => {
      if (!showHistory) return [];
      const orders = await db.orders.toArray();
      return orders
        .filter(o => o.fulfillmentStatus === 'served')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) 
        .reverse()
        .slice(0, 20);
  }, [showHistory]);

  const filteredOrders = useMemo(() => {
      if (!activeOrders) return { pending: [], ready: [] };
      let filtered = activeOrders;
      if (filterType !== 'all') {
          filtered = activeOrders.filter(o => o.orderType === filterType);
      }
      if (searchQuery) {
          filtered = filtered.filter(o => o.id?.toString().includes(searchQuery));
      }
      return {
          pending: filtered.filter(o => o.fulfillmentStatus === 'pending'),
          ready: filtered.filter(o => o.fulfillmentStatus === 'ready')
      };
  }, [activeOrders, filterType, searchQuery]);

  // --- Summary Logic ---
  const itemSummary = useMemo(() => {
      const summary = new Map<string, number>();
      filteredOrders.pending.forEach(order => {
          order.items.forEach((item, idx) => {
              const key = `${order.id}-${idx}`;
              if (!checkedItems.has(key)) {
                  const current = summary.get(item.name) || 0;
                  summary.set(item.name, current + item.quantity);
              }
          });
      });
      return Array.from(summary.entries()).sort((a, b) => b[1] - a[1]); // Sort by quantity desc
  }, [filteredOrders.pending, checkedItems]);

  // Sound Effect
  useEffect(() => {
      const pendingCount = filteredOrders.pending.length;
      if (!isMuted && pendingCount > lastPendingCount) {
          playNotificationSound();
      }
      setLastPendingCount(pendingCount);
  }, [filteredOrders.pending.length, isMuted]);

  const playNotificationSound = () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } catch (e) {
          console.error("Audio play failed", e);
      }
  };

  const updateStatus = async (orderId: number, status: 'pending' | 'ready' | 'served') => {
    await db.orders.update(orderId, { fulfillmentStatus: status });
  };

  const handlePrint = (order: Order) => {
      setSelectedOrderForPrint(order);
      setTimeout(() => {
          if (printRef.current) {
              const content = printRef.current.innerHTML;
              const printWindow = window.open('', '', 'width=600,height=600');
              if (printWindow) {
                  printWindow.document.write('<html><head><title>Print</title>');
                  printWindow.document.write('<style>body{font-family:monospace; direction:rtl; margin:0;} @media print { body { -webkit-print-color-adjust: exact; } }</style>');
                  printWindow.document.write('</head><body>');
                  printWindow.document.write(content);
                  printWindow.document.write('</body></html>');
                  printWindow.document.close();
                  printWindow.print();
                  printWindow.close();
              }
          }
      }, 100);
  };

  const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
          setIsFullscreen(true);
      } else {
          if (document.exitFullscreen) {
              document.exitFullscreen();
              setIsFullscreen(false);
          }
      }
  };

  const toggleItemCheck = (orderId: number, itemIdx: number) => {
      const key = `${orderId}-${itemIdx}`;
      setCheckedItems(prev => {
          const newSet = new Set(prev);
          if (newSet.has(key)) newSet.delete(key);
          else newSet.add(key);
          return newSet;
      });
  };

  const getElapsedTime = (dateString: Date) => {
      const date = new Date(dateString);
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      return diffMins;
  };

  const getCardStyle = (mins: number) => {
      if (mins > 20) return { border: 'border-l-4 border-l-red-500', bg: 'bg-red-50/50', header: 'bg-red-50 text-red-800' };
      if (mins > 10) return { border: 'border-l-4 border-l-amber-500', bg: 'bg-amber-50/50', header: 'bg-amber-50 text-amber-800' };
      return { border: 'border-l-4 border-l-indigo-500', bg: 'bg-white', header: 'bg-slate-50/50 text-slate-700' };
  };

  const getTypeIcon = (type?: string) => {
      switch(type) {
          case 'dine-in': return <Store className="w-3.5 h-3.5" />;
          case 'delivery': return <Truck className="w-3.5 h-3.5" />;
          default: return <Package className="w-3.5 h-3.5" />;
      }
  };

  return (
    <div className={`h-full overflow-hidden bg-slate-50 flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 p-6' : 'p-6'}`}>
      
      {/* Hidden Print Area */}
      <OrderTicket order={selectedOrderForPrint} printRef={printRef} />

      {/* Header Toolbar */}
      <FulfillmentToolbar 
        showSummary={showSummary}
        setShowSummary={setShowSummary}
        filterType={filterType}
        setFilterType={setFilterType}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setShowHistory={setShowHistory}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
      />

      {/* Main Layout */}
      <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
        
        {/* SUMMARY SIDEBAR (NEW) */}
        {showSummary && (
          <FulfillmentSummary itemSummary={itemSummary} />
        )}

        {/* PENDING COLUMN */}
        <PendingOrdersColumn 
          orders={filteredOrders.pending}
          checkedItems={checkedItems}
          toggleItemCheck={toggleItemCheck}
          handlePrint={handlePrint}
          updateStatus={updateStatus}
          getElapsedTime={getElapsedTime}
          getCardStyle={getCardStyle}
          getTypeIcon={getTypeIcon}
        />

        {/* READY COLUMN */}
        <ReadyOrdersColumn 
          orders={filteredOrders.ready}
          updateStatus={updateStatus}
          getElapsedTime={getElapsedTime}
        />
      </div>

      {/* History Modal */}
      <FulfillmentHistoryModal 
        showHistory={showHistory}
        setShowHistory={setShowHistory}
        servedOrdersHistory={servedOrdersHistory || []}
        updateStatus={updateStatus}
      />

    </div>
  );
};

export default Fulfillment;
