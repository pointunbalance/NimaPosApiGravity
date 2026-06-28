import React from 'react';
import { Phone, MoreVertical, Package, Receipt, Users } from 'lucide-react';
import { User, Order } from '../../types';

interface CouriersListProps {
  couriers: User[];
  deliveries: Order[];
  getCourierStatusBadge: (isActive: boolean) => React.ReactNode;
  onSettleCourier?: (courierId: number, amount: number) => void;
}

const CouriersList: React.FC<CouriersListProps> = ({ couriers, deliveries, getCourierStatusBadge, onSettleCourier }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-right border-collapse">
        <thead className="bg-slate-50/80 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">المندوب</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">رقم الجوال</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الحالة</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الطلبات النشطة</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">عمولة التوصيل</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">المبالغ المحصلة (كاش)</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">إجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {couriers.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                <div className="flex flex-col items-center justify-center gap-3">
                  <Users className="w-12 h-12 text-slate-300" />
                  <p>لا يوجد مندوبين لتهيئة حالتهم حالياً</p>
                </div>
              </td>
            </tr>
          ) : (
            couriers.map((courier) => {
              const courierDeliveries = deliveries.filter(d => d.courierId === courier.id);
              const activeOrders = courierDeliveries.filter(d => d.fulfillmentStatus === 'ready').length;
              const collectedAmount = courierDeliveries
                .filter(d => d.fulfillmentStatus === 'served' && d.paymentMethod === 'cash' && !d.courierSettled)
                .reduce((sum, d) => sum + d.totalAmount, 0);
              const deliveryEarnings = courierDeliveries
                .filter(d => d.fulfillmentStatus === 'served' && !d.courierSettled)
                .reduce((sum, d) => sum + (d.deliveryFee || 0), 0);

              return (
                <tr key={courier.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-black text-lg">
                        {courier.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm mb-0.5">{courier.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">C-{courier.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 bg-slate-50 w-fit px-2 py-1 rounded-md border border-slate-100">
                      <Phone className="w-3.5 h-3.5 text-indigo-400" /> 
                      <span dir="ltr" className="font-medium text-slate-600">{courier.phone || 'غير مسجل'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getCourierStatusBadge(courier.isActive)}
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-slate-400" />
                      <span className="font-bold text-slate-700 text-sm">{activeOrders}</span>
                      <span className="text-xs text-slate-400 font-medium">طلبات</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-1.5">
                      <span className="font-black text-indigo-600">{deliveryEarnings.toFixed(2)}</span>
                      <span className="text-xs text-slate-500 font-medium font-sans">﷼</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-emerald-500" />
                      <span className="font-black text-slate-800">{collectedAmount.toFixed(2)}</span>
                      <span className="text-xs text-slate-500 font-medium font-sans">﷼</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <button 
                         className="px-4 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                         onClick={() => onSettleCourier && onSettleCourier(courier.id!, collectedAmount)}
                         disabled={collectedAmount === 0}
                       >
                        تصفية حساب
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors ring-1 ring-transparent hover:ring-indigo-100 opacity-0 group-hover:opacity-100 focus:opacity-100 outline-none w-fit shrink-0">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CouriersList;
