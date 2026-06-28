import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Activity, TrendingUp, TrendingDown, Layers, DollarSign, PackageOpen, Calendar } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from 'recharts';

export const InventoryTurnoverDashboard: React.FC = () => {
  const products = useLiveQuery(() => db.products.toArray());
  const inventory = useLiveQuery(() => db.inventory.toArray());
  const salesOrders = useLiveQuery(() => db.orders.toArray());
  const [period, setPeriod] = useState<number>(30); // 30 days default

  const turnoverMetrics = useMemo(() => {
     if (!products || !inventory || !salesOrders) return [];

     const now = new Date();
     const startDate = new Date();
     startDate.setDate(now.getDate() - period);

     const productSalesQty: Record<number, number> = {};
     
     salesOrders.forEach(order => {
         const orderDate = new Date(order.date);
         if (orderDate >= startDate && (order.status === 'completed' || order.status === 'partial_refund')) {
             order.items.forEach(item => {
                 productSalesQty[item.productId] = (productSalesQty[item.productId] || 0) + item.quantity;
             });
         }
     });

     const metrics = products.map(product => {
         const qtySold = productSalesQty[product.id!] || 0;
         const currentStock = product.stock || 0;
         const cost = product.costPrice || (product.price * 0.7); // Fallback estimate if no cost
         
         const cogs = qtySold * cost;
         const avgInventoryValue = currentStock * cost;

         // Turnover Ratio = COGS / Avg Inventory
         const turnoverRatio = avgInventoryValue > 0 ? (cogs / avgInventoryValue) : 0;
         const dsi = turnoverRatio > 0 ? (365 / turnoverRatio) : 365; // Max 365 for display

         return {
             id: product.id!,
             name: product.name,
             cogs,
             avgInventoryValue,
             turnoverRatio,
             dsi,
             qtySold,
             currentStock
         };
     });

     // Sort by Turnover Ratio descending (Fast movers first)
     return metrics.sort((a,b) => b.turnoverRatio - a.turnoverRatio);
  }, [products, inventory, salesOrders, period]);

  const topMovers = turnoverMetrics.slice(0, 5);
  const slowMovers = [...turnoverMetrics].sort((a,b) => a.turnoverRatio - b.turnoverRatio).slice(0, 5).filter(m => m.qtySold > 0 || m.currentStock > 0);

  const totalCOGS = turnoverMetrics.reduce((sum, item) => sum + item.cogs, 0);
  const totalAvgInventory = turnoverMetrics.reduce((sum, item) => sum + item.avgInventoryValue, 0);
  const overallTurnover = totalAvgInventory > 0 ? (totalCOGS / totalAvgInventory) : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Activity className="text-indigo-500" />
            تتبع معدل دوران المخزون
          </h2>
          <p className="text-slate-600">تحليل كفاءة تحويل المخزون إلى مبيعات (Inventory Turnover Ratio)</p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-1 shadow-sm w-fit">
          <Calendar size={18} className="text-slate-400 mr-2" />
          <select 
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="bg-transparent border-none text-sm font-semibold text-slate-700 outline-none p-1 cursor-pointer"
          >
              <option value="30">آخر 30 يوم</option>
              <option value="90">آخر 90 يوم</option>
              <option value="180">آخر 6 أشهر</option>
              <option value="365">آخر سنة</option>
              <option value="9999">كل الأوقات</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-indigo-50 border border-indigo-200 p-6 rounded-2xl">
           <div className="text-indigo-700 font-bold mb-1 flex items-center gap-2"><Layers size={18}/> معدل الدوران العام للمخزون</div>
           <p className="text-4xl font-black text-indigo-900">{overallTurnover.toFixed(2)}<span className="text-lg text-indigo-500 font-normal ml-1">مرة</span></p>
           <p className="text-sm text-indigo-600 mt-2">يعبر عن عدد مرات بيع المخزون واستبداله في الفترة الحالية.</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl">
           <div className="text-emerald-700 font-bold mb-1 flex items-center gap-2"><DollarSign size={18}/> تكلفة البضاعة المباعة (COGS)</div>
           <p className="text-3xl font-black text-emerald-900">{totalCOGS.toLocaleString()} د.ع.</p>
           <p className="text-sm text-emerald-600 mt-2">إجمالي تكلفة المبيعات المحققة.</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl">
           <div className="text-amber-700 font-bold mb-1 flex items-center gap-2"><PackageOpen size={18}/> قيمة المخزون الحالي (Avg)</div>
           <p className="text-3xl font-black text-amber-900">{totalAvgInventory.toLocaleString()} د.ع.</p>
           <p className="text-sm text-amber-600 mt-2">متوسط التكلفة الاستثمارية المجمدة في المستودعات.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="text-emerald-500" />
                  أسرع المنتجات دوراناً (شديدة الطلب)
              </h3>
              <div className="space-y-4">
                  {topMovers.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-colors">
                          <div>
                              <p className="font-bold text-slate-800">{item.name}</p>
                              <div className="flex gap-4 text-xs text-slate-500 mt-1">
                                  <span>مباع: {item.qtySold}</span>
                                  <span>مخزن: {item.currentStock}</span>
                              </div>
                          </div>
                          <div className="text-left">
                              <p className="font-black text-emerald-600 text-lg">{item.turnoverRatio.toFixed(1)}x</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <TrendingDown className="text-red-500" />
                  أبطأ المنتجات دوراناً (المخزون الراكد)
              </h3>
              <div className="space-y-4">
                  {slowMovers.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-colors">
                          <div>
                              <p className="font-bold text-slate-800">{item.name}</p>
                              <div className="flex gap-4 text-xs text-slate-500 mt-1">
                                  <span>مباع: {item.qtySold}</span>
                                  <span>مخزن: {item.currentStock}</span>
                              </div>
                          </div>
                          <div className="text-left">
                              <p className="font-black text-red-600 text-lg">{item.turnoverRatio.toFixed(2)}x</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>

    </div>
  );
};
