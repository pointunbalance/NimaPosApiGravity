import React, { useState } from 'react';
import { 
  Plus, Search, Filter, Edit2, Trash2, X, Settings, 
  Sparkles, Coffee, Car, Shirt, Settings2, ShieldCheck, 
  Trash, Bookmark, BadgeInfo, HelpCircle, Layers, 
  Eye, CheckCircle2, DollarSign, Activity, EyeOff, Sparkle
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import ConfirmModal from '../../components/ui/ConfirmModal';

export const HotelServices = () => {
  // Search and Filtering states
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('الكل');
  const [statusFilter, setStatusFilter] = useState('الكل');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  // ConfirmModal states (to avoid native browser confirm block)
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: 150,
    type: 'خدمات عامة وإدارية',
    status: 'نشط',
    description: ''
  });

  // Success / Warning Toast Notification state (No native alert!)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'warning' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Safe Database Query using Dexie useLiveQuery hook
  const records = useLiveQuery(() => db.hotelServicesList.toArray()) || [];

  // Live aggregated calculations for metrics cards
  const totalCount = records.length;
  const activeCount = records.filter((item: any) => item.status === 'نشط').length;
  const inactiveCount = records.filter((item: any) => item.status === 'غير نشط').length;
  
  const averagePrice = totalCount > 0 
    ? Math.round(records.reduce((acc: number, cur: any) => acc + (Number(cur.price) || 0), 0) / totalCount) 
    : 0;

  const highestPriceItem = records.length > 0 
    ? [...records].sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0))[0]
    : null;

  // Filter processes
  const filteredRecords = records.filter((item: any) => {
    const matchesSearch = 
      String(item.name || '').toLowerCase().includes(search.toLowerCase()) ||
      String(item.type || '').toLowerCase().includes(search.toLowerCase()) ||
      String(item.description || '').toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'الكل' || item.type === categoryFilter;
    const matchesStatus = statusFilter === 'الكل' || item.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Category Icon Mapper
  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'مأكولات ومشروبات':
        return <Coffee className="w-5 h-5 text-amber-500" />;
      case 'توصيل وتنقلات':
        return <Car className="w-5 h-5 text-blue-500" />;
      case 'سبا وعناية صحية':
        return <Sparkles className="w-5 h-5 text-purple-500" />;
      case 'مغسلة وتنظيف جاف':
        return <Shirt className="w-5 h-5 text-emerald-500" />;
      default:
        return <Settings2 className="w-5 h-5 text-indigo-500" />;
    }
  };

  // Modal open triggers
  const handleOpenModal = (editMode = false, item: any = null) => {
    setIsEdit(editMode);
    if (editMode && item) {
      setCurrentId(item.id!);
      setFormData({
        name: item.name || '',
        price: Number(item.price) || 0,
        type: item.type || 'خدمات عامة وإدارية',
        status: item.status || 'نشط',
        description: item.description || ''
      });
    } else {
      setCurrentId(null);
      setFormData({
        name: '',
        price: 50,
        type: 'مأكولات ومشروبات',
        status: 'نشط',
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  // Safe CRUD Actions
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('يرجى إدخال اسم الخدمة ⚠️', 'warning');
      return;
    }
    if (Number(formData.price) < 0) {
      showToast('سعر الخدمة لا يمكن أن يكون سالباً ⚠️', 'warning');
      return;
    }

    try {
      const dataToSave = {
        name: formData.name.trim(),
        price: Number(formData.price),
        type: formData.type,
        status: formData.status,
        description: formData.description.trim()
      };

      if (isEdit && currentId) {
        await db.hotelServicesList.update(currentId, dataToSave);
        showToast(`تم تحديث الخدمة "${formData.name}" بنجاح ✨`, 'success');
      } else {
        await db.hotelServicesList.add(dataToSave);
        showToast(`تم تأسيس الخدمة "${formData.name}" بنجاح في كتالوج الإضافات 🚀`, 'success');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast('فشل حفظ الخدمة نتيجة عطل داخلي ❌', 'warning');
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
        await db.hotelServicesList.delete(deleteId);
        showToast(`تم شطب الخدمة "${item ? item.name : ''}" نهائياً من الكتالوج 🗑️`, 'success');
      } catch (err) {
        console.error(err);
        showToast('لم نتمكن من حذف سجل الخدمة', 'warning');
      }
      setDeleteId(null);
    }
  };

  // Direct fast status switcher inline
  const handleToggleStatusInline = async (id: number, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'نشط' ? 'غير نشط' : 'نشط';
      await db.hotelServicesList.update(id, { status: nextStatus });
      showToast(`تغيرت حالة الخدمة فورياً إلى "${nextStatus}" 🔄`, 'info');
    } catch (err) {
      console.error(err);
      showToast('فشل تفعيل/تعطيل الخدمة السكنية', 'warning');
    }
  };

  // Preset Seeding for empty catalogs to enhance test previews
  const seedDefaultServices = async () => {
    try {
      const sampleServices = [
        { name: 'إفطار كونتيننتال شامل بالغرفة', price: 90, type: 'مأكولات ومشروبات', status: 'نشط', description: 'وجبة متكاملة للغرفة تشمل بيض وعسل ومخبوزات مع الشاي' },
        { name: 'خدمة غسيل جاف وكوي مستعجل', price: 40, type: 'مغسلة وتنظيف جاف', status: 'نشط', description: 'استلام، غسيل، كوي بالبخار، وإعادة للملابس خلال ساعتين' },
        { name: 'توصيل وتسهيل ليموزين المطار والمحطات', price: 250, type: 'توصيل وتنقلات', status: 'نشط', description: 'سيارة سيدان مكيفة مع سائق مناوب بجميع الأوقات' },
        { name: 'مساج استرخائي سويدي (٦٠ دقيقة)', price: 450, type: 'سبا وعناية صحية', status: 'نشط', description: 'جلسة تدليك بالزيوت الطبيعية بإشراف مختص سبا العناية' },
        { name: 'تزيين ترحيبي وجناح العرسان بالورود والشموع', price: 150, type: 'خدمات عامة وإدارية', status: 'نشط', description: 'تنسيق فاخر يضم بتلات الورد الطبيعي وإضاءة رومانسية هادئة' },
        { name: 'توصيل مياه وعصائر مبردة إضافية', price: 25, type: 'مأكولات ومشروبات', status: 'نشط', description: 'سلة مبردة تضم عصائر طازجة للغرفة بطلب مباشر' }
      ];

      await db.hotelServicesList.bulkAdd(sampleServices);
      showToast('تم تغذية الكتالوج الفندقي بالخدمات الافتراضية بنجاح 🌟', 'success');
    } catch (err) {
      console.error(err);
      showToast('خطأ أثناء تحضير السجلات التجريبية', 'warning');
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50/40 min-h-screen text-right" dir="rtl">
      
      {/* TOAST FEEDBACK MODULE */}
      {notification && (
        <div id="toast-banner-additional" className={`fixed top-4 left-4 z-50 flex items-center gap-2.5 px-5 py-4 rounded-2xl shadow-xl border animate-in slide-in-from-top duration-300 text-xs font-black transition-all ${
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

      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <Sparkle className="w-8 h-8 text-indigo-600 animate-spin-slow" />
            <span>كتالوج الخدمات والتسهيلات الإضافية</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            تهيئة وتسعير العروض الفندقية المتاحة للنزلاء أثناء الإقامة، وتدشين أسعار الشراء لتنعكس فوراً على فواتير الحسابات الختامية للإدارة الفندقية.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {totalCount === 0 && (
            <button 
              id="btn-seed-services"
              onClick={seedDefaultServices}
              className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2.5 rounded-xl hover:bg-indigo-100 transition-all font-black text-xs cursor-pointer"
              title="تعبئة خدمات افتراضية ممتازة"
            >
              ملء نموذج تجريبي
            </button>
          )}

          <button 
            id="btn-create-service-modal"
            onClick={() => handleOpenModal(false)}
            className="bg-indigo-600 text-white px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-all font-black text-xs active:scale-95 shadow-md shadow-indigo-600/10 cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>تسجيل عرض/خدمة جديدة</span>
          </button>
        </div>
      </div>

      {/* STATISTICAL ANALYTICS METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div id="stat-card-total-services" className="bg-white rounded-2xl p-4 border border-slate-200/50 shadow-sm">
          <span className="text-[10px] text-slate-400 font-extrabold block">إجمالي الخدمات المتاحة</span>
          <span className="text-xl font-black text-slate-800 mt-1 block">{totalCount} خدمات</span>
          <div className="text-[9px] text-slate-400 mt-1 inline-flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-405 text-slate-500" />
            <span>بكتالوج الفندق الموحد</span>
          </div>
        </div>

        <div id="stat-card-active-services" className="bg-white rounded-2xl p-4 border border-slate-200/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 h-1 w-full bg-emerald-500" />
          <span className="text-[10px] text-slate-400 font-extrabold block text-emerald-600">العروض النشطة حالياً</span>
          <span className="text-xl font-black text-emerald-700 mt-1 block">{activeCount} عروض</span>
          <div className="text-[9px] text-emerald-600 mt-1 inline-flex items-center gap-1 font-bold">
            <CheckCircle2 className="w-3 h-3" />
            <span>جاهزة للطلب من الغرفة</span>
          </div>
        </div>

        <div id="stat-card-inactive-services" className="bg-white rounded-2xl p-4 border border-slate-200/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 h-1 w-full bg-slate-400" />
          <span className="text-[10px] text-slate-405 text-slate-400 font-extrabold block">عروض معلقة مؤقتاً</span>
          <span className="text-xl font-black text-slate-700 mt-1 block">{inactiveCount} خدمات</span>
          <div className="text-[9px] text-slate-500 mt-1 inline-flex items-center gap-1">
            <EyeOff className="w-3 h-3" />
            <span>خارج نافذة الخدمة الراهنة</span>
          </div>
        </div>

        <div id="stat-card-avg-price-services" className="bg-white rounded-2xl p-4 border border-slate-200/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 h-1 w-full bg-indigo-500" />
          <span className="text-[10px] text-slate-400 font-extrabold block text-indigo-600">متوسط تسعيرة التسهيلات</span>
          <span className="text-xl font-black text-indigo-700 mt-1 block">{averagePrice.toLocaleString()} ج.م</span>
          <div className="text-[9px] text-indigo-650 text-indigo-600 mt-1 inline-flex items-center gap-1 font-extrabold">
            <DollarSign className="w-3 h-3" />
            <span>للقطعة أو المهمة المفردة</span>
          </div>
        </div>

        {/* Highlighted best service */}
        <div id="stat-card-premium-service" className="bg-white rounded-2xl p-4 border border-slate-205 border-indigo-100 shadow-sm relative overflow-hidden bg-indigo-50/10">
          <div className="absolute top-0 right-0 h-1 w-full bg-indigo-600" />
          <span className="text-[10px] text-indigo-800 font-black block">أرقى وأعلى ميزة تسعيراً</span>
          <span className="text-sm font-black text-slate-800 mt-1.5 block truncate">
            {highestPriceItem ? highestPriceItem.name : 'لا يوجد'}
          </span>
          <div className="text-[10px] text-indigo-700 mt-0.5 inline-flex items-center gap-1 font-bold">
            <span>{highestPriceItem ? `${highestPriceItem.price} ج.م` : '_'}</span>
          </div>
        </div>

      </div>

      {/* FILTER BUTTONS & QUICK SEARCH MODULE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* TAB CONTROLS AND MULTI-FILTER BAR */}
        <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-slate-50/50">
          
          {/* SEARCH COMPONENT */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4.5 h-4.5 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              id="search-input-services"
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم الخدمة الفندقية أو الوصف..." 
              className="w-full pr-10 pl-4 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-400 transition-all text-slate-700"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* CATEGORY FILTER SELECTOR */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-slate-600 font-bold">
              {[
                { id: 'الكل', label: 'كافة التصنيفات' },
                { id: 'مأكولات ومشروبات', label: 'أطعمة ومشروبات ☕' },
                { id: 'توصيل وتنقلات', label: 'ليموزين/تنقلات 🚗' },
                { id: 'سبا وعناية صحية', label: 'عناية وصحة ✨' },
                { id: 'مغسلة وتنظيف جاف', label: 'مغسلة ملابس 👕' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setCategoryFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    categoryFilter === tab.id 
                      ? 'bg-indigo-600 text-white font-black shadow-sm' 
                      : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* STATUS SELECTOR */}
            <select
              id="select-status-toggle-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black cursor-pointer text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="الكل">كل الحالات (نشط/معطل)</option>
              <option value="نشط">نشط / مفعل</option>
              <option value="غير نشط">غير نشط / موقوف</option>
            </select>
          </div>

        </div>

        {/* SERVICE CATOLOG DATA TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-600 text-xs font-black">
              <tr>
                <th className="px-5 py-4 w-16">المعرف</th>
                <th className="px-5 py-4">اسم العرض الفندقي</th>
                <th className="px-5 py-4">التصنيف والنوع</th>
                <th className="px-5 py-4">تسعيرة الخدمة الفردية</th>
                <th className="px-5 py-4">شرح وتفاصيل التكليف للنزيل</th>
                <th className="px-5 py-4 w-32 text-center">الحالة الحالية</th>
                <th className="px-5 py-4 text-left w-24">التحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-semibold text-xs">
                    <div className="flex flex-col items-center gap-2.5 justify-center py-6">
                      <HelpCircle className="w-10 h-10 text-slate-300 animate-bounce" />
                      <p>لا توجد خدمات متاحة بفلاتر البحث المحددة حالياً.</p>
                      {records.length === 0 ? (
                        <button 
                          onClick={seedDefaultServices} 
                          className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2 mt-2 rounded-xl text-xs font-black hover:bg-indigo-100 cursor-pointer"
                        >
                          تغذية بيانات الكتالوج فورياً للتجربة
                        </button>
                      ) : (
                        <button 
                          onClick={() => { setSearch(''); setCategoryFilter('الكل'); setStatusFilter('الكل'); }}
                          className="text-indigo-600 hover:underline font-black"
                        >
                          عرض كل الكتالوج
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.map((item: any) => {
                const isActive = item.status === 'نشط' || item.status === 'مفعل';

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 font-mono text-slate-400">#{item.id}</td>
                    
                    {/* Name */}
                    <td className="px-5 py-4 font-black">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-slate-100 rounded-lg shrink-0">
                          {getServiceIcon(item.type)}
                        </div>
                        <span className="text-slate-900 text-sm">{item.name}</span>
                      </div>
                    </td>

                    {/* Category Type */}
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-extrabold text-[10px]">
                        {item.type || 'خدمات عامة وإدارية'}
                      </span>
                    </td>

                    {/* Price with currency */}
                    <td className="px-5 py-4 font-black text-indigo-700 text-sm">
                      <span>{(Number(item.price) || 0).toLocaleString()} ج.م</span>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">شامل الضريبة والخدمة</span>
                    </td>

                    {/* Description */}
                    <td className="px-5 py-4 text-slate-400 font-semibold max-w-sm truncate" title={item.description}>
                      {item.description || 'لا يوجد تفاصيل إضافية ملقنة'}
                    </td>

                    {/* Status inline toggler */}
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleToggleStatusInline(item.id!, item.status)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all cursor-pointer active:scale-95 ${
                          isActive 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200/50 hover:bg-emerald-100' 
                            : 'bg-rose-50 text-rose-800 border-rose-200/40 hover:bg-rose-100'
                        }`}
                        title="انقر لتبديل حالة العرض الفندقي سريعاً"
                      >
                        {isActive ? '🟢 نشط للمبيعات' : '🔴 موقوف السحب'}
                      </button>
                    </td>

                    {/* CRUD Actions */}
                    <td className="px-5 py-4 text-left">
                      <div className="flex justify-end items-center gap-1.5">
                        <button 
                          onClick={() => handleOpenModal(true, item)}
                          className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all cursor-pointer"
                          title="تعديل تفاصيل الخدمة والأسعار"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTrigger(item.id!)}
                          className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all cursor-pointer"
                          title="شطب الخدمة"
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

      {/* CREATE / EDIT FORM DIALOG MODAL */}
      {isModalOpen && (
        <div id="modal-container-additional" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Title bar */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-indigo-600" />
                <span>{isEdit ? `تعديل مستند عرض الخدمة (${formData.name})` : 'إدراج خدمة فندقية جديدة'}</span>
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form layout */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              
              {/* Service Name input */}
              <div>
                <label className="block text-xs font-black text-slate-600 mb-1.5">اسم الخدمة أو التشهير بالغرفة *</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="مثال: غسيل وكي مستعجل، تنقل ليموزين VIP"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Price input */}
                <div>
                  <label className="block text-xs font-black text-slate-600 mb-1.5">سعر الخدمة (ج.م) *</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="number" 
                      min="0"
                      step="0.1"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                      required
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Category Type Selector */}
                <div>
                  <label className="block text-xs font-black text-slate-600 mb-1.5">تصنيف الخدمة المعين</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer text-slate-705"
                  >
                    <option value="مأكولات ومشروبات">مأكولات ومشروبات ☕</option>
                    <option value="توصيل وتنقلات">توصيل وتنقلات 🚗</option>
                    <option value="سبا وعناية صحية">سبا وعناية صحية ✨</option>
                    <option value="مغسلة وتنظيف جاف">مغسلة وتنظيف جاف 👕</option>
                    <option value="خدمات عامة وإدارية">خدمات عامة وإدارية 🛠️</option>
                  </select>
                </div>
              </div>

              {/* Status input */}
              <div>
                <label className="block text-xs font-black text-slate-600 mb-1.5">حالة تفعيل العرض الآن</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer text-slate-705"
                >
                  <option value="نشط">🟢 نشط (متاح للنزلاء ويدخل الفاتورة)</option>
                  <option value="غير نشط">🔴 معطل / موقوف العرض مؤقتاً</option>
                </select>
              </div>

              {/* Description field */}
              <div>
                <label className="block text-xs font-black text-slate-600 mb-1.5">شرح مقتضب تفصيلي للخدمة للنزيل (اختياري)</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  placeholder="مثال: يرجى تزويد البيانات عن توقيت الخدمة، مستلزمات الضيافة، الرسوم الاستثنائية..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-400 font-semibold text-slate-700"
                />
              </div>

              {/* Helpful Integration info */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex gap-2.5 text-[10px] text-slate-500 leading-relaxed font-bold">
                <BadgeInfo className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>
                  تكامل الحسابات اللحظية: تنعكس أسعار الخدمات الإضافية المدرجة هنا تلقائياً داخل نظام الاستقبال وإدارة السكن والحجوزات والأقسام المحاسبية للفندق.
                </span>
              </div>

              {/* Actions */}
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
                  {isEdit ? 'مواءمة وحفظ التغييرات' : 'تأسيس وحفظ الخدمة'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION CONTEXT FOR DELETIONS */}
      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        title="تأكيد حذف خدمة الإضافات"
        message="هل أنت متأكد من رغبتك في شطب وحذف هذه الخدمة نهائياً من سجل كتالوج الإضافات؟ لا يمكن التراجع عن هذا السحب فوت."
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        confirmText="نعم، شطب العرض"
        cancelText="طلب إلغاء"
      />

    </div>
  );
};
