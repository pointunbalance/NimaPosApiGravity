import React, { useState } from 'react';
import { 
  Plus, Search, Filter, MoreHorizontal, Edit2, Trash2, X,
  ClipboardList, BedDouble, CheckCircle, AlertTriangle, Hammer, Brush, 
  DollarSign, RefreshCw, Layers, Users, ShieldAlert, BadgeInfo, Eye
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import ConfirmModal from '../../components/ui/ConfirmModal';

export const Rooms = () => {
  // Safe Live Queries with fallbacks
  const records = useLiveQuery(() => db.hotelRoomsList.toArray()) || [];
  const housekeepingTasks = useLiveQuery(() => db.hotelHousekeepingList.toArray()) || [];

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  // ConfirmModal states (to avoid native browser confirm/dialogs)
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    roomNumber: "",
    type: "مفردة مريحة",
    capacity: "1",
    price: "150",
    status: "متاحة"
  });

  // Global Notification / Toast banner (no native alerts)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'warning' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Dynamic status-based counts
  const totalRoomsCount = records.length;
  const availableRoomsCount = records.filter(r => r.status === 'متاحة').length;
  const occupiedRoomsCount = records.filter(r => r.status === 'تم تسجيل الدخول' || r.status === 'محجوزة').length;
  const dirtyOrVacantCount = records.filter(r => r.status === 'شاغرة').length;
  const maintenanceCount = records.filter(r => r.status === 'تحت الصيانة' || r.status === 'غير متاحة').length;

  // Search and Filter records
  const filteredRecords = records.filter((item: any) => {
    const matchesSearch = 
      String(item.roomNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      String(item.type || '').toLowerCase().includes(search.toLowerCase()) ||
      String(item.status || '').toLowerCase().includes(search.toLowerCase());

    if (statusFilter === 'الكل') return matchesSearch;
    if (statusFilter === 'متاحة') return matchesSearch && item.status === 'متاحة';
    if (statusFilter === 'مشغولة') return matchesSearch && (item.status === 'تم تسجيل الدخول' || item.status === 'محجوزة');
    if (statusFilter === 'شاغرة') return matchesSearch && item.status === 'شاغرة';
    if (statusFilter === 'صيانة') return matchesSearch && (item.status === 'تحت الصيانة' || item.status === 'غير متاحة');
    return matchesSearch;
  });

  const handleOpenModal = (editMode = false, item: any = null) => {
    setIsEdit(editMode);
    if (editMode && item) {
      setCurrentId(item.id!);
      setFormData({
        roomNumber: item.roomNumber || "",
        type: item.type || "مفردة مريحة",
        capacity: String(item.capacity || 1),
        price: String(item.price || 150),
        status: item.status || "متاحة"
      });
    } else {
      setCurrentId(null);
      setFormData({
        roomNumber: "",
        type: "مفردة مريحة",
        capacity: "1",
        price: "150",
        status: "متاحة"
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.roomNumber.trim()) {
      showToast('يرجى إدخال رقم الغرفة للتعريف المباشر ⚠️', 'warning');
      return;
    }

    try {
      // Validate that roomNumber is unique if adding new
      if (!isEdit) {
        const duplicate = records.find(r => r.roomNumber.trim() === formData.roomNumber.trim());
        if (duplicate) {
          showToast(`رقم الغرفة ${formData.roomNumber} مسجل مسبقاً بالنظام فوت ⚠️`, 'warning');
          return;
        }
      }

      const dataToSave = {
        roomNumber: formData.roomNumber.trim(),
        type: formData.type,
        capacity: parseInt(formData.capacity) || 1,
        price: parseFloat(formData.price) || 150,
        status: formData.status
      };

      if (isEdit && currentId) {
        await db.hotelRoomsList.update(currentId, dataToSave);
        showToast(`تمت مواءمة بيانات الغرفة رقم ${formData.roomNumber} بنجاح ✅`, 'success');
      } else {
        await db.hotelRoomsList.add(dataToSave);
        showToast(`تم تأسيس الغرفة الفندقية رقم ${formData.roomNumber} بنجاح ✅`, 'success');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast('فشل حفظ البيانات الفندقية نتيجة خطأ داخلي ❌', 'warning');
    }
  };

  const handleDeleteTrigger = (id: number) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      try {
        const item = records.find(r => r.id === deleteId);
        await db.hotelRoomsList.delete(deleteId);
        showToast(`تم شطب الغرفة ${item ? 'رقم ' + item.roomNumber : ''} بنجاح من قائمة الأصول 🗑️`, 'success');
      } catch (err) {
        console.error(err);
        showToast('فشل حذف سجل الغرفة', 'warning');
      }
      setDeleteId(null);
    }
  };

  // Direct Inline Status Update from the table row dropdown
  const handleStatusChangeInline = async (roomId: number, newStatus: string) => {
    try {
      await db.hotelRoomsList.update(roomId, { status: newStatus });
      showToast(`تم تبديل حالة الغرفة فورياً إلى "${newStatus}" 🚀`, 'success');
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء التحديث السريع واللحظي للحالة', 'warning');
    }
  };

  // Interconnected ERP Action: Send immediate housekeeping action
  const handleRequestCleaning = async (roomNumber: string) => {
    try {
      const activeTask = housekeepingTasks.find(
        t => t.roomNumber === roomNumber && t.status !== 'مكتملة'
      );

      if (activeTask) {
        showToast(`هنالك طلب تنظيف قيد العمل بالفعل للغرفة رقم ${roomNumber} 🧹`, 'warning');
        return;
      }

      await db.hotelHousekeepingList.add({
        roomNumber: roomNumber,
        task: "تنظيف وتعقيم طارئ بطلب من موظف الإستقبال",
        assignedTo: "فريق الإشراف الصباحي",
        status: "قيد التنفيذ"
      });

      // Update room status to "شاغرة" (Dirty / Needs Cleaning)
      const r = records.find(item => item.roomNumber === roomNumber);
      if (r && r.status === 'متاحة') {
        await db.hotelRoomsList.update(r.id!, { status: 'شاغرة' });
      }

      showToast(`تم إسناد مهمة تنظيف طارئة للغرفة ${roomNumber} بنجاح 🧹`, 'success');
    } catch (err) {
      console.error(err);
      showToast('فشلت عملية تهيئة مهمة النظافة للغرفة', 'warning');
    }
  };

  // Interconnected ERP Action: Report maintenance and put under service
  const handleReportMaintenance = async (roomId: number, roomNumber: string) => {
    try {
      await db.hotelRoomsList.update(roomId, { status: "تحت الصيانة" });
      
      // Register with housekeeping/work-orders
      await db.hotelHousekeepingList.add({
        roomNumber: roomNumber,
        task: "إصلاح أعطال وإعادة تأهيل طارئة للخدمة",
        assignedTo: "مهندس الصيانة المناوب",
        status: "قيد التنفيذ"
      });

      showToast(`تم تحويل الغرفة ${roomNumber} إلى "تحت الصيانة" وجدولة أعمال الترميم 🛠️`, 'success');
    } catch (err) {
      console.error(err);
      showToast('فشلت محاولة توجيه طلب الصيانة', 'warning');
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50/40 min-h-screen text-right" dir="rtl">
      
      {/* TOAST ALERT BANNER FOR FEEDBACKS */}
      {notification && (
        <div className={`fixed top-4 left-4 z-50 flex items-center gap-2.5 px-5 py-4 rounded-2xl shadow-xl border animate-in slide-in-from-top duration-300 text-xs font-black transition-all ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-500/20' 
            : 'bg-amber-50 text-amber-900 border-amber-300'
        }`}>
          <div className={`w-2.5 h-2.5 rounded-full ${notification.type === 'success' ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600'}`} />
          <span>{notification.message}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <BedDouble className="w-8 h-8 text-indigo-600" />
            <span>إدارة شؤون الغرف والأصول السكنية</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            تسجيل وتجنيب الغرف، تسعير ليلة المبيت، فلترة الحالات اللحظية وتكامل الإشعارات الفورية مع قسم الصيانة العامة والإشراف الداخلي.
          </p>
        </div>
        <button 
          onClick={() => handleOpenModal(false)}
          className="bg-indigo-600 text-white px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-all font-black text-xs active:scale-95 shadow-md shadow-indigo-600/10 cursor-pointer">
          <Plus className="w-4.5 h-4.5" />
          <span>تأسيس غرفة جديدة</span>
        </button>
      </div>

      {/* STATISTICAL ANALYTICS DASH CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/50 shadow-sm">
          <span className="text-[10px] text-slate-400 font-extrabold block">إجمالي محصلة الغرف</span>
          <span className="text-xl font-black text-slate-800 mt-1 block">{totalRoomsCount} غرف</span>
          <div className="text-[9px] text-slate-400 mt-1 inline-flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-400" />
            <span>السعة الاستيعابية الكلية</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 h-1 w-full bg-emerald-500" />
          <span className="text-[10px] text-slate-400 font-extrabold block text-emerald-600">الغرف المتاحة والسليمة</span>
          <span className="text-xl font-black text-emerald-700 mt-1 block">{availableRoomsCount} غرف</span>
          <div className="text-[9px] text-emerald-600 mt-1 inline-flex items-center gap-1 font-bold">
            <CheckCircle className="w-3 h-3" />
            <span>جاهزة للمبيت الفوري</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 h-1 w-full bg-indigo-505 bg-indigo-500" />
          <span className="text-[10px] text-slate-400 font-extrabold block text-indigo-600">الغرف المشغولة والنشطة</span>
          <span className="text-xl font-black text-indigo-700 mt-1 block">{occupiedRoomsCount} غرف</span>
          <div className="text-[9px] text-indigo-600 mt-1 inline-flex items-center gap-1 font-bold">
            <Users className="w-3 h-3" />
            <span>نزلاء مقيمين حالياً</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 h-1 w-full bg-amber-500" />
          <span className="text-[10px] text-slate-400 font-extrabold block text-amber-600">متسخة / تحتاج نظافة</span>
          <span className="text-xl font-black text-amber-700 mt-1 block">{dirtyOrVacantCount} غرف</span>
          <div className="text-[9px] text-amber-600 mt-1 inline-flex items-center gap-1 font-bold">
            <Brush className="w-3 h-3" />
            <span>تتطلب جدولة تدبير منزلي</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 h-1 w-full bg-rose-500" />
          <span className="text-[10px] text-slate-400 font-extrabold block text-rose-600">قيد الصيانة والترميم</span>
          <span className="text-xl font-black text-rose-700 mt-1 block">{maintenanceCount} غرف</span>
          <div className="text-[9px] text-rose-650 text-rose-500 mt-1 inline-flex items-center gap-1 font-bold">
            <Hammer className="w-3 h-3" />
            <span>أعمال صيانة وقائية وعزل</span>
          </div>
        </div>
      </div>

      {/* FILTER BUTTONS & QUICK SEARCH WRAPPER */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* TOP TAB CONTROLS */}
        <div className="p-4 border-b border-slate-150 border-slate-200 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-slate-50/50">
          
          {/* SEARCH FIELD */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4.5 h-4.5 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث برقم الغرفة، الفئة، أو الحالة..." 
              className="w-full pr-10 pl-4 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-400 font-medium transition-all"
            />
          </div>

          {/* STATUS FILTER TABS */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl text-slate-600 font-bold self-start md:self-auto">
            {[
              { id: 'الكل', label: 'كافة الغرف' },
              { id: 'متاحة', label: 'شاغرة وجاهزة' },
              { id: 'مشغولة', label: 'مسكونة حالياً' },
              { id: 'شاغرة', label: 'تحتاج تنظيف' },
              { id: 'صيانة', label: 'في الصيانة' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  statusFilter === tab.id 
                    ? 'bg-indigo-600 text-white font-black shadow-sm' 
                    : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

        </div>
        
        {/* TABLE COMPONENT */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-600 text-xs font-black">
              <tr>
                <th className="px-5 py-4 w-16">المعرف</th>
                <th className="px-5 py-4">رقم الغرفة</th>
                <th className="px-5 py-4">نوع الغرفة / الفئة</th>
                <th className="px-5 py-4">السعة القصوى</th>
                <th className="px-5 py-4">سعر مبيت الليلة</th>
                <th className="px-5 py-4 w-44">حالة شغول الغرفة اللحظية</th>
                <th className="px-5 py-4 text-center">إسناد وتكامل الإدارات الطارئة</th>
                <th className="px-5 py-4 text-left w-28">التحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center gap-2 justify-center py-6">
                      <Eye className="w-8 h-8 text-slate-300" />
                      <p>لا توجد أي غرف متوافقة مع الفلترة والبحث المختار.</p>
                      <button 
                        onClick={() => { setSearch(''); setStatusFilter('الكل'); }}
                        className="text-indigo-600 hover:underline font-black mt-1"
                      >
                        مسح مرشحات البحث
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.map((item: any) => {
                // Helpers for status classes
                let statusBadgeClass = "bg-slate-100 text-slate-800 border-slate-200";
                if (item.status === 'متاحة') statusBadgeClass = "bg-emerald-50 text-emerald-800 border-emerald-250 border-emerald-200/50";
                else if (item.status === 'تم تسجيل الدخول') statusBadgeClass = "bg-blue-50 text-blue-800 border-blue-200/50";
                else if (item.status === 'شاغرة') statusBadgeClass = "bg-amber-50 text-amber-800 border-amber-300/50 animate-pulse";
                else if (item.status === 'تحت الصيانة') statusBadgeClass = "bg-rose-50 text-rose-800 border-rose-200/50";
                else if (item.status === 'محجوزة') statusBadgeClass = "bg-violet-50 text-violet-800 border-violet-200/40";
                else if (item.status === 'غير متاحة') statusBadgeClass = "bg-slate-100 text-slate-600 border-slate-200";

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 font-mono text-slate-400">#{item.id}</td>
                    
                    {/* Room number */}
                    <td className="px-5 py-4 font-black text-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-200 border border-slate-300" />
                        <span className="text-sm">غرفة {item.roomNumber}</span>
                      </div>
                    </td>
                    
                    {/* Class */}
                    <td className="px-5 py-4 font-extrabold text-slate-700">{item.type || 'مفردة مريحة'}</td>
                    
                    {/* Capacity */}
                    <td className="px-5 py-4 font-bold text-slate-600">
                      <div className="flex items-center gap-1">
                        <BedDouble className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.capacity} أسرة / أفراد</span>
                      </div>
                    </td>

                    {/* Price with currency */}
                    <td className="px-5 py-4 font-black text-slate-850 text-slate-850 text-indigo-700">
                      <span>{(Number(item.price) || 150).toLocaleString()} ج.م</span>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">رسوم الليلة</span>
                    </td>
                    
                    {/* Inline Editable Status Badge */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <select
                          value={item.status || "متاحة"}
                          onChange={(e) => handleStatusChangeInline(item.id!, e.target.value)}
                          className={`px-2 py-1 border text-[11px] rounded-lg font-black transition-all cursor-pointer ${statusBadgeClass}`}
                        >
                          <option value="متاحة">🟢 متاحة / جاهزة</option>
                          <option value="تم تسجيل الدخول">🔵 تم تسجيل الدخول</option>
                          <option value="محجوزة">🟣 محجوزة مسبقاً</option>
                          <option value="شاغرة">🟡 متسخة / تحتاج تنظيف</option>
                          <option value="تحت الصيانة">🔴 تحت الصيانة الإنشائية</option>
                          <option value="غير متاحة">⚫ غير متاحة للخدمة</option>
                        </select>
                      </div>
                    </td>

                    {/* Integrated Quick Action Hooks */}
                    <td className="px-5 py-4">
                      <div className="flex justify-center items-center gap-1.5">
                        
                        {/* Request cleaning */}
                        <button 
                          onClick={() => handleRequestCleaning(item.roomNumber)}
                          className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/50 px-2.5 py-1.5 rounded-lg font-black text-[10px] active:scale-95 transition-all cursor-pointer"
                          title="إرسال طلب فوري لعمال النظافة"
                        >
                          <Brush className="w-3 h-3 text-amber-600" />
                          <span>طلب نظافة</span>
                        </button>

                        {/* Direct Maintenance Toggle */}
                        {item.status !== 'تحت الصيانة' ? (
                          <button 
                            onClick={() => handleReportMaintenance(item.id!, item.roomNumber)}
                            className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/50 px-2.5 py-1.5 rounded-lg font-black text-[10px] active:scale-95 transition-all cursor-pointer"
                            title="تحويل مباشر لقسم الصيانة والترميم العاجل"
                          >
                            <Hammer className="w-3 h-3 text-rose-600" />
                            <span>تسجيل صيانة</span>
                          </button>
                        ) : (
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-black px-2 py-1 rounded-md">🛠️ الصيانة مجدولة</span>
                        )}

                      </div>
                    </td>

                    {/* CRUD Actions */}
                    <td className="px-5 py-4 text-left">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => handleOpenModal(true, item)} 
                          className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                          title="تعديل بيانات الغرفة"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTrigger(item.id!)} 
                          className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                          title="حذف وحظر المعرف للغرفة"
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

      {/* CREATE & EDIT FORM MODAL CONTAINER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Title */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-600" />
                <span>{isEdit ? `تعديل سجل الغرفة رقم (${formData.roomNumber})` : 'تأسيس غرفة فندقية جديدة'}</span>
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                {/* Room Number */}
                <div>
                  <label className="block text-xs font-black text-slate-600 mb-1.5">رقم الغرفة المخصص *</label>
                  <input 
                    type="text" 
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                    required
                    disabled={isEdit}
                    placeholder="مثال: 105، 204أ"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-550"
                  />
                </div>

                {/* Night Price */}
                <div>
                  <label className="block text-xs font-black text-slate-600 mb-1.5">سعر الليلة الواحدة (ج.م) *</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="number" 
                      min="1"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      required
                      placeholder="150"
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Room Type */}
                <div>
                  <label className="block text-xs font-black text-slate-600 mb-1.5">فئة ونوع الغرفة الفندقية</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="مفردة مريحة">مفردة مريحة (Single)</option>
                    <option value="مزدوجة فاخرة">مزدوجة فاخرة (Double Luxury)</option>
                    <option value="مزدوجة متميزة">مزدوجة متميزة (Double Premium)</option>
                    <option value="جناح عائلي رئيسي">جناح عائلي رئيسي (Family Suite)</option>
                    <option value="جناح ملكي فاخر">جناح ملكي فاخر (Royal Suite)</option>
                    <option value="جناح العرسان الفخم">جناح العرسان الفخم (Honeymoon Suite)</option>
                  </select>
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-xs font-black text-slate-600 mb-1.5">سعة الأسرة / الأطفال والبالغين</label>
                  <select 
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="1">سرير مفرد (فرد واحد)</option>
                    <option value="2">سريران منفصلان (فردان)</option>
                    <option value="3">ثلاثة أسرة (3 أفراد)</option>
                    <option value="4">سرير مزدوج كبير وعائلي (4 أفراد)</option>
                    <option value="5">أجنحة ضخمة متعددة الأسرة (بحد أقصى 5-6 أفراد)</option>
                  </select>
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-black text-slate-600 mb-1.5">حالة شغول الغرفة اللحظية حالياً</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="متاحة">🟢 متاحة / شاغرة ومكتملة التجهيز</option>
                  <option value="تم تسجيل الدخول">🔵 تم تسجيل الدخول (مسكونة بنزيل)</option>
                  <option value="محجوزة">🟣 محجوزة مسبقاً لمستأجر</option>
                  <option value="شاغرة">🟡 متسخة / قيد التنظيف والتهوية</option>
                  <option value="تحت الصيانة">🔴 تحت الصيانة الفنية / الوقائية</option>
                  <option value="غير متاحة">⚫ غير متاحة حالياً لأسباب إدارية</option>
                </select>
              </div>

              {/* Helper prompt info */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex gap-2.5 text-[10px] text-slate-500 leading-relaxed">
                <BadgeInfo className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>
                  تتيح لك كبسة حفظ البيانات بتوليد السجل محلياً فوت. بمجرد حدوث الحجز، ينعكس سعر مبيت الليلة أوتوماتيكياً في عمليات الفواتير والإقامة للأقسام المعنية.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  إلغاء الأمر
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  {isEdit ? 'مواءمة وتعديل السجل' : 'تأسيس وحفظ الغرفة'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG MODAL FOR DELETION (NO NATIVE WINDOWS) */}
      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        title="تأكيد الحذف النهائي"
        message="هل أنت متأكد من رغبتك في شطب وحذف هذه الغرفة السكنية بالكامل من قاعدة السجلات الفندقية؟ سينعكس هذا على إمكانية حجزها مجدداً."
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        confirmText="نعم، احذف الغرفة"
        cancelText="تراجع"
      />

    </div>
  );
};
