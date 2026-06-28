import React, { useState } from 'react';
import { TrendingUp, Search, Play, Package, AlertTriangle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';

export const DemandForecasting: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const forecasts = useLiveQuery(() => db.demandForecasts.toArray()) || [];
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const orders = useLiveQuery(() => db.orders.toArray()) || [];

  const handleRunForecast = async () => {
    setIsGenerating(true);
    try {
      // Simulate Deep Learning / ML processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await db.demandForecasts.clear();

      const now = new Date();
      const month1Ago = new Date(); month1Ago.setDate(now.getDate() - 30);
      const month2Ago = new Date(); month2Ago.setDate(now.getDate() - 60);
      const month3Ago = new Date(); month3Ago.setDate(now.getDate() - 90);
      
      // Filter out orders older than 90 days
      const relevantOrders = orders.filter(o => new Date(o.date) >= month3Ago);
      
      // Group sales by month per product
      const productSalesByMonth: Record<number, { m1: number, m2: number, m3: number }> = {};
      
      products.forEach(p => {
         productSalesByMonth[p.id!] = { m1: 0, m2: 0, m3: 0 };
      });

      relevantOrders.forEach(order => {
        const orderDate = new Date(order.date);
        order.items.forEach(item => {
          if (!productSalesByMonth[item.productId]) return;
          if (orderDate >= month1Ago) {
             productSalesByMonth[item.productId].m1 += item.quantity;
          } else if (orderDate >= month2Ago && orderDate < month1Ago) {
             productSalesByMonth[item.productId].m2 += item.quantity;
          } else {
             productSalesByMonth[item.productId].m3 += item.quantity;
          }
        });
      });

      for (const product of products) {
        const sales = productSalesByMonth[product.id!] || { m1: 0, m2: 0, m3: 0 };
        
        const totalSales = sales.m1 + sales.m2 + sales.m3;
        let expectedDemand = 0;
        let confidenceScore = 0;

        if (totalSales === 0) {
           expectedDemand = 0; // No historical data, zero prediction
           confidenceScore = Math.floor(Math.random() * 20) + 10; // Low confidence
        } else {
           // Weighted Moving Average (WMA): Most recent month has highest weight (0.5), then 0.3, then 0.2
           expectedDemand = Math.floor((sales.m1 * 0.5) + (sales.m2 * 0.3) + (sales.m3 * 0.2));
           
           // Calculate Standard Deviation (Volatility) to adjust safety stock recommendation
           const mean = totalSales / 3;
           const variance = ((Math.pow(sales.m1 - mean, 2) + Math.pow(sales.m2 - mean, 2) + Math.pow(sales.m3 - mean, 2)) / 3);
           const stdDev = Math.sqrt(variance);

           // High volatility = lower confidence, Low volatility = higher confidence
           const coefficientOfVariation = mean > 0 ? (stdDev / mean) : 1;
           confidenceScore = Math.max(40, Math.min(99, Math.floor(100 - (coefficientOfVariation * 40))));

           // Trend analysis: If m1 > m2 > m3, we have an upward trend, boost expected demand slightly
           if (sales.m1 >= sales.m2 && sales.m2 >= sales.m3 && sales.m1 > 0) {
              expectedDemand = Math.floor(expectedDemand * 1.15); // +15% trend factor
           } else if (sales.m1 <= sales.m2 && sales.m2 <= sales.m3) {
              expectedDemand = Math.floor(expectedDemand * 0.85); // -15% trend factor
           }
        }

        await db.demandForecasts.add({
          productId: product.id!,
          expectedDemand: expectedDemand,
          confidenceScore: confidenceScore,
          period: 'الشهر القادم',
          generatedAt: new Date().toISOString()
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const getProductName = (id: number) => {
    return products.find(p => p.id === id)?.name || 'منتج غير معروف';
  };

  const getProductStock = (id: number) => {
    return products.find(p => p.id === id)?.stock || 0;
  };

  const filteredForecasts = forecasts.filter(f => 
    getProductName(f.productId).includes(searchTerm)
  ).sort((a, b) => b.expectedDemand - a.expectedDemand);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">توقعات الطلب (AI)</h1>
            <p className="text-slate-500">تحليل المبيعات التاريخية لتوقع احتياجات المخزون المستقبلية</p>
          </div>
        </div>
        <button 
          onClick={handleRunForecast}
          disabled={isGenerating || products.length === 0}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Play className={`w-5 h-5 ${isGenerating ? 'animate-pulse' : ''}`} />
          <span>{isGenerating ? 'جاري التحليل...' : 'تشغيل نموذج التوقع'}</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ابحث باسم المنتج..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 text-slate-600 font-semibold">المنتج</th>
                <th className="p-4 text-slate-600 font-semibold">المخزون الحالي</th>
                <th className="p-4 text-slate-600 font-semibold">الطلب المتوقع</th>
                <th className="p-4 text-slate-600 font-semibold">الفترة</th>
                <th className="p-4 text-slate-600 font-semibold">مستوى الثقة</th>
                <th className="p-4 text-slate-600 font-semibold">توصية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredForecasts.map((forecast) => {
                const currentStock = getProductStock(forecast.productId);
                const needsRestock = currentStock < forecast.expectedDemand;
                
                return (
                  <tr key={forecast.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-800 flex items-center gap-2">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                        <Package className="w-4 h-4" />
                      </div>
                      {getProductName(forecast.productId)}
                    </td>
                    <td className="p-4 text-slate-600">{currentStock}</td>
                    <td className="p-4 font-bold text-purple-600">{forecast.expectedDemand}</td>
                    <td className="p-4 text-slate-600">{forecast.period}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-slate-200 rounded-full h-2 max-w-[100px]">
                          <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${forecast.confidenceScore}%` }}></div>
                        </div>
                        <span className="text-sm text-slate-600">{forecast.confidenceScore}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {needsRestock ? (
                        <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-4 h-4" /> طلب كمية جديدة
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm flex items-center gap-1 w-fit">
                          مخزون كافٍ
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredForecasts.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    {products.length === 0 ? 'يرجى إضافة منتجات أولاً.' : 'لم يتم تشغيل نموذج التوقع بعد. اضغط على "تشغيل نموذج التوقع" للبدء.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
