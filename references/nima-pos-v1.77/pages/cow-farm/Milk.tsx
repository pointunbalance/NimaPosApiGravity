import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { 
  Plus, Save, Calendar, Coffee, ClipboardCheck, ArrowUpRight, 
  Trash2, Filter, Sparkles, PlusCircle, Coins, Check, ListFilter 
} from 'lucide-react';
import { AccountingEngine } from '../../services/AccountingEngine';

interface MilkRecord {
  id?: number;
  cowId: number;
  cowTag: string;
  date: string;
  shift: 'صباحي' | 'مسائي';
  quantity: number; // in Liters
  fatContent: number; // e.g. 3.8
  recordedBy: string;
  notes?: string;
}

export default function CowFarmMilk() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

  // Filters
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [shiftFilter, setShiftFilter] = useState('ALL');

  // New milk collection form
  const [selectedCowId, setSelectedCowId] = useState<number | ''>('');
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState<'صباحي' | 'مسائي'>('صباحي');
  const [quantity, setQuantity] = useState(15);
  const [fatContent, setFatContent] = useState(3.8);
  const [recordedBy, setRecordedBy] = useState('مدير الحظيرة');
  const [notes, setNotes] = useState('');

  // Milk Wholesale Selling Form state
  const [saleQuantity, setSaleQuantity] = useState(50);
  const [pricePerLiter, setPricePerLiter] = useState(25); // Currency Egyptian Pounds or general EGP
  const [buyerName, setBuyerName] = useState('شركة معامل ألبان الدلتا');
  const [selectedDebitAccountId, setSelectedDebitAccountId] = useState<number | ''>('');
  const [selectedCreditAccountId, setSelectedCreditAccountId] = useState<number | ''>('');

  // Queries
  const cows = useLiveQuery(() => db.cowFarmCows.where('status').equals('منتج').toArray()) || [];
  const allCows = useLiveQuery(() => db.cowFarmCows.toArray()) || [];
  const milkProduction = useLiveQuery(() => db.cowFarmMilkProduction.toArray()) || [];
  const accounts = useLiveQuery(() => db.accounts.toArray()) || [];

  // Metrics
  const totalLitersToday = useMemo(() => {
    return milkProduction
      .filter(p => p.date === dateFilter)
      .reduce((sum, p) => sum + Number(p.quantity || 0), 0);
  }, [milkProduction, dateFilter]);

  const avgFatContentToday = useMemo(() => {
    const todayRecords = milkProduction.filter(p => p.date === dateFilter);
    if (todayRecords.length === 0) return 0;
    const sum = todayRecords.reduce((s, p) => s + Number(p.fatContent || 0), 0);
    return (sum / todayRecords.length).toFixed(2);
  }, [milkProduction, dateFilter]);

  // Suggested accounts for selling milk
  const assetAccounts = useMemo(() => {
    return accounts.filter(a => a.type?.toLowerCase() === 'asset' || a.type?.toLowerCase() === 'revenue' || a.code?.startsWith('1') || a.name?.includes('نقد') || a.name?.includes('المبيعات'));
  }, [accounts]);

  // Auto pick preset debit/credit account on initial open
  const preSelectAccounts = () => {
    const cashAcc = accounts.find(a => a.name?.includes('صندوق') || a.name?.includes('الخزينة') || a.name?.includes('نقدية'));
    const revAcc = accounts.find(a => a.name?.includes('إيرادات') || a.name?.includes('المبيعات') || a.name?.includes('نشاط'));
    
    if (cashAcc) setSelectedDebitAccountId(cashAcc.id!);
    if (revAcc) setSelectedCreditAccountId(revAcc.id!);
  };

  const handleOpenSale = () => {
    preSelectAccounts();
    setIsSaleModalOpen(true);
  };

  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCowId) {
      alert("الرجاء اختيار رأس البقرة المعنية أولا.");
      return;
    }
    const cow = allCows.find(c => c.id === Number(selectedCowId));
    if (!cow) return;

    const record: MilkRecord = {
      cowId: cow.id!,
      cowTag: cow.tagNumber,
      date: collectionDate,
      shift,
      quantity: Number(quantity),
      fatContent: Number(fatContent),
      recordedBy,
      notes
    };

    await db.cowFarmMilkProduction.add(record);
    setIsModalOpen(false);
  };

  const handleDeleteRecord = async (id: number) => {
    await db.cowFarmMilkProduction.delete(id);
  };

  // Perform Wholesale Milk Selling and post computerized double-entries!
  const handlePerformSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleQuantity || !pricePerLiter) return;
    if (!selectedDebitAccountId || !selectedCreditAccountId) {
      alert("الرجاء اختيار حسابات القيد المزدوج المناسبة لإكمال الترحيل المالي.");
      return;
    }

    const totalRevenueSum = Number(saleQuantity) * Number(pricePerLiter);

    try {
      // 1. Post real ledger entry
      const entryId = await AccountingEngine.postEntry({
        date: new Date(),
        reference: `REVENUE-MILK-${Date.now().toString().slice(-4)}`,
        description: `بيع إنتاج ألبان المزرعة - كمية ${saleQuantity} لتر للعميل: ${buyerName}`,
        lines: [
          {
            accountId: Number(selectedDebitAccountId),
            debit: totalRevenueSum,
            credit: 0
          },
          {
            accountId: Number(selectedCreditAccountId),
            debit: 0,
            credit: totalRevenueSum
          }
        ]
      });

      // 2. Add locally inside Cow Farm Financial logs
      await db.cowFarmFinancials.add({
        date: new Date().toISOString().split('T')[0],
        type: 'مبيعات حليب',
        amount: totalRevenueSum,
        journalEntryId: entryId,
        notes: `بيع ${saleQuantity} لتر بسعر لتر ${pricePerLiter} ج.م للعمير: ${buyerName}`
      });

      alert(`تم بنجاح ترحيل القيد المحاسبي وحفظ فاتورة بيع الألبان بقيمة ${totalRevenueSum} ج.م.`);
      setIsSaleModalOpen(false);
    } catch (err: any) {
      alert(`فشل الترحيل المالي: ${err.message || err}`);
    }
  };

  // Filter lists
  const filteredRecords = milkProduction.filter(rec => {
    const matchesDate = !dateFilter || rec.date === dateFilter;
    const matchesShift = shiftFilter === 'ALL' || rec.shift === shiftFilter;
    return matchesDate && matchesShift;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50/50 min-h-screen text-slate-800" dir="rtl" id="cowfarm-milk">
      
      {/* Upper header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-black text-emerald-900 tracking-tight">إنتاج اليومية للألبان</h1>
          <p className="text-slate-500 font-medium">تسجيل كميات الحلب اليومية على مستوى الرأس ومتابعة جودة الدسم والبيع المالي المباشر.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleOpenSale}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-lg shadow-amber-600/10 transition duration-150 flex items-center gap-1.5 text-sm"
          >
            <Coins className="w-4 h-4" /> تسوير الفائض وبيعه مالياً
          </button>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-lg shadow-emerald-700/10 transition duration-150 flex items-center gap-1.5 text-sm"
          >
            <Plus className="w-4.5 h-4.5" /> تسجيل حلبة جديدة
          </button>
        </div>
      </div>

      {/* KPI stats for selected date */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400">تاريخ التتبع المحدد</span>
          <h3 className="text-2xl font-black text-slate-800 mt-1">{dateFilter ? new Date(dateFilter).toLocaleDateString('ar-EG', { dateStyle: 'long' }) : 'كل التواريخ'}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400">إجمالي الحصاد اليومي لليتر حليب</span>
          <h3 className="text-2xl font-black text-emerald-700 mt-1">{totalLitersToday} لتر</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400">متوسط نسبة الدسم / القشدة %</span>
          <h3 className="text-2xl font-black text-sky-600 mt-1">{avgFatContentToday}%</h3>
        </div>
      </div>

      {/* Primary table with date filters */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Table Filter Top Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <span className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
            <ListFilter className="w-4 h-4 text-emerald-700" />
            سجلات اليومية المطابقة للأبحاث
          </span>

          <div className="flex gap-2 w-full md:w-auto">
            <input 
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            />
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">كل الورديات</option>
              <option value="صباحي">صباحي (Morning shift)</option>
              <option value="مسائي">مسائي (Evening shift)</option>
            </select>
          </div>
        </div>

        {/* List Table */}
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium">
            لا توجد سجلات حليب مدونة لهذا اليوم والوردية. بإمكانك تسجيل حلبة جديدة.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold">
                  <th className="p-4">رقم رأس الماشية (Tag)</th>
                  <th className="p-4">التاريخ</th>
                  <th className="p-4">الوردية</th>
                  <th className="p-4 text-emerald-800">الكمية المسجلة</th>
                  <th className="p-4">نسبة الدسم والدهن %</th>
                  <th className="p-4">المشرف المستلم</th>
                  <th className="p-4">ملاحظات حيوية</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-mono font-bold text-slate-800">{rec.cowTag}</td>
                    <td className="p-4 text-xs text-slate-500">{rec.date}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 text-xs rounded-lg ${
                        rec.shift === 'صباحي' ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {rec.shift}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-emerald-700 text-base">{rec.quantity} لتر</td>
                    <td className="p-4 font-bold text-slate-700">{rec.fatContent}%</td>
                    <td className="p-4 text-slate-600">{rec.recordedBy}</td>
                    <td className="p-4 text-xs text-slate-400">{rec.notes || '-'}</td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleDeleteRecord(rec.id!)}
                        className="p-1 rounded text-red-500 hover:bg-red-50"
                        title="حذف السجل"
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

      {/* Collection Dialog (Modal) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSaveCollection} className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in duration-200">
            <div className="p-6 bg-emerald-800 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">تسجيل حلبة ومدر عالي</h3>
                <p className="text-xs text-emerald-100 mt-1">يقوم النظام بتسجيل الكميات فقط للأبقار التي تحت الحالة "منتج".</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 rounded-full bg-white/10 hover:bg-white/20">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              {/* Select Cow */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">البقرة المدرة الحالية *</label>
                <select
                  required
                  value={selectedCowId}
                  onChange={(e) => setSelectedCowId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="">-- اختر من القائمة --</option>
                  {cows.map(c => (
                    <option key={c.id} value={c.id}>{c.tagNumber} ({c.breed})</option>
                  ))}
                </select>
                {cows.length === 0 && (
                  <p className="text-[10px] text-amber-600 font-bold">تنبيه: لا يوجد أبقار تحت الحالة "منتج" حالياً بالحظيرة.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                
                {/* Collection Date */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">التاريخ</label>
                  <input 
                    type="date"
                    required
                    value={collectionDate}
                    onChange={(e) => setCollectionDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                {/* Shift */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">الوردية</label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="صباحي">صباحي</option>
                    <option value="مسائي">مسائي</option>
                  </select>
                </div>

                {/* Quantity */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">الكمية المستخلصة (ليتر)</label>
                  <input 
                    type="number"
                    required
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                {/* Fat Content */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">نسبة الدسم الكيميائي %</label>
                  <input 
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    required
                    value={fatContent}
                    onChange={(e) => setFatContent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

              </div>

              {/* Recorded By */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">المستلم / المشرف البيولوجي</label>
                <input 
                  type="text"
                  required
                  value={recordedBy}
                  onChange={(e) => setRecordedBy(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">ملاحظات الحلبة الحالية</label>
                <input 
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: حلمة الحالبة سليمة، مدر ممتاز"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-500 hover:bg-slate-200 font-bold rounded-xl text-sm"
              >
                تراجع
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm flex items-center gap-1 shadow-lg shadow-emerald-700/10"
              >
                <Save className="w-4 h-4" /> حفظ السجل
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Selling/Wholesale Billing Dialog Modal (Integrates with Accounts!) */}
      {isSaleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handlePerformSale} className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in duration-200">
            <div className="p-6 bg-amber-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">ترحيل مالي لمبيعات الألبان</h3>
                <p className="text-xs text-amber-500 mt-1 bg-amber-950/20 px-2 py-1 rounded inline-block font-bold">توليد قيد مزدوج مؤتمت في النظام المالي الرئيسي</p>
              </div>
              <button type="button" onClick={() => setIsSaleModalOpen(false)} className="p-1 rounded-full bg-white/10 hover:bg-white/20">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                {/* Quantity */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">الكمية المباعة (ليتر)</label>
                  <input 
                    type="number"
                    required
                    min={1}
                    value={saleQuantity}
                    onChange={(e) => setSaleQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                {/* Price per Liter */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">سعر اللتر المتفق عليه (ج.م)</label>
                  <input 
                    type="number"
                    required
                    min={1}
                    value={pricePerLiter}
                    onChange={(e) => setPricePerLiter(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Client/Buyer name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">اسم العميل / مصنع التوريد</label>
                <input 
                  type="text"
                  required
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="border-t border-dashed border-slate-200 pt-3">
                <p className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded mb-3 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  قالب القيد المحاسبي المزدوج (Double Entry Template):
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  
                  {/* Account Debit */}
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-600">الجانب المدين (Debit - عادة خزينة أو ذمم عملاء) *</label>
                    <select
                      required
                      value={selectedDebitAccountId}
                      onChange={(e) => setSelectedDebitAccountId(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                    >
                      <option value="">-- اختر حساب استلام النقدية --</option>
                      {assetAccounts.map(a => (
                        <option key={a.id} value={a.id}>{a.code} - {a.name} ({a.type})</option>
                      ))}
                    </select>
                  </div>

                  {/* Account Credit */}
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-600">الجانب الدائن (Credit - حساب الإيرادات الخاص بك) *</label>
                    <select
                      required
                      value={selectedCreditAccountId}
                      onChange={(e) => setSelectedCreditAccountId(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                    >
                      <option value="">-- اختر حساب إيرادات مبيعات مالي --</option>
                      {assetAccounts.map(a => (
                        <option key={a.id} value={a.id}>{a.code} - {a.name} ({a.type})</option>
                      ))}
                    </select>
                  </div>

                </div>
              </div>

              {/* Total Summary */}
              <div className="bg-amber-50 p-3 rounded-2xl flex justify-between items-center text-amber-950 font-bold">
                <span>إجمالي الفاتورة وقيمة القيد:</span>
                <span className="text-lg font-black">{saleQuantity * pricePerLiter} ج.م</span>
              </div>

            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setIsSaleModalOpen(false)}
                className="px-4 py-2 text-slate-500 hover:bg-slate-200 font-bold rounded-xl text-sm"
              >
                    إلغاء
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm flex items-center gap-1 shadow-lg shadow-amber-600/10"
              >
                <Check className="w-4 h-4" /> ترحيل الفاتورة وتوليد القيد المحاسبي
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
