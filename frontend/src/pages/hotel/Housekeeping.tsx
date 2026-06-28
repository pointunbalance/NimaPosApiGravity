import React, { useState } from 'react';
import { 
  Plus, Search, Filter, MoreHorizontal, Edit2, Trash2, X, 
  Brush, Home, CheckCircle, RefreshCw, AlertTriangle, Layers,
  CheckCircle2, Clock, Ban, User, AlertCircle, Info, Bookmark, HelpCircle
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import ConfirmModal from '../../components/ui/ConfirmModal';

export const Housekeeping = () => {
  // Search and general filtering state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  // ConfirmModal states (to avoid native confirm/dialogs)
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Toast Feedback State
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'warning' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 6000);
  };

  // Form Data with priority support
  const [formData, setFormData] = useState({
    roomNumber: "",
    task: "تنظيف يومي شامل",
    assignedTo: "",
    status: "قيد التنفيذ",
    priority: "متوسطة",
    notes: ""
  });

  // DB Queries with Safe Live Hooks & Fallbacks
  const records = useLiveQuery(() => db.hotelHousekeepingList.toArray()) || [];
  const rooms = useLiveQuery(() => db.hotelRoomsList.toArray()) || [];
  const staffList = useLiveQuery(() => db.users.filter((u: any) => u.department === 'hotel').toArray()) || [];

  // Filter staff specifically doing housekeeping where possible
  const housekeeperStaff = staffList.length > 0 
    ? staffList.filter((s: any) => s.role === 'خدمة غرف (Housekeeping)' || s.role === 'خدمة غرف' || s.role?.includes('Housekeeping'))
    : [];

  // 1. Calculate Live Aggregations
  const totalTasksCount = records.length;
  const inProgressTasks = records.filter(task => task.status === 'قيد التنفيذ').length;
  const completedTasks = records.filter(task => task.status === 'مكتبة' || task.status === 'مكتملة').length;
  const pausedTasks = records.filter(task => task.status === 'متوقفة').length;

  // Occupancy / Cleanliness Rate
  // Calculate percentage of rooms that are NOT "شاغرة" (which means dirty/vacant in Arabic hotel context)
  const totalRoomsCount = rooms.length;
  const dirtyRoomsCount = rooms.filter(r => r.status === 'شاغرة').length;
  const cleanlinessPercentage = totalRoomsCount > 0 
    ? Math.round(((totalRoomsCount - dirtyRoomsCount) / totalRoomsCount) * 100)
    : 100; // Backup fallback

  // Filter Tasks List
  const filteredRecords = records.filter((item: any) => {
    const matchesSearch = 
      String(item.roomNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      String(item.task || '').toLowerCase().includes(search.toLowerCase()) ||
      String(item.assignedTo || '').toLowerCase().includes(search.toLowerCase()) ||
      String(item.status || '').toLowerCase().includes(search.toLowerCase()) ||
      String(item.priority || '').toLowerCase().includes(search.toLowerCase());

    if (statusFilter === 'الكل') return matchesSearch;
    if (statusFilter === 'قيد التنفيذ') return matchesSearch && item.status === 'قيد التنفيذ';
    if (statusFilter === 'مكتملة') return matchesSearch && (item.status === 'مكتملة' || item.status === 'مكتبة');
    if (statusFilter === 'متوقفة') return matchesSearch && item.status === 'متوقفة';
    return matchesSearch;
  });

  // Trigger modal
  const handleOpenModal = (editMode = false, item: any = null) => {
    setIsEdit(editMode);
    if (editMode && item) {
      setCurrentId(item.id!);
      setFormData({
        roomNumber: item.roomNumber || "",
        task: item.task || "تنظيف يومي شامل",
        assignedTo: item.assignedTo || "",
        status: item.status || "قيد التنفيذ",
        priority: item.priority || "متوسطة",
        notes: item.notes || ""
      });
    } else {
      setCurrentId(null);
      // Auto-select first vacant/dirty room as a helper if available
      const firstDirtyRoom = rooms.find(r => r.status === 'شاغرة');
      setFormData({
        roomNumber: firstDirtyRoom ? firstDirtyRoom.roomNumber : (rooms[0]?.roomNumber || ""),
        task: "تنظيف يومي شامل",
        assignedTo: housekeeperStaff[0]?.name || staffList[0]?.name || "",
        status: "قيد التنفيذ",
        priority: "متوسطة",
        notes: ""
      });
    }
    setIsModalOpen(true);
  };

  // Sync Room Status automatically based on housekeeping updates
  const syncRoomCleanliness = async (roomNum: string, taskStatus: string) => {
    try {
      const room = rooms.find(r => r.roomNumber.trim() === roomNum.trim());
      if (room) {
        if (taskStatus === 'مكتملة' || taskStatus === 'مكتبة') {
          // If the room was "شاغرة" (dirty), move it to "متاحة" (clean and vacant/available)
          if (room.status === 'شاغرة') {
            await db.hotelRoomsList.update(room.id!, { status: 'متاحة' });
            showToast(`تكامل ERP اللحظي: تم تحديث الغرفة رقم ${roomNum} تلقائياً إلى "جاهزة ومتاحة" 🟢`, 'info');
          }
        } else if (taskStatus === 'قيد التنفيذ') {
          // If task starts and room is clean/available, move it to "شاغرة" to track that it is currently being serviced/cleaned
          if (room.status === 'متاحة') {
            await db.hotelRoomsList.update(room.id!, { status: 'شاغرة' });
            showToast(`تكامل ERP اللحظي: تم نقل حالة الغرفة ${roomNum} إلى "شاغرة/تحت الخدمة" 🧹`, 'info');
          }
        }
      }
    } catch (err) {
      console.error("Room synchronization failed", err);
    }
  };

  // Save changes
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.roomNumber.trim()) {
      showToast('يرجى تحديد رقم الغرفة لإسناد المهمة ⚠️', 'warning');
      return;
    }

    try {
      if (isEdit && currentId) {
        await db.hotelHousekeepingList.update(currentId, formData);
        await syncRoomCleanliness(formData.roomNumber, formData.status);
        showToast(`تم تعديل بنود مهمة الإشراف للغرفة رقم (${formData.roomNumber}) بنجاح ✅`, 'success');
      } else {
        await db.hotelHousekeepingList.add(formData);
        await syncRoomCleanliness(formData.roomNumber, formData.status);
        showToast(`تم تسجيل وإسناد مهمة تنظيف جديدة للغرفة رقم ${formData.roomNumber} لعاملي ليفل 1 ✅`, 'success');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast('أخفق النظام في حفظ السجل نتيجة خطأ فني ❌', 'warning');
    }
  };

  // Inline Quick Status toggler from the row
  const handleToggleStatusInline = async (id: number, item: any, newStatus: string) => {
    try {
      await db.hotelHousekeepingList.update(id, { status: newStatus });
      await syncRoomCleanliness(item.roomNumber, newStatus);
      showToast(`تم تبديل حالة المهمة للغرفة ${item.roomNumber} إلى "${newStatus}" بنجاح 🔄`, 'success');
    } catch (err) {
      console.error(err);
      showToast('فشل التحديث اللحظي لخانة الحالة', 'warning');
    }
  };

  // Trigger delete with custom dialog
  const handleDeleteTrigger = (id: number) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      try {
        const item = records.find(r => r.id === deleteId);
        await db.hotelHousekeepingList.delete(deleteId);
        showToast(`تم شطب قيد النظافة للغرفة ${item ? 'رقم ' + item.roomNumber : ''} نهائياً 🗑️`, 'success');
      } catch (err) {
        console.error(err);
        showToast('فشلت محاولة حذف السجل فوت', 'warning');
      }
      setDeleteId(null);
    }
  };

  // Seed standard setup tasks if empty
  const seedHousekeepingDummy = async () => {
    try {
      // Create interesting tasks mapped to existing rooms
      const cleanList = [
        { roomNumber: "101", task: "تنظيف للنزيل وسحب الغبار غامق", assignedTo: "صابرين عبد ربه", status: "قيد التنفيذ", priority: "عالية", notes: "النزيل بالفارس يغادر ظهراً" },
        { roomNumber: "102", task: "تعقيم الغرفة وتكثيف المعطر", assignedTo: "جمال مصطفى", status: "مكتملة", priority: "متوسطة", notes: "تم تجهيز الغرفة كاملة" },
        { roomNumber: "202", task: "تغيير الشراشف تامة النعومة", assignedTo: "نهى الجباس", status: "قيد التنفيذ", priority: "عالية جداً", notes: "نزيل VIP قادم اليوم" },
        { roomNumber: "201", task: "فرش مستلزمات الضيافة والشامبوهات", assignedTo: "جمال مصطفى", status: "متوقفة", priority: "منخفضة", notes: "تجهيز خامات كاريزما" },
        { roomNumber: "302", task: "إعادة ترتيب المفروشات وغسيل الستائر", assignedTo: "صابرين عبد ربه", status: "مكتملة", priority: "متوسطة", notes: "تم التسليم بنجاح" }
      ];

      await db.hotelHousekeepingList.bulkAdd(cleanList);
      showToast("تم توليد بيانات محاكاة وجدولة لخدمات النظافة والغرف فوت بنجاح 🎉", "success");
    } catch(err) {
      console.error(err);
      showToast("خطأ أثناء تغذية البيانات", "warning");
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen text-right font-sans" dir="rtl">
      
      {/* GLOBAL NOTIFICATION TOAST BAR */}
      {notification && (
        <div className={`fixed top-4 left-4 z-50 flex items-center gap-2.5 px-5 py-4 rounded-2xl shadow-xl border animate-in slide-in-from-top duration-300 text-xs font-black transition-all ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-500/20' 
            : notification.type === 'info'
            ? 'bg-indigo-50 text-indigo-900 border-indigo-200/50'
            : 'bg-amber-50 text-amber-900 border-amber-300'
        }`}>
          <div className={`w-2.5 h-2.5 rounded-full ${
            notification.type === 'success' ? 'bg-emerald-600 animate-pulse' : 
            notification.type === 'info' ? 'bg-indigo-600 animate-pulse' : 'bg-amber-600'
          }`} />
          <span>{notification.message}</span>
        </div>
      )}

      {/* PAGE HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <Brush className="w-8 h-8 text-indigo-600 animate-bounce" />
            <span>إدارة خدمات الغرف والتدبير المنزلي</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            جدولة خدمات النظافة والتعقيم، إسناد العاملين، ومراقبة الـ Cleanliness Index تزامناً مع تبديل حالات الغرف ببنك الغرف المركزي.
          </p>
        </div>
        
        {/* Actions Button */}
        <div className="flex items-center gap-2">
          {totalTasksCount === 0 && (
            <button
              onClick={seedHousekeepingDummy}
              className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2.5 rounded-xl hover:bg-indigo-100 transition-all font-black text-xs cursor-pointer"
              title="ملء سجلات خدمة الغرف لمعاينة اللوحة"
            >
              تغذية بيانات للتجربة
            </button>
          )}

          <button 
            onClick={() => handleOpenModal(false)}
            className="bg-indigo-600 text-white px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-all font-black text-xs active:scale-95 shadow-md shadow-indigo-600/10 cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>إسناد مهمة تنظيف طارئة</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD STATS WIDGETS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="bg-white rounded-2xl p-4 border border-slate-200/50 shadow-sm relative overflow-hidden">
          <span className="text-[10px] text-slate-400 font-extrabold block">إجمالي مهام الإشراف</span>
          <span className="text-xl font-black text-slate-800 mt-1 block">{totalTasksCount} مهام</span>
          <div className="text-[9px] text-slate-500 mt-2 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>الطلبات الواردة من الاستقبال</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 h-1 w-full bg-amber-500" />
          <span className="text-[10px] text-slate-400 font-extrabold block text-amber-600">طلب قيد التنفيذ والعمل</span>
          <span className="text-xl font-black text-amber-800 mt-1 block">{inProgressTasks} غرف</span>
          <div className="text-[9px] text-amber-600 mt-2 flex items-center gap-1 font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>تستدعي متابعة عاجلة</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 h-1 w-full bg-emerald-500" />
          <span className="text-[10px] text-slate-400 font-extrabold block text-emerald-600">المهام المكتملة والمقفلة</span>
          <span className="text-xl font-black text-emerald-750 mt-1 block text-emerald-700">{completedTasks} غرف</span>
          <div className="text-[9px] text-emerald-600 mt-2 flex items-center gap-1 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>جاهزة ومتاحة للتسكين</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 h-1 w-full bg-rose-500" />
          <span className="text-[10px] text-slate-400 font-extrabold block text-rose-600">متوقفة / بانتظار خامات</span>
          <span className="text-xl font-black text-rose-800 mt-1 block">{pausedTasks} غرف</span>
          <div className="text-[9px] text-rose-600 mt-2 flex items-center gap-1 font-bold">
            <Ban className="w-3.5 h-3.5" />
            <span>تنتظر مستلزمات نظيفة</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/50 shadow-sm relative overflow-hidden bg-indigo-50/20">
          <div className="absolute top-0 right-0 h-1 w-full bg-indigo-600" />
          <span className="text-[10px] text-indigo-700 font-black block">مؤشر الجاهزية والنظافة (Cleanliness)</span>
          <span className="text-xl font-black text-indigo-800 mt-1 block">{cleanlinessPercentage}%</span>
          <div className="text-[9px] text-indigo-600 mt-2 flex items-center gap-1 font-extrabold">
            <Info className="w-3.5 h-3.5 text-indigo-500" />
            <span>{dirtyRoomsCount} غرف متسخة حالياً متوقفة</span>
          </div>
        </div>

      </div>

      {/* FILTER BUTTONS & QUICK SEARCH MODULE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* FILTER BAR WRAPPER */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-slate-50/60">
          
          {/* SEARCH FIELD */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4.5 h-4.5 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث برقم الغرفة، التكليف، الموظف المسؤول..." 
              className="w-full pr-10 pl-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-slate-400"
            />
          </div>

          {/* STATUS TABS */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl text-slate-600 font-bold self-start md:self-auto">
            {[
              { id: 'الكل', label: 'كافة الخدمات' },
              { id: 'قيد التنفيذ', label: 'قيد التنفيذ 🧹' },
              { id: 'مكتملة', label: 'مكتملة ومسلمة ✨' },
              { id: 'متوقفة', label: 'معلقة / متوقفة ⏳' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  statusFilter === tab.id 
                    ? 'bg-indigo-650 bg-indigo-600 text-white font-black shadow-sm' 
                    : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

        </div>

        {/* HIGH RECEPTIVE TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-600 text-xs font-black">
              <tr>
                <th className="px-5 py-4 w-16">المعرف</th>
                <th className="px-5 py-4">رقم الغرفة</th>
                <th className="px-5 py-4">بيان مهمة التنظيف والتعقيم</th>
                <th className="px-5 py-4">الأولوية</th>
                <th className="px-5 py-4">الموظف المسؤول</th>
                <th className="px-5 py-4">حالة العمل الآن</th>
                <th className="px-5 py-4">ملاحظات طاقم العمل</th>
                <th className="px-5 py-4 text-left w-24">التحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-semibold text-xs">
                    <div className="flex flex-col items-center gap-2.5 justify-center py-6">
                      <Brush className="w-10 h-10 text-slate-300 animate-pulse" />
                      <p>لا توجد مهام إشراف أو نظافة مسجلة تطابق مرشح البحث.</p>
                      {records.length === 0 && (
                        <button 
                          onClick={seedHousekeepingDummy} 
                          className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2 mt-2 rounded-xl text-xs font-bold hover:bg-indigo-100 cursor-pointer"
                        >
                          توليد عينات فندقية فورية للتجربة
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.map((item: any) => {
                // Helpers for priority badges
                let priorityClass = "bg-slate-50 text-slate-600 border-slate-100";
                if (item.priority === 'عالية جداً' || item.priority === 'حرجة') priorityClass = "bg-rose-50 text-rose-705 text-rose-700 border-rose-100 font-extrabold";
                else if (item.priority === 'عالية') priorityClass = "bg-amber-50 text-amber-700 border-amber-100 font-extrabold";
                else if (item.priority === 'متوسطة') priorityClass = "bg-indigo-50 text-indigo-700 border-indigo-100 font-bold";
                else if (item.priority === 'منخفضة') priorityClass = "bg-slate-50 text-slate-500 border-slate-200";

                // Helpers for status styles
                let statusBadgeStyle = "bg-slate-100 text-slate-700 border-slate-200";
                if (item.status === 'قيد التنفيذ') statusBadgeStyle = "bg-amber-50 text-amber-900 border-amber-200 font-black animate-pulse";
                else if (item.status === 'مكتملة' || item.status === 'مكتبة') statusBadgeStyle = "bg-emerald-50 text-emerald-900 border-emerald-250 border-emerald-100 font-black";
                else if (item.status === 'متوقفة') statusBadgeStyle = "bg-rose-50 text-rose-900 border-rose-200 font-bold";

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 font-mono text-slate-400">#{item.id}</td>
                    
                    {/* Room number linked back */}
                    <td className="px-5 py-4 font-black">
                      <div className="flex items-center gap-1.5">
                        <Home className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm">غرفة {item.roomNumber}</span>
                      </div>
                    </td>

                    {/* Task details */}
                    <td className="px-5 py-4">
                      <span className="font-extrabold text-slate-900 text-sm">{item.task}</span>
                    </td>

                    {/* Priority Badge */}
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] border ${priorityClass}`}>
                        {item.priority || 'متوسطة'}
                      </span>
                    </td>

                    {/* Assignee */}
                    <td className="px-5 py-4 font-bold text-slate-600">
                      <div className="flex items-center gap-1 text-xs">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.assignedTo || 'غير محدد'}</span>
                      </div>
                    </td>

                    {/* Direct Toggler Inline dropdown for status change */}
                    <td className="px-5 py-4">
                      <select
                        value={item.status === 'مكتبة' ? 'مكتملة' : (item.status || "قيد التنفيذ")}
                        onChange={(e) => handleToggleStatusInline(item.id!, item, e.target.value)}
                        className={`px-2 py-1.5 border text-[11px] rounded-lg font-black transition-all cursor-pointer ${statusBadgeStyle}`}
                      >
                        <option value="قيد التنفيذ">🧹 قيد التنفيذ</option>
                        <option value="مكتملة">✨ مكتملة / تم التسليم</option>
                        <option value="متوقفة">⌛ متوقفة مؤقتاً</option>
                      </select>
                    </td>

                    {/* Notes */}
                    <td className="px-5 py-4 text-slate-400 font-semibold max-w-xs truncate" title={item.notes}>
                      {item.notes || 'لا يوجد ملحوظات'}
                    </td>

                    {/* Controls */}
                    <td className="px-5 py-4 text-left">
                      <div className="flex justify-end items-center gap-1.5">
                        <button 
                          onClick={() => handleOpenModal(true, item)}
                          className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all cursor-pointer"
                          title="تعديل تفاصيل التكليف"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTrigger(item.id!)}
                          className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all cursor-pointer"
                          title="شطب قيد التكليف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* CREATE & EDIT SERVICES ASSIGNMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Title */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-indigo-600" />
                <span>{isEdit ? `تعديل مهمة الغرفة (${formData.roomNumber})` : 'إسناد مهمة تنظيف وتعقيم جديدة'}</span>
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              
              {/* Linked Room Number */}
              <div>
                <label className="block text-xs font-black text-slate-600 mb-1.5">اختر الغرفة لجدولة الخدمة فوت *</label>
                {rooms.length === 0 ? (
                  <input
                    type="text"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                    required
                    placeholder="مثال: 101"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                ) : (
                  <select
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-extrabold focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  >
                    {rooms.map(r => (
                      <option key={r.id} value={r.roomNumber}>
                        غرفة {r.roomNumber} ({r.type || 'مفردة'}) - الحالة الحالية: {r.status}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Task Title Dropdown / Custom write-in */}
              <div>
                <label className="block text-xs font-black text-slate-600 mb-1.5">بيان وتصنيف الخدمة المطلوبة</label>
                <select
                  value={formData.task}
                  onChange={(e) => setFormData({...formData, task: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer mb-2"
                >
                  <option value="تنظيف يومي شامـل">🧹 تنظيف يومي شامل للغرفة</option>
                  <option value="تطهير وتعقيم دوري">🧼 تعقيم وتطهير الأسطح والحمام</option>
                  <option value="تغيير الشراشف والمناشف">🛏️ سحب الشراشف وتزويد مناشف نظيفة</option>
                  <option value="تجهيز النزلاء الجدد">✨ تجهيز كامل لاستقبال نزيل جديد (Ready)</option>
                  <option value="سحب وتفريغ المهملات والتهوية">💨 تهوية الغرفة وتفريغ سلة المهملات</option>
                  <option value="تزويد مستلزمات الشامبو والقهوة">☕ تجديد مستلزمات الحمام والشاي والقهوة</option>
                </select>
                
                {/* Input write-in if task isn't listed */}
                <input
                  type="text"
                  value={formData.task}
                  onChange={(e) => setFormData({...formData, task: e.target.value})}
                  required
                  placeholder="أو اكتب وصفاً يدوياً مخصصاً للمهمة هنا..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-400 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Housekeeper / Assignee dropdown */}
                <div>
                  <label className="block text-xs font-black text-slate-600 mb-1.5">الموظف المسؤول</label>
                  {housekeeperStaff.length === 0 && staffList.length === 0 ? (
                    <input 
                      type="text" 
                      value={formData.assignedTo}
                      onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                      required
                      placeholder="اسم موظف النظافة"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  ) : (
                    <select
                      value={formData.assignedTo}
                      onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-extrabold focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                    >
                      <option value="">-- حدد الموظف --</option>
                      {/* Housekeeping specific preferred first */}
                      {housekeeperStaff.map((s: any) => (
                        <option key={s.id} value={s.name}>🧹 {s.name}</option>
                      ))}
                      {/* Other staff as backup */}
                      {staffList.filter((s:any) => s.role !== 'خدمة غرف (Housekeeping)').map((s: any) => (
                        <option key={s.id} value={s.name}>👤 {s.name} ({s.role || 'موظف'})</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Priority Selection */}
                <div>
                  <label className="block text-xs font-black text-slate-600 mb-1.5">درجة الأولوية للغرفة</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="منخفضة">منخفضة (روتيني)</option>
                    <option value="متوسطة">متوسطة</option>
                    <option value="عالية">عالية (دخول مأهول)</option>
                    <option value="عالية جداً">عالية جداً (نزيل VIP)</option>
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-black text-slate-600 mb-1.5">حالة العمل الابتدائية</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="قيد التنفيذ">🧹 قيد التنفيذ والعمل الدوري</option>
                  <option value="مكتملة">✨ مكتملة وتم تسليم المفتاح</option>
                  <option value="متوقفة">⏳ معلّق / بانتظار تأمين المواد</option>
                </select>
              </div>

              {/* Custom notes */}
              <div>
                <label className="block text-xs font-black text-slate-600 mb-1.5">ملاحظات أو توصيات إضافية (اختياري)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={2}
                  placeholder="مثال: يطلب النزيل إضافة معطر برائحة العود الفواح، أو سحب الغطاء القديم..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-400 font-medium"
                />
              </div>

              {/* ERP Link notification */}
              <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3 flex gap-2 text-[10px] text-slate-500 leading-relaxed font-bold">
                <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>
                  بمجرد إتمام المهمة واختيار "مكتملة"، سيتكفل نظام الـ ERP اللحظي بتعديل حالة الغرفة المحددة في لوحة الفندق تلقائياً إلى "جاهزة للسكن ونظيفة" لتوفير الوقت.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  {isEdit ? 'تحديث وحفظ التكليف' : 'إسناد التكليف عاجلاً'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETION MODAL */}
      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        title="تأكيد حذف التكليف"
        message="هل أنت متأكد من رغبتك في شطب وحذف قيد التدبير المنزلي هذا نهائياً من قاعدة بيانات المحاكاة الفندقية؟"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        confirmText="شطب وحذف"
        cancelText="تراجع"
      />

    </div>
  );
};
