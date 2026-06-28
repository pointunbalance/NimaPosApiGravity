import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { 
  Plus, Edit, Trash2, Search, Filter, Save, X, Info, 
  Activity, Calendar, ShieldCheck, HelpCircle, LayoutGrid, List, AlertCircle, Eye,
  MapPin, Tag
} from 'lucide-react';

interface Cow {
  id?: number;
  tagNumber: string;
  breed: string;
  status: string; // 'منتج' | 'عشّار' | 'جاف' | 'عزل'
  gender: 'أنثى' | 'ذكر';
  healthStatus: 'صحي' | 'مريض' | 'تحت الملاحظة';
  roomNumber: string;
  weight: number;
  age: number;
  birthDate: string;
  paddockId?: string;
  notes?: string;
}

export default function CowFarmCows() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCow, setEditingCow] = useState<Cow | null>(null);
  
  // Custom delete modal state
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Search and Filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [healthFilter, setHealthFilter] = useState('ALL');

  // View state and Form validation
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields state
  const [tagNumber, setTagNumber] = useState('');
  const [breed, setBreed] = useState('هولشتاين (Holstein)');
  const [status, setStatus] = useState('منتج');
  const [gender, setGender] = useState<'أنثى' | 'ذكر'>('أنثى');
  const [healthStatus, setHealthStatus] = useState<'صحي' | 'مريض' | 'تحت الملاحظة'>('صحي');
  const [roomNumber, setRoomNumber] = useState('عنبر 1');
  const [weight, setWeight] = useState(550);
  const [birthDate, setBirthDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Queries
  const cows = useLiveQuery(() => db.cowFarmCows.toArray()) || [];

  const handleOpenAdd = () => {
    setEditingCow(null);
    setFormError(null);
    setTagNumber(`COW-${Date.now().toString().slice(-4)}`);
    setBreed('هولشتاين (Holstein)');
    setStatus('منتج');
    setGender('أنثى');
    setHealthStatus('صحي');
    setRoomNumber('عنبر 1');
    setWeight(550);
    setBirthDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cow: Cow) => {
    setEditingCow(cow);
    setFormError(null);
    setTagNumber(cow.tagNumber);
    setBreed(cow.breed);
    setStatus(cow.status);
    setGender(cow.gender);
    setHealthStatus(cow.healthStatus);
    setRoomNumber(cow.roomNumber);
    setWeight(cow.weight || 500);
    setBirthDate(cow.birthDate || new Date().toISOString().split('T')[0]);
    setNotes(cow.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagNumber.trim()) return;

    // Direct check for duplicate tag numbers
    const tagExists = cows.find(c => c.tagNumber.toLowerCase() === tagNumber.toLowerCase() && c.id !== editingCow?.id);
    if (tagExists) {
      setFormError("عذراً، رقم اللوت/العلامة مسجل لبقرة أخرى بالقطيع.");
      return;
    }

    setFormError(null);

    // Age approximation from birthDate
    const birthY = new Date(birthDate).getFullYear();
    const currentY = new Date().getFullYear();
    const age = Math.max(0, currentY - birthY);

    const data: Cow = {
      tagNumber,
      breed,
      status,
      gender,
      healthStatus,
      roomNumber,
      weight: Number(weight),
      age,
      birthDate,
      notes
    };

    try {
      if (editingCow && editingCow.id) {
        await db.cowFarmCows.update(editingCow.id, data);
      } else {
        await db.cowFarmCows.add(data);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      await db.cowFarmCows.delete(deleteId);
      setDeleteId(null);
    }
  };

  // Filter and search computation
  const filteredCows = cows.filter(cow => {
    const matchesSearch = cow.tagNumber.toLowerCase().includes(search.toLowerCase()) || 
                          cow.breed.toLowerCase().includes(search.toLowerCase()) ||
                          cow.roomNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || cow.status === statusFilter;
    const matchesHealth = healthFilter === 'ALL' || cow.healthStatus === healthFilter;
    return matchesSearch && matchesStatus && matchesHealth;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50/50 min-h-screen text-slate-850 text-slate-800" dir="rtl" id="cowfarm-cows">
      
      {/* Upper header action bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200/60 pb-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-sm mt-1 shrink-0">
            <Activity className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight" id="cowfarm-cows-title">إدارة الأبقار والماشية</h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">سجل القطيع الإلكتروني ومتابعة الإحصائيات الحيوية وتصنيفات الحظيرة المتكاملة.</p>
          </div>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-lg shadow-emerald-700/10 duration-150 flex items-center gap-2 text-xs cursor-pointer border-none"
        >
          <Plus className="w-4 h-4" /> تسجيل رأس حية جديد
        </button>
      </div>

      {/* Stats Counter Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 duration-200">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold text-slate-400">العدد الكلي للقطيع</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-800 tracking-tight">{cows.length}</span>
            <span className="text-xs text-slate-400 font-bold">رأس</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 duration-200">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold text-slate-400">مدرّات الحليب</span>
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-blue-600 tracking-tight">{cows.filter(c => c.status === 'منتج').length}</span>
            <span className="text-xs text-slate-400 font-bold">رأس</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 duration-200">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold text-slate-400">عشّار وحقن مخصب</span>
            <Calendar className="w-4 h-4 text-fuchsia-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-fuchsia-600 tracking-tight">{cows.filter(c => c.status === 'عشّار').length}</span>
            <span className="text-xs text-slate-400 font-bold">رأس</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 duration-200">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold text-slate-400">أبقار معزولة لعلاج</span>
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-amber-500 tracking-tight">{cows.filter(c => c.status === 'عزل').length}</span>
            <span className="text-xs text-slate-400 font-bold">رأس</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 duration-200 col-span-2 md:col-span-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold text-slate-400">تحت الرعاية الطبية</span>
            <ShieldCheck className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-rose-600 tracking-tight">{cows.filter(c => c.healthStatus === 'مريض' || c.healthStatus === 'تحت الملاحظة').length}</span>
            <span className="text-xs text-slate-400 font-bold">رأس</span>
          </div>
        </div>
      </div>

      {/* Filters and search box */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="البحث برقم العلامة، السلالة، العنبر..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-205 focus:border-emerald-500/40 rounded-xl text-xs focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition duration-150"
          />
        </div>

        {/* Categories filters & view mode selection */}
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between lg:justify-end gap-3 w-full lg:w-auto">
          
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-550">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">الحالة:</span>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-slate-700 cursor-pointer text-xs"
              >
                <option value="ALL">الكل</option>
                <option value="منتج">مدرّ (منتج حليب)</option>
                <option value="عشّار">عشّار (حامل)</option>
                <option value="جاف">جاف (Dry)</option>
                <option value="عزل">معزول للعلاج</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-550">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">الوضع الصحي:</span>
              <select 
                value={healthFilter} 
                onChange={(e) => setHealthFilter(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-slate-700 cursor-pointer text-xs"
              >
                <option value="ALL">الكل</option>
                <option value="صحي">صحي مية مية</option>
                <option value="مريض">مريض</option>
                <option value="تحت الملاحظة">تحت الملاحظة بيطرياً</option>
              </select>
            </div>
          </div>

          <div className="w-px h-6 bg-slate-200 hidden lg:block"></div>

          {/* Toggle View Mode */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg duration-150 flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                viewMode === 'grid' 
                  ? 'bg-white text-slate-800 shadow-xs border-none' 
                  : 'text-slate-400 hover:text-slate-600 border-none bg-transparent'
              }`}
              title="عرض البطاقات"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">البطاقات</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg duration-150 flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                viewMode === 'table' 
                  ? 'bg-white text-slate-800 shadow-xs border-none' 
                  : 'text-slate-400 hover:text-slate-600 border-none bg-transparent'
              }`}
              title="عرض الجدول"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">الجدول</span>
            </button>
          </div>

        </div>

      </div>

      {/* Grid of Cattle / Herd Cards or Table Row */}
      {filteredCows.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-12 text-center text-slate-400 font-medium">
          لم يتم العثور على أي ماشية تطابق معايير البحث الحالية بالحظيرة.
        </div>
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredCows.map((cow) => (
            <div key={cow.id} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 duration-200 flex flex-col justify-between" id={`cow-card-${cow.id}`}>
              
              {/* Header inside card */}
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 relative overflow-hidden">
                {/* Accent top line according to status */}
                <span className={`absolute top-0 right-0 left-0 h-1 ${
                  cow.status === 'منتج' ? 'bg-emerald-500' :
                  cow.status === 'عشّار' ? 'bg-fuchsia-500' :
                  cow.status === 'عزل' ? 'bg-rose-500' :
                  'bg-amber-500'
                }`} />
                
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${
                    cow.status === 'منتج' ? 'bg-emerald-500 animate-pulse' :
                    cow.status === 'عشّار' ? 'bg-fuchsia-500 animate-pulse' :
                    cow.status === 'عزل' ? 'bg-rose-500' :
                    'bg-amber-500'
                  }`} />
                  <span className="font-mono font-black text-slate-800 text-base tracking-wide">{cow.tagNumber}</span>
                </div>
                
                <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md ${
                  cow.status === 'منتج' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                  cow.status === 'عشّار' ? 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100' :
                  cow.status === 'عزل' ? 'bg-red-50 text-red-700 border border-red-105' :
                  'bg-amber-50 text-amber-700 border border-amber-100'
                }`}>
                  {cow.status}
                </span>
              </div>

              {/* Attributes block */}
              <div className="p-4 space-y-4 text-xs flex-1 bg-white">
                {/* Row for Breed & Barn */}
                <div className="grid grid-cols-2 gap-2 pb-3.5 border-b border-slate-100/70">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 font-bold flex items-center gap-1 text-[10px]">
                      <Tag className="w-3.5 h-3.5 text-slate-400" /> السلالة
                    </span>
                    <p className="font-extrabold text-slate-700 leading-tight truncate" title={cow.breed}>{cow.breed}</p>
                  </div>
                  <div className="space-y-0.5 border-r border-slate-100 pr-2">
                    <span className="text-slate-400 font-bold flex items-center gap-1 text-[10px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> الحظيرة / العنبر
                    </span>
                    <p className="font-extrabold text-slate-700 leading-tight truncate" title={cow.roomNumber}>{cow.roomNumber}</p>
                  </div>
                </div>

                {/* Row for Gender & Weight */}
                <div className="grid grid-cols-2 gap-2 pb-3.5 border-b border-slate-100/70">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 font-bold flex items-center gap-1 text-[10px]">
                      <Info className="w-3.5 h-3.5 text-slate-400" /> الجنس
                    </span>
                    <p className="font-extrabold text-slate-700">{cow.gender}</p>
                  </div>
                  <div className="space-y-0.5 border-r border-slate-100 pr-2">
                    <span className="text-slate-400 font-bold flex items-center gap-1 text-[10px]">
                      <Activity className="w-3.5 h-3.5 text-slate-400" /> الوزن المقدر
                    </span>
                    <p className="font-extrabold text-slate-800">
                      <span className="text-sm font-black text-emerald-800">{cow.weight}</span> كجم
                    </p>
                  </div>
                </div>

                {/* Row for Age & Health Status */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 font-bold flex items-center gap-1 text-[10px]">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> العمر المقدر
                    </span>
                    <p className="font-extrabold text-slate-700">
                      {cow.age} سنة 
                      <span className="text-[9px] text-slate-400 block font-normal mt-0.5">({new Date(cow.birthDate).toLocaleDateString('ar-EG')})</span>
                    </p>
                  </div>
                  <div className="space-y-0.5 border-r border-slate-100 pr-2">
                    <span className="text-slate-400 font-bold flex items-center gap-1 text-[10px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> الوضع الصحي
                    </span>
                    <div className="pt-0.5">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-linear-to-r text-[10px] font-extrabold ${
                        cow.healthStatus === 'صحي' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                        cow.healthStatus === 'مريض' ? 'bg-red-50 text-red-700 border border-red-100/60' : 
                        'bg-amber-50 text-amber-700 border border-amber-100/60'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${
                          cow.healthStatus === 'صحي' ? 'bg-emerald-500' : 
                          cow.healthStatus === 'مريض' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                        }`}></span>
                        {cow.healthStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {cow.notes && (
                  <div className="pt-2">
                    <div className="bg-slate-50 text-slate-500 p-2 rounded-xl text-[10px] leading-relaxed border border-slate-100 line-clamp-2" title={cow.notes}>
                      <span className="font-black text-slate-400 block text-[8px] mb-1 uppercase tracking-wider">ملاحظات الطبيب:</span>
                      {cow.notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons footer */}
              <div className="p-3 border-t border-slate-100 bg-slate-50/20 flex gap-2">
                <button 
                  onClick={() => handleOpenEdit(cow)}
                  className="flex-1 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition flex items-center justify-center gap-1 text-xs cursor-pointer bg-white"
                >
                  <Edit className="w-3.5 h-3.5" /> تعديل البيانات
                </button>
                <button 
                  onClick={() => setDeleteId(cow.id || null)}
                  className="px-2.5 py-1.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-500 transition text-xs cursor-pointer bg-white"
                  title="حذف الأرأس"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))}
        </div>
      ) : (
        // Table View
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 font-bold">
                  <th className="py-3 px-4 font-bold text-slate-600">رقم العلامة</th>
                  <th className="py-3 px-4 font-bold text-slate-600">السلالة</th>
                  <th className="py-3 px-4 font-bold text-slate-600">العمر</th>
                  <th className="py-3 px-4 font-bold text-slate-600">الوزن</th>
                  <th className="py-3 px-4 font-bold text-slate-600">الجنس</th>
                  <th className="py-3 px-4 font-bold text-slate-600">العنبر والمكان</th>
                  <th className="py-3 px-4 font-bold text-slate-600">الحالة الإنتاجية</th>
                  <th className="py-3 px-4 font-bold text-slate-600">الوضع الصحي</th>
                  <th className="py-3 px-4 font-bold text-slate-600 text-left pl-6">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCows.map((cow) => (
                  <tr key={cow.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{cow.tagNumber}</td>
                    <td className="py-3.5 px-4 text-slate-700">{cow.breed}</td>
                    <td className="py-3.5 px-4 text-slate-550">{cow.age} سنة <span className="text-xs text-slate-400 font-normal">({new Date(cow.birthDate).toLocaleDateString('ar-EG')})</span></td>
                    <td className="py-3.5 px-4 text-slate-750 font-semibold">{cow.weight} كجم</td>
                    <td className="py-3.5 px-4 text-slate-500">{cow.gender}</td>
                    <td className="py-3.5 px-4 text-slate-600">{cow.roomNumber}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        cow.status === 'منتج' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        cow.status === 'عشّار' ? 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100' :
                        cow.status === 'عزل' ? 'bg-red-50 text-red-700 border border-red-100' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {cow.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold ${
                        cow.healthStatus === 'صحي' ? 'text-emerald-600' : 
                        cow.healthStatus === 'مريض' ? 'text-red-500' : 'text-amber-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          cow.healthStatus === 'صحي' ? 'bg-emerald-500' : 
                          cow.healthStatus === 'مريض' ? 'bg-red-500' : 'bg-amber-500'
                        }`}></span>
                        {cow.healthStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-left pl-6">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenEdit(cow)}
                          className="py-1 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg text-xs duration-100 flex items-center gap-1 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" /> تعديل
                        </button>
                        <button 
                          onClick={() => setDeleteId(cow.id || null)}
                          className="p-1 rounded-lg border border-red-100 hover:bg-red-50 text-red-500 duration-100 cursor-pointer bg-white"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slideout drawer / Modal popup for registering cows */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 bg-emerald-800 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">{editingCow ? 'تعديل سجل الأرأس والماشية' : 'تسجيل رأس جديدة بالقطيع'}</h3>
                <p className="text-xs text-emerald-100 mt-1">تعبئة البيانات الرئيسية والالتزام برقم المعرف الفريد.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full bg-white/10 hover:bg-white/20">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2 animate-pulse">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="font-bold">{formError}</span>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Tag Number */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">رقم المعرف / لوحة العلامة الرقمية (Tag ID) *</label>
                  <input 
                    type="text"
                    required
                    value={tagNumber}
                    onChange={(e) => setTagNumber(e.target.value)}
                    placeholder="مثال: COW-105"
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Breed */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">السلالة البقرية</label>
                  <select 
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="هولشتاين (Holstein)">هولشتاين (Holstein) - إنتاج ألبان عالي</option>
                    <option value="جيرسي (Jersey)">جيرسي (Jersey) - جودة ونسبة دسم عالية جداً</option>
                    <option value="براون سويس (Brown Swiss)">براون سويس (Brown Swiss) - ألبان ممتازة للأجبان</option>
                    <option value="فريزيان محلي (Friesian)">فريزيان (Friesian) - حليب وفير ومتعدد الأغراض</option>
                    <option value="سمنتال (Simmental)">سمنتال (Simmental) - ثنائي الغرض (لحم وحليب)</option>
                    <option value="آيرشاير (Ayrshire)">آيرشاير (Ayrshire) - مقاومة عالية وحجم إنتاجي متزن</option>
                    <option value="جويرنسي (Guernsey)">جويرنسي (Guernsey) - حليب ذهبي غني بالدسم والبروتين</option>
                    <option value="أنغوس أسود (Black Angus)">أنغوس أسود (Black Angus) - تسمين وإنتاج لحوم فاخرة</option>
                    <option value="شاروليه (Charolais)">شاروليه (Charolais) - معدلات نمو وأوزان تسمين ضخمة</option>
                    <option value="هيرفورد (Hereford)">هيرفورد (Hereford) - تسمين ومقاومة عالية للمراعي المفتوحة</option>
                    <option value="ليموزين (Limousin)">ليموزين (Limousin) - جودة لحم أحمر وعضلية ممتازة</option>
                    <option value="بلدي هجين">بلدي هجين - مقاومة عالية جداً للأمراض والحرارة</option>
                    <option value="شورتهورن (Shorthorn)">شورتهورن (Shorthorn) - سلالة ثنائية تاريخية</option>
                    <option value="برامان (Brahman)">برامان (Brahman) - سلالة متكيفة ممتازاً مع الأجواء الحارة والرطبة</option>
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">حالة الماشية الإنتاجية والفيزيولوجية</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="منتج">مدرّ للحليب (تحت الحلب)</option>
                    <option value="عشّار">عشّار ومخصبة (مؤكد)</option>
                    <option value="جاف">جاف (Dry period pre-birth)</option>
                    <option value="عزل">معزول بيطرياً بصورة كاملة</option>
                    <option value="عجل رضيع">عجل رضيح (حديث الولادة)</option>
                  </select>
                </div>

                {/* Gender */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">الجنس</label>
                  <select 
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="أنثى">أنثى (بقرة)</option>
                    <option value="ذكر">ذكر (ثور)</option>
                  </select>
                </div>

                {/* Health Status */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">وضع الصحة العامة</label>
                  <select 
                    value={healthStatus}
                    onChange={(e) => setHealthStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="صحي">سليم وصحي تماماً</option>
                    <option value="تحت الملاحظة">تحت الملاحظة (مستوصف المزرعة)</option>
                    <option value="مريض">مريض في مرحلة تلقي العلاج</option>
                  </select>
                </div>

                {/* Room Number / Paddock */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">مكان الماشية (العنبر / الحظيرة)</label>
                  <input 
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="مثال: عنبر ١"
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Weight */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">الوزن التقريبي (كجم)</label>
                  <input 
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    placeholder="مثال: 550"
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* BirthDate */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">تاريخ الميلاد التقريبي</label>
                  <input 
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">الملاحظات الطبية أو السلالة الوراثية</label>
                <textarea 
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي ملاحظات حول إنتاجيته السابقة أو علاجاته الدائمة..."
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 font-bold rounded-xl text-sm"
                >
                  إلغاء التغيير
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm flex items-center gap-1 shadow-lg shadow-emerald-700/10"
                >
                  <Save className="w-4 h-4" /> حفظ وإغلاق
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal for Safe Deletes (No window.confirm!) */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">هل أنت متأكد من حذف الماشية؟</h3>
              <p className="text-sm text-slate-500 mt-1">سيتم نقل بيانات الرأس المحددة وسجله الإنتاجي وصحته إلى سلة المحذوفات تلقائياً ويمكن استرجاعها.</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setDeleteId(null)} 
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm"
              >
                تراجع
              </button>
              <button 
                onClick={handleDelete} 
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm"
              >
                تأكيد حذف الرأس
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
