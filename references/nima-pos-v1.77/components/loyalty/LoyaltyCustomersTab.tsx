import React, { useState } from 'react';
import { Search, Star, Award, History, ArrowUpRight, ArrowDownRight, X, AlertCircle } from 'lucide-react';
import { Customer, LoyaltySettings, LoyaltyTier } from '../../types';

interface LoyaltyCustomersTabProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loyaltyConfig: LoyaltySettings;
  filteredCustomers: Customer[];
  currency: string;
  getCustomerTier: (points: number) => LoyaltyTier | null;
  openHistory: (customer: Customer) => void;
  handleAdjustPoints: (customer: Customer, amount: number, type: 'manual_add' | 'manual_deduct') => void;
}

const LoyaltyCustomersTab: React.FC<LoyaltyCustomersTabProps> = ({
  searchQuery,
  setSearchQuery,
  loyaltyConfig,
  filteredCustomers,
  currency,
  getCustomerTier,
  openHistory,
  handleAdjustPoints,
}) => {
  // Safe UI state for adjustment instead of native window.prompt
  const [adjustModal, setAdjustModal] = useState<{
    customer: Customer;
    type: 'manual_add' | 'manual_deduct';
  } | null>(null);
  
  const [pointsInput, setPointsInput] = useState<string>('');
  const [adjustError, setAdjustError] = useState<string>('');

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(pointsInput);
    if (isNaN(parsed) || parsed <= 0) {
      setAdjustError('برجاء إدخال عدد نقاط صحيح أكبر من الصفر');
      return;
    }
    
    if (adjustModal) {
      if (adjustModal.type === 'manual_deduct' && parsed > (adjustModal.customer.loyaltyPoints || 0)) {
        setAdjustError('لا يمكن خصم نقاط أكثر من رصيد العميل الحالي');
        return;
      }
      
      handleAdjustPoints(adjustModal.customer, parsed, adjustModal.type);
      setAdjustModal(null);
      setPointsInput('');
      setAdjustError('');
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-3xl shadow-sm border border-indigo-100/10 overflow-hidden animate-in fade-in font-['Tajawal']">
      <div className="p-4 border-b border-indigo-100/20 flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-white/40 gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 w-5 h-5 stroke-[2]" />
          <input
            type="text"
            placeholder="ابحث عن عميل بالاسم أو رقم الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 bg-white border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
          />
        </div>

        {!loyaltyConfig.enabled && (
          <div className="bg-amber-50 text-amber-600 border border-amber-200/50 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 animate-pulse self-start sm:self-auto">
            <Star className="w-4 h-4 fill-amber-500 stroke-amber-600" />
            برنامج الولاء غير مفعل حالياً
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-slate-50/70 border-b border-indigo-100/20 text-slate-500 text-xs font-black">
              <th className="p-4">العميل</th>
              <th className="p-4">رقم الهاتف</th>
              {loyaltyConfig.enableTiers && <th className="p-4">المستوى</th>}
              <th className="p-4">إجمالي المشتريات</th>
              <th className="p-4">النقاط الحالية</th>
              <th className="p-4">القيمة المعادلة</th>
              <th className="p-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-indigo-50/20">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={loyaltyConfig.enableTiers ? 7 : 6} className="p-12 text-center text-slate-500 font-bold">
                  لا يوجد عملاء مطابقين للبحث
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer) => {
                const points = customer.loyaltyPoints || 0;
                const value = points * (loyaltyConfig.currencyPerPoint || 0);
                const tier = getCustomerTier(points);

                return (
                  <tr key={customer.id} className="hover:bg-white/40 transition-colors">
                    <td className="p-4">
                      <div className="font-black text-slate-800">{customer.name}</div>
                      {customer.code && <div className="text-[10px] text-slate-400 font-bold mt-0.5">{customer.code}</div>}
                    </td>
                    <td className="p-4 text-slate-600 font-mono text-xs" dir="ltr">
                      {customer.phone}
                    </td>

                    {loyaltyConfig.enableTiers && (
                      <td className="p-4">
                        {tier ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black text-white shadow-sm"
                            style={{ backgroundColor: tier.color }}
                          >
                            <Award className="w-3.5 h-3.5" />
                            {tier.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-bold">عادي</span>
                        )}
                      </td>
                    )}

                    <td className="p-4 font-black text-slate-700 text-sm">
                      {customer.totalSpent.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-sm ${
                          points > 0 
                            ? 'bg-amber-50 text-amber-600 border border-amber-200/50' 
                            : 'bg-slate-50 text-slate-600 border border-slate-200/50'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${points > 0 ? 'fill-amber-400 text-amber-500' : ''}`} />
                        {points}
                      </span>
                    </td>
                    <td className="p-4 font-black text-emerald-600 text-sm">
                      {value > 0 ? `${value.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}` : '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openHistory(customer)}
                          className="p-2 bg-sky-50 text-sky-600 hover:bg-sky-100 rounded-xl border border-sky-100 transition-all cursor-pointer active:scale-95"
                          title="سجل النقاط"
                        >
                          <History className="w-4 h-4 stroke-[2]" />
                        </button>
                        <button
                          onClick={() => {
                            setAdjustModal({ customer, type: 'manual_add' });
                            setPointsInput('');
                            setAdjustError('');
                          }}
                          className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl border border-emerald-100 transition-all cursor-pointer active:scale-95"
                          title="إضافة نقاط يدوياً"
                        >
                          <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                        </button>
                        <button
                          onClick={() => {
                            setAdjustModal({ customer, type: 'manual_deduct' });
                            setPointsInput('');
                            setAdjustError('');
                          }}
                          className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl border border-rose-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                          title="خصم نقاط يدوياً"
                          disabled={points === 0}
                        >
                          <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modern, safe Point Adjustment Dialog */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 border border-indigo-100/10 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
              <h3 className="font-black text-lg text-slate-800">
                {adjustModal.type === 'manual_add' ? 'إضافة نقاط يدوية للعميل' : 'خصم نقاط يدوية من العميل'}
              </h3>
              <button
                onClick={() => setAdjustModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5 stroke-[2]" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <p className="text-slate-500 font-bold text-xs mb-3 leading-relaxed">
                  العميل: <span className="text-slate-800 font-extrabold">{adjustModal.customer.name}</span>
                  <br />
                  الرصيد الحالي: <span className="text-amber-600 font-extrabold">{adjustModal.customer.loyaltyPoints || 0} نقطة</span>
                </p>

                <label className="block text-xs font-black text-slate-700 mb-2">عدد النقاط المراد تعديلها</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="أدخل عدد النقاط..."
                    value={pointsInput}
                    onChange={(e) => setPointsInput(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-extrabold"
                    autoFocus
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">نقاط</span>
                </div>
              </div>

              {adjustError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{adjustError}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModal(null)}
                  className="px-4 py-2.5 text-xs font-black text-slate-500 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 text-xs font-black text-white rounded-xl shadow-md transition-all active:scale-95 cursor-pointer ${
                    adjustModal.type === 'manual_add'
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25'
                      : 'bg-gradient-to-br from-rose-500 to-red-650 hover:from-rose-600 hover:to-red-750 shadow-rose-500/25'
                  }`}
                >
                  تأكيد وحفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoyaltyCustomersTab;
