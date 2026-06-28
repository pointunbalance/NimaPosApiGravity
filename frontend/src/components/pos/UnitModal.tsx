import React from 'react';
import { Product } from '../../types';

interface UnitModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedProductForUnits: Product | null;
    handleUnitSelect: (unit: any) => void;
    formatCurrency: (amount: number) => string;
}

export const UnitModal: React.FC<UnitModalProps> = ({
    isOpen, onClose,
    selectedProductForUnits,
    handleUnitSelect,
    formatCurrency
}) => {
    if (!isOpen || !selectedProductForUnits) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
                <h3 className="font-bold text-xl mb-4 text-center text-gray-800">اختر الوحدة</h3>
                <div className="space-y-2">
                    {/* Default Unit */}
                    <button 
                        onClick={() => handleUnitSelect(null)}
                        className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-200 rounded-xl transition-all group"
                    >
                        <div className="text-right">
                            <span className="font-bold text-gray-700 group-hover:text-indigo-700 block">الوحدة الأساسية</span>
                            <span className="text-[10px] text-gray-400">1 قطعة</span>
                        </div>
                        <span className="font-bold text-indigo-600">{formatCurrency(selectedProductForUnits.price)}</span>
                    </button>

                    {/* Additional Units */}
                    {selectedProductForUnits.units?.map((u, idx) => (
                        <button 
                          key={idx}
                          onClick={() => handleUnitSelect(u)}
                          className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-200 rounded-xl transition-all group"
                        >
                            <div className="text-right">
                                <span className="font-bold text-gray-700 group-hover:text-indigo-700 block">{u.name}</span>
                                <span className="text-[10px] text-gray-400">يعادل {u.conversionFactor} قطعة</span>
                            </div>
                            <span className="font-bold text-indigo-600">{formatCurrency(u.price)}</span>
                        </button>
                    ))}
                </div>
                <button onClick={onClose} className="w-full mt-4 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">إلغاء</button>
            </div>
        </div>
    );
};
