import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { 
  Calendar, ArrowUpRight, ArrowDownRight, Printer, 
  Search, Filter, DollarSign, Wallet, Landmark, RefreshCw,
  FileText, CheckCircle, SlidersHorizontal, Plus, AlertTriangle, 
  Sparkles, TrendingUp, Info, Activity, ClipboardList, TrendingDown,
  Scale, Coffee, HeartPulse, Sparkle, Trash2, BookOpen, Layers
} from 'lucide-react';
import { ResponsiveContainer, ComposedChart, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { AccountingEngine } from '../../services/AccountingEngine';
import toast, { Toaster } from 'react-hot-toast';

interface FarmFinancialRecord {
  id?: number;
  date: string;
  type: string; // 'مبيعات حليب' | 'شراء أعلاف وتغذية' | 'رعاية وعلاجات بيطرية' | 'تسويات وحركات عامة'
  amount: number; // Positive for sales, negative for purchases/expenses
  journalEntryId?: number; // Linked accounting transaction
  notes?: string;
}

export default function CowFarmFinancials() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'milk' | 'feed' | 'health' | 'ledger' | 'posting'>('dashboard');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Manual Posting Form State
  const [entryType, setEntryType] = useState<'revenue' | 'expense'>('expense');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryCategory, setEntryCategory] = useState('شراء أعلاف وتغذية');
  const [entryAmount, setEntryAmount] = useState<number | ''>('');
  const [entryNotes, setEntryNotes] = useState('');
  const [selectedDebitAccountId, setSelectedDebitAccountId] = useState<number | ''>('');
  const [selectedCreditAccountId, setSelectedCreditAccountId] = useState<number | ''>('');
  const [isPostingToLedger, setIsPostingToLedger] = useState(true);
  const [postingError, setPostingError] = useState('');

  // Deletion Confirmation Overlay State
  const [confirmDeleteRecord, setConfirmDeleteRecord] = useState<FarmFinancialRecord | null>(null);

  // Queries
  const financials = useLiveQuery(() => db.cowFarmFinancials.toArray()) || [];
  const milkProduction = useLiveQuery(() => db.cowFarmMilkProduction.toArray()) || [];
  const feedingSessions = useLiveQuery(() => db.cowFarmFeeding.toArray()) || [];
  const healthLogs = useLiveQuery(() => db.cowFarmHealth.toArray()) || [];
  const feedStock = useLiveQuery(() => db.cowFarmFeedStock.toArray()) || [];
  const accounts = useLiveQuery(() => db.accounts.toArray()) || [];

  // Account groupings for presets
  const accountsPreset = useMemo(() => {
    const expenseAccs = accounts.filter(a => a.type?.toLowerCase() === 'expense' || a.code?.startsWith('5') || a.name?.includes('مصروف') || a.name?.includes('أعلاف') || a.name?.includes('رعاية') || a.name?.includes('بيطر') || a.name?.includes('تشغيل'));
    const assetAccs = accounts.filter(a => a.type?.toLowerCase() === 'asset' || a.name?.includes('صندوق') || a.name?.includes('الخزينة') || a.name?.includes('بنك') || a.name?.includes('نقدية'));
    const revenueAccs = accounts.filter(a => a.type?.toLowerCase() === 'revenue' || a.code?.startsWith('4') || a.name?.includes('إيرادات') || a.name?.includes('مبيعات') || a.name?.includes('نشاط'));
    return { expenseAccs, assetAccs, revenueAccs };
  }, [accounts]);

  // Handle Preset updates on entry type change
  const handleEntryTypeChange = (type: 'revenue' | 'expense') => {
    setEntryType(type);
    setPostingError('');
    if (type === 'revenue') {
      setEntryCategory('مبيعات حليب');
      // Cash/Treasury Debit, Sales Revenue Credit
      const debitAcc = accountsPreset.assetAccs.find(a => a.name?.includes('صندوق') || a.name?.includes('الخزينة')) || accountsPreset.assetAccs[0];
      const creditAcc = accountsPreset.revenueAccs.find(a => a.name?.includes('مبيعات') || a.name?.includes('إيرادات')) || accountsPreset.revenueAccs[0];
      if (debitAcc) setSelectedDebitAccountId(debitAcc.id!);
      if (creditAcc) setSelectedCreditAccountId(creditAcc.id!);
    } else {
      setEntryCategory('شراء أعلاف وتغذية');
      // Expense Debit, Treasury Credit
      const debitAcc = accountsPreset.expenseAccs.find(a => a.name?.includes('أعلاف') || a.name?.includes('علف') || a.name?.includes('مصروف')) || accountsPreset.expenseAccs[0];
      const creditAcc = accountsPreset.assetAccs.find(a => a.name?.includes('صندوق') || a.name?.includes('الخزينة')) || accountsPreset.assetAccs[0];
      if (debitAcc) setSelectedDebitAccountId(debitAcc.id!);
      if (creditAcc) setSelectedCreditAccountId(creditAcc.id!);
    }
  };

  // Pre-set accounts automatically upon entry category updates
  const handleCategoryChange = (cat: string) => {
    setEntryCategory(cat);
    setPostingError('');
    if (entryType === 'expense') {
      if (cat === 'رعاية وعلاجات بيطرية') {
        const vetAcc = accountsPreset.expenseAccs.find(a => a.name?.includes('بيطر') || a.name?.includes('علاج') || a.name?.includes('طب')) || accountsPreset.expenseAccs[0];
        if (vetAcc) setSelectedDebitAccountId(vetAcc.id!);
      } else {
        const feedAcc = accountsPreset.expenseAccs.find(a => a.name?.includes('أعلاف') || a.name?.includes('علف')) || accountsPreset.expenseAccs[0];
        if (feedAcc) setSelectedDebitAccountId(feedAcc.id!);
      }
    }
  };

  // Computations
  const totalRevenue = useMemo(() => {
    return financials
      .filter(f => f.amount > 0)
      .reduce((sum, f) => sum + f.amount, 0);
  }, [financials]);

  const totalExpenses = useMemo(() => {
    return financials
      .filter(f => f.amount < 0)
      .reduce((sum, f) => sum + Math.abs(f.amount), 0);
  }, [financials]);

  const netIncome = totalRevenue - totalExpenses;

  // Breakdown metrics
  const milkRevenueTotal = useMemo(() => {
    return financials
      .filter(f => f.type === 'مبيعات حليب' && f.amount > 0)
      .reduce((sum, f) => sum + f.amount, 0);
  }, [financials]);

  const feedExpensesTotal = useMemo(() => {
    return financials
      .filter(f => f.type === 'شراء أعلاف وتغذية' && f.amount < 0)
      .reduce((sum, f) => sum + Math.abs(f.amount), 0);
  }, [financials]);

  const medicalExpensesTotal = useMemo(() => {
    return financials
      .filter(f => f.type === 'رعاية وعلاجات بيطرية' && f.amount < 0)
      .reduce((sum, f) => sum + Math.abs(f.amount), 0);
  }, [financials]);

  // Integrated Milk Yield Performance Report Metric calculations
  const totalMilkCollectedLiters = useMemo(() => {
    return milkProduction.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
  }, [milkProduction]);

  const projectedMilkRevenueValueOption = useMemo(() => {
    // Standard wholesale local price of cow milk per liter is around 25 EGP
    const valuePerLiter = 25;
    return totalMilkCollectedLiters * valuePerLiter;
  }, [totalMilkCollectedLiters]);

  // Food Supply Insight Metrics
  const totalFeedsDistributedKg = useMemo(() => {
    return feedingSessions.reduce((sum, f) => sum + Number(f.quantity || 0), 0);
  }, [feedingSessions]);

  const currentBinsSiloCapacityKg = useMemo(() => {
    return feedStock.reduce((sum, s) => sum + Number(s.stock || 0), 0);
  }, [feedStock]);

  // Clinical Medical Expenses Audit
  const totalHealthInterventionsCount = healthLogs.length;
  const recordedHealthLogsCostsSelfSum = useMemo(() => {
    return healthLogs.reduce((sum, h) => sum + (Number(h.cost) || 0), 0);
  }, [healthLogs]);

  const topDiagnosedIllnessName = useMemo(() => {
    if (healthLogs.length === 0) return 'لا يوجد تشخيصات حالياً';
    const counts: { [key: string]: number } = {};
    healthLogs.forEach(h => {
      counts[h.diagnosis] = (counts[h.diagnosis] || 0) + 1;
    });
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }, [healthLogs]);

  // 15-Day Consolidated Chart Data
  const sparklineChartSequence = useMemo(() => {
    const dates = Array.from({ length: 15 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return dates.map(d => {
      const dayLogs = financials.filter(f => f.date === d);
      const rev = dayLogs.filter(f => f.amount > 0).reduce((sum, r) => sum + r.amount, 0);
      const exp = dayLogs.filter(f => f.amount < 0).reduce((sum, r) => sum + Math.abs(r.amount), 0);
      const dayName = new Date(d).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
      return {
        dateString: dayName,
        "الإيرادات": rev,
        "النفقات والتشغيل": exp,
        "صافي الوفر الفعلي": rev - exp
      };
    });
  }, [financials]);

  // Filtered operational ledger list
  const filteredFinancials = useMemo(() => {
    return financials.filter(f => {
      const matchesType = typeFilter === 'ALL' || f.type === typeFilter;
      const matchesSearch = !search || 
        f.notes?.toLowerCase().includes(search.toLowerCase()) || 
        f.type.toLowerCase().includes(search.toLowerCase()) ||
        f.journalEntryId?.toString().includes(search);
      return matchesType && matchesSearch;
    });
  }, [financials, typeFilter, search]);

  // Double entry posting engine executor
  const handlePerformPosting = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostingError('');

    if (!entryAmount || Number(entryAmount) <= 0) {
      setPostingError('يرجى تحديد قياس كمية مالية صالحة كقيمة مدخلة للدفاتر.');
      return;
    }

    let journalId: number | undefined = undefined;

    if (isPostingToLedger) {
      if (!selectedDebitAccountId || !selectedCreditAccountId) {
        setPostingError('عذراً، لإصدار قيد مزدوج ترحيلي متزامن، يرجى ملء حسابات المدين والدائن من القائمة المنسدلة.');
        return;
      }

      try {
        const val = Number(entryAmount);
        const debitAccObj = accounts.find(a => a.id === Number(selectedDebitAccountId));
        const creditAccObj = accounts.find(a => a.id === Number(selectedCreditAccountId));

        journalId = await AccountingEngine.postEntry({
          date: new Date(entryDate),
          reference: `FARM-MANUAL-${Date.now().toString().slice(-4)}`,
          description: `تسوية حسابات المزرعة [${entryCategory}] - البيان المالي: ${entryNotes || 'حركة عامة تم قيدها يدوياً'}`,
          lines: [
            {
              accountId: Number(selectedDebitAccountId),
              accountName: debitAccObj?.name || 'حساب مدين',
              debit: val,
              credit: 0
            },
            {
              accountId: Number(selectedCreditAccountId),
              accountName: creditAccObj?.name || 'حساب دائن',
              debit: 0,
              credit: val
            }
          ]
        });
      } catch (err: any) {
        setPostingError(`فشل تدوين القيد المحاسبي بالنظام العام: ${err.message || err}`);
        return;
      }
    }

    try {
      const netAmount = entryType === 'revenue' ? Number(entryAmount) : -Number(entryAmount);
      
      await db.cowFarmFinancials.add({
        date: entryDate,
        type: entryCategory,
        amount: netAmount,
        journalEntryId: journalId,
        notes: entryNotes.trim() || `تسوية حركة [${entryCategory}] يدوية`
      });

      toast.success(`تم بنجاح ترحيل واعتماد الحركة بقيمة ${Number(entryAmount).toLocaleString()} ج.م وتحصين الدفاتر المساعدة!`);
      
      // Reset
      setEntryAmount('');
      setEntryNotes('');
      setActiveTab('dashboard');
    } catch (err) {
      console.error(err);
      toast.error('حدث عطل محلي أثناء إدراج حركة التسوية بالخزينة.');
    }
  };

  const handleDeleteTransaction = async () => {
    if (!confirmDeleteRecord) return;
    try {
      await db.cowFarmFinancials.delete(confirmDeleteRecord.id!);
      toast.success('تم استبعاد الحركة وتصحيح الدفاتر المساعدة بنجاح.');
    } catch (err) {
      toast.error('حدث عطل فني محلي أثناء حذف السجل.');
    }
    setConfirmDeleteRecord(null);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full max-w-none space-y-8 bg-slate-50/40 text-slate-800 min-h-screen font-sans" dir="rtl" id="cowfarm-financials-hub">
      <Toaster position="top-left" reverseOrder={true} />

      {/* Elegant Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/80 pb-4.5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 text-[10px] sm:text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-200/50 rounded-xl inline-flex items-center gap-1.5 shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              مركز التحليلات المالية المتكاملة
            </span>
            <span className="px-2.5 py-1 text-[10px] sm:text-xs font-black text-slate-600 bg-slate-100 border border-slate-200/80 rounded-xl inline-flex items-center gap-1 shadow-xs">
              الدفاتر المحاسبية المساعدة للباقة البقرية 🐄
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            مستودع المزرعة والتقارير المالية
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-3xl font-semibold">
            لوحة قياس دقيقة مقسمة حسب الفتحات المحاسبية للألبان والتغذية والتكاليف البيطرية للقطيع بمطابقة القيد المزدوج العام.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-black rounded-2xl text-sm sm:text-base flex items-center gap-2.5 transition shadow-sm border-2 border-slate-200 shrink-0 cursor-pointer"
        >
          <Printer className="w-5 h-5 text-emerald-700 stroke-[2.5]" /> طباعة التقارير الموحدة
        </button>
      </div>

      {/* Advanced Tab Navigation Grid - Sleek, Compact and perfectly sized */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 bg-slate-100/50 p-2 rounded-2xl border border-slate-200/70">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer text-right flex flex-col justify-between min-h-[88px] sm:min-h-[94px] shadow-xs ${
            activeTab === 'dashboard' 
              ? 'bg-emerald-800 text-white shadow-sm scale-[1.01]' 
              : 'bg-white hover:bg-slate-50 border border-slate-205/60 text-slate-700'
          }`}
        >
          <div className="flex justify-between items-center w-full">
            <TrendingUp className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'dashboard' ? 'text-emerald-200' : 'text-emerald-700'}`} />
            <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded ${activeTab === 'dashboard' ? 'bg-white/15 text-emerald-300' : 'bg-emerald-50 text-emerald-800'}`}>رئيسية</span>
          </div>
          <div className="mt-2 space-y-0.5">
            <div className="text-[11px] sm:text-xs font-bold truncate">الأرباح والتحليلات</div>
            <div className="text-xs sm:text-sm lg:text-base font-black font-mono">{netIncome >= 0 ? '+' : ''}{netIncome.toLocaleString()} ج.م</div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('milk')}
          className={`p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer text-right flex flex-col justify-between min-h-[88px] sm:min-h-[94px] shadow-xs ${
            activeTab === 'milk' 
              ? 'bg-emerald-800 text-white shadow-sm scale-[1.01]' 
              : 'bg-white hover:bg-slate-50 border border-slate-205/60 text-slate-700'
          }`}
        >
          <div className="flex justify-between items-center w-full">
            <Activity className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'milk' ? 'text-sky-300' : 'text-sky-600'}`} />
            <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded ${activeTab === 'milk' ? 'bg-white/15 text-sky-200' : 'bg-sky-50 text-sky-800'}`}>ألبان</span>
          </div>
          <div className="mt-2 space-y-0.5">
            <div className="text-[11px] sm:text-xs font-bold truncate">إنتاج ومبيعات الحليب</div>
            <div className="text-xs sm:text-sm lg:text-base font-black font-mono">{totalMilkCollectedLiters.toLocaleString()} لتر</div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('feed')}
          className={`p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer text-right flex flex-col justify-between min-h-[88px] sm:min-h-[94px] shadow-xs ${
            activeTab === 'feed' 
              ? 'bg-emerald-800 text-white shadow-sm scale-[1.01]' 
              : 'bg-white hover:bg-slate-50 border border-slate-205/60 text-slate-700'
          }`}
        >
          <div className="flex justify-between items-center w-full">
            <Coffee className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'feed' ? 'text-amber-300' : 'text-amber-600'}`} />
            <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded ${activeTab === 'feed' ? 'bg-white/15 text-amber-200' : 'bg-amber-50 text-amber-900'}`}>تغذية</span>
          </div>
          <div className="mt-2 space-y-0.5">
            <div className="text-[11px] sm:text-xs font-bold truncate">تكاليف واستهلاك الأعلاف</div>
            <div className="text-xs sm:text-sm lg:text-base font-black font-mono">{currentBinsSiloCapacityKg.toLocaleString()} كجم</div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('health')}
          className={`p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer text-right flex flex-col justify-between min-h-[88px] sm:min-h-[94px] shadow-xs ${
            activeTab === 'health' 
              ? 'bg-rose-905 bg-rose-900 text-white shadow-sm scale-[1.01]' 
              : 'bg-white hover:bg-slate-50 border border-slate-205/60 text-slate-700'
          }`}
        >
          <div className="flex justify-between items-center w-full">
            <HeartPulse className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'health' ? 'text-rose-300' : 'text-rose-600'}`} />
            <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded ${activeTab === 'health' ? 'bg-white/15 text-rose-300' : 'bg-rose-50 text-rose-950'}`}>عيادة</span>
          </div>
          <div className="mt-2 space-y-0.5">
            <div className="text-[11px] sm:text-xs font-bold truncate">الكلفة والعلاجات البيطرية</div>
            <div className="text-xs sm:text-sm lg:text-base font-black font-mono">{totalHealthInterventionsCount} جلسة</div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer text-right flex flex-col justify-between min-h-[88px] sm:min-h-[94px] shadow-xs ${
            activeTab === 'ledger' 
              ? 'bg-slate-900 text-white shadow-sm scale-[1.01]' 
              : 'bg-white hover:bg-slate-50 border border-slate-205/60 text-slate-700'
          }`}
        >
          <div className="flex justify-between items-center w-full">
            <ClipboardList className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'ledger' ? 'text-slate-300' : 'text-slate-600'}`} />
            <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded ${activeTab === 'ledger' ? 'bg-white/15 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>الخزينة</span>
          </div>
          <div className="mt-2 space-y-0.5">
            <div className="text-[11px] sm:text-xs font-bold truncate">اليومية التفصيلية</div>
            <div className="text-xs sm:text-sm lg:text-base font-black font-mono">{financials.length} حركة</div>
          </div>
        </button>

        <button
          onClick={() => {
            handleEntryTypeChange('expense');
            setActiveTab('posting');
          }}
          className={`p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer text-right flex flex-col justify-between min-h-[88px] sm:min-h-[94px] shadow-xs ${
            activeTab === 'posting' 
              ? 'bg-indigo-700 text-white shadow-sm scale-[1.01]' 
              : 'bg-white hover:bg-slate-50 border border-slate-205/60 text-slate-700'
          }`}
        >
          <div className="flex justify-between items-center w-full">
            <Landmark className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'posting' ? 'text-indigo-200' : 'text-indigo-700'}`} />
            <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded ${activeTab === 'posting' ? 'bg-white/15 text-indigo-200' : 'bg-indigo-50 text-indigo-900'}`}>تسوية</span>
          </div>
          <div className="mt-2 space-y-0.5">
            <div className="text-[11px] sm:text-xs font-bold truncate">تسوية القيود والترحيل</div>
            <div className="text-[9px] text-slate-400 font-extrabold">تحويل متزامن</div>
          </div>
        </button>
      </div>

      {/* Tabs Content */}
      
      {/* 1. Dashboard Tab - Redesigned Into Bento Grid to Eliminate Unnecessary Empty Space */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch animate-in fade-in duration-200">
          
          {/* Left Column: Chart - lg:col-span-8 */}
          <div className="lg:col-span-8 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-5">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                منحنى الأداء والوفر المالي اليومي للقطيع (آخر 15 يوماً)
              </h3>
              <p className="text-xs text-slate-400 font-bold leading-relaxed">مقارنة بصرية واضحة بين الإيرادات المحصلة والإنفاق الفعلي بالمواد والعيادة</p>
            </div>

            <div className="w-full h-[450px] pt-2" dir="ltr">
              {sparklineChartSequence.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                  لا توجد حركات مالية كافية بالدفاتر لتوليد المنحنى.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={sparklineChartSequence}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="dateString" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} stroke="#cbd5e1" />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" />
                    <Tooltip contentStyle={{ direction: 'rtl', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '10.5px' }} />
                    <Legend wrapperStyle={{ fontSize: '10.5px', fontWeight: 'bold' }} />
                    <Bar dataKey="الإيرادات" fill="#10b981" radius={[3, 3, 0, 0]} barSize={24} />
                    <Bar dataKey="النفقات والتشغيل" fill="#ef4444" radius={[3, 3, 0, 0]} barSize={24} />
                    <Line type="monotone" dataKey="صافي الوفر الفعلي" stroke="#0f172a" strokeWidth={3} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Right Column: Key Metric Cards stacked vertically & Expert Advisory Panel - lg:col-span-4 */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-5">
            
            {/* Card 1 */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex justify-between items-center relative overflow-hidden flex-1 min-h-[115px]">
              <div className="space-y-1">
                <span className="text-xs sm:text-sm text-slate-500 font-extrabold block">إجمالي إيرادات المزرعة المسندة</span>
                <span className="text-2xl sm:text-3xl lg:text-4xl font-mono font-black text-emerald-700 leading-none block">
                  {totalRevenue.toLocaleString()} <span className="text-sm sm:text-base font-black text-emerald-800">ج.م</span>
                </span>
                <span className="text-[11px] sm:text-xs text-slate-600 block font-semibold mt-1">مبيعات حليب: {milkRevenueTotal.toLocaleString()} ج.م</span>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl shrink-0">
                <ArrowUpRight className="w-5.5 h-5.5 stroke-[2.5]" />
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex justify-between items-center relative overflow-hidden flex-1 min-h-[115px]">
              <div className="space-y-1">
                <span className="text-xs sm:text-sm text-slate-500 font-extrabold block">نفقات تشغيلية وعلاقات بيطرية</span>
                <span className="text-2xl sm:text-3xl lg:text-4xl font-mono font-black text-rose-600 leading-none block">
                  {totalExpenses.toLocaleString()} <span className="text-sm sm:text-base font-black text-rose-600">ج.م</span>
                </span>
                <span className="text-[11px] sm:text-xs text-slate-605 block font-semibold mt-1">تغذية: {feedExpensesTotal.toLocaleString()} ج.م • علاج: {medicalExpensesTotal.toLocaleString()} ج.م</span>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl shrink-0">
                <ArrowDownRight className="w-5.5 h-5.5 stroke-[2.5]" />
              </div>
            </div>

            {/* Card 3 */}
            <div className={`p-5 sm:p-6 rounded-3xl border transition relative overflow-hidden flex justify-between items-center flex-1 min-h-[115px] ${
              netIncome >= 0 ? "bg-slate-900 text-white border-slate-950 shadow-xs" : "bg-rose-950 text-white border-rose-950 shadow-xs"
            }`}>
              <div className="space-y-1">
                <span className="text-xs sm:text-sm text-slate-300 font-extrabold block">صافي الأرباح ووفورات المربّي</span>
                <span className="text-2xl sm:text-3xl lg:text-4xl font-mono font-black leading-none block">
                  {netIncome.toLocaleString()} <span className="text-sm sm:text-base font-bold">ج.م</span>
                </span>
                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] sm:text-xs font-black inline-block mt-1 ${netIncome >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                  {netIncome >= 0 ? 'فائض وتراكم مستمر 📈' : 'عجز مرحلي يحتاج ترشيد ⚠️'}
                </span>
              </div>
              <div className="p-3 bg-white/10 text-white rounded-2xl shrink-0">
                <Wallet className="w-5.5 h-5.5" />
              </div>
            </div>

            {/* Expert Advisory Panel Integrated on Side for High Density */}
            <div className="p-7 rounded-3xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-emerald-50 border border-emerald-800/20 space-y-3 flex-1 flex flex-col justify-center min-h-[125px]">
              <h4 className="text-sm sm:text-base font-black text-emerald-200 flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 fill-emerald-200" /> الإرشاد المالي والتوجيه الذكي
              </h4>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-bold">
                {netIncome >= 0 
                  ? "تسجيل كفاءة إيجابية للمزرعة. ينصح باستغلال الفائض المالي المسجل في صيانة الحظائر وتأمين لقاحات بيطرية لتفادي أزمات الموسم."
                  : "معدل الصرف يفوق الإيرادات، ينصح بمطابقة كمية العلف المصروفة ميزانياً ومراجعة عقود بيع الحليب للتعبئة."}
              </p>
            </div>

          </div>

        </div>
      )}

      {/* 2. Milk Report Tab */}
      {activeTab === 'milk' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs sm:text-sm text-slate-500 block font-black">إجمالي الحليب المجمع</span>
              <span className="text-xl sm:text-2xl font-mono font-black text-slate-800 block mt-1.5">{totalMilkCollectedLiters.toLocaleString()} لتر</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs sm:text-sm text-slate-500 block font-black">القيمة السوقية المفترضة (25 ج.م/لتر)</span>
              <span className="text-xl sm:text-2xl font-mono font-black text-emerald-700 block mt-1.5">{projectedMilkRevenueValueOption.toLocaleString()} ج.م</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs sm:text-sm text-slate-500 block font-black">الإيرادات المقيدة بالخزينة</span>
              <span className="text-xl sm:text-2xl font-mono font-black text-emerald-700 block mt-1.5">{milkRevenueTotal.toLocaleString()} ج.م</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs sm:text-sm text-slate-500 block font-black">معدل القيمة المحققة بالمبيعات</span>
              <span className="text-xl sm:text-2xl font-mono font-black text-indigo-700 block mt-1.5">
                {projectedMilkRevenueValueOption > 0 
                  ? `${Math.min(100, Math.round((milkRevenueTotal / projectedMilkRevenueValueOption) * 100))}%` 
                  : '0%'
                }
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-sky-600" />
                آخر 8 سجلات حلب وإنتاج حليب مسجلة
              </h3>
              <span className="text-xs text-slate-500 font-extrabold">سند إنتاجي مساعد</span>
            </div>

            {milkProduction.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm font-bold">لا توجد عمليات حلب مسجلة في قاعدة البيانات حالياً.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs font-black uppercase border-b border-slate-200/60">
                    <tr>
                      <th className="p-4">رقم البقرة (كود Tag)</th>
                      <th className="p-4">التاريخ والوردية</th>
                      <th className="p-4 text-center">الكمية لتر</th>
                      <th className="p-4 text-center">نسبة الدسم %</th>
                      <th className="p-4">المسؤول</th>
                      <th className="p-4">ملاحظات العمل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-extrabold text-slate-705">
                    {milkProduction.slice(-8).reverse().map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/50 transition duration-155">
                        <td className="p-4 font-mono text-slate-950 font-black"><span className="text-emerald-800">#{m.cowTag}</span></td>
                        <td className="p-4 text-slate-600 font-semibold">{m.date} - <span className="text-slate-700 font-extrabold">{m.shift}</span></td>
                        <td className="p-4 text-center font-black font-mono text-slate-900">{m.quantity} لتر</td>
                        <td className="p-4 text-center font-mono text-sky-700 font-black">{m.fatContent}%</td>
                        <td className="p-4 text-slate-600 font-bold">{m.recordedBy}</td>
                        <td className="p-4 text-slate-500 text-xs truncate max-w-xs">{m.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Feed Report Tab */}
      {activeTab === 'feed' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs sm:text-sm text-slate-500 block font-black">وجبات العلف الموزعة للقطيع</span>
              <span className="text-xl sm:text-2xl font-mono font-black text-slate-800 block mt-1.5">{totalFeedsDistributedKg.toLocaleString()} كجم</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs sm:text-sm text-slate-500 block font-black">رصيد المواد المؤمن بالصوامع</span>
              <span className="text-xl sm:text-2xl font-mono font-black text-emerald-800 block mt-1.5">{currentBinsSiloCapacityKg.toLocaleString()} كجم</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs sm:text-sm text-slate-500 block font-black">المنفق الإجمالي للشراء (الدفاتر المساعدة)</span>
              <span className="text-xl sm:text-2xl font-mono font-black text-rose-600 block mt-1.5">{feedExpensesTotal.toLocaleString()} ج.م</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs sm:text-sm text-slate-500 block font-black">متوسط تكلفة الكيلوجرام</span>
              <span className="text-xl sm:text-2xl font-mono font-black text-indigo-700 block mt-1.5">
                {totalFeedsDistributedKg > 0 
                  ? `${(feedExpensesTotal / totalFeedsDistributedKg).toFixed(1)} ج.م/كجم` 
                  : '0 ج.م'
                }
              </span>
            </div>
          </div>

          {currentBinsSiloCapacityKg < 200 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex gap-3 items-start text-sm font-semibold text-amber-800 text-right">
              <AlertTriangle className="w-5.5 h-5.5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>تنبيه انخفاض مخزون الأعلاف الرئيسي للمزرعة!</strong>
                <p className="text-xs text-amber-700 mt-1">رصيد التخزين المؤمن الحالي بالصوامع هو {currentBinsSiloCapacityKg} كجم فقط. يوصى بطلب قسيمة شراء طارئة لتفادي انقطاع نظام التغذية الداخلي للحيوانات.</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                <Coffee className="w-5 h-5 text-amber-600" />
                آخر 8 حركات تغذية وتوزيع حصص أعلاف عنابر الأبقار
              </h3>
              <span className="text-xs text-slate-500 font-extrabold">رصد إداري</span>
            </div>

            {feedingSessions.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm font-bold">لا توجد عمليات تغذية مسجلة للمربعات حالياً.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs font-black uppercase border-b border-slate-200/60">
                    <tr>
                      <th className="p-4">رقم وبروتوكول العنبر</th>
                      <th className="p-4">نوع وخامة العلف</th>
                      <th className="p-4 text-center">الكمية المصروفة</th>
                      <th className="p-4">التاريخ والوقت</th>
                      <th className="p-4">مسؤول التنفيذ بالعنابر</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-extrabold text-slate-705">
                    {feedingSessions.slice(-8).reverse().map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4"><span className="px-3 py-1.5 text-xs font-black rounded-xl bg-slate-100 text-slate-800">عنبر #{f.roomNumber}</span></td>
                        <td className="p-4 text-slate-900 font-black">{f.feedName}</td>
                        <td className="p-4 text-center font-black font-mono text-amber-600">{f.quantity} كجم</td>
                        <td className="p-4 font-mono text-slate-600">{f.date}</td>
                        <td className="p-4 text-slate-600 font-bold">{f.recordedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Health Report Tab */}
      {activeTab === 'health' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs sm:text-sm text-slate-500 block font-black">حالات الرعاية العلاجية والطبية</span>
              <span className="text-xl sm:text-2xl font-mono font-black text-rose-600 block mt-1.5">{totalHealthInterventionsCount} جلسة علاج</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs sm:text-sm text-slate-500 block font-black">التكاليف الطبية المقيدة بالبطاقة الصحية</span>
              <span className="text-xl sm:text-2xl font-mono font-black text-rose-600 block mt-1.5">{recordedHealthLogsCostsSelfSum.toLocaleString()} ج.م</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs sm:text-sm text-slate-500 block font-black">الصرف البيطري العام المقيد بالدفاتر</span>
              <span className="text-xl sm:text-2xl font-mono font-black text-rose-600 block mt-1.5">{medicalExpensesTotal.toLocaleString()} ج.م</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs sm:text-sm text-slate-500 block font-black">التشخيص الأكثر تكراراً بالقطيع</span>
              <span className="text-sm sm:text-base font-black text-slate-850 block mt-2.5 leading-none max-w-full truncate">{topDiagnosedIllnessName}</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-rose-600" />
                آخر 8 كشوفات بيطرية وجلسات علاجية نشطة
              </h3>
              <span className="text-xs text-slate-500 font-extrabold">سند بيطري طبي</span>
            </div>

            {healthLogs.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm font-bold">لا توجد سجلات طبية أو حالات بيطرية مقيدة حالياً.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50 text-slate-550 text-xs font-black uppercase border-b border-slate-200/60">
                    <tr>
                      <th className="p-4">كود البقرة Tag</th>
                      <th className="p-4">التشخيص المرضي</th>
                      <th className="p-4">بروتوكول العلاج والعقاقير</th>
                      <th className="p-4 text-center">أمان الاستهلاك (الحليب/اللحم)</th>
                      <th className="p-4">الطبيب المعالج</th>
                      <th className="p-4 text-center">الكلفة ج.م</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-extrabold text-slate-705">
                    {healthLogs.slice(-8).reverse().map((h) => {
                      const isSafetyActive = h.safetyPeriodEnd ? new Date(h.safetyPeriodEnd) > new Date() : false;
                      return (
                        <tr key={h.id} className="hover:bg-slate-50/50 transition duration-155">
                          <td className="p-4 font-mono font-black text-slate-950">#{h.cowTag}</td>
                          <td className="p-4 text-rose-800 font-black">{h.diagnosis}</td>
                          <td className="p-4 text-slate-600 font-semibold">{h.treatment}</td>
                          <td className="p-4 text-center">
                            {isSafetyActive ? (
                              <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-lg text-xs font-black">
                                فترة الأمان نشطة (الحظر مفعّل)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-lg text-xs font-black">
                                آمن للاستهلاك والتسويق
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-slate-600 font-bold">{h.veterinarian}</td>
                          <td className="p-4 text-center font-mono font-black text-rose-650">{Number(h.cost).toLocaleString()} ج.م</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Ledger Tab */}
      {activeTab === 'ledger' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-[450px]">
              <Search className="absolute right-4 top-4 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="ابحث برقم القيد، الملاحظة، الشريك..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-extrabold focus:outline-none focus:bg-white placeholder-slate-400 text-slate-800"
              />
            </div>

            <div className="flex items-center gap-3 bg-slate-50 border border-slate-150 rounded-2xl px-4 py-3 text-sm text-slate-600 font-extrabold w-full md:w-auto">
              <Filter className="w-5 h-5 text-emerald-700" />
              <span>البند المالي:</span>
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-transparent border-none outline-none font-black text-slate-850 cursor-pointer"
              >
                <option value="ALL">الكل</option>
                <option value="مبيعات حليب">مبيعات ألبان وحليب</option>
                <option value="شراء أعلاف وتغذية">تكاليف ونفقات شراء أعلاف</option>
                <option value="رعاية وعلاجات بيطرية">تكاليف عيادة بيطرية ورعاية</option>
                <option value="تسويات وحركات عامة">التسويات والحركات اليدوية العامة</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
              <span className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-emerald-800" />
                يومية الخزينة والدفاتر المباشرة للمزرعة
              </span>
              <span className="text-xs text-slate-400 font-extrabold hidden sm:inline">تكامل مع القيد المزدوج للنظام العام</span>
            </div>

            {filteredFinancials.length === 0 ? (
              <div className="p-16 text-center text-slate-400 font-bold space-y-3">
                <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm">لا توجد حركات مطابقة لفلتر البحث حالياً.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-xs font-black uppercase">
                      <th className="p-4">تاريخ السند</th>
                      <th className="p-4">بند الحركة</th>
                      <th className="p-4 text-center">القيمة</th>
                      <th className="p-4">البيان والملاحظات</th>
                      <th className="p-4 text-center">القيد التراكمي المزدوج</th>
                      <th className="p-4 text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-extrabold text-slate-705">
                    {filteredFinancials.slice().reverse().map((fee) => (
                      <tr key={fee.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 font-mono text-slate-550">{fee.date}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-xl text-xs font-black ${
                            fee.amount > 0 ? 'bg-emerald-50 text-emerald-850' : 'bg-red-50 text-red-850'
                          }`}>
                            {fee.type}
                          </span>
                        </td>
                        <td className="p-4 text-center font-black font-mono text-base">
                          <span className={fee.amount > 0 ? 'text-emerald-700' : 'text-red-600'}>
                            {fee.amount > 0 ? '+' : ''}{fee.amount.toLocaleString()} ج.م
                          </span>
                        </td>
                        <td className="p-4 text-slate-650 max-w-xs truncate" title={fee.notes}>
                          {fee.notes || <span className="text-slate-300">بلا بيان...</span>}
                        </td>
                        <td className="p-4 text-center">
                          {fee.journalEntryId ? (
                            <span className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-850 border border-sky-100 text-xs font-black px-3 py-1 rounded-xl">
                              قيد محاسبي #{fee.journalEntryId}
                            </span>
                          ) : (
                            <span className="text-slate-450 text-xs font-black">حركة محلية مبدئية</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteRecord(fee)}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer transition border-none"
                            title="حذف القيد المحلي"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Posting Tab */}
      {activeTab === 'posting' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-4 bg-slate-900 text-slate-200 p-8 rounded-3xl space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="px-3.5 py-1.5 text-xs font-black bg-white/10 text-emerald-300 rounded-full inline-block">حسابات القيود وتطهير الحسابات</span>
              <h3 className="text-xl sm:text-2xl font-black text-white">إرشادات ترحيل القيود والتسوية</h3>
              <p className="text-sm text-slate-300 font-semibold leading-relaxed">
                تقوم هذه الأداة بصياغة الحركة المباشرة في الدفاتر المساعدة للمزرعة وتكوين قيد مزدوج توازني متوازن بالطرف المدين والدائن في الدليل العام للمؤسسة.
              </p>
              <ul className="text-xs sm:text-sm text-slate-400 space-y-3 list-none p-0">
                <li className="flex gap-2 items-start">
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>يطابق الطرف المدين والطرف الدائن بنظام قيد اليومية توازناً آلياً.</span>
                </li>
                <li className="flex gap-2 items-start">
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>يحمي القيود بالتزامن مع حساب الصندوق والبنك لمنع الحركات العشوائية.</span>
                </li>
              </ul>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-xs sm:text-sm text-slate-400">
              مرحلة الحركة ستنعكس مباشرة على لوحة المؤشرات ووفورات المربّي.
            </div>
          </div>

          <form onSubmit={handlePerformPosting} className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 font-sans">
            <h4 className="text-sm sm:text-lg font-black text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-700 font-black" />
              صياغة مستند التسوية والتحويل المحاسبي للقطعان
            </h4>

            {postingError && (
              <div className="p-4 bg-rose-50 text-rose-800 border border-rose-150 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
                <span>{postingError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-black text-slate-500">نوع الحركة التشغيلية *</label>
                <div className="grid grid-cols-2 gap-3 text-sm font-bold">
                  <button
                    type="button"
                    onClick={() => handleEntryTypeChange('expense')}
                    className={`p-3.5 rounded-2xl border text-center cursor-pointer transition ${
                      entryType === 'expense' ? 'bg-red-50 text-red-850 border-red-300 font-black' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    مصروف تشغيلي 🔴
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEntryTypeChange('revenue')}
                    className={`p-3.5 rounded-2xl border text-center cursor-pointer transition ${
                      entryType === 'revenue' ? 'bg-emerald-50 text-emerald-850 border-emerald-300 font-black' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    إيراد / عوائد 🟢
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-black text-slate-500">تاريخ السند *</label>
                <input
                  type="date"
                  required
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-black text-slate-500">تصنيف البند التمويلي *</label>
                <select
                  value={entryCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-800 focus:bg-white cursor-pointer"
                >
                  {entryType === 'expense' ? (
                    <>
                      <option value="شراء أعلاف وتغذية">تكاليف ونفقات شراء أعلاف ومواد علفية</option>
                      <option value="رعاية وعلاجات بيطرية">نفقات طبية بيطرية وتحصينات حمى قلاعية</option>
                      <option value="تسويات وحركات عامة">مصاريف حظيرة وصيانة معالف أخرى</option>
                    </>
                  ) : (
                    <>
                      <option value="مبيعات حليب">مبيعات ألبان وحليب الإنتاج المصفى</option>
                      <option value="تسويات وحركات عامة">مبيعات روث ومواليد وتسويات عامة أخرى</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-2 font-sans">
                <label className="text-xs sm:text-sm font-black text-slate-500">المبلغ والقيمة الإجمالية (ج.م) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="المبلغ بالجنيه المصري..."
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(e.target.value !== '' ? Number(e.target.value) : '')}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-2xl text-sm font-black text-slate-800"
                />
              </div>

            </div>

            {/* General ledger posting integration settings */}
            <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/60 space-y-4 text-xs sm:text-sm">
              <label className="flex items-center gap-3 cursor-pointer font-black text-indigo-950">
                <input
                  type="checkbox"
                  checked={isPostingToLedger}
                  onChange={(e) => setIsPostingToLedger(e.target.checked)}
                  className="w-4.5 h-4.5 rounded text-indigo-750 accent-indigo-600"
                />
                <span>تزامن القيد المزدوج المحاسبي بالنظام المالي العام للمؤسسة</span>
              </label>
              
              {isPostingToLedger && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-indigo-150">
                  
                  {/* Debit account select */}
                  <div className="space-y-2 font-sans">
                    <label className="text-xs font-black text-slate-550">حساب المدين المقيد (DR Account) *</label>
                    <select
                      required
                      value={selectedDebitAccountId}
                      onChange={(e) => setSelectedDebitAccountId(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-800"
                    >
                      <option value="">-- اختر حساب المدين --</option>
                      {entryType === 'expense' ? (
                        <>
                          {accountsPreset.expenseAccs.map(a => (
                            <option key={a.id} value={a.id}>{a.name} (رمز: {a.code || '-'})</option>
                          ))}
                        </>
                      ) : (
                        <>
                          {accountsPreset.assetAccs.map(a => (
                            <option key={a.id} value={a.id}>{a.name} (رمز: {a.code || '-'})</option>
                          ))}
                        </>
                      )}
                      {accounts.filter(a => !accountsPreset.expenseAccs.includes(a) && !accountsPreset.assetAccs.includes(a)).map(a => (
                        <option key={a.id} value={a.id}>{a.name} (نوع: {a.type})</option>
                      ))}
                    </select>
                  </div>

                  {/* Credit account select */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-550">حساب الدائن المقيد (CR Account) *</label>
                    <select
                      required
                      value={selectedCreditAccountId}
                      onChange={(e) => setSelectedCreditAccountId(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-800"
                    >
                      <option value="">-- اختر حساب الدائن --</option>
                      {entryType === 'expense' ? (
                        <>
                          {accountsPreset.assetAccs.map(a => (
                            <option key={a.id} value={a.id}>{a.name} (رمز: {a.code || '-'})</option>
                          ))}
                        </>
                      ) : (
                        <>
                          {accountsPreset.revenueAccs.map(a => (
                            <option key={a.id} value={a.id}>{a.name} (رمز: {a.code || '-'})</option>
                          ))}
                        </>
                      )}
                      {accounts.filter(a => !accountsPreset.assetAccs.includes(a) && !accountsPreset.revenueAccs.includes(a)).map(a => (
                        <option key={a.id} value={a.id}>{a.name} (نوع: {a.type})</option>
                      ))}
                    </select>
                  </div>

                </div>
              )}
            </div>

            {/* Descriptive statement notes */}
            <div className="space-y-2 font-sans">
              <label className="text-xs sm:text-sm font-black text-slate-500">الملاحظات، الغرض المالي والبيان التفصيلي</label>
              <textarea
                rows={3}
                placeholder="يرجى كتابة بيان توضيحي للحركة، مثال: لشراء مستلزمات لقاحات الحمى القلاعية، أو بيع حليب أسبوعي..."
                value={entryNotes}
                onChange={(e) => setEntryNotes(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 focus:bg-white rounded-2xl text-sm font-black text-slate-800 focus:ring-4 focus:ring-emerald-500/10 placeholder-slate-400"
              />
            </div>

            <div className="border-t border-slate-100 pt-5 flex justify-end gap-3 text-sm font-black font-sans">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="px-6 py-3.5 rounded-2xl text-slate-550 hover:bg-slate-100 cursor-pointer border-none bg-transparent transition duration-150"
              >
                تراجع وإلغاء
              </button>
              <button
                type="submit"
                className="px-8 py-3.5 bg-indigo-700 hover:bg-indigo-800 text-white shadow-lg shadow-indigo-700/10 cursor-pointer rounded-2xl transition duration-150 border-none"
              >
                ترحيل الحركة بالخزينة وإصدار السند ✅
              </button>
            </div>

          </form>

        </div>
      )}

      {/* ⚠️ Custom Confirm Action Modal for transaction deleting */}
      {confirmDeleteRecord && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm border border-slate-100 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex gap-3.5 items-start">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 stroke-[2.2]" />
               </div>
              <div className="space-y-1 font-sans">
                <h4 className="font-extrabold text-slate-900 text-lg">الأرقام والقيود المحاسبية</h4>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  هل أنت متأكد من تراجعك عن الحركة وحذف السند المذكور؟
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs font-bold text-slate-700 leading-normal space-y-1.5 font-sans">
              <div>الحركة: <span className="text-red-600 font-black">{confirmDeleteRecord.type}</span></div>
              <div>المبلغ: <span className="text-red-600 font-mono font-black">{confirmDeleteRecord.amount.toLocaleString()} ج.م</span></div>
              <div className="text-slate-400 text-[10px]">ملاحظة: تراجع وحذف القيود المساعدة لا يلغي أو يحذف القيد المزدوج ترحيلياً من قطاع دفتري عام لضمان سلامة الفحص الضريبي والاستقصائي.</div>
            </div>

            <div className="flex gap-2.5 font-sans">
              <button
                type="button"
                onClick={() => setConfirmDeleteRecord(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs duration-100 cursor-pointer border-none"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleDeleteTransaction}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs duration-100 shadow-lg shadow-red-600/10 cursor-pointer border-none"
              >
                أنا متأكد، شطب القيد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styled Printable Styles Worksheet layout */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          #cowfarm-financials-hub button, 
          #cowfarm-financials-hub .flex-wrap,
          #cowfarm-financials-hub form,
          #cowfarm-financials-hub border-b,
          #cowfarm-financials-hub select,
          #cowfarm-financials-hub input {
            display: none !important;
          }
          #comprehensive-farm-reports {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
          .p-6, .p-5, .rounded-3xl, .rounded-2xl {
            padding: 8px !important;
            border-radius: 0px !important;
            border: 1px solid #ddd !important;
            box-shadow: none !important;
          }
        }
      `}</style>

    </div>
  );
}
