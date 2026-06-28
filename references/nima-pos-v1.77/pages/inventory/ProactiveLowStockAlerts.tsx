import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { AlertOctagon, TrendingDown, EyeOff, ShoppingCart, Info, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProactiveLowStockAlerts() {
  const navigate = useNavigate();
  const products = useLiveQuery(() => db.products.toArray()) || [];
  
  const [hiddenItems, setHiddenItems] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  // Find products that are below their alert threshold
  const lowStockItems = useMemo(() => {
      return products.filter(p => {
          if (hiddenItems.has(p.id!)) return false;
          if (p.type === 'service') return false; // Services don't have stock
          const threshold = p.alertThreshold || 0;
          const currentStock = p.stock || 0;
          return currentStock <= threshold;
      });
  }, [products, hiddenItems]);

  const handleHide = (id: number) => {
      setHiddenItems(prev => new Set(prev).add(id));
  };

  const handleCreateBulkPO = async () => {
      if (lowStockItems.length === 0) return;
      setIsProcessing(true);
      
      try {
          // Typically we would aggregate these into a Purchase Request or Draft PO.
          // For now, let's create a Purchase Request and redirect to it.
          const reqId = await db.purchaseRequests.add({
              requestNumber: `PR-${Date.now()}`,
              date: new Date(),
              requestedBy: 1, // System or Admin User ID
              items: lowStockItems.map(p => ({
                  productId: p.id!,
                  name: p.name,
                  quantity: (p.alertThreshold || 10) * 2, // Recommend buying twice the threshold
                  price: p.costPrice || 0
              })) as any,
              status: 'pending',
              createdAt: new Date(),
              updatedAt: new Date()
          });
          
          navigate('/purchase-requests');
      } catch (err) {
          console.error(err);
      } finally {
          setIsProcessing(false);
      }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <AlertOctagon className="text-red-500" />
            نظام التنبيه الاستباقي بنقص المخزون
          </h1>
          <p className="text-slate-500 text-sm mt-1">تتبع ذكي للمخزون أسفل مستوى الأمان وإنشاء أوامر شراء سريعة (Auto-Replenish).</p>
        </div>
        
        <button
            onClick={handleCreateBulkPO}
            disabled={lowStockItems.length === 0 || isProcessing}
            className={`px-6 py-2.5 rounded-xl font-bold shadow-sm flex items-center gap-2 transition ${
                lowStockItems.length === 0 || isProcessing 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-md'
            }`}
        >
            {isProcessing ? <Loader className="animate-spin" size={20} /> : <ShoppingCart size={20} />}
            إنشاء أمر شراء لهذه النواقص (Create PO)
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-blue-800">
          <Info className="shrink-0 text-blue-600" />
          <p className="text-sm">هذه الشاشة تعرض لك بناءً على حد التنبيه لكل منتج ما الذي قارب على النفاد. عندما تضغط على "إنشاء أمر شراء"، سيقوم النظام بإنشاء طلب شراء لجميع العوامل المعروضة هنا وبكمية مضاعفة لحد التنبيه الخاص بها مباشرة!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {lowStockItems.length === 0 ? (
              <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                  <TrendingDown className="w-16 h-16 mx-auto mb-4 text-emerald-400 opacity-50" />
                  <h3 className="text-xl font-bold text-slate-800 mb-2">المخزون في أمان تام</h3>
                  <p className="text-slate-500">لا يوجد أي منتج وصل لخط الخطر أو حد التنبيه.</p>
              </div>
          ) : (
              lowStockItems.map(item => {
                  const stock = item.stock || 0;
                  const threshold = item.alertThreshold || 0;
                  const percent = threshold > 0 ? (stock / threshold) * 100 : 0;
                  
                  return (
                      <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-red-100 relative overflow-hidden group">
                          {percent <= 0 ? (
                              <div className="absolute top-0 right-0 w-2 h-full bg-red-600"></div>
                          ) : (
                              <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
                          )}
                          
                          <div className="flex justify-between items-start mb-3">
                              <h3 className="font-bold text-slate-800 text-lg leading-tight">{item.name}</h3>
                              <button title="إخفاء من التنبيهات" onClick={() => handleHide(item.id!)} className="text-slate-300 hover:text-slate-500 transition-colors">
                                  <EyeOff size={16} />
                              </button>
                          </div>
                          
                          <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded mb-4 inline-block">
                              {item.category}
                          </span>

                          <div className="flex items-end justify-between mt-4">
                              <div>
                                  <p className="text-xs text-slate-500 mb-1">المخزون الفعلي</p>
                                  <p className={`text-2xl font-black ${percent <= 0 ? 'text-red-600' : 'text-amber-600'}`}>
                                      {stock}
                                  </p>
                              </div>
                              <div className="text-left">
                                  <p className="text-xs text-slate-500 mb-1">حد الأمان (التنبيه)</p>
                                  <p className="text-slate-700 font-bold">{threshold}</p>
                              </div>
                          </div>
                          
                          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4 overflow-hidden">
                              <div 
                                className={`h-1.5 rounded-full ${percent <= 0 ? 'bg-red-600' : 'bg-amber-500'}`} 
                                style={{ width: `${Math.min(100, Math.max(5, percent))}%` }}
                              ></div>
                          </div>
                      </div>
                  );
              })
          )}
      </div>
    </div>
  );
}
