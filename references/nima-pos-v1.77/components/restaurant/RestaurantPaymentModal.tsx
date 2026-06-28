import React from 'react';
import { Banknote, CreditCard, Star } from 'lucide-react';
import { AppSettings } from '../../types';

interface RestaurantPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCustomer: any;
  settings: AppSettings | undefined;
  loyaltyRedeemedPoints: number;
  setLoyaltyRedeemedPoints: (val: number) => void;
  total: number;
  currency: string;
  formatCurrency: (val: number) => string;
  processPayment: (method: 'cash' | 'card') => void;
  setIsProformaInvoiceOpen: (val: boolean) => void;
}

export const RestaurantPaymentModal: React.FC<RestaurantPaymentModalProps> = ({
  isOpen, onClose, selectedCustomer, settings, loyaltyRedeemedPoints,
  setLoyaltyRedeemedPoints, total, currency, formatCurrency, processPayment, setIsProformaInvoiceOpen
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-[2rem] w-full max-w-md shadow-[0_30px_60px_rgba(0,0,0,0.15)] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 bg-slate-800 text-white text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <h2 className="text-2xl font-black mb-1 relative z-10">طريقة الدفع</h2>
                <p className="text-slate-400 text-sm font-medium relative z-10">اختر طريقة دفع العميل لإغلاق الفاتورة</p>
            </div>
            <div className="p-8">
                {selectedCustomer && (selectedCustomer.loyaltyPoints || 0) >= (settings?.loyaltySettings?.minPointsToRedeem || 0) && settings?.loyaltySettings?.enabled && (
                    <div className="mb-6 bg-emerald-50 rounded-2xl p-4 border border-emerald-100 text-right">
                        <div className="flex justify-between items-center mb-3">
                            <span className="font-bold text-emerald-800 flex items-center gap-2"><Star className="w-4 h-4" /> نقاط الولاء المتاحة:</span>
                            <span className="font-black text-xl text-emerald-600">{selectedCustomer.loyaltyPoints} نقطة</span>
                        </div>
                        <div className="flex gap-2 items-center">
                            <input 
                                type="number" 
                                value={loyaltyRedeemedPoints || ''}
                                onChange={(e) => {
                                    let val = parseInt(e.target.value) || 0;
                                    if (val > (selectedCustomer.loyaltyPoints || 0)) val = selectedCustomer.loyaltyPoints || 0;
                                    const currencyPerPoint = settings?.loyaltySettings?.currencyPerPoint || 1;
                                    const maxPointsForTotal = Math.ceil(total / currencyPerPoint);
                                    if (val > maxPointsForTotal) val = maxPointsForTotal;
                                    setLoyaltyRedeemedPoints(val);
                                }}
                                min={0}
                                className="w-full p-3 rounded-xl border border-emerald-200 focus:border-emerald-500 outline-none"
                                placeholder="عدد النقاط للاستبدال"
                            />
                            <button 
                                onClick={() => {
                                    const currencyPerPoint = settings?.loyaltySettings?.currencyPerPoint || 1;
                                    const maxPointsForTotal = Math.ceil(total / currencyPerPoint);
                                    setLoyaltyRedeemedPoints(Math.min(selectedCustomer.loyaltyPoints || 0, maxPointsForTotal));
                                }}
                                className="whitespace-nowrap px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition"
                            >
                                الحد الأقصى
                            </button>
                        </div>
                        {loyaltyRedeemedPoints > 0 && (
                            <div className="mt-3 text-sm font-bold text-emerald-700">
                                قيمة الخصم: {formatCurrency(loyaltyRedeemedPoints * (settings?.loyaltySettings?.currencyPerPoint || 1))} {currency}
                            </div>
                        )}
                    </div>
                )}

                <div className="text-center mb-8 bg-slate-50 py-6 rounded-3xl border border-slate-100 relative font-['Cairo']">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm font-sans">المطلوب سداده</div>
                    <p className="text-5xl font-black text-slate-800 tracking-tight flex items-baseline justify-center gap-2">
                        {formatCurrency(Math.max(0, total - (loyaltyRedeemedPoints * (settings?.loyaltySettings?.currencyPerPoint || 1))))} <span className="text-xl font-bold text-slate-400 font-sans">{currency}</span>
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <button onClick={() => processPayment('cash')} className="py-6 bg-white border-2 border-emerald-500 hover:bg-emerald-50 rounded-3xl font-bold text-emerald-700 text-xl flex flex-col items-center justify-center gap-3 transition-all hover:scale-105 hover:shadow-xl shadow-emerald-500/10">
                        <Banknote className="w-10 h-10" /> 
                        <span>نقدي</span>
                    </button>
                    <button onClick={() => processPayment('card')} className="py-6 bg-white border-2 border-blue-500 hover:bg-blue-50 rounded-3xl font-bold text-blue-700 text-xl flex flex-col items-center justify-center gap-3 transition-all hover:scale-105 hover:shadow-xl shadow-blue-500/10">
                        <CreditCard className="w-10 h-10" /> 
                        <span>بطاقة</span>
                    </button>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => setIsProformaInvoiceOpen(true)} className="flex-1 py-4 text-brand-600 bg-brand-50 font-bold hover:bg-brand-100 rounded-2xl transition-colors">
                       معاينة الفاتورة
                   </button>
                   <button onClick={onClose} className="flex-1 py-4 text-slate-500 bg-slate-50 font-bold hover:bg-slate-100 rounded-2xl transition-colors">
                       إلغاء والعودة
                   </button>
                </div>
            </div>
        </div>
    </div>
  );
};
