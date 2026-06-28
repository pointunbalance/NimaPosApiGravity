import React, { useMemo } from 'react';
import { Calculator, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const denominations = [250, 500, 1000, 5000, 10000, 25000, 50000, 100000];

const moneyCounterSchema = z.object({
    counts: z.record(z.string(), z.number().min(0).optional().default(0))
});

type MoneyCounterFormData = z.infer<typeof moneyCounterSchema>;

interface MoneyCounterModalProps {
    currency: string;
    onTotalChange: (total: number) => void;
    onClose: () => void;
}

const MoneyCounterModal: React.FC<MoneyCounterModalProps> = ({ currency, onTotalChange, onClose }) => {
    const { register, watch, handleSubmit } = useForm<MoneyCounterFormData>({
        resolver: zodResolver(moneyCounterSchema),
        defaultValues: {
            counts: {}
        }
    });

    const counts = watch('counts');

    const total = useMemo(() => {
        if (!counts) return 0;
        return denominations.reduce((acc, curr) => acc + (curr * (counts[curr.toString()] || 0)), 0);
    }, [counts]);

    const onSubmit = () => {
        onTotalChange(total);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-brand-600" />
                        حاسبة الفئات النقدية
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"><X className="w-5 h-5" /></button>
                </div>
                
                <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto p-5 space-y-3">
                        {denominations.map(denom => (
                            <div key={denom} className="flex items-center gap-4 bg-white p-2 border border-gray-100 rounded-xl shadow-sm">
                                <div className="w-20 font-bold text-right text-gray-600 text-sm">{denom.toLocaleString()}</div>
                                <span className="text-gray-400 text-xs">x</span>
                                <input 
                                    type="number" 
                                    onFocus={(e) => e.target.select()} 
                                    min="0"
                                    {...register(`counts.${denom}`, { valueAsNumber: true })}
                                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-center font-bold outline-none focus:ring-2 focus:ring-brand-500"
                                    placeholder="0"
                                />
                                <div className="w-24 text-left font-bold text-brand-600 text-sm">
                                    {((counts?.[denom.toString()] || 0) * denom).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-5 bg-gray-900 text-white">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-400 text-sm">الإجمالي المحسوب</span>
                            <span className="text-2xl font-black text-emerald-400">{total.toLocaleString()} <span className="text-xs">{currency}</span></span>
                        </div>
                        <button 
                            type="submit"
                            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-900/20"
                        >
                            اعتماد المبلغ
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MoneyCounterModal;
