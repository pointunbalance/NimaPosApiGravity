import React from 'react';
import { Customer, Order, CustomerPayment, B2BInvoice } from '../../types';
import {
  X, Edit2, Hash, MessageCircle, Coins, Banknote, ShieldAlert,
  Award, TrendingUp, User, MapPin, Printer, CheckSquare, Mail, Wallet, FileText, ArrowUpRight, ArrowDownRight, Scissors, Building2
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';

interface CustomerProfileProps {
  selectedProfile: Customer;
  profileOrders: Order[];
  profileB2BInvoices?: B2BInvoice[];
  profilePayments: CustomerPayment[];
  profileLoyalty?: any[];
  activeTab: 'overview' | 'invoices' | 'b2b_invoices' | 'payments' | 'statement' | 'activity';
  setActiveTab: (tab: 'overview' | 'invoices' | 'b2b_invoices' | 'payments' | 'statement' | 'activity') => void;
  onCloseProfile: () => void;
  onEditProfile: (customer: Customer) => void;
  onOpenPaymentModal: (type: 'debt_payment' | 'wallet_deposit') => void;
  onOpenWhatsApp: (phone: string, name: string) => void;
  getCustomerStatus: (customer: Customer) => { label: string; color: string; icon: any };
  calculateLoyaltyPoints: (spent: number) => number;
  customerInsights: {
    favoriteItems: any[];
    avgBasket: number;
    lastVisit: Date | null;
    monthlySpending: any[];
  };
  selectedInvoiceIds: Set<number>;
  toggleInvoiceSelection: (id: number) => void;
  selectAllInvoices: () => void;
  handlePrintSelected: () => void;
  setViewOrder: (order: Order) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date) => string;
}

const CustomerProfile: React.FC<CustomerProfileProps> = ({
  selectedProfile,
  profileOrders,
  profileB2BInvoices = [],
  profilePayments,
  profileLoyalty = [],
  activeTab,
  setActiveTab,
  onCloseProfile,
  onEditProfile,
  onOpenPaymentModal,
  onOpenWhatsApp,
  getCustomerStatus,
  calculateLoyaltyPoints,
  customerInsights,
  selectedInvoiceIds,
  toggleInvoiceSelection,
  selectAllInvoices,
  handlePrintSelected,
  setViewOrder,
  formatCurrency,
  formatDate,
}) => {
  const settings = useLiveQuery(() => db.settings.get(1));
  const collectB2BData = settings?.customerSettings?.collectB2BData ?? ['retail', 'wholesale'].includes(settings?.businessType || '');
  const enableMeasurements = settings?.customerSettings?.enableMeasurements ?? (settings?.businessType === 'clothing');
  const showCreditBalance = settings?.customerSettings?.showCreditBalance ?? true;
  const showLoyaltyPoints = settings?.customerSettings?.showLoyaltyPoints ?? true;
  const activeMeasurementFields = settings?.customerSettings?.activeMeasurementFields || [
    'length', 'shoulder', 'sleeveLength', 'sleeveWidth', 'cuff', 'neck', 'chest', 'waist', 'hips', 'bottomWidth', 'pantsLength', 'pantsWaist', 'thigh', 'knee', 'legOpening'
  ];

  const statementEntries = React.useMemo(() => {
    interface StatementEntry {
        id: string;
        date: Date;
        description: string;
        debit: number; // عليه (يزيد الدين / مشتريات آجلة)
        credit: number; // له (ينقص الدين / دفعات)
        balance: number; // الرصيد التراكمي
        type: 'order' | 'b2b' | 'payment';
    }

    const entries: StatementEntry[] = [];

    // 1. POS Orders
    profileOrders.forEach(order => {
        if (order.paymentMethod === 'credit') {
            const deferredAmount = order.totalAmount - (order.paidAmount || 0);
            if (deferredAmount > 0 || order.isReturn) {
              entries.push({
                  id: `pos-${order.id}`,
                  date: new Date(order.date),
                  description: `فاتورة نقاط بيع ${order.isReturn ? '(مرتجع) ' : ''}#${order.id}`,
                  debit: order.isReturn ? 0 : deferredAmount,
                  credit: order.isReturn ? Math.abs(deferredAmount) : 0, 
                  balance: 0,
                  type: 'order'
              });
            }
        }
    });

    // 2. B2B Invoices
    profileB2BInvoices.forEach(inv => {
        const deferred = inv.totalAmount - inv.paidAmount;
        if(deferred > 0 || inv.status !== 'paid') {
            entries.push({
                id: `b2b-${inv.id}`,
                date: new Date(inv.createdAt),
                description: `فاتورة جملة #${inv.id}`,
                debit: deferred, 
                credit: 0, 
                balance: 0,
                type: 'b2b'
            });
        }
    });

    // 3. Payments
    profilePayments.forEach(payment => {
        // We only care about debt payments for the account statement reducing balance
        if (payment.type === 'debt_payment') {
            entries.push({
                id: `pay-${payment.id}`,
                date: new Date(payment.date),
                description: `سند قبض (سداد دفعة)${payment.note ? ' - ' + payment.note : ''}`,
                debit: 0,
                credit: payment.amount,
                balance: 0,
                type: 'payment'
            });
        }
    });

    // Sort by date ascending to calculate running balance
    entries.sort((a, b) => a.date.getTime() - b.date.getTime());

    let runningBalance = 0;
    entries.forEach(entry => {
        runningBalance += entry.debit;
        runningBalance -= entry.credit;
        entry.balance = runningBalance;
    });

    // Revert sort to descending for display (newest first)
    return entries.reverse();
  }, [profileOrders, profileB2BInvoices, profilePayments]);

  return (
    <div className="w-full lg:w-[60%] bg-white border-r border-slate-200 shadow-2xl flex flex-col h-full animate-in slide-in-from-left duration-300 relative z-20">
      {/* Profile Header */}
      <div className="relative bg-gradient-to-br from-slate-900 to-indigo-900 text-white p-6 shrink-0 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

        <div className="relative z-10 flex justify-between items-start">
          <button
            onClick={onCloseProfile}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={() => onEditProfile(selectedProfile)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>

        <div className="relative z-10 flex flex-col items-center mt-2">
          <div className="w-20 h-20 bg-white rounded-full p-1 shadow-xl mb-4">
            <div
              className={`w-full h-full rounded-full flex items-center justify-center text-3xl font-bold ${
                getCustomerStatus(selectedProfile).color
              }`}
            >
              {selectedProfile.name.substring(0, 1)}
            </div>
          </div>
          <h2 className="text-2xl font-bold">{selectedProfile.name}</h2>
          <div className="flex items-center gap-3 mt-2 flex-wrap justify-center">
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold backdrop-blur-sm border border-white/10 flex items-center gap-1">
              <Hash className="w-3 h-3" /> {selectedProfile.code || 'NO-CODE'}
            </span>
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold backdrop-blur-sm border border-white/10">
              {getCustomerStatus(selectedProfile).label}
            </span>
            {selectedProfile.tags &&
              selectedProfile.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-indigo-500/40 rounded-full text-xs font-bold backdrop-blur-sm border border-white/10"
                >
                  #{tag}
                </span>
              ))}
          </div>
        </div>

        {/* Quick Action Bar */}
        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={() => onOpenWhatsApp(selectedProfile.phone, selectedProfile.name)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-sm font-bold transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-green-400" /> واتساب
          </button>
          <button
            onClick={() => onOpenPaymentModal('wallet_deposit')}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-sm font-bold transition-colors"
          >
            <Coins className="w-4 h-4 text-amber-400" /> شحن رصيد
          </button>
          {(selectedProfile.balance || 0) > 0 && (
            <button
              onClick={() => onOpenPaymentModal('debt_payment')}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors shadow-lg"
            >
              <Banknote className="w-4 h-4" /> سداد دفعة
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="px-6 border-b border-slate-200 flex gap-6 bg-white sticky top-0 z-10 shadow-sm overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-4 text-sm font-bold border-b-[3px] transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          نظرة عامة
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`py-4 text-sm font-bold border-b-[3px] transition-all whitespace-nowrap ${
            activeTab === 'invoices'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          فواتير نقاط البيع ({profileOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('b2b_invoices')}
          className={`py-4 text-sm font-bold border-b-[3px] transition-all whitespace-nowrap ${
            activeTab === 'b2b_invoices'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          فواتير الجملة ({profileB2BInvoices.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`py-4 text-sm font-bold border-b-[3px] transition-all whitespace-nowrap ${
            activeTab === 'payments'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          الدفعات ({profilePayments.length})
        </button>
        <button
          onClick={() => setActiveTab('statement')}
          className={`py-4 text-sm font-bold border-b-[3px] transition-all whitespace-nowrap ${
            activeTab === 'statement'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          كشف الحساب
        </button>
        {showLoyaltyPoints && (
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-4 text-sm font-bold border-b-[3px] transition-all whitespace-nowrap ${
              activeTab === 'activity'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            الولاء والنشاطات
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            {/* Credit Health & Loyalty Grid */}
            <div className={`grid grid-cols-1 ${showCreditBalance && showLoyaltyPoints ? 'md:grid-cols-2' : ''} gap-4`}>
              {/* Credit Health Card */}
              {showCreditBalance && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                      <ShieldAlert className="w-4 h-4 text-indigo-500" />
                      الحالة الائتمانية
                    </h4>
                    {selectedProfile.creditLimit && selectedProfile.creditLimit > 0 && (
                      <span className="text-xs text-slate-500">
                        الحد: {formatCurrency(selectedProfile.creditLimit)}
                      </span>
                    )}
                  </div>

                  {selectedProfile.creditLimit && selectedProfile.creditLimit > 0 ? (
                    <>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            (selectedProfile.balance || 0) > selectedProfile.creditLimit
                              ? 'bg-red-500'
                              : (selectedProfile.balance || 0) > selectedProfile.creditLimit * 0.8
                              ? 'bg-orange-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              ((selectedProfile.balance || 0) / selectedProfile.creditLimit) * 100
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-700">
                          {formatCurrency(selectedProfile.balance || 0)} مستخدم
                        </span>
                        <span className="text-slate-400">
                          {formatCurrency(
                            Math.max(
                              0,
                              selectedProfile.creditLimit - (selectedProfile.balance || 0)
                            )
                          )}{' '}
                          متبقي
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-slate-400 text-xs py-2 bg-slate-50 rounded-lg">
                      لا يوجد حد ائتماني محدد (مفتوح)
                    </div>
                  )}
                </div>
              )}

              {/* Loyalty Card */}
              {showLoyaltyPoints && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-100 shadow-sm">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-amber-900 flex items-center gap-2 text-sm">
                      <Award className="w-4 h-4 text-amber-600" />
                      نقاط الولاء
                    </h4>
                    <span className="text-[10px] bg-white text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 font-bold">
                      Gold Member
                    </span>
                  </div>
                  <div className="flex items-end gap-2 mt-2">
                    <span className="text-3xl font-black text-amber-600">
                      {calculateLoyaltyPoints(selectedProfile.totalSpent)}
                    </span>
                    <span className="text-xs text-amber-700 font-bold mb-1">نقطة مكتسبة</span>
                  </div>
                  <p className="text-[10px] text-amber-600/70 mt-2">
                    يعادل {formatCurrency(calculateLoyaltyPoints(selectedProfile.totalSpent) * 10)}{' '}
                    رصيد مشتريات
                  </p>
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-400 font-bold mb-1">متوسط السلة</p>
                <p className="text-xl font-black text-slate-800">
                  {formatCurrency(customerInsights.avgBasket)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-400 font-bold mb-1">آخر زيارة</p>
                <p className="text-sm font-bold text-slate-800">
                  {customerInsights.lastVisit ? formatDate(customerInsights.lastVisit) : '-'}
                </p>
              </div>
            </div>

            {/* Spending Chart */}
            {customerInsights.monthlySpending.length > 0 && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-4 text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                  سلوك الشراء الشهري
                </h4>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={customerInsights.monthlySpending}>
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip
                        formatter={(val: number) => formatCurrency(val)}
                        contentStyle={{
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Info Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="font-bold text-slate-800 mb-4 text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500" />
                البيانات الشخصية
              </h4>
              <div className="space-y-3 text-sm">
                {selectedProfile.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-slate-600">{selectedProfile.email}</span>
                  </div>
                )}
                {selectedProfile.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-slate-600">{selectedProfile.address}</span>
                  </div>
                )}
                {collectB2BData && selectedProfile.companyName && (
                  <div className="flex items-start gap-3">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                        <span className="text-slate-500 text-xs font-bold">اسم الشركة</span>
                        <span className="text-slate-600 font-medium">{selectedProfile.companyName}</span>
                    </div>
                  </div>
                )}
                {collectB2BData && selectedProfile.taxNumber && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                        <span className="text-slate-500 text-xs font-bold">الرقم الضريبي</span>
                        <span className="text-slate-600 font-medium">{selectedProfile.taxNumber}</span>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 pt-2 border-t border-slate-100">
                  <Wallet className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-xs font-bold">رصيد المحفظة</span>
                    <span className="text-emerald-600 font-bold">{formatCurrency(selectedProfile.walletBalance || 0)}</span>
                  </div>
                </div>
                {selectedProfile.notes && (
                  <div className="bg-amber-50 p-3 rounded-lg text-amber-800 text-xs mt-2 border border-amber-100">
                    {selectedProfile.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Measurements Section */}
            {enableMeasurements && selectedProfile.measurements && Object.values(selectedProfile.measurements).some(val => val !== undefined && val !== '') && (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mt-4">
                <h4 className="font-bold text-slate-800 mb-4 text-sm flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-indigo-500" />
                  ملف المقاسات
                </h4>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {[
                      { id: 'length', key: 'length', label: 'الطول الكلي' },
                      { id: 'shoulder', key: 'shoulder', label: 'الكتف' },
                      { id: 'sleeveLength', key: 'sleeveLength', label: 'طول الكم' },
                      { id: 'sleeveWidth', key: 'sleeveWidth', label: 'وسع الكم' },
                      { id: 'cuff', key: 'cuff', label: 'الكبك / المعصم' },
                      { id: 'neck', key: 'neck', label: 'الرقبة' },
                      { id: 'chest', key: 'chest', label: 'الصدر' },
                      { id: 'waist', key: 'waist', label: 'الوسط/الخصر' },
                      { id: 'hips', key: 'hips', label: 'الحوض' },
                      { id: 'bottomWidth', key: 'bottomWidth', label: 'وسع أسفل' },
                      { id: 'pantsLength', key: 'pantsLength', label: 'طول البنطلون' },
                      { id: 'pantsWaist', key: 'pantsWaist', label: 'خصر البنطلون' },
                      { id: 'thigh', key: 'thigh', label: 'الفخذ' },
                      { id: 'knee', key: 'knee', label: 'الركبة' },
                      { id: 'legOpening', key: 'legOpening', label: 'وسع الرجل' },
                  ].filter(field => activeMeasurementFields.includes(field.id)).map(field => {
                    const value = (selectedProfile.measurements as any)?.[field.key];
                    if (!value) return null;
                    return (
                        <div key={field.key} className="bg-white p-2 rounded border border-slate-100 shadow-sm text-center">
                            <span className="text-slate-500 block text-[10px] font-bold">{field.label}</span>
                            <span className="font-bold text-slate-800 font-mono">{value}</span>
                        </div>
                    );
                  })}
                </div>
                {selectedProfile.measurements.notes && (
                  <div className="border-t border-slate-100 mt-4 pt-3">
                     <span className="text-indigo-600 font-bold block text-xs mb-1">ملاحظات والتفاصيل المفضلة</span>
                     <p className="text-slate-700 text-sm">{selectedProfile.measurements.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Top Products */}
            {customerInsights.favoriteItems.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-800 mb-3 text-sm">الأصناف المفضلة</h4>
                <div className="space-y-2">
                  {customerInsights.favoriteItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100"
                    >
                      <span className="text-sm font-medium text-slate-700">{item.name}</span>
                      <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded">
                        x{item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-center mb-2">
              <button
                onClick={selectAllInvoices}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                تحديد الكل
              </button>
              <button
                onClick={handlePrintSelected}
                className="text-xs font-bold bg-white border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 flex items-center gap-1"
              >
                <Printer className="w-3 h-3" /> طباعة المحدد ({selectedInvoiceIds.size})
              </button>
            </div>
            {profileOrders.length === 0 ? (
              <div className="text-center py-10 text-slate-400">لا توجد فواتير</div>
            ) : (
              profileOrders.map((order) => (
                <div
                  key={order.id}
                  className={`bg-white p-4 rounded-xl border transition-all ${
                    selectedInvoiceIds.has(order.id!)
                      ? 'border-indigo-500 bg-indigo-50/10'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => toggleInvoiceSelection(order.id!)}
                        className={`w-5 h-5 rounded border cursor-pointer flex items-center justify-center ${
                          selectedInvoiceIds.has(order.id!)
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {selectedInvoiceIds.has(order.id!) && <CheckSquare className="w-3 h-3" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">فاتورة #{order.id}</p>
                        <p className="text-xs text-slate-500">{formatDate(order.date)}</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-800">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs pl-8">
                    <span
                      className={`px-2 py-0.5 rounded ${
                        order.paymentMethod === 'credit'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {order.paymentMethod === 'credit' ? 'آجل' : 'نقدي'}
                    </span>
                    <button
                      onClick={() => setViewOrder(order)}
                      className="text-indigo-600 hover:underline"
                    >
                      عرض التفاصيل
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'b2b_invoices' && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            {profileB2BInvoices.length === 0 ? (
              <div className="text-center py-10 text-slate-400">لا توجد فواتير جملة</div>
            ) : (
              profileB2BInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">فاتورة جملة #{invoice.id}</p>
                        <p className="text-xs text-slate-500">{formatDate(invoice.createdAt)}</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-800">
                      {formatCurrency(invoice.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs pl-8">
                    <span
                      className={`px-2 py-0.5 rounded ${
                        invoice.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-700'
                          : invoice.status === 'partial'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {invoice.status === 'paid' ? 'مدفوعة' : invoice.status === 'partial' ? 'جزئي' : 'غير مدفوعة'}
                    </span>
                    <span className="text-slate-500">
                      تاريخ الاستحقاق: {formatDate(invoice.dueDate)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-3 animate-in slide-in-from-right-4 duration-300">
            {profilePayments.length === 0 ? (
              <div className="text-center py-10 text-slate-400">لا توجد سجلات دفع</div>
            ) : (
              profilePayments.map((payment) => (
                <div
                  key={payment.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center hover:shadow-sm transition-shadow"
                >
                  <div>
                    <p className="font-bold text-slate-800 text-sm">
                      {payment.type === 'wallet_deposit' ? 'شحن محفظة' : 'سداد دفعة'}
                    </p>
                    <p className="text-xs text-slate-500">{formatDate(payment.date)}</p>
                    {payment.note && (
                      <p className="text-xs text-slate-400 mt-1 italic">{payment.note}</p>
                    )}
                  </div>
                  <span
                    className={`font-bold ${
                      payment.type === 'wallet_deposit' ? 'text-emerald-600' : 'text-indigo-600'
                    }`}
                  >
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'statement' && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                <div>
                    <h4 className="font-bold text-slate-800">الرصيد الدفتري للعميل</h4>
                    <p className="text-xs text-slate-500">يمثل إجمالي المديونية الحالية</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-black text-rose-600">{formatCurrency(selectedProfile.balance || 0)}</span>
                  <button 
                    onClick={() => {
                        const printWindow = window.open('', '_blank');
                        if (!printWindow) return;
                        const html = `
                            <html dir="rtl">
                                <head>
                                    <title>كشف حساب - ${selectedProfile.name}</title>
                                    <style>
                                        body { font-family: system-ui, Tahoma, Arial, sans-serif; padding: 20px; color: #333; }
                                        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                                        .info { margin-bottom: 20px; font-size: 14px; }
                                        table { width: 100%; border-collapse: collapse; font-size: 13px; }
                                        th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                                        th { background-color: #f8f9fa; }
                                        .debit { color: #dc2626; font-weight: bold; text-align: left; }
                                        .credit { color: #16a34a; font-weight: bold; text-align: left; }
                                        .balance { font-weight: bold; text-align: left; }
                                    </style>
                                </head>
                                <body>
                                    <div class="header">
                                        <h2>كشف حساب تفصيلي</h2>
                                        <p>طبع في: ${new Date().toLocaleString('ar-EG')}</p>
                                    </div>
                                    <div class="info">
                                        <strong>اسم العميل:</strong> ${selectedProfile.name}<br/>
                                        <strong>رقم الهاتف:</strong> ${selectedProfile.phone || '-'}<br/>
                                        <strong>إجمالي المديونية الحالية:</strong> ${formatCurrency(selectedProfile.balance || 0)}
                                    </div>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>التاريخ</th>
                                                <th>البيان</th>
                                                <th style="text-align: left;">مدين (عليه)</th>
                                                <th style="text-align: left;">دائن (له)</th>
                                                <th style="text-align: left;">الرصيد المشترك</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${statementEntries.map(e => `
                                                <tr>
                                                    <td>${new Date(e.date).toLocaleDateString('ar-EG')}</td>
                                                    <td>${e.description}</td>
                                                    <td class="debit">${e.debit > 0 ? formatCurrency(e.debit) : '-'}</td>
                                                    <td class="credit">${e.credit > 0 ? formatCurrency(e.credit) : '-'}</td>
                                                    <td class="balance">${formatCurrency(e.balance)}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                    <script>window.onload = () => { window.print(); window.close(); }</script>
                                </body>
                            </html>
                        `;
                        printWindow.document.write(html);
                        printWindow.document.close();
                    }}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600 flex items-center gap-2 text-sm font-bold"
                  >
                    <Printer className="w-4 h-4" />
                    طباعة الكشف
                  </button>
                </div>
            </div>
            
            {statementEntries.length === 0 ? (
              <div className="text-center py-10 text-slate-400">لا يوجد سجل عمليات للعميل</div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3">التاريخ</th>
                                <th className="px-4 py-3">البيان</th>
                                <th className="px-4 py-3 text-rose-600 text-left">مدين (عليه)</th>
                                <th className="px-4 py-3 text-emerald-600 text-left">دائن (له)</th>
                                <th className="px-4 py-3 text-slate-800 text-left">الرصيد</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {statementEntries.map(entry => (
                                <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                                        <div className="font-medium text-slate-800">{new Date(entry.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                                        <div className="text-[10px]">{new Date(entry.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-700 max-w-[200px] flex items-center gap-2">
                                        {entry.type === 'order' && <FileText className="w-3 h-3 text-indigo-400 shrink-0" />}
                                        {entry.type === 'b2b' && <FileText className="w-3 h-3 text-amber-400 shrink-0" />}
                                        {entry.type === 'payment' && <Banknote className="w-3 h-3 text-emerald-400 shrink-0" />}
                                        <span className="truncate">{entry.description}</span>
                                    </td>
                                    <td className="px-4 py-3 text-rose-600 font-bold text-left whitespace-nowrap">
                                        {entry.debit > 0 ? (
                                            <div className="flex items-center justify-end gap-1">
                                                <span>{formatCurrency(entry.debit)}</span>
                                                <ArrowUpRight className="w-3 h-3 opacity-50" />
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-emerald-600 font-bold text-left whitespace-nowrap">
                                        {entry.credit > 0 ? (
                                            <div className="flex items-center justify-end gap-1">
                                                <span>{formatCurrency(entry.credit)}</span>
                                                <ArrowDownRight className="w-3 h-3 opacity-50" />
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-slate-800 font-black text-left whitespace-nowrap bg-slate-50/50">
                                        {formatCurrency(entry.balance)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === 'activity' && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            {profileLoyalty && profileLoyalty.length === 0 ? (
              <div className="text-center py-10 text-slate-400">لا يوجد سجل نشاطات أو ولاء</div>
            ) : (
              profileLoyalty?.map((txn) => (
                <div
                  key={txn.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${txn.type === 'earn' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {txn.type === 'earn' ? <TrendingUp className="w-4 h-4" /> : <TrendingUp className="w-4 h-4 rotate-180" />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{txn.note || (txn.type === 'earn' ? 'اكتساب نقاط' : 'استهلاك نقاط')}</p>
                      <p className="text-xs text-slate-500">{formatDate(txn.date)}</p>
                      {txn.orderId && <p className="text-xs text-slate-400 mt-1">طلب #{txn.orderId}</p>}
                    </div>
                  </div>
                  <div className={`font-black text-lg ${txn.type === 'earn' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {txn.type === 'earn' ? '+' : '-'}{txn.points} <span className="text-xs font-normal opacity-70">نقطة</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerProfile;
