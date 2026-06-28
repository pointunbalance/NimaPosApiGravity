import React from 'react';
import { X } from 'lucide-react';
import { ProductBatch, Product, Warehouse } from '../../types';

interface BatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingBatch: ProductBatch | null;
    batchForm: Partial<ProductBatch>;
    setBatchForm: React.Dispatch<React.SetStateAction<Partial<ProductBatch>>>;
    products: Product[];
    warehouses: Warehouse[];
    onSubmit: (e: React.FormEvent) => void;
}

export const BatchModal: React.FC<BatchModalProps> = ({
    isOpen,
    onClose,
    editingBatch,
    batchForm,
    setBatchForm,
    products,
    warehouses,
    onSubmit
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                    <h2 className="text-xl font-bold text-slate-800">
                        {editingBatch ? 'تعديل تشغيلة' : 'إضافة تشغيلة جديدة'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={onSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">المنتج *</label>
                            <select
                                required
                                value={batchForm.productId || ''}
                                onChange={e => setBatchForm(prev => ({ ...prev, productId: Number(e.target.value) }))}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800"
                            >
                                <option value="">اختر المنتج...</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">المستودع *</label>
                            <select
                                required
                                value={batchForm.warehouseId || ''}
                                onChange={e => setBatchForm(prev => ({ ...prev, warehouseId: Number(e.target.value) }))}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800"
                            >
                                <option value="">اختر المستودع...</option>
                                {warehouses.map(w => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">رقم التشغيلة</label>
                            <input
                                type="text"
                                value={batchForm.batchNumber || ''}
                                onChange={e => setBatchForm(prev => ({ ...prev, batchNumber: e.target.value }))}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">الكمية *</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={batchForm.quantity || ''}
                                onChange={e => setBatchForm(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">تاريخ الاستلام *</label>
                            <input
                                type="date"
                                required
                                value={batchForm.receivedDate as any || ''}
                                onChange={e => setBatchForm(prev => ({ ...prev, receivedDate: e.target.value as any }))}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">تاريخ الصلاحية</label>
                            <input
                                type="date"
                                value={batchForm.expiryDate as any || ''}
                                onChange={e => setBatchForm(prev => ({ ...prev, expiryDate: e.target.value as any }))}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">سعر التكلفة للوحدة</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={batchForm.costPrice || ''}
                            onChange={e => setBatchForm(prev => ({ ...prev, costPrice: Number(e.target.value) }))}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                        />
                    </div>
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
                            حفظ
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
