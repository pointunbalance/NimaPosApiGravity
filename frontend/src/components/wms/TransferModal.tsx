import React from 'react';
import { X } from 'lucide-react';
import { Warehouse } from '../../types';

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    transferItem: { type: 'batch' | 'serial', item: any } | null;
    transferForm: { destinationWarehouseId: number, quantity?: number };
    setTransferForm: React.Dispatch<React.SetStateAction<{ destinationWarehouseId: number, quantity?: number }>>;
    warehouses: Warehouse[];
    getWarehouseName: (id: number) => string;
    getProductName: (id: number) => string;
    onSubmit: (e: React.FormEvent) => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
    isOpen,
    onClose,
    transferItem,
    transferForm,
    setTransferForm,
    warehouses,
    getWarehouseName,
    getProductName,
    onSubmit
}) => {
    if (!isOpen || !transferItem) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                    <h2 className="text-xl font-bold text-slate-800">
                        نقل {transferItem.type === 'batch' ? 'تشغيلة' : 'رقم تسلسلي'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={onSubmit} className="p-6 space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl mb-4">
                        <p className="text-sm text-slate-600 mb-1">المنتج: <span className="font-bold text-slate-800">{transferItem.type === 'batch' ? transferItem.item.productName : getProductName(transferItem.item.productId)}</span></p>
                        <p className="text-sm text-slate-600">المستودع الحالي: <span className="font-bold text-slate-800">{getWarehouseName(transferItem.item.warehouseId)}</span></p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">المستودع الوجهة *</label>
                        <select
                            required
                            value={transferForm.destinationWarehouseId || ''}
                            onChange={e => setTransferForm(prev => ({ ...prev, destinationWarehouseId: Number(e.target.value) }))}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800"
                        >
                            <option value="">اختر المستودع...</option>
                            {warehouses.filter(w => w.id !== transferItem.item.warehouseId).map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>

                    {transferItem.type === 'batch' && (
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">الكمية المراد نقلها * (الحد الأقصى: {transferItem.item.quantity})</label>
                            <input
                                type="number"
                                required
                                min="1"
                                max={transferItem.item.quantity}
                                value={transferForm.quantity || ''}
                                onChange={e => setTransferForm(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 cursor-pointer"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 cursor-pointer"
                        >
                            تأكيد النقل
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
