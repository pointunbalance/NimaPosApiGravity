import React, { useState, useMemo } from 'react';
import { ArrowDownLeft, ArrowUpRight, Search, FileText, ChevronDown, ChevronUp, Calendar, Tag, CreditCard } from 'lucide-react';

interface TreasuryTransaction {
  id?: number;
  type: 'inflow' | 'outflow' | 'transfer';
  amount: number;
  date: string;
  description: string;
  category: string;
  paymentMethod: string;
  referenceNumber?: string;
  sourceAccount?: string;
  destinationAccount?: string;
}

interface TreasuryTabProps {
  treasuryTransactions: TreasuryTransaction[];
  formatCurrency: (amount: number) => string;
}

const CATEGORY_MAP: Record<string, string> = {
  sales: 'مبيعات',
  expenses: 'مصروفات',
  loan: 'قرض/تمويل',
  investment: 'استثمار',
  operational: 'تشغيلي',
  transfer: 'تحويل داخلي',
  salary: 'رواتب',
  bonus: 'مكافآت',
  other: 'أخرى'
};

const METHOD_MAP: Record<string, string> = {
  cash: 'نقدي',
  bank_transfer: 'تحويل بنكي',
  check: 'شيك',
  card: 'بطاقة'
};

const TreasuryTab: React.FC<TreasuryTabProps> = ({ treasuryTransactions, formatCurrency }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'inflow' | 'outflow' | 'transfer'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Calculates stats
  const stats = useMemo(() => {
    let totalInflow = 0;
    let totalOutflow = 0;
    let totalTransfer = 0;

    treasuryTransactions.forEach(t => {
      if (t.type === 'inflow') totalInflow += t.amount;
      else if (t.type === 'outflow') totalOutflow += t.amount;
      else if (t.type === 'transfer') totalTransfer += t.amount;
    });

    const netCashFlow = totalInflow - totalOutflow;

    return { totalInflow, totalOutflow, netCashFlow, totalTransfer };
  }, [treasuryTransactions]);

  // Unique categories for filtering
  const categories = useMemo(() => {
    const list = new Set<string>();
    treasuryTransactions.forEach(t => {
      if (t.category) list.add(t.category);
    });
    return Array.from(list);
  }, [treasuryTransactions]);

  // Filter & Search
  const filteredList = useMemo(() => {
    return treasuryTransactions
      .filter(t => {
        const matchesSearch =
          t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          CATEGORY_MAP[t.category]?.includes(searchTerm) ||
          t.amount.toString().includes(searchTerm);

        const matchesType = typeFilter === 'all' || t.type === typeFilter;
        const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;

        return matchesSearch && matchesType && matchesCategory;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [treasuryTransactions, searchTerm, typeFilter, categoryFilter, sortOrder]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3">
        {/* Total Inflows */}
        <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">إجمالي المقبوضات (الخزينة)</span>
            <p className="text-3xl font-extrabold text-emerald-600 font-sans">{formatCurrency(stats.totalInflow)}</p>
            <span className="text-xs text-slate-500 block border-t border-slate-100 pt-1">إيداعات مبيعات وأخرى</span>
          </div>
          <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
            <ArrowDownLeft className="w-8 h-8" />
          </div>
        </div>

        {/* Total Outflows */}
        <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">إجمالي المدفوعات (الخروج)</span>
            <p className="text-3xl font-extrabold text-rose-600 font-sans">{formatCurrency(stats.totalOutflow)}</p>
            <span className="text-xs text-slate-500 block border-t border-slate-100 pt-1">مصروفات، مشتريات، عمولات</span>
          </div>
          <div className="p-4 bg-rose-50 rounded-2xl text-rose-600">
            <ArrowUpRight className="w-8 h-8" />
          </div>
        </div>

        {/* Net Flow */}
        <div className={`p-6 rounded-3xl border shadow-lg flex items-center justify-between text-white ${stats.netCashFlow >= 0 ? 'bg-gradient-to-br from-slate-800 to-indigo-950 border-slate-700' : 'bg-gradient-to-br from-rose-700 to-red-800 border-rose-600'}`}>
          <div className="space-y-1">
            <span className="text-xs font-bold text-indigo-200/80 uppercase tracking-wide">صافي التدفق النقدي للفترة</span>
            <p className="text-3xl font-extrabold font-sans">{formatCurrency(stats.netCashFlow)}</p>
            <span className="text-xs text-indigo-100/70 block border-t border-white/10 pt-1">الفارق بين المقبوض والمدفوع</span>
          </div>
          <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl text-white">
            <FileText className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Advanced Filters Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-sm space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-500" /> كشف حركة الخزينة المفصل
          </h3>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 transition-colors"
            >
              الترتيب الزمني: {sortOrder === 'desc' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          {/* Search Box */}
          <div className="relative col-span-1 md:col-span-2">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="ابحث عن بيان، مرجع، قيمة أو فئة..."
              className="w-full pl-4 pr-10 py-2 text-sm border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-xl"
            />
            <Search className="absolute right-3.5 top-2.5 w-4.5 h-4.5 text-slate-400" />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-xl bg-white text-slate-700"
            >
              <option value="all">كل أنواع الحركات</option>
              <option value="inflow">مقبوضات (داخلة +)</option>
              <option value="outflow">مدفوعات (خارجة -)</option>
              <option value="transfer">تحويلات مالية</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-xl bg-white text-slate-700"
            >
              <option value="all">كل بنود التدفق</option>
              {categories.map(c => (
                <option key={c} value={c}>{CATEGORY_MAP[c] || c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table List */}
      <div className="bg-white rounded-3xl border border-slate-150 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <span className="font-bold text-slate-800">سجل حركات الخزينة ({filteredList.length} حركة)</span>
          <span className="text-xs text-slate-500">تم الفلترة بناءً على محددات البحث والفترة الزمنية</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-100 text-slate-600 font-semibold select-none">
              <tr>
                <th className="px-6 py-4">التاريخ والوقت</th>
                <th className="px-6 py-4">البيان والحركة</th>
                <th className="px-6 py-4">فئة التدفق</th>
                <th className="px-6 py-4">رقم المرجع</th>
                <th className="px-6 py-4">وسيلة الدفع</th>
                <th className="px-6 py-4 text-left">القيمة المالية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((t, idx) => {
                const isDeposit = t.type === 'inflow';
                const isUnderTransfer = t.type === 'transfer';

                return (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    {/* Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(t.date).toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(t.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </span>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{t.description}</div>
                      {isUnderTransfer && (
                        <div className="text-[10px] text-slate-400">
                          من: {t.sourceAccount} | إلى: {t.destinationAccount}
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-slate-600 text-xs">{CATEGORY_MAP[t.category] || t.category || 'أخرى'}</span>
                      </div>
                    </td>

                    {/* Reference */}
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-500">
                      {t.referenceNumber ? (
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md font-semibold">
                          {t.referenceNumber}
                        </span>
                      ) : (
                        <span className="text-slate-305">-</span>
                      )}
                    </td>

                    {/* Payment Method */}
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 text-xs">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{METHOD_MAP[t.paymentMethod] || t.paymentMethod || 'نقدي'}</span>
                      </div>
                    </td>

                    {/* Cost Amount */}
                    <td className="px-6 py-4 whitespace-nowrap text-left font-extrabold text-base">
                      {isDeposit ? (
                        <span className="text-emerald-600">
                          +{formatCurrency(t.amount)}
                        </span>
                      ) : isUnderTransfer ? (
                        <span className="text-indigo-600">
                          {formatCurrency(t.amount)}
                        </span>
                      ) : (
                        <span className="text-rose-600">
                          -{formatCurrency(t.amount)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                    لا حركات خزينة متوفرة للفلاتر المحددة أو التاريخ المحدد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};

export default TreasuryTab;
