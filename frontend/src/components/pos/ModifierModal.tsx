import React, { useState, useEffect } from 'react';
import { Product, ProductModifier, ModifierOption } from '../../types';
import { X, Check } from 'lucide-react';

interface ModifierModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    onConfirm: (selectedModifiers: { modifierName: string; option: ModifierOption }[]) => void;
    formatCurrency: (amount: number) => string;
}

export const ModifierModal: React.FC<ModifierModalProps> = ({
    isOpen,
    onClose,
    product,
    onConfirm,
    formatCurrency
}) => {
    const [selections, setSelections] = useState<Record<string, ModifierOption[]>>({});

    useEffect(() => {
        if (isOpen && product) {
            setSelections({});
        }
    }, [isOpen, product]);

    if (!isOpen || !product || !product.modifiers || product.modifiers.length === 0) return null;

    const handleOptionToggle = (modifier: ProductModifier, option: ModifierOption) => {
        setSelections(prev => {
            const currentSelections = prev[modifier.name] || [];
            const isSelected = currentSelections.some(opt => opt.name === option.name);

            if (modifier.multiple) {
                if (isSelected) {
                    return { ...prev, [modifier.name]: currentSelections.filter(opt => opt.name !== option.name) };
                } else {
                    return { ...prev, [modifier.name]: [...currentSelections, option] };
                }
            } else {
                if (isSelected) {
                    // If it's required, we can't unselect the only option
                    if (modifier.required && currentSelections.length === 1) return prev;
                    return { ...prev, [modifier.name]: [] };
                } else {
                    return { ...prev, [modifier.name]: [option] };
                }
            }
        });
    };

    const handleConfirm = () => {
        // Validate required modifiers
        const missingRequired = product.modifiers!.filter(mod => mod.required && (!selections[mod.name] || selections[mod.name].length === 0));
        
        if (missingRequired.length > 0) {
            alert(`يرجى اختيار خيار من: ${missingRequired.map(m => m.name).join('، ')}`);
            return;
        }

        const flattenedSelections: { modifierName: string; option: ModifierOption }[] = [];
        Object.entries(selections).forEach(([modifierName, options]) => {
            options.forEach(option => {
                flattenedSelections.push({ modifierName, option });
            });
        });

        onConfirm(flattenedSelections);
    };

    const calculateTotalExtra = () => {
        let total = 0;
        Object.values(selections).forEach(options => {
            options.forEach(opt => {
                total += opt.price;
            });
        });
        return total;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="font-black text-xl text-slate-800">{product.name}</h3>
                        <p className="text-sm text-slate-500 font-medium mt-1">تخصيص الطلب</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {product.modifiers.map((modifier, idx) => {
                        const currentSelections = selections[modifier.name] || [];
                        return (
                            <div key={idx} className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-slate-700">{modifier.name}</h4>
                                    <div className="flex gap-2">
                                        {modifier.required && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">إجباري</span>}
                                        {modifier.multiple && <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold">متعدد</span>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {modifier.options.map((option, optIdx) => {
                                        const isSelected = currentSelections.some(opt => opt.name === option.name);
                                        return (
                                            <button
                                                key={optIdx}
                                                onClick={() => handleOptionToggle(modifier, option)}
                                                className={`flex justify-between items-center p-3 rounded-xl border-2 transition-all text-right ${
                                                    isSelected 
                                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                                                    : 'border-slate-100 hover:border-indigo-200 bg-white text-slate-600'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                                        isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                                                    }`}>
                                                        {isSelected && <Check className="w-3 h-3" />}
                                                    </div>
                                                    <span className="font-bold text-sm">{option.name}</span>
                                                </div>
                                                {option.price > 0 && (
                                                    <span className={`text-xs font-bold ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                        +{formatCurrency(option.price)}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-bold text-slate-500">إجمالي الإضافات:</span>
                        <span className="text-lg font-black text-indigo-600">+{formatCurrency(calculateTotalExtra())}</span>
                    </div>
                    <button
                        onClick={handleConfirm}
                        className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
                    >
                        تأكيد وإضافة للسلة
                    </button>
                </div>
            </div>
        </div>
    );
};
