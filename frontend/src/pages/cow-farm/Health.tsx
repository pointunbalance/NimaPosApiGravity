import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { 
  Plus, Save, Calendar, Check, AlertTriangle, Activity, 
  Trash2, FileText, CheckCircle, Search, Clock, DollarSign, Wallet,
  Edit, Filter, LayoutGrid, List, AlertCircle, ShieldAlert, User, CheckCircle2, X
} from 'lucide-react';
import { AccountingEngine } from '../../services/AccountingEngine';

interface HealthRecord {
  id?: number;
  cowId: number;
  cowTag: string;
  date: string;
  diagnosis: string;
  treatment: string;
  safetyPeriodEnd?: string; // Milk and Meat withdrawal period end date
  veterinarian: string;
  cost: number;
  journalEntryId?: number;
  notes?: string;
}

export default function CowFarmHealth() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [safetyFilter, setSafetyFilter] = useState<'ALL' | 'WITHDRAWAL' | 'SAFE'>('ALL');

  // Form states
  const [selectedCowId, setSelectedCowId] = useState<number | ''>('');
  const [hospitalDate, setHospitalDate] = useState(new Date().toISOString().split('T')[0]);
  const [diagnosis, setDiagnosis] = useState('تحصين ثنائي الحمى القلاعية');
  const [treatment, setTreatment] = useState('لقاح بيطري ميبفاك للقطيع، جرعة 2 مل غشائي');
  const [safetyPeriodEnd, setSafetyPeriodEnd] = useState('');
  const [veterinarian, setVeterinarian] = useState('د. هاني عثمان');
  const [cost, setCost] = useState(0);
  const [postToLedger, setPostToLedger] = useState(true);
  const [selectedDebitAccountId, setSelectedDebitAccountId] = useState<number | ''>('');
  const [selectedCreditAccountId, setSelectedCreditAccountId] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Deletion confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Queries
  const healthLogs = useLiveQuery(() => db.cowFarmHealth.toArray()) || [];
  const cows = useLiveQuery(() => db.cowFarmCows.toArray()) || [];
  const accounts = useLiveQuery(() => db.accounts.toArray()) || [];

  // Active healthcare warnings (safety period active today)
  const safetyWarnings = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return healthLogs.filter(log => {
      if (!log.safetyPeriodEnd) return false;
      const end = new Date(log.safetyPeriodEnd);
      end.setHours(0,0,0,0);
      return end >= today;
    });
  }, [healthLogs]);

  // Suggested accounts for expenses
  const accountsPreset = useMemo(() => {
    const expenseAccs = accounts.filter(a => a.type?.toLowerCase() === 'expense' || a.code?.startsWith('5') || a.name?.includes('مصروف'));
    const assetAccs = accounts.filter(a => a.type?.toLowerCase() === 'asset' || a.name?.includes('صندوق') || a.name?.includes('الخزينة'));
    return { expenseAccs, assetAccs };
  }, [accounts]);

  // Handle open and preset accounts for a new record
  const handleOpenAdd = () => {
    setEditingRecord(null);
    setSelectedCowId('');
    setHospitalDate(new Date().toISOString().split('T')[0]);
    setDiagnosis('التهاب وجفاف وتطهير');
    setTreatment('مضاد حيوي بنسلين طويل المفعول 30 مل');
    setSafetyPeriodEnd(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Default 5 days safety
    setVeterinarian('د. هاني عثمان');
    setCost(300);
    setPostToLedger(true);
    setNotes('');
    setFormError(null);

    const expAcc = accounts.find(a => a.name?.includes('مصروف') || a.name?.includes('صيانة') || a.name?.includes('بيطر'));
    const cashAcc = accounts.find(a => a.name?.includes('صندوق') || a.name?.includes('الخزينة') || a.name?.includes('نقدية'));
    
    if (expAcc) setSelectedDebitAccountId(expAcc.id!);
    if (cashAcc) setSelectedCreditAccountId(cashAcc.id!);

    setIsModalOpen(true);
  };

  // Handle editing an existing record
  const handleOpenEdit = (record: HealthRecord) => {
    setEditingRecord(record);
    setSelectedCowId(record.cowId);
    setHospitalDate(record.date);
    setDiagnosis(record.diagnosis);
    setTreatment(record.treatment);
    setSafetyPeriodEnd(record.safetyPeriodEnd || '');
    setVeterinarian(record.veterinarian);
    setCost(record.cost);
    setPostToLedger(false); // Do not double post to ledger for edits by default
    setNotes(record.notes || '');
    setFormError(null);

    const expAcc = accounts.find(a => a.name?.includes('مصروف') || a.name?.includes('صيانة') || a.name?.includes('بيطر'));
    const cashAcc = accounts.find(a => a.name?.includes('صندوق') || a.name?.includes('الخزينة') || a.name?.includes('نقدية'));
    
    if (expAcc) setSelectedDebitAccountId(expAcc.id!);
    if (cashAcc) setSelectedCreditAccountId(cashAcc.id!);

    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedCowId) {
      setFormError("الرجاء اختيار رأس البقرة الخاضعة للفحص البيطري أولاً.");
      return;
    }

    const cow = cows.find(c => c.id === Number(selectedCowId));
    if (!cow) {
      setFormError("لم يتم العثور على البقرة المحددة في المزرعة.");
      return;
    }

    let journalEntryId: number | undefined = editingRecord?.journalEntryId;

    // Double Entry posting optionally for NEW record
    if (!editingRecord && postToLedger && cost > 0) {
      if (!selectedDebitAccountId || !selectedCreditAccountId) {
        setFormError("الرجاء اختيار حسابات المصروف والخزينة لترحيل قيد التكلفة بيطرياً.");
        return;
      }
      try {
        journalEntryId = await AccountingEngine.postEntry({
          date: hospitalDate,
          reference: `EXPENSE-VET-${Date.now().toString().slice(-4)}`,
          description: `مصاريف رعاية صحية وعلاج البقرة ${cow.tagNumber}: ${diagnosis}`,
          lines: [
            {
              accountId: Number(selectedDebitAccountId),
              debit: Number(cost),
              cursor_style: 'pointer',
              credit: 0
            },
            {
              accountId: Number(selectedCreditAccountId),
              debit: 0,
              credit: Number(cost)
            }
          ]
        } as any);

        // Add locally inside Cow Farm Financial logs
        await db.cowFarmFinancials.add({
          date: hospitalDate,
          type: 'رعاية وعلاجات بيطرية',
          amount: -Number(cost),
          journalEntryId: journalEntryId,
          notes: `سداد أتعاب طبية بقيمة ${cost} ج.م لعلاج البقرة ${cow.tagNumber}`
        });

      } catch (err: any) {
        setFormError(`فشل ترحيل قيد المصروف المحاسبي: ${err.message || err}`);
        return;
      }
    }

    const record: HealthRecord = {
      cowId: cow.id!,
      cowTag: cow.tagNumber,
      date: hospitalDate,
      diagnosis,
      treatment,
      safetyPeriodEnd: safetyPeriodEnd || undefined,
      veterinarian,
      cost: Number(cost),
      journalEntryId,
      notes
    };

    try {
      if (editingRecord && editingRecord.id) {
        await db.cowFarmHealth.update(editingRecord.id, record);
      } else {
        await db.cowFarmHealth.add(record);
      }

      // If cow is diagnosed as significantly ill, automatically flag general health status
      if (cow.healthStatus !== 'مريض' && diagnosis.toLowerCase().includes('التهاب') || diagnosis.includes('مرض') || diagnosis.includes('عرج')) {
        await db.cowFarmCows.update(cow.id!, { healthStatus: 'تحت الملاحظة' });
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      setFormError("حدث خطأ غير متوقع أثناء حفظ سجل الرعاية الطبية.");
    }
  };

  const handleDelete = async (id: number) => {
    await db.cowFarmHealth.delete(id);
    setDeleteConfirmId(null);
  };

  // Filtered logs based on search query and safety filters
  const filteredLogs = useMemo(() => {
    return healthLogs.filter(h => {
      const matchesSearch = h.cowTag.toLowerCase().includes(search.toLowerCase()) || 
                            h.diagnosis.toLowerCase().includes(search.toLowerCase()) || 
                            h.veterinarian.toLowerCase().includes(search.toLowerCase()) ||
                            (h.treatment && h.treatment.toLowerCase().includes(search.toLowerCase()));
      
      const isWithdrawnNow = h.safetyPeriodEnd && new Date(h.safetyPeriodEnd) >= new Date();
      
      if (safetyFilter === 'WITHDRAWAL') {
        return matchesSearch && isWithdrawnNow;
      } else if (safetyFilter === 'SAFE') {
        return matchesSearch && !isWithdrawnNow;
      }
      return matchesSearch;
    });
  }, [healthLogs, search, safetyFilter]);

  // Aggregate stats
  const totalCost = useMemo(() => {
    return healthLogs.reduce((acc, h) => acc + h.cost, 0);
  }, [healthLogs]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-[#fcfcfc] min-h-screen text-slate-800" dir="rtl" id="cowfarm-health">
      
      {/* Header action bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200/60 pb-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-xs mt-1 shrink-0">
            <Activity className="w-6 h-6 stroke-[2.5] text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight" id="cowfarm-health-title">الرعاية الصحية والعيادة البيطرية</h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">متابعة الفحص الدوري الدوري، حملات التحصينات الوطنية، وفترات الأمان البيطرية لحفظ جودة الحليب اللحظية.</p>
          </div>
        </div>
        
        <button 
          onClick={handleOpenAdd}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/15 duration-150 flex items-center gap-2 text-xs border-none cursor-pointer"
        >
          <Plus className="w-4 h-4" /> تسجيل فحص طبي جديد للقطيع
        </button>
      </div>

      {/* Safety / Withdrawal Period Alert Header */}
      {safetyWarnings.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-amber-50/20 border border-red-200/70 rounded-2xl p-4.5 space-y-3.5">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-650 shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
            </div>
            <div>
              <h4 className="font-black text-red-950 text-sm">تنبيه حرج جداً: فترة الأمان الحيوية نشطة بالحظيرة (Withdrawal Active)</h4>
              <p className="text-xs text-red-800 mt-1 leading-relaxed font-semibold">
                يوجد حالياً <strong className="text-sm font-black text-red-900">{safetyWarnings.length} بقرة علاجية</strong> خاضعة لتأثير المضادات الحيوية. 
                <span className="font-extrabold underline block sm:inline mr-1">يمنع منعاً باتاً ضخ أو تصدير حليب هذه الماشية لصالح عقود التوزيع العملاء</span> لتطابق اختبار الجودة.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {safetyWarnings.map((w, index) => (
              <span key={index} className="bg-white px-2.5 py-1 rounded-lg text-red-905 border border-red-200 text-[10px] font-black flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                الأرأس: {w.cowTag} - أمان ينتهي بحلول: {w.safetyPeriodEnd}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Statistics and counts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 duration-200">
          <div className="flex justify-between items-center text-slate-450 text-slate-400">
            <span className="text-xs font-bold">إجمالي التقارير والتدخلات</span>
            <FileText className="w-4.5 h-4.5" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-800 tracking-tight">{healthLogs.length}</span>
            <span className="text-xs text-slate-400 font-bold">تقرير دوري</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">سجل الحجر والعيادة بالمزرعة لعام 2026</p>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 duration-200">
          <div className="flex justify-between items-center text-red-600">
            <span className="text-xs font-bold text-slate-450 text-slate-400">عزل الحليب والماشية (أمان)</span>
            <AlertTriangle className="w-4.5 h-4.5 animate-bounce" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-black text-red-650 tracking-tight">{safetyWarnings.length}</span>
            <span className="text-xs text-slate-450 text-red-500 font-bold">رأس معزول حالياً</span>
          </div>
          <p className="text-[10px] text-red-600 mt-1 font-bold">يرجى توخي التدبير البيئي</p>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 duration-200">
          <div className="flex justify-between items-center text-amber-600">
            <span className="text-xs font-bold text-slate-450 text-slate-400">إجمالي النفقات البيطرية</span>
            <DollarSign className="w-4.5 h-4.5" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-800 tracking-tight">{totalCost.toLocaleString('ar-EG')}</span>
            <span className="text-xs text-emerald-800 font-bold">ج.م</span>
          </div>
          <p className="text-[10px] text-amber-700 mt-1 font-bold">شامل التحصينات المحلية والأدوية المركبة</p>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 duration-200">
          <div className="flex justify-between items-center text-indigo-650">
            <span className="text-xs font-bold text-slate-450 text-slate-400">أطقم الأطباء المشرفين</span>
            <User className="w-4.5 h-4.5 text-indigo-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-black text-indigo-950 tracking-tight">2</span>
            <span className="text-xs text-slate-450 font-bold">أطباء مستشارين</span>
          </div>
          <p className="text-[10px] text-indigo-700 mt-1 font-medium">سجلات تغطي فحص المناعة بانتظام</p>
        </div>

      </div>

      {/* Advanced search, status, and view mode filter bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row gap-4 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full lg:w-80">
          <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="البحث برقم البقرة، نوع المرض، التشخيص..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 focus:border-emerald-500/40 rounded-xl text-xs focus:outline-none focus:ring-4 focus:ring-emerald-555/5 transition duration-150"
          />
        </div>

        {/* Filters and View mode selectors */}
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between lg:justify-end gap-3 w-full lg:w-auto">
          
          <div className="flex flex-wrap gap-2">
            
            {/* Safety Filter Option */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">حالة فترة الأمان:</span>
              <select 
                value={safetyFilter} 
                onChange={(e) => setSafetyFilter(e.target.value as any)}
                className="bg-transparent border-none outline-none font-bold text-slate-700 cursor-pointer text-xs"
              >
                <option value="ALL">الكل</option>
                <option value="WITHDRAWAL">تحت فترة الأمان (عزل الحليب نشط) ⛔</option>
                <option value="SAFE">آمن وسليم (متاح للبيع الفوري) ✅</option>
              </select>
            </div>

          </div>

          <div className="w-px h-6 bg-slate-200 hidden lg:block"></div>

          {/* Toggle View mode */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg duration-150 flex items-center gap-1.5 text-xs font-bold cursor-pointer border-none ${
                viewMode === 'grid' 
                  ? 'bg-white text-slate-800 shadow-xs' 
                  : 'text-slate-400 hover:text-slate-600 bg-transparent'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">عرض البطاقات</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg duration-150 flex items-center gap-1.5 text-xs font-bold cursor-pointer border-none ${
                viewMode === 'table' 
                  ? 'bg-white text-slate-800 shadow-xs' 
                  : 'text-slate-400 hover:text-slate-600 bg-transparent'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">عرض جدول</span>
            </button>
          </div>

        </div>

      </div>

      {/* Primary Database Output */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-12 text-center text-slate-450 font-bold">
          لم يتم العثور على أي فحوص طبية تلبي خيارات البحث الحالية.
        </div>
      ) : viewMode === 'grid' ? (
        
        // Graphical Grid Card layouts
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredLogs.map(log => {
            const isWithdrawnNow = log.safetyPeriodEnd && new Date(log.safetyPeriodEnd) >= new Date();
            
            // Calculate remaining safety days
            let remainingDays = 0;
            if (log.safetyPeriodEnd) {
              const diffTime = new Date(log.safetyPeriodEnd).getTime() - new Date().getTime();
              remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }

            return (
              <div 
                key={log.id} 
                className="bg-white rounded-3xl border border-slate-200/95 overflow-hidden shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col justify-between"
                id={`medical-card-${log.id}`}
              >
                {/* Visual Accent top line according to safety */}
                <div className="relative p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center overflow-hidden">
                  <span className={`absolute top-0 right-0 left-0 h-1.5 ${
                    isWithdrawnNow ? 'bg-red-500' : 'bg-emerald-500'
                  }`} />
                  
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isWithdrawnNow ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      <Activity className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">رقم الأرأس</span>
                      <span className="font-mono font-black text-slate-900 text-sm tracking-wide">COW-{log.cowTag}</span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg ${
                    isWithdrawnNow 
                      ? 'bg-red-50 text-red-700 border border-red-100/65 animate-pulse' 
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-100/65'
                  }`}>
                    {isWithdrawnNow ? 'عزل الحلب نشط ⛔' : 'آمن وقابل للحلابة ✅'}
                  </span>
                </div>

                {/* Attributes block */}
                <div className="p-5 space-y-4 text-xs flex-1 bg-white">
                  
                  {/* Diagnosis Card Section */}
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold block text-[10px]">الحالة والتشخيص</span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2" title={log.diagnosis}>
                      {log.diagnosis}
                    </h3>
                  </div>

                  {/* Treatment Card Section */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 hover:bg-slate-100/25 transition">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      <span className="font-black text-slate-500 text-[10px]">الخطة العلاجية المقررة:</span>
                    </div>
                    <p className="text-slate-650 text-xs leading-relaxed font-semibold line-clamp-3" title={log.treatment}>
                      {log.treatment}
                    </p>
                  </div>

                  {/* Safety Period details */}
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-slate-400 font-bold block text-[10px] mb-2">موقف الاستهلاك الحالي:</span>
                    {log.safetyPeriodEnd ? (
                      <div className={`p-3 rounded-2xl border flex flex-col gap-2 ${
                        isWithdrawnNow 
                          ? 'bg-amber-50/50 border-amber-200/60 text-amber-900' 
                          : 'bg-slate-50 border-slate-200 text-slate-550'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[10px]">
                            {isWithdrawnNow ? 'فترة الحظر النشطة:' : 'تاريخ زوال الأثر:'}
                          </span>
                          <span className="font-mono font-black text-xs leading-none">{log.safetyPeriodEnd}</span>
                        </div>
                        {isWithdrawnNow && remainingDays > 0 && (
                          <div className="flex items-center justify-between text-[10px] bg-white px-2.5 py-1 rounded-xl border border-amber-200/40 shadow-2xs font-bold text-amber-700">
                            <span>متبقي على نزع الأثر:</span>
                            <span>{remainingDays} يوماً دقيقاً</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-emerald-700 text-[11px] font-semibold flex items-center gap-1.5 bg-emerald-50/70 py-2.5 px-3 rounded-2xl border border-emerald-100/60 w-full">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/10 shrink-0" />
                        المنتج آمن تماماً للاستهلاك الآدمي
                      </span>
                    )}
                  </div>

                  {/* Meta Group: doctor & date in beautiful split layout */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                    <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
                      <span className="text-slate-400 block text-[9px] font-bold">الطبيب المشرف</span>
                      <p className="font-bold text-slate-800 text-xs truncate mt-0.5" title={log.veterinarian}>
                        {log.veterinarian}
                      </p>
                    </div>
                    <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
                      <span className="text-slate-400 block text-[9px] font-bold">تاريخ الدخول</span>
                      <p className="font-bold text-slate-850 text-xs mt-0.5">{log.date}</p>
                    </div>
                  </div>

                  {/* Journal dynamic audit info */}
                  {log.journalEntryId && (
                    <div className="flex justify-between items-center text-[10px] bg-indigo-50/50 p-2 rounded-xl border border-indigo-100/40">
                      <span className="text-indigo-950 font-bold">قيد الدفتر العام التلقائي:</span>
                      <span className="font-mono text-indigo-805 font-black bg-indigo-100 px-2 py-0.5 rounded-lg border border-indigo-200/30">
                        #{log.journalEntryId}
                      </span>
                    </div>
                  )}

                  {/* Notes Alert box */}
                  {log.notes && (
                    <div className="bg-amber-50/40 text-[10px] text-amber-800 p-2.5 rounded-xl border border-amber-100/50 leading-relaxed font-medium">
                      <span className="font-bold text-amber-700 block text-[9px] mb-0.5">تنبيهات بيطرية واستثنائية:</span>
                      {log.notes}
                    </div>
                  )}

                  {/* Cost Indicator Badge split */}
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                    <span className="text-slate-550 text-[10px] font-bold">تكلفة التدخل البيطري:</span>
                    <span className="text-xs font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200/50">
                      {log.cost.toLocaleString('ar-EG')} ج.م
                    </span>
                  </div>

                </div>

                {/* Card action controls */}
                <div className="p-4 border-t border-slate-105 bg-slate-50/40 flex gap-2.5">
                  <button 
                    onClick={() => handleOpenEdit(log)}
                    className="flex-1 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-extrabold flex items-center justify-center gap-1.5 text-xs cursor-pointer bg-white shadow-3xs hover:bg-slate-100 transition duration-150 font-black"
                  >
                    <Edit className="w-3.5 h-3.5" /> تعديل الملاحظة
                  </button>
                  <button 
                    onClick={() => setDeleteConfirmId(log.id || null)}
                    className="p-1.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-500 duration-150 text-xs cursor-pointer bg-white shadow-3xs hover:border-red-300"
                    title="حذف الفحص"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        
        // Dynamic table listing
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 font-bold text-xs">
                  <th className="py-3 px-4 font-bold text-slate-600">رقم البقرة (الرأس)</th>
                  <th className="py-3 px-4 font-bold text-slate-600">تاريخ الكشف</th>
                  <th className="py-3 px-4 font-bold text-slate-600">التشخيص المرضي</th>
                  <th className="py-3 px-4 font-bold text-slate-600">الجرعات والعلاج</th>
                  <th className="py-3 px-4 font-bold text-red-700">تاريخ انتهاء الأمان (السحب)</th>
                  <th className="py-3 px-4 font-bold text-slate-600">الطبيب البيطري</th>
                  <th className="py-3 px-4 font-bold text-slate-600">التكلفة والترحيل المحاسبي</th>
                  <th className="py-3 px-4 font-bold text-slate-600 text-left pl-6">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => {
                  const isWithdrawnNow = log.safetyPeriodEnd && new Date(log.safetyPeriodEnd) >= new Date();
                  
                  return (
                    <tr key={log.id} className={`hover:bg-slate-50/50 transition-colors ${isWithdrawnNow ? 'bg-red-50/10' : ''}`}>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{log.cowTag}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">{log.date}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-700">{log.diagnosis}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 max-w-[200px] truncate" title={log.treatment}>
                        {log.treatment}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {log.safetyPeriodEnd ? (
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            isWithdrawnNow ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-slate-50 text-slate-550 border border-slate-205'
                          }`}>
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {log.safetyPeriodEnd} {isWithdrawnNow ? '(نشط)' : '(منتهي)'}
                          </span>
                        ) : (
                          <span className="text-emerald-700 text-xs font-bold inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> آمنة فوراً
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{log.veterinarian}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800">{log.cost} ج.م</span>
                        {log.journalEntryId && (
                          <span className="block text-[9px] bg-indigo-50 text-indigo-700 rounded px-1.5 py-0.5 mt-0.5 font-bold text-center">
                            المالية: #{log.journalEntryId}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-left pl-6">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenEdit(log)}
                            className="py-1 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg text-xs duration-100 flex items-center gap-1 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" /> تعديل
                          </button>
                          <button 
                            onClick={() => setDeleteConfirmId(log.id || null)}
                            className="p-1 rounded-lg border border-red-100 hover:bg-red-55 text-red-500 duration-100 cursor-pointer bg-white"
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

      {/* Breeding advisory / informational card */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-indigo-550 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h5 className="text-xs font-black text-slate-800">إرشادات هامة حول فترات أمان الحليب واللحوم بالمزرعة</h5>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            تنص اللائحة التنفيذية للأمان الاستهلاكي على فرض مراقبة ذاتية على كميات الحليب المستخرجة من الأبقار المعالجة بمضادات الالتهابات والديدان لضمان خلو الحليب من العناصر الكيمائية. يرجى تدوين تواريخ السحب بدقة وسكب حليب هذه الماشية أو تغذيته للمواليد غير المخصصة للبيع الفوري.
          </p>
        </div>
      </div>

      {/* Record medical checkup popup modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in duration-150">
            
            {/* Modal Header */}
            <div className="p-6 bg-emerald-800 text-white flex justify-between items-center relative">
              <span className="absolute top-0 right-0 left-0 h-1 bg-white/10" />
              <div>
                <h3 className="text-lg font-black tracking-tight">
                  {editingRecord ? 'تحديث تقرير الفحص والتدخل البيطري' : 'تسجيل فحص وعلاج بيطري'}
                </h3>
                <p className="text-xs text-emerald-100 mt-1">تتبع تحصينات الأوبئة، الأدوية، وحجز الحليب لحالة أمنة للقطيع.</p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border-none cursor-pointer duration-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content container */}
            <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
              
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2 animate-pulse">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="font-bold">{formError}</span>
                </div>
              )}

              {/* Select Cow */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">البقرة / رأس الماشية المراد فحصها *</label>
                <select
                  required
                  disabled={editingRecord !== null}
                  value={selectedCowId}
                  onChange={(e) => setSelectedCowId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition duration-100 text-slate-700 font-bold"
                >
                  <option value="">-- اختر رقم رأس البقرة --</option>
                  {cows.map(c => (
                    <option key={c.id} value={c.id}>{c.tagNumber} [{c.breed}] (الوضع: {c.healthStatus})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Hospital Date */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">تاريخ الكشف والتحصين *</label>
                  <input 
                    type="date"
                    required
                    value={hospitalDate}
                    onChange={(e) => setHospitalDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition font-bold text-slate-700"
                  />
                </div>

                {/* Vet Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">الطبيب البيطري المعالج *</label>
                  <input 
                    type="text"
                    required
                    value={veterinarian}
                    onChange={(e) => setVeterinarian(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition text-slate-700 font-semibold"
                  />
                </div>

              </div>

              {/* Diagnosis */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">التشخيص الطبي أو المرضي الفعلي *</label>
                <input 
                  type="text"
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="مثال: تحصين وطني، التهاب ضوع، حمى الحليب"
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition text-slate-700 font-bold"
                />
              </div>

              {/* Treatment */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">العقاقير والأدوية والجرعة الموصوفة *</label>
                <textarea 
                  rows={2}
                  required
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  placeholder="مثال: 2 مل عبر الجلد ميبفاك للتحصين أو بنسلين 30 مل بالقرن..."
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition text-slate-600 font-medium"
                />
              </div>

              {/* Safety Period (Withdrawal End Date) */}
              <div className="space-y-1 border-t border-slate-100 pt-4">
                <label className="text-xs font-black text-red-600 flex items-center gap-1 block">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  تاريخ انتهاء فترة سحب الدواء / أمان الحليب (إن وجد)
                </label>
                <input 
                  type="date"
                  value={safetyPeriodEnd}
                  onChange={(e) => setSafetyPeriodEnd(e.target.value)}
                  className="w-full px-3 py-2 bg-red-50/20 focus:bg-white border border-red-205 rounded-xl text-xs sm:text-sm focus:outline-none font-bold text-red-800"
                />
                <p className="text-[10px] text-slate-400 font-medium">اتركه فارغاً إذا كان هذا الفحص دورياً أو للتحصينات الوطنية الخالية من فترات العزل.</p>
              </div>

              {/* Treatment Cost */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">تكلفة الكشف والأدوية والخدمة البيطرية (ج.م) *</label>
                <input 
                  type="number"
                  min="0"
                  required
                  value={cost}
                  onChange={(e) => setCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition font-black text-rose-700"
                />
              </div>

              {/* Accounting Ledger integration checkboxes for NEW records only */}
              {!editingRecord && cost > 0 && (
                <div className="bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100/70 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={postToLedger} 
                      onChange={(e) => setPostToLedger(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-650 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-black text-indigo-950">ترصيد مصروف الكشف وإنشاء قيد مالي تلقائي</span>
                  </label>

                  {postToLedger && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-500 block">حساب المصروف المدين *</label>
                        <select
                          required
                          value={selectedDebitAccountId}
                          onChange={(e) => setSelectedDebitAccountId(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                        >
                          <option value="">-- اختر حساب المصروف --</option>
                          {accountsPreset.expenseAccs.map(a => (
                            <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-500 block">حساب الخزينة الدائن *</label>
                        <select
                          required
                          value={selectedCreditAccountId}
                          onChange={(e) => setSelectedCreditAccountId(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                        >
                          <option value="">-- اختر حساب الخزينة --</option>
                          {accountsPreset.assetAccs.map(a => (
                            <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">ملاحظات بيطرية / تغذوية هامة</label>
                <input 
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: يرجى تقديم مياه وفيرة مع حظر الحلابة لمصنع الألبان..."
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition text-slate-700 font-medium"
                />
              </div>

            </div>

            {/* Modal actions */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-200 text-slate-500 hover:text-slate-850 font-bold rounded-xl text-xs sm:text-sm cursor-pointer duration-100 bg-white"
              >
                إلغاء الأمر
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-emerald-700/10 cursor-pointer border-none"
              >
                <Save className="w-4 h-4" /> حفظ تقرير الفحص الطبي
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
              <h3 className="text-base font-black text-slate-900">حذف تقرير الفحص الطبي نهائياً؟</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                هل أنت متأكد من رغبتك في إزالة هذا الفحص الطبي؟ لا يمكن استعادة البيانات المحذوفة عقب هذا التحصين.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 bg-slate-105 hover:bg-slate-200 text-slate-600 hover:text-slate-800 font-bold rounded-xl text-xs cursor-pointer border-none bg-slate-100"
              >
                رجوع وإلغاء
              </button>
              <button 
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                className="flex-1 py-2 bg-red-605 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs cursor-pointer border-none"
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
