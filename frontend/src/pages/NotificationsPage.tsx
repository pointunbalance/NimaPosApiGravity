import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { notificationService } from '../utils/notifications';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Search, 
  AlertTriangle, 
  Info, 
  XSquare, 
  X,
  Filter,
  Sparkles,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export function NotificationsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'issues' | 'info'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Real-time reactive query of dexie notifications
  const notifications = useLiveQuery(async () => {
    const list = await db.notifications.toArray();
    // Sort reverse chronological by date
    return list.sort((a, b) => {
      const db = new Date(b.date).getTime() - new Date(a.date).getTime();
      return db;
    });
  }) || [];

  // Filtering logic
  const filteredNotifications = notifications.filter(n => {
    // Tab filter
    if (activeTab === 'unread' && n.isRead) return false;
    if (activeTab === 'issues' && n.type !== 'warning' && n.type !== 'error') return false;
    if (activeTab === 'info' && n.type !== 'info' && n.type !== 'success') return false;

    // Search query filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const titleMatch = n.title?.toLowerCase().includes(q);
      const msgMatch = n.message?.toLowerCase().includes(q);
      return titleMatch || msgMatch;
    }

    return true;
  });

  // Action: Mark single notification as read
  const handleMarkAsRead = async (id: number) => {
    if (!id) return;
    await notificationService.markAsRead(id);
  };

  // Action: Delete single notification
  const handleDelete = async (id: number) => {
    if (!id) return;
    try {
      await db.notifications.delete(id);
    } catch (e) {
      console.error("Failed to delete notification:", e);
    }
  };

  // Action: Mark all as read
  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
  };

  // Action: Clear entire notifications archive
  const handleClearAll = async () => {
    try {
      await db.notifications.clear();
    } catch (e) {
      console.error("Failed to clear notifications:", e);
    }
  };

  // Action: Trigger a new test notification elegantly
  const handleAddTestNotification = async (type: 'success' | 'warning' | 'error' | 'info') => {
    const romanNames = ['روما هيرشينكو', 'أولغا ميلنيك', 'أندري بيكار', 'ياروسلاف بوبوف'];
    const randomUser = romanNames[Math.floor(Math.random() * romanNames.length)];
    
    switch (type) {
      case 'success':
        await notificationService.addNotification(
          'نجاح العملية المحاسبية',
          `تم تحديث الحساب المالي للموظف ${randomUser} بنجاح وإصدار كشف الراتب الجديد.`,
          'success'
        );
        break;
      case 'warning':
        await notificationService.addNotification(
          'نقص مخزون: شاشة ايفون 13 أصلي',
          'الكمية المتبقية 0 فقط في المخزن. يرجى مراجعة طلبات التوريد.',
          'warning'
        );
        break;
      case 'error':
        await notificationService.addNotification(
          'خطأ في النظام المالي',
          `محاولة إدخال مصروف غير متوازن بقيمة 1,200 ₴ تم إلغاؤها بواسطة النظام لحماية الدفاتر الجارية.`,
          'error'
        );
        break;
      case 'info':
        await notificationService.addNotification(
          'تسجيل الحضور اليومي',
          `قام الفني ${randomUser} بتسجيل حضور الدوام بنجاح في ورشة الصيانة والسيارات.`,
          'info'
        );
        break;
    }
  };

  // Translate types for nicer Arabic labeling
  const getBadgeMeta = (type: string) => {
    switch (type) {
      case 'success': 
        return { label: 'نجاح', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200/50', icon: <Check className="w-3.5 h-3.5" /> };
      case 'error': 
        return { label: 'خطأ', cls: 'bg-rose-50 text-rose-700 border-rose-200/50', icon: <XSquare className="w-3.5 h-3.5" /> };
      case 'warning': 
        return { label: 'تنبيه', cls: 'bg-amber-50 text-amber-700 border-amber-200/50', icon: <AlertTriangle className="w-3.5 h-3.5" /> };
      default: 
        return { label: 'معلومة', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200/50', icon: <Info className="w-3.5 h-3.5" /> };
    }
  };

  return (
    <div id="notifications-page-container" className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto text-right" dir="rtl">
      
      {/* Header and Back navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-500 hover:text-slate-850 cursor-pointer transition-colors text-sm font-bold mb-1" onClick={() => navigate(-1)}>
            <ArrowRight className="w-4 h-4 ml-1" />
            الرجوع للخلف
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-500/10 text-brand-600 rounded-xl">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">مركز التنبيهات والإشعارات</h1>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">أرشيف شامل لجميع ومضات الإشعار، تنبيهات المخزون، والعمليات الإدارية الفورية</p>
            </div>
          </div>
        </div>

        {/* Top bar quick actions */}
        <div className="flex flex-wrap gap-2.5 items-center">
          {notifications.some(n => !n.isRead) && (
            <button 
              id="mark-all-read-btn"
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-black rounded-xl border border-slate-200/60 shadow-sm transition-all"
            >
              <CheckCheck className="w-4 h-4 text-slate-700" />
              تعيين المقروء للكل
            </button>
          )}
          {notifications.length > 0 && (
            <button 
              id="clear-all-notif-btn"
              onClick={handleClearAll}
              className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black rounded-xl border border-rose-200/50 shadow-sm transition-all"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              حذف الأرشيف كاملاً
            </button>
          )}
        </div>
      </div>

      {/* Grid: Main Panel + Quick Simulation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left column / Sidebar Simulator Controls */}
        <div className="space-y-4 lg:col-span-1">
          <div className="p-4 bg-slate-50/80 border border-slate-200/60 rounded-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-black text-slate-800">توليد ومحاكاة إشعارات</h3>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-bold">
              اضغط على أحد الأزرار لتجربة ظهور الإشعارات بومضات تصميمها الأنيق الجديد والتأكد من انسيابية التحديث الفوري:
            </p>
            
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 pt-1">
              <button 
                onClick={() => handleAddTestNotification('success')}
                className="flex items-center gap-1.5 justify-center px-3 py-2 bg-emerald-500 text-white text-xs font-black rounded-xl hover:bg-emerald-600 transition-all shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                إشعار نجاح
              </button>
              <button 
                onClick={() => handleAddTestNotification('warning')}
                className="flex items-center gap-1.5 justify-center px-3 py-2 bg-amber-500 text-white text-xs font-black rounded-xl hover:bg-amber-600 transition-all shadow-sm"
              >
                <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                إشعار نقص مخزن
              </button>
              <button 
                onClick={() => handleAddTestNotification('error')}
                className="flex items-center gap-1.5 justify-center px-3 py-2 bg-rose-500 text-white text-xs font-black rounded-xl hover:bg-rose-600 transition-all shadow-sm"
              >
                <X className="w-3.5 h-3.5" />
                إشعار خطأ مالي
              </button>
              <button 
                onClick={() => handleAddTestNotification('info')}
                className="flex items-center gap-1.5 justify-center px-3 py-2 bg-indigo-500 text-white text-xs font-black rounded-xl hover:bg-indigo-600 transition-all shadow-sm"
              >
                <Info className="w-3.5 h-3.5" />
                إشعار حضور عام
              </button>
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-500 leading-relaxed space-y-2">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              قواعد الخصوصية والمزامنة
            </div>
            <p>• جميع الإشعارات الماثلة تسجل وتحفظ على ذاكرة المتصفح عبر نظام قواعد البيانات المحلي الآمن.</p>
            <p>• يتكامل النظام المالي وتنبيهات المخازن تلقائياً لإصدار تحديث متناسق ومريح للشركات في الوقت الفعلي.</p>
          </div>
        </div>

        {/* Right column / Main Notifications List Section */}
        <div className="space-y-4 lg:col-span-3">
          
          {/* Filtering Tools Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 border border-slate-200/80 rounded-2xl shadow-sm">
            
            {/* Search input tab */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="ابحث بالعنوان أو محتوى الإشعار..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-1.5 text-xs bg-slate-50 border border-slate-200/70 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-semibold placeholder:text-slate-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filter buttons */}
            <div className="flex flex-wrap gap-1.5 w-full sm:w-auto justify-end">
              <button 
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all ${activeTab === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                الكل ({notifications.length})
              </button>
              <button 
                onClick={() => setActiveTab('unread')}
                className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all ${activeTab === 'unread' ? 'bg-slate-800 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                غير مقروء ({notifications.filter(n => !n.isRead).length})
              </button>
              <button 
                onClick={() => setActiveTab('issues')}
                className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all ${activeTab === 'issues' ? 'bg-slate-800 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                التحذيرات والأخطاء ({notifications.filter(n => n.type === 'warning' || n.type === 'error').length})
              </button>
              <button 
                onClick={() => setActiveTab('info')}
                className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all ${activeTab === 'info' ? 'bg-slate-800 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                إرشادات وأخرى
              </button>
            </div>

          </div>

          {/* Actual items listing */}
          <div className="space-y-3">
            <AnimatePresence initial={false} mode="popLayout">
              {filteredNotifications.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center p-12 bg-white border border-slate-200/80 rounded-2xl text-center space-y-4"
                >
                  <div className="p-4 bg-slate-50 text-slate-400 rounded-full">
                    <Bell className="w-12 h-12 stroke-1" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-slate-700">لا توجد إشعارات مطابقة حالياً</h3>
                    <p className="text-xs text-slate-400 font-semibold max-w-sm">شريط المحفوظات فارغ تماماً أو مصفى بطريقة لا تطابق سجلاتك الحالية.</p>
                  </div>
                </motion.div>
              ) : (
                filteredNotifications.map((notif) => {
                  const meta = getBadgeMeta(notif.type);
                  return (
                    <motion.div
                      key={notif.id}
                      layoutId={`notif-card-${notif.id}`}
                      initial={{ opacity: 0, y: 15, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                      className={`relative flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-all gap-4 ${!notif.isRead ? 'border-r-slate-800 border-r-4' : ''}`}
                    >
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        {/* Dynamic category icon badge with pulses */}
                        <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${meta.cls} border`}>
                          {meta.icon}
                        </div>
                        
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className={`text-sm font-black leading-tight ${!notif.isRead ? 'text-slate-800' : 'text-slate-500'}`}>
                              {notif.title}
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500">
                              {new Date(notif.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {!notif.isRead && (
                              <span className="w-2 h-2 rounded-full bg-slate-800 animate-pulse"></span>
                            )}
                          </div>
                          
                          <p className={`text-xs leading-relaxed font-semibold ${!notif.isRead ? 'text-slate-600' : 'text-slate-400'}`}>
                            {notif.message}
                          </p>

                          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold pt-0.5">
                            <span>التاريخ: {new Date(notif.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            {notif.link && (
                              <button 
                                onClick={() => navigate(notif.link!)}
                                className="text-slate-800 hover:underline flex items-center"
                              >
                                اذهب للصفحة المعنية ←
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Explicit Interactive Control Buttons */}
                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        {!notif.isRead && (
                          <button
                            title="تعيين كمقروء"
                            onClick={() => handleMarkAsRead(notif.id!)}
                            className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-150 rounded-xl transition-all border border-slate-200/40"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          title="حذف"
                          onClick={() => handleDelete(notif.id!)}
                          className="p-2 text-rose-400 hover:text-rose-600 bg-rose-50/45 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-250/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>

    </div>
  );
}

export default NotificationsPage;
