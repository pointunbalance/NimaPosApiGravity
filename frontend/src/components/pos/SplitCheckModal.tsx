import React, { useState, useMemo } from 'react';
import { X, Check, Scissors, CreditCard, Banknote } from 'lucide-react';
import { CartItem } from '../../types';

interface SplitCheckModalProps {
    isOpen: boolean;
    onClose: () => void;
    cart: CartItem[];
    onPaySplit: (splitItems: CartItem[], remainingItems: CartItem[], paymentMethod: 'cash' | 'card') => void;
    formatCurrency: (val: number) => string;
}

export const SplitCheckModal: React.FC<SplitCheckModalProps> = ({ 
    isOpen, onClose, cart, onPaySplit, formatCurrency 
}) => {
    // We flatten the cart so an item with quantity 3 becomes 3 items of quantity 1
    const flattenedCart = useMemo(() => {
        const flat: (CartItem & { originalIndex: number, lineTotal: number })[] = [];
        cart.forEach((item, idx) => {
            const unitPrice = item.price - ((item.itemDiscount || 0) / item.quantity);
            for (let i = 0; i < item.quantity; i++) {
                flat.push({
                    ...item,
                    quantity: 1,
                    lineTotal: Math.max(0, unitPrice),
                    originalIndex: idx
                } as any);
            }
        });
        return flat;
    }, [cart]);

    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

    if (!isOpen) return null;

    const toggleItem = (index: number) => {
        if (selectedIndices.includes(index)) {
            setSelectedIndices(selectedIndices.filter(i => i !== index));
        } else {
            setSelectedIndices([...selectedIndices, index]);
        }
    };

    const handleSelectAll = () => {
        if (selectedIndices.length === flattenedCart.length) {
            setSelectedIndices([]);
        } else {
            setSelectedIndices(flattenedCart.map((_, i) => i));
        }
    };

    const splitTotal = flattenedCart
        .filter((_, i) => selectedIndices.includes(i))
        .reduce((acc, item) => acc + item.lineTotal, 0);

    const handlePay = (method: 'cash' | 'card') => {
        if (selectedIndices.length === 0) return;

        // Reconstruct split and remaining carts by grouping back
        const splitItems: CartItem[] = [];
        const remainingItems: CartItem[] = [];

        flattenedCart.forEach((item, i) => {
            const isSelected = selectedIndices.includes(i);
            const targetList = isSelected ? splitItems : remainingItems;
            
            const existing = targetList.find(t => (t as any).originalIndex === item.originalIndex);
            if (existing) {
                existing.quantity += 1;
                // Re-apply correct total discount if needed proportionally
                if (item.itemDiscount) {
                   existing.itemDiscount = (existing.itemDiscount || 0) + (item.itemDiscount / cart[item.originalIndex].quantity);
                }
            } else {
                const newItem = { ...item };
                delete (newItem as any).lineTotal;
                if (newItem.itemDiscount) {
                   newItem.itemDiscount = newItem.itemDiscount / cart[item.originalIndex].quantity;
                }
                targetList.push(newItem);
            }
        });

        // Clean up the temporary originalIndex property
        const cleanSplit = splitItems.map(({ originalIndex, ...rest }: any) => rest);
        const cleanRemaining = remainingItems.map(({ originalIndex, ...rest }: any) => rest);

        onPaySplit(cleanSplit, cleanRemaining, method);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col h-[80vh] md:h-auto md:max-h-[85vh]">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50 shrink-0">
                   <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
                            <Scissors className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800">تقسيم الفاتورة بالصنف</h3>
                            <p className="text-sm font-bold text-slate-500">حدد الأصناف التي تريد دفعها الآن</p>
                        </div>
                   </div>
                    <button onClick={onClose} className="p-2 bg-slate-200 rounded-full hover:bg-slate-300 transition-colors">
                        <X className="w-5 h-5 text-slate-600" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-slate-700">أصناف الطلب:</h4>
                        <button 
                            onClick={handleSelectAll}
                            className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-1.5 rounded-lg"
                        >
                            {selectedIndices.length === flattenedCart.length ? 'إلغاء التحديد' : 'تحديد الكل'}
                        </button>
                    </div>
                    
                    <div className="space-y-2">
                        {flattenedCart.map((item, idx) => {
                            const isSelected = selectedIndices.includes(idx);
                            return (
                                <div 
                                    key={idx} 
                                    onClick={() => toggleItem(idx)}
                                    className={`p-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-all border-2 ${
                                        isSelected 
                                            ? 'bg-indigo-50 border-indigo-500 shadow-sm' 
                                            : 'bg-white border-slate-100 hover:border-indigo-200'
                                    }`}
                                >
                                    <div className={`w-6 h-6 rounded-md flex justify-center items-center shrink-0 border-2 transition-colors ${
                                        isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                                    }`}>
                                        {isSelected && <Check className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-slate-800 text-lg">{item.name}</span>
                                        </div>
                                        <span className="font-black text-slate-800 text-lg">
                                            {formatCurrency(item.lineTotal)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-6 border-t border-slate-200 bg-white shrink-0">
                    <div className="flex justify-between items-center mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="font-bold text-slate-500">إجمالي الأصناف المحددة:</span>
                        <span className="text-3xl font-black text-indigo-600 drop-shadow-sm">{formatCurrency(splitTotal)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => handlePay('cash')}
                            disabled={selectedIndices.length === 0}
                            className={`py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                                selectedIndices.length > 0 
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 active:scale-[0.98]' 
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            <Banknote className="w-6 h-6" />
                            دفع نقدي
                        </button>
                        <button 
                            onClick={() => handlePay('card')}
                            disabled={selectedIndices.length === 0}
                            className={`py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                                selectedIndices.length > 0 
                                    ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-xl shadow-blue-500/20 active:scale-[0.98]' 
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            <CreditCard className="w-6 h-6" />
                            دفع بطاقة
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
