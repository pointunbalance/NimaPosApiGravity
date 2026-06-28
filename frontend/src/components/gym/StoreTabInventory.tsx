import React from 'react';
import { Search, ClipboardList, Edit2, Trash2 } from 'lucide-react';
import { StoreItemType } from './storeTypes';

interface StoreTabInventoryProps {
  inventorySearch: string;
  setInventorySearch: (val: string) => void;
  filteredProductsInventory: StoreItemType[];
  onEditProduct: (item: StoreItemType) => void;
  onDeleteProduct: (id: number, name: string) => void;
  currency: string;
}

export const StoreTabInventory: React.FC<StoreTabInventoryProps> = ({
  inventorySearch,
  setInventorySearch,
  filteredProductsInventory,
  onEditProduct,
  onDeleteProduct,
  currency
}) => {
  return (
    <div className="xl:col-span-12 space-y-4 text-right font-sans" dir="rtl">
      
      {/* Search Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between flex-row-reverse">
        <div className="flex items-center gap-1.5 flex-row-reverse text-right">
          <span className="p-1.5 bg-slate-100 text-slate-600 rounded-lg shrink-0">
            <ClipboardList className="w-4.5 h-4.5" />
          </span>
          <h4 className="font-black text-slate-800 text-xs">جرد مستودع وأصناف المتجر والكافيتريا</h4>
        </div>

        <div className="relative flex-1 max-w-sm w-full">
          <Search className="w-4 h-4 absolute right-3 h-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            value={inventorySearch}
            onChange={(e) => setInventorySearch(e.target.value)}
            placeholder="بحث بالاسم، الباركود أو فئة المنتج..." 
            className="w-full pr-10 pl-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-550 text-right text-xs"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto text-[11px] whitespace-nowrap">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="px-4 py-3 font-bold text-slate-700 text-right">مواصفات اسم الصنف الرياضي</th>
                <th className="px-4 py-3 font-bold text-slate-705 text-right">التصنيف والفئة</th>
                <th className="px-4 py-3 font-bold text-slate-707 text-right">رمز باركود المنتج</th>
                <th className="px-4 py-3 font-bold text-slate-709 text-right">سعر البيع المقيد</th>
                <th className="px-4 py-3 font-bold text-slate-705 text-right">المخزون الحالي بمخزن الجيم</th>
                <th className="px-4 py-3 font-bold text-slate-705 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {filteredProductsInventory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-11 text-center font-bold text-slate-450">
                    لم نجد أي مطابقات مخزنية حالياً للاستعلام المدون.
                  </td>
                </tr>
              ) : (
                filteredProductsInventory.map((product) => {
                  const isOutOfStock = product.stock <= 0;
                  const isLowStock = product.stock > 0 && product.stock <= 5;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/40 transition-colors font-semibold text-slate-700">
                      <td className="px-4 py-3.5">
                        <span className="block font-black text-slate-800 text-xs text-right">{product.name}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="bg-slate-100 text-slate-655 px-2 py-0.5 rounded text-[9.5px] font-black">{product.category || 'عام'}</span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-500 text-right">
                        {product.barcode || <span className="text-slate-350 italic">-- غير مسجل --</span>}
                      </td>
                      <td className="px-4 py-3.5 font-sans font-black text-slate-820 text-right">
                        {product.price.toLocaleString()} {currency}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={`inline-block px-2.5 py-1 rounded-xl text-[10px] font-black ${
                          isOutOfStock 
                            ? 'bg-rose-50 border border-rose-100 text-rose-800' 
                            : isLowStock 
                            ? 'bg-amber-50 border border-amber-100 text-amber-905' 
                            : 'bg-emerald-50 border border-emerald-100 text-emerald-800'
                        }`}>
                          {isOutOfStock ? '⚠️ نفذ المخزون (0)' : isLowStock ? `⚠️ شحيح (${product.stock})` : `🔋 متوفر (${product.stock} قطعة)`}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center flex items-center justify-center gap-1.5 pt-4">
                        
                        <button
                          type="button"
                          onClick={() => onEditProduct(product)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-5 focus:outline-none rounded-lg cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteProduct(product.id!, product.name)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 focus:outline-none rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
export default StoreTabInventory;
