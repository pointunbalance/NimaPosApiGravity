import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { format, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { CalendarX, AlertTriangle, ShieldCheck, Box, Skull, Trash2 } from 'lucide-react';

export const ProductExpiryManagement: React.FC = () => {
  const batches = useLiveQuery(() => db.batches.toArray());
  const products = useLiveQuery(() => db.products.toArray());
  const warehouses = useLiveQuery(() => db.warehouses.toArray());
  const [isProcessing, setIsProcessing] = useState(false);

  const getProductName = (id: number) => products?.find(p => p.id === id)?.name || 'غير معروف';
  const getWarehouseName = (id: number) => warehouses?.find(w => w.id === id)?.name || 'غير معروف';

  const processedBatches = useMemo(() => {
     if (!batches || !products || !warehouses) return { expired: [], expiringSoon: [], safe: [] };

     const now = new Date();
     const withExpiry = batches.filter(b => b.expiryDate && b.quantity > 0).map(b => {
         const daysLeft = differenceInDays(new Date(b.expiryDate!), now);
         let status: 'expired' | 'expiringSoon' | 'safe' = 'safe';
         
         if (daysLeft < 0) status = 'expired';
         else if (daysLeft <= 30) status = 'expiringSoon';

         return {
             ...b,
             daysLeft,
             status
         };
     });

     return {
         expired: withExpiry.filter(b => b.status === 'expired'),
         expiringSoon: withExpiry.filter(b => b.status === 'expiringSoon').sort((a,b) => a.daysLeft - b.daysLeft),
         safe: withExpiry.filter(b => b.status === 'safe').sort((a,b) => a.daysLeft - b.daysLeft)
     };
  }, [batches, products, warehouses]);

  const handleScrapBatch = async (batch: any) => {
      if (!window.confirm(`هل أنت متأكد من إتلاف التشغيلة "${batch.batchNumber || batch.id}"؟ سيتم خصم الكمية (${batch.quantity}) من المخزون.`)) {
          return;
      }

      setIsProcessing(true);
      try {
          await (db as any).transaction('rw', db.batches, db.inventory, db.stockAdjustments, async () => {
              // 1. Zero out batch quantity
              await db.batches.update(batch.id, { quantity: 0 });

              // 2. Deduct from general inventory
              const inventoryItem = await db.inventory.where({ warehouseId: batch.warehouseId, productId: batch.productId }).first();
              if (inventoryItem) {
                  await db.inventory.update(inventoryItem.id!, { 
                      quantity: Math.max(0, inventoryItem.quantity - batch.quantity) 
                  });
              }

              // 3. Log stock adjustment
              await db.stockAdjustments.add({
                  productId: batch.productId,
                  productName: getProductName(batch.productId),
                  type: 'decrease',
                  quantity: batch.quantity,
                  reason: 'damage',
                  date: new Date(),
                  notes: `إتلاف تشغيلة منتهية الصلاحية. رقم التشغيلة: ${batch.batchNumber || batch.id}. تاريخ الانتهاء: ${format(new Date(batch.expiryDate!), 'yyyy-MM-dd')}`,
                  warehouseId: batch.warehouseId,
                  warehouseName: getWarehouseName(batch.warehouseId)
              });
          });
          alert('تم إتلاف التشغيلة وتسوية المخزون بنجاح.');
      } catch (error) {
          console.error("Failed to scrap batch", error);
          alert('حدث خطأ أثناء محاولة إتلاف التشغيلة.');
      } finally {
          setIsProcessing(false);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarX className="text-red-500" />
            إدارة تاريخ صلاحية المنتجات
          </h2>
          <p className="text-slate-600">تتبع تواريخ الصلاحية التشغيلية للمواد والمنتجات لتجنب الهدر</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl">
           <div className="flex items-center gap-3 text-red-600 mb-2">
               <Skull size={24} />
               <h3 className="font-bold text-lg">منتهية الصلاحية</h3>
           </div>
           <p className="text-3xl font-black text-red-700">{processedBatches.expired.length}</p>
           <p className="text-sm text-red-500 mt-1">تشغيلة يجب إتلافها</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl">
           <div className="flex items-center gap-3 text-amber-600 mb-2">
               <AlertTriangle size={24} />
               <h3 className="font-bold text-lg">تنتهي قريباً (30 يوم)</h3>
           </div>
           <p className="text-3xl font-black text-amber-700">{processedBatches.expiringSoon.length}</p>
           <p className="text-sm text-amber-500 mt-1">تشغيلة تحتاج ترويج عاجل</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl">
           <div className="flex items-center gap-3 text-emerald-600 mb-2">
               <ShieldCheck size={24} />
               <h3 className="font-bold text-lg">صلاحية آمنة</h3>
           </div>
           <p className="text-3xl font-black text-emerald-700">{processedBatches.safe.length}</p>
           <p className="text-sm text-emerald-500 mt-1">تشغيلة سليمة للتداول</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
         <div className="p-4 border-b border-slate-200 bg-slate-50">
             <h3 className="font-bold text-slate-800">تفاصيل التشغيلات ذات الأولوية (الأقرب للانتهاء)</h3>
         </div>
         <div className="overflow-x-auto">
             <table className="w-full text-right">
                 <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                     <tr>
                         <th className="p-4 font-semibold">الصنف / رقم التشغيلة</th>
                         <th className="p-4 font-semibold">المستودع</th>
                         <th className="p-4 font-semibold">الكمية المتبقية</th>
                         <th className="p-4 font-semibold">تاريخ الانتهاء</th>
                         <th className="p-4 font-semibold">الحالة</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                     {[...processedBatches.expired, ...processedBatches.expiringSoon].map(batch => (
                         <tr key={batch.id} className="hover:bg-slate-50">
                             <td className="p-4">
                                 <div className="font-bold text-slate-800">{getProductName(batch.productId)}</div>
                                 <div className="text-xs text-slate-500 font-mono mt-1">Batch: {batch.batchNumber || `B-${batch.id}`}</div>
                             </td>
                             <td className="p-4 text-slate-600">{getWarehouseName(batch.warehouseId)}</td>
                             <td className="p-4">
                                 <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-lg font-semibold border border-slate-200">
                                     {batch.quantity}
                                 </span>
                             </td>
                             <td className="p-4 font-mono text-slate-600">
                                 {format(new Date(batch.expiryDate!), 'yyyy-MM-dd')}
                             </td>
                             <td className="p-4">
                                 {batch.status === 'expired' ? (
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center gap-1 text-xs font-bold bg-red-100 text-red-600 px-2 py-1 rounded-lg w-fit border border-red-200">
                                            <Skull size={12} /> منتهي منذ {Math.abs(batch.daysLeft)} يوم
                                        </span>
                                        <button 
                                            onClick={() => handleScrapBatch(batch)}
                                            disabled={isProcessing}
                                            className="text-xs flex items-center gap-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                                            title="إتلاف وتسوية الرصيد"
                                        >
                                            <Trash2 size={14} /> إتلاف
                                        </button>
                                    </div>
                                 ) : (
                                    <span className="flex items-center gap-1 text-xs font-bold bg-amber-100 text-amber-600 px-2 py-1 rounded-lg w-fit border border-amber-200">
                                        <AlertTriangle size={12} /> متبقي {batch.daysLeft} يوم
                                    </span>
                                 )}
                             </td>
                         </tr>
                     ))}
                     {processedBatches.expired.length === 0 && processedBatches.expiringSoon.length === 0 && (
                         <tr>
                             <td colSpan={5} className="p-8 text-center text-slate-500">
                                 <ShieldCheck size={48} className="mx-auto text-emerald-400 mb-4 opacity-50" />
                                 <p>المخزون بالكامل في النطاق الآمن للصلاحية.</p>
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
