import React from 'react';
import { Clock, Play, Trash2 } from 'lucide-react';

interface HeldOrdersModalProps {
    isOpen: boolean;
    onClose: () => void;
    heldOrders: any[] | undefined;
    restoreHeldOrder: (id: number) => void;
    deleteHeldOrder: (id: number) => void;
    formatCurrency: (amount: number) => string;
}

export const HeldOrdersModal: React.FC<HeldOrdersModalProps> = ({
    isOpen, onClose, heldOrders, restoreHeldOrder, deleteHeldOrder, formatCurrency
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh]">
                <h3 className="font-bold text-xl mb-4 text-slate-800 flex items-center gap-2">
                    <Clock className="w-6 h-6 text-orange-500" /> الطلبات المعلقة
                </h3>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {!heldOrders || heldOrders.length === 0 ? (
                        <div className="text-center text-slate-400 py-10">
                            لا توجد طلبات معلقة
                        </div>
                    ) : (
                        heldOrders.map(order => (
                            <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-orange-200 transition-colors">
                                <div>
                                    <div className="font-bold text-slate-800 mb-1">
                                        طلب #{order.id} {order.note ? `- ${order.note}` : ''}
                                    </div>
                                    <div className="text-xs text-slate-500 flex gap-3 flex-wrap">
                                        <span>{new Date(order.date).toLocaleString('ar-EG')}</span>
                                        <span>{order.items.length} أصناف</span>
                                        <span className="font-bold text-brand-600">
                                            {formatCurrency(order.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0))}
                                        </span>
                                        {order.orderType && (
                                            <span className="bg-slate-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                                {order.orderType === 'dine-in' ? 'صالة' : 
                                                 order.orderType === 'takeaway' ? 'سفري' : 
                                                 order.orderType === 'delivery' ? 'توصيل' : order.orderType}
                                            </span>
                                        )}
                                        {order.tableId && (
                                            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                                طاولة {order.tableId}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => restoreHeldOrder(order.id)}
                                        className="p-2 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors"
                                        title="استعادة الطلب"
                                    >
                                        <Play className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={() => deleteHeldOrder(order.id)}
                                        className="p-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors"
                                        title="حذف الطلب"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <button onClick={onClose} className="w-full mt-4 py-3 bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors">إغلاق</button>
            </div>
        </div>
    );
};
