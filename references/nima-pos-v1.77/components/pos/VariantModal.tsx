import React from 'react';
import { Product } from '../../types';

interface VariantModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedProductForVariants: Product | null;
    handleVariantSelect: (variant: any) => void;
    formatCurrency: (amount: number) => string;
}

export const VariantModal: React.FC<VariantModalProps> = ({
    isOpen, onClose,
    selectedProductForVariants,
    handleVariantSelect,
    formatCurrency
}) => {
    if (!isOpen || !selectedProductForVariants) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
                <h3 className="font-bold text-xl mb-4 text-center text-gray-800">اختر النوع / المقاس</h3>
                <div className="space-y-2">
                    {selectedProductForVariants.variants?.map((v, idx) => (
                        <button 
                          key={idx}
                          onClick={() => handleVariantSelect(v)}
                          className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-200 rounded-xl transition-all group"
                        >
                            <span className="font-bold text-gray-700 group-hover:text-indigo-700">{v.name}</span>
                            <span className="font-bold text-indigo-600">{formatCurrency(v.price)}</span>
                        </button>
                    ))}
                </div>
                <button onClick={onClose} className="w-full mt-4 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">إلغاء</button>
            </div>
        </div>
    );
};
