import React from 'react';
import { Product } from '../../types';

interface QuantityModalProps {
    isOpen: boolean;
    onClose: () => void;
    pendingProductToAdd: Product | null;
    qtyInput: string;
    setQtyInput: (val: string) => void;
    confirmQuantityAdd: () => void;
}

export const QuantityModal: React.FC<QuantityModalProps> = ({
    isOpen, onClose,
    pendingProductToAdd,
    qtyInput, setQtyInput,
    confirmQuantityAdd
}) => {
    if (!isOpen || !pendingProductToAdd) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl text-center">
                <h3 className="font-bold text-lg mb-1 text-gray-800">{pendingProductToAdd.name}</h3>
                <p className="text-sm text-gray-500 mb-4">أدخل الكمية المطلوبة</p>
                <input 
                  type="number" onFocus={(e) => e.target.select()} 
                  className="w-full border-2 border-indigo-100 p-4 rounded-xl text-center text-2xl font-black outline-none focus:border-indigo-500 mb-4" 
                  value={qtyInput} 
                  onChange={e => setQtyInput(e.target.value)}
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && confirmQuantityAdd()}
                />
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 py-3 border rounded-xl font-bold text-gray-600 hover:bg-gray-50">إلغاء</button>
                    <button onClick={confirmQuantityAdd} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">تأكيد</button>
                </div>
            </div>
        </div>
    );
};
