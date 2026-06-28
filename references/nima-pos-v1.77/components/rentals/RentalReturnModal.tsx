import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, DollarSign, Calendar as CalendarIcon, CheckSquare } from 'lucide-react';
import { Rental, Product } from '../../types';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';

interface RentalReturnModalProps {
    rental: Rental;
    onClose: () => void;
    onConfirm: (rentalId: number, lateFee: number, damageFee: number, depositReturned: number, notes?: string, returnedParts?: string[], returnStatus?: 'returned' | 'in_laundry') => void;
    formatCurrency: (amount: number) => string;
}

export const RentalReturnModal: React.FC<RentalReturnModalProps> = ({
    rental, onClose, onConfirm, formatCurrency
}) => {
    const [lateFee, setLateFee] = useState(0);
    const [damageFee, setDamageFee] = useState(0);
    const [depositReturned, setDepositReturned] = useState(rental.deposit);
    const [daysLate, setDaysLate] = useState(0);
    const [returnNotes, setReturnNotes] = useState('');
    const [returnStatus, setReturnStatus] = useState<'returned' | 'in_laundry'>('in_laundry');
    
    // Checklist
    const product = useLiveQuery(() => db.products.get(rental.productId));
    const [checkedParts, setCheckedParts] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const today = new Date();
        const returnDate = new Date(rental.returnDate);
        
        today.setHours(0, 0, 0, 0);
        returnDate.setHours(0, 0, 0, 0);
        
        const diffTime = today.getTime() - returnDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0) {
            setDaysLate(diffDays);
            setLateFee(Math.round(rental.price * 0.1 * diffDays));
        }
    }, [rental]);

    useEffect(() => {
        const suggestedReturn = Math.max(0, rental.deposit - lateFee - damageFee);
        setDepositReturned(suggestedReturn);
    }, [lateFee, damageFee, rental.deposit]);

    const handleConfirm = () => {
        const returnedPartsArray = Object.keys(checkedParts).filter(part => checkedParts[part]);
        onConfirm(rental.id!, lateFee, damageFee, depositReturned, returnNotes, returnedPartsArray, returnStatus);
    };

    const togglePart = (part: string) => {
        setCheckedParts(prev => ({ ...prev, [part]: !prev[part] }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[95vh]">
                <div className="p-6 border-b bg-slate-50 flex justify-between items-center rounded-t-3xl shrink-0">
                    <div>
                        <h3 className="font-bold text-xl text-slate-800">إرجاع القطعة</h3>
                        <p className="text-xs text-slate-500 font-medium">تسوية الحساب والتأمين والمراجعة</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X/></button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Rental Info */}
                    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-bold text-indigo-900">{rental.productName}</span>
                            <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-1 rounded-full">{rental.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-indigo-700">
                            <CalendarIcon className="w-4 h-4" />
                            <span>تاريخ الإرجاع المحدد: {new Date(rental.returnDate).toLocaleDateString('ar-EG')}</span>
                        </div>
                        {daysLate > 0 && (
                            <div className="mt-2 flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                                <AlertCircle className="w-4 h-4" />
                                متأخر {daysLate} يوم / أيام
                            </div>
                        )}
                    </div>

                    {/* Action Selection */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500">حالة القطعة بعد الإرجاع</label>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setReturnStatus('in_laundry')}
                                className={`flex-1 p-3 flex flex-col gap-1 items-center justify-center rounded-xl border-2 transition-all ${returnStatus === 'in_laundry' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'}`}
                            >
                                <span className="font-bold text-sm">إلى المغسلة/الصيانة</span>
                                <span className="text-[10px] opacity-80">(غير متاحة للحجز حالياً)</span>
                            </button>
                            <button 
                                onClick={() => setReturnStatus('returned')}
                                className={`flex-1 p-3 flex flex-col gap-1 items-center justify-center rounded-xl border-2 transition-all ${returnStatus === 'returned' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'}`}
                            >
                                <span className="font-bold text-sm">إلى الرف (متاحة)</span>
                                <span className="text-[10px] opacity-80">(جاهزة للإعارة مباشرة)</span>
                            </button>
                        </div>
                    </div>

                    {/* Parts Checklist */}
                    {product?.parts && product.parts.length > 0 && (
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                            <h4 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">
                                <CheckSquare className="w-4 h-4" /> مكونات القطعة الواجب إرجاعها
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                {product.parts.map(part => (
                                    <label key={part} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100 cursor-pointer hover:border-indigo-200 transition-all">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 text-indigo-600 rounded" 
                                            checked={checkedParts[part] || false}
                                            onChange={() => togglePart(part)}
                                        />
                                        <span className={`text-sm ${checkedParts[part] ? 'text-slate-800 line-through opacity-70' : 'text-slate-800 font-medium'}`}>{part}</span>
                                    </label>
                                ))}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2">تأكد من استلام جميع القطع قبل تأكيد الإرجاع.</p>
                        </div>
                    )}

                    {/* Fees */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">غرامة تأخير</label>
                                <div className="relative">
                                    <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="number" 
                                        className="w-full p-3 pr-10 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                        value={lateFee === 0 ? '' : lateFee}
                                        placeholder="0"
                                        onChange={e => setLateFee(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">رسوم تلف / تنظيف</label>
                                <div className="relative">
                                    <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="number" 
                                        className="w-full p-3 pr-10 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                        value={damageFee === 0 ? '' : damageFee}
                                        placeholder="0"
                                        onChange={e => setDamageFee(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">ملاحظات الإرجاع</label>
                            <textarea 
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                                rows={2}
                                value={returnNotes}
                                onChange={e => setReturnNotes(e.target.value)}
                                placeholder="حالة القطعة عند الإرجاع..."
                            />
                        </div>
                    </div>

                    {/* Deposit Settlement */}
                    <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                        <h4 className="font-bold text-emerald-800 mb-4 text-sm flex items-center gap-2">
                            <DollarSign className="w-4 h-4" /> تسوية التأمين
                        </h4>
                        <div className="flex justify-between items-center mb-2 text-sm">
                            <span className="text-slate-600">مبلغ التأمين الأصلي:</span>
                            <span className="font-bold text-slate-800">{formatCurrency(rental.deposit)}</span>
                        </div>
                        <div className="flex justify-between items-center mb-4 text-sm">
                            <span className="text-slate-600">إجمالي الخصومات:</span>
                            <span className="font-bold text-red-600">{formatCurrency(lateFee + damageFee)}</span>
                        </div>
                        <div className="pt-4 border-t border-emerald-200 flex items-center justify-between">
                            <label className="block text-sm font-bold text-emerald-800">المسترد للعميل</label>
                            <input 
                                type="number" 
                                className="w-32 p-2 bg-white border border-emerald-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-black text-lg text-emerald-700 text-left"
                                value={depositReturned}
                                onChange={e => setDepositReturned(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleConfirm} 
                        className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all text-lg flex items-center justify-center gap-2 shrink-0"
                    >
                        <CheckCircle2 className="w-5 h-5" /> تأكيد الإرجاع
                    </button>
                </div>
            </div>
        </div>
    );
};
