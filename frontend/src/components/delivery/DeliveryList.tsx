import React, { useState } from 'react';
import { Phone, MapPin, MoreVertical, CheckCircle, Navigation, Clock, Truck } from 'lucide-react';
import { Order, User } from '../../types';

interface DeliveryListProps {
  deliveries: (Order & { customerName: string; customerPhone: string; customerAddress: string })[];
  couriers: User[];
  getStatusBadge: (status?: string) => React.ReactNode;
  onAssignCourier: (orderId: number, courierId: number) => void;
  onUpdateStatus: (orderId: number, status: 'pending' | 'ready' | 'served') => void;
  onViewOrder: (order: Order) => void;
}

const DeliveryList: React.FC<DeliveryListProps> = ({ deliveries, couriers, getStatusBadge, onAssignCourier, onUpdateStatus, onViewOrder }) => {
  const [editingCourier, setEditingCourier] = useState<number | null>(null);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ready': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'served': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-right border-collapse">
        <thead className="bg-slate-50/80 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">رقم التوصيل/الطلب</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">العميل</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">العنوان</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">المندوب</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">المبلغ</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الحالة</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الوقت</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">إجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {deliveries.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-medium">
                <div className="flex flex-col items-center justify-center gap-3">
                  <Truck className="w-12 h-12 text-slate-300" />
                  <p>لا توجد طلبات توصيل متاحة حالياً</p>
                </div>
              </td>
            </tr>
          ) : (
            deliveries.map((delivery) => (
              <tr key={delivery.id} className="hover:bg-indigo-50/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">
                      #{delivery.id}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm">DEL-{delivery.id}</span>
                      <span className="text-[10px] text-slate-400 font-mono">ORD-{delivery.id}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-800 text-sm mb-0.5">{delivery.customerName}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 bg-slate-50 w-fit px-2 py-1 rounded-md border border-slate-100">
                    <Phone className="w-3 h-3 text-indigo-400 pointer-events-none" />
                    <span dir="ltr" className="font-medium text-slate-600">{delivery.customerPhone}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs font-medium text-slate-600 flex items-start gap-1.5 max-w-[200px]">
                    <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span className="truncate leading-relaxed" title={delivery.customerAddress}>{delivery.customerAddress}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {editingCourier === delivery.id ? (
                    <select
                      className="w-full p-2 border border-indigo-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm bg-white font-medium"
                      value={delivery.courierId || ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          onAssignCourier(delivery.id!, Number(e.target.value));
                        }
                        setEditingCourier(null);
                      }}
                      onBlur={() => setEditingCourier(null)}
                      autoFocus
                    >
                      <option value="">اختر المندوب</option>
                      {couriers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div 
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border w-fit cursor-pointer transition-colors ${
                        delivery.courierId 
                          ? 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-700' 
                          : 'bg-indigo-50 border-indigo-100 text-indigo-700 border-dashed hover:bg-indigo-100'
                      }`}
                      onClick={() => setEditingCourier(delivery.id!)}
                    >
                      {delivery.courierId 
                        ? couriers.find(c => c.id === delivery.courierId)?.name || 'مندوب غير معروف'
                        : '+ تعيين مندوب'}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="font-black text-slate-800 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md w-fit border border-emerald-100 text-sm">
                    {delivery.totalAmount.toFixed(2)} ﷼
                  </div>
                </td>
                <td className="px-6 py-4">
                  <select
                    className={`appearance-none px-3 py-1.5 border rounded-full text-xs font-bold outline-none cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition-colors ${getStatusColor(delivery.fulfillmentStatus)}`}
                    value={delivery.fulfillmentStatus || 'pending'}
                    onChange={(e) => onUpdateStatus(delivery.id!, e.target.value as any)}
                  >
                    <option value="pending">⏳ قيد الانتظار</option>
                    <option value="ready">🚚 في الطريق</option>
                    <option value="served">✅ تم التوصيل</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-xs font-bold text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(delivery.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => onViewOrder(delivery)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors ring-1 ring-transparent hover:ring-indigo-100 opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="خيارات إضافية"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DeliveryList;
