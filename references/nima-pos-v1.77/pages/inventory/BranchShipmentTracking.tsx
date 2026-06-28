import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Truck, ArrowRight, ArrowLeftRight, CheckCircle, PackageSearch, AlertTriangle, XCircle } from 'lucide-react';
import { BranchTransfer } from '../../types';

export const BranchShipmentTracking: React.FC = () => {
  const transfers = useLiveQuery(() => db.branchTransfers.reverse().sortBy('date'));
  const warehouses = useLiveQuery(() => db.warehouses.toArray());
  const [isProcessing, setIsProcessing] = useState(false);

  const activeShipments = transfers?.filter(t => t.status === 'in_transit') || [];
  const recentShipments = transfers?.filter(t => t.status === 'completed' || t.status === 'pending') || [];

  const getWarehouseName = (id: number) => warehouses?.find(w => w.id === id)?.name || 'غير معروف';

  const calculateTotalQuantity = (items: any[]) => items.reduce((acc, curr) => acc + curr.quantity, 0);

  const handleStatusChange = async (transfer: BranchTransfer, newStatus: 'completed' | 'cancelled') => {
      if (!window.confirm(`هل أنت متأكد من تغيير حالة الشحنة إلى: ${newStatus === 'completed' ? 'تم الاستلام' : 'ملغي (إرجاع)'}؟`)) return;

      setIsProcessing(true);
      try {
          if (newStatus === 'completed') {
              await (db as any).transaction('rw', db.inventory, db.branchTransfers, db.stockAdjustments, async () => {
                for (const item of transfer.items) {
                   const destItem = await db.inventory.where({ warehouseId: transfer.destinationWarehouseId, productId: item.productId }).first();
                   if (destItem) {
                       await db.inventory.update(destItem.id!, { quantity: destItem.quantity + item.quantity });
                   } else {
                       await db.inventory.add({ warehouseId: transfer.destinationWarehouseId, productId: item.productId, quantity: item.quantity });
                   }

                   await db.stockAdjustments.add({
                       productId: item.productId,
                       productName: item.productName,
                       type: 'increase',
                       quantity: item.quantity,
                       reason: 'other',
                       date: new Date(),
                       notes: `استلام تحويل وارد من مسار التتبع (رقم التحويل: ${transfer.id})`,
                       warehouseId: transfer.destinationWarehouseId,
                       warehouseName: getWarehouseName(transfer.destinationWarehouseId)
                   });
                }
                await db.branchTransfers.update(transfer.id!, { status: newStatus });
              });
              alert('تم استلام الشحنة وتحديث رصيد الوجهة بنجاح.');
          } else if (newStatus === 'cancelled') {
              await (db as any).transaction('rw', db.inventory, db.branchTransfers, db.stockAdjustments, async () => {
                for (const item of transfer.items) {
                   const sourceItem = await db.inventory.where({ warehouseId: transfer.sourceWarehouseId, productId: item.productId }).first();
                   if (sourceItem) {
                       await db.inventory.update(sourceItem.id!, { quantity: sourceItem.quantity + item.quantity });
                   } else {
                       await db.inventory.add({ warehouseId: transfer.sourceWarehouseId, productId: item.productId, quantity: item.quantity });
                   }

                   await db.stockAdjustments.add({
                       productId: item.productId,
                       productName: item.productName,
                       type: 'increase',
                       quantity: item.quantity,
                       reason: 'correction',
                       date: new Date(),
                       notes: `إرجاع مواد شحنة ملغاة من مسار التتبع (رقم التحويل: ${transfer.id})`,
                       warehouseId: transfer.sourceWarehouseId,
                       warehouseName: getWarehouseName(transfer.sourceWarehouseId)
                   });
                }
                await db.branchTransfers.update(transfer.id!, { status: newStatus });
              });
              alert('تم إلغاء الشحنة وإرجاع المواد للمصدر بنجاح.');
          }
      } catch (error: any) {
          console.error("Action failed", error);
          alert(error.message || 'حدث خطأ أثناء تنفيذ العملية.');
      } finally {
          setIsProcessing(false);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Truck className="text-blue-500" />
            تتبع الشحنات المتبادلة
          </h2>
          <p className="text-slate-600">تتبع ومراقبة الشحنات المنقولة بين الفروع والمستودعات</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                <Truck size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">الشحنات قيد النقل</p>
                <h3 className="text-2xl font-bold text-slate-800">{activeShipments.length}</h3>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">تم الاستلام (مؤخراً)</p>
                <h3 className="text-2xl font-bold text-slate-800">{recentShipments.filter(s => s.status === 'completed').length}</h3>
              </div>
            </div>
          </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <PackageSearch className="text-slate-500" />
            الشحنات المتحركة حالياً (قيد النقل)
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
          {activeShipments.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Truck size={48} className="mx-auto text-slate-300 mb-4" />
              <p>لا توجد شحنات قيد النقل حالياً.</p>
            </div>
          ) : (
            activeShipments.map(shipment => (
              <div key={shipment.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                           TR{shipment.id}
                        </div>
                        <div>
                            <p className="font-medium text-slate-800">
                                توجيه شحنة نقل بضائع
                            </p>
                            <p className="text-sm text-slate-500">
                                {format(new Date(shipment.date), 'dd MMMM yyyy - hh:mm a', { locale: ar })}
                            </p>
                        </div>
                    </div>
                    <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold animate-pulse">
                        الشاحنة في الطريق
                    </div>
                </div>

                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-4">
                    <div className="flex items-center justify-between relative">
                        {/* Source */}
                        <div className="text-center z-10 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                            <p className="text-xs text-slate-500 mb-1">المصدر</p>
                            <p className="font-bold text-slate-800">{getWarehouseName(shipment.sourceWarehouseId)}</p>
                        </div>
                        
                        {/* Path Line */}
                        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-blue-200 -z-0">
                            <div className="h-full bg-blue-500 w-1/2 animate-pulse absolute left-1/4 rounded-full"></div>
                        </div>

                        {/* Destination */}
                        <div className="text-center z-10 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                            <p className="text-xs text-slate-500 mb-1">الوجهة (الاستلام)</p>
                            <p className="font-bold text-slate-800">{getWarehouseName(shipment.destinationWarehouseId)}</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center text-sm text-slate-600 mt-4 border-t border-slate-100 pt-4">
                    <div className="flex gap-4">
                       <div className="flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                           <span className="font-semibold text-slate-800">{shipment.items.length}</span> أصناف
                       </div>
                       <div className="flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                           <span className="font-semibold text-slate-800">{calculateTotalQuantity(shipment.items)}</span> كمية إجمالية
                       </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            disabled={isProcessing}
                            onClick={() => handleStatusChange(shipment as BranchTransfer, 'completed')}
                            className="flex items-center gap-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors text-xs font-bold disabled:opacity-50"
                        >
                            <CheckCircle size={14} /> استلام الشحنة
                        </button>
                        <button 
                            disabled={isProcessing}
                            onClick={() => handleStatusChange(shipment as BranchTransfer, 'cancelled')}
                            className="flex items-center gap-1 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 transition-colors text-xs font-bold disabled:opacity-50"
                        >
                            <XCircle size={14} /> إلغاء وإرجاع 
                        </button>
                    </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
