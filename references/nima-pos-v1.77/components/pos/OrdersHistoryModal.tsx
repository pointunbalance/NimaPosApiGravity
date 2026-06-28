import React, { useState, useEffect } from 'react';
import { X, Search, RotateCcw, Printer, FileText } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Order } from '../../types';
import { useToast } from '../../context/ToastContext';

interface OrdersHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRecallOrder: (order: Order) => void;
    onPrintReceipt: (order: Order) => void;
    formatCurrency: (amount: number) => string;
}

export const OrdersHistoryModal: React.FC<OrdersHistoryModalProps> = ({
    isOpen, onClose, onRecallOrder, onPrintReceipt, formatCurrency
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const { error } = useToast();
    
    const orders = useLiveQuery(async () => {
        let coll = db.orders.orderBy('date').reverse();
        const data = await coll.limit(50).toArray();
        if (!searchTerm) return data;
        
        return data.filter(o => 
            o.id?.toString() === searchTerm ||
            o.cashierName?.includes(searchTerm)
        );
    }, [searchTerm]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 fade-in-up">
            <div className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl flex flex-col h-[85vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-brand-600" /> الفواتير السابقة
                    </h2>
                    <button onClick={onClose} className="bg-white p-2 rounded-full shadow-sm hover:text-red-500">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="بحث برقم الفاتورة، اسم العميل..."
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 transition-all font-bold"
                        />
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {!orders ? (
                        <div className="flex items-center justify-center h-full text-slate-400">جاري التحميل...</div>
                    ) : orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <FileText className="w-16 h-16 text-slate-200 mb-2" />
                            <p>لا توجد فواتير مطابقة للبحث</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {orders.map(order => (
                                <div key={order.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-brand-200 hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 text-sm font-bold">
                                            #{order.referenceNumber || order.id}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">{formatCurrency(order.totalAmount)}</p>
                                            <div className="flex gap-3 text-xs text-slate-500 mt-1">
                                                <span>{new Date(order.date).toLocaleString('ar-SA')}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300 self-center"></span>
                                                <span>{order.paymentMethod === 'cash' ? 'نقدي' : order.paymentMethod === 'card' ? 'بطاقة' : order.paymentMethod === 'split' ? 'متعدد' : order.paymentMethod === 'wallet' ? 'محفظة' : 'آجل'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => onPrintReceipt(order)}
                                            className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                            title="طباعة"
                                        >
                                            <Printer className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => onRecallOrder(order)}
                                            className="px-4 py-2 bg-brand-50 text-brand-600 hover:bg-brand-100 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                                            title="مرتجع / استرجاع"
                                        >
                                            <RotateCcw className="w-4 h-4" /> مرتجع
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
