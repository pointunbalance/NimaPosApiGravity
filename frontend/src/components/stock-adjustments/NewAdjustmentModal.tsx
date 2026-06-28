import React from 'react';
import { ClipboardX, X, ScanBarcode, Plus, Trash2, Save } from 'lucide-react';
import { Product, Warehouse, StockAdjustment } from '../../types';

interface BatchItem {
  tempId: string;
  productId: number;
  productName: string;
  currentStock: number;
  actualStock: number;
  difference: number;
  type: 'increase' | 'decrease';
  costPrice: number;
  totalValueImpact: number;
  reason: StockAdjustment['reason'];
}

interface NewAdjustmentModalProps {
  isOpen: boolean;
  closeModal: () => void;
  warehouses: Warehouse[] | undefined;
  selectedWarehouseId: number | '';
  setSelectedWarehouseId: (id: number | '') => void;
  referenceNote: string;
  setReferenceNote: (note: string) => void;
  batchItems: BatchItem[];
  barcodeInput: string;
  setBarcodeInput: (barcode: string) => void;
  handleBarcodeScan: (e: React.KeyboardEvent) => void;
  selectedProductId: number | '';
  setSelectedProductId: (id: number | '') => void;
  products: Product[] | undefined;
  currentLineStock: number | undefined;
  inputActualQty: number | '';
  setInputActualQty: (qty: number | '') => void;
  itemReason: StockAdjustment['reason'];
  setItemReason: (reason: StockAdjustment['reason']) => void;
  addLineToBatch: () => void;
  removeBatchItem: (tempId: string) => void;
  batchTotals: { totalGain: number; totalLoss: number; netValue: number; netItems: number };
  handleSaveBatch: () => void;
  formatCurrency: (amount: number) => string;
  getReasonConfig: (r: string) => { label: string; color: string };
}

const NewAdjustmentModal: React.FC<NewAdjustmentModalProps> = ({
  isOpen,
  closeModal,
  warehouses,
  selectedWarehouseId,
  setSelectedWarehouseId,
  referenceNote,
  setReferenceNote,
  batchItems,
  barcodeInput,
  setBarcodeInput,
  handleBarcodeScan,
  selectedProductId,
  setSelectedProductId,
  products,
  currentLineStock,
  inputActualQty,
  setInputActualQty,
  itemReason,
  setItemReason,
  addLineToBatch,
  removeBatchItem,
  batchTotals,
  handleSaveBatch,
  formatCurrency,
  getReasonConfig,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-200">
              <ClipboardX className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-gray-800">جلسة جرد / تسوية</h3>
              <p className="text-xs text-gray-500 font-medium">تعديل كميات متعددة دفعة واحدة</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* 1. Batch Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-white border-b border-gray-200 shadow-sm z-10">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                المخزن المعني بالجرد
              </label>
              <select
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(Number(e.target.value))}
                disabled={batchItems.length > 0} // Lock warehouse if items added
              >
                <option value="">اختر المخزن...</option>
                {warehouses?.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                مرجع ورقي / ملاحظة عامة
              </label>
              <input
                type="text"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                placeholder="مثال: جرد سنوي 2024 / رقم 101"
                value={referenceNote}
                onChange={(e) => setReferenceNote(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex-1 text-center">
                <span className="text-xs text-indigo-500 font-bold">عدد الأصناف في الجلسة</span>
                <div className="font-black text-2xl text-indigo-700">{batchItems.length}</div>
              </div>
            </div>
          </div>

          {/* 2. Input Area */}
          <div className="bg-gray-50 p-4 border-b border-gray-200 flex flex-col md:flex-row gap-3 items-end">
            <div className="flex-1 w-full relative">
              <label className="block text-xs font-bold text-gray-500 mb-1.5">
                المنتج (بحث/باركود)
              </label>

              <div className="relative mb-2">
                <ScanBarcode className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Scan Barcode..."
                  className="w-full pr-10 pl-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeScan}
                />
              </div>

              <select
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(Number(e.target.value))}
              >
                <option value="">اختر المنتج يدوياً...</option>
                {products?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-32 text-center">
              <label className="block text-xs font-bold text-gray-400 mb-1">الرصيد الحالي</label>
              <div className="bg-gray-200 py-2.5 rounded-xl font-bold text-gray-600 text-sm">
                {currentLineStock || 0}
              </div>
            </div>

            <div className="w-32">
              <label className="block text-xs font-bold text-gray-500 mb-1.5">الجرد الفعلي</label>
              <input
                type="number"
                onFocus={(e) => e.target.select()}
                min="0"
                className="w-full px-3 py-2.5 bg-white border-2 border-indigo-100 rounded-xl text-center font-black text-indigo-700 outline-none focus:border-indigo-500"
                value={inputActualQty}
                onChange={(e) => setInputActualQty(Number(e.target.value))}
                placeholder="0"
              />
            </div>

            <div className="w-40">
              <label className="block text-xs font-bold text-gray-500 mb-1.5">سبب التعديل</label>
              <select
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl outline-none text-sm"
                value={itemReason}
                onChange={(e) => setItemReason(e.target.value as any)}
              >
                <option value="correction">تصحيح جرد</option>
                <option value="damage">تالف</option>
                <option value="theft">عجز</option>
                <option value="gift">هدايا</option>
              </select>
            </div>

            <button
              onClick={addLineToBatch}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* 3. Items Table */}
          <div className="flex-1 overflow-y-auto bg-white">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-gray-500 font-bold sticky top-0 shadow-sm">
                <tr>
                  <th className="p-3">المنتج</th>
                  <th className="p-3 text-center">السابق</th>
                  <th className="p-3 text-center">الفعلي</th>
                  <th className="p-3 text-center">الفرق</th>
                  <th className="p-3">الأثر المالي</th>
                  <th className="p-3">السبب</th>
                  <th className="p-3 text-center">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {batchItems.map((item) => (
                  <tr key={item.tempId} className="hover:bg-gray-50">
                    <td className="p-3 font-bold text-gray-800">{item.productName}</td>
                    <td className="p-3 text-center text-gray-500">{item.currentStock}</td>
                    <td className="p-3 text-center font-bold bg-gray-50/50">{item.actualStock}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          item.type === 'increase'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {item.type === 'increase' ? '+' : '-'}
                        {item.difference}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-gray-700">
                      {formatCurrency(item.totalValueImpact)}
                    </td>
                    <td className="p-3 text-xs text-gray-500">
                      {getReasonConfig(item.reason).label}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => removeBatchItem(item.tempId)}
                        className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {batchItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-gray-400">
                      لم يتم إضافة أصناف بعد. ابدأ بإدخال المنتجات أعلاه.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 4. Footer Summary & Action */}
          <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
            <div className="flex gap-6">
              <div>
                <p className="text-xs text-green-600 font-bold uppercase">إجمالي الزيادة</p>
                <p className="text-lg font-black text-green-700">
                  {formatCurrency(batchTotals.totalGain)}
                </p>
              </div>
              <div>
                <p className="text-xs text-red-600 font-bold uppercase">إجمالي العجز</p>
                <p className="text-lg font-black text-red-700">
                  {formatCurrency(batchTotals.totalLoss)}
                </p>
              </div>
              <div className="pl-6 border-l border-gray-300">
                <p className="text-xs text-gray-500 font-bold uppercase">صافي الأثر المالي</p>
                <p
                  className={`text-xl font-black ${
                    batchTotals.netValue >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(batchTotals.netValue)}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="px-6 py-3 border border-gray-300 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveBatch}
                disabled={batchItems.length === 0}
                className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                حفظ واعتماد الجرد
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewAdjustmentModal;
