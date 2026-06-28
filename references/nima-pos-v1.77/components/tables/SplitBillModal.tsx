import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Table as TableType, Order } from '../../types';
import { db } from '../../db';

interface SplitBillModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentTable: TableType;
    activeOrder: Order;
}

export const SplitBillModal: React.FC<SplitBillModalProps> = ({ isOpen, onClose, currentTable, activeOrder }) => {
    const [splitWays, setSplitWays] = useState(2);
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen) return null;

    const handleSplit = async () => {
        setIsProcessing(true);
        try {
            await db.orders.update(activeOrder.id!, {
                note: (activeOrder.note ? activeOrder.note + '\n' : '') + `[تم تقسيم الفاتورة بالتساوي على ${splitWays}]`
            });
            onClose();
        } catch (e) {
            console.error(e);
            alert("حدث خطأ أثناء تقسيم الفاتورة");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden pointer-events-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <h3 className="text-xl font-black text-slate-800">تقسيم الفاتورة</h3>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
                
                <div className="p-6">
                    <p className="text-slate-500 font-bold mb-4 text-center">الطاولة {currentTable.name}</p>
                    <div className="flex flex-col gap-4">
                        <label className="text-sm font-bold text-slate-700">تقسيم الفاتورة بالتساوي على:</label>
                        <div className="flex items-center justify-between border-2 border-slate-200 rounded-2xl p-2 bg-slate-50">
                            <button onClick={() => setSplitWays(Math.max(2, splitWays - 1))} className="w-12 h-12 bg-white rounded-xl shadow-sm text-2xl font-black text-slate-600 hover:text-indigo-600 transition-colors">-</button>
                            <span className="text-3xl font-black font-['Cairo'] text-indigo-600">{splitWays}</span>
                            <button onClick={() => setSplitWays(splitWays + 1)} className="w-12 h-12 bg-white rounded-xl shadow-sm text-2xl font-black text-slate-600 hover:text-indigo-600 transition-colors">+</button>
                        </div>
                        
                        <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex justify-between items-center">
                            <span className="font-bold text-indigo-700 text-sm">نصيب كل فرد:</span>
                            <span className="font-black text-indigo-800 text-xl font-['Cairo']">
                                {new Intl.NumberFormat('ar-IQ').format(activeOrder.totalAmount / splitWays)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50">
                    <button 
                        onClick={handleSplit}
                        disabled={isProcessing}
                        className="w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20 active:scale-[0.98]"
                    >
                        {isProcessing ? 'جاري التقسيم...' : (
                            <>
                                <Check className="w-5 h-5" />
                                تأكيد التقسيم
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SplitBillModal;
