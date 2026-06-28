import React from 'react';
import { DollarSign, Tags, AlertOctagon, Coins, TrendingUp, Layers } from 'lucide-react';

interface ProductsTabProps {
  productStats: {
    profitable: any[];
    topSelling: any[];
    deadStock: any[];
  };
  valuation?: {
    totalCostValue: number;
    totalSaleValue: number;
    expectedProfit: number;
    itemCount: number;
  };
  formatCurrency: (amount: number) => string;
}

const ProductsTab: React.FC<ProductsTabProps> = ({ productStats, valuation, formatCurrency }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      
      {/* تقرير تقييم المخزن الحالي (Inventory Valuation Report) */}
      {valuation && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" />
              <div>
                <h3 className="font-bold text-slate-800">تقرير تقييم المخزون الحالي (Inventory Valuation)</h3>
                <p className="text-xs text-slate-400">إحصاء كلي لقيمة السلع والمواد المتوفرة بالمعرض والمخازن</p>
              </div>
            </div>
            <span className="bg-indigo-50 text-indigo-700 px-3.5 py-1 text-xs font-extrabold rounded-full border border-indigo-150">
              عدد السلع الفريدة: {valuation.itemCount} صنف
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Value at Cost/Purchase */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
              <span className="text-xs font-bold text-slate-400 block">تقييم المخزن بسعر الشراء (الكلفة)</span>
              <p className="text-2xl font-extrabold text-slate-800 font-sans">{formatCurrency(valuation.totalCostValue)}</p>
              <span className="text-[10px] text-slate-500 block">قيمة رأس المال الفعلي المستثمر بالبضاعة</span>
            </div>

            {/* Value at Sale */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
              <span className="text-xs font-bold text-slate-400 block">تقييم المخزن بسعر البيع (التجزئة)</span>
              <p className="text-2xl font-extrabold text-indigo-600 font-sans">{formatCurrency(valuation.totalSaleValue)}</p>
              <span className="text-[10px] text-slate-500 block">الإيراد المتوقع عند بيع وتصريف كامل البضاعة</span>
            </div>

            {/* Expected Profit */}
            <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-indigo-900 block">إجمالي الأرباح المتوقعة من البيع</span>
                <TrendingUp className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-2xl font-extrabold text-indigo-600 font-sans">{formatCurrency(valuation.expectedProfit)}</p>
              <span className="text-[10px] text-indigo-500 block">العائد الربحي المتوقع الكلي (سعر البيع - الكلفة)</span>
            </div>
          </div>
        </div>
      )}

      {/* Top vs Profitable Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Profitable */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-slate-800">الأعلى ربحية (صافي ربح)</h3>
          </div>
          <div className="p-4">
            {productStats.profitable.map((p, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl mb-1">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-400 w-4">{idx + 1}</span>
                  <span className="font-bold text-slate-700">{p.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600">{formatCurrency(p.profit)}</p>
                  <p className="text-[10px] text-slate-400">ربح محقق</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling Qty */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-2">
            <Tags className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-slate-800">الأكثر مبيعاً (كمية)</h3>
          </div>
          <div className="p-4">
            {productStats.topSelling.map((p, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl mb-1">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-400 w-4">{idx + 1}</span>
                  <span className="font-bold text-slate-700">{p.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">{p.qty} قطعة</p>
                  <p className="text-[10px] text-slate-400">كمية مباعة</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dead Stock Report */}
      <div className="bg-white rounded-3xl shadow-sm border border-red-100 overflow-hidden">
        <div className="p-6 border-b border-red-50 bg-red-50/30 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="font-bold text-slate-800">المخزون الراكد (Dead Stock)</h3>
              <p className="text-xs text-slate-500">منتجات متوفرة بالمخزن ولم تبع قط خلال الفترة المحددة</p>
            </div>
          </div>
          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">{productStats.deadStock.length} صنف</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-4">المنتج</th>
                <th className="px-6 py-4">المخزن الحالي</th>
                <th className="px-6 py-4">قيمة رأس المال المجمد</th>
                <th className="px-6 py-4">التوصية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productStats.deadStock.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-slate-700">{p.name}</td>
                  <td className="px-6 py-4 text-slate-600">{p.stock}</td>
                  <td className="px-6 py-4 font-bold text-red-600">{formatCurrency(p.value)}</td>
                  <td className="px-6 py-4">
                    <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs border border-orange-200">عمل عرض ترويجي</span>
                  </td>
                </tr>
              ))}
              {productStats.deadStock.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-slate-400">ممتاز! لا يوجد مخزون راكد في هذه الفترة.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductsTab;
