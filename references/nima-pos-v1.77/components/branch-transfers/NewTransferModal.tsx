import React from 'react';
import { Plus, X, Package, Trash2 } from 'lucide-react';
import { Warehouse, BranchTransferItem } from '../../types';

interface NewTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouses: Warehouse[] | undefined;
  sourceId: number | '';
  setSourceId: (id: number | '') => void;
  destinationId: number | '';
  setDestinationId: (id: number | '') => void;
  transferItems: BranchTransferItem[];
  setTransferItems: (items: BranchTransferItem[]) => void;
  notes: string;
  setNotes: (notes: string) => void;
  selectedProductId: number | '';
  setSelectedProductId: (id: number | '') => void;
  selectedQty: number;
  setSelectedQty: (qty: number) => void;
  availableProductsForTransfer: any[];
  selectedProductMaxQty: number;
  handleAddItem: () => void;
  handleRemoveItem: (productId: number) => void;
  handleCreateTransfer: (e: React.FormEvent) => void;
}

const NewTransferModal: React.FC<NewTransferModalProps> = ({
  isOpen,
  onClose,
  warehouses,
  sourceId,
  setSourceId,
  destinationId,
  setDestinationId,
  transferItems,
  setTransferItems,
  notes,
  setNotes,
  selectedProductId,
  setSelectedProductId,
  selectedQty,
  setSelectedQty,
  availableProductsForTransfer,
  selectedProductMaxQty,
  handleAddItem,
  handleRemoveItem,
  handleCreateTransfer,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
          <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
            <Plus className="w-6 h-6 text-indigo-600" />
            طلب تحويل جديد
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form id="transferForm" onSubmit={handleCreateTransfer} className="space-y-6">
            {/* Warehouses Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  من مخزن (المصدر) <span className="text-red-500">*</span>
                </label>
                <select
                  value={sourceId}
                  onChange={(e) => {
                    setSourceId(Number(e.target.value));
                    setTransferItems([]);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-slate-700"
                  required
                >
                  <option value="" disabled>
                    اختر المخزن المصدر...
                  </option>
                  {warehouses?.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  إلى مخزن (الوجهة) <span className="text-red-500">*</span>
                </label>
                <select
                  value={destinationId}
                  onChange={(e) => setDestinationId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-slate-700"
                  required
                >
                  <option value="" disabled>
                    اختر المخزن الوجهة...
                  </option>
                  {warehouses
                    ?.filter((w) => w.id !== sourceId)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Items Selection */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-500" /> المنتجات المحولة
              </h4>

              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <div className="flex-1">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-sm"
                    disabled={!sourceId}
                  >
                    <option value="" disabled>
                      {sourceId ? 'اختر منتجاً...' : 'اختر المخزن المصدر أولاً'}
                    </option>
                    {availableProductsForTransfer.map((p) => (
                      <option key={p.productId} value={p.productId}>
                        {p.productName} (متاح: {p.quantity})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full md:w-32">
                  <input
                    type="number"
                    min="1"
                    max={selectedProductMaxQty || 1}
                    value={selectedQty}
                    onChange={(e) => setSelectedQty(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-center text-sm"
                    disabled={!selectedProductId}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={
                    !selectedProductId || selectedQty <= 0 || selectedQty > selectedProductMaxQty
                  }
                  className="bg-indigo-100 text-indigo-700 px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  إضافة
                </button>
              </div>

              {/* Added Items List */}
              {transferItems.length > 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-bold">المنتج</th>
                        <th className="px-4 py-3 font-bold w-24 text-center">الكمية</th>
                        <th className="px-4 py-3 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {transferItems.map((item) => (
                        <tr key={item.productId}>
                          <td className="px-4 py-3 font-bold text-slate-800">
                            {item.productName}
                          </td>
                          <td className="px-4 py-3 font-black text-center text-indigo-600">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.productId)}
                              className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
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
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-sm transition-all resize-none h-24"
                placeholder="أي ملاحظات إضافية حول هذا التحويل..."
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-all"
          >
            إلغاء
          </button>
          <button
            form="transferForm"
            type="submit"
            className="flex-1 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
          >
            إنشاء طلب التحويل
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewTransferModal;
