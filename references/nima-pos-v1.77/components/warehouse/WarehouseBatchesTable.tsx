import React from 'react';
import { CalendarDays } from 'lucide-react';

interface WarehouseBatchesTableProps {
  warehouseBatches: any[] | undefined;
}

const WarehouseBatchesTable: React.FC<WarehouseBatchesTableProps> = ({ warehouseBatches }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-orange-50/50">
        <h3 className="font-black text-orange-800 flex items-center gap-2">
          <CalendarDays className="w-5 h-5" />
          متابعة الصلاحية والدفعات
        </h3>
        <p className="text-sm text-orange-600/80 mt-1 font-medium">
          تتبع تواريخ انتهاء الصلاحية للمنتجات في هذا المخزن
        </p>
      </div>
      <table className="w-full text-right text-sm">
        <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200">
          <tr>
            <th className="px-6 py-5">المنتج</th>
            <th className="px-6 py-5">الكمية في الدفعة</th>
            <th className="px-6 py-5">تاريخ الاستلام</th>
            <th className="px-6 py-5">تاريخ الانتهاء</th>
            <th className="px-6 py-5">الحالة</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {warehouseBatches?.map((batch) => {
            const today = new Date();
            const expiry = batch.expiryDate ? new Date(batch.expiryDate) : null;
            const daysLeft = expiry
              ? Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              : 9999;

            let statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            let statusText = 'صالح';

            if (daysLeft < 0) {
              statusColor = 'bg-red-50 text-red-700 border-red-200';
              statusText = 'منتهي الصلاحية';
            } else if (daysLeft < 30) {
              statusColor = 'bg-orange-50 text-orange-700 border-orange-200';
              statusText = `ينتهي خلال ${daysLeft} يوم`;
            }

            return (
              <tr key={batch.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{batch.productName}</td>
                <td className="px-6 py-4 font-black text-slate-700 text-base">{batch.quantity}</td>
                <td className="px-6 py-4 text-slate-500 font-medium">
                  {new Date(batch.receivedDate).toLocaleDateString('ar-EG')}
                </td>
                <td className="px-6 py-4 font-bold text-slate-800">
                  {expiry ? expiry.toLocaleDateString('ar-EG') : '---'}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${statusColor}`}
                  >
                    {statusText}
                  </span>
                </td>
              </tr>
            );
          })}
          {warehouseBatches?.length === 0 && (
            <tr>
              <td colSpan={5} className="py-16 text-center text-slate-500 font-medium">
                لا توجد دفعات مسجلة في هذا المخزن
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default WarehouseBatchesTable;
