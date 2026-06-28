import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { X, ArrowLeftRight } from 'lucide-react';
import { Table as TableType, Order } from '../../types';
import { useToast } from '../../context/ToastContext';

interface TransferTableModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentTable: TableType;
    activeOrder: Order;
}

export const TransferTableModal: React.FC<TransferTableModalProps> = ({ isOpen, onClose, currentTable, activeOrder }) => {
    const { success, error } = useToast();
    const tables = useLiveQuery(() => db.diningTables.toArray(), []);
    const orders = useLiveQuery(() => db.orders.toArray(), []);
    const [selectedTableId, setSelectedTableId] = useState<number | null>(null);

    if (!isOpen || !tables || !orders) return null;

    // Show all tables except current one
    const otherTables = tables.filter(t => t.id !== currentTable.id);

    const getOccupiedOrder = (tableName: string) => {
        return orders.find(o => 
            o.tableNumber === tableName && 
            o.orderType === 'dine-in' && 
            o.status !== 'refunded' && 
            o.fulfillmentStatus !== 'served'
        );
    };

    const handleTransfer = async () => {
        if (!selectedTableId) return;
        const targetTable = tables.find(t => t.id === selectedTableId);
        if (!targetTable || !activeOrder.id) return;

        const targetOrder = getOccupiedOrder(targetTable.name);

        try {
            if (targetOrder) {
                // Merge logic
                const mergedItems = [...targetOrder.items, ...activeOrder.items];
                const mergedSubtotal = targetOrder.subtotalAmount + activeOrder.subtotalAmount;
                const mergedDiscount = (targetOrder.discountAmount || 0) + (activeOrder.discountAmount || 0);
                const mergedTax = (targetOrder.taxAmount || 0) + (activeOrder.taxAmount || 0);
                const mergedService = (targetOrder.serviceChargeAmount || 0) + (activeOrder.serviceChargeAmount || 0);
                const mergedTotal = targetOrder.totalAmount + activeOrder.totalAmount;

                await db.orders.update(targetOrder.id!, {
                    items: mergedItems,
                    subtotalAmount: mergedSubtotal,
                    discountAmount: mergedDiscount,
                    taxAmount: mergedTax,
                    serviceChargeAmount: mergedService,
                    totalAmount: mergedTotal,
                    // If target was already pending, it stays pending or we update to a 'preparing' depending on needs. Let's keep existing status.
                });

                // Delete the old order since it is merged
                await db.orders.delete(activeOrder.id);

                // Update physical table statuses in the database
                await db.diningTables.update(currentTable.id!, { status: 'available', reservedAt: undefined });
                await db.diningTables.update(targetTable.id!, { status: 'occupied', reservedAt: targetTable.reservedAt || new Date() });

                success(`تم دمج الطاولة مع ${targetTable.name} بنجاح`);
            } else {
                // Simple transfer
                await db.orders.update(activeOrder.id, {
                    tableNumber: targetTable.name
                });

                // Update physical table statuses in the database
                await db.diningTables.update(currentTable.id!, { status: 'available', reservedAt: undefined });
                await db.diningTables.update(targetTable.id!, { status: 'occupied', reservedAt: currentTable.reservedAt || new Date() });

                success(`تم نقل الطاولة إلى ${targetTable.name} بنجاح`);
            }
            onClose();
        } catch (err) {
            console.error("Error transferring/merging table", err);
            error("حدث خطأ أثناء نقل أو دمج الطاولة");
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                            <ArrowLeftRight className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">نقل / دمج الطاولات</h2>
                            <p className="text-sm text-slate-500">نقل أو دمج الطلب من {currentTable.name} إلى طاولة أخرى</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {otherTables.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                            {otherTables.map(table => {
                                const isOccupied = getOccupiedOrder(table.name);
                                return (
                                <button
                                    key={table.id}
                                    onClick={() => setSelectedTableId(table.id!)}
                                    className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all aspect-square relative
                                        ${selectedTableId === table.id 
                                            ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-md transform scale-105 z-10' 
                                            : 'border-slate-100 bg-white hover:border-purple-200 text-slate-600'
                                        }`}
                                >
                                    {isOccupied && (
                                        <span className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md">
                                            دمج
                                        </span>
                                    )}
                                    <span className={`text-2xl font-black ${isOccupied && selectedTableId !== table.id ? 'text-amber-600' : ''}`}>{table.name}</span>
                                    <span className="text-xs font-medium opacity-70">{table.zone}</span>
                                </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            <p className="text-lg font-bold">لا توجد طاولات أخرى</p>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                        إلغاء
                    </button>
                    <button 
                        onClick={handleTransfer}
                        disabled={!selectedTableId}
                        className="px-8 py-2.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-purple-600/20"
                    >
                        <ArrowLeftRight className="w-5 h-5" />
                        {selectedTableId && getOccupiedOrder(tables.find(t => t.id === selectedTableId)?.name || '') ? 'تأكيد الدمج' : 'تأكيد النقل'}
                    </button>
                </div>
            </div>
        </div>
    );
};
