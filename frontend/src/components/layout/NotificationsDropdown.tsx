import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { 
  Bell, AlertTriangle, ChefHat, Info 
} from 'lucide-react';
import { notificationService } from '../../utils/notifications';

interface NotificationsDropdownProps {
  lang: string;
  dir: string;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ lang, dir }) => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('read_notification_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const markComputedAsRead = (id: string) => {
    try {
      const newRead = [...readNotifIds, id];
      setReadNotifIds(newRead);
      localStorage.setItem('read_notification_ids', JSON.stringify(newRead));
    } catch (e) {
      console.error(e);
    }
  };

  const allProducts = useLiveQuery(async () => {
    try {
      if (!db.products) return [];
      return await db.products.toArray();
    } catch (e) {
      console.warn("allProducts query failed:", e);
      return [];
    }
  }, []) || [];

  const lowStockProducts = useMemo(() => {
    return allProducts.filter(p => p.stock <= (p.alertThreshold || 5));
  }, [allProducts]);

  const expiringContracts = useLiveQuery(async () => {
    try {
      if (!db.users) return [];
      const users = await db.users.toArray();
      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setDate(today.getDate() + 30);
      return users.filter(u => u.contractEndDate && new Date(u.contractEndDate) > today && new Date(u.contractEndDate) < nextMonth);
    } catch (e) {
      console.warn("expiringContracts query failed:", e);
      return [];
    }
  }, []) || [];

  const readyOrders = useLiveQuery(async () => {
    try {
      if (!db.orders) return [];
      return await db.orders.filter(o => o.fulfillmentStatus === 'ready').toArray();
    } catch (e) {
      console.warn("readyOrders query failed:", e);
      return [];
    }
  }, []) || [];

  const dbNotifs = useLiveQuery(async () => {
    try {
      if (!db.notifications) return [];
      return await db.notifications.orderBy('date').reverse().limit(20).toArray();
    } catch (e) {
      console.warn("Failed to query notifications sorted, trying dynamic fallback:", e);
      try {
        const all = await db.notifications.toArray();
        return all.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20);
      } catch (err) {
        return [];
      }
    }
  }, []) || [];

  const notifications = useMemo(() => {
    const list: any[] = [];
    lowStockProducts.forEach(p => {
      const id = `stock-${p.id}`;
      list.push({ id, type: 'stock', title: 'تنبيه مخزون', message: `المنتج "${p.name}" وصل للحد الأدنى (${p.stock})`, time: 'الآن', priority: 'high', isRead: readNotifIds.includes(id) });
    });
    expiringContracts.forEach(u => {
      const id = `contract-${u.id}`;
      list.push({ id, type: 'contract', title: 'انتهاء عقد', message: `عقد الموظف "${u.name}" ينتهي قريباً`, time: u.contractEndDate ? new Date(u.contractEndDate).toLocaleDateString() : '', priority: 'medium', isRead: readNotifIds.includes(id) });
    });
    readyOrders.forEach(o => {
      const id = `ready-${o.id}`;
      list.push({ id, type: 'kitchen', title: 'طلب جاهز للتسليم', message: `الطلب رقم #${o.id} جاهز للاستلام أو التقديم للعميل`, time: 'الآن', priority: 'high', isRead: readNotifIds.includes(id) });
    });
    dbNotifs.forEach(n => {
      list.push({ id: n.id, dbId: n.id, type: n.type, title: n.title, message: n.message, time: new Date(n.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), priority: n.type === 'error' ? 'high' : 'medium', isRead: n.isRead });
    });
    return list.sort((a, b) => (a.isRead === b.isRead ? 0 : a.isRead ? 1 : -1));
  }, [lowStockProducts, expiringContracts, readyOrders, dbNotifs, readNotifIds]);

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
    const unreadComputedIds = notifications.filter(n => !n.dbId && !n.isRead).map(n => n.id);
    if (unreadComputedIds.length > 0) {
      const newRead = [...readNotifIds, ...unreadComputedIds];
      setReadNotifIds(newRead);
      try {
        localStorage.setItem('read_notification_ids', JSON.stringify(newRead));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleNotifClick = (n: any) => {
    if (n.dbId && !n.isRead) {
      notificationService.markAsRead(n.dbId);
    } else if (!n.dbId && !n.isRead) {
      markComputedAsRead(n.id);
    }
  };

  return (
    <div className="relative" ref={notificationsRef} onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
      <button 
        onClick={() => setShowNotifications(!showNotifications)}
        className={`w-10 h-10 rounded-full shadow-sm border flex items-center justify-center transition-all relative group ${
          showNotifications 
            ? 'bg-brand-50 border-brand-200 text-brand-600' 
            : 'bg-white border-slate-200 text-slate-500 hover:text-brand-600 hover:border-brand-200 hover:shadow-md'
        }`}
      >
        <Bell className={`w-5 h-5 ${showNotifications ? '' : 'group-hover:rotate-12 transition-transform'}`} />
        {notifications.filter(n => !n.isRead).length > 0 && (
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className={`absolute top-14 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden ${dir === 'rtl' ? 'left-0' : 'right-0'}`}>
          <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50" dir="rtl">
            <h3 className="font-bold text-gray-800">التنبيهات</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${
              notifications.filter(n => !n.isRead).length > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-500'
            }`}>
              {notifications.filter(n => !n.isRead).length} جديد
            </span>
          </div>
          
          <div className="max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200" dir="rtl">
            {notifications.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center text-slate-400">
                <Bell className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm font-medium">لا توجد تنبيهات جديدة</p>
              </div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => handleNotifClick(n)} 
                  className={`p-4 border-b border-gray-50 hover:bg-slate-50/80 transition-colors flex items-start gap-3 last:border-0 cursor-pointer text-right ${
                    n.isRead ? 'opacity-50' : ''
                  }`}
                >
                  <div className={`p-2.5 rounded-full shrink-0 ${
                    n.priority === 'high' 
                      ? 'bg-red-50 text-red-500' 
                      : n.type === 'kitchen' 
                        ? 'bg-emerald-50 text-emerald-500' 
                        : n.type === 'info' 
                          ? 'bg-blue-50 text-blue-500' 
                          : 'bg-orange-50 text-orange-500'
                  }`}>
                    {n.type === 'stock' || n.priority === 'high' 
                      ? <AlertTriangle size={16} /> 
                      : n.type === 'kitchen' 
                        ? <ChefHat size={16} /> 
                        : n.type === 'info' 
                          ? <Info size={16} /> 
                          : <Bell size={16} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5 gap-2">
                      <p className={`text-sm font-bold truncate ${n.isRead ? 'text-slate-500' : 'text-slate-800'}`}>{n.title}</p>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">{n.time}</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-2 bg-gray-50 border-t border-gray-100 flex justify-between px-4" dir="rtl">
              <button 
                onClick={handleMarkAllAsRead} 
                className="text-xs font-bold text-slate-600 hover:text-brand-700 py-1"
              >
                تحديد الكل كمقروء
              </button>
              <button 
                onClick={() => {
                  setShowNotifications(false);
                  navigate('/notifications');
                }} 
                className="text-xs font-black text-brand-600 hover:text-brand-700 py-1"
              >
                مركز الإشعارات
              </button>
              <button 
                onClick={() => setShowNotifications(false)} 
                className="text-xs font-bold text-slate-500 hover:text-slate-700 py-1"
              >
                إغلاق
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
