import React from 'react';
import { X, Banknote, CreditCard, WalletCards, Coins, Split, AlertTriangle, Star } from 'lucide-react';
import { Customer, AppSettings } from '../../types';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    isRefundMode: boolean;
    totals: { subtotal: number; discountAmount: number; tax: number; total: number };
    paymentMethod: 'cash' | 'card' | 'credit' | 'wallet' | 'split';
    setPaymentMethod: (method: 'cash' | 'card' | 'credit' | 'wallet' | 'split') => void;
    amountReceived: number;
    setAmountReceived: (amount: number | ((prev: number) => number)) => void;
    splitCash: number;
    setSplitCash: (amount: number) => void;
    splitCard: number;
    setSplitCard: (amount: number) => void;
    dueDate: string;
    setDueDate: (date: string) => void;
    selectedCustomerId: number | null;
    customers: Customer[] | undefined;
    settings: AppSettings | undefined;
    loyaltyPointsUsed: number;
    setLoyaltyPointsUsed: (points: number) => void;
    giftCardCode: string;
    setGiftCardCode: (code: string) => void;
    giftCardAmount: number;
    setGiftCardAmount: (amount: number) => void;
    checkoutError: string | null;
    handleFinalizeCheckout: () => void;
    formatCurrency: (amount: number) => string;
    onPreview?: () => void;
    isReservation?: boolean;
    setIsReservation?: (v: boolean) => void;
    reservationDueDate?: string;
    setReservationDueDate?: (v: string) => void;
    reservationDeliveredItems?: { productId: number; quantity: number }[];
    setReservationDeliveredItems?: any;
    cart?: any[];
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
    isOpen, onClose, isRefundMode, totals, paymentMethod, setPaymentMethod,
    amountReceived, setAmountReceived, splitCash, setSplitCash, splitCard, setSplitCard,
    dueDate, setDueDate, selectedCustomerId, customers, settings,
    loyaltyPointsUsed, setLoyaltyPointsUsed, 
    giftCardCode, setGiftCardCode, giftCardAmount, setGiftCardAmount,
    checkoutError, handleFinalizeCheckout, formatCurrency, onPreview,
    isReservation = false,
    setIsReservation,
    reservationDueDate = '',
    setReservationDueDate,
    reservationDeliveredItems = [],
    setReservationDeliveredItems,
    cart = []
}) => {
    const [isTerminalProcessing, setIsTerminalProcessing] = React.useState(false);

    if (!isOpen) return null;

    const handleSendToTerminal = async () => {
        try {
            setIsTerminalProcessing(true);
            const { hardwareService } = await import('../../utils/hardware');
            await hardwareService.sendToPaymentTerminal(totals.total);
            setAmountReceived(totals.total);
            alert('تم التحصيل من الماكينة بنجاح (Simulation)');
        } catch (error) {
            alert('فشل الاتصال بماكينة الدفع');
        } finally {
            setIsTerminalProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 fade-in-up">
            <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-2xl font-black text-slate-800">{isRefundMode ? 'إتمام المرتجع' : 'إتمام الدفع'}</h2>
                    <button onClick={onClose} className="bg-white p-2 rounded-full shadow-sm hover:text-red-500"><X className="w-6 h-6" /></button>
                </div>
                
                <div className="flex flex-1 overflow-hidden">
                    <div className="flex-1 p-8 overflow-y-auto">
                         {/* Payment Methods */}
                         <div className="grid grid-cols-5 gap-2 bg-slate-100 p-1.5 rounded-2xl mb-8">
                            {['cash', 'card', 'wallet', 'credit', 'split']
                            .filter(m => {
                                if (m === 'split' && settings?.posSettings?.showSplitPayment === false) return false;
                                return true;
                            })
                            .map(m => (
                                <button key={m} onClick={() => {setPaymentMethod(m as any); if(m==='card' || m==='wallet') setAmountReceived(totals.total); else if (m==='credit') setAmountReceived(0);}} className={`py-3 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${paymentMethod === m ? 'bg-white text-brand-600 shadow-md scale-105' : 'text-gray-500 hover:text-gray-700'}`}>
                                    {m === 'cash' ? <Banknote className="w-5 h-5"/> : m === 'card' ? <CreditCard className="w-5 h-5"/> : m === 'wallet' ? <Coins className="w-5 h-5"/> : m === 'split' ? <Split className="w-5 h-5"/> : <WalletCards className="w-5 h-5"/>}
                                    {m === 'cash' ? 'نقدي' : m === 'card' ? 'بطاقة' : m === 'wallet' ? 'محفظة' : m === 'split' ? 'متعدد' : 'آجل'}
                                </button>
                            ))}
                        </div>
                        
                        {paymentMethod === 'cash' && (
                            <div className="space-y-4">
                              <input type="number" onFocus={(e) => e.target.select()} value={amountReceived || ''} onChange={e => setAmountReceived(Number(e.target.value))} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-3xl font-bold text-center text-slate-800 focus:border-brand-500 focus:bg-white transition-all outline-none" autoFocus placeholder="المبلغ المستلم" />
                              
                              <div className="grid grid-cols-4 gap-2">
                                  <button onClick={() => setAmountReceived(totals.total)} className="py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors">بالضبط</button>
                                  {(() => {
                                      const absTotal = Math.abs(totals.total);
                                      let btn1 = 50, btn2 = 100, btn3 = 200;
                                      if (absTotal > 0 && absTotal <= 50) { btn1 = 50; btn2 = 100; btn3 = 200; }
                                      else if (absTotal > 50 && absTotal <= 100) { btn1 = 100; btn2 = 150; btn3 = 200; }
                                      else if (absTotal > 100 && absTotal <= 500) { btn1 = Math.ceil(absTotal / 50) * 50; btn2 = btn1 + 50; btn3 = btn1 + 100; }
                                      else { btn1 = Math.ceil(absTotal / 100) * 100; btn2 = btn1 + 100; btn3 = btn1 + 500; }
                                      
                                      return (
                                          <>
                                            <button onClick={() => setAmountReceived(isRefundMode ? -btn1 : btn1)} className="py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors">{isRefundMode ? -btn1 : btn1}</button>
                                            <button onClick={() => setAmountReceived(isRefundMode ? -btn2 : btn2)} className="py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors">{isRefundMode ? -btn2 : btn2}</button>
                                            <button onClick={() => setAmountReceived(isRefundMode ? -btn3 : btn3)} className="py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors">{isRefundMode ? -btn3 : btn3}</button>
                                          </>
                                      );
                                  })()}
                              </div>

                              <div className={`flex justify-between items-center p-5 rounded-2xl border-2 ${Math.abs(amountReceived) >= Math.abs(totals.total) ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                                  <span className="font-bold text-lg">{Math.abs(amountReceived) >= Math.abs(totals.total) ? 'الباقي للزبون' : 'متبقي'}</span>
                                  <span className="text-2xl font-black">{formatCurrency(Math.abs(amountReceived - totals.total))}</span>
                              </div>
                            </div>
                        )}

                        {paymentMethod === 'card' && (
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col items-center justify-center gap-3">
                                    <CreditCard className="w-12 h-12 text-blue-500" />
                                    <p className="text-sm font-bold text-blue-800 text-center">المطلوب تحصيله عبر البطاقة</p>
                                    <p className="text-3xl font-black text-brand-600 mb-2">{formatCurrency(totals.total)}</p>
                                    
                                    <button 
                                        onClick={handleSendToTerminal}
                                        disabled={isTerminalProcessing}
                                        className={`w-full py-3 rounded-xl font-bold text-white flex justify-center items-center gap-2 transition-all ${isTerminalProcessing ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                                    >
                                        {isTerminalProcessing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                                جاري الاتصال بماكينة الدفع...
                                            </>
                                        ) : (
                                            <>
                                                <CreditCard className="w-5 h-5" /> إرسال القيمة للماكينة
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {paymentMethod === 'split' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">نقدي</label>
                                    <input type="number" onFocus={(e) => e.target.select()} value={splitCash} onChange={e => setSplitCash(Number(e.target.value))} className="w-full p-3 border rounded-xl" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">بطاقة</label>
                                    <input type="number" onFocus={(e) => e.target.select()} value={splitCard} onChange={e => setSplitCard(Number(e.target.value))} className="w-full p-3 border rounded-xl" />
                                </div>
                                <p className="text-center text-sm font-bold">الإجمالي: {formatCurrency(splitCash + splitCard)} / {formatCurrency(totals.total)}</p>
                            </div>
                        )}

                        {paymentMethod === 'credit' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">المبلغ المدفوع الان (اختياري)</label>
                                    <input type="number" onFocus={(e) => e.target.select()} value={amountReceived || ''} onChange={e => setAmountReceived(Number(e.target.value))} className="w-full p-3 border rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" placeholder="0" />
                                </div>
                                <div className="flex justify-between items-center p-4 rounded-xl bg-slate-50 border border-slate-200">
                                    <span className="font-bold text-slate-600">{totals.total < 0 ? 'المبلغ المخصوم من الحساب' : 'المبلغ الآجل المتبقي'}</span>
                                    <span className="text-xl font-black text-brand-600">{formatCurrency(Math.abs(totals.total - amountReceived))}</span>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">تاريخ الاستحقاق (اختياري)</label>
                                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full p-3 border rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
                                </div>
                            </div>
                        )}

                        {/* Reservation system section */}
                        {setIsReservation && setReservationDueDate && setReservationDeliveredItems && (
                            <div className="mt-4 p-5 rounded-2xl border-2 border-brand-100 bg-brand-50/20 space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input 
                                            type="checkbox" 
                                            checked={isReservation} 
                                            onChange={e => {
                                                const checked = e.target.checked;
                                                setIsReservation(checked);
                                                if (checked) {
                                                    // Default delivered quantities to 0
                                                    setReservationDeliveredItems(cart.map(item => ({ productId: item.id || 0, quantity: 0 })));
                                                }
                                            }} 
                                            className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500" 
                                        />
                                        <span className="font-extrabold text-slate-800 text-sm">حجز مؤجل للبضاعة (سداد عربون / استلام لاحق)</span>
                                    </label>
                                    <span className="text-xs bg-brand-100 text-brand-800 px-2.5 py-1 rounded-full font-bold">حجز بضاعة</span>
                                </div>

                                {isReservation && (
                                    <div className="space-y-4 pt-2 border-t border-brand-100 animate-fadeIn">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">تاريخ الاستلام المتوقع</label>
                                            <input 
                                                type="date" 
                                                value={reservationDueDate} 
                                                onChange={e => setReservationDueDate(e.target.value)} 
                                                className="w-full p-2.5 border border-slate-200 bg-white rounded-xl focus:border-brand-500 outline-none font-medium text-sm transition-all" 
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-black text-slate-800">الكميات المستلمة اليوم:</span>
                                                <div className="flex gap-2">
                                                    <button 
                                                        type="button"
                                                        onClick={() => setReservationDeliveredItems(cart.map(item => ({ productId: item.id || 0, quantity: item.quantity })))}
                                                        className="text-[10px] bg-white border border-slate-200 hover:bg-slate-50 px-2 py-1 rounded font-bold text-slate-700 transition-colors"
                                                    >
                                                        استلام الكل الآن
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setReservationDeliveredItems(cart.map(item => ({ productId: item.id || 0, quantity: 0 })))}
                                                        className="text-[10px] bg-white border border-slate-200 hover:bg-slate-50 px-2 py-1 rounded font-bold text-slate-700 transition-colors"
                                                    >
                                                        حجز الكل (لم يستلم شيء)
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100 bg-white">
                                                {cart.map(item => {
                                                    const deliveredEntry = reservationDeliveredItems.find(d => d.productId === item.id);
                                                    const deliveredQty = deliveredEntry ? deliveredEntry.quantity : 0;
                                                    return (
                                                        <div key={item.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                                                            <div className="flex-1 min-w-0 pr-1 text-right">
                                                                <p className="font-bold text-slate-700 truncate">{item.name}</p>
                                                                <p className="text-[10px] text-slate-400">إجمالي السلة: {item.quantity} {item.selectedUnit?.name || 'حبة'}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] text-brand-700 font-bold bg-brand-50 px-2.5 py-1 rounded-lg">المستلم:</span>
                                                                <input 
                                                                    type="number" 
                                                                    min={0}
                                                                    max={item.quantity}
                                                                    value={deliveredQty}
                                                                    onChange={e => {
                                                                        const val = Math.min(item.quantity, Math.max(0, Number(e.target.value)));
                                                                        setReservationDeliveredItems(reservationDeliveredItems.map(d => d.productId === item.id ? { ...d, quantity: val } : d));
                                                                    }}
                                                                    className="w-16 p-1 border text-center font-bold bg-slate-50 rounded-lg focus:bg-white transition-all text-slate-800"
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Loyalty Points */}
                        {selectedCustomerId && customers?.find(c => c.id === selectedCustomerId)?.loyaltyPoints && customers.find(c => c.id === selectedCustomerId)!.loyaltyPoints! > 0 && settings?.loyaltySettings?.enabled && (
                            <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-amber-800 flex items-center gap-2"><Star className="w-4 h-4" /> نقاط الولاء المتاحة:</span>
                                    <span className="font-black text-amber-600">{customers.find(c => c.id === selectedCustomerId)?.loyaltyPoints} نقطة</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <input 
                                        type="number" 
                                        max={customers.find(c => c.id === selectedCustomerId)?.loyaltyPoints}
                                        value={loyaltyPointsUsed || ''}
                                        onChange={e => {
                                            const val = Math.max(0, Math.floor(Number(e.target.value)));
                                            const maxPoints = customers.find(c => c.id === selectedCustomerId)?.loyaltyPoints || 0;
                                            const minRequired = settings?.loyaltySettings?.minPointsToRedeem || 0;
                                            
                                            if (val > 0 && val < minRequired) {
                                                // We can either set it to 0 or leave it and show an error. 
                                                // Just capping and letting the user see it's clamped is easier, or don't clamp the input but validate on submit.
                                                // Let's just limit the max for now, the user must reach the minimum.
                                                setLoyaltyPointsUsed(Math.min(val, maxPoints));
                                            } else {
                                                setLoyaltyPointsUsed(Math.min(val, maxPoints));
                                            }
                                        }}
                                        className="flex-1 p-2 border border-amber-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-400"
                                        placeholder="عدد النقاط للاستخدام"
                                    />
                                    <span className="text-sm font-bold text-amber-700">
                                        = {formatCurrency(loyaltyPointsUsed * (settings.loyaltySettings.currencyPerPoint || 0))} خصم
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Gift Cards */}
                        <div className="mt-4 p-4 bg-purple-50 border border-purple-100 rounded-2xl">
                            <label className="block text-xs font-bold text-purple-800 mb-1">استخدام بطاقة هدية (قسيمة)</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={giftCardCode}
                                    onChange={e => setGiftCardCode(e.target.value.toUpperCase())}
                                    placeholder="أدخل كود البطاقة"
                                    className="flex-1 p-2 border border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-400"
                                />
                                <input
                                    type="number"
                                    value={giftCardAmount || ''}
                                    onChange={e => setGiftCardAmount(Number(e.target.value))}
                                    placeholder="المبلغ المراد خصه"
                                    className="w-32 p-2 border border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-400"
                                />
                            </div>
                        </div>

                        {checkoutError && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-700 text-sm font-bold rounded-xl flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4"/> {checkoutError}
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-6 border-t border-gray-100 bg-white flex justify-between gap-4">
                    {onPreview && (
                        <button 
                            onClick={onPreview}
                            className="px-6 py-4 rounded-2xl text-slate-700 bg-slate-100 font-bold hover:bg-slate-200 transition-colors shadow-sm text-lg flex items-center justify-center gap-2 border border-slate-200"
                        >
                            معاينة الفاتورة
                        </button>
                    )}
                    <button onClick={handleFinalizeCheckout} className={`flex-1 text-white font-bold py-4 rounded-2xl shadow-xl transition-all text-lg ${isRefundMode ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-brand-600 hover:bg-brand-700 shadow-brand-200'}`}>تأكيد {isRefundMode ? 'المرتجع' : 'الدفع'}</button>
                </div>
            </div>
        </div>
    );
};
