import React from 'react';
import { PurchaseOrder, PurchaseOrderItem, Supplier, Product } from '../../types';
import { Plus, X, Package, Trash2 } from 'lucide-react';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOrder: PurchaseOrder | null;
  suppliers: Supplier[] | undefined;
  products: Product[] | undefined;
  supplierId: number | '';
  setSupplierId: (id: number | '') => void;
  expectedDate: string;
  setExpectedDate: (date: string) => void;
  items: PurchaseOrderItem[];
  notes: string;
  setNotes: (notes: string) => void;
  selectedProductId: number | '';
  setSelectedProductId: (id: number | '') => void;
  selectedQty: number;
  setSelectedQty: (qty: number) => void;
  selectedCost: number;
  setSelectedCost: (cost: number) => void;
  handleProductSelect: (id: number) => void;
  handleAddItem: () => void;
  handleRemoveItem: (id: number) => void;
  handleUpdateItemQty: (id: number, qty: number) => void;
  handleUpdateItemCost: (id: number, cost: number) => void;
  subtotal: number;
  currency: string;
  handleSaveOrder: (e: React.FormEvent) => void;
}

const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  isOpen, onClose, selectedOrder, suppliers, products,
  supplierId, setSupplierId, expectedDate, setExpectedDate,
  items, notes, setNotes, selectedProductId, setSelectedProductId,
  selectedQty, setSelectedQty, selectedCost, setSelectedCost,
  handleProductSelect, handleAddItem, handleRemoveItem,
  handleUpdateItemQty, handleUpdateItemCost, subtotal, currency,
  handleSaveOrder
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <div className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
                <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
                    <Plus className="w-6 h-6 text-indigo-600" /> 
                    {selectedOrder ? 'تعديل أمر شراء' : 'إنشاء أمر شراء جديد'}
                </h3>
                <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <form id="poForm" onSubmit={handleSaveOrder} className="space-y-6">
                    {/* Supplier & Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">المورد <span className="text-red-500">*</span></label>
                            <select 
                                value={supplierId} 
                                onChange={e => setSupplierId(Number(e.target.value))} 
                                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-slate-700"
                                required
                            >
                                <option value="" disabled>اختر المورد...</option>
                                {suppliers?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ الاستلام المتوقع</label>
                            <input 
                                type="date" 
                                value={expectedDate} 
                                onChange={e => setExpectedDate(e.target.value)} 
                                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-slate-700"
                            />
                        </div>
                    </div>

                    {/* Items Selection */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-indigo-500" /> إضافة منتجات</h4>
                        
                        <div className="flex flex-col md:flex-row gap-3 mb-4">
                            <div className="flex-1">
                                <select 
                                    value={selectedProductId} 
                                    onChange={e => handleProductSelect(Number(e.target.value))} 
                                    className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-sm"
                                >
                                    <option value="" disabled>اختر منتجاً...</option>
                                    {products?.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-full md:w-32">
                                <input 
                                    type="number" 
                                    min="1" 
                                    placeholder="الكمية"
                                    value={selectedQty} 
                                    onChange={e => setSelectedQty(Number(e.target.value))} 
                                    className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-center text-sm"
                                />
                            </div>
                            <div className="w-full md:w-32 relative">
                                <input 
                                    type="number" 
                                    min="0" 
                                    step="0.01"
                                    placeholder="التكلفة"
                                    value={selectedCost} 
                                    onChange={e => setSelectedCost(Number(e.target.value))} 
                                    className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-center text-sm"
                                />
                            </div>
                            <button 
                                type="button"
                                onClick={handleAddItem}
                                disabled={!selectedProductId || selectedQty <= 0 || selectedCost < 0}
                                className="bg-indigo-100 text-indigo-700 px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                إضافة
                            </button>
                        </div>

                        {/* Added Items List */}
                        {items.length > 0 ? (
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                <table className="w-full text-right text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3 font-bold">المنتج</th>
                                            <th className="px-4 py-3 font-bold text-center">الكمية</th>
                                            <th className="px-4 py-3 font-bold text-center">التكلفة</th>
                                            <th className="px-4 py-3 font-bold text-center">الإجمالي</th>
                                            <th className="px-4 py-3 w-16"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {items.map(item => (
                                            <tr key={item.productId}>
                                                <td className="px-4 py-3 font-bold text-slate-800">{item.productName}</td>
                                                <td className="px-4 py-3">
                                                    <input 
                                                        type="number" 
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={e => handleUpdateItemQty(item.productId, Number(e.target.value))}
                                                        className="w-20 bg-slate-50 border border-slate-200 px-2 py-1 rounded text-center font-bold outline-none mx-auto block"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input 
                                                        type="number" 
                                                        min="0"
                                                        step="0.01"
                                                        value={item.costPrice}
                                                        onChange={e => handleUpdateItemCost(item.productId, Number(e.target.value))}
                                                        className="w-24 bg-slate-50 border border-slate-200 px-2 py-1 rounded text-center font-bold outline-none mx-auto block"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 font-black text-center text-indigo-600">{item.total.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button type="button" onClick={() => handleRemoveItem(item.productId)} className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-50 border-t border-slate-100">
                                        <tr>
                                            <td colSpan={3} className="px-4 py-3 font-bold text-slate-600 text-left">الإجمالي الكلي:</td>
                                            <td className="px-4 py-3 font-black text-center text-slate-800 text-lg">{subtotal.toLocaleString()} {currency}</td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed">
                                <Package className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p className="text-sm font-medium">لم يتم إضافة منتجات بعد</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات</label>
                        <textarea 
                            value={notes} 
                            onChange={e => setNotes(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-sm transition-all resize-none h-24" 
                            placeholder="أي ملاحظات إضافية حول أمر الشراء..." 
                        />
                    </div>
                </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-3">
                <button onClick={onClose} className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-all">إلغاء</button>
                <button form="poForm" type="submit" className="flex-1 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">
                    {selectedOrder ? 'حفظ التعديلات' : 'إنشاء أمر الشراء'}
                </button>
            </div>
        </div>
    </div>
  );
};

export default PurchaseOrderModal;
