import React from 'react';
import { X } from 'lucide-react';
import { ProductSerial, Product, Warehouse } from '../../types';

interface SerialModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingSerial: ProductSerial | null;
    serialForm: Partial<ProductSerial>;
    setSerialForm: React.Dispatch<React.SetStateAction<Partial<ProductSerial>>>;
    products: Product[];
    warehouses: Warehouse[];
    onSubmit: (e: React.FormEvent) => void;
}

export const SerialModal: React.FC<SerialModalProps> = ({
    isOpen,
    onClose,
    editingSerial,
    serialForm,
    setSerialForm,
    products,
    warehouses,
    onSubmit
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                    <h2 className="text-xl font-bold text-slate-800">
                        {editingSerial ? 'تعديل رقم تسلسلي' : 'إضافة رقم تسلسلي جديد'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={onSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">المنتج *</label>
                        <select
                            required
                            value={serialForm.productId || ''}
                            onChange={e => setSerialForm(prev => ({ ...prev, productId: Number(e.target.value) }))}
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
                            value={serialForm.warehouseId || ''}
                            onChange={e => setSerialForm(prev => ({ ...prev, warehouseId: Number(e.target.value) }))}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800"
                        >
                            <option value="">اختر المستودع...</option>
                            {warehouses.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">الرقم التسلسلي *</label>
                        <input
                            type="text"
                            required
                            value={serialForm.serialNumber || ''}
                            onChange={e => setSerialForm(prev => ({ ...prev, serialNumber: e.target.value }))}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">الحالة *</label>
                        <select
                            required
                            value={serialForm.status || 'available'}
                            onChange={e => setSerialForm(prev => ({ ...prev, status: e.target.value as any }))}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800"
                        >
                            <option value="available">متاح</option>
                            <option value="sold">مباع</option>
                            <option value="returned">مرتجع</option>
                            <option value="damaged">تالف</option>
                        </select>
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
