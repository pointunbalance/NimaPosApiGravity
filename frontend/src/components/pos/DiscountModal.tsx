import React from 'react';

interface DiscountModalProps {
    isOpen: boolean;
    onClose: () => void;
    discountType: 'fixed' | 'percent';
    setDiscountType: (type: 'fixed' | 'percent') => void;
    tempDiscountInput: string;
    setTempDiscountInput: (val: string) => void;
    applyDiscount: () => void;
}

export const DiscountModal: React.FC<DiscountModalProps> = ({
    isOpen, onClose,
    discountType, setDiscountType,
    tempDiscountInput, setTempDiscountInput,
    applyDiscount
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
                <h3 className="font-bold text-xl mb-4 text-center text-gray-800">إضافة خصم</h3>
                <div className="flex gap-2 mb-4 p-1 bg-slate-100 rounded-xl">
                    <button onClick={() => setDiscountType('fixed')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${discountType === 'fixed' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>مبلغ ثابت</button>
                    <button onClick={() => setDiscountType('percent')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${discountType === 'percent' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>نسبة مئوية %</button>
                </div>
                <input type="number" onFocus={(e) => e.target.select()} className="w-full border p-3 rounded-xl outline-none focus:border-indigo-500 text-center text-xl font-bold mb-4" value={tempDiscountInput} onChange={e => setTempDiscountInput(e.target.value)} autoFocus placeholder="0" />
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">إلغاء</button>
                    <button onClick={applyDiscount} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">تطبيق</button>
                </div>
            </div>
        </div>
    );
};
