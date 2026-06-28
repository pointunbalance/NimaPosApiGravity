import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { 
  Plus, Save, Calendar, Check, Info, ShieldAlert,
  Edit2, Trash2, Heart, Smile, Sparkles, Clock, CalendarClock,
  LayoutGrid, List, Search, Filter, AlertCircle, Baby, TrendingUp, Info as InfoIcon,
  Tag, Compass, Activity, CheckCircle2, RefreshCw, X
} from 'lucide-react';

interface BreedingRecord {
  id?: number;
  cowId: number;
  cowTag: string;
  inseminationDate: string;
  method: 'اصطناعي' | 'طبيعي';
  sireCode: string; // Bull tag/semen batch code
  pregnancyStatus: 'مؤكد' | 'غير مؤكد' | 'غير حامل' | 'معلق';
  pregnancyCheckDate?: string;
  expectedCalvingDate?: string;
  notes?: string;
}

export default function CowFarmBreeding() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BreedingRecord | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');

  // Form states and validation
  const [selectedCowId, setSelectedCowId] = useState<number | ''>('');
  const [inseminationDate, setInseminationDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState<'اصطناعي' | 'طبيعي'>('اصطناعي');
  const [sireCode, setSireCode] = useState('BULL-SEMEN-902');
  const [pregnancyStatus, setPregnancyStatus] = useState<'مؤكد' | 'غير مؤكد' | 'غير حامل' | 'معلق'>('معلق');
  const [pregnancyCheckDate, setPregnancyCheckDate] = useState('');
  const [expectedCalvingDate, setExpectedCalvingDate] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Custom Confirmation Dialog for deletes
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Queries
  const breedingLogs = useLiveQuery(() => db.cowFarmBreeding.toArray()) || [];
  const femaleCows = useLiveQuery(() => db.cowFarmCows.toArray()) || [];

  const handleOpenAdd = () => {
    setEditingRecord(null);
    setSelectedCowId('');
    setInseminationDate(new Date().toISOString().split('T')[0]);
    setMethod('اصطناعي');
    setSireCode('BULL-SEMEN-902');
    setPregnancyStatus('معلق');
    setPregnancyCheckDate('');
    setExpectedCalvingDate('');
    setNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: BreedingRecord) => {
    setEditingRecord(record);
    setSelectedCowId(record.cowId);
    setInseminationDate(record.inseminationDate);
    setMethod(record.method);
    setSireCode(record.sireCode);
    setPregnancyStatus(record.pregnancyStatus);
    setPregnancyCheckDate(record.pregnancyCheckDate || '');
    setExpectedCalvingDate(record.expectedCalvingDate || '');
    setNotes(record.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCowId) {
      setFormError("الرجاء اختيار رأس البقرة المراد تلقيحها من الحظيرة أولاً.");
      return;
    }

    const cow = femaleCows.find(c => c.id === Number(selectedCowId));
    if (!cow) {
      setFormError("لم يتم العثور على البقرة المحددة في النظام.");
      return;
    }

    setFormError(null);

    // Standard cow pregnancy duration is ~283 days. Let's automatically estimate expected calving date if empty!
    let inferredCalvingDate = expectedCalvingDate;
    if (pregnancyStatus === 'مؤكد' && !inferredCalvingDate && inseminationDate) {
      const insDate = new Date(inseminationDate);
      insDate.setDate(insDate.getDate() + 283);
      inferredCalvingDate = insDate.toISOString().split('T')[0];
    }

    const data: BreedingRecord = {
      cowId: cow.id!,
      cowTag: cow.tagNumber,
      inseminationDate,
      method,
      sireCode,
      pregnancyStatus,
      pregnancyCheckDate: pregnancyStatus !== 'معلق' ? (pregnancyCheckDate || new Date().toISOString().split('T')[0]) : undefined,
      expectedCalvingDate: inferredCalvingDate || undefined,
      notes
    };

    try {
      if (editingRecord && editingRecord.id) {
        await db.cowFarmBreeding.update(editingRecord.id, data);
      } else {
        await db.cowFarmBreeding.add(data);
      }

      // Automatically update the cow's status to "عشّار" if pregnancy is Confirmed ("مؤكد")!
      if (pregnancyStatus === 'مؤكد') {
        await db.cowFarmCows.update(cow.id!, { status: 'عشّار' });
      } else if (pregnancyStatus === 'غير حامل') {
        // If empty, revert current status back to normal "منتج"
        await db.cowFarmCows.update(cow.id!, { status: 'منتج' });
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      setFormError("حدث خطأ أثناء حفظ السجل، يرجى المحاولة لاحقاً.");
    }
  };

  const handleDelete = async (id: number) => {
    await db.cowFarmBreeding.delete(id);
    setDeleteConfirmId(null);
  };

  // Stats calculation
  const totalInseminatedThisYear = breedingLogs.length;
  const confirmedPregnantCount = breedingLogs.filter(b => b.pregnancyStatus === 'مؤكد').length;
  const pendingCheckCount = breedingLogs.filter(b => b.pregnancyStatus === 'معلق' || b.pregnancyStatus === 'غير مؤكد').length;
  
  // Insemination success rate percentage
  const finishedLogsCount = breedingLogs.filter(b => b.pregnancyStatus === 'مؤكد' || b.pregnancyStatus === 'غير حامل').length;
  const successRate = useMemo(() => {
    if (finishedLogsCount === 0) return '0%';
    const successful = breedingLogs.filter(b => b.pregnancyStatus === 'مؤكد').length;
    return `${((successful / finishedLogsCount) * 100).toFixed(0)}%`;
  }, [breedingLogs, finishedLogsCount]);

  // Expected Calving in near term (next 45 days)
  const upcomingCalvingCalvesCount = useMemo(() => {
    const today = new Date();
    const fortyFiveDaysLater = new Date();
    fortyFiveDaysLater.setDate(today.getDate() + 45);

    return breedingLogs.filter(b => {
      if (b.pregnancyStatus !== 'مؤكد' || !b.expectedCalvingDate) return false;
      const d = new Date(b.expectedCalvingDate);
      return d >= today && d <= fortyFiveDaysLater;
    }).length;
  }, [breedingLogs]);

  // Filter logs based on search query, status and method
  const filteredLogs = useMemo(() => {
    return breedingLogs.filter(log => {
      const matchSearch = log.cowTag.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (log.sireCode && log.sireCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (log.notes && log.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchStatus = statusFilter === 'ALL' || log.pregnancyStatus === statusFilter;
      const matchMethod = methodFilter === 'ALL' || log.method === methodFilter;

      return matchSearch && matchStatus && matchMethod;
    });
  }, [breedingLogs, searchQuery, statusFilter, methodFilter]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-[#fcfcfc] min-h-screen text-slate-800" dir="rtl" id="cowfarm-breeding">
      
      {/* Header action bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200/60 pb-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-xs mt-1 shrink-0">
            <Heart className="w-6 h-6 fill-indigo-500/10 text-indigo-600 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight" id="cowfarm-breeding-title">سجل التلقيح والتطوير الوراثي</h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">متابعة عمليات التناسل والتلقيح الاصطناعي/الطبيعي وحساب مواعيد الولادة والتحسين الجيني المتواصل للقطيع.</p>
          </div>
        </div>
        
        <button 
          onClick={handleOpenAdd}
          className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/10 duration-150 flex items-center gap-2 text-xs border-none cursor-pointer bg-indigo-600"
        >
          <Plus className="w-4 h-4" /> تسجيل تلقيح جديد للقطيع
        </button>
      </div>

      {/* Breeding stats metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 duration-200">
          <div className="flex justify-between items-center text-slate-450">
            <span className="text-xs font-bold text-slate-400">إجمالي عمليات التلقيح</span>
            <CalendarClock className="w-4.5 h-4.5 text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-800 tracking-tight">{totalInseminatedThisYear}</span>
            <span className="text-xs text-slate-400 font-bold">عمليات</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">المسجلة في الحظائر والعيادة للعام المالي</p>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 duration-200">
          <div className="flex justify-between items-center text-fuchsia-600">
            <span className="text-xs font-bold text-slate-400">حالات العشار المثبتة</span>
            <span className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse"></span>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-black text-fuchsia-600 tracking-tight">{confirmedPregnantCount}</span>
            <span className="text-xs text-slate-400 font-bold">رأس عشّار</span>
          </div>
          <p className="text-[10px] text-fuchsia-600/80 mt-1 font-bold">تأكيد بالفحص السلوكي أو الفحص الطبي</p>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 duration-200">
          <div className="flex justify-between items-center text-amber-500">
            <span className="text-xs font-bold text-slate-400">حالات انتظار الفحص (معلق)</span>
            <Clock className="w-4.5 h-4.5 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-black text-amber-600 tracking-tight">{pendingCheckCount}</span>
            <span className="text-xs text-slate-400 font-bold">رأس معلق</span>
          </div>
          <p className="text-[10px] text-amber-700 mt-1 font-bold">يتطلب فحص سونار قريباً</p>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 duration-200">
          <div className="flex justify-between items-center text-emerald-600">
            <span className="text-xs font-bold text-slate-400">معدل نجاح التخصيب</span>
            <TrendingUp className="w-4.5 h-4.5 text-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-black text-emerald-700 tracking-tight">{successRate}</span>
            <span className="text-[10px] text-slate-400 font-bold">نسبة النجاح الكلية</span>
          </div>
          <p className="text-[10px] text-emerald-600 mt-1 font-medium">مستنداً لحالات الحمل المؤكدة والمفرغة</p>
        </div>

      </div>

      {/* Near term birth alert notice */}
      {upcomingCalvingCalvesCount > 0 && (
        <div className="bg-[#f5f7ff] border border-indigo-100/80 p-4.5 rounded-2xl flex items-start gap-4">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center shrink-0">
            <Baby className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-0.5">
            <h4 className="text-xs font-bold text-indigo-950">إشعار ولادات مرتقبة وقريبة بالحظائر (خلال 45 يوماً القادمة)</h4>
            <p className="text-xs text-indigo-700 leading-relaxed font-medium">
              يوجد حالياً <strong className="text-sm font-black text-indigo-900">{upcomingCalvingCalvesCount}</strong> بقرة عشّار في فترات الحمل الأخيرة. يرجى تجهيز حظيرة الولادة المعقمة، وضبط مخصصات القش والأعلاف الجافة، وتنبيه الطبيب البيطري المناوب.
            </p>
          </div>
        </div>
      )}

      {/* Advanced search, status, and view mode filter bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="البحث برقم البقرة، رمز الأب، الملاحظات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 focus:border-indigo-500/40 rounded-xl text-xs focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition duration-150"
          />
        </div>

        {/* Categories, method filters & view modes */}
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between lg:justify-end gap-3 w-full lg:w-auto">
          
          <div className="flex flex-wrap gap-2">
            
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-550">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">حالة الحمل:</span>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-slate-700 cursor-pointer text-xs"
              >
                <option value="ALL">الكل</option>
                <option value="معلق">معلق (بانتظار السونار)</option>
                <option value="مؤكد">مؤكد وعشّار (حامل)</option>
                <option value="غير حامل">غير حامل / مفرغة</option>
                <option value="غير مؤكد">غير مؤكد بالجس</option>
              </select>
            </div>

            {/* Method Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-550">
              <Compass className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">النوع:</span>
              <select 
                value={methodFilter} 
                onChange={(e) => setMethodFilter(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-slate-700 cursor-pointer text-xs"
              >
                <option value="ALL">الكل</option>
                <option value="اصطناعي">تلقيح اصطناعي</option>
                <option value="طبيعي">تلقيح طبيعي</option>
              </select>
            </div>

          </div>

          <div className="w-px h-6 bg-slate-200 hidden lg:block"></div>

          {/* Toggle View Mode */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg duration-150 flex items-center gap-1.5 text-xs font-bold cursor-pointer border-none ${
                viewMode === 'grid' 
                  ? 'bg-white text-slate-800 shadow-xs' 
                  : 'text-slate-400 hover:text-slate-600 bg-transparent'
              }`}
              title="عرض البطاقات"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">البطاقات</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg duration-150 flex items-center gap-1.5 text-xs font-bold cursor-pointer border-none ${
                viewMode === 'table' 
                  ? 'bg-white text-slate-800 shadow-xs' 
                  : 'text-slate-400 hover:text-slate-600 bg-transparent'
              }`}
              title="عرض الجدول"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">الجدول مدمج</span>
            </button>
          </div>

        </div>

      </div>

      {/* Main Events List or Grid */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-12 text-center text-slate-400 font-medium">
          لم يتم العثور على أي عمليات تلقيح مطابقة لمعايير البحث الحالية بالحظيرة.
        </div>
      ) : viewMode === 'grid' ? (
        
        // Grid cards layout for Breeding Records
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredLogs.map(log => {
            const isNearPregnancy = log.expectedCalvingDate ? (new Date(log.expectedCalvingDate) <= new Date(Date.now() + 45 * 24 * 3600 * 1000)) : false;
            
            return (
              <div 
                key={log.id} 
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 duration-200 flex flex-col justify-between"
                id={`breeding-card-${log.id}`}
              >
                {/* Header aspect with status stripe */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 relative overflow-hidden">
                  <span className={`absolute top-0 right-0 left-0 h-1 ${
                    log.pregnancyStatus === 'مؤكد' ? 'bg-fuchsia-550 bg-fuchsia-500' :
                    log.pregnancyStatus === 'غير حامل' ? 'bg-red-500' :
                    log.pregnancyStatus === 'معلق' ? 'bg-amber-400' :
                    'bg-slate-400'
                  }`} />
                  
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Heart className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-mono font-black text-slate-800 text-[14px]">الأم: {log.cowTag}</span>
                  </div>

                  <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md ${
                    log.pregnancyStatus === 'مؤكد' ? 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100' :
                    log.pregnancyStatus === 'غير حامل' ? 'bg-red-50 text-red-700 border border-red-100' :
                    log.pregnancyStatus === 'معلق' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                    'bg-slate-50 text-slate-600 border border-slate-100'
                  }`}>
                    {log.pregnancyStatus === 'مؤكد' ? 'عشر مؤكد' : log.pregnancyStatus}
                  </span>
                </div>

                {/* Event body statistics */}
                <div className="p-4 space-y-3.5 text-xs bg-white flex-1">
                  
                  {/* Row 1: Insemination Date & Method */}
                  <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-100/70">
                    <div>
                      <span className="text-slate-400 font-bold block text-[9px] mb-0.5">تاريخ التلقيح</span>
                      <p className="font-extrabold text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {log.inseminationDate}
                      </p>
                    </div>
                    <div className="border-r border-slate-100 pr-2">
                      <span className="text-slate-400 font-bold block text-[9px] mb-0.5">نوع التلقيح</span>
                      <span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded ${
                        log.method === 'اصطناعي' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-105'
                      }`}>
                        {log.method === 'اصطناعي' ? 'اصطناعي (قشة)' : 'طبيعي (ثور الباد)'}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Sire code */}
                  <div className="pb-3 border-b border-slate-100/70 flex justify-between items-center">
                    <div>
                      <span className="text-slate-400 font-bold block text-[9px] mb-0.5">رمز الكود المرجعي للثور</span>
                      <p className="font-mono font-bold text-slate-700 text-xs">{log.sireCode}</p>
                    </div>
                    <div className="text-left">
                      <span className="bg-slate-50 text-slate-500 font-bold px-2 py-1 rounded text-[10px] border border-slate-100">
                        سلالة محسنة
                      </span>
                    </div>
                  </div>

                  {/* Row 3: Expected Calving prediction with countdown style */}
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold block text-[9px]">تاريخ الولادة التقديري الآمن</span>
                    {log.pregnancyStatus === 'مؤكد' && log.expectedCalvingDate ? (
                      <div className={`p-2 rounded-xl border flex items-center justify-between ${
                        isNearPregnancy 
                          ? 'bg-indigo-50 border-indigo-150 text-indigo-900 bg-indigo-50/50' 
                          : 'bg-emerald-50/70 border-emerald-100 text-emerald-800'
                      }`}>
                        <div className="flex items-center gap-1.5 font-bold">
                          <Baby className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{log.expectedCalvingDate}</span>
                        </div>
                        {isNearPregnancy && (
                          <span className="text-[9px] font-black bg-indigo-100 text-indigo-800 px-1 py-0.5 rounded animate-pulse">
                            قريباً جداً
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 font-medium italic block text-[11px] pt-1">
                        {log.pregnancyStatus === 'غير حامل' ? 'لا يوجد (رحم مفرغ)' : 'بانتظار ثبوت علامات الحمل'}
                      </span>
                    )}
                  </div>

                  {log.notes && (
                    <div className="pt-1.5">
                      <div className="bg-slate-50 p-2 rounded-xl text-[10px] text-slate-500 border border-slate-100 leading-relaxed font-medium">
                        <span className="font-black text-slate-400 block text-[8px] mb-0.5">تعليمات التحسين الوراثية:</span>
                        {log.notes}
                      </div>
                    </div>
                  )}

                </div>

                {/* Footer Actions inside Card */}
                <div className="p-3 border-t border-slate-100 bg-slate-50/20 flex gap-2">
                  <button 
                    onClick={() => handleOpenEdit(log)}
                    className="flex-1 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-extrabold hover:bg-slate-100 duration-150 flex items-center justify-center gap-1 text-xs cursor-pointer bg-white"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> فحص وتحديث
                  </button>
                  <button 
                    onClick={() => setDeleteConfirmId(log.id || null)}
                    className="px-2.5 py-1.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-500 duration-150 text-xs cursor-pointer bg-white"
                    title="حذف السجل نهائياً"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        
        // Table mode (streamlined tabular grid layout)
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 font-bold">
                  <th className="py-3 px-4 font-bold text-slate-600">رقم البقرة (الأنثى)</th>
                  <th className="py-3 px-4 font-bold text-slate-600">تاريخ التلقيح</th>
                  <th className="py-3 px-4 font-bold text-slate-600">النوع</th>
                  <th className="py-3 px-4 font-bold text-slate-600">رمز الأب (الثور)</th>
                  <th className="py-3 px-4 font-bold text-slate-600">حالة الإخصاب</th>
                  <th className="py-3 px-4 font-bold text-slate-600">تاريخ الولادة المتوقع</th>
                  <th className="py-3 px-4 font-bold text-slate-600">ملاحظات التحسين</th>
                  <th className="py-3 px-4 font-bold text-slate-600 text-left pl-6">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => {
                  const isNearCalving = log.expectedCalvingDate ? (new Date(log.expectedCalvingDate) <= new Date(Date.now() + 45 * 24 * 3600 * 1000)) : false;
                  
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{log.cowTag}</td>
                      <td className="py-3.5 px-4 text-slate-600">{log.inseminationDate}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                          log.method === 'اصطناعي' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                        }`}>
                          {log.method}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{log.sireCode}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md ${
                          log.pregnancyStatus === 'مؤكد' ? 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100' :
                          log.pregnancyStatus === 'غير حامل' ? 'bg-red-50 text-red-700 border border-red-100' :
                          log.pregnancyStatus === 'معلق' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {log.pregnancyStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {log.expectedCalvingDate ? (
                          <span className={`inline-flex items-center gap-1.5 font-bold px-2 py-0.5 rounded text-xs ${
                            isNearCalving ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-slate-800'
                          }`}>
                            <Calendar className="w-3.5 h-3.5" />
                            {log.expectedCalvingDate}
                            {isNearCalving && <span className="text-[9px] bg-indigo-100 text-indigo-800 px-1 rounded font-black">وشيكة</span>}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">لا يوجد</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 max-w-[180px] truncate" title={log.notes}>
                        {log.notes || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-left pl-6">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenEdit(log)}
                            className="py-1 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg text-xs duration-100 flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> تعديل
                          </button>
                          <button 
                            onClick={() => setDeleteConfirmId(log.id || null)}
                            className="p-1 rounded-lg border border-red-100 hover:bg-red-50 text-red-500 duration-100 cursor-pointer bg-white"
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

      )}

      {/* Genetic advisory card block */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-start gap-3">
        <InfoIcon className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h5 className="text-xs font-black text-slate-800">إرشادات التحسين الوراثي والتلقيح السليم</h5>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            يتحرك القطيع بانتظام بمتوسط فترة حمل تبلغ 283 يوماً. من الأفضل إجراء التلقيح بعد 45 إلى 60 يوماً من آخر ولادة لتفادي فترات الجفاف الطويلة. التلقيح الاصطناعي بدفعات مستوردة يحقق زيادة 20% في إنتاج الحليب للأجيال الجديدة.
          </p>
        </div>
      </div>

      {/* Breeding Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in duration-150">
            
            {/* Modal Header */}
            <div className="p-6 bg-indigo-600 text-white flex justify-between items-center relative">
              <span className="absolute top-0 right-0 left-0 h-1 bg-white/10" />
              <div>
                <h3 className="text-lg font-black tracking-tight">{editingRecord ? 'تعديل سجل التناسل وفترة الحمل' : 'تسجيل تلقيح وإخصاب للقطيع'}</h3>
                <p className="text-xs text-indigo-100 mt-1">تتبع دورة التكاثر للأبقار ومتابعة الحظيرة والتحليل البيطري للمواليد.</p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border-none cursor-pointer duration-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2 animate-pulse">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="font-bold">{formError}</span>
                </div>
              )}

              {/* Select Cow */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">البقرة الملقحة (الأم) *</label>
                <select
                  required
                  disabled={editingRecord !== null}
                  value={selectedCowId}
                  onChange={(e) => setSelectedCowId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-4 focus:ring-indigo-500/5 transition focus:outline-none"
                >
                  <option value="">-- اختر البقرة من سجل القطيع --</option>
                  {femaleCows.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.tagNumber} [{c.breed}] (الحالة الحالية: {c.status})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 font-medium">الأبقار ذات الحالة "منتج" و"جاف" هي الأكثر قابلية للتلقيح.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Insemination Date */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">تاريخ التلقيح *</label>
                  <input 
                    type="date"
                    required
                    value={inseminationDate}
                    onChange={(e) => setInseminationDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-4 focus:ring-indigo-500/5 transition focus:outline-none font-bold text-slate-700"
                  />
                </div>

                {/* Method */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">طريقة التلقيح</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-4 focus:ring-indigo-500/5 transition focus:outline-none text-slate-700 font-bold"
                  >
                    <option value="اصطناعي">(اصطناعي) قشة سائل منوي خاضعة للتبريد</option>
                    <option value="طبيعي">(طبيعي) تلقيح حر بمساعدة ثور معتمد</option>
                  </select>
                </div>

              </div>

              {/* Sire Code */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block font-mono">الكود المرجعي للثور أو دفعة القش الملقح (Sire Code / Bull ID) *</label>
                <input 
                  type="text"
                  required
                  value={sireCode}
                  onChange={(e) => setSireCode(e.target.value)}
                  placeholder="مثال: BULL-SEMEN-902, DE-AMER-10"
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-4 focus:ring-indigo-500/5 transition focus:outline-none font-mono font-bold text-slate-800"
                />
              </div>

              {/* Pregnancy Status and Sonar Check */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">وضع الحمل المؤكد بالعيادة</label>
                  <select
                    value={pregnancyStatus}
                    onChange={(e) => setPregnancyStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-4 focus:ring-indigo-500/5 transition focus:outline-none font-black text-indigo-700"
                  >
                    <option value="معلق">معلق (تحت الانتظار والملاحظة البيئية والجسية)</option>
                    <option value="مؤكد">مؤكد وعشّار (Confirmed pregnant)</option>
                    <option value="غير حامل">غير حامل (مفرغة - إعادة الفحص أو إعادة التلقيح)</option>
                    <option value="غير مؤكد">غير مؤكد بنتيجة المس السلبي الأولي</option>
                  </select>
                  
                  {pregnancyStatus === 'مؤكد' && (
                    <div className="p-3 bg-fuchsia-50 border border-fuchsia-100 rounded-xl text-fuchsia-700 text-[10px] leading-relaxed font-bold animate-pulse">
                      * تحديث حالة البقرة: سيقوم النظام بتحديث حالة البقرة في السجل فوراً إلى "عشّار" لتنظيم فترات الحليب والجفاف والرعاية التحصينية.
                    </div>
                  )}
                </div>

                {pregnancyStatus === 'مؤكد' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 block">الموعد المتوقع للولادة الولوجية (Due Date)</label>
                    <input 
                      type="date"
                      value={expectedCalvingDate}
                      onChange={(e) => setExpectedCalvingDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-4 focus:ring-indigo-500/5 transition focus:outline-none font-bold text-slate-800"
                    />
                    <p className="text-[10px] text-slate-400 font-medium">اتركه فارغاً لقيام النظام بالتوليد التلقائي بعد مضي 283 يوماً من تاريخ التلقيح المدخل.</p>
                  </div>
                )}

              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">ملاحظات التحسين الوراثي والسلالة</label>
                <textarea 
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: بقرة بكرية بمتوسط وزن ممتاز، سلالة فرنسية مستوردة للأب ممتازة لإنتاج مدر حليب وفير..."
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-4 focus:ring-indigo-500/5 transition focus:outline-none text-slate-700 font-medium"
                />
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-105 flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-200 text-slate-500 hover:text-slate-800 font-bold rounded-xl text-xs sm:text-sm cursor-pointer duration-100 bg-white"
              >
                إلغاء الأمر
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-indigo-600/10 cursor-pointer border-none"
              >
                <Save className="w-4 h-4" /> حفظ التناسل والحمل
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-red-50 text-red-650 rounded-full flex items-center justify-center border border-red-100">
              <ShieldAlert className="w-6 h-6 text-red-600" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">حذف سجل التلقيح نهائياً؟</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                هل أنت متأكد من رغبتك في إزالة هذا السجل المرجعي للتناسل؟ لا يمكن استعادة السجل الوراثي المحذوف عقب الحذف.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 font-bold rounded-xl text-xs cursor-pointer border-none"
              >
                رجوع وإلغاء
              </button>
              <button 
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs cursor-pointer border-none"
              >
                نعم، احذف السجل
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
